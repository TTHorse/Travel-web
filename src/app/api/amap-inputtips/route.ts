import { NextResponse } from "next/server";

const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_WEB_KEY ?? "";
const BASE_URL = "https://restapi.amap.com/v3";

/**
 * GET /api/amap-inputtips?keyword=xxx
 * 服务端代理高德 inputtips API，避免浏览器端 CORS
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json(
      { error: "缺少 keyword 参数" },
      { status: 400 }
    );
  }

  if (!AMAP_KEY) {
    return NextResponse.json(
      { error: "服务端未配置 NEXT_PUBLIC_AMAP_WEB_KEY" },
      { status: 500 }
    );
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
    const data = await res.json();

    if (!res.ok || data.status !== "1") {
      console.error(
        `[Amap Proxy] API 异常 (status=${data.status}, infocode=${data.infocode}): ${data.info}`
      );
      return NextResponse.json(
        { error: data.info || "高德 API 请求失败" },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[Amap Proxy] 网络异常:", err);
    return NextResponse.json(
      { error: "高德 API 网络请求失败" },
      { status: 502 }
    );
  }
}
