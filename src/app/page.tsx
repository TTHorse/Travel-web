import { Suspense } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsCounter } from "@/components/home/StatsCounter";
import { RecentTrips } from "@/components/home/RecentTrips";
import { Skeleton } from "@/components/ui/Skeleton";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Suspense
        fallback={<Skeleton className="h-32 max-w-4xl mx-auto my-20" />}
      >
        <StatsCounter />
      </Suspense>
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 py-16">
            <Skeleton className="h-8 w-48 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="aspect-[4/3]" />
              <Skeleton className="aspect-[4/3]" />
              <Skeleton className="aspect-[4/3]" />
            </div>
          </div>
        }
      >
        <RecentTrips />
      </Suspense>
    </>
  );
}
