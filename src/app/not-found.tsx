import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-20">
      <h1 className="text-6xl font-bold text-white/20 mb-4">404</h1>
      <h2 className="text-xl font-semibold mb-2">页面未找到</h2>
      <p className="text-white/40 mb-8 text-center max-w-md">
        你访问的页面不存在或已被移除。
      </p>
      <Link
        href="/"
        className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-white/90 transition-colors"
      >
        返回首页
      </Link>
    </div>
  );
}
