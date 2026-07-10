import { createServerSupabase } from "@/lib/supabase/server";
import { createComment } from "@/lib/data/comments";
import { NextResponse } from "next/server";

// GET /api/comments?trip_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get("trip_id");

  if (!tripId) {
    return NextResponse.json({ error: "缺少 trip_id 参数" }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("trip_id", tripId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Comments API error:", error);
    return NextResponse.json({ error: "获取评论失败" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/comments — 需认证：发表评论
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { trip_id, content } = body;

    if (!trip_id || !content) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    // 内容长度校验
    if (content.length > 2000) {
      return NextResponse.json({ error: "评论不能超过2000字" }, { status: 400 });
    }

    // CSRF 防护：检查 Origin 头
    const origin = request.headers.get("origin") || "";
    const allowedHosts = [
      new URL(request.url).host,
      process.env.NEXT_PUBLIC_SITE_URL
        ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host
        : "",
    ].filter(Boolean);

    if (origin && !allowedHosts.some((h) => origin.endsWith(h))) {
      return NextResponse.json({ error: "不允许的请求来源" }, { status: 403 });
    }

    const result = await createComment(trip_id, user.id, content);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "评论提交失败" }, { status: 500 });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
