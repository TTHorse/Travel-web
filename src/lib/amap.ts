import type {
  AmapInputTip,
  AmapInputTipsResponse,
  AmapPOISearchResponse,
  SearchResult,
} from "@/types/amap";

const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_WEB_KEY ?? "";
const BASE_URL = "https://restapi.amap.com/v3";

/**
 * 解析 Amap tip 中的坐标，失败返回 null
 */
function parseLocation(location: string): { lng: number; lat: number } | null {
  if (typeof location !== "string" || !location.trim()) return null;
  const parts = location.split(",");
  if (parts.length !== 2) return null;
  const lng = Number(parts[0]);
  const lat = Number(parts[1]);
  if (isNaN(lng) || isNaN(lat)) return null;
  return { lng, lat };
}

/**
 * 将 Amap tip 数组转为统一 SearchResult[]
 * 行政区域（城市/区县等）没有 location 字段，坐标填 0，由调用方按需做地理编码回退
 */
function tipsToResults(tips: AmapInputTip[]): SearchResult[] {
  return tips.map((tip) => {
    const loc = parseLocation(tip.location);
    return {
      id: tip.id || tip.name,
      name: tip.name,
      longitude: loc?.lng ?? 0,
      latitude: loc?.lat ?? 0,
      address: tip.address || "",
      district: tip.district || "",
      adcode: tip.adcode || "",
      typecode: tip.typecode || "",
    };
  });
}

/**
 * 输入提示 API — 用于搜索框下拉建议
 * 优先通过服务端代理（/api/amap/inputtips）调用，避免浏览器 CORS 问题
 * 文档：https://lbs.amap.com/api/webservice/guide/api/inputtips
 */
export async function fetchInputTips(keyword: string): Promise<SearchResult[]> {
  if (!keyword.trim()) return [];

  // 方式一：服务端代理（无 CORS 问题，Key 不暴露到客户端）
  try {
    const proxyUrl = `/api/amap-inputtips?keyword=${encodeURIComponent(keyword)}`;
    const res = await fetch(proxyUrl);

    if (res.ok) {
      const data: AmapInputTipsResponse = await res.json();
      if (data.status === "1" && data.tips && data.tips.length > 0) {
        return tipsToResults(data.tips);
      }
      // 代理成功但 API 返回空或无结果 — 正常情况，不报错
      return [];
    }

    // 代理返回错误 — 打日志并降级到直连
    const errData = await res.json().catch(() => ({}));
    console.warn("[Amap] 服务端代理失败，尝试直连:", errData.error || `HTTP ${res.status}`);
  } catch {
    // 代理不可用（网络问题等），降级到直连
  }

  // 方式二：直连高德 API（兜底）
  if (!AMAP_KEY) {
    console.warn("[Amap] NEXT_PUBLIC_AMAP_WEB_KEY 未配置，无法调用搜索接口");
    return [];
  }

  try {
    const params = new URLSearchParams({
      key: AMAP_KEY,
      keywords: keyword,
      output: "json",
      citylimit: "false",
    });

    const res = await fetch(
      `${BASE_URL}/assistant/inputtips?${params.toString()}`
    );
    if (!res.ok) return [];

    const data: AmapInputTipsResponse = await res.json();

    if (data.status !== "1") {
      // 高德 API 错误码对照：https://lbs.amap.com/api/webservice/guide/tools/info/
      if (data.infocode === "10009") {
        console.error(
          `[Amap] USERKEY_PLAT_NOMATCH — 当前 Key 未开通「Web服务」`,
          `\n   Key: ${AMAP_KEY.slice(0, 6)}...`,
          `\n   解决步骤:`,
          `\n     1. 打开 https://console.amap.com/dev/key/app`,
          `\n     2. 找到 Key "${AMAP_KEY.slice(0, 6)}..." → 点击「设置」`,
          `\n     3. 服务平台 → 勾选「Web服务」→ 保存`,
          `\n     4. 等待 5 分钟后重试`
        );
      } else {
        console.error(
          `[Amap] 直连 API 返回错误 (status=${data.status}, infocode=${data.infocode})`,
          `\n   错误信息: ${data.info}`,
          `\n   完整响应: ${JSON.stringify(data)}`
        );
      }
      return [];
    }

    return tipsToResults(data.tips ?? []);
  } catch (err) {
    console.error("[Amap] 直连网络异常:", err);
    return [];
  }
}

