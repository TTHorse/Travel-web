"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, Building2 } from "lucide-react";
import { fetchInputTips, geocodeAddress } from "@/lib/amap";
import type { SearchResult } from "@/types/amap";

interface AmapSearchProps {
  onSelect: (result: SearchResult) => void;
}

export function AmapSearch({ onSelect }: AmapSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 输入防抖搜索
  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    setSelectedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await fetchInputTips(value);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setLoading(false);
    }, 300);
  }, []);

  // 选择结果
  const handleSelect = useCallback(
    async (result: SearchResult) => {
      // 行政区域 tip — 坐标可能为空，异步补坐标
      if (result.longitude === 0 && result.latitude === 0) {
        setQuery(result.name);
        setIsOpen(false);
        setSuggestions([]);
        setLoading(true);

        const geo = await geocodeAddress(
          result.address || result.name,
          result.district
        );
        if (geo) {
          onSelect({ ...result, longitude: geo.lng, latitude: geo.lat });
        } else {
          onSelect(result);
        }
        setLoading(false);
        inputRef.current?.blur();
        return;
      }

      setQuery(result.name);
      setIsOpen(false);
      setSuggestions([]);
      onSelect(result);
    },
    [onSelect]
  );

  // 键盘导航
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
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder="搜索地点，地图将自动定位..."
          className="w-full pl-10 pr-10 py-2.5 bg-black/60 backdrop-blur-xl border border-white/15
                     rounded-lg text-sm text-white placeholder:text-white/30
                     focus:outline-none focus:border-orange-400/50 focus:bg-black/75
                     transition-all duration-200"
          aria-label="搜索地点"
          aria-autocomplete="list"
          role="combobox"
          aria-expanded={isOpen}
        />
        {/* 加载指示器 */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-white/20 border-t-orange-400 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 下拉建议列表 */}
      {isOpen && suggestions.length > 0 && (
        <ul
          className="absolute top-full mt-2 w-full bg-black/85 backdrop-blur-xl border border-white/10
                     rounded-lg overflow-hidden shadow-2xl z-50 max-h-72 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((item, index) => {
            const isAdminRegion = item.longitude === 0 && item.latitude === 0;
            return (
              <li
                key={item.id}
                role="option"
                aria-selected={index === selectedIndex}
                onClick={() => handleSelect(item)}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
                  ${
                    index === selectedIndex
                      ? "bg-orange-400/15 text-white"
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
    </div>
  );
}
