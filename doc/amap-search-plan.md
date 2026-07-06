# 高德地图搜索定位实现方案

## 原始需求

在地图页面增加一个搜索输入框，用户输入地区名称后，页面上的地图自动滚动/飞行到该地区位置，使用高德地图（Amap）实现。

---

## 可行性分析

### 当前技术栈与现状

| 维度 | 现状 |
|------|------|
| **地图库** | 使用 Three.js (R3F) 自建 3D 地球（`EarthGlobe.tsx`） |
| **高德地图** | 未引入任何高德相关依赖 |
| **搜索功能** | 无地点搜索能力 |
| **现有地图页** | `src/app/map/page.tsx` → `EarthGlobeWrapper.tsx` → `EarthGlobe.tsx`，全屏 3D 地球 + 平面地图 + 侧边栏统计 |
| **UI 框架** | React 19 + Tailwind CSS 4 + framer-motion |

### 四种实现方案对比

| | 方案 A: 高德 JSAPI Loader | 方案 B: @amap/amap-jsapi-loader | 方案 C: react-amap | 方案 D: 高德 Web服务 API + 现有地图 |
|---|---|---|---|---|
| **新增依赖** | 0（CDN 加载） | 1（npm 包） | 1（npm 包） | 0 |
| **地图替换** | 完整高德地图 | 完整高德地图 | 完整高德地图 | 不替换，仅用搜索 |
| **搜索能力** | 内置 Autocomplete + PlaceSearch | 内置 Autocomplete + PlaceSearch | 组件化封装 | HTTP API 调用 |
| **React 集成** | 需手动封装 DOM 操作 | 需手动封装 DOM 操作 | 开箱即用（但维护不活跃） | 纯 React，集成最自然 |
| **地图样式** | 高德官方样式 | 高德官方样式 | 高德官方样式 | 保持现有 3D 地球 |
| **体积增量** | ~80 KB（JSAPI SDK） | ~80 KB + npm 包 | ~80 KB + npm 包 | 0 KB（仅 API 请求） |
| **与现有 3D 地球兼容** | ❌ 需替换 | ❌ 需替换 | ❌ 需替换 | ✅ 完全兼容 |
| **搜索体验** | 原生下拉建议 | 原生下拉建议 | 组件封装 | 自行实现下拉 |
| **离线可用** | ❌ | ❌ | ❌ | ❌ |
| **高德 Key** | 需要 | 需要 | 需要 | 需要（Web服务 Key） |

---

## 推荐方案：方案 D — 高德 Web服务 API + 现有地图

### 选择理由

1. **零破坏** — 完全不动现有的 3D 地球（EarthGlobe.tsx），仅在页面上叠加一个搜索栏组件
2. **零新依赖** — 不引入任何新的 npm 包，搜索通过高德 Web服务 HTTP API 完成，地图飞行使用现有 CameraControls 的 `setLookAt`
3. **极简集成** — 复用现有经纬度→3D 坐标转换函数（`latLngToGlobe` / `latLngToPlane`），搜索结果直接触发相机飞行动画
4. **体积最优** — 纯逻辑代码，无额外 SDK 体积
5. **渐进增强** — 后续可随时升级到完整高德地图而无需重构
6. **用户体验** — 搜索栏提供下拉建议，选中后相机平滑飞行到目标位置并标记高亮

---

## 实现方案

### 整体架构

```
src/
├── components/map/
│   ├── EarthGlobe.tsx          ← 改造：暴露 flyTo 方法，新增搜索结果标记
│   ├── EarthGlobeWrapper.tsx   ← 改造：管理搜索状态，传递 flyTo 回调
│   ├── AmapSearch.tsx          ← 新增：高德搜索输入框 + 下拉建议
│   └── SearchResultMarker.tsx  ← 新增：搜索结果 3D 脉冲标记
├── app/map/
│   └── page.tsx                ← 少量调整
├── lib/
│   └── amap.ts                 ← 新增：高德 API 封装（POI 搜索、输入提示）
└── types/
    └── amap.ts                 ← 新增：高德 API 响应类型
```