/**
 * 地理编码 API — 将地址/城市名转为坐标
 * 用于行政区域 tip（无 location）的回退查找
 * 文档：https://lbs.amap.com/api/webservice/guide/api/georegeo
 */
export async function geocodeAddress(
  address: string,
  city?: string
): Promise<{ lng: number; lat: number } | null> {
  if (!address.trim()) return null;

  const params = new URLSearchParams({
    key: AMAP_KEY,
    address: address,
    output: "json",
  });
  if (city) params.set("city", city);

  try {
    const res = await fetch(`${BASE_URL}/geocode/geo?${params.toString()}`);
    const data = await res.json();

    if (data.status !== "1" || !data.geocodes?.length) return null;

    const [lng, lat] = data.geocodes[0].location.split(",").map(Number);
    if (isNaN(lng) || isNaN(lat)) return null;
    return { lng, lat };
  } catch {
    console.error("[Amap] 地理编码网络异常:", address);
    return null;
  }
}

/**
 * POI 关键字搜索 API — 用于精确搜索
 * 文档：https://lbs.amap.com/api/webservice/guide/api/search
 */
export async function searchPOI(keyword: string): Promise<SearchResult[]> {
  if (!keyword.trim() || !AMAP_KEY) return [];

  const params = new URLSearchParams({
    key: AMAP_KEY,
    keywords: keyword,
    output: "json",
    offset: "10",
  });

  try {
    const res = await fetch(`${BASE_URL}/place/text?${params.toString()}`);
    const data: AmapPOISearchResponse = await res.json();

    if (data.status !== "1" || !data.pois) return [];

    return data.pois.map((poi) => {
      const [lng, lat] = poi.location.split(",").map(Number);
      return {
        id: poi.id,
        name: poi.name,
        longitude: lng,
        latitude: lat,
        address: poi.address || "",
        district: poi.adname || "",
        adcode: "",
        typecode: "",
      };
    });
  } catch {
    return [];
  }
}

/**
 * 根据高德 adcode 和 typecode 计算合适的地图缩放级别
 *
 * 高德 typecode 大类（6位编码，前2位代表层级）：
 * - 省/直辖市     → typecode 前几位有固定规律
 * - 地级市/州    → 中间层级
 * - 区县         → 具体区县
 * - 具体 POI     → 餐饮/景点/购物等
 *
 * 规则（数值越小越远）：
 * - typecode 可用时按大类映射
 * - 否则 fallback 到 adcode 后缀推断（0000→省, xx00→市, 其他→区县）
 * - 都不可用时默认 zoom=12
 */
export function getZoomForRegion(adcode: string, typecode: string): number {
  // typecode 优先：高德 POI 分类大类编码
  if (typecode) {
    // 行政区划大类（省/市/区县）
    if (
      typecode === "290000" || // 省级
      typecode.startsWith("29")
    ) {
      if (adcode.endsWith("0000")) return 4; // 省
      if (adcode.endsWith("00")) return 7;     // 市
      return 9;                                // 区县
    }
    // 具体 POI 大类（餐饮/购物/景点/住宿等）→ 缩放到细节
    return 11;
  }

  // typecode 不可用时，fallback 到 adcode 模式匹配
  if (!adcode || adcode.length < 6) return 12;
  if (adcode.endsWith("0000")) return 4;
  if (adcode.endsWith("00")) return 7;
  return 10;
}
