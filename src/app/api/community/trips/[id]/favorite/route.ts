import { createServerSupabase } from "@/lib/supabase/server";
import { toggleFavorite } from "@/lib/data/favorites";
import { NextResponse } from "next/server";

// POST /api/community/trips/[id]/favorite — 收藏
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

    const result = await toggleFavorite(user.id, tripId);
    return NextResponse.json({ favorited: result.favorited });
  } catch (err) {
    console.error("Favorite API error:", err);
    const message = err instanceof Error ? err.message : "操作失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/community/trips/[id]/favorite — 取消收藏
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

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("trip_id", tripId);

    if (error) {
      console.error("Unfavorite error:", error);
      return NextResponse.json({ error: "取消收藏失败" }, { status: 500 });
    }

    return NextResponse.json({ favorited: false });
  } catch (err) {
    console.error("Unfavorite API error:", err);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
