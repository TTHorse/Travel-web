"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function UserTabs() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTab = searchParams.get("tab") || "trips";

  const tabs = [
    { key: "trips", label: "游记" },
    { key: "favorites", label: "收藏" },
  ] as const;

  // Build URLs with pathname to avoid navigation issues
  const handleTabClick = (tabKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tabKey === "trips") {
      params.delete("tab");
    } else {
      params.set("tab", tabKey);
    }
    const queryStr = params.toString();
    window.location.href = pathname + (queryStr ? `?${queryStr}` : "");
  };

  return (
    <div className="flex gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleTabClick(tab.key)}
          className={cn(
            "px-4 py-2 rounded-full text-sm transition-colors",
            currentTab === tab.key
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/70"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
