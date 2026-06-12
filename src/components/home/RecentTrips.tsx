import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPublishedTrips } from "@/lib/data/trips";
import { TripCard } from "@/components/trip/TripCard";

export async function RecentTrips() {
  let trips: Awaited<ReturnType<typeof getPublishedTrips>> = [];

  try {
    trips = await getPublishedTrips();
  } catch {
    // 数据库未配置时显示空状态
  }

  const recentTrips = trips.slice(0, 3);

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              最新旅行
            </h2>
            <p className="mt-2 text-white/50">最近到访的目的地</p>
          </div>
          <Link
            href="/trips"
            className="hidden sm:flex items-center gap-1 text-white/50 hover:text-white transition-colors text-sm"
          >
            查看全部 <ArrowRight size={16} />
          </Link>
        </div>

        {recentTrips.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/30 text-lg">还没有旅行记录</p>
            <p className="text-white/15 text-sm mt-2">
              开始添加你的第一次旅行吧
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/trips"
            className="inline-flex items-center gap-1 text-white/50 hover:text-white transition-colors text-sm"
          >
            查看全部 <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
