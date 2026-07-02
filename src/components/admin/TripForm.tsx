"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CloudinaryUpload } from "./CloudinaryUpload";
import { MapPointsEditor } from "./MapPointsEditor";
import { Loader2, Save, Eye, EyeOff, ArrowLeft } from "lucide-react";
import type { Trip } from "@/types/trip";
import type { MapPoint } from "@/types/map";

interface TripFormProps {
  initialData?: Trip;
  isEdit: boolean;
}

type FormData = {
  title: string;
  slug: string;
  destination: string;
  country: string;
  cover_image: string;
  description: string;
  content: string;
  start_date: string;
  end_date: string;
  tags: string;
  is_published: boolean;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function TripForm({ initialData, isEdit }: TripFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mapPoints, setMapPoints] = useState<MapPoint[]>(
    initialData?.map_points ?? []
  );

  const [form, setForm] = useState<FormData>({
    title: initialData?.title ?? "",
    slug: initialData?.slug ?? "",
    destination: initialData?.destination ?? "",
    country: initialData?.country ?? "",
    cover_image: initialData?.cover_image ?? "",
    description: initialData?.description ?? "",
    content: initialData?.content ?? "",
    start_date: initialData?.start_date ?? "",
    end_date: initialData?.end_date ?? "",
    tags: initialData?.tags?.join(", ") ?? "",
    is_published: initialData?.is_published ?? false,
  });

  function updateField(field: keyof FormData, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      // 新建时：title 变化自动生成 slug（仅当 slug 未手动修改过）
      if (field === "title" && !isEdit) {
        const expectedSlug = slugify(prev.title);
        if (prev.slug === "" || prev.slug === expectedSlug || prev.slug === slugify(form.title)) {
          next.slug = slugify(value as string);
        }
      }

      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.slug.trim() || !form.destination.trim() || !form.country.trim()) {
      setError("标题、Slug、目的地和国家为必填项");
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      tags: form.tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      map_points: mapPoints.map((p, i) => ({
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        type: p.type,
        sort_order: i,
      })),
    };

    const supabase = createClient();
    if (!supabase) return;
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    const url = isEdit ? `/api/trips` : `/api/trips`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(isEdit ? { id: initialData!.id, ...payload } : payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "请求失败" }));
      setError(body.error || "保存失败");
      setSaving(false);
      return;
    }

    router.push("/admin/trips");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft size={16} />
          返回
        </button>

        <div className="flex items-center gap-3">
          {/* 发布状态切换 */}
          <button
            type="button"
            onClick={() => updateField("is_published", !form.is_published)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              form.is_published
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-white/40 border border-white/10"
            }`}
          >
            {form.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
            {form.is_published ? "已发布" : "草稿"}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2 rounded-full font-medium hover:bg-orange-400 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* 基本信息 */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white">基本信息</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/50 mb-1.5">标题 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="旅行标题"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">Slug *</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              placeholder="url-friendly-slug"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">目的地 *</label>
            <input
              type="text"
              value={form.destination}
              onChange={(e) => updateField("destination", e.target.value)}
              placeholder="如：大理"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">国家 *</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              placeholder="如：中国"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">开始日期</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => updateField("start_date", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500/50 transition-colors [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">结束日期</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => updateField("end_date", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500/50 transition-colors [color-scheme:dark]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/50 mb-1.5">封面图</label>
          <CloudinaryUpload
            value={form.cover_image}
            onChange={(url) => updateField("cover_image", url)}
          />
        </div>

        <div>
          <label className="block text-sm text-white/50 mb-1.5">简介</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="简短描述，用于列表卡片展示"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-white/50 mb-1.5">标签</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => updateField("tags", e.target.value)}
            placeholder="多个标签用逗号分隔，如：自驾, 美食, 古镇"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>
      </section>

      {/* 正文 */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white">正文内容（Markdown）</h3>
        <textarea
          value={form.content}
          onChange={(e) => updateField("content", e.target.value)}
          placeholder="支持 Markdown 格式..."
          rows={20}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors font-mono text-sm resize-y"
        />
      </section>

      {/* 地图标记点 */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white">地图标记点</h3>
        <MapPointsEditor value={mapPoints} onChange={setMapPoints} />
      </section>

      {/* 底部保存按钮 */}
      <div className="flex justify-end pt-4 border-t border-white/5">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-full font-medium hover:bg-orange-400 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? "保存中..." : isEdit ? "更新行程" : "创建行程"}
        </button>
      </div>
    </form>
  );
}
