## 1. 工具函数

- [x] 1.1 在 `src/lib/amap.ts` 新增 `getZoomForAdcode(adcode: string): number` — 根据 adcode 后缀推算 zoom 级别（0000→7, 00→11, 其他→14, 空→12）

## 2. 类型与地图组件

- [x] 2.1 `SearchTarget` 接口增加 `zoom?: number` 可选字段
- [x] 2.2 `AmapMapContainer` 搜索目标飞行逻辑改为 `map.setZoomAndCenter(searchTarget.zoom ?? 12, ...)`

## 3. 调用端集成

- [x] 3.1 `GuidePage` 创建 `SearchTarget` 时透传 `selectedResult.adcode`，调用 `getZoomForAdcode` 计算 zoom

## 4. Verification

- [x] 4.1 `npx tsc --noEmit` — 0 errors
- [x] 4.2 `npm run build` — 编译通过
- [ ] 4.3 手动测试：搜索"云南省" → 地图缩放至全省（zoom~7）
- [ ] 4.4 手动测试：搜索"大理" → 地图缩放至城市范围（zoom~11）
- [ ] 4.5 手动测试：搜索具体 POI（如"大理古城"） → 地图缩放至近距离（zoom~14）
- [ ] 4.6 手动测试：不传 zoom 的现有调用方（如 TripForm）行为不变
