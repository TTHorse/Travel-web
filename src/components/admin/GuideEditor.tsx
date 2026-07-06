"use client";

import { useState, useCallback } from "react";
import { TripForm } from "./TripForm";
import { AmapMapContainer } from "@/components/map/AmapMapContainer";
import type { SearchTarget } from "@/components/map/AmapMapContainer";
import type { MapPoint } from "@/types/map";
import type { SearchResult } from "@/types/amap";

/**
 * 行程攻略编辑器 — 左栏表单 + 右栏高德 2D 地图
 * - 左栏复用 TripForm（开启地区搜索 + 行程风格标签）
 * - 目的地搜索选中地区 → 右侧地图飞行定位 + 高亮标记
 * - 地图标记点编辑 → 右侧地图实时同步渲染
 */
export function GuideEditor() {
  const [flyTarget, setFlyTarget] = useState<{
    longitude: number;
    latitude: number;
    name: string;
  } | null>(null);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);

  const handleRegionSelect = useCallback((result: SearchResult) => {
    setFlyTarget({
      longitude: result.longitude,
      latitude: result.latitude,
      name: result.name,
    });
  }, []);

  const handleClearSearch = useCallback(() => {
    setFlyTarget(null);
  }, []);

  // flyTarget → SearchTarget（地图组件格式）
  const searchTarget: SearchTarget | null = flyTarget
    ? {
        id: `search-${flyTarget.latitude},${flyTarget.longitude}`,
        name: flyTarget.name,
        longitude: flyTarget.longitude,
        latitude: flyTarget.latitude,
      }
    : null;

  return (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-4rem)]">
      {/* 左栏：表单 */}
      <div className="w-full md:w-1/2 md:flex-1 md:overflow-y-auto px-4 py-8 md:py-6 max-w-3xl mx-auto md:mx-0">
        <h1 className="text-2xl font-bold text-white mb-6">行程攻略</h1>
        <TripForm
          isEdit={false}
          enableRegionSearch
          onRegionSelect={handleRegionSelect}
          onMapPointsChange={setMapPoints}
        />
      </div>

      {/* 右栏：高德 2D 地图 */}
      <div className="w-full md:w-1/2 md:sticky md:top-16 h-[50vh] md:h-[calc(100vh-4rem)] border-t md:border-t-0 md:border-l border-white/5">
        <AmapMapContainer
          className="w-full h-full"
          points={mapPoints}
          searchTarget={searchTarget}
          onClearSearch={handleClearSearch}
        />
      </div>
    </div>
  );
}
