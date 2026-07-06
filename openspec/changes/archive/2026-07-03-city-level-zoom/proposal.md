## Why

当用户搜索并选择目的地时，高德地图始终缩放到固定 zoom=12，不区分省级、市级、区县级或具体 POI。这导致选"云南省"时缩放过近看不到全省、选具体街道时又不够近。需要根据行政区划层级自动调整缩放级别。

## What Changes

- `SearchTarget` 接口增加可选 `zoom` 字段，允许调用方指定缩放级别
- 新增 `getZoomForAdcode()` 工具函数，根据高德 adcode（6 位行政区编码）推算合适 zoom
- `AmapMapContainer` 搜索目标飞行时使用 `searchTarget.zoom ?? 12`
- `GuidePage` 创建 `SearchTarget` 时透传 `selectedResult.adcode`，计算 zoom

## Capabilities

### New Capabilities
<!-- 无新增能力，属于现有地图功能的增强 -->

### Modified Capabilities
- **external-apis**: 高德地图搜索目标飞行行为从固定 zoom 变更为根据 adcode 自适应 zoom

## Impact

| 影响范围 | 文件 |
|----------|------|
| 类型定义 | `src/components/map/AmapMapContainer.tsx` — `SearchTarget` 加 `zoom?: number` |
| 工具函数 | `src/lib/amap.ts` — 新增 `getZoomForAdcode()` |
| 地图组件 | `src/components/map/AmapMapContainer.tsx` — `setZoomAndCenter` 使用动态 zoom |
| 调用页面 | `src/app/admin/guide/page.tsx` — 透传 adcode 计算 zoom |
| 管理表单 | `src/components/admin/TripForm.tsx` — 无需改动（未启用 regionSearch） |

无 API 变更，无数据库迁移，无破坏性变更。
