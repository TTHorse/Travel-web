# 行程攻略页面独立化改造

> 将 `/admin/guide` 从 admin 侧边栏布局中独立出来，变为全屏的地图探索工具。与行程管理（TripForm）解耦。

## 一、问题分析

当前 `/admin/guide` 页面：
- 继承 `admin/layout.tsx` 的侧边栏 + 底部导航
- 左侧渲染 TripForm（完整行程表单），与 `/admin/trips/new` 共用
- 右侧嵌入 AmapMapContainer

用户期望：
- **无侧边栏** — 全屏独立页面
- **面包屑返回** — 左上角可返回上一页
- **搜索 + 地图** — 左侧仅地域搜索，右侧地图联动
- **与行程管理解耦** — 不用 TripForm

## 二、方案选择

| 方案 | 改动量 | 说明 |
|------|--------|------|
| ~~Route Groups~~ | 大（移动 7+ 文件） | 架构干净但改动太大 |
| ✅ **条件布局** | 小（改 3 个文件） | admin layout 检测 guide 路由，跳过侧边栏 |

## 三、文件改动

### 3.1 `src/proxy.ts` — 中间件设置路由标识

在中间件中为响应注入 `x-pathname` header，供布局组件读取当前路由。

```typescript
// proxy.ts 改动
export async function proxy(request: NextRequest) {
  // 注入当前 pathname 供服务端组件读取
  const response = await updateSession(request);
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}
```

### 3.2 `src/app/admin/layout.tsx` — 条件跳过侧边栏

```typescript
// admin/layout.tsx 改动
import { headers } from "next/headers";

export default async function AdminLayout({ children }) {
  // ...
  if (!user) return <>{children}</>;

  // 读取中间件注入的 pathname
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // 行程攻略页：无侧边栏，全屏渲染
  if (pathname.startsWith("/admin/guide")) {
    return <>{children}</>;
  }

  // 其他 admin 页面：带侧边栏
  return (/* 现有侧边栏布局 */);
}
```

### 3.3 `src/app/admin/guide/page.tsx` — 独立搜索+地图

全新的简洁页面，不再使用 GuideEditor（不再引用 TripForm）：

```
┌──────────────────────────────────────────────────┐
│ ← 返回          行程攻略                           │  ← 顶部栏（面包屑 + 标题）
├─────────────────┬────────────────────────────────┤
│                 │                                │
│  目的地搜索框     │     高德 2D 地图                 │
│  (带下拉联想)     │     AmapMapContainer            │
│                 │                                │
│  选中后：         │     ← 地图自动飞到目标           │
│  - 地点名称      │       并放大到 zoom 12           │
│  - 经纬度        │                                │
│  - 地址          │     ← 青色脉冲标记               │
│                 │     ← 信息窗（含关闭按钮）          │
│                 │                                │
└─────────────────┴────────────────────────────────┘
```

**核心逻辑**：
- 左侧：`DestinationSearchField`（复用现有组件，已有 Amap 联想功能）
- 右侧：`AmapMapContainer`（复用现有组件）
- 状态管理：`flyTarget` + `searchTarget` 转换（同现有 GuideEditor 逻辑）
- 无需 MapPointsEditor（不保存标记点，纯探索工具）
- 无需 TripForm（不与行程管理系统耦合）

### 3.4 `GuideEditor.tsx` — 不再使用

现有 `GuideEditor.tsx` 组件在改造后不再被引用，但保留文件不删除（未来可能复用）。

## 四、改动影响

| 文件 | 操作 | 行数变化 |
|------|------|----------|
| `src/proxy.ts` | 修改 | +2 行 |
| `src/app/admin/layout.tsx` | 修改 | +7 行 |
| `src/app/admin/guide/page.tsx` | 重写 | ~80 行（原 5 行） |
| `src/components/admin/GuideEditor.tsx` | 不再引用 | 保留不变 |

## 五、交互流程

```
用户访问 /admin/guide
  → admin layout 检测到 guide 路由 → 跳过侧边栏
  → 全屏渲染搜索+地图

用户在搜索框输入"大理"
  → DestinationSearchField 调用 Amap inputtips API
  → 下拉显示联想结果（大理、大理古城、大理大学...）

用户选中"大理"
  → flyTarget = { lng: 100.23, lat: 25.61, name: "大理" }
  → AmapMapContainer.searchTarget 变化
  → 地图飞到大理（zoom 12）+ 青色脉冲标记 + 信息窗

用户点击关闭按钮
  → flyTarget 清空 → 标记移除 → 地图回到默认视角
```

## 六、验证

- `npx tsc --noEmit` — 类型检查
- `npx eslint` — lint 检查
- 浏览器访问 `/admin/guide` — 无侧边栏、搜索+地图联动正常
- 浏览器访问 `/admin` / `/admin/trips` — 侧边栏仍正常渲染
