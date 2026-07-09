import { createServerSupabase } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/data/profiles";
import { notFound, redirect } from "next/navigation";
import { TripForm } from "@/components/admin/TripForm";
import type { Trip } from "@/types/trip";

export const dynamic = "force-dynamic";

interface EditTripPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTripPage({ params }: EditTripPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const admin = await isAdmin();

  const { data: trip } = await supabase
    .from("trips")
    .select("*, map_points (*)")
    .eq("id", id)
    .single();

  if (!trip) {
    notFound();
  }

  // 验证所有权 — 仅所有者和管理员可编辑
  if (!admin && trip.user_id !== user.id) {
    redirect("/admin/trips");
  }

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">编辑行程</h1>
      <p className="text-white/40 text-sm mb-8">
        正在编辑「{trip.title}」
        {admin && trip.user_id !== user.id && (
          <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
            其他用户的行程
          </span>
        )}
      </p>
      <TripForm initialData={trip as unknown as Trip} isEdit />
    </div>
  );
}
