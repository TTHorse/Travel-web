"use client";

import { useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  tripId: string;
  initialLiked: boolean;
  initialCount: number;
  loggedIn: boolean;
  onLoginRequired?: () => void;
}

export function LikeButton({
  tripId,
  initialLiked,
  initialCount,
  loggedIn,
  onLoginRequired,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
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
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    try {
      const method = prevLiked ? "DELETE" : "POST";
      const res = await fetch(`/api/community/trips/${tripId}/like`, { method });
      if (!res.ok) {
        // 回滚
        setLiked(prevLiked);
        setCount(prevCount);
      }
    } catch {
      // 回滚
      setLiked(prevLiked);
      setCount(prevCount);
    }

    setLoading(false);
  }, [tripId, liked, count, loading, loggedIn, onLoginRequired]);

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all",
        liked
          ? "bg-red-500/10 text-red-400 border border-red-400/30"
          : "bg-white/5 text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70"
      )}
    >
      <Heart
        size={16}
        className={cn(
          "transition-all",
          liked && "fill-current"
        )}
      />
      <span>{count}</span>
    </button>
  );
}
