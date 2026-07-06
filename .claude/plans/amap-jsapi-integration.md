# GuideEditor 接入高德 JSAPI 2D 地图

> 将 GuideEditor 右侧面板从 3D EarthGlobe 替换为高德 JSAPI 2D 地图，提供真实瓦片、道路、POI 显示，更适合行程规划编辑场景。

## 一、方案选型

| 方案 | 说明 |
|------|------|
| `@amap/amap-jsapi-loader` | npm 包，官方推荐方式加载 JSAPI v2，返回 Promise<AMap> |
| CDN script 标签 | 方式老旧，React 生命周期管理麻烦 |
| 直接用 EarthGlobe | 当前方案，3D 好看但不适合精确编辑 |

**选 `@amap/amap-jsapi-loader`**，与项目 npm 生态一致，支持 TypeScript。

## 二、改动范围

```
安装依赖：@amap/amap-jsapi-loader
新增文件：
├── src/components/map/AmapMapContainer.tsx   [新建] 高德 2D 地图组件
├── src/types/amap-jsapi.d.ts                 [新建] 高德 JSAPI 类型声明（最小集）
修改文件：
├── src/components/admin/GuideEditor.tsx      [修改] EarthGlobe → AmapMapContainer
├── .env.local.example                        [修改] 追加 JSAPI Key 说明
```

## 三、组件设计

### 3.1 AmapMapContainer

```tsx
interface AmapMapContainerProps {
  className?: string;
  /** 地图标记点数组 */
  points: MapPoint[];
  /** 搜索飞行目标（选中目的地后地图飞过去） */
  searchTarget: SearchTarget | null;
  /** 清除搜索标记 */
  onClearSearch: () => void;
  /** 点击地图时回传经纬度（供外部添加到 MapPointsEditor） */
  onMapClick?: (name: string, lng: number, lat: number) => void;
}
```

**功能清单**：
| 功能 | 实现 |
|------|------|
| 加载 JSAPI | `AMapLoader.load({ key, version: '2.0' })` |
| 地图实例 | `new AMap.Map(container, { zoom, center })` |
| 缩放控件 | `plugins: ['AMap.ToolBar', 'AMap.Scale']` |
| 标记点渲染 | 为每个 MapPoint 创建 `AMap.Marker`，带颜色区分（visited=橙、highlight=粉、wishlist=灰） |
| 搜索飞行 | `searchTarget` 变化时调用 `map.setZoomAndCenter()` + 添加特殊高亮标记 |
| 信息窗体 | 点击标记弹出 `AMap.InfoWindow`：名称 + 坐标 + 类型标签 |
| 地图点击 | 点击空白处触发 `onMapClick`（可用于快速获取坐标） |
| 组件卸载 | `map.destroy()` 清理资源 |
| 响应式 | ResizeObserver 监听容器变化，调用 `map.resize()` |

### 3.2 生命周期

```
挂载 → AMapLoader.load() → new AMap.Map() → 初始化标记
  │
props 变化
  ├─ points 变化 → 清除旧标记 → 创建新标记
  ├─ searchTarget 变化 → map.setZoomAndCenter() + 搜索标记
  └─ 容器大小变化 → ResizeObserver → map.resize()
  │
卸载 → map.destroy()
```

### 3.3 标记颜色方案

| 类型 | 颜色 | 说明 |
|------|------|------|
| visited | 橙色 `#fb923c` | 已去过 |
| highlight | 粉色 `#f472b6` | 精选 |
| wishlist | 灰色 `#9ca3af` | 想去 |
| search | 青色 `#22d3ee` | 搜索目标（独立标记） |

使用自定义 marker content（SVG 圆形 + 脉冲动画）。

### 3.4 GuideEditor 改动

- 移除 `dynamic(() => import EarthGlobe)` 
- 移除 `SearchTarget` 类型导入
- 导入 `AmapMapContainer`
- 右侧面板改为渲染 `<AmapMapContainer>`
- 新增 `handleMapClick` 回调：将点击坐标自动添加到 MapPointsEditor（调用 `onMapPointsChange` 通知父组件）

