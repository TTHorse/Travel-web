import { TripForm } from "@/components/admin/TripForm";

export default function NewTripPage() {
  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">新建旅行</h1>
      <TripForm isEdit={false} />
    </div>
  );
}
