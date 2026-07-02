import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { GalleryManager } from "@/components/admin/GalleryManager";
import type { Photo } from "@/types/photo";

export const metadata: Metadata = {
  title: "画廊管理 - 管理后台",
};

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // 并行查询 photos 和 trips
  const [{ data: photos }, { data: trips }] = await Promise.all([
    supabase.from("photos").select("*").order("sort_order"),
    supabase.from("trips").select("id, title").order("created_at", { ascending: false }),
  ]);

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">画廊管理</h1>

      <GalleryManager
        photos={(photos ?? []) as Photo[]}
        trips={trips ?? []}
      />
    </div>
  );
}
