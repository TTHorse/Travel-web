"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-20">
      <h1 className="text-2xl font-bold mb-4">出了点问题</h1>
      <p className="text-white/50 mb-6 text-center max-w-md">
        页面加载遇到了错误，请刷新后重试。
      </p>
      <button
        onClick={() => reset()}
        className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-white/90 transition-colors"
      >
        重试
      </button>
    </div>
  );
}
