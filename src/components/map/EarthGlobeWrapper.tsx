"use client";

import { useEffect, useState, useCallback } from "react";
import { EarthGlobe } from "./EarthGlobe";
import type { SearchTarget } from "./EarthGlobe";
import { AmapSearch } from "./AmapSearch";
import type { MapPoint } from "@/types/map";
import type { SearchResult } from "@/types/amap";

interface EarthGlobeWrapperProps {
  points: MapPoint[];
  className?: string;
}

export function EarthGlobeWrapper({ points, className }: EarthGlobeWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [searchTarget, setSearchTarget] = useState<SearchTarget | null>(null);

  useEffect(() => setMounted(true), []);

  const handleSearchSelect = useCallback((result: SearchResult) => {
    setSearchTarget({
      id: result.id,
      name: result.name,
      longitude: result.longitude,
      latitude: result.latitude,
    });
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTarget(null);
  }, []);

  if (!mounted) {
    return <p className="text-white/60 p-8 text-center">3D 地球加载中...</p>;
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <EarthGlobe
        points={points}
        className="w-full h-full"
        searchTarget={searchTarget}
        onClearSearch={handleClearSearch}
      />

      {/* 顶部居中搜索栏 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
        <AmapSearch onSelect={handleSearchSelect} />
      </div>
    </div>
  );
}
