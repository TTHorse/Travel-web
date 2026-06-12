export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 py-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-white/40 text-sm">
          &copy; {year} 我的旅行记录
        </p>
        <p className="text-white/30 text-xs">
          Built with Next.js &middot; Deployed on Vercel
        </p>
      </div>
    </footer>
  );
}
