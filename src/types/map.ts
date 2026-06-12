export interface MapPoint {
  id: string;
  trip_id: string | null;
  name: string;
  latitude: number;
  longitude: number;
  type: "visited" | "highlight" | "wishlist";
  sort_order: number;
}