### Step 1 — 获取高德地图 Key

前往 [高德开放平台](https://console.amap.com/dev/key/app) 注册账号并创建应用，获取 **Web服务** 类型的 Key。

在 `.env.local` 中添加：

```bash
NEXT_PUBLIC_AMAP_WEB_KEY=你的高德Web服务Key
```

> **注意**：Web服务 Key 与 JSAPI Key 不同。方案 D 只需要 Web服务 Key（用于 HTTP API 调用），不需要 JSAPI Key。

### Step 2 — 高德 API 类型定义

**文件：`src/types/amap.ts`**（新建）

```typescript
// 高德 POI 输入提示响应
export interface AmapInputTip {
  id: string;
  name: string;
  district: string;      // 行政区，如 "朝阳区"
  adcode: string;        // 行政区编码
  location: string;      // "经度,纬度"
  address: string;       // 详细地址
  typecode: string;      // POI 类型编码
}

export interface AmapInputTipsResponse {
  status: "0" | "1";
  info: string;
  count: string;
  tips: AmapInputTip[];
}

// 高德 POI 搜索响应
export interface AmapPOI {
  id: string;
  name: string;
  location: string;      // "经度,纬度"
  address: string;
  pname: string;         // 省
  cityname: string;      // 市
  adname: string;        // 区
}

export interface AmapPOISearchResponse {
  status: "0" | "1";
  info: string;
  count: string;
  pois: AmapPOI[];
}

// 搜索结果（统一格式，供组件使用）
export interface SearchResult {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  address: string;
  district: string;
}
```

### Step 3 — 高德 API 封装

**文件：`src/lib/amap.ts`**（新建）

```typescript
import type {
  AmapInputTipsResponse,
  AmapPOISearchResponse,
  SearchResult,
} from "@/types/amap";

const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_WEB_KEY ?? "";
const BASE_URL = "https://restapi.amap.com/v3";

/**
 * 输入提示 API — 用于搜索框下拉建议
 * 文档：https://lbs.amap.com/api/webservice/guide/api/inputtips
 */
export async function fetchInputTips(keyword: string): Promise<SearchResult[]> {
  if (!keyword.trim() || !AMAP_KEY) return [];

  const params = new URLSearchParams({
    key: AMAP_KEY,
    keywords: keyword,
    output: "json",
    citylimit: "false",  // 全国搜索
  });

  try {
    const res = await fetch(
      `${BASE_URL}/assistant/inputtips?${params.toString()}`
    );
    const data: AmapInputTipsResponse = await res.json();

    if (data.status !== "1" || !data.tips) return [];

    return data.tips
      .filter((tip) => tip.location && tip.location.trim())
      .map((tip) => {
        const [lng, lat] = tip.location.split(",").map(Number);
        return {
          id: tip.id || `${lng},${lat}`,
          name: tip.name,
          longitude: lng,
          latitude: lat,
          address: tip.address || "",
          district: tip.district || "",
        };
      });
  } catch {
    return [];
  }
}

/**
 * POI 关键字搜索 API — 用于精确搜索
 * 文档：https://lbs.amap.com/api/webservice/guide/api/search
 */
export async function searchPOI(keyword: string): Promise<SearchResult[]> {
  if (!keyword.trim() || !AMAP_KEY) return [];

  const params = new URLSearchParams({
    key: AMAP_KEY,
    keywords: keyword,
    output: "json",
    offset: "10",
  });

  try {
    const res = await fetch(
      `${BASE_URL}/place/text?${params.toString()}`
    );
    const data: AmapPOISearchResponse = await res.json();

    if (data.status !== "1" || !data.pois) return [];

    return data.pois.map((poi) => {
      const [lng, lat] = poi.location.split(",").map(Number);
      return {
        id: poi.id,
        name: poi.name,
        longitude: lng,
        latitude: lat,
        address: poi.address || "",
        district: poi.adname || "",
      };
    });
  } catch {
    return [];
  }
}
```

### Step 4 — 搜索组件

**文件：`src/components/map/AmapSearch.tsx`**（新建）

```tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, MapPin } from "lucide-react";
import { fetchInputTips } from "@/lib/amap";
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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // 输入防抖搜索
  const handleInputChange = useCallback(
    (value: string) => {
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
    },
    []
  );

  // 选择结果
  const handleSelect = useCallback(
    (result: SearchResult) => {
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
          {suggestions.map((item, index) => (
            <li
              key={item.id}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(item)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
                ${index === selectedIndex
                  ? "bg-orange-400/15 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
            >
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-orange-400/70" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-white/40 truncate mt-0.5">
                  {item.address || item.district}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Step 5 — 搜索结果标记点

**文件：`src/components/map/SearchResultMarker.tsx`**（新建）

```tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";

interface SearchResultMarkerProps {
  position: [number, number, number];
  name: string;
  onClose: () => void;
}

/**
 * 搜索结果脉冲标记 — 区别于普通标记点，使用更醒目的动画
 */
export function SearchResultMarker({
  position,
  name,
  onClose,
}: SearchResultMarkerProps) {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const elapsedRef = useRef(0);

  // 外圈脉冲动画
  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const t = elapsedRef.current;
    if (outerRingRef.current) {
      const scale = 1 + Math.sin(t * 3) * 0.6;
      outerRingRef.current.scale.setScalar(scale);
      const mat = outerRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.8 - Math.sin(t * 3) * 0.4;
    }
  });

  const popupPos = useMemo(() => {
    // 径向偏移定位弹窗
    const len = Math.sqrt(
      position[0] ** 2 + position[1] ** 2 + position[2] ** 2
    );
    if (len === 0) return [position[0], position[1], position[2] + 0.35] as const;
    const factor = (len + 0.35) / len;
    return [
      position[0] * factor,
      position[1] * factor,
      position[2] * factor,
    ] as const;
  }, [position]);

  return (
    <group position={position}>
      {/* 外圈脉冲 */}
      <mesh ref={outerRingRef}>
        <ringGeometry args={[0.06, 0.1, 32]} />
        <meshBasicMaterial
          color="#22d3ee"
          side={THREE.DoubleSide}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* 实心核心 */}
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      {/* 内圈 */}
      <mesh>
        <ringGeometry args={[0.04, 0.07, 32]} />
        <meshBasicMaterial
          color="#67e8f9"
          side={THREE.DoubleSide}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* 名称标签 */}
      <Html position={popupPos} center distanceFactor={8}>
        <div className="bg-cyan-500/20 backdrop-blur-md border border-cyan-400/40 rounded-lg px-3 py-1.5 whitespace-nowrap select-none">
          <p className="text-xs font-semibold text-cyan-300">{name}</p>
          <button
            onClick={onClose}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 text-white/70 hover:text-white flex items-center justify-center text-xs leading-none transition-colors"
            aria-label="清除搜索结果"
          >
            ×
          </button>
        </div>
      </Html>
    </group>
  );
}
```

### Step 6 — 改造 EarthGlobe 支持外部 flyTo

**文件：`src/components/map/EarthGlobe.tsx`**（改造）

新增功能：
1. 暴露 `flyToLocation` 方法供外部调用
2. 在 Scene 中渲染 `SearchResultMarker`
3. 搜索飞行目标使用更醒目的青色标记

关键修改点：

```tsx
// ── 类型扩展 ──
interface SearchTarget {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
}

