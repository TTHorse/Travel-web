"use client";

import { useEffect, useState } from "react";
import { HeroSection } from "./HeroSection";
import { Skeleton } from "@/components/ui/Skeleton";

export function HeroSectionWrapper() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <Skeleton className="h-screen" />;
  return <HeroSection />;
}
