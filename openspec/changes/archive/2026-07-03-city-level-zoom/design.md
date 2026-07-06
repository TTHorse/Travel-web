## Context

`AmapMapContainer` 在搜索目标飞行时始终使用 `setZoomAndCenter(12, ...)`，未区分目的地层级。高德 adcode 是 6 位行政区编码：
- `xx0000` → 省级（省/自治区/直辖市）
- `xxxx00`（后2位 00 但非 0000）→ 地级市
- 完整 6 位无 00 后缀 → 区县级

当前 `SearchResult` 已携带 `adcode` 字段（从 `AmapInputTip.adcode` 透传），但 `SearchTarget` 未传递。

## Goals / Non-Goals

**Goals:**
- 根据目的地行政区层级自动选择合适的地图缩放级别
- 搜索"云南省"时 zoom~7 展示全省，"大理"时 zoom~11 展示城市范围，"大理古城"时 zoom~15 展示具体位置
- 最简改动：不改 Amap 类型层、不新增 API 调用

**Non-Goals:**
- 不引入反向地理编码 API 调用（已有的 `geocodeAddress` 足够）
- 不修改 `SearchResult` 类型（保持 adcode 透传）
- 不在 `AmapMapContainer` 内做层级判断（保持地图组件职责单一）

## Decisions

### Decision 1: Zoom 计算放在调用端（GuidePage），不放地图组件内

**选择**：在 `GuidePage` 创建 `SearchTarget` 时计算 zoom，地图组件仅消费 `searchTarget.zoom ?? 12`。

**理由**：
- `AmapMapContainer` 保持纯展示组件，不引入 adcode 解析逻辑
- 不同调用端可自由选择自己的 zoom 策略（如 TripForm 可能不需要此功能）
- 符合现有 `SearchTarget` 的 "调用端构建、地图端消费" 模式

**备选方案**：地图组件内部解析 — 拒绝，因为需向 `SearchTarget` 透传 adcode，反而增加地图组件职责。

### Decision 2: `getZoomForAdcode()` 放在 `src/lib/amap.ts`

**选择**：纯函数，输入 adcode 字符串，输出数字 zoom。

**规则**：
```
adcode 以 "0000" 结尾  → zoom = 7   (省级)
adcode 以 "00" 结尾    → zoom = 11  (市级)
adcode 为空或无法匹配  → zoom = 12  (默认/区县级)
其他                   → zoom = 14  (具体 POI)
```

**理由**：adcode 模式匹配简单可靠，无需网络请求。高德 adcode 规范稳定。

### Decision 3: SearchTarget 加 `zoom?: number`

**选择**：可选字段，不设默认值。`AmapMapContainer` 内使用 `searchTarget.zoom ?? 12`。

**理由**：向后兼容 — 不传 zoom 的现有调用方保持 zoom=12 行为不变。

## Risks / Trade-offs

- **[低] adcode 为空时的行为**：空 adcode 回退 zoom=12，与当前行为一致，无退化
- **[低] 非标准 adcode**：部分 tip 的 adcode 格式可能不完全遵循规则 → 已有兜底 zoom=12
- **[低] zoom 粒度**：省级/市级/区县级三档可能不够精细 → 后续可引入更细的 typecode 映射，当前范畴内足够
