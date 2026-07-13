import { createServerSupabase } from "@/lib/supabase/server";
import type { Trip } from "@/types/trip";

// ============================================================
// 社区游记数据访问层
// ============================================================

export interface CommunityTripSummary {
  id: string;
  slug: string;
  title: string;
  destination: string;
  country: string;
  cover_image: string | null;
  description: string | null;
  start_date: string | null;
  tags: string[];
  user_id: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  likes_count: number;
  favorites_count: number;
  comments_count: number;
  created_at: string;
}

export interface CommunityTripDetail extends Trip {
  author_display_name: string | null;
  author_avatar_url: string | null;
  author_user_id: string;
  likes_count: number;
  favorites_count: number;
  comments_count: number;
  has_liked: boolean;
  has_favorited: boolean;
}

/**
 * 获取社区聚合列表（所有用户已发布行程，带互动计数）
 */
export async function getCommunityTrips(
  sort: "newest" | "hottest" = "newest",
  page = 1,
  pageSize = 12
): Promise<CommunityTripSummary[]> {
  const supabase = await createServerSupabase();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: trips, error } = await supabase
    .from("trips")
    .select(
      `id, slug, title, destination, country,
       cover_image, description, start_date, tags,
       user_id, created_at`
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !trips || trips.length === 0) {
    if (error) console.error("Error fetching community trips:", error);
    return [];
  }

  const tripIds = trips.map((t) => t.id);

  // 批量获取作者信息
  const userIds = [...new Set(trips.map((t) => t.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .in("user_id", userIds);

  const profileMap = new Map<
    string,
    { display_name: string | null; avatar_url: string | null }
  >();
  for (const p of profiles ?? []) {
    profileMap.set(p.user_id, {
      display_name: p.display_name,
      avatar_url: p.avatar_url,
    });
  }

  // 批量获取互动计数
  const [likesCounts, favoritesCounts, commentsCounts] = await Promise.all([
    getBatchLikesCounts(tripIds),
    getBatchFavoritesCounts(tripIds),
    getBatchCommentsCounts(tripIds),
  ]);

  const result: CommunityTripSummary[] = trips.map((t) => {
    const profile = profileMap.get(t.user_id);
    return {
      ...t,
      author_display_name: profile?.display_name ?? null,
      author_avatar_url: profile?.avatar_url ?? null,
      likes_count: likesCounts.get(t.id) ?? 0,
      favorites_count: favoritesCounts.get(t.id) ?? 0,
      comments_count: commentsCounts.get(t.id) ?? 0,
    };
  });

  // 最热排序：按点赞数降序
  if (sort === "hottest") {
    result.sort((a, b) => b.likes_count - a.likes_count);
  }

  return result;
}

/**
 * 获取社区游记详情（含当前用户互动状态）
 */
export async function getCommunityTripBySlug(
  slug: string,
  currentUserId?: string
): Promise<CommunityTripDetail | null> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) return null;

  const trip = data as Trip;

  // 获取作者信息
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("user_id", trip.user_id)
    .maybeSingle();

  // 获取互动计数
  const [likesCount, favoritesCount, commentsCount] = await Promise.all([
    getLikesCount(trip.id),
    getFavoritesCount(trip.id),
    getCommentsCount(trip.id),
  ]);

  // 获取当前用户互动状态
  let hasLiked = false;
  let hasFavorited = false;

  if (currentUserId) {
    const [likeStatus, favStatus] = await Promise.all([
      checkUserLiked(currentUserId, trip.id),
      checkUserFavorited(currentUserId, trip.id),
    ]);
    hasLiked = likeStatus;
    hasFavorited = favStatus;
  }

  // 分别查询关联数据
  const [photosResult, mapPointsResult] = await Promise.all([
    supabase
      .from("photos")
      .select("*")
      .eq("trip_id", trip.id)
      .order("sort_order"),
    supabase
      .from("map_points")
      .select("*")
      .eq("trip_id", trip.id)
      .order("sort_order"),
  ]);

  return {
    ...trip,
    photos: photosResult.data ?? [],
    map_points: mapPointsResult.data ?? [],
    author_display_name: profile?.display_name ?? null,
    author_avatar_url: profile?.avatar_url ?? null,
    author_user_id: trip.user_id,
    likes_count: likesCount,
    favorites_count: favoritesCount,
    comments_count: commentsCount,
    has_liked: hasLiked,
    has_favorited: hasFavorited,
  };
}

// ============================================================
// 批量计数辅助函数
// ============================================================

async function getBatchLikesCounts(
  tripIds: string[]
): Promise<Map<string, number>> {
  const supabase = await createServerSupabase();
  const map = new Map<string, number>();

  // 使用 group by 聚合
  const { data } = await supabase
    .from("likes")
    .select("trip_id")
    .in("trip_id", tripIds);

  for (const row of data ?? []) {
    map.set(row.trip_id, (map.get(row.trip_id) ?? 0) + 1);
  }

  return map;
}

async function getBatchFavoritesCounts(
  tripIds: string[]
): Promise<Map<string, number>> {
  const supabase = await createServerSupabase();
  const map = new Map<string, number>();

  const { data } = await supabase
    .from("favorites")
    .select("trip_id")
    .in("trip_id", tripIds);

  for (const row of data ?? []) {
    map.set(row.trip_id, (map.get(row.trip_id) ?? 0) + 1);
  }

  return map;
}

async function getBatchCommentsCounts(
  tripIds: string[]
): Promise<Map<string, number>> {
  const supabase = await createServerSupabase();
  const map = new Map<string, number>();

  const { data } = await supabase
    .from("comments")
    .select("trip_id")
    .in("trip_id", tripIds)
    .eq("is_approved", true);

  for (const row of data ?? []) {
    map.set(row.trip_id, (map.get(row.trip_id) ?? 0) + 1);
  }

  return map;
}

async function getLikesCount(tripId: string): Promise<number> {
  const supabase = await createServerSupabase();
  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", tripId);
  return count ?? 0;
}

async function getFavoritesCount(tripId: string): Promise<number> {
  const supabase = await createServerSupabase();
  const { count } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", tripId);
  return count ?? 0;
}

async function getCommentsCount(tripId: string): Promise<number> {
  const supabase = await createServerSupabase();
  const { count } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", tripId)
    .eq("is_approved", true);
  return count ?? 0;
}

async function checkUserLiked(
  userId: string,
  tripId: string
): Promise<boolean> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("likes")
    .select("user_id")
    .eq("user_id", userId)
    .eq("trip_id", tripId)
    .maybeSingle();
  return data !== null;
}

async function checkUserFavorited(
  userId: string,
  tripId: string
): Promise<boolean> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("favorites")
    .select("user_id")
    .eq("user_id", userId)
    .eq("trip_id", tripId)
    .maybeSingle();
  return data !== null;
}
