"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { Loader2, Trash2, Upload, ImageIcon, AlertTriangle } from "lucide-react";
import type { Photo } from "@/types/photo";

interface TripInfo {
  id: string;
  title: string;
}

interface GalleryManagerProps {
  photos: Photo[];
  trips: TripInfo[];
}

export function GalleryManager({ photos: initialPhotos, trips }: GalleryManagerProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);

  function getTripTitle(tripId: string): string {
    return trips.find((t) => t.id === tripId)?.title || "未知行程";
  }

  async function handleUpload() {
    if (!selectedTripId || !uploadUrl) {
      setError("请选择行程并上传图片");
      return;
    }

    setError("");
    setSaving(true);

    const supabase = createClient();
    if (!supabase) {
      setError("无法连接数据库");
      setSaving(false);
      return;
    }

    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    const res = await fetch("/api/photos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        trip_id: selectedTripId,
        url: uploadUrl,
        cloudinary_id: "",
        caption: caption || null,
        width: 0,
        height: 0,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "上传失败" }));
      setError(body.error || "上传失败");
      setSaving(false);
      return;
    }

    const { data: newPhoto } = await res.json();

    setPhotos((prev) => [...prev, newPhoto]);
    setUploadUrl("");
    setCaption("");
    setSelectedTripId("");
    setShowUploadForm(false);
    setSaving(false);
    router.refresh();
  }

  async function handleDelete(photoId: string) {
    setDeleting(photoId);

    const supabase = createClient();
    if (!supabase) return;

    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    const res = await fetch("/api/photos", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ id: photoId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "删除失败" }));
      setError(body.error || "删除失败");
      setDeleting(null);
      return;
    }

    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-sm mt-1">
            共 {photos.length} 张照片
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-colors ${
            showUploadForm
              ? "bg-white/10 text-white/60 hover:text-white"
              : "bg-orange-500 text-white hover:bg-orange-400"
          }`}
        >
          <Upload size={16} />
          {showUploadForm ? "取消上传" : "上传照片"}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle size={16} />
          {error}
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-400/60 hover:text-red-400"
          >
            ✕
          </button>
        </div>
      )}

      {/* 上传表单 */}
      {showUploadForm && (
        <div className="p-6 rounded-xl border border-dashed border-white/20 bg-white/[0.02] space-y-4">
          <h3 className="text-sm font-medium text-white/70">上传新照片</h3>

          {/* 行程选择 */}
          <div>
            <label className="block text-sm text-white/50 mb-1.5">
              关联行程 *
            </label>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500/50 transition-colors [color-scheme:dark]"
            >
              <option value="" disabled>
                请选择行程
              </option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title}
                </option>
              ))}
            </select>
          </div>

          {/* 图片上传 */}
          <div>
            <label className="block text-sm text-white/50 mb-1.5">图片 *</label>
            <CloudinaryUpload
              value={uploadUrl}
              onChange={(url) => setUploadUrl(url)}
            />
          </div>

          {/* 标题 */}
          <div>
            <label className="block text-sm text-white/50 mb-1.5">
              照片说明（可选）
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="照片描述..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* 提交 */}
          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={saving || !selectedTripId || !uploadUrl}
              className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2 rounded-full font-medium hover:bg-orange-400 transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {saving ? "上传中..." : "确认上传"}
            </button>
          </div>
        </div>
      )}

      {/* 照片网格 */}
      {photos.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <ImageIcon size={28} className="text-white/20" />
          </div>
          <p className="text-white/30 text-lg">暂无照片</p>
          <p className="text-white/15 text-sm mt-1">
            点击"上传照片"开始添加
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
            >
              {/* 图片 */}
              <div className="aspect-[4/3] relative">
                <Image
                  src={photo.thumbnail_url || photo.url}
                  alt={photo.caption || "照片"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>

              {/* 底部信息 */}
              <div className="p-3">
                <p className="text-white/70 text-sm truncate">
                  {photo.caption || "无描述"}
                </p>
                <p className="text-white/30 text-xs mt-0.5 truncate">
                  {getTripTitle(photo.trip_id)}
                </p>
              </div>

              {/* 悬停删除按钮 */}
              <button
                onClick={() => {
                  if (confirm("确定要删除这张照片吗？此操作不可撤销。")) {
                    handleDelete(photo.id);
                  }
                }}
                disabled={deleting === photo.id}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 disabled:opacity-50"
                aria-label="删除照片"
              >
                {deleting === photo.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
