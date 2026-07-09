import { NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  // 1. 验证当前用户已登录
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json(
      { error: "未登录" },
      { status: 401 }
    );
  }

  // 2. 解析请求体
  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "无效的请求体" },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "缺少 currentPassword 或 newPassword" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "新密码长度至少 6 位" },
      { status: 400 }
    );
  }

  // 3. 用 service client 验证旧密码（不影响当前 session）
  const serviceClient = await createServiceSupabase();
  const { error: verifyError } =
    await serviceClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

  if (verifyError) {
    return NextResponse.json(
      { error: "当前密码不正确" },
      { status: 401 }
    );
  }

  // 4. 更新密码
  const { error: updateError } =
    await serviceClient.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

  if (updateError) {
    console.error("[change-password] 更新失败:", updateError.message);
    return NextResponse.json(
      { error: "密码修改失败，请稍后重试" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
