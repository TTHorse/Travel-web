import { Skeleton } from "@/components/ui/Skeleton";

export default function TripLoading() {
  return (
    <div>
      <Skeleton className="h-[60vh] min-h-[400px] w-full" />
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
