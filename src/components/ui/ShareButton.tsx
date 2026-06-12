"use client";

import { Share2 } from "lucide-react";

interface ShareButtonProps {
  title: string;
  text: string;
}

export function ShareButton({ title, text }: ShareButtonProps) {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title,
        text,
        url: window.location.href,
      }).catch(() => {});
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm"
    >
      <Share2 size={14} />
      分享
    </button>
  );
}
