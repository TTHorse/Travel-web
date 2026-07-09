import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";
import { headers } from "next/headers";
import Link from "next/link";
import { LayoutDashboard, FileText, Plus, Image, Compass, Settings } from "lucide-react";
import { AdminLogoutButton } from "./logout-button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未登录时只渲染子页面（/login 页面），不显示侧边栏
  // 路由鉴权已由 middleware (proxy.ts) 处理
  if (!user) {
    return <>{children}</>;
  }

  // 读取用户角色（自动创建 profile — 如果不存在）
  const profile = await getCurrentProfile();
  const roleLabel = profile?.role === "admin" ? "管理员" : "用户";

  // 行程攻略页 — 独立全屏布局，无侧边栏
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  if (pathname.startsWith("/admin/guide")) {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/admin", label: "总览", icon: LayoutDashboard },
    { href: "/admin/trips", label: "行程管理", icon: FileText },
    { href: "/admin/trips/new", label: "新建行程", icon: Plus },
    { href: "/admin/guide", label: "行程攻略", icon: Compass },
    { href: "/admin/gallery", label: "画廊管理", icon: Image },
    { href: "/admin/settings", label: "设置", icon: Settings },
  ];

  return (
    <div className="min-h-screen pt-16 flex">
      {/* 侧边栏 (桌面) */}
      <aside className="w-56 shrink-0 border-r border-white/5 bg-white/[0.01] hidden md:flex flex-col">
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <p className="text-xs text-white/30 mb-1 truncate">{user.email}</p>
          <p className="text-xs text-orange-400/60 mb-2">{roleLabel}</p>
          <AdminLogoutButton />
        </div>
      </aside>

      {/* 移动端底部导航 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 py-2 flex items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 text-xs text-white/40 hover:text-white transition-colors"
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </div>

      {/* 主内容区 */}
      <div className="flex-1 min-w-0 pb-16 md:pb-0">
        {children}
      </div>
    </div>
  );
}
