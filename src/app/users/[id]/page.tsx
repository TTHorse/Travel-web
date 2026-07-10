import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getUserProfile, getUserPublishedTrips, getUserFavoritedTrips } from "@/lib/data/users";
import { UserHero } from "@/components/community/UserHero";
import { UserTabs } from "@/components/community/UserTabs";
import { UserTripGrid } from "@/components/community/UserTripGrid";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getUserProfile(id);
  if (!profile) return { title: "用户不存在" };

  return {
    title: `${profile.display_name || "用户"} 的主页`,
  };
}

export const dynamic = "force-dynamic";

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { id: userId } = await params;
  const { tab } = await searchParams;

  const profile = await getUserProfile(userId);

  if (!profile) {
    notFound();
  }

  const showFavorites = tab === "favorites";

  const [trips, favorites] = await Promise.all([
    getUserPublishedTrips(userId),
    showFavorites ? getUserFavoritedTrips(userId) : Promise.resolve([]),
  ]);

  return (
    <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
      {/* 用户信息头部 */}
      <UserHero profile={profile} />

      {/* 标签切换 */}
      <div className="mt-10 mb-8">
        <UserTabs />
      </div>

      {/* 内容区 */}
      {showFavorites ? (
        <UserTripGrid
          trips={favorites}
          emptyMessage="还没有收藏任何游记"
        />
      ) : (
        <UserTripGrid
          trips={trips}
          emptyMessage="还没有发布游记"
        />
      )}
    </div>
  );
}
