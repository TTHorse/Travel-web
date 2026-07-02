"use client";

import { useEffect, useState } from "react";
import { CategoriesSection } from "./CategoriesSection";
import { Skeleton } from "@/components/ui/Skeleton";

export function CategoriesSectionWrapper() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <Skeleton className="h-64 my-12" />;
  return <CategoriesSection />;
}
