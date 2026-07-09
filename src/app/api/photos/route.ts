import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/data/profiles";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get("trip_id");

  const supabase = await createServerSupabase();

  let query = supabase.from("photos").select("*").order("sort_order");

  if (tripId) {
    query = query.eq("trip_id", tripId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  // 验证登录
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { trip_id, url, cloudinary_id, caption, width, height } = body;

  if (!trip_id || !url) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  // 验证父 trip 所有权
  const admin = await isAdmin();
  const { data: parentTrip } = await supabase
    .from("trips")
    .select("user_id")
    .eq("id", trip_id)
    .maybeSingle();

  if (!parentTrip) {
    return NextResponse.json({ error: "关联行程不存在" }, { status: 404 });
  }

  if (!admin && parentTrip.user_id !== user.id) {
    return NextResponse.json({ error: "无权向此行程添加照片" }, { status: 403 });
  }

  // 获取当前最大 sort_order
  const { data: lastPhoto } = await supabase
    .from("photos")
    .select("sort_order")
    .eq("trip_id", trip_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (lastPhoto?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("photos")
    .insert({
      trip_id,
      url,
      cloudinary_id: cloudinary_id || "",
      caption: caption || null,
      width: width || 0,
      height: height || 0,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabase();

  // 验证登录
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "缺少照片 ID" }, { status: 400 });
  }

  // 验证所有权 — 通过 trip 级联
  const admin = await isAdmin();
  const { data: photo } = await supabase
    .from("photos")
    .select("trip_id")
    .eq("id", id)
    .maybeSingle();

  if (!photo) {
    return NextResponse.json({ error: "照片不存在" }, { status: 404 });
  }

  const { data: parentTrip } = await supabase
    .from("trips")
    .select("user_id")
    .eq("id", photo.trip_id)
    .maybeSingle();

  if (parentTrip && !admin && parentTrip.user_id !== user.id) {
    return NextResponse.json({ error: "无权删除此照片" }, { status: 403 });
  }

  const { error } = await supabase.from("photos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
