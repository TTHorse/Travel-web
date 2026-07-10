import { Skeleton } from "@/components/ui/Skeleton";

export default function UserProfileLoading() {
  return (
    <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
      {/* User hero skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-6">
          <Skeleton className="h-12 w-16" />
          <Skeleton className="h-12 w-16" />
          <Skeleton className="h-12 w-16" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-1 mt-10 mb-8">
        <Skeleton className="h-10 w-16 rounded-full" />
        <Skeleton className="h-10 w-16 rounded-full" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
