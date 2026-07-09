// ============================================================
// 用户 Profile 类型 — 存储用户角色和展示名
// ============================================================

export interface Profile {
  user_id: string;
  role: "user" | "admin";
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export type UserRole = Profile["role"];
