import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/data/profiles";

// GET /api/trips — 公开：获取已发布的行程列表
export async function GET() {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("trips")
    .select("*, photos (*)")
    .eq("is_published", true)
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Trips API error:", error);
    return NextResponse.json({ error: "获取旅行数据失败" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/trips — 需认证：创建行程
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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
    }

    const {
      title, slug, destination, country,
      cover_image, description, content,
      start_date, end_date, tags,
      is_published, map_points,
    } = body;

    if (!title || !slug || !destination || !country) {
      return NextResponse.json({ error: "标题、Slug、目的地和国家为必填项" }, { status: 400 });
    }

    // 检查 slug 唯一性
    const { data: existing, error: slugError } = await supabase
      .from("trips")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugError) {
      console.error("Slug check error:", slugError);
      return NextResponse.json({ error: `数据库错误: ${slugError.message}` }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ error: `Slug "${slug}" 已被使用，请换一个` }, { status: 409 });
    }

    // 创建 trip — 包含 user_id
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({
        title,
        slug,
        destination,
        country,
        cover_image: cover_image || null,
        description: description || null,
        content: content || null,
        start_date: start_date || null,
        end_date: end_date || null,
        tags: tags || [],
        is_published: is_published ?? false,
        user_id: user.id,
      })
      .select()
      .single();

    if (tripError) {
      console.error("Trip create error:", tripError);
      return NextResponse.json({ error: `创建失败: ${tripError.message}` }, { status: 500 });
    }

    // 创建关联的 map_points
    if (map_points && Array.isArray(map_points) && map_points.length > 0) {
      const pointsToInsert = map_points.map((p: Record<string, unknown>) => ({
        trip_id: trip.id,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        type: p.type || "visited",
        sort_order: p.sort_order || 0,
      }));

      const { error: pointsError } = await supabase.from("map_points").insert(pointsToInsert);

      if (pointsError) {
        console.error("Map points insert error:", pointsError);
      }
    }

    return NextResponse.json({ data: trip }, { status: 201 });
  } catch (err) {
    console.error("POST /api/trips unexpected error:", err);
    const message = err instanceof Error ? err.message : "服务器内部错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/trips — 需认证：更新行程
export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
    }

    const {
      id, title, slug, destination, country,
      cover_image, description, content,
      start_date, end_date, tags,
      is_published, map_points,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少行程 ID" }, { status: 400 });
    }

    // 验证所有权 — 检查 trip 是否属于当前用户或当前用户是管理员
    const admin = await isAdmin();
    const { data: existingTrip, error: fetchError } = await supabase
      .from("trips")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existingTrip) {
      return NextResponse.json({ error: "行程不存在" }, { status: 404 });
    }

    if (!admin && existingTrip.user_id !== user.id) {
      return NextResponse.json({ error: "无权编辑此行程" }, { status: 403 });
    }

    if (!title || !slug || !destination || !country) {
      return NextResponse.json({ error: "标题、Slug、目的地和国家为必填项" }, { status: 400 });
    }

    // 检查 slug 唯一性（排除自身）
    const { data: existing, error: slugError } = await supabase
      .from("trips")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();

    if (slugError) {
      console.error("Slug check error:", slugError);
      return NextResponse.json({ error: `数据库错误: ${slugError.message}` }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ error: `Slug "${slug}" 已被使用，请换一个` }, { status: 409 });
    }

    // 更新 trip（不更新 user_id — 所有权不可变）
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .update({
        title,
        slug,
        destination,
        country,
        cover_image: cover_image || null,
        description: description || null,
        content: content || null,
        start_date: start_date || null,
        end_date: end_date || null,
        tags: tags || [],
        is_published: is_published ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (tripError) {
      console.error("Trip update error:", tripError);
      return NextResponse.json({ error: `更新失败: ${tripError.message}` }, { status: 500 });
    }

    // 更新 map_points：先删后插
    if (map_points !== undefined) {
      await supabase.from("map_points").delete().eq("trip_id", id);

      if (Array.isArray(map_points) && map_points.length > 0) {
        const pointsToInsert = map_points.map((p: Record<string, unknown>) => ({
          trip_id: id,
          name: p.name,
          latitude: p.latitude,
          longitude: p.longitude,
          type: p.type || "visited",
          sort_order: p.sort_order || 0,
        }));

        await supabase.from("map_points").insert(pointsToInsert);
      }
    }

    return NextResponse.json({ data: trip });
  } catch (err) {
    console.error("PUT /api/trips unexpected error:", err);
    const message = err instanceof Error ? err.message : "服务器内部错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/trips — 需认证：删除行程
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
    }

    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少行程 ID" }, { status: 400 });
    }

    // 验证所有权
    const admin = await isAdmin();
    const { data: existingTrip } = await supabase
      .from("trips")
      .select("user_id")
      .eq("id", id)
      .maybeSingle();

    if (!existingTrip) {
      return NextResponse.json({ error: "行程不存在" }, { status: 404 });
    }

    if (!admin && existingTrip.user_id !== user.id) {
      return NextResponse.json({ error: "无权删除此行程" }, { status: 403 });
    }

    // 级联删除：先删关联数据
    await supabase.from("map_points").delete().eq("trip_id", id);
    await supabase.from("photos").delete().eq("trip_id", id);
    await supabase.from("comments").delete().eq("trip_id", id);

    const { error } = await supabase.from("trips").delete().eq("id", id);

    if (error) {
      console.error("Trip delete error:", error);
      return NextResponse.json({ error: `删除失败: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/trips unexpected error:", err);
    const message = err instanceof Error ? err.message : "服务器内部错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
