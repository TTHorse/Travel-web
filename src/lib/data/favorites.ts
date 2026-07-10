import { createServerSupabase } from "@/lib/supabase/server";

// ============================================================
// 收藏数据访问层
// ============================================================

/**
 * Toggle 收藏：已收藏则取消，未收藏则收藏
 * @returns { favorited: boolean } — 操作后的收藏状态
 */
export async function toggleFavorite(
  userId: string,
  tripId: string
): Promise<{ favorited: boolean }> {
  const supabase = await createServerSupabase();

  // 检查是否已收藏
  const { data: existing } = await supabase
    .from("favorites")
    .select("user_id")
    .eq("user_id", userId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (existing) {
    // 取消收藏
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("trip_id", tripId);

    if (error) {
      console.error("Error unfavoriting:", error);
      throw new Error("取消收藏失败");
    }
    return { favorited: false };
  } else {
    // 收藏
    const { error } = await supabase.from("favorites").insert({
      user_id: userId,
      trip_id: tripId,
    });

    if (error) {
      console.error("Error favoriting:", error);
      throw new Error("收藏失败");
    }
    return { favorited: true };
  }
}

/**
 * 检查用户是否已收藏某游记
 */
export async function getFavoriteStatus(
  userId: string,
  tripId: string
): Promise<boolean> {
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("favorites")
    .select("user_id")
    .eq("user_id", userId)
    .eq("trip_id", tripId)
    .maybeSingle();

  return data !== null;
}

/**
 * 获取游记收藏数
 */
export async function getFavoritesCount(tripId: string): Promise<number> {
  const supabase = await createServerSupabase();

  const { count } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", tripId);

  return count ?? 0;
}
