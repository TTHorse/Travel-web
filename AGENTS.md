<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Travel-web · Agent Instructions

> 个人旅游记录网站 — Next.js 16 + React 19 + Tailwind v4 + Supabase + Three.js + 高德 API

## OpenSpec Workflow

本项目使用 [OpenSpec](https://github.com/Fission-AI/OpenSpec) 进行规范驱动开发。规范文件在 `openspec/` 目录。

### Specs（系统真相源）
```
openspec/specs/
├── ui/spec.md             # 组件接口、样式约定、Server/Client 边界
├── architecture/spec.md   # 数据流、路由结构、状态管理
├── data/spec.md           # Supabase 访问、Schema、RLS
└── external-apis/spec.md  # 高德 API、Cloudinary、AI SDK、Three.js
```

### 变更流程

**开始新功能前，先读相关 spec：**
1. 查阅 `openspec/specs/<domain>/spec.md` 了解当前系统行为
2. 创建变更目录 `openspec/changes/<change-name>/`
3. 编写 `proposal.md` → `specs/<domain>/spec.md` (delta) → `design.md` → `tasks.md`
4. 按 `tasks.md` 清单实现
5. 完成后将 delta specs 合并到 `openspec/specs/`，归档到 `openspec/changes/archive/`

### Spec 格式
```markdown
# Delta for <Domain>

## ADDED Requirements
### Requirement: <Name>
The system SHALL <behavior>.
#### Scenario: <Name>
- GIVEN <precondition>
- WHEN <action>
- THEN <expected outcome>

## MODIFIED Requirements
## REMOVED Requirements
```

### 实现后检查
- `npx tsc --noEmit` — 0 errors
- `npm run build` — 编译通过
- 手动测试 `http://localhost:3007`

---

## 技术栈（锁定）

| 类别 | 技术 | 版本 | 备注 |
|------|------|------|------|
| 框架 | Next.js (App Router) | 16.2.9 | 仅 App Router，禁止 Pages Router |
| UI | React | 19.2.4 | Server Components 优先 |
| 样式 | Tailwind CSS | v4 | `@theme inline` 语义 token |
| 类型 | TypeScript | 5 | strict mode |
| 验证 | Zod | v4 | 全链路 schema |
| 数据库 | Supabase | `@supabase/ssr` | 通过 `src/lib/data/` 访问 |
| 图片 | Cloudinary | `next-cloudinary` | `<CldImage>` 组件 |
| 地图 | Three.js (R3F + drei) + 高德 API | — | 3D 地球替代 Mapbox |
| 动画 | GSAP + Framer Motion + Lenis | — | 惯性滚动 + 页面过渡 |

## 硬性约束

### ❌ 禁止
- **Mapbox GL JS / mapbox-gl**（已废弃，改用 Three.js + 高德）
- **Pages Router** (`pages/` 目录) 或旧版 Next.js API
- **`any` 类型** — 所有函数/组件必须有明确类型
- **客户端直连 Supabase** — 必须通过 `src/lib/supabase/` 封装 + `src/lib/data/` 访问
- **裸 `<img>` 标签** — 用 `<CldImage>` 或 Next.js `<Image>`
- **硬编码颜色值** — 用 Tailwind semantic token（`text-primary`、`bg-surface` 等）

### ✅ 强制
- 所有组件接受 `className?: string`，用 `cn()` 合并
- Server Component 默认，交互组件才加 `'use client'`
- API 路由放 `src/app/api/`
- 数据访问封装在 `src/lib/data/`
- 命名导出 (`export function`) 用于共享组件，默认导出用于页面
- 构建通过才能提交

## 目录结构

```
src/
├── app/                    # App Router 页面 + API
│   ├── admin/              # 管理后台
│   ├── trips/[slug]/       # 旅行详情
│   ├── gallery/            # 画廊
│   ├── map/                # 3D 地球
│   └── api/                # Route Handlers
├── components/
│   ├── ui/                 # Button, Card, Modal, Skeleton...
│   ├── layout/             # Header, Footer...
│   ├── trip/               # TripCard, TripHero...
│   ├── map/                # EarthGlobe, AmapMapContainer...
│   ├── gallery/            # GalleryGrid, PhotoLightbox...
│   ├── admin/              # TripForm, GuideEditor...
│   ├── home/               # HeroSection...
│   └── providers/          # AuthProvider, ThemeProvider...
├── lib/
│   ├── supabase/           # client.ts, server.ts, middleware.ts
│   ├── data/               # trips.ts, comments.ts (数据访问层)
│   ├── constants.ts
│   ├── utils.ts            # cn(), formatDate(), sleep()
│   └── amap.ts             # 高德 API 封装
├── hooks/                  # useTripData, useMapMarkers...
└── types/                  # trip.ts, photo.ts, comment.ts, amap.ts
```

## 代码风格

- **注释**：复杂业务逻辑用中文，简单逻辑用英文
- **导入顺序**：React/Next → 第三方库 → 本地模块 → 类型
- **提交信息**：`<type>: <description>`（英文），type: feat/fix/refactor/style/docs/chore
