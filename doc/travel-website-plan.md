# 个人旅游记录网站 · 完整技术方案

> 适用人群：有前端开发经验 · 目标：公开展示的华丽旅游记录网站  
> 核心功能：地图轨迹 · 图片画廊 · 旅游攻略 · 视频支持 · 评论互动

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈总览](#2-技术栈总览)
3. [前端层详解](#3-前端层详解)
4. [后端层详解](#4-后端层详解)
5. [存储方案](#5-存储方案)
6. [地图与轨迹](#6-地图与轨迹)
7. [页面结构规划](#7-页面结构规划)
8. [数据库设计](#8-数据库设计)
9. [部署方案](#9-部署方案)
10. [费用估算](#10-费用估算)
11. [开发路线图](#11-开发路线图)
12. [推荐资源](#12-推荐资源)

---

## 1. 项目概述

### 网站定位

一个面向公众的个人旅游记录网站，兼具视觉观赏性与内容实用性。访客可以浏览旅行图片、阅读攻略文章、查看地图轨迹，并留下评论互动。

### 核心特色

- 🗺️ **世界地图轨迹**：3D 地球展示去过的地方和飞行路线
- 📸 **精美图片画廊**：瀑布流布局 + 灯箱效果
- 📝 **旅游攻略博客**：Markdown 富文本文章
- 🎬 **视频支持**：旅行 Vlog 嵌入播放
- 💬 **评论互动**：访客留言与回复
- ✨ **华丽视觉特效**：视差滚动、页面过渡动画、惯性滚动

---

## 2. 技术栈总览

| 层级 | 技术 | 用途 | 费用 |
|------|------|------|------|
| 前端框架 | Next.js 14 (App Router) | 页面渲染、路由、SEO | 免费 |
| 样式 | Tailwind CSS | 快速布局与响应式 | 免费 |
| 动画特效 | GSAP + Framer Motion | 滚动特效、页面动画 | 免费（基础版）|
| 惯性滚动 | Lenis | 丝滑滚动体验 | 免费 |
| 地图 | Mapbox GL JS | 3D 地图与轨迹动画 | 免费额度 |
| 图片/视频存储 | Cloudinary | 媒体上传与优化 | 免费 25GB |
| 数据库 | Supabase | 文章、评论、用户数据 | 免费套餐 |
| 认证 | Supabase Auth | 管理员登录 | 免费 |
| 内容管理 | 自建后台 or Notion API | 撰写攻略文章 | 免费 |
| 部署 | Vercel | 自动 CI/CD 部署 | 免费套餐 |
| 域名 | 阿里云 / Namecheap | 自定义网址 | ≈ ¥50/年 |
| CDN | Vercel Edge / Cloudflare | 加速全球访问 | 免费 |

---

## 3. 前端层详解

### 3.1 Next.js 14（App Router）

**为什么选 Next.js：**
- 支持服务端渲染（SSR）和静态生成（SSG），对搜索引擎友好
- 攻略文章可以被 Google 检索到，有助于传播
- 图片组件 `<Image>` 自动懒加载、WebP 转换，性能好
- API Routes 可直接处理评论提交，无需额外后端服务器

**初始化项目：**
```bash
npx create-next-app@latest travel-blog \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir
```

**推荐目录结构：**
```
src/
├── app/
│   ├── page.tsx              # 首页（地球 + 最新旅行）
│   ├── trips/
│   │   ├── page.tsx          # 所有旅行列表
│   │   └── [slug]/page.tsx   # 单个旅行详情页
│   ├── gallery/page.tsx      # 图片画廊总览
│   ├── map/page.tsx          # 世界轨迹地图
│   └── api/
│       ├── comments/route.ts # 评论接口
│       └── trips/route.ts    # 旅行数据接口
├── components/
│   ├── ui/                   # 通用 UI 组件
│   ├── map/                  # 地图相关组件
│   ├── gallery/              # 画廊组件
│   └── layout/               # 导航、页脚
└── lib/
    ├── supabase.ts           # 数据库客户端
    └── cloudinary.ts         # 媒体上传工具
```

### 3.2 动画特效方案

#### GSAP（GreenSock Animation Platform）

用于复杂的滚动触发动画，是旅游网站常用的特效库。

```bash
npm install gsap @gsap/react
```

**典型用法 — 滚动视差：**
```tsx
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function HeroSection() {
  useGSAP(() => {
    gsap.to('.hero-image', {
      yPercent: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })
  })

  return (
    <section className="hero overflow-hidden h-screen">
      <img className="hero-image w-full h-[130%] object-cover" src="..." />
    </section>
  )
}
```

#### Framer Motion

用于页面切换动画和卡片交互效果。

```bash
npm install framer-motion
```

**页面过渡动画：**
```tsx
import { motion, AnimatePresence } from 'framer-motion'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export default function TripPage() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* 页面内容 */}
    </motion.div>
  )
}
```

#### Lenis（惯性滚动）

让整个网站的滚动体验更丝滑，是视觉档次提升最明显的一个库。

```bash
npm install lenis
```

```tsx
// app/layout.tsx
'use client'
import Lenis from 'lenis'
import { useEffect } from 'react'

export function SmoothScroll({ children }) {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 3) })
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])
  return <>{children}</>
}
```

### 3.3 图片画廊

推荐使用 **Masonry（瀑布流）** 布局配合 **Yet Another React Lightbox** 实现灯箱效果。

```bash
npm install yet-another-react-lightbox react-photo-album
```

---

## 4. 后端层详解

### 4.1 Supabase（数据库 + 认证）

Supabase 是开源的 Firebase 替代品，提供 PostgreSQL 数据库、实时订阅、文件存储和用户认证。

**初始化客户端：**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

```ts
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 4.2 评论系统 API

```ts
// app/api/comments/route.ts
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { trip_id, author_name, content } = await request.json()

  const { data, error } = await supabase
    .from('comments')
    .insert({ trip_id, author_name, content })
    .select()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ data })
}
```

### 4.3 管理员后台（内容管理）

有两种方案可选：

**方案 A：自建简单后台（推荐）**
- 用 Next.js 做 `/admin` 路由，通过 Supabase Auth 做登录保护
- 在管理页面直接上传图片、编写攻略

**方案 B：接入 Notion 作为 CMS**
- 在 Notion 里写文章，通过 Notion API 拉取内容到网站
- 写作体验更好，适合长期更新

---

## 5. 存储方案

### 5.1 Cloudinary（图片与视频）

**免费套餐：** 25GB 存储 + 每月 25GB 流量，个人网站完全够用。

```bash
npm install cloudinary next-cloudinary
```

**上传组件：**
```tsx
import { CldUploadWidget } from 'next-cloudinary'

export function ImageUploader({ onUpload }) {
  return (
    <CldUploadWidget
      uploadPreset="travel_photos"
      onSuccess={(result) => onUpload(result.info)}
    >
      {({ open }) => (
        <button onClick={open}>上传图片</button>
      )}
    </CldUploadWidget>
  )
}
```

**图片展示（自动优化）：**
```tsx
import { CldImage } from 'next-cloudinary'

<CldImage
  src="travel/japan_2024"
  width={800}
  height={600}
  alt="日本京都"
  // 自动转 WebP，按需裁剪
/>
```

### 5.2 视频方案

- **YouTube / Bilibili 嵌入**：最省事，直接用 iframe 嵌入已上传的视频
- **Cloudinary 存储**：直接托管短视频（≤100MB），无需第三方平台

---

## 6. 地图与轨迹

### 6.1 Mapbox GL JS

**免费额度：** 每月 50,000 次地图加载，个人网站完全够用。

```bash
npm install mapbox-gl react-map-gl
```

**注册获取 Token：** https://www.mapbox.com

### 6.2 世界轨迹地图实现

```tsx
'use client'
import Map, { Marker, Source, Layer } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const visitedPlaces = [
  { id: 1, name: '东京', lng: 139.69, lat: 35.68 },
  { id: 2, name: '巴黎', lng: 2.35, lat: 48.86 },
  { id: 3, name: '纽约', lng: -74.00, lat: 40.71 },
]

export function WorldMap() {
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{ longitude: 100, latitude: 30, zoom: 1.5 }}
      style={{ width: '100%', height: '600px' }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
    >
      {visitedPlaces.map((place) => (
        <Marker key={place.id} longitude={place.lng} latitude={place.lat}>
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse cursor-pointer" />
        </Marker>
      ))}
    </Map>
  )
}
```

### 6.3 飞行路线动画

使用 Mapbox 的 `flyTo` 方法实现点击地点后飞行到该位置的动画效果，给访客身临其境的体验。

---

## 7. 页面结构规划

### 首页 `/`
- **Hero 区域**：全屏背景视频/图片 + 标题，视差滚动效果
- **数字统计**：去过 X 个国家 · X 个城市 · X 篇攻略（数字滚动动画）
- **最新旅行**：3-4 个卡片，悬停显示动画
- **世界地图预览**：迷你地球，点击跳转地图页

### 旅行列表 `/trips`
- 按时间/地区筛选
- 卡片网格布局，封面图 + 目的地 + 日期 + 标签

### 旅行详情 `/trips/[slug]`
- 顶部封面大图（视差效果）
- 目的地信息 + 出行日期
- 迷你地图显示位置
- 攻略正文（Markdown 渲染）
- 照片画廊（瀑布流 + 灯箱）
- 视频嵌入
- 评论区

### 图片画廊 `/gallery`
- 全站照片瀑布流
- 按旅行/地区/年份筛选
- 点击放大（灯箱）

### 地图页 `/map`
- 全屏 3D 地球
- 已访问地点标记（亮点）
- 点击标记跳转到对应旅行页面
- 侧边栏显示旅行统计

---

## 8. 数据库设计

### trips（旅行记录）
```sql
CREATE TABLE trips (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,       -- URL 路径，如 japan-2024
  title       TEXT NOT NULL,              -- 标题
  destination TEXT NOT NULL,              -- 目的地
  country     TEXT NOT NULL,              -- 国家
  cover_image TEXT,                       -- 封面图 Cloudinary URL
  start_date  DATE,
  end_date    DATE,
  content     TEXT,                       -- Markdown 正文
  tags        TEXT[],                     -- 标签数组
  is_published BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### photos（照片）
```sql
CREATE TABLE photos (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id      UUID REFERENCES trips(id) ON DELETE CASCADE,
  cloudinary_id TEXT NOT NULL,            -- Cloudinary 公共 ID
  url          TEXT NOT NULL,
  caption      TEXT,
  width        INTEGER,
  height       INTEGER,
  taken_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### comments（评论）
```sql
CREATE TABLE comments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id     UUID REFERENCES trips(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content     TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,      -- 审核后显示
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### map_points（地图标记）
```sql
CREATE TABLE map_points (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id   UUID REFERENCES trips(id),
  name      TEXT NOT NULL,
  latitude  DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  type      TEXT DEFAULT 'visited'        -- visited / highlight
);
```

---

## 9. 部署方案

### 9.1 Vercel（推荐）

Vercel 是 Next.js 官方推荐的部署平台，个人免费套餐完全够用。

**部署步骤：**
1. 将代码推送到 GitHub 仓库
2. 登录 [vercel.com](https://vercel.com)，导入 GitHub 仓库
3. 在 Vercel 控制台添加环境变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_MAPBOX_TOKEN=...
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
   ```
4. 点击 Deploy，自动构建上线
5. 之后每次 `git push` 自动触发重新部署

### 9.2 绑定自定义域名

1. 在阿里云/腾讯云购买域名（如 `mytravel.com`）
2. 在 Vercel 项目设置 → Domains，添加域名
3. 按提示在域名服务商处添加 DNS 记录（CNAME 指向 Vercel）
4. 等待 DNS 生效（通常 5-30 分钟），HTTPS 自动配置

### 9.3 中国大陆访问

- **服务器在海外（Vercel）**：无需 ICP 备案，但国内访问速度略慢
- **提速方案**：在 Cloudflare 免费套餐下加一层 CDN 缓存，改善国内访问速度
- **如需极速访问**：考虑国内云服务商（阿里云/腾讯云）+ ICP 备案（约 2-4 周）

---

## 10. 费用估算

### 免费起步阶段（个人使用完全够用）

| 服务 | 免费额度 | 说明 |
|------|---------|------|
| Vercel | 100GB 流量/月 | 足够个人博客 |
| Supabase | 500MB 数据库 + 1GB 存储 | 足够文章和评论 |
| Cloudinary | 25GB 存储 + 25GB 流量/月 | 约 5000 张高清图片 |
| Mapbox | 50,000 次/月 | 足够个人网站 |

**唯一必要支出：域名 ≈ ¥50-100/年**

### 未来扩展（流量增大后）

| 场景 | 升级方案 | 费用 |
|------|---------|------|
| 图片流量超出 | Cloudinary 付费套餐 | $89/月 |
| 数据库增大 | Supabase Pro | $25/月 |
| 需要服务器渲染加速 | Vercel Pro | $20/月 |

---

## 11. 开发路线图

### 第一阶段（1-2 周）：基础框架
- [ ] 初始化 Next.js 项目，配置 Tailwind CSS
- [ ] 搭建页面路由结构
- [ ] 集成 Supabase，设计并创建数据库表
- [ ] 实现基础的旅行列表和详情页
- [ ] 集成 Cloudinary，实现图片上传和展示

### 第二阶段（1 周）：核心功能
- [ ] 实现瀑布流图片画廊 + 灯箱效果
- [ ] 集成 Mapbox，实现世界轨迹地图
- [ ] 实现 Markdown 文章渲染
- [ ] 添加评论提交和展示功能
- [ ] 搭建简单的管理员后台（上传/发布内容）

### 第三阶段（1 周）：视觉特效
- [ ] 集成 Lenis 惯性滚动
- [ ] 首页 Hero 视差效果（GSAP ScrollTrigger）
- [ ] 页面切换动画（Framer Motion）
- [ ] 卡片悬停动画
- [ ] 地图点击飞行动画

### 第四阶段（几天）：上线优化
- [ ] 响应式适配移动端
- [ ] SEO 配置（`metadata`、`sitemap.xml`、`robots.txt`）
- [ ] 图片懒加载和性能优化
- [ ] 部署到 Vercel，绑定自定义域名
- [ ] 配置 Cloudflare CDN（可选）

---

## 12. 推荐资源

### 官方文档
- [Next.js 文档](https://nextjs.org/docs) — 框架核心文档
- [Supabase 文档](https://supabase.com/docs) — 数据库和认证
- [Mapbox GL JS 文档](https://docs.mapbox.com/mapbox-gl-js) — 地图开发
- [Cloudinary 文档](https://cloudinary.com/documentation) — 媒体管理
- [GSAP 文档](https://gsap.com/docs) — 动画库

### 灵感参考
- [awwwards.com](https://www.awwwards.com) — 寻找华丽网站设计灵感
- 搜索关键词：`travel blog website design 2024`、`parallax travel site`

### UI 组件库（可选）
- **shadcn/ui** — 可定制的无样式组件
- **Radix UI** — 无障碍基础组件
- **Lucide React** — 图标库

---

*文档生成时间：2026年6月 · 基于个人旅游记录网站完整规划*
