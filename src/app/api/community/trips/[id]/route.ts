import { createServerSupabase } from "@/lib/supabase/server";
import { getCommunityTripBySlug } from "@/lib/data/community";
import { NextResponse } from "next/server";

// GET /api/community/trips/[id] — 获取游记详情 + 互动计数 + 用户互动状态
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const trip = await getCommunityTripBySlug(id, user?.id);

    if (!trip) {
      return NextResponse.json({ error: "游记不存在" }, { status: 404 });
    }

    return NextResponse.json({ data: trip });
  } catch (err) {
    console.error("Community trip detail API error:", err);
    return NextResponse.json({ error: "获取游记详情失败" }, { status: 500 });
  }
}
