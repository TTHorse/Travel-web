"use client";

import Link from "next/link";

export default function UserProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 404 友好的提示
  return (
    <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto text-center">
      <h1 className="text-4xl font-bold text-white mb-4">用户不存在</h1>
      <p className="text-white/50 mb-8">
        该用户可能已注销或 ID 不正确
      </p>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-colors"
        >
          重试
        </button>
        <Link
          href="/community"
          className="px-6 py-2.5 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors"
        >
          返回社区
        </Link>
      </div>
    </div>
  );
}
