import { Skeleton } from "@/components/ui/Skeleton";

export default function CommunityLoading() {
  return (
    <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
      <Skeleton className="h-10 w-48 mb-4" />
      <Skeleton className="h-5 w-64 mb-8" />

      {/* Tabs skeleton */}
      <div className="flex gap-1 mb-8">
        <Skeleton className="h-10 w-20 rounded-full" />
        <Skeleton className="h-10 w-20 rounded-full" />
      </div>

      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
