"use client";

import { useEffect, useState } from "react";
import { EarthGlobe } from "./EarthGlobe";
import type { MapPoint } from "@/types/map";

interface EarthGlobeWrapperProps {
  points: MapPoint[];
  className?: string;
}

export function EarthGlobeWrapper({ points, className }: EarthGlobeWrapperProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <p className="text-white/60 p-8 text-center">3D 地球加载中...</p>;
  }

  return <EarthGlobe points={points} className={className} />;
}
