import { createServerSupabase } from "@/lib/supabase/server";
import type { Trip, TripSummary } from "@/types/trip";
import type { MapPoint } from "@/types/map";

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

  return data as unknown as TripSummary[];
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
  return data as unknown as Trip;
}

export async function getAllMapPoints(): Promise<MapPoint[]> {
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("map_points")
    .select("*")
    .order("sort_order");

  return (data || []) as MapPoint[];
}

export async function getTravelStats(): Promise<{
  totalTrips: number;
  totalCountries: number;
  totalCities: number;
}> {
  const supabase = await createServerSupabase();

  const { count: totalTrips } = await supabase
    .from("trips")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);

  const { data: countries } = await supabase
    .from("trips")
    .select("country")
    .eq("is_published", true);

  const { data: cities } = await supabase
    .from("map_points")
    .select("name")
    .eq("type", "visited");

  const uniqueCountries = new Set(
    (countries || []).map((c) => c.country)
  ).size;
  const uniqueCities = new Set((cities || []).map((c) => c.name)).size;

  return {
    totalTrips: totalTrips || 0,
    totalCountries: uniqueCountries,
    totalCities: uniqueCities,
  };
}
