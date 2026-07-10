import { createServerSupabase } from "@/lib/supabase/server";
import { toggleLike } from "@/lib/data/likes";
import { NextResponse } from "next/server";

// POST /api/community/trips/[id]/like — 点赞
export async function POST(
  _request: Request,
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

    const result = await toggleLike(user.id, tripId);
    return NextResponse.json({ liked: result.liked });
  } catch (err) {
    console.error("Like API error:", err);
    const message = err instanceof Error ? err.message : "操作失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/community/trips/[id]/like — 取消点赞
export async function DELETE(
  _request: Request,
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

    // 直接删除
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("trip_id", tripId);

    if (error) {
      console.error("Unlike error:", error);
      return NextResponse.json({ error: "取消点赞失败" }, { status: 500 });
    }

    return NextResponse.json({ liked: false });
  } catch (err) {
    console.error("Unlike API error:", err);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
