# 旅游记录网站 · 开发日志

> 开发时间：2026-06-12
> 项目路径：`/Users/user/Documents/Travel/Travel-web`

---

## 开发概览

| 项目 | 值 |
|------|-----|
| 框架 | Next.js 16.2.9 (Turbopack) |
| React | 19.2.4 |
| Tailwind CSS | v4 |
| TypeScript | v5 |
| 包管理器 | npm 10.8.3 |
| 源文件总数 | 54 个 |
| 构建状态 | ✅ 通过 |

---

## 开发阶段

### 阶段 1：项目初始化

**操作：**
- 使用 `create-next-app` 初始化项目（TypeScript + Tailwind + App Router + src-dir）
- 项目名因 npm 命名限制从 `Travel-web`（含大写）改为 `travel-web`
- 安装全部依赖包：Supabase、Cloudinary、GSAP、Framer Motion、Lenis、Mapbox、react-markdown 等共 19 个

**遇到的问题：**
- `create-next-app` 报错 "name can no longer contain capital letters" → 创建到临时目录 `travel-web-tmp`，手动迁移文件

---

### 阶段 2：项目结构与配置

**创建的文件：**

1. **`next.config.ts`** — 配置 `images.remotePatterns` 白名单（Cloudinary、Mapbox），启用 AVIF/WebP 格式
2. **`src/app/globals.css`** — Tailwind v4 主题配置（`@theme inline`），自定义暗色主题变量（`--color-primary: #fb923c` 等），Mapbox Popup 样式覆盖，Markdown 内容样式（`.prose`）
3. **`.env.local.example`** — 环境变量模板（Supabase、Mapbox、Cloudinary、SITE_URL）
4. **目录结构** — 按功能和层级组织：`components/{ui,layout,home,trip,map,gallery,admin,providers}`、`lib/{supabase,data}`、`hooks/`、`types/`
5. **`package.json`** — 修正 `name` 字段为 `travel-web`

**架构决策：**
- 采用 `src/` 目录隔离应用代码
- 类型文件独立放在 `src/types/`（Trip, Photo, Comment, MapPoint）
- 数据访问层放在 `src/lib/data/`，与服务端 Supabase 客户端解耦
- UI 组件单独目录（Button, Card, Skeleton, Badge, Modal）

---

### 阶段 3：核心库文件

**创建的文件：**

1. **`src/types/`** (5 文件)
   - `trip.ts` — Trip、TripSummary 接口（含关联 Photo/MapPoint）
   - `photo.ts` — Photo 接口
   - `comment.ts` — Comment 接口（支持 `parent_id` 回复）
   - `map.ts` — MapPoint 接口（`type: 'visited' | 'highlight' | 'wishlist'`）
   - `index.ts` — 统一导出

2. **`src/lib/utils.ts`** — `cn()` (clsx + tailwind-merge)，`formatDate()`（date-fns + 中文 locale），`formatDateRange()`，`sleep()`

3. **`src/lib/constants.ts`** — 导航链接、站点配置、地图默认视图等常量

4. **`src/lib/supabase/`** (3 文件)
   - `client.ts` — 浏览器端 Supabase 客户端（`createBrowserClient`）
   - `server.ts` — 服务端 Supabase 客户端（`createServerClient` + cookies）
   - `middleware.ts` — 认证中间件逻辑（`updateSession`）

5. **`src/lib/data/`** (2 文件)
   - `trips.ts` — `getPublishedTrips()`, `getTripBySlug()`, `getAllMapPoints()`, `getTravelStats()`
   - `comments.ts` — `getApprovedComments()`, `createComment()`

6. **`src/middleware.ts`** → 后续重命名为 **`src/proxy.ts`**（Next.js 16 新约定）

**遇到的问题：**
- `trip.ts` 中 `Trip` 接口引用了 `Photo` 和 `MapPoint` 但未导入 → 构建时报 `Cannot find name 'Photo'` → 添加 `import type`

---

### 阶段 4：布局组件与 Providers

**创建的文件：**

1. **`src/app/layout.tsx`** — 根布局，配置 Inter + Noto Sans SC 字体，集成 Navbar、ScrollProvider、Footer
2. **`src/components/layout/Navbar.tsx`** — 固定导航栏，滚动后毛玻璃效果（`backdrop-blur-xl`），桌面/移动端两套导航，当前路由高亮
3. **`src/components/layout/MobileMenu.tsx`** — Framer Motion 侧滑动画菜单（`spring` 动画）
4. **`src/components/layout/Footer.tsx`** — 简约页脚
5. **`src/components/providers/ScrollProvider.tsx`** — Lenis 惯性滚动封装，Route 变化时自动重建实例
6. **`src/components/providers/PageTransition.tsx`** — Framer Motion 页面切换动画（淡入上移效果）
7. **`src/components/ui/`** (5 文件) — Button（3 变体 × 3 尺寸）、Card（hover 效果）、Skeleton（骨架屏）、Badge、Modal

**遇到的问题：**
- Lenis v1.3.23 不再支持 `smoothTouch` 选项 → 已移除
- Framer Motion `ease: [0.25, 0.46, 0.45, 0.94]` 类型推断为 `number[]` 而非 tuple → 添加 `as const`

