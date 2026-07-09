import { createServerSupabase } from "@/lib/supabase/server";
import { getAllGeneratedGuides, getGuidesByUser } from "@/lib/data/ai-guides";
import { isAdmin } from "@/lib/data/profiles";
import { GuideCard } from "@/components/admin/GuideCard";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GeneratedGuidesPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const admin = await isAdmin();

  // 管理员看全部，普通用户只看自己的
  const guides = admin
    ? await getAllGeneratedGuides()
    : await getGuidesByUser(user.id);

  return (
    <div className="min-h-screen bg-black">
      <div className="px-4 py-8 max-w-5xl mx-auto">
        {/* ── 顶部 ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/admin/guide"
              className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-3"
            >
              <ArrowLeft size={14} />
              返回攻略生成
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Sparkles size={22} className="text-orange-400" />
              AI 生成的攻略
            </h1>
            <p className="text-sm text-white/40 mt-1">
              共 {guides.length} 条攻略
              {admin && "（全部用户）"}
            </p>
          </div>

          <Link
            href="/admin/guide"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10
                       text-white/70 hover:text-white hover:border-white/20 text-sm transition-colors"
          >
            <Plus size={16} />
            新建攻略
          </Link>
        </div>

        {/* ── 空状态 ── */}
        {guides.length === 0 && (
          <div className="text-center py-20">
            <Sparkles className="w-10 h-10 text-white/10 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white/30 mb-1">
              还没有生成的攻略
            </h3>
            <p className="text-sm text-white/20 mb-4">
              搜索目的地并填写旅行参数，让 AI 为你生成第一份攻略
            </p>
            <Link
              href="/admin/guide"
              className="inline-flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300 transition-colors"
            >
              前往生成 →
            </Link>
          </div>
        )}

        {/* ── 卡片网格 ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      </div>
    </div>
  );
}
