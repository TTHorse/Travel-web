import { createServerSupabase } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/profile";

// ============================================================
// 用户 Profile 数据访问层
// ============================================================

/**
 * 获取当前用户的 profile（如果不存在则自动创建，默认 role='user'）
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 查询现有 profile
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return existing as Profile;

  // 自动创建 profile（默认 role='user'）
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      user_id: user.id,
      role: "user",
      display_name: user.email ?? null,
    })
    .select()
    .single();

  if (error) {
    // 并发插入冲突 — 重读一次
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return retry as Profile | null;
    }
    console.error("[profiles] 创建失败:", error.message);
    return null;
  }

  return created as Profile;
}

/**
 * 检查当前用户是否为管理员
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === "admin";
}

/**
 * 获取指定用户的 profile（仅管理员可调用其他用户的 profile）
 */
export async function getProfile(
  userId: string
): Promise<Profile | null> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[profiles] 查询失败:", error.message);
    return null;
  }

  return data as Profile | null;
}

/**
 * 获取所有用户 profile 列表（仅管理员使用）
 */
export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[profiles] 查询列表失败:", error.message);
    return [];
  }

  return (data ?? []) as Profile[];
}
