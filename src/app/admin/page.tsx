import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, Image, Map } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">管理后台</h1>
      <p className="text-white/50 mb-10">
        欢迎回来，{user.email}
      </p>

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
          href="/gallery"
          className="flex items-center gap-4 p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all"
        >
          <div className="w-12 h-12 rounded-lg bg-blue-400/10 flex items-center justify-center">
            <Image size={24} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">图片管理</h3>
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
