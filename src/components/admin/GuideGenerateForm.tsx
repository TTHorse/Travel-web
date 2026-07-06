"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  Calendar,
  Wallet,
  Users,
  Tag,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/types/amap";

// ============================================================
// 预设关键词标签
// ============================================================

const PRESET_KEYWORDS = [
  "文化体验",
  "美食之旅",
  "自然风光",
  "历史古迹",
  "亲子游",
  "蜜月旅行",
  "户外探险",
  "城市漫步",
] as const;

// ============================================================
// Props
// ============================================================

interface GuideGenerateFormProps {
  selectedResult: SearchResult;
  className?: string;
}

// ============================================================
// Component
// ============================================================

export function GuideGenerateForm({
  selectedResult,
  className,
}: GuideGenerateFormProps) {
  const router = useRouter();

  // 表单状态
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [travelerCount, setTravelerCount] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(
    new Set()
  );
  const [customKeyword, setCustomKeyword] = useState("");

  // 生成状态
  const [generating, setGenerating] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [generationDone, setGenerationDone] = useState(false);
  const [error, setError] = useState("");

  // 今天日期（min for date inputs）
  const today = new Date().toISOString().split("T")[0];

  // ── 关键词切换 ──
  const toggleKeyword = useCallback((kw: string) => {
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(kw)) next.delete(kw);
      else next.add(kw);
      return next;
    });
  }, []);

  // ── 添加自定义关键词 ──
  const addCustomKeyword = useCallback(() => {
    const trimmed = customKeyword.trim();
    if (!trimmed) return;
    setSelectedKeywords((prev) => new Set(prev).add(trimmed));
    setCustomKeyword("");
  }, [customKeyword]);

  // ── 生成攻略 ──
  const handleGenerate = useCallback(async () => {
    if (!startDate || !endDate) return;

    setError("");
    setStreamContent("");
    setGenerationDone(false);
    setGenerating(true);

    const allKeywords = [
      ...selectedKeywords,
      ...(customKeyword.trim() ? [customKeyword.trim()] : []),
    ];

    try {
      const res = await fetch("/api/ai/generate-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: selectedResult.name,
          adcode: selectedResult.adcode,
          startDate,
          endDate,
          budget: parseInt(budget, 10) || 0,
          travelerCount: travelerCount || "1人",
          keywords: allKeywords,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "请求失败" }));
        setError(err.error || "生成失败");
        setGenerating(false);
        return;
      }

      // 流式读取
      const reader = res.body?.getReader();
      if (!reader) {
        setError("无法读取响应流");
        setGenerating(false);
        return;
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setStreamContent((prev) => prev + chunk);
      }
    } catch {
      setError("网络连接失败，请重试");
    } finally {
      setGenerating(false);
      setGenerationDone(true);
    }
  }, [
    startDate,
    endDate,
    budget,
    travelerCount,
    selectedKeywords,
    customKeyword,
    selectedResult,
  ]);

  // ── 表单是否可提交 ──
  const canSubmit = startDate && endDate && !generating;

  return (
    <div className={cn("space-y-5", className)}>
      {/* ── 日期范围 ── */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
          <Calendar size={12} />
          旅行时间
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={today}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                       focus:outline-none focus:border-orange-500/50 transition-colors [color-scheme:dark]"
            aria-label="开始日期"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || today}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                       focus:outline-none focus:border-orange-500/50 transition-colors [color-scheme:dark]"
            aria-label="结束日期"
          />
        </div>
      </div>

      {/* ── 预算 ── */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
          <Wallet size={12} />
          旅行预算
        </label>
        <div className="relative">
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="如：3000"
            min="0"
            step="100"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-10 py-2 text-white text-sm
                       placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors"
            aria-label="预算金额"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">
            元
          </span>
        </div>
      </div>

      {/* ── 人数 ── */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
          <Users size={12} />
          旅行人数
        </label>
        <input
          type="text"
          value={travelerCount}
          onChange={(e) => setTravelerCount(e.target.value)}
          placeholder="如：2大1小、独自旅行、4人"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm
                     placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors"
          aria-label="旅行人数"
        />
      </div>

      {/* ── 关键词标签 ── */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
          <Tag size={12} />
          旅行关键词
        </label>
        {/* 预设标签 */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PRESET_KEYWORDS.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => toggleKeyword(kw)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                selectedKeywords.has(kw)
                  ? "bg-orange-500/15 border-orange-400/40 text-orange-300"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white/70 hover:border-white/20"
              )}
            >
              {kw}
            </button>
          ))}
        </div>
        {/* 自定义关键词输入 */}
        <div className="flex gap-1.5">
          <input
            type="text"
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomKeyword();
              }
            }}
            placeholder="自定义关键词..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs
                       placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
          <button
            type="button"
            onClick={addCustomKeyword}
            disabled={!customKeyword.trim()}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50
                       hover:text-white/70 disabled:opacity-30 text-xs transition-colors"
          >
            添加
          </button>
        </div>
      </div>

      {/* ── 生成按钮 ── */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canSubmit}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all",
          canSubmit
            ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-400 hover:to-pink-400"
            : "bg-white/5 text-white/20 cursor-not-allowed"
        )}
      >
        <Sparkles size={16} />
        {generating ? "攻略生成中..." : "生成攻略"}
      </button>

      {/* ── 错误 ── */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* ── 流式输出 ── */}
      {generating && !streamContent && (
        <div className="flex items-center gap-2 text-white/40 text-xs py-4">
          <Loader2 size={14} className="animate-spin" />
          AI 正在为你生成攻略...
        </div>
      )}

      {streamContent && (
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 max-h-96 overflow-y-auto">
          <pre className="text-white/80 text-xs whitespace-pre-wrap font-sans leading-relaxed">
            {streamContent}
            {generating && (
              <span className="inline-block w-1.5 h-4 bg-orange-400 animate-pulse ml-0.5 align-middle" />
            )}
          </pre>
        </div>
      )}

      {/* ── 生成完成 ── */}
      {generationDone && (
        <button
          type="button"
          onClick={() => router.push("/admin/guide/generated")}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                     bg-cyan-500/10 border border-cyan-500/30 text-cyan-400
                     hover:bg-cyan-500/20 text-sm font-medium transition-colors"
        >
          查看攻略列表
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
