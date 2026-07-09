import { createServerSupabase } from "@/lib/supabase/server";
import { getTripsByUser, getAllTripsAdmin } from "@/lib/data/trips";
import { isAdmin, getAllProfiles } from "@/lib/data/profiles";
import { TripList } from "@/components/admin/TripList";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Trip } from "@/types/trip";

export const dynamic = "force-dynamic";

interface AdminTripsPageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function AdminTripsPage({
  searchParams,
}: AdminTripsPageProps) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // 中间件处理重定向
  }

  const admin = await isAdmin();
  const { view } = await searchParams;
  const showMine = view === "mine";

  let trips: Trip[] = [];
  let ownerMap: Map<string, string> = new Map();

  if (admin) {
    if (showMine) {
      trips = await getTripsByUser(user.id);
    } else {
      trips = await getAllTripsAdmin();
      // 构建 user_id → display_name 映射（用于显示所有者）
      const profiles = await getAllProfiles();
      for (const p of profiles) {
        ownerMap.set(p.user_id, p.display_name ?? p.user_id.slice(0, 8) + "...");
      }
    }
  } else {
    // 普通用户 — 只能看自己的行程
    trips = await getTripsByUser(user.id);
  }

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">行程管理</h1>
          <p className="text-white/40 text-sm mt-1">
            共 {trips.length} 条行程记录
            {admin && !showMine && "（全部用户）"}
            {(admin && showMine) && "（我的行程）"}
          </p>
        </div>
        <Link
          href="/admin/trips/new"
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full font-medium hover:bg-orange-400 transition-colors text-sm"
        >
          <Plus size={18} />
          新建行程
        </Link>
      </div>

      {/* 管理员标签页切换 */}
      {admin && (
        <div className="flex gap-1 mb-6">
          <Link
            href="/admin/trips"
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              !showMine
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            所有行程
          </Link>
          <Link
            href="/admin/trips?view=mine"
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              showMine
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            我的行程
          </Link>
        </div>
      )}

      <TripList
        trips={trips}
        isAdmin={admin && !showMine}
        ownerMap={admin && !showMine ? Object.fromEntries(ownerMap) : undefined}
      />
    </div>
  );
}
