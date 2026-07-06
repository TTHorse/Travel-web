"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, X } from "lucide-react";
import { DestinationSearchField } from "@/components/admin/DestinationSearchField";
import { GuideGenerateForm } from "@/components/admin/GuideGenerateForm";
import { AmapMapContainer } from "@/components/map/AmapMapContainer";
import { getZoomForRegion } from "@/lib/amap";
import type { SearchTarget } from "@/components/map/AmapMapContainer";
import type { SearchResult } from "@/types/amap";

/**
 * 行程攻略 — 独立全屏页面（无 admin 侧边栏）
 * - 左侧：目的地搜索（高德联想 + 关键字检索）
 * - 右侧：高德 2D 地图
 * - 选中地域 → 地图自动飞行定位 + 放大
 */
export default function GuidePage() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const handleRegionSelect = useCallback((result: SearchResult) => {
    setDestination(result.name);
    setSelectedResult(result);
  }, []);

  const handleClear = useCallback(() => {
    setSelectedResult(null);
    // 不清除 destination 文本，方便用户继续搜索
  }, []);

  const searchTarget: SearchTarget | null = selectedResult
    ? {
        id: selectedResult.id,
        name: selectedResult.name,
        longitude: selectedResult.longitude,
        latitude: selectedResult.latitude,
        zoom: getZoomForRegion(selectedResult.adcode, selectedResult.typecode),
      }
    : null;

  return (
    <div className="flex flex-col h-screen">
      {/* ── 顶部栏 ── */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-black/50 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          <ArrowLeft size={16} />
          返回
        </button>
        <span className="text-white/20">/</span>
        <h1 className="text-sm font-semibold text-white">行程攻略</h1>
      </header>

      {/* ── 主体：左搜索 + 右地图 ── */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* 左侧面板 */}
        <aside className="w-full md:w-80 lg:w-96 shrink-0 border-b md:border-b-0 md:border-r border-white/5 bg-black/30 p-5 overflow-y-auto">
          <div className="space-y-5">
            {/* 搜索框 */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
                目的地搜索
              </label>
              <DestinationSearchField
                value={destination}
                onChange={setDestination}
                onRegionSelect={handleRegionSelect}
              />
              <p className="text-[11px] text-white/25 mt-2">
                输入城市或地区名称，从下拉建议中选择
              </p>
            </div>

            {/* 选中结果详情 */}
            {selectedResult && (
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                    <h3 className="font-semibold text-white text-sm">
                      {selectedResult.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
                    aria-label="清除选择"
                  >
                    <X size={14} />
                  </button>
                </div>

                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-white/40">经度</dt>
                    <dd className="text-white/70 font-mono">
                      {selectedResult.longitude.toFixed(6)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/40">纬度</dt>
                    <dd className="text-white/70 font-mono">
                      {selectedResult.latitude.toFixed(6)}
                    </dd>
                  </div>
                  {selectedResult.address && (
                    <div className="flex justify-between">
                      <dt className="text-white/40">地址</dt>
                      <dd className="text-white/70 text-right max-w-[60%] truncate">
                        {selectedResult.address}
                      </dd>
                    </div>
                  )}
                  {selectedResult.district && (
                    <div className="flex justify-between">
                      <dt className="text-white/40">区域</dt>
                      <dd className="text-white/70">{selectedResult.district}</dd>
                    </div>
                  )}
                </dl>

                <p className="text-[11px] text-white/25 mt-3 flex items-center gap-1">
                  <MapPin size={11} />
                  右侧地图已定位到该地区
                </p>
              </div>
            )}

            {/* AI 攻略生成表单（选中目的地后显示） */}
            {selectedResult && (
              <GuideGenerateForm selectedResult={selectedResult} />
            )}

            {/* 空状态提示 */}
            {!selectedResult && (
              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 text-center">
                <MapPin className="w-6 h-6 text-white/15 mx-auto mb-2" />
                <p className="text-xs text-white/30">
                  搜索目的地后，地图将自动飞行定位
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* 右侧地图 */}
        <main className="flex-1 min-h-0 bg-[#1a1a1a]">
          <AmapMapContainer
            className="w-full h-full"
            points={[]}
            searchTarget={searchTarget}
            onClearSearch={handleClear}
          />
        </main>
      </div>
    </div>
  );
}
