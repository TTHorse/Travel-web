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

  // 批量获取评论者头像
  const userIds = [...new Set((data ?? []).map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, avatar_url")
    .in("user_id", userIds);

  const avatarMap = new Map<string, string | null>();
  for (const p of profiles ?? []) {
    avatarMap.set(p.user_id, p.avatar_url);
  }

  return (data ?? []).map((c) => ({
    ...c,
    author_avatar_url: avatarMap.get(c.user_id) ?? null,
  })) as Comment[];
}

/**
 * 创建评论（社区版 — 需注册用户身份）
 * author_name 从 profiles 表获取并冗余存储
 */
export async function createComment(
  tripId: string,
  userId: string,
  content: string,
  parentId?: string | null
): Promise<{ success: boolean; error?: string; data?: Comment }> {
  const supabase = await createServerSupabase();

  // 从 profiles 获取 display_name 作为 author_name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", userId)
    .maybeSingle();

  const authorName = profile?.display_name ?? "用户";

  const { data, error } = await supabase
    .from("comments")
    .insert({
      trip_id: tripId,
      user_id: userId,
      author_name: authorName,
      content,
      parent_id: parentId ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Comment };
}

/**
 * 获取社区评论（与 getApprovedComments 相同，社区语境下的别名）
 */
export async function getCommunityComments(
  tripId: string
): Promise<Comment[]> {
  return getApprovedComments(tripId);
}