---

### 阶段 5：首页组件

**创建的文件：**

1. **`src/app/page.tsx`** — 首页 Suspense 边界包裹异步组件
2. **`src/components/home/HeroSection.tsx`** — GSAP ScrollTrigger 视差滚动，Hero 图片向上移动 30%，内容淡出
3. **`src/components/home/StatsCounter.tsx`** — 服务端组件，调用 `getTravelStats()` 获取统计
4. **`src/components/home/AnimatedNumber.tsx`** — GSAP 数字滚动动画（`fromTo` + `snap`）
5. **`src/components/home/RecentTrips.tsx`** — 显示最新 3 篇旅行，含空状态处理

**架构要点：**
- HeroSection 使用 Unsplash 图片作为默认背景
- StatsCounter 在数据库未配置时显示默认值 0（优雅降级）
- RecentTrips 在无数据时显示引导文案

---

### 阶段 6：旅行页面与组件

**创建的文件：**

1. **`src/app/trips/page.tsx`** — 旅行列表页，ISR 每小时重新生成（`revalidate = 3600`）
2. **`src/app/trips/loading.tsx`** — 列表骨架屏
3. **`src/app/trips/[slug]/page.tsx`** — 旅行详情页，封面 + Markdown 正文 + 照片画廊 + 评论区
4. **`src/app/trips/[slug]/loading.tsx`** — 详情页骨架屏
5. **`src/components/trip/TripCard.tsx`** — 卡片组件（Framer Motion 入场动画 + hover 上移）
6. **`src/components/trip/TripFilters.tsx`** — 标签筛选（带计数）
7. **`src/components/trip/MarkdownRenderer.tsx`** — react-markdown + remark-gfm + rehype-highlight
8. **`src/components/trip/CommentSection.tsx`** — 评论表单（react-hook-form + zod） + 评论列表

**遇到的问题：**
- react-markdown 的 `img` 组件 `src` 类型为 `string | Blob`，但 Next.js `<Image>` 只接受 `string | StaticImport` → 添加 `typeof src !== "string"` 检查
- zod v4 与 `@hookform/resolvers` 兼容性正常，无需额外处理

**SEO 配置：**
- 使用 `generateMetadata()` 动态生成 title、description、og:image
- 使用 `generateStaticParams()` 预生成热门旅行页面

---

### 阶段 7：画廊与地图

**创建的文件：**

1. **`src/app/gallery/page.tsx`** — 画廊占位页（照片通过旅行详情页展示）
2. **`src/components/gallery/PhotoGallery.tsx`** — 瀑布流布局（最短列优先算法），集成 Lightbox
3. **`src/app/map/page.tsx`** — 全屏世界地图，含侧边栏统计面板
4. **`src/components/map/WorldMap.tsx`** — Mapbox GL JS 封装，标记点 + 飞行动画 + Popup

**遇到的问题：**
- react-map-gl v8 使用 subpath exports，需从 `react-map-gl/mapbox` 导入而非 `react-map-gl` → 修改 import 路径
- `points` 变量隐式 `any[]` 类型 → 添加 `MapPoint[]` 类型注解

**Mapbox Token 安全：**
- Token 通过 `NEXT_PUBLIC_` 暴露给客户端，已在组件中添加 Token 缺失检查
- 建议在 Mapbox Dashboard 设置 URL 白名单

---

### 阶段 8：管理后台与 API

**创建的文件：**

1. **`src/app/admin/page.tsx`** — 管理仪表盘（force-dynamic），Supabase 认证保护
2. **`src/app/admin/login/page.tsx`** — 登录页（Email + Password），懒加载 Supabase 客户端
3. **`src/app/api/comments/route.ts`** — 评论 GET/POST
4. **`src/app/api/trips/route.ts`** — 旅行数据 GET
5. **`src/app/api/photos/route.ts`** — 照片数据 GET
6. **`src/app/api/auth/callback/route.ts`** — Supabase Auth 回调处理
7. **`src/proxy.ts`** — 认证中间件（Next.js 16 的 proxy 约定）

**遇到的问题：**
- Next.js 16 将 `middleware.ts` 重命名为 `proxy.ts`（废弃警告） → 已迁移
- 构建时 Supabase 客户端在缺少环境变量时抛出错误 → admin 页面添加 `export const dynamic = 'force-dynamic'`
- admin login 页面在 SSR 预渲染时调用 `createClient()` 失败 → 改用 `useRef` 懒初始化

---

### 阶段 9：SEO 与错误处理

**创建的文件：**

1. **`src/app/sitemap.ts`** — 动态 sitemap，包含所有已发布旅行
2. **`src/app/robots.ts`** — robots.txt，屏蔽 `/admin/` 和 `/api/`
3. **`src/app/not-found.tsx`** — 自定义 404 页面
4. **`src/app/error.tsx`** — 客户端错误边界
5. **`src/app/global-error.tsx`** — 根错误边界

---

## 构建结果

