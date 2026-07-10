import { Skeleton } from "@/components/ui/Skeleton";

export default function CommunityTripDetailLoading() {
  return (
    <div>
      {/* Cover skeleton */}
      <Skeleton className="h-[60vh] min-h-[400px] w-full" />

      {/* Author card skeleton */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
