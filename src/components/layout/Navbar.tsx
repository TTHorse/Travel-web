"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";
import { MobileMenu } from "./MobileMenu";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const pathname = usePathname();

  // 滚动检测
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 路由切换时关闭移动菜单
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // 检查登录状态
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const isHome = pathname === "/";

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 z-40 w-full transition-all duration-500",
          scrolled || !isHome
            ? "bg-black/80 backdrop-blur-xl border-b border-white/10"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="text-lg font-bold text-white tracking-tight">
              我的旅行
            </Link>

            {/* 桌面端导航 */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm transition-colors",
                    pathname === link.href
                      ? "text-white bg-white/10"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {/* 登录按钮（未登录时可见） */}
              {!loggedIn && (
                <Link
                  href="/admin/login"
                  className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-white/70 hover:text-white border border-white/20 hover:border-white/40 transition-colors"
                >
                  <LogIn size={15} />
                  登录
                </Link>
              )}

              {/* 控制台按钮（仅登录后可见） */}
              {loggedIn && (
                <Link
                  href="/admin"
                  className="ml-2 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-orange-400 border border-orange-400/30 hover:bg-orange-400/10 transition-colors"
                >
                  <LayoutDashboard size={15} />
                  控制台
                </Link>
              )}
            </div>

            {/* 移动端汉堡按钮 */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -mr-2 text-white/70 hover:text-white"
              aria-label="打开菜单"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* 移动端菜单 */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        loggedIn={loggedIn}
      />
    </>
  );
}
