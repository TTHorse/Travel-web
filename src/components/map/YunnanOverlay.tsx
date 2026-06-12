"use client";

import { Marker } from "react-map-gl/mapbox";
import { YUNNAN_CENTER } from "@/lib/map-constants";

/**
 * 云南脉冲标记 — 在地球上标记云南为"已去过"
 * 包含脉冲呼吸动画外圈 + 实心标记点 + 文字标签
 */
export function YunnanMarker() {
  return (
    <Marker
      longitude={YUNNAN_CENTER.longitude}
      latitude={YUNNAN_CENTER.latitude}
    >
      <div className="relative flex flex-col items-center">
        {/* 外圈脉冲呼吸动画 */}
        <span className="absolute top-0 w-5 h-5 bg-orange-400/40 rounded-full animate-ping" />
        {/* 实心标记点 + 发光 */}
        <span className="relative w-3.5 h-3.5 bg-orange-400 rounded-full border-2 border-orange-300 shadow-lg shadow-orange-400/50 block" />
        {/* 标签：已去过 */}
        <span className="mt-1.5 text-[10px] font-semibold text-orange-300 whitespace-nowrap bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded select-none">
          云南 ✓
        </span>
      </div>
    </Marker>
  );
}
