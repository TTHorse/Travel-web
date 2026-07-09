import { createServerSupabase } from "@/lib/supabase/server";
import { getAdminTravelStats, getTravelStats } from "@/lib/data/trips";
import { isAdmin } from "@/lib/data/profiles";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, Image, Map, Compass } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const admin = await isAdmin();

  // 根据角色获取不同的统计数据
  const adminStats = admin ? await getAdminTravelStats() : null;
  const userStats = !admin ? await getTravelStats() : null;
  const stats = adminStats ?? userStats!;

  return (
    <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">管理后台</h1>
      <p className="text-white/50 mb-10">
        欢迎回来，{user.email}
        {admin && <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">管理员</span>}
      </p>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-2xl font-bold text-white">{stats.totalTrips}</p>
          <p className="text-xs text-white/40 mt-1">行程总数</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-2xl font-bold text-white">{stats.totalCountries}</p>
          <p className="text-xs text-white/40 mt-1">覆盖国家</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-2xl font-bold text-white">{stats.totalCities}</p>
          <p className="text-xs text-white/40 mt-1">到访城市</p>
        </div>
        {admin && adminStats && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-bold text-white">{adminStats.totalUsers}</p>
            <p className="text-xs text-white/40 mt-1">用户数</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/trips"
          className="flex items-center gap-4 p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all"
        >
          <div className="w-12 h-12 rounded-lg bg-orange-400/10 flex items-center justify-center">
            <FileText size={24} className="text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">管理旅行</h3>
            <p className="text-white/40 text-sm">创建、编辑、发布旅行记录</p>
          </div>
        </Link>

        <Link
          href="/admin/trips/new"
          className="flex items-center gap-4 p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all"
        >
          <div className="w-12 h-12 rounded-lg bg-green-400/10 flex items-center justify-center">
            <Plus size={24} className="text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">新建旅行</h3>
            <p className="text-white/40 text-sm">撰写新的旅行攻略</p>
          </div>
        </Link>

        <Link
          href="/admin/guide"
          className="flex items-center gap-4 p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all"
        >
          <div className="w-12 h-12 rounded-lg bg-cyan-400/10 flex items-center justify-center">
            <Compass size={24} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">行程攻略</h3>
            <p className="text-white/40 text-sm">搜索地区，边写攻略边看地图</p>
          </div>
        </Link>

        <Link
          href="/admin/gallery"
          className="flex items-center gap-4 p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all"
        >
          <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center">
            <Image size={24} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">画廊管理</h3>
            <p className="text-white/40 text-sm">上传和管理旅行照片</p>
          </div>
        </Link>

        <Link
          href="/map"
          className="flex items-center gap-4 p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all"
        >
          <div className="w-12 h-12 rounded-lg bg-pink-400/10 flex items-center justify-center">
            <Map size={24} className="text-pink-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">地图管理</h3>
            <p className="text-white/40 text-sm">管理地图标记点</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
