import { createServerSupabase } from "@/lib/supabase/server";

// ============================================================
// 点赞数据访问层
// ============================================================

/**
 * Toggle 点赞：已点赞则取消，未点赞则点赞
 * @returns { liked: boolean } — 操作后的点赞状态
 */
export async function toggleLike(
  userId: string,
  tripId: string
): Promise<{ liked: boolean }> {
  const supabase = await createServerSupabase();

  // 检查是否已点赞
  const { data: existing } = await supabase
    .from("likes")
    .select("user_id")
    .eq("user_id", userId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (existing) {
    // 取消点赞
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", userId)
      .eq("trip_id", tripId);

    if (error) {
      console.error("Error unliking:", error);
      throw new Error("取消点赞失败");
    }
    return { liked: false };
  } else {
    // 点赞
    const { error } = await supabase.from("likes").insert({
      user_id: userId,
      trip_id: tripId,
    });

    if (error) {
      console.error("Error liking:", error);
      throw new Error("点赞失败");
    }
    return { liked: true };
  }
}

/**
 * 检查用户是否已点赞某游记
 */
export async function getLikeStatus(
  userId: string,
  tripId: string
): Promise<boolean> {
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("likes")
    .select("user_id")
    .eq("user_id", userId)
    .eq("trip_id", tripId)
    .maybeSingle();

  return data !== null;
}

/**
 * 获取游记点赞数
 */
export async function getLikesCount(tripId: string): Promise<number> {
  const supabase = await createServerSupabase();

  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", tripId);

  return count ?? 0;
}
