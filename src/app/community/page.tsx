import type { Metadata } from "next";
import { getCommunityTrips } from "@/lib/data/community";
import { CommunityCard } from "@/components/community/CommunityCard";
import { CommunityTabs } from "@/components/community/CommunityTabs";
import Link from "next/link";
import { Compass } from "lucide-react";

export const metadata: Metadata = {
  title: "社区",
  description: "浏览大家分享的旅行故事",
};

export const dynamic = "force-dynamic";

interface CommunityPageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function CommunityPage({
  searchParams,
}: CommunityPageProps) {
  const { sort } = await searchParams;
  const sortBy = (sort === "hottest" ? "hottest" : "newest") as
    | "newest"
    | "hottest";

  let trips: Awaited<ReturnType<typeof getCommunityTrips>> = [];

  try {
    trips = await getCommunityTrips(sortBy);
  } catch {
    // 数据库未配置时显示空状态
  }

  return (
    <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <Compass size={36} className="text-orange-400" />
          旅行社区
        </h1>
        <p className="text-white/50 mt-2">
          发现大家分享的精彩旅行故事
        </p>
      </div>

      <CommunityTabs />

      {trips.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/30 text-lg">
            还没有游记，成为第一个分享的人吧！
          </p>
          <Link
            href="/admin/login"
            className="inline-block mt-4 text-sm text-orange-400 hover:text-orange-300 transition-colors"
          >
            登录后发布游记 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <CommunityCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
