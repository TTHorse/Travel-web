import { getGeneratedGuideById } from "@/lib/data/ai-guides";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Wallet,
  Users,
  MapPin,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ============================================================
// 格式化
// ============================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function dayCount(start: string, end: string): number {
  return (
    Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
}

// ============================================================
// 简易 Markdown → HTML（处理标题、列表、加粗、段落）
// ============================================================

function renderMarkdown(content: string): string {
  return content
    // 标题
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white mt-8 mb-3">$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-semibold text-orange-300 mt-6 mb-2">$1</h4>')
    // 无序列表
    .replace(/^- (.+)$/gm, '<li class="text-white/75 leading-relaxed ml-4">• $1</li>')
    // 加粗
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white/90 font-semibold">$1</strong>')
    // 段落（连续非空行 → <p>）
    .replace(/\n\n+/g, '\n\n')
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<li')) return trimmed;
      return `<p class="text-white/75 leading-relaxed mb-3">${trimmed}</p>`;
    })
    .join('\n')
    // 列表项包装
    .replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="space-y-1 mb-4">$1</ul>');
}

// ============================================================
// Page
// ============================================================

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GuidePreviewPage({ params }: Props) {
  const { id } = await params;
  const guide = await getGeneratedGuideById(id);

  if (!guide) {
    notFound();
  }

  const days = dayCount(guide.start_date, guide.end_date);

  return (
    <div className="min-h-screen bg-black">
      <div className="px-4 py-8 max-w-3xl mx-auto">
        {/* ── 返回 ── */}
        <Link
          href="/admin/guide/generated"
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          返回攻略列表
        </Link>

        {/* ── 头部信息 ── */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-orange-400" />
            <h1 className="text-2xl font-bold text-white">
              {guide.destination}
            </h1>
          </div>
          <p className="text-sm text-white/40 mb-4">
            AI 生成 · {days} 天行程
          </p>

          {/* 元数据 */}
          <div className="flex flex-wrap gap-4 text-xs text-white/50">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              {formatDateRange(guide.start_date, guide.end_date)}
            </div>
            <div className="flex items-center gap-1.5">
              <Wallet size={12} />
              ¥{guide.budget.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={12} />
              {guide.traveler_count}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={12} />
              {guide.destination}
            </div>
          </div>

          {/* 关键词 */}
          {guide.keywords && guide.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {guide.keywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300/80 text-xs"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Markdown 内容 ── */}
        <article className="prose prose-invert max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(guide.content),
            }}
          />
        </article>

        {/* ── 底部 ── */}
        <div className="mt-12 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-white/25">
            此攻略由 AI 自动生成，仅供参考。生成时间：
            {formatDate(guide.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
