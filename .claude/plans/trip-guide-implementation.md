# 行程攻略功能实现计划

> 基于 `doc/amap-search-plan.md`（已实施）和 `doc/trip-plan.md`，结合项目架构，实现完整的行程攻略功能。

## 一、现状分析

| 已完成 | 待实现 |
|--------|--------|
| ✅ 3D 地球 + 搜索飞行（EarthGlobe + AmapSearch） | ❌ GuideEditor 右侧地图仍为占位 |
| ✅ 高德 API 封装（lib/amap.ts, types/amap.ts） | ❌ 行程模式/风格标签选择 |
| ✅ DestinationSearchField（admin 目的地搜索） | ❌ 地图标记点在地图上实时预览 |
| ✅ TripForm + MapPointsEditor | ❌ 行程详情页地图标记展示 |
| ✅ Trip CRUD API（POST/PUT/DELETE） | ❌ GuideEditor 左侧搜索→右侧地图联动 |
| ✅ 公开 trip 详情页（Markdown + 照片 + 评论） | |

## 二、核心改动总览

```
改动文件（4个）：
├── src/components/admin/GuideEditor.tsx    [修改] 嵌入真地图，串联搜索→飞行→标记
├── src/components/admin/TripForm.tsx       [修改] 新增行程风格标签选择器
├── src/components/map/EarthGlobe.tsx       [微调] 加载文字改为绝对定位覆盖层，Canvas 就绪后隐藏
└── src/app/trips/[slug]/page.tsx           [修改] 新增地图标记点列表展示

不改动文件：
├── EarthGlobeWrapper.tsx   — 无需改，公开地图页保持不变
├── AmapSearch.tsx          — 无需改
├── SearchResultMarker.tsx  — 无需改
├── DestinationSearchField  — 无需改
├── MapPointsEditor         — 无需改
├── lib/amap.ts             — 无需改
└── API / 数据库             — 无需改
```

## 三、文件详细设计

### 3.1 GuideEditor.tsx — 右侧地图接入（核心改动）

**当前状态**：右侧面板为纯占位 div，仅显示坐标文本和标记点计数。

**改造方案**：
- 直接用 `EarthGlobe` 组件（非 `EarthGlobeWrapper`，因为不需要搜索栏——搜索在左侧表单里）
- 将 `flyTarget` 状态转为 `SearchTarget` 格式传给 EarthGlobe
- 将 `mapPoints` 状态传给 EarthGlobe 作为标记点
- 添加 `onClearSearch` 回调清除 flyTarget

**关键代码逻辑**：
```tsx
// GuideEditor 内
import { EarthGlobe } from "@/components/map/EarthGlobe";
import type { SearchTarget } from "@/components/map/EarthGlobe";

// flyTarget（来自 DestinationSearchField 选中）→ searchTarget
const searchTarget: SearchTarget | null = flyTarget ? {
  id: `search-${flyTarget.latitude},${flyTarget.longitude}`,
  name: `${flyTarget.latitude.toFixed(4)}, ${flyTarget.longitude.toFixed(4)}`,
  longitude: flyTarget.longitude,
  latitude: flyTarget.latitude,
} : null;

// 右侧面板内
<EarthGlobe
  points={mapPoints}
  className="w-full h-full"
  searchTarget={searchTarget}
  onClearSearch={() => setFlyTarget(null)}
/>
```

**注意**：`DestinationSearchField.onRegionSelect` 传入的是 `SearchResult`，其中 `name` 字段是目的地名称（如"大理"），EarthGlobe 会渲染 `SearchResultMarker` 显示该名称。需要把搜索结果名称正确传递：
```tsx
const handleRegionSelect = useCallback((result: SearchResult) => {
  setFlyTarget({
    longitude: result.longitude,
    latitude: result.latitude,
  });
  // 同时保存名称供地图标记显示
  setSearchName(result.name);
}, []);
```

同时简化 `FlyTarget` 类型，增加 `name` 字段，使 `searchTarget` 正确显示名称。

### 3.2 TripForm.tsx — 行程风格标签选择器

**新增功能**：在"标签"字段下方增加可视化行程风格选择器。

**风格选项**（来自 trip-plan.md）：
```tsx
const TRIP_STYLES = [
  { key: "特种兵打卡", label: "⚡ 特种兵打卡", desc: "高强度" },
  { key: "休闲模式",   label: "☕ 休闲模式",   desc: "轻松" },
  { key: "度假模式",   label: "🏖️ 度假模式",   desc: "酒店度假" },
  { key: "美食之旅",   label: "🍜 美食之旅",   desc: "美食" },
  { key: "文化探索",   label: "🏛️ 文化探索",   desc: "文化" },
];
```

