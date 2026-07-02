"use client";

import { useEffect } from "react";

export default function TripsErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Trips page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-20">
      <h1 className="text-2xl font-bold mb-4">旅行页面加载失败</h1>
      <p className="text-white/50 mb-2 text-center max-w-md">
        旅行详情无法正常显示，请稍后重试。
      </p>
      <p className="text-white/20 text-xs mb-6 text-center max-w-md">
        {error.message}
      </p>
      <button
        onClick={() => unstable_retry()}
        className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-white/90 transition-colors"
      >
        重试
      </button>
    </div>
  );
}