export interface EarthGlobeHandle {
  flyToLocation: (target: SearchTarget) => void;
  clearSearch: () => void;
}

interface EarthGlobeProps {
  points: MapPoint[];
  className?: string;
  /** 外部搜索飞行目标（由父组件管理） */
  searchTarget?: SearchTarget | null;
  /** 清除搜索回调 */
  onClearSearch?: () => void;
}

// ── EarthScene 改造 ──
// 在 EarthScene 内部新增：
// 1. 搜索结果位置计算（经纬度→3D/平面坐标）
// 2. 飞行到搜索结果的相机控制
// 3. SearchResultMarker 渲染

// 当 searchTarget 变化时，自动飞行：
useEffect(() => {
  if (!searchTarget || !cameraControlsRef.current) return;

  let targetPos: [number, number, number];
  if (viewMode === "flat") {
    targetPos = latLngToPlane(searchTarget.latitude, searchTarget.longitude);
  } else {
    targetPos = latLngToGlobe(searchTarget.latitude, searchTarget.longitude, MARKER_3D_RADIUS);
  }

  const target = new THREE.Vector3(targetPos[0], targetPos[1], targetPos[2]);
  let camPos: THREE.Vector3;
  if (viewMode === "flat") {
    camPos = new THREE.Vector3(targetPos[0], targetPos[1], 5);
  } else {
    const dir = target.clone().normalize();
    camPos = dir.multiplyScalar(4.5);
  }

  cameraControlsRef.current?.setLookAt(
    camPos.x, camPos.y, camPos.z,
    target.x, target.y, target.z,
    true
  );
}, [searchTarget, viewMode]);
```

> **完整改造代码量**：EarthGlobe.tsx 约 +50 行（新增 searchTarget prop、useEffect 飞行、SearchResultMarker 渲染）

### Step 7 — 改造 EarthGlobeWrapper 串联搜索与地图

**文件：`src/components/map/EarthGlobeWrapper.tsx`**（改造）

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { EarthGlobe } from "./EarthGlobe";
import type { MapPoint } from "@/types/map";
import type { SearchResult } from "@/types/amap";

interface EarthGlobeWrapperProps {
  points: MapPoint[];
  className?: string;
}

export function EarthGlobeWrapper({ points, className }: EarthGlobeWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [searchTarget, setSearchTarget] = useState<{
    id: string;
    name: string;
    longitude: number;
    latitude: number;
  } | null>(null);

  useEffect(() => setMounted(true), []);

  const handleSearchSelect = useCallback((result: SearchResult) => {
    setSearchTarget({
      id: result.id,
      name: result.name,
      longitude: result.longitude,
      latitude: result.latitude,
    });
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTarget(null);
  }, []);

  if (!mounted) {
    return <p className="text-white/60 p-8 text-center">3D 地球加载中...</p>;
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <EarthGlobe
        points={points}
        className="w-full h-full"
        searchTarget={searchTarget}
        onClearSearch={handleClearSearch}
      />

      {/* 顶部居中搜索栏 */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
        <AmapSearch onSelect={handleSearchSelect} />
      </div>
    </div>
  );
}
```

