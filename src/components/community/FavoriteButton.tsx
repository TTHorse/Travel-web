"use client";

import { useState, useCallback } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  tripId: string;
  initialFavorited: boolean;
  initialCount: number;
  loggedIn: boolean;
  onLoginRequired?: () => void;
}

export function FavoriteButton({
  tripId,
  initialFavorited,
  initialCount,
  loggedIn,
  onLoginRequired,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    if (!loggedIn) {
      onLoginRequired?.();
      return;
    }

    if (loading) return;
    setLoading(true);

    // 乐观更新
    const prevFavorited = favorited;
    const prevCount = count;
    setFavorited(!favorited);
    setCount(favorited ? count - 1 : count + 1);

    try {
      const method = prevFavorited ? "DELETE" : "POST";
      const res = await fetch(
        `/api/community/trips/${tripId}/favorite`,
        { method }
      );
      if (!res.ok) {
        // 回滚
        setFavorited(prevFavorited);
        setCount(prevCount);
      }
    } catch {
      // 回滚
      setFavorited(prevFavorited);
      setCount(prevCount);
    }

    setLoading(false);
  }, [tripId, favorited, count, loading, loggedIn, onLoginRequired]);

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all",
        favorited
          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-400/30"
          : "bg-white/5 text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70"
      )}
    >
      <Star
        size={16}
        className={cn(
          "transition-all",
          favorited && "fill-current"
        )}
      />
      <span>{count}</span>
    </button>
  );
}
