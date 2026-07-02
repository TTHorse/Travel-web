import { createServerSupabase } from "@/lib/supabase/server";
import { TripList } from "@/components/admin/TripList";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminTripsPage() {
  const supabase = await createServerSupabase();

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">行程管理</h1>
          <p className="text-white/40 text-sm mt-1">
            共 {trips?.length ?? 0} 条行程记录
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

      <TripList trips={(trips ?? []) as Parameters<typeof TripList>[0]["trips"]} />
    </div>
  );
}
