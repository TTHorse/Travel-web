"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { Pencil, Trash2, ExternalLink, Loader2, Eye, EyeOff } from "lucide-react";
import type { Trip } from "@/types/trip";

interface TripListProps {
  trips: Trip[];
}

export function TripList({ trips: initialTrips }: TripListProps) {
  const router = useRouter();
  const [trips, setTrips] = useState(initialTrips);
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const res = await fetch("/api/trips", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      if (!res.ok) throw new Error("删除失败");

      setTrips((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
      router.refresh();
    } catch {
      alert("删除失败，请重试");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, router]);

  if (trips.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-white/30 mb-4">还没有任何旅行记录</p>
        <button
          onClick={() => router.push("/admin/trips/new")}
          className="bg-orange-500 text-white px-6 py-2 rounded-full font-medium hover:bg-orange-400 transition-colors"
        >
          创建第一条旅行记录
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5">
              <th className="py-3 pr-4 text-xs font-medium text-white/30 uppercase tracking-wider">
                标题
              </th>
              <th className="py-3 px-4 text-xs font-medium text-white/30 uppercase tracking-wider hidden md:table-cell">
                目的地
              </th>
              <th className="py-3 px-4 text-xs font-medium text-white/30 uppercase tracking-wider hidden sm:table-cell">
                日期
              </th>
              <th className="py-3 px-4 text-xs font-medium text-white/30 uppercase tracking-wider">
                状态
              </th>
              <th className="py-3 pl-4 text-xs font-medium text-white/30 uppercase tracking-wider text-right">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {trips.map((trip) => (
              <tr
                key={trip.id}
                className="group hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    {trip.cover_image && (
                      <img
                        src={trip.cover_image}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{trip.title}</p>
                      <p className="text-xs text-white/30 font-mono">{trip.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-white/60 hidden md:table-cell">
                  {trip.destination}，{trip.country}
                </td>
                <td className="py-3 px-4 text-sm text-white/40 hidden sm:table-cell">
                  {formatDate(trip.start_date, "yyyy.MM.dd")}
                  {trip.end_date && trip.end_date !== trip.start_date
                    ? ` - ${formatDate(trip.end_date, "MM.dd")}`
                    : ""}
                </td>
                <td className="py-3 px-4">
                  {trip.is_published ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                      <Eye size={12} />
                      已发布
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                      <EyeOff size={12} />
                      草稿
                    </span>
                  )}
                </td>
                <td className="py-3 pl-4">
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={`/trips/${trip.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
                      aria-label="预览"
                      title="预览"
                    >
                      <ExternalLink size={16} />
                    </a>
                    <button
                      onClick={() => router.push(`/admin/trips/${trip.id}/edit`)}
                      className="p-2 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
                      aria-label="编辑"
                      title="编辑"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(trip)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                      aria-label="删除"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 删除确认弹窗 */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="确认删除"
      >
        <p className="text-white/60 text-sm mb-2">
          确定要删除 <span className="text-white font-medium">「{deleteTarget?.title}」</span> 吗？
        </p>
        <p className="text-red-400/70 text-xs mb-6">
          此操作不可撤销，关联的照片、评论和地图标记点也将一并删除。
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            className="px-4 py-2 rounded-full text-sm text-white/50 hover:text-white transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm bg-red-500 text-white hover:bg-red-400 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {deleting ? "删除中..." : "确认删除"}
          </button>
        </div>
      </Modal>
    </>
  );
}
