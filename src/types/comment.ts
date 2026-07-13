export interface Comment {
  id: string;
  trip_id: string;
  parent_id: string | null;
  user_id: string;
  author_name: string;
  author_avatar_url: string | null;
  content: string;
  is_approved: boolean;
  created_at: string;
  replies?: Comment[];
}
