import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import { PhotoGallery } from "@/components/gallery/PhotoGallery";
import type { Photo } from "@/types/photo";

export const metadata: Metadata = {
  title: "图片画廊",
  description: "浏览所有旅行照片",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const supabase = await createServerSupabase();

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .order("sort_order");

  return (
    <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">图片画廊</h1>
      <p className="text-white/50 mb-8">每一张照片，都是旅途的见证</p>

      {!photos || photos.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/30 text-lg">暂无照片</p>
          <p className="text-white/15 text-sm mt-2">
            照片将通过管理后台上传展示
          </p>
        </div>
      ) : (
        <PhotoGallery photos={photos as Photo[]} />
      )}
    </div>
  );
}
