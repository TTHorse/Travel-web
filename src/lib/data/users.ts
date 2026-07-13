import { createServerSupabase } from "@/lib/supabase/server";
import type { TripSummary } from "@/types/trip";

// ============================================================
// 用户公开数据访问层
// ============================================================

export interface PublicUserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  trip_count: number;
  country_count: number;
  favorites_count: number;
}

/**
 * 获取用户公开主页信息
 */
export async function getUserProfile(
  userId: string
): Promise<PublicUserProfile | null> {
  const supabase = await createServerSupabase();

  // 获取用户 profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !profile) {
    if (error) console.error("Error fetching user profile:", error);
    return null;
  }

  // 统计已发布游记数
  const { data: trips } = await supabase
    .from("trips")
    .select("country")
    .eq("user_id", userId)
    .eq("is_published", true);

  const publishedTrips = trips ?? [];
  const uniqueCountries = new Set(publishedTrips.map((t) => t.country)).size;

  // 统计收藏数
  const { count: favCount } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    user_id: profile.user_id,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    created_at: profile.created_at,
    trip_count: publishedTrips.length,
    country_count: uniqueCountries,
    favorites_count: favCount ?? 0,
  };
}

/**
 * 获取用户已发布的游记列表
 */
export async function getUserPublishedTrips(
  userId: string
): Promise<TripSummary[]> {
  const supabase = await createServerSupabase();

  const { data: trips, error } = await supabase
    .from("trips")
    .select(
      `id, slug, title, destination, country,
       cover_image, description, start_date, tags`
    )
    .eq("user_id", userId)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !trips) {
    if (error) console.error("Error fetching user trips:", error);
    return [];
  }

  // 批量获取 photos
  const tripIds = trips.map((t) => t.id);
  const photosMap = new Map<string, TripSummary["photos"]>();

  if (tripIds.length > 0) {
    const { data: allPhotos } = await supabase
      .from("photos")
      .select("trip_id, url, thumbnail_url, width, height")
      .in("trip_id", tripIds)
      .order("sort_order", { ascending: true });

    for (const p of allPhotos ?? []) {
      const list = photosMap.get(p.trip_id) ?? [];
      list.push({
        url: p.url,
        thumbnail_url: p.thumbnail_url,
        width: p.width,
        height: p.height,
      });
      photosMap.set(p.trip_id, list);
    }
  }

  return trips.map((t) => ({
    ...t,
    photos: photosMap.get(t.id) ?? [],
  })) as TripSummary[];
}

/**
 * 获取用户收藏的游记列表
 */
export async function getUserFavoritedTrips(
  userId: string
): Promise<TripSummary[]> {
  const supabase = await createServerSupabase();

  // 获取用户收藏的 trip_id 列表
  const { data: favs } = await supabase
    .from("favorites")
    .select("trip_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!favs || favs.length === 0) return [];

  const favTripIds = favs.map((f) => f.trip_id);

  // 获取这些游记（仅已发布的）
  const { data: trips } = await supabase
    .from("trips")
    .select(
      `id, slug, title, destination, country,
       cover_image, description, start_date, tags`
    )
    .in("id", favTripIds)
    .eq("is_published", true);

  if (!trips || trips.length === 0) return [];

  // 保持收藏顺序
  const tripMap = new Map(trips.map((t) => [t.id, t]));
  const ordered = favTripIds
    .map((id) => tripMap.get(id))
    .filter(Boolean) as typeof trips;

  // 批量获取 photos
  const photosMap = new Map<string, TripSummary["photos"]>();
  const { data: allPhotos } = await supabase
    .from("photos")
    .select("trip_id, url, thumbnail_url, width, height")
    .in("trip_id", ordered.map((t) => t.id))
    .order("sort_order", { ascending: true });

  for (const p of allPhotos ?? []) {
    const list = photosMap.get(p.trip_id) ?? [];
    list.push({
      url: p.url,
      thumbnail_url: p.thumbnail_url,
      width: p.width,
      height: p.height,
    });
    photosMap.set(p.trip_id, list);
  }

  return ordered.map((t) => ({
    ...t,
    photos: photosMap.get(t.id) ?? [],
  })) as TripSummary[];
}
