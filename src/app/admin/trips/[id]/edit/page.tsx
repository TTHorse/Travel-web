import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TripForm } from "@/components/admin/TripForm";
import type { Trip } from "@/types/trip";

export const dynamic = "force-dynamic";

interface EditTripPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTripPage({ params }: EditTripPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: trip } = await supabase
    .from("trips")
    .select("*, map_points (*)")
    .eq("id", id)
    .single();

  if (!trip) {
    notFound();
  }

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">编辑行程</h1>
      <p className="text-white/40 text-sm mb-8">正在编辑「{trip.title}」</p>
      <TripForm initialData={trip as unknown as Trip} isEdit />
    </div>
  );
}
