import type { Photo } from "./photo";
import type { MapPoint } from "./map";

export interface Trip {
  id: string;
  slug: string;
  title: string;
  destination: string;
  country: string;
  cover_image: string | null;
  description: string | null;
  content: string | null;
  start_date: string | null;
  end_date: string | null;
  tags: string[];
  is_published: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  photos?: Photo[];
  map_points?: MapPoint[];
}

export interface TripSummary {
  id: string;
  slug: string;
  title: string;
  destination: string;
  country: string;
  cover_image: string | null;
  description: string | null;
  start_date: string | null;
  tags: string[];
  photos: {
    url: string;
    thumbnail_url: string | null;
    width: number;
    height: number;
  }[];
}
