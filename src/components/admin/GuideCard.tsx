import Link from "next/link";
import { Calendar, Wallet, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIGuide } from "@/types/ai-guide";

// ============================================================
// Props
// ============================================================

interface GuideCardProps {
  guide: AIGuide;
  className?: string;
}

// ============================================================
// 格式化日期范围
// ============================================================

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) => {
    const date = new Date(d);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };
  return `${fmt(start)} - ${fmt(end)}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ============================================================
// 计算天数
// ============================================================

function dayCount(start: string, end: string): number {
  return (
    Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1
  );
}

// ============================================================
// Component
// ============================================================

export function GuideCard({ guide, className }: GuideCardProps) {
  const days = dayCount(guide.start_date, guide.end_date);

  return (
    <Link
      href={`/admin/guide/generated/${guide.id}`}
      className={cn(
        "block rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] transition-all group",
        className
      )}
    >
      <div className="p-5 space-y-4">
        {/* 目的地 + 天数 */}
        <div>
          <h3 className="text-base font-semibold text-white group-hover:text-orange-300 transition-colors">
            {guide.destination}
          </h3>
          <p className="text-xs text-white/40 mt-0.5">
            {guide.destination} · {days} 天行程
          </p>
        </div>

        {/* 日期 / 预算 / 人数 */}
        <div className="space-y-1.5 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <Calendar size={12} className="shrink-0" />
            <span>{formatDateRange(guide.start_date, guide.end_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Wallet size={12} className="shrink-0" />
            <span>¥{guide.budget.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={12} className="shrink-0" />
            <span>{guide.traveler_count}</span>
          </div>
        </div>

        {/* 关键词标签 */}
        {guide.keywords && guide.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {guide.keywords.map((kw) => (
              <span
                key={kw}
                className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300/80 text-[10px]"
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* 创建时间 */}
        <p className="text-[10px] text-white/25">
          {formatDate(guide.created_at)}
        </p>
      </div>
    </Link>
  );
}