**交互设计**：
- 多选胶囊按钮（圆角 pill）
- 点击切换选中/取消
- 选中态：橙色边框 + 橙色半透明背景
- 未选中态：白色半透明边框
- 选中的风格自动加入 `form.tags`（供后端存储）

**实现方式**：
- 在 TripForm 内新增 `selectedStyles` 本地状态
- 编辑时从 `initialData.tags` 反向解析已选风格
- 提交时将 selectedStyles 合并到 tags 数组
- UI 放在"标签"输入框下方

### 3.3 EarthGlobe.tsx — 加载态微调

**问题**：当前 Canvas 下方的 `<div>地球加载中...</div>` 始终渲染在 DOM 中，Canvas 渲染后覆盖其上。在 split layout 中这个文本会短暂可见。

**微调**：无需改动逻辑，EarthGlobe 本身的 Canvas 有 `alpha: false` 不透明背景，加载文字被遮挡是正常的。保持现状即可。

真正的微调：将视口切换按钮在紧凑布局中略微下移避免与导航栏重叠：
- `top-20`（80px）在 admin 上下文中合适（navbar 是 h-16 = 64px）
- 无需改动，当前值够用

### 3.4 行程详情页 `trips/[slug]/page.tsx` — 地图标记展示

**新增**：在正文和照片之间增加"行程足迹"区块，展示该 trip 关联的地图标记点。

```tsx
{trip.map_points && trip.map_points.length > 0 && (
  <section className="max-w-3xl mx-auto px-4 py-12 border-t border-white/10">
    <h2 className="text-2xl font-bold mb-6">行程足迹</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {trip.map_points.map((point) => (
        <div key={point.id} 
          className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
          <MapPin size={14} className="text-orange-400 shrink-0" />
          <div>
            <p className="text-sm text-white/80">{point.name}</p>
            <p className="text-xs text-white/40">
              {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>
)}
```

## 四、交互流程图

```
┌─ GuideEditor ─────────────────────────────────────────────────┐
│                                                                │
│  ┌─ 左栏 (表单) ───────────────┐  ┌─ 右栏 (地图) ───────────┐ │
│  │                              │  │                          │ │
│  │  目的地搜索框                │  │  EarthGlobe              │ │
│  │  (DestinationSearchField)    │  │                          │ │
│  │    │                         │  │    ▲                     │ │
│  │    │ 选中"大理"              │  │    │ flyTo               │ │
│  │    │ onRegionSelect()        │  │    │                     │ │
│  │    ▼                         │  │  searchTarget ────────── │ │
│  │  flyTarget = {               │  │    │                     │ │
│  │    lat: 25.6, lng: 100.2    │  │    │  SearchResultMarker │ │
│  │    name: "大理"              │  │    │  (青色脉冲点)       │ │
│  │  }                           │  │    │                     │ │
│  │    │                         │  │    │                     │ │
│  │    └──── searchTarget ───────┼──┘    │                     │ │
│  │                              │  │                          │ │
│  │  地图标记点编辑器            │  │  mapPoints 实时渲染      │ │
│  │  (MapPointsEditor)           │  │  (橙色/粉色标记点)       │ │
│  │    │                         │  │    ▲                     │ │
│  │    │ onChange                │  │    │                     │ │
│  │    ▼                         │  │    │                     │ │
│  │  mapPoints ──────────────────┼──┘    │                     │ │
│  │                              │  │                          │ │
│  │  行程风格标签                │  │                          │ │
│  │  [特种兵] [休闲] [美食] ...  │  │                          │ │
│  │    │ 合并到 tags[]           │  │                          │ │
│  │    ▼                         │  │                          │ │
│  │  保存 → POST /api/trips      │  │                          │ │
│  └──────────────────────────────┘  └──────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## 五、改动影响评估

| 改动项 | 风险 | 影响范围 |
|--------|------|----------|
| GuideEditor 嵌入 EarthGlobe | 低 — EarthGlobe 已稳定，仅 props 连接 | 仅 admin/guide 页面 |
| TripForm 新增风格标签 | 低 — 纯前端 UI，不影响 API 契约 | TripForm 所有使用方（/admin/trips/new, /admin/trips/[id]/edit, /admin/guide） |
| EarthGlobe 加载态微调 | 极低 — 仅 CSS/条件渲染 | 公开 /map 页 + admin/guide 页 |
| 详情页增加标记点列表 | 极低 — 纯展示 | 公开 trip 详情页 |

## 六、实现顺序

1. **GuideEditor.tsx** — 嵌入 EarthGlobe，串联搜索→飞行→标记（核心功能，约 +30/-20 行）
2. **TripForm.tsx** — 新增行程风格标签选择器（约 +50 行）
3. **trips/[slug]/page.tsx** — 新增地图标记点列表（约 +20 行）
4. **验证** — `npx tsc --noEmit` + 人工测试