```
Route (app)
┌ ƒ /                    # 首页（动态）
├ ○ /_not-found          # 404（静态）
├ ƒ /admin               # 管理后台（动态，force-dynamic）
├ ○ /admin/login         # 登录页（静态）
├ ƒ /api/auth/callback   # 认证回调（动态）
├ ƒ /api/comments        # 评论 API（动态）
├ ƒ /api/photos          # 照片 API（动态）
├ ƒ /api/trips           # 旅行 API（动态）
├ ○ /gallery             # 画廊（静态）
├ ƒ /map                 # 地图（动态）
├ ○ /robots.txt          # robots.txt（静态）
├ ƒ /sitemap.xml         # sitemap（动态）
├ ƒ /trips               # 旅行列表（动态，ISR 3600s）
└ ● /trips/[slug]        # 旅行详情（SSG + generateStaticParams）

ƒ Proxy (Middleware)     # 认证中间件
```

---

## 关键问题与解决方案汇总

| # | 问题 | 原因 | 解决方案 |
|---|------|------|---------|
| 1 | `create-next-app` 拒绝大写名称 | npm 命名规范 | 创建到临时目录后迁移 |
| 2 | `trip.ts` 类型引用报错 | 未导入 `Photo`/`MapPoint` 类型 | 添加 `import type` |
| 3 | Lenis `smoothTouch` 不存在 | v1.3.23 API 变更 | 移除该选项 |
| 4 | Framer Motion ease 类型不兼容 | `number[]` 非 tuple | 添加 `as const` |
| 5 | Markdown 图片 Blob 类型 | react-markdown src 类型 | 添加 `typeof src !== "string"` 守卫 |
| 6 | react-map-gl 模块找不到 | v8 使用 subpath exports | 改为 `react-map-gl/mapbox` |
| 7 | points 隐式 any 类型 | 未声明类型 | 添加 `MapPoint[]` |
| 8 | middleware.ts 废弃警告 | Next.js 16 新约定 | 重命名为 `proxy.ts` |
| 9 | 构建时 Supabase 客户端报错 | 缺环境变量的 SSR 调用 | admin 页 `force-dynamic` + 懒初始化 |

---

## 项目结构总览

```
Travel-web/
├── .env.local.example          # 环境变量模板
├── next.config.ts              # Next.js 配置
├── postcss.config.mjs          # PostCSS 配置
├── tsconfig.json               # TypeScript 配置
├── package.json                # 依赖管理
├── src/
│   ├── app/                    # App Router 页面
│   │   ├── page.tsx            # 首页
│   │   ├── layout.tsx          # 根布局
│   │   ├── globals.css         # 全局样式
│   │   ├── trips/              # 旅行相关
│   │   ├── gallery/            # 画廊
│   │   ├── map/                # 地图
│   │   ├── admin/              # 管理后台
│   │   ├── api/                # API 路由
│   │   ├── sitemap.ts          # SEO sitemap
│   │   ├── robots.ts           # SEO robots.txt
│   │   ├── error.tsx           # 错误边界
│   │   ├── global-error.tsx    # 全局错误边界
│   │   └── not-found.tsx       # 404 页面
│   ├── components/             # React 组件
│   │   ├── ui/                 # 通用 UI（Button, Card, Skeleton, Badge, Modal）
│   │   ├── layout/             # 布局（Navbar, Footer, MobileMenu）
│   │   ├── home/               # 首页（Hero, Stats, AnimatedNumber, RecentTrips）
│   │   ├── trip/               # 旅行（TripCard, TripFilters, MarkdownRenderer, CommentSection）
│   │   ├── map/                # 地图（WorldMap）
│   │   ├── gallery/            # 画廊（PhotoGallery）
│   │   └── providers/          # Providers（ScrollProvider, PageTransition）
│   ├── lib/                    # 工具库
│   │   ├── utils.ts            # 工具函数
│   │   ├── constants.ts        # 常量
│   │   ├── supabase/           # Supabase 客户端
│   │   └── data/               # 数据访问层
│   ├── types/                  # TypeScript 类型定义
│   └── proxy.ts                # 认证中间件
└── doc/                        # 文档
    ├── travel-website-plan.md  # 原始方案
    ├── feasibility-analysis-and-roadmap.md  # 可行性分析
    └── development-log.md      # 本开发日志
```

---

## 下一步操作

### 立即可做

1. **配置环境变量** — 复制 `.env.local.example` 为 `.env.local`，填入真实值
2. **Supabase 建表** — 在 Supabase SQL Editor 执行 `feasibility-analysis-and-roadmap.md` 中的 DDL
3. **Cloudinary 配置** — 创建 Upload Preset `travel_photos`（签名上传）
4. **Mapbox 配置** — 获取 Token 并设置 URL 白名单

### 运行开发服务器

```bash
npm run dev
```

### 待实现功能（按优先级）

| 功能 | 优先级 |
|------|--------|
| 管理员新建/编辑旅行页面（CRUD） | 高 |
| Cloudinary 图片上传组件 | 高 |
| 评论审核后台 | 中 |
| 响应式适配微调 | 中 |
| 网站分析（Umami/Vercel Analytics） | 低 |
| RSS Feed | 低 |

---

*日志生成时间：2026-06-12*
