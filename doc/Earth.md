# 3D 地球实现方案

> ⚠️ 历史决策文档：方案 A（Mapbox 3D Globe）已废弃，项目最终采用方案 B（Three.js EarthGlobe）。本文保留作为决策记录，正文中的 Mapbox 代码/说明不再有效。

## 原始需求

我想要再地图页面增加一个地球的效果，可以滚动和缩放，然后将云南地区标记出来，表示该地区我已经去过。

---

## 可行性分析

### 当前技术栈与现状

| 维度 | 现状 |
|------|------|
| **地图库** | 已安装 `mapbox-gl` v3.24 + `react-map-gl` v8.1，渲染 2D 深色地图 |
| **3D 库** | 无任何 3D/WebGL 依赖 |
| **数据模型** | `MapPoint` 类型已支持 `visited` / `highlight` / `wishlist` |
| **Mapbox Token** | 已配置 `NEXT_PUBLIC_MAPBOX_TOKEN` 并正常工作 |
| **主题** | 深色背景 (#000) + 橙色强调色 (#fb923c) |
| **现有地图页** | `src/app/map/page.tsx` → `WorldMap.tsx`，全屏 2D 地图 + 侧边栏统计 |

### 三种实现方案对比

| | 方案 A: Mapbox 3D Globe | 方案 B: Three.js (R3F) | 方案 C: globe.gl |
|---|---|---|---|
| **新增依赖** | 0 | `three` + `@react-three/fiber` + `@react-three/drei` | `globe.gl` |
| **体积增量** | 0 KB | ~250 KB gzipped | ~150 KB gzipped |
| **视觉效果** | 地图式 3D 地球，真实地形 | 太空漂浮地球，最震撼 | 数据可视化地球 |
| **滚动/缩放** | 内置，原生体验 | 需手动实现 OrbitControls | 内置 |
| **拖拽旋转** | 内置（右键/双指） | OrbitControls | 内置 |
| **云南标记** | GeoJSON Polygon / FillLayer | 3D 球面坐标标记点 + 发光 | 经纬度标记 |
| **飞行过渡** | flyTo 内置全景飞行 | 需手动实现相机动画 | 无 |
| **与现有代码整合** | 改 ~5 行即可 | 需全新组件 ~400 行 | 需全新组件 |
| **地形起伏** | 内置 terrain +  exaggeration | 需自行贴图模拟 | 无 |
| **大气效果** | 内置 fog + atmosphere | 需 shader 实现 | 无 |
| **移动端性能** | 优秀（Mapbox 优化） | 良好-中等 | 良好 |
| **复用 Mapbox Token** | ✅ | ❌ | ❌ |
| **兼容现有 MapPoint 数据** | ✅ 100% | ❌ 需转换 | ❌ 需转换 |

---

## 推荐方案：方案 A — Mapbox GL JS 3D Globe

### 选择理由

1. **零新依赖** — `mapbox-gl` v3 已内置 `projection: 'globe'`（自 v2.6 起支持），Mapbox token 直接复用
2. **改动极小** — 在现有 `WorldMap.tsx` 上改动，不需要新建组件
3. **原生体验** — 旋转 / 缩放 / 倾斜 / 飞行动画全是 Mapbox 内置能力，移动端手势开箱即用
4. **地形真实** — 云南可用 GeoJSON FillLayer 精确标记省份轮廓，地形起伏在 globe 模式下可见
5. **与现有 MapPoint 体系无缝衔接**，所有 DB 中已有的标记点自动显示在地球上
6. **后续可升级** — 方案 A 作为基础，未来可叠加 Three.js 作为增强

---

## 实现方案

### 整体架构

```
src/
├── components/map/
│   ├── WorldMap.tsx          ← 改造：启用 globe 投影，添加云南标记层
│   └── YunnanOverlay.tsx     ← 新增：云南区域高亮 + 脉冲标签
├── app/map/
│   └── page.tsx              ← 少量调整（新增地球复位按钮等 UI）
├── lib/
│   └── map-constants.ts      ← 新增：云南 GeoJSON、地球默认视角常量
└── types/
    └── map.ts                ← 不变
```

### Step 1 — 启用 3D Globe 投影

**文件：`src/components/map/WorldMap.tsx`**

在 `<Map>` 组件上新增以下 props：

```tsx
<Map
  // 核心：切换到 3D 地球模式
  projection="globe"

  // 大气层 + 星空效果
  fog={{
    color: '#000000',         // 星空背景
    "high-color": '#1a1a2e',  // 大气顶部颜色
    "horizon-blend": 0.2,     // 地平线混合强度
  }}

  // 地形起伏（可选，需要 Mapbox terrain 数据源）
  terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}

  // 初始视角：以云南为中心
  initialViewState={{
    longitude: 102,           // 云南经度中心
    latitude: 25,             // 云南纬度中心
    zoom: 4,                  // 显示中国及周边
    pitch: 30,                // 倾斜视角增强 3D 感
  }}

  // 其余 props 保持不变
  mapboxAccessToken={token}
  mapStyle="mapbox://styles/mapbox/dark-v11"
  attributionControl={false}
>
```

### Step 2 — 添加云南区域 GeoJSON 标记

**文件：`src/lib/map-constants.ts`**（新建）

```typescript
// 云南省简化 GeoJSON（多边形坐标，低缩放级别无需高精度）
export const YUNNAN_GEOJSON = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { name: "云南", visited: true },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [97.5, 21.0], [106.0, 21.0], [106.0, 29.0],
          [97.5, 29.0], [97.5, 21.0],
        ]],
      },
    },
  ],
};

// 地球默认视角
export const EARTH_DEFAULT_VIEW = {
  longitude: 102,
  latitude: 25,
  zoom: 4,
  pitch: 30,
};
```

> **说明**：先用矩形近似框出云南范围，后续可替换为精确的省级行政区划 GeoJSON（数据源：[DataV.GeoAtlas](https://datav.aliyun.com/portal/school/atlas/area_selector) 可获取中国各省 GeoJSON）。

**文件：`src/components/map/WorldMap.tsx`**

```tsx
import { Source, Layer } from "react-map-gl/mapbox";
import { YUNNAN_GEOJSON, EARTH_DEFAULT_VIEW } from "@/lib/map-constants";

// 在 Map 内部添加云南填充层：
<Source id="yunnan" type="geojson" data={YUNNAN_GEOJSON}>
  {/* 半透明填充 */}
  <Layer
    id="yunnan-fill"
    type="fill"
    paint={{
      "fill-color": "#fb923c",    // 橙色填充
      "fill-opacity": 0.3,
      "fill-outline-color": "#fdba74",  // 浅橙边框
    }}
  />
  {/* 发光边框 */}
  <Layer
    id="yunnan-glow"
    type="line"
    paint={{
      "line-color": "#fb923c",
      "line-width": 2,
      "line-opacity": 0.8,
      "line-blur": 4,            // 外发光效果
    }}
  />
</Source>
```

### Step 3 — 添加云南脉冲标记点

**文件：`src/components/map/YunnanOverlay.tsx`**（新建）

在云南中心位置放置一个脉冲呼吸动画标记：

```tsx
"use client";

import { Marker } from "react-map-gl/mapbox";

export function YunnanMarker() {
  return (
    <Marker longitude={102.0} latitude={25.0}>
      <div className="relative flex flex-col items-center">
        {/* 外圈脉冲 */}
        <span className="absolute top-0 w-5 h-5 bg-orange-400/40 rounded-full animate-ping" />
        {/* 实心标记 */}
        <span className="relative w-3.5 h-3.5 bg-orange-400 rounded-full border-2 border-orange-300 shadow-lg shadow-orange-400/50 block" />
        {/* 标签 */}
        <span className="mt-1.5 text-[10px] font-semibold text-orange-300 whitespace-nowrap bg-black/60 px-1.5 py-0.5 rounded">
          云南 ✓
        </span>
      </div>
    </Marker>
  );
}
```

### Step 4 — 优化交互体验

#### 4.1 全局手势设置

`<Map>` 上的手势 props（均为 Mapbox 内置，无需额外实现）：

```tsx
<Map
  dragRotate     // 右键拖动 = 旋转地球（桌面端）
  touchZoomRotate // 双指旋转 + 缩放（移动端）
  touchPitch     // 双指上下滑动 = 调整俯仰
  scrollZoom     // 滚轮缩放
  doubleClickZoom // 双击放大
  pitchWithRotate={false}  // 避免旋转时意外改变俯仰
>
```

#### 4.2 飞行过渡优化

修改 `flyToPoint` 函数，加入环绕地球的飞行曲线：

```tsx
const flyToPoint = useCallback((point: MapPoint) => {
  mapRef.current?.flyTo({
    center: [point.longitude, point.latitude],
    zoom: 8,
    pitch: 45,        // 飞行到位后倾斜
    bearing: 0,       // 正北方向
    duration: 2500,
    curve: 1.5,       // 飞行弧度（越大越"飞天"）
  });
}, []);
```

#### 4.3 自动旋转（idle 状态）

可选：在地图空闲一段时间后自动缓慢旋转：

```tsx
import { useControl } from "react-map-gl";
import mapboxgl from "mapbox-gl";

// 使用 useControl 添加自动旋转逻辑
useControl(() => {
  let autoRotateTimer: ReturnType<typeof setInterval>;

  const startAutoRotate = () => {
    autoRotateTimer = setInterval(() => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      const center = map.getCenter();
      map.easeTo({
        center: [center.lng + 0.15, center.lat],
        duration: 1000,
        easing: (t) => t,  // 线性旋转
      });
    }, 1200);
  };

  // 用户交互时停止，idle 时恢复
  // ... 事件监听逻辑
});
```

### Step 5 — 地图页 UI 调整

**文件：`src/app/map/page.tsx`**

在侧边栏中新增"复位视角"按钮：

```tsx
// 在 StatItem 区域下方添加：
<button
  onClick={() => {
    // 通过 ref 或事件触发 WorldMap 的 flyTo
  }}
  className="mt-4 w-full text-xs py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors border border-white/5"
>
  🗺️ 复位视角
</button>
```

> 需要将 `WorldMap` 的 `mapRef` 通过 `useImperativeHandle` + `forwardRef` 暴露，或者在 page 层管理全局 reset 事件。

---

## 文件变更清单

| 文件 | 操作 | 预估行数 |
|------|------|----------|
| `src/components/map/WorldMap.tsx` | 修改 | +30 行 |
| `src/components/map/YunnanOverlay.tsx` | 新建 | ~30 行 |
| `src/lib/map-constants.ts` | 新建 | ~30 行 |
| `src/app/map/page.tsx` | 修改 | +10 行 |
| **总计** | | **~100 行** |

---

## 不兼容 / 注意事项

| 风险点 | 说明 | 应对 |
|--------|------|------|
| **云南 GeoJSON 精度** | 简化的矩形框不够精确，精确的省级行政区划多边形坐标点较多 | 先用矩形近似，后续可引入精确 GeoJSON（gzip 后 ~5KB） |
| **Terrain 数据源** | `mapbox-dem` 需要额外的 tile 请求配额 | 非必须功能，可先不加 terrain，待确认配额后再启用 |
| **移动端手势冲突** | 移动端单指拖动默认平移地图，双指才旋转 | 可通过 `dragRotate` + `touchZoomRotate` 精确控制；默认行为已合理 |
| **深色主题一致** | Mapbox dark-v11 在 globe 模式下的海洋颜色需确认 | 可微调 `fog.color` 匹配 `#000000` 背景 |
| **低端设备性能** | Globe 投影比 2D 消耗更多 GPU | Mapbox 已有较好的降级策略；低端机帧率可能降到 30fps |

---

## 备选方案：方案 B — Three.js 太空地球

如果方案 A 的"地图式地球"不够震撼，可升级为 Three.js（react-three-fiber）实现"太空漂浮地球"效果：

1. 安装依赖：`three @react-three/fiber @react-three/drei`
2. 创建 `src/components/map/EarthGlobe.tsx`（~300 行）：
   - `SphereGeometry` + 地球纹理贴图（NASA Blue Marble 或 similar）
   - 大气光晕 shader 效果
   - `OrbitControls` 实现旋转 / 缩放
   - 云南坐标转换（lat/lng → 3D 球面坐标），放置发光 `Marker`
   - 星空粒子背景
3. 在 map page 中叠加或替换现有 `WorldMap`
4. 工作量约 **4-5 倍于方案 A**，约 300-500 行新代码

---

## 最终决策：方案 B — Three.js 太空地球

### 决策原因

Mapbox 注册受阻，无法获取 Token，方案 A（Mapbox Globe）无法执行。切换至方案 B，使用 Three.js 自建 3D 地球，零外部 API 依赖。

---

## 实际实现

### 依赖安装

```bash
npm install three @react-three/fiber @react-three/drei
```

新增 3 个依赖，包体积增量约 250KB gzipped。

### 文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/map/EarthGlobe.tsx` | **新建** (~230 行) | Three.js 3D 地球组件 |
| `src/app/map/page.tsx` | **修改** (2 行) | `WorldMap` → `EarthGlobe` |
| `src/components/map/WorldMap.tsx` | 保留不变 | Mapbox 组件备用（Token 就绪后可切换） |
| `src/components/map/YunnanOverlay.tsx` | 保留不变 | Mapbox 方案组件备用 |
| `src/lib/map-constants.ts` | 保留不变 | 云南 GeoJSON 备用 |

### EarthGlobe.tsx 架构

```
EarthGlobe (外层容器 + Canvas)
└── Canvas (@react-three/fiber)
    └── Suspense (纹理加载)
        └── EarthScene
            ├── ambientLight + directionalLight × 2
            ├── EarthSphere (球体 + NASA 蓝大理石纹理)
            ├── Atmosphere (Fresnel 大气光晕 Shader)
            ├── MapPointMarkers (DB 标记点，经纬度→3D 转换)
            ├── YunnanGlow (云南脉冲光环 + 中心亮点)
            └── OrbitControls (旋转/缩放/自动旋转)
```

### 核心技术点

**1. 经纬度 → 3D 球面坐标**
```typescript
const phi = (90 - lat) × π / 180;
const theta = (lng + 180) × π / 180;
x = -R × sin(phi) × cos(theta);
y = R × cos(phi);
z = R × sin(phi) × sin(theta);
```

**2. 大气层 Fresnel 效果** — 自定义 ShaderMaterial，边缘发光（`pow(1 - dot(viewDir, normal), 3.0)`），中间透明

**3. 云南脉冲动画** — `useFrame` 驱动光环 scale/opacity 正弦波变化，频率 2.5Hz

**4. 轨道控制** — `OrbitControls` + autoRotate (0.3 rad/s) + damping (0.08) + 缩放限制 (3.5x–12x)

**5. 相机初始位置** — `[2.5, 1.2, 5]` 面朝亚洲/中国方向，fov 40°

**6. 地图标记点颜色** — 继承原有 MapPoint type 配色：
- `visited` → `#fb923c` (橙色)
- `highlight` → `#f472b6` (粉色)
- `wishlist` → 白色半透明

**7. SSR 兼容** — `"use client"` + `Suspense` 包裹，纹理加载时显示"地球加载中..."提示

### 构建验证

- `npx tsc --noEmit` ✅ 通过
- 零环境变量依赖（地球纹理从 threejs.org CDN 加载）

---

## 方案对比回顾

| 维度 | 方案 A (Mapbox) | 方案 B (Three.js) ✅ 已实现 |
|------|:---:|:---:|
| 外部依赖 | Mapbox API | 无 |
| 视觉效果 | 地图式地球 | 太空漂浮地球 |
| 地形真实度 | 高（真实地形数据） | 视觉近似（纹理贴图） |
| 离线可用 | ❌ | ✅ |
| 标记精度 | 省界多边形 | 坐标点 + 光环 |

---

> **状态**：✅ 方案 B 已实现
>
> **更新时间**：2026-06-12
