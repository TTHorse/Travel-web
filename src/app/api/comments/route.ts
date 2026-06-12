import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/comments?trip_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get("trip_id");

  if (!tripId) {
    return NextResponse.json(
      { error: "Missing trip_id parameter" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("trip_id", tripId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/comments
export async function POST(request: Request) {
  try {
    const { trip_id, author_name, content } = await request.json();

    if (!trip_id || !author_name || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("comments")
      .insert({ trip_id, author_name, content })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
