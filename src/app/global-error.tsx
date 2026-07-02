"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html>
      <body className="bg-black text-white">
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold mb-4">出了点问题</h1>
          <p className="text-white/50 mb-6 text-center max-w-md">
            页面加载遇到了错误，请刷新后重试。
          </p>
          <button
            onClick={() => unstable_retry()}
            className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-white/90 transition-colors"
          >
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
