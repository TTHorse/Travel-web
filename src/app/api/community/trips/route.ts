import { NextResponse } from "next/server";
import { getCommunityTrips } from "@/lib/data/community";

// GET /api/community/trips?sort=newest|hottest&page=1
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sort = (searchParams.get("sort") as "newest" | "hottest") || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  try {
    const trips = await getCommunityTrips(sort, page);
    return NextResponse.json({ data: trips });
  } catch (err) {
    console.error("Community trips API error:", err);
    return NextResponse.json({ error: "获取社区游记失败" }, { status: 500 });
  }
}
