import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { updateProfile, getCurrentProfile } from "@/lib/data/profiles";
import { z } from "zod";

const profileUpdateSchema = z
  .object({
    display_name: z.string().min(1, "昵称不能为空").optional(),
    avatar_url: z.string().url("头像 URL 无效").nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "至少需要提供一个字段",
  });

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const profile = await getCurrentProfile();
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  // 1. 验证当前用户已登录
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  // 2. 解析并校验请求体
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "无效的请求体" }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "请求参数无效" },
      { status: 400 }
    );
  }

  // 3. 更新 profile
  const profile = await updateProfile(parsed.data);

  if (!profile) {
    return NextResponse.json(
      { error: "更新失败，请稍后重试" },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile });
}
