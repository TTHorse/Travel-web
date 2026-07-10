import { NextResponse } from "next/server";
import { getUserProfile, getUserPublishedTrips } from "@/lib/data/users";

// GET /api/users/[id] — 用户主页信息 + 游记列表
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;

  try {
    const profile = await getUserProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const trips = await getUserPublishedTrips(userId);

    return NextResponse.json({
      data: {
        profile,
        trips,
      },
    });
  } catch (err) {
    console.error("User profile API error:", err);
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 });
  }
}
