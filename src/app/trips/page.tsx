import type { Metadata } from "next";
import { getPublishedTrips } from "@/lib/data/trips";
import { TripCard } from "@/components/trip/TripCard";
import { TripFilters } from "@/components/trip/TripFilters";

export const metadata: Metadata = {
  title: "旅行记录",
  description: "浏览我的所有旅行记录",
};

export const revalidate = 3600; // ISR: 每小时重新生成

export default async function TripsPage() {
  let trips: Awaited<ReturnType<typeof getPublishedTrips>> = [];

  try {
    trips = await getPublishedTrips();
  } catch {
    // 数据库未配置时显示空状态
  }

  return (
    <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">旅行记录</h1>
      <p className="text-white/50 mb-8">每一次出发，都是一段故事</p>

      <TripFilters trips={trips} />

      {trips.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/30 text-lg">还没有旅行记录</p>
          <p className="text-white/15 text-sm mt-2">
            开始添加你的第一次旅行吧
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
