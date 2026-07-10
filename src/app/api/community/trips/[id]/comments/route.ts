import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createComment } from "@/lib/data/comments";

// GET /api/community/trips/[id]/comments — 获取评论列表
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tripId } = await params;

  try {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("trip_id", tripId)
      .eq("is_approved", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Comments fetch error:", error);
      return NextResponse.json({ error: "获取评论失败" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Comments API error:", err);
    return NextResponse.json({ error: "获取评论失败" }, { status: 500 });
  }
}

// POST /api/community/trips/[id]/comments — 发表评论
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tripId } = await params;

  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
    }

    const { content, parent_id } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "评论内容不能为空" }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "评论不能超过2000字" }, { status: 400 });
    }

    const result = await createComment(tripId, user.id, content.trim(), parent_id ?? null);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "评论发表失败" }, { status: 500 });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (err) {
    console.error("Comment create error:", err);
    return NextResponse.json({ error: "评论发表失败" }, { status: 500 });
  }
}
