"use client";

import { useRef, useEffect, useState } from "react";
import type { MapPoint } from "@/types/map";

// ============================================================
// 最小 AMap 类型声明
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AMapNamespace = any;

declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJsCode?: string;
    };
  }
}

// ============================================================
// 常量
// ============================================================

// JSAPI Key — 必须为「Web端(JSAPI)」类型，不能与 Web服务 Key 混用
const JSAPI_KEY = process.env.NEXT_PUBLIC_AMAP_JSAPI_KEY || "";

// JSAPI v2 安全密钥（可选，从 Amap 控制台获取；localhost 可省略）
const AMAP_SECURITY_CODE = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE || "";

const DEFAULT_CENTER: [number, number] = [104, 35];
const DEFAULT_ZOOM = 4;

const TYPE_COLORS: Record<MapPoint["type"], string> = {
  visited: "#fb923c",
  highlight: "#f472b6",
  wishlist: "#9ca3af",
};

const TYPE_LABELS: Record<MapPoint["type"], string> = {
  visited: "已去过",
  highlight: "精选",
  wishlist: "想去",
};

// ============================================================
// Props
// ============================================================

export interface SearchTarget {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  /** 可选缩放级别，不传则 fallback 到 12 */
  zoom?: number;
}

interface AmapMapContainerProps {
  className?: string;
  points: MapPoint[];
  searchTarget?: SearchTarget | null;
  onClearSearch?: () => void;
}

// ============================================================
// 构建标记 HTML
// ============================================================

function buildMarkerHTML(color: string, pulse = false): string {
  const pulseShadow = pulse ? `box-shadow: 0 0 14px 3px ${color}80;` : "";
  return `
    <div style="
      width:18px;height:18px;border-radius:50%;
      background:${color};border:2px solid #fff;
      ${pulseShadow}
      transform:translate(-50%,-50%);
      pointer-events:auto;
    "></div>`;
}

// ============================================================
// 组件
// ============================================================

