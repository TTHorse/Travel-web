import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import type { Trip, TripSummary } from "@/types/trip";
import type { MapPoint } from "@/types/map";

function isTripSummary(obj: unknown): obj is TripSummary {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "slug" in obj &&
    "title" in obj &&
    "destination" in obj &&
    "country" in obj
  );
}

function isTrip(obj: unknown): obj is Trip {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "slug" in obj &&
    "title" in obj &&
    "destination" in obj &&
    "country" in obj &&
    "content" in obj
  );
}

function isMapPoint(obj: unknown): obj is MapPoint {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "name" in obj &&
    "latitude" in obj &&
    "longitude" in obj
  );
}

export async function getPublishedTrips(): Promise<TripSummary[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("trips")
    .select(
      `id, slug, title, destination, country,
       cover_image, description, start_date, tags`
    )
    .eq("is_published", true)
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Error fetching trips:", error);
    return [];
  }

  // 批量获取所有 trips 的 photos，单独查询避免 RLS 关联失败
  const tripIds = (data ?? []).map((t) => t.id);
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

  return (data ?? []).map((t) => ({
    ...t,
    photos: photosMap.get(t.id) ?? [],
  })).filter(isTripSummary) as TripSummary[];
}

export async function getTripBySlug(slug: string): Promise<Trip | null> {
  const supabase = await createServerSupabase();

  // 单独查询 trip，避免 join photos/map_points 时因 RLS 策略导致整个查询失败
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) return null;
  if (!isTrip(data)) return null;

  // 分别查询关联数据，各自容错
  const [photosResult, mapPointsResult] = await Promise.all([
    supabase
      .from("photos")
      .select("*")
      .eq("trip_id", data.id)
      .order("sort_order"),
    supabase
      .from("map_points")
      .select("*")
      .eq("trip_id", data.id)
      .order("sort_order"),
  ]);

  return {
    ...data,
    photos: photosResult.data ?? [],
    map_points: mapPointsResult.data ?? [],
  };
}

export async function getAllMapPoints(): Promise<MapPoint[]> {
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("map_points")
    .select("*")
    .order("sort_order");

  return (data ?? []).filter(isMapPoint) as MapPoint[];
}

export async function getTravelStats(): Promise<{
  totalTrips: number;
  totalCountries: number;
  totalCities: number;
}> {
  const supabase = await createServerSupabase();

  // 合并 trips 总数和国家去重为一次查询
  const { data: trips, error } = await supabase
    .from("trips")
    .select("country, is_published")
    .eq("is_published", true);

  const publishedTrips = (trips ?? []).filter((t) => t.is_published);
  const uniqueCountries = new Set(publishedTrips.map((t) => t.country)).size;

  // cities 来自不同的表，仍需单独查询
  const { data: cities } = await supabase
    .from("map_points")
    .select("name")
    .eq("type", "visited");

  const uniqueCities = new Set((cities ?? []).map((c) => c.name)).size;

  return {
    totalTrips: publishedTrips.length,
    totalCountries: uniqueCountries,
    totalCities: uniqueCities,
  };
}

// ============================================================
// 基于用户身份的方法
// ============================================================

/**
 * 获取当前用户的所有行程（非管理员使用），包含所有状态
 */
export async function getTripsByUser(userId: string): Promise<Trip[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user trips:", error);
    return [];
  }

  return (data ?? []).filter(isTrip) as Trip[];
}

/**
 * 获取所有行程（管理员使用），使用 service role 绕过 RLS
 */
export async function getAllTripsAdmin(): Promise<Trip[]> {
  const supabase = await createServiceSupabase();

  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all trips (admin):", error);
    return [];
  }

  return (data ?? []).filter(isTrip) as Trip[];
}

/**
 * 获取管理员的全站统计（所有用户、所有状态的行程）
 */
export async function getAdminTravelStats(): Promise<{
  totalTrips: number;
  totalCountries: number;
  totalCities: number;
  totalUsers: number;
}> {
  const supabase = await createServiceSupabase();

  const { data: trips } = await supabase
    .from("trips")
    .select("country, is_published");

  const allTrips = trips ?? [];
  const publishedTrips = allTrips.filter((t) => t.is_published);
  const uniqueCountries = new Set(publishedTrips.map((t) => t.country)).size;

  const { data: cities } = await supabase
    .from("map_points")
    .select("name")
    .eq("type", "visited");

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  return {
    totalTrips: allTrips.length,
    totalCountries: uniqueCountries,
    totalCities: new Set((cities ?? []).map((c) => c.name)).size,
    totalUsers: userCount ?? 0,
  };
}
