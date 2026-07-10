"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function CommunityTabs() {
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "newest";

  const tabs = [
    { key: "newest", label: "最新" },
    { key: "hottest", label: "最热" },
  ] as const;

  return (
    <div className="flex gap-1 mb-8">
      {tabs.map((tab) => {
        const isActive = currentSort === tab.key;
        const href = tab.key === "newest" ? "/community" : `/community?sort=${tab.key}`;

        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              "px-4 py-2 rounded-full text-sm transition-colors",
              isActive
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
