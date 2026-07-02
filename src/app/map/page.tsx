import { EarthGlobeWrapper } from "@/components/map/EarthGlobeWrapper";
import { getAllMapPoints, getTravelStats } from "@/lib/data/trips";
import type { Metadata } from "next";
import type { MapPoint } from "@/types/map";

export const metadata: Metadata = {
  title: "世界地图",
  description: "查看我的旅行足迹地图",
};

export default async function MapPage() {
  let points: MapPoint[] = [];
  let stats: {
    totalTrips: number;
    totalCountries: number;
    totalCities: number;
  } = {
    totalTrips: 0,
    totalCountries: 0,
    totalCities: 0,
  };

  try {
    points = await getAllMapPoints();
    stats = await getTravelStats();
  } catch {
    // 数据库未配置时使用默认空状态
  }

  return (
    <div className="relative h-screen pt-16">
      <EarthGlobeWrapper points={points} className="h-full w-full" />

      {/* 侧边栏统计 */}
      <div className="absolute top-20 left-4 z-10 bg-black/75 backdrop-blur-xl rounded-xl p-5 text-white min-w-[180px] border border-white/10 hidden md:block">
        <h2 className="text-sm font-semibold mb-3 text-white/80">
          旅行统计
        </h2>
        <div className="space-y-2.5">
          <StatItem label="旅行次数" value={stats.totalTrips} />
          <StatItem label="到访国家" value={stats.totalCountries} />
          <StatItem label="标记城市" value={stats.totalCities} />
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-white/50 text-xs">{label}</span>
      <span className="text-lg font-bold text-orange-400 tabular-nums">
        {value}
      </span>
    </div>
  );
}
