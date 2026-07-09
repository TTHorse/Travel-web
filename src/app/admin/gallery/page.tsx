import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/data/profiles";
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

  const admin = await isAdmin();

  // 管理员：使用 service_role 查询所有 photos 和 trips
  // 普通用户：通过 RLS 自动过滤（trips.user_id = user.id）
  const serviceSupabase = admin ? await createServiceSupabase() : null;

  const photosPromise = admin && serviceSupabase
    ? serviceSupabase.from("photos").select("*").order("sort_order")
    : supabase.from("photos").select("*").order("sort_order");

  const tripsPromise = admin && serviceSupabase
    ? serviceSupabase.from("trips").select("id, title").order("created_at", { ascending: false })
    : supabase.from("trips").select("id, title").order("created_at", { ascending: false });

  const [{ data: photos }, { data: trips }] = await Promise.all([
    photosPromise,
    tripsPromise,
  ]);

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">
        画廊管理
        {admin && (
          <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full align-middle">
            管理员
          </span>
        )}
      </h1>

      <GalleryManager
        photos={(photos ?? []) as Photo[]}
        trips={trips ?? []}
      />
    </div>
  );
}
