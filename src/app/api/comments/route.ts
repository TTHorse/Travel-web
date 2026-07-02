import { createServerSupabase } from "@/lib/supabase/server";
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

// POST /api/comments
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trip_id, author_name, content } = body;

    if (!trip_id || !author_name || !content) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    // 内容长度校验
    if (author_name.length > 50) {
      return NextResponse.json({ error: "昵称不能超过50字" }, { status: 400 });
    }
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

    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("comments")
      .insert({ trip_id, author_name, content })
      .select()
      .single();

    if (error) {
      console.error("Comment insert error:", error);
      return NextResponse.json({ error: "评论提交失败" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