但 MapPointsEditor 通过 TripForm 管理，GuideEditor 和 TripForm 之间通过 `onMapPointsChange` 镜像传递。地图点击添加标记的逻辑需要：
1. GuideEditor 接收 `onMapClick` 
2. GuideEditor 更新 `mapPoints` 状态
3. TripForm 通过 `onMapPointsChange` 收到更新

这里有个问题：TripForm 管理 mapPoints 主状态，GuideEditor 通过 `onMapPointsChange` 只读镜像。要支持从地图点击添加标记，需要 GuideEditor 能修改 mapPoints。实现方式：
- GuideEditor 维护自己的 mapPoints 状态
- TripForm 通过 `onMapPointsChange` 回传地图已有点
- GuideEditor 的地图点击新增标记时自动合并

或者更简单的方式：GuideEditor 新增的标记直接添加到自己的 mapPoints 状态，而 TripForm 的 MapPointsEditor 只管理表单内的标记。这两套标记在地图上都显示即可。

**简化方案**：地图点击后弹出 prompt 输入名称，然后追加到 GuideEditor 的本地 mapPoints。TripForm 保存时只保存表单内的 mapPoints。地图上的标记 = TripForm 标记 + 地图点击标记（仅当次会话可见）。

实际上这样会丢失数据。更好的做法是让 GuideEditor 能反向控制 TripForm 的 mapPoints。由于 TripForm 已经通过 `onMapPointsChange` 镜像传出，我们可以让 GuideEditor 调用 TripForm 的某个方法来添加标记... 但这比较复杂。

**最终简化方案**：地图点击时通过 `window.prompt` 获取地点名称，然后 GuideEditor 将新标记合并到 mapPoints，同时通过 TripForm 的 `onMapPointsChange` 通知。但 TripForm 也需要知道新增了标记。最简单的办法是在 GuideEditor 层面管理 mapPoints 的"增补"——地图点击产生的标记追加到 GuideEditor 内部状态，在地图上与 TripForm 的主标记一起渲染，但保存时只保存 TripForm 主标记。

实际上这样用户在 MapPointsEditor 中看不到地图点击添加的标记，体验不好。

让我重新考虑：**去掉地图点击添加标记功能**，保持简单。地图仅用于：
1. 展示已保存的 mapPoints（来自 TripForm）
2. 响应搜索飞行的 flyTarget

如果用户想添加标记，通过左侧的 MapPointsEditor 手动输入坐标，然后在地图上看到效果。这是最清晰的单向数据流。

## 四、依赖与环境

### 安装
```bash
npm install @amap/amap-jsapi-loader
```

### 环境变量
`.env.local` 已有 `NEXT_PUBLIC_AMAP_WEB_KEY`。高德 JSAPI 使用同一个 Key，只需在 [高德控制台](https://console.amap.com/dev/key/app) 为该 Key 启用「Web端(JSAPI)」服务即可。

组件中新增常量兜底：
```ts
const AMAP_JSAPI_KEY = process.env.NEXT_PUBLIC_AMAP_JSAPI_KEY || process.env.NEXT_PUBLIC_AMAP_WEB_KEY || '';
```

## 五、改动影响

| 改动 | 影响范围 | 风险 |
|------|----------|------|
| 安装 @amap/amap-jsapi-loader | 全局 npm 依赖 | 低，官方包 |
| 新建 AmapMapContainer | 无影响 | 新组件 |
| GuideEditor 替换地图 | 仅 admin/guide 页面 | 低 |
| 公开 /map 页面 | 不变，仍用 EarthGlobe | 无 |

## 六、文件清单

| 文件 | 操作 | 预估行数 |
|------|------|----------|
| `src/components/map/AmapMapContainer.tsx` | 新建 | ~200 行 |
| `src/components/admin/GuideEditor.tsx` | 修改 | +10/-15 行 |
| `package.json` | 修改 | +1 依赖 |
| `.env.local.example` | 修改 | +2 行说明 |
