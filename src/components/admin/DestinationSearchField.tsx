"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, Loader2, Building2 } from "lucide-react";
import { fetchInputTips, geocodeAddress } from "@/lib/amap";
import type { SearchResult } from "@/types/amap";

interface DestinationSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onRegionSelect: (result: SearchResult) => void;
  className?: string;
}

/**
 * 受控的目的地搜索输入框
 * - 输入即同步到父组件 form.destination
 * - 下拉选中时回填名称并触发 onRegionSelect（携带经纬度供右侧地图飞行）
 * 复用高德 inputtips API（src/lib/amap.ts）
 */
export function DestinationSearchField({
  value,
  onChange,
  onRegionSelect,
  className,
}: DestinationSearchFieldProps) {
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchError, setSearchError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSearched, setLastSearched] = useState("");

  const handleInputChange = useCallback(
    (v: string) => {
      onChange(v);
      setSelectedIndex(-1);
      setSearchError("");

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (v.trim().length < 1) {
        setSuggestions([]);
        setIsOpen(false);
        setLastSearched("");
        return;
      }

      setLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await fetchInputTips(v);
          setLastSearched(v);
          setSuggestions(results);
          setIsOpen(results.length > 0);
        } catch (err) {
          setSearchError(err instanceof Error ? err.message : "搜索失败");
          setSuggestions([]);
          setIsOpen(false);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [onChange]
  );

  const handleSelect = useCallback(
    async (result: SearchResult) => {
      // 行政区域 tip — 坐标可能为空（高德 inputtips 对城市/区县不返回 location）
      // 先回填名称，再异步补坐标，避免 UI 卡住
      if (result.longitude === 0 && result.latitude === 0) {
        onChange(result.name);
        setIsOpen(false);
        setSuggestions([]);
        setLoading(true);

        // 用地理编码补坐标
        const geo = await geocodeAddress(
          result.address || result.name,
          result.district
        );
        if (geo) {
          onRegionSelect({ ...result, longitude: geo.lng, latitude: geo.lat });
        } else {
          // 地理编码失败也继续（用户至少能看到名称已填入）
          onRegionSelect(result);
        }
        setLoading(false);
        inputRef.current?.blur();
        return;
      }

      onChange(result.name);
      setIsOpen(false);
      setSuggestions([]);
      onRegionSelect(result);
      inputRef.current?.blur();
    },
    [onChange, onRegionSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSelect(suggestions[selectedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, selectedIndex, suggestions, handleSelect]
  );

  // 点击外部关闭下拉
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder="如：大理（搜索后自动定位地图）"
          className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg
                     text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50
                     transition-colors"
          aria-label="目的地"
          aria-autocomplete="list"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="destination-suggestions"
        />
        {loading && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 animate-spin"
          />
        )}
      </div>

      {/* 下拉建议列表 */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id="destination-suggestions"
          className="absolute top-full mt-1.5 w-full bg-neutral-900/95 backdrop-blur-xl border border-white/10
                     rounded-lg overflow-hidden shadow-2xl z-50 max-h-72 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((item, index) => {
            // 行政区域 tip（城市/区县）没有坐标，用建筑图标区分
            const isAdminRegion = item.longitude === 0 && item.latitude === 0;
            return (
              <li
                key={item.id}
                role="option"
                aria-selected={index === selectedIndex}
                onClick={() => handleSelect(item)}
                className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors
                  ${
                    index === selectedIndex
                      ? "bg-orange-500/15 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
              >
                {isAdminRegion ? (
                  <Building2 className="w-4 h-4 mt-0.5 shrink-0 text-blue-400/70" />
                ) : (
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-orange-400/70" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-white/40 truncate mt-0.5">
                    {item.district || item.address}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 搜索完成但无结果 */}
      {!loading && lastSearched && lastSearched === value && !isOpen && !searchError && (
        <div className="absolute top-full mt-1.5 w-full bg-neutral-900/95 backdrop-blur-xl border border-white/10
                        rounded-lg p-3 shadow-2xl z-50">
          <p className="text-xs text-white/40 text-center">
            未找到匹配的地点，请尝试其他关键词
          </p>
        </div>
      )}

      {/* 搜索错误 */}
      {searchError && (
        <div className="absolute top-full mt-1.5 w-full bg-red-500/10 border border-red-500/20
                        rounded-lg p-3 shadow-2xl z-50">
          <p className="text-xs text-red-400 text-center">{searchError}</p>
        </div>
      )}
    </div>
  );
}
