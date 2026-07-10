import { NextResponse } from "next/server";
import { getUserFavoritedTrips } from "@/lib/data/users";

// GET /api/users/[id]/favorites — 用户收藏列表
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;

  try {
    const trips = await getUserFavoritedTrips(userId);
    return NextResponse.json({ data: trips });
  } catch (err) {
    console.error("User favorites API error:", err);
    return NextResponse.json({ error: "获取收藏列表失败" }, { status: 500 });
  }
}
