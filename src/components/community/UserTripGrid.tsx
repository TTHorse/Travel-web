import { TripCard } from "@/components/trip/TripCard";
import type { TripSummary } from "@/types/trip";

interface UserTripGridProps {
  trips: TripSummary[];
  emptyMessage?: string;
}

export function UserTripGrid({
  trips,
  emptyMessage = "还没有游记",
}: UserTripGridProps) {
  if (trips.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-white/30 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}
