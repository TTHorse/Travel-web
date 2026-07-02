import { createServerSupabase } from "@/lib/supabase/server";
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
       cover_image, description, start_date, tags,
       photos (url, thumbnail_url, width, height)`
    )
    .eq("is_published", true)
    .order("start_date", { ascending: false })
    .order("sort_order", { referencedTable: "photos", ascending: true });

  if (error) {
    console.error("Error fetching trips:", error);
    return [];
  }

  return (data ?? []).filter(isTripSummary) as TripSummary[];
}

export async function getTripBySlug(slug: string): Promise<Trip | null> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("trips")
    .select("*, photos (*), map_points (*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) return null;
  return isTrip(data) ? data : null;
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
