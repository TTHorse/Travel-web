import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  // 防止开放重定向：仅允许相对路径，拒绝绝对 URL 和 // 开头的协议相对 URL
  if (next.startsWith("//") || (next.startsWith("http") && !next.startsWith(origin))) {
    return NextResponse.redirect(`${origin}/admin`);
  }

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/admin/login?error=auth_failed`);
}
