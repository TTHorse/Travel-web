import { createServerSupabase } from "@/lib/supabase/server";
import type { Comment } from "@/types/comment";

export async function getApprovedComments(tripId: string): Promise<Comment[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("trip_id", tripId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }

  return data as Comment[];
}

export async function createComment(
  tripId: string,
  authorName: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabase();

  const { error } = await supabase.from("comments").insert({
    trip_id: tripId,
    author_name: authorName,
    content,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