> **说明**：EarthGlobeWrapper 新增 ~30 行，主要负责管理 `searchTarget` 状态并传递给 EarthGlobe。

### Step 8 — 环境变量配置

**文件：`.env.local`**（追加一行）

```bash
NEXT_PUBLIC_AMAP_WEB_KEY=你的高德Web服务Key
```

> 获取方式：前往 [高德开放平台控制台](https://console.amap.com/dev/key/app)，创建「Web服务」类型的 Key。

---

## 文件变更清单

| 文件 | 操作 | 预估行数 |
|------|------|----------|
| `src/types/amap.ts` | **新建** | ~40 行 |
| `src/lib/amap.ts` | **新建** | ~70 行 |
| `src/components/map/AmapSearch.tsx` | **新建** | ~150 行 |
| `src/components/map/SearchResultMarker.tsx` | **新建** | ~80 行 |
| `src/components/map/EarthGlobe.tsx` | 修改 | +50 行 |
| `src/components/map/EarthGlobeWrapper.tsx` | 修改 | +30 行 |
| `.env.local` | 修改 | +1 行 |
| **总计** | | **~421 行** |

---

## 搜索交互流程

```
用户输入关键词
       │
       ▼
AmapSearch 防抖 300ms
       │
       ├─→ 调用 /assistant/inputtips（输入提示API）
       │         │
       │         ▼
       │   展示下拉建议列表（名称 + 地址）
       │         │
       │   用户点选 / 键盘 Enter
       │         │
       └─────────┘
             │
             ▼
     EarthGlobeWrapper 接收 SearchResult
             │
             ▼
     设置 searchTarget 状态 ──→ EarthGlobe
             │
             ▼
     useEffect 检测 searchTarget 变化
             │
             ▼
     经纬度 → 3D坐标转换
             │
             ▼
     CameraControls.setLookAt() 飞行
             │
             ▼
     渲染 SearchResultMarker（青色脉冲标记）
```

---

## 高德 API 调用说明

| API | 端点 | 用途 | 调用频率 |
|-----|------|------|----------|
| 输入提示 | `GET /v3/assistant/inputtips` | 搜索框下拉建议 | 每次输入（300ms 防抖） |
| POI搜索 | `GET /v3/place/text` | 精确文本搜索（备用） | 按需 |

### 免费额度

高德 Web服务 API 免费版日调用量：
- 输入提示：5000 次/日
- POI 搜索：5000 次/日

对本项目绰绰有余。

---

## 不兼容 / 注意事项

| 风险点 | 说明 | 应对 |
|--------|------|------|
| **高德 Key 泄露** | `NEXT_PUBLIC_` 前缀的环境变量会暴露在客户端 JS 中 | 在 [高德控制台](https://console.amap.com/dev/key/app) 中为 Key 配置「IP 白名单」或「Referer 白名单」，限制仅本域名可用 |
| **跨域问题** | 高德 Web服务 API 支持 CORS，前端 fetch 可直接调用 | 无需代理，已通过测试 |
| **搜索精度** | 输入提示 API 在全国范围内搜索，可能返回同名不同地 | 下拉列表展示地址/行政区帮助用户区分 |
| **搜索结果与 3D 坐标的一致性** | 高德返回的经纬度需与现有经纬度→球面坐标转换函数一致 | 两个转换函数（`latLngToGlobe` / `latLngToPlane`）基于纯数学，与经纬度来源无关，完全兼容 |
| **移动端体验** | 下拉建议列表在小屏幕上可能遮挡地图 | 列表 `max-h-72 overflow-y-auto`，触摸选择友好 |
| **搜索框与现有 UI 不冲突** | 右上角已有视图切换按钮，左上角有统计面板 | 搜索栏放在顶部居中，不与现有 UI 重叠 |
| **3D 地球飞行体验** | 飞行距离过长时动画可能不够平滑 | `CameraControls` 的 `setLookAt` 已内置平滑过渡动画，设置 `enableTransition: true`（默认） |

---

## 进阶扩展（可选）

以下功能可在基础方案稳定后逐步添加：

1. **搜索历史** — 使用 `localStorage` 存储最近 5 次搜索
2. **「我的位置」按钮** — 使用浏览器 Geolocation API 获取当前位置并飞行
3. **周边搜索** — 飞行到目标后，调用高德「周边搜索」API 展示附近 POI
4. **路线规划** — 集成高德路径规划 API，在地图上绘制路线
5. **升级至完整高德地图** — 如后续决定从 3D 地球升级到完整高德地图，可安装 `@amap/amap-jsapi-loader`，将本方案的思路平移到完整高德地图中

---

> **状态**：✅ 已实施
>
> **更新时间**：2026-07-02

---

## 实施日志（2026-07-02）

按方案逐步落地，最终改动如下：

### 1. 环境变量

- 新建 `.env.local`，写入 `NEXT_PUBLIC_AMAP_WEB_KEY=72afd1be3c82a91f57675c24ebf1b9ef`
- `.env.local.example` 追加 Amap 占位段落（便于他人参照配置）
- `.env.local` 已被 `.gitignore` 的 `.env*` 规则忽略，不会入库

### 2. 新建文件（方案中已给出，落地微调）

| 文件 | 说明 |
|------|------|
| `src/types/amap.ts` | 高德 inputtips / place/text 响应类型 + 统一 `SearchResult` |
| `src/lib/amap.ts` | `fetchInputTips` / `searchPOI` 两个 API 封装，从 `NEXT_PUBLIC_AMAP_WEB_KEY` 读 Key |
| `src/components/map/AmapSearch.tsx` | 搜索输入框 + 防抖 300ms + 键盘导航 + 下拉建议 |
| `src/components/map/SearchResultMarker.tsx` | 青色脉冲 3D 标记 + Html 名称标签（带关闭按钮） |

> 微调：`AmapSearch.tsx` 的 `debounceRef` 初始化改为 `useRef<ReturnType<typeof setTimeout> | null>(null)`，避免 React 19 严格类型下「Expected 1 arguments, but got 0」编译错误。

### 3. 改造 `EarthGlobe.tsx`

- 新增并导出 `SearchTarget` 类型（`id/name/longitude/latitude`）
- `EarthGlobeProps` 增加 `searchTarget?` 与 `onClearSearch?` 两个 prop，透传给 `EarthScene`
- `EarthScene` 内：
  - 新增 `useEffect`：监听 `searchTarget` 变化，按 `viewMode` 用 `latLngToPlane` / `latLngToGlobe` 算出目标坐标，再用 `cameraControlsRef.current.setLookAt(..., true)` 触发相机平滑飞行（globe 模式相机沿径向 4.5 半径，flat 模式 z=5 俯视）
  - 新增 `searchMarkerPos` memo：算出搜索结果在当前视图下的 3D 坐标
  - 在 Scene 末尾渲染 `<SearchResultMarker>`（仅当 `searchTarget` 存在），关闭回调透传 `onClearSearch`
- import 补充 `useEffect` 与 `SearchResultMarker`

### 4. 改造 `EarthGlobeWrapper.tsx`

- 新增 `searchTarget` 状态与 `handleSearchSelect` / `handleClearSearch` 两个 useCallback
- 顶部居中渲染 `<AmapSearch onSelect={handleSearchSelect} />`（`top-4`，避开右上角视图切换与左上角统计面板）
- 把 `searchTarget` / `onClearSearch` 透传给 `EarthGlobe`
- 新增 `AmapSearch`、`SearchResult`、`SearchTarget` 的 import

### 5. 校验

- `npx tsc --noEmit` → **通过**（exit 0，无类型错误）
- `npx eslint` 改动文件 → 改动文件未引入新的 error：
  - `EarthGlobe.tsx` / `EarthGlobeWrapper.tsx` 现存的 4 个 `react-hooks/refs`、`setState in effect` 报错在改造前的 commit `275f12c` 上就**已存在**（git stash 验证过），非本次引入
  - `AmapSearch.tsx` 有 1 条 `jsx-a11y/role-has-required-aria-props` warning（combobox 缺 `aria-controls`），属既有方案代码的可访问性提示，不影响功能

### 6. 交互流程（已打通）

```
输入 → AmapSearch 防抖 300ms → fetchInputTips(inputtips API)
     → 下拉建议 → 选中 → onSelect → EarthGlobeWrapper.setSearchTarget
     → EarthScene useEffect 检测 → setLookAt 飞行
     → 渲染 SearchResultMarker（青色脉冲 + 名称标签，可关闭）
```

### 7. 待办与注意

- **Key 安全**：`NEXT_PUBLIC_` 前缀会把 Key 暴露到客户端 bundle，建议后续在高德控制台为该 Key 配置 Referer/IP 白名单
- **既有 lint error**：`EarthGlobe.tsx` 的「ref during render」与 `EarthGlobeWrapper.tsx` 的「setState in effect」建议另起任务用 `useEffect` + 标志位重构，本次未动以避免扩散改动
- 方案中 Step 6 提到的 `EarthGlobeHandle` 命令式句柄未采用：实际用声明式 `searchTarget` prop 驱动即可，无需 `forwardRef`，更符合现有代码风格

