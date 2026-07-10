"use client";

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto text-center">
      <h1 className="text-2xl font-bold text-white mb-4">加载失败</h1>
      <p className="text-white/50 mb-8">社区页面暂时不可用，请稍后再试</p>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors"
      >
        重试
      </button>
    </div>
  );
}