export function AmapMapContainer({
  className,
  points,
  searchTarget,
  onClearSearch,
}: AmapMapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AMapNamespace | null>(null);
  const AMapRef = useRef<AMapNamespace | null>(null);
  const markersRef = useRef<AMapNamespace[]>([]);
  const searchMarkerRef = useRef<AMapNamespace | null>(null);
  const searchInfoRef = useRef<AMapNamespace | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");

  // 缺少 Key 时直接报错，无需进 effect
  const keyMissing = !JSAPI_KEY;

  // ── 初始化地图 ──
  useEffect(() => {
    if (!containerRef.current || mapRef.current || keyMissing) return;

    let cancelled = false;

    // JSAPI v2 安全配置（生产环境需要，localhost 可省略）
    if (AMAP_SECURITY_CODE && typeof window !== "undefined") {
      window._AMapSecurityConfig = {
        securityJsCode: AMAP_SECURITY_CODE,
      };
    }

    console.log("[AmapMap] 开始加载 JSAPI，key=", JSAPI_KEY.slice(0, 6) + "...");

    import("@amap/amap-jsapi-loader")
      .then((mod) => {
        console.log("[AmapMap] loader 模块加载成功，开始加载 JSAPI v2");
        return mod.default.load({
          key: JSAPI_KEY,
          version: "2.0",
          plugins: ["AMap.Scale", "AMap.ToolBar"],
        });
      })
      .then((AMap: AMapNamespace) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        console.log("[AmapMap] JSAPI 加载成功，创建地图实例");
        AMapRef.current = AMap;

        const map = new AMap.Map(containerRef.current, {
          zoom: DEFAULT_ZOOM,
          center: DEFAULT_CENTER,
          viewMode: "2D",
          resizeEnable: true,
        });

        map.addControl(new AMap.Scale());
        map.addControl(
          new AMap.ToolBar({
            position: { top: "10px", right: "10px" },
          })
        );

        mapRef.current = map;
        setReady(true);
        console.log("[AmapMap] 地图实例创建完成");
      })
      .catch((err: Error) => {
        if (!cancelled) {
          const msg = err?.message || String(err);
          console.error("[AmapMap] 加载失败:", msg);
          // 常见错误：Key 未开通 JSAPI 服务、网络问题
          if (msg.includes("key")) {
            setLoadError("高德 Key 无效，请确认已在控制台开通「Web端(JSAPI)」服务");
          } else if (msg.includes("network") || msg.includes("fetch")) {
            setLoadError("网络连接失败，请检查是否能访问 webapi.amap.com");
          } else {
            setLoadError(`地图加载失败: ${msg}`);
          }
        }
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
        AMapRef.current = null;
      }
    };
  }, [keyMissing]);

  // ── 同步 points → 标记 ──
  useEffect(() => {
    const map = mapRef.current;
    const AMap = AMapRef.current;
    if (!map || !AMap || !ready) return;

    // 清除旧标记
    markersRef.current.forEach((m) => map.remove(m));
    markersRef.current = [];

    points.forEach((point) => {
      const color = TYPE_COLORS[point.type] || "#fb923c";
      const marker = new AMap.Marker({
        position: [point.longitude, point.latitude],
        content: buildMarkerHTML(color),
        offset: new AMap.Pixel(-9, -9),
        title: point.name,
      });

      marker.on("click", () => {
        const infoWin = new AMap.InfoWindow({
          content: `
            <div style="padding:6px 10px;font-size:13px;min-width:140px;font-family:system-ui;">
              <strong>${point.name}</strong>
              <div style="color:#888;font-size:11px;margin-top:2px;">
                ${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}
              </div>
              <span style="display:inline-block;margin-top:5px;padding:1px 8px;
                border-radius:10px;font-size:10px;
                background:${color}22;color:${color};border:1px solid ${color}44;">
                ${TYPE_LABELS[point.type]}
              </span>
            </div>`,
          offset: new AMap.Pixel(0, -28),
        });
        infoWin.open(map, marker.getPosition());
      });

      map.add(marker);
      markersRef.current.push(marker);
    });
  }, [points, ready]);

  // ── 同步 searchTarget → 飞行 + 搜索标记 ──
  useEffect(() => {
    const map = mapRef.current;
    const AMap = AMapRef.current;
    if (!map || !AMap || !ready) return;

    // 清除旧搜索标记
    if (searchMarkerRef.current) {
      map.remove(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }
    if (searchInfoRef.current) {
      searchInfoRef.current.close();
      searchInfoRef.current = null;
    }

    if (!searchTarget) return;

    // 飞行
    map.setZoomAndCenter(searchTarget.zoom ?? 12, [searchTarget.longitude, searchTarget.latitude]);

    // 脉冲标记
    const marker = new AMap.Marker({
      position: [searchTarget.longitude, searchTarget.latitude],
      content: buildMarkerHTML("#22d3ee", true),
      offset: new AMap.Pixel(-9, -9),
      title: searchTarget.name,
    });
    map.add(marker);
    searchMarkerRef.current = marker;

    // 信息窗（含关闭按钮）
    const infoWin = new AMap.InfoWindow({
      content: `
        <div style="padding:4px 10px;font-size:13px;white-space:nowrap;font-family:system-ui;">
          <span style="color:#22d3ee;">📍</span>
          <strong>${searchTarget.name}</strong>
          <button id="amap-clear-search-btn"
            style="margin-left:8px;background:none;border:none;color:#999;cursor:pointer;font-size:14px;line-height:1;">×</button>
        </div>`,
      offset: new AMap.Pixel(0, -32),
    });
    infoWin.open(map, marker.getPosition());
    searchInfoRef.current = infoWin;

    // 关闭按钮事件（延迟绑定，等 DOM 就绪）
    setTimeout(() => {
      const btn = document.getElementById("amap-clear-search-btn");
      if (btn) {
        btn.onclick = () => onClearSearch?.();
      }
    }, 100);
  }, [searchTarget, ready, onClearSearch]);

  // ── 错误状态 ──
  const errorMessage = keyMissing
    ? "未配置 NEXT_PUBLIC_AMAP_JSAPI_KEY（需单独创建一个「Web端(JSAPI)」类型的 Key）"
    : loadError || null;

  if (errorMessage) {
    return (
      <div
        className={`flex items-center justify-center bg-[#1a1a1a] ${className ?? ""}`}
      >
        <div className="text-center px-4 max-w-sm">
          <p className="text-white/30 text-sm">{errorMessage}</p>
          <p className="text-white/20 text-xs mt-2">
            注意：Web服务 Key 和 JSAPI Key 必须分别创建，不能共用同一个 Key。
          </p>
          <a
            href="https://console.amap.com/dev/key/app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-400/70 hover:text-orange-400 mt-2 inline-block"
          >
            前往高德控制台创建 →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      {/* 加载中 */}
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1a1a1a]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-white/10 border-t-orange-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/30 text-sm">地图加载中...</p>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ background: "#1a1a1a" }}
      />
    </div>
  );
}
