"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TripSummary } from "@/types/trip";

interface TripFiltersProps {
  trips: TripSummary[];
}

export function TripFilters({ trips }: TripFiltersProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // 收集所有标签并计数
  const tagCounts: Record<string, number> = {};
  trips.forEach((trip) => {
    trip.tags?.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  if (sortedTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <button
        onClick={() => setActiveTag(null)}
        className={cn(
          "px-3 py-1.5 rounded-full text-sm transition-colors",
          activeTag === null
            ? "bg-white text-black"
            : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
        )}
      >
        全部
      </button>
      {sortedTags.map(([tag, count]) => (
        <button
          key={tag}
          onClick={() => setActiveTag(tag === activeTag ? null : tag)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm transition-colors",
            tag === activeTag
              ? "bg-white text-black"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          )}
        >
          {tag} ({count})
        </button>
      ))}
    </div>
  );
}
