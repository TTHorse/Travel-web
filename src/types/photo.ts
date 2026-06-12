export interface Photo {
  id: string;
  trip_id: string;
  cloudinary_id: string;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  width: number;
  height: number;
  sort_order: number;
  taken_at: string | null;
}
