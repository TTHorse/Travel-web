# 旅游记录网站 · 可行性分析与代码实现路线图

> 分析日期：2026-06-12
> 基于现有方案 `travel-website-plan.md` 的深度可行性审查

---

## 目录

1. [可行性分析](#1-可行性分析)
2. [代码层面实现步骤](#2-代码层面实现步骤)
3. [关键技术决策](#3-关键技术决策)
4. [潜在风险与注意事项](#4-潜在风险与注意事项)
5. [推荐调整项](#5-推荐调整项)

---

## 1. 可行性分析

### 1.1 总体评估：✅ 高度可行

该方案技术选型成熟、社区活跃、免费套餐充足，**可作为个人项目在 3-4 周内完成并上线**。

### 1.2 逐层可行性审查

#### 前端层

| 组件 | 可行性 | 评估 |
|------|--------|------|
| Next.js 14 App Router | ✅ | 生产就绪，SSR/SSG 成熟，个人网站首选 |
| Tailwind CSS | ✅ | 零运行时开销，响应式开发效率极高 |
| GSAP + ScrollTrigger | ⚠️ | 可行但需注意 SSR 兼容性和 bundle size |
| Framer Motion | ✅ | React 生态最佳动画方案 |
| Lenis 惯性滚动 | ⚠️ | 与 Next.js App Router 的混合路由可能有冲突 |
| 瀑布流画廊 | ✅ | `react-photo-album` 和 `yet-another-react-lightbox` 均成熟 |
| Mapbox GL JS | ✅ | 重度使用可能超出免费额度，需监控 |

#### 后端与存储层

| 组件 | 可行性 | 评估 |
|------|--------|------|
| Supabase (PostgreSQL) | ✅ | 免费 500MB 数据库，个人博客 10 年内够用 |
| Supabase Auth | ✅ | 开箱即用的 Magic Link + OAuth |
| Cloudinary | ✅ | 25GB 免费存储，约 5000 张压缩后高清图 |
| Next.js API Routes | ✅ | 足够处理评论 CRUD，无需独立后端 |

#### 部署层

| 组件 | 可行性 | 评估 |
|------|--------|------|
| Vercel 部署 | ✅ | Next.js 原厂支持，Hobby 计划 100GB 带宽/月 |
| 自定义域名 | ✅ | ¥50-100/年，唯一必要支出 |
| Cloudflare CDN | ✅ | 免费加速，改善国内访问 |

### 1.3 免费额度压力测试

假设每月 5000 次页面访问：

| 服务 | 免费额度 | 预估用量 | 是否安全 |
|------|---------|---------|---------|
| Vercel 带宽 | 100GB/月 | ~15-20GB | ✅ 安全 |
| Supabase 数据库 | 500MB | ~10-20MB | ✅ 安全 |
| Cloudinary 存储 | 25GB | ~5-10GB (第一年) | ✅ 安全 |
| Cloudinary 带宽 | 25GB/月 | ~10-15GB | ✅ 安全 |
| Mapbox 加载 | 50,000 次/月 | ~5,000-10,000 | ✅ 安全 |

> **结论：个人使用场景下，所有免费额度都有充分余量。**

---

## 2. 代码层面实现步骤

### 第一阶段：项目初始化与基础架构（Day 1-3）

#### Step 1.1：创建 Next.js 项目

```bash
npx create-next-app@latest travel-blog \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

**关键配置：**

```typescript
// next.config.ts — 图片域名白名单
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'api.mapbox.com',
      },
    ],
  },
}

export default nextConfig
```

#### Step 1.2：安装核心依赖

```bash
# 数据库和认证
npm install @supabase/supabase-js @supabase/ssr

# 图片管理
npm install cloudinary next-cloudinary

# 动画
npm install framer-motion gsap @gsap/react lenis

# 地图
npm install mapbox-gl react-map-gl

# 图片画廊
npm install yet-another-react-lightbox react-photo-album

# 内容渲染
npm install react-markdown remark-gfm rehype-highlight

# 图标
npm install lucide-react

# 表单处理
npm install react-hook-form zod @hookform/resolvers

# 工具
npm install clsx tailwind-merge date-fns
```

#### Step 1.3：环境变量配置

```bash
# .env.local（不提交到 Git）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx...        # 仅服务端使用

NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx...

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

SITE_URL=http://localhost:3000
```

#### Step 1.4：创建目录结构

```bash
mkdir -p src/{components/{ui,map,gallery,layout,trip,home},lib,hooks,types}
mkdir -p src/app/{trips/\[slug\],gallery,map,admin,api/{comments,trips,photos,auth}}
```

**完整目录结构：**

```
src/
├── app/
│   ├── layout.tsx                  # 根布局（导航 + 页脚 + 平滑滚动）
│   ├── page.tsx                    # 首页
│   ├── trips/
│   │   ├── page.tsx                # 旅行列表
│   │   └── [slug]/
│   │       ├── page.tsx            # 旅行详情
│   │       └── loading.tsx         # 加载骨架屏
│   ├── gallery/
│   │   ├── page.tsx                # 图片画廊
│   │   └── loading.tsx
│   ├── map/
│   │   └── page.tsx                # 世界地图轨迹
│   ├── admin/
│   │   ├── page.tsx                # 后台首页
│   │   ├── login/page.tsx          # 管理员登录
│   │   └── trips/
│   │       ├── page.tsx            # 旅行管理列表
│   │       ├── new/page.tsx        # 新建旅行
│   │       └── [slug]/edit/page.tsx # 编辑旅行
│   └── api/
│       ├── comments/route.ts       # 评论 CRUD
│       ├── trips/route.ts          # 旅行数据 API
│       ├── photos/route.ts         # 照片管理
│       └── auth/callback/route.ts  # Supabase 认证回调
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Skeleton.tsx            # 骨架屏
│   │   ├── Badge.tsx
│   │   └── Modal.tsx
│   ├── layout/
│   │   ├── Navbar.tsx              # 导航栏（含透明/实色切换）
│   │   ├── Footer.tsx
│   │   └── MobileMenu.tsx          # 移动端菜单
│   ├── home/
│   │   ├── HeroSection.tsx         # Hero 视差区域
│   │   ├── StatsCounter.tsx        # 数字滚动统计
│   │   ├── RecentTrips.tsx         # 最新旅行卡片
│   │   └── MiniGlobe.tsx           # 迷你地球预览
│   ├── trip/
│   │   ├── TripCard.tsx            # 旅行卡片
│   │   ├── TripFilters.tsx         # 筛选组件
│   │   ├── MarkdownRenderer.tsx    # Markdown 渲染器
│   │   └── CommentSection.tsx      # 评论区组件
│   ├── map/
│   │   ├── WorldMap.tsx            # 世界地图主组件
│   │   ├── MapMarker.tsx           # 标记点
│   │   └── SidebarStats.tsx        # 侧边栏统计
│   └── gallery/
│       ├── MasonryGallery.tsx      # 瀑布流画廊
│       ├── LightboxViewer.tsx      # 灯箱查看器
│       └── PhotoUploader.tsx       # 图片上传
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # 浏览器端 Supabase 客户端
│   │   ├── server.ts               # 服务端 Supabase 客户端
│   │   └── middleware.ts           # 认证中间件
│   ├── cloudinary.ts               # Cloudinary 工具函数
│   ├── mapbox.ts                   # Mapbox 配置
│   ├── utils.ts                    # 通用工具函数（cn() 等）
│   └── constants.ts                # 全局常量
├── hooks/
│   ├── useSmoothScroll.ts          # Lenis 惯性滚动 Hook
│   ├── useScrollAnimation.ts       # GSAP 滚动动画 Hook
│   ├── useSupabaseQuery.ts         # Supabase 数据查询 Hook
│   └── useMediaQuery.ts            # 响应式断点 Hook
└── types/
    ├── trip.ts                     # 旅行相关类型
    ├── photo.ts                    # 照片类型
    ├── comment.ts                  # 评论类型
    └── map.ts                      # 地图相关类型
```

#### Step 1.5：Supabase 客户端初始化

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// src/lib/supabase/server.ts — 服务端客户端（带 service_role key）
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

### 第二阶段：数据库与数据层（Day 4-5）

#### Step 2.1：Supabase 建表

在 Supabase SQL Editor 中依次执行以下 DDL：

```sql
-- 1. 旅行记录表
CREATE TABLE trips (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  destination   TEXT NOT NULL,
  country       TEXT NOT NULL,
  cover_image   TEXT,
  description   TEXT,                       -- 简短描述，用于卡片展示
  content       TEXT,                       -- Markdown 正文
  start_date    DATE,
  end_date      DATE,
  tags          TEXT[] DEFAULT '{}',
  is_published  BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 照片表
CREATE TABLE photos (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id        UUID REFERENCES trips(id) ON DELETE CASCADE,
  cloudinary_id  TEXT NOT NULL,
  url            TEXT NOT NULL,
  thumbnail_url  TEXT,                      -- 缩略图 URL（瀑布流性能关键）
  caption        TEXT,
  width          INTEGER,
  height         INTEGER,
  sort_order     INTEGER DEFAULT 0,         -- 排序字段
  taken_at       TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 评论表
CREATE TABLE comments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id     UUID REFERENCES trips(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE, -- 支持回复
  author_name TEXT NOT NULL,
  author_email TEXT,                        -- 可选，用于 Gravatar
  content     TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 地图标记表
CREATE TABLE map_points (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id   UUID REFERENCES trips(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  latitude  DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  type      TEXT DEFAULT 'visited' CHECK (type IN ('visited', 'highlight', 'wishlist')),
  sort_order INTEGER DEFAULT 0
);

-- 5. 管理员表（Supabase Auth 会将用户存在 auth.users，这里存额外信息）
CREATE TABLE profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username   TEXT UNIQUE,
  full_name  TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ
);

-- 索引优化
CREATE INDEX idx_trips_slug ON trips(slug);
CREATE INDEX idx_trips_published ON trips(is_published) WHERE is_published = true;
CREATE INDEX idx_photos_trip ON photos(trip_id, sort_order);
CREATE INDEX idx_comments_trip ON comments(trip_id, created_at);
CREATE INDEX idx_map_points_trip ON map_points(trip_id);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### Step 2.2：类型定义

```typescript
// src/types/trip.ts
export interface Trip {
  id: string
  slug: string
  title: string
  destination: string
  country: string
  cover_image: string | null
  description: string | null
  content: string | null
  start_date: string | null
  end_date: string | null
  tags: string[]
  is_published: boolean
  created_at: string
  updated_at: string
  // 关联数据
  photos?: Photo[]
  map_points?: MapPoint[]
}

export interface TripSummary {
  id: string
  slug: string
  title: string
  destination: string
  country: string
  cover_image: string | null
  description: string | null
  start_date: string | null
  tags: string[]
  photos: { url: string; thumbnail_url: string | null; width: number; height: number }[]
}
```

```typescript
// src/types/photo.ts
export interface Photo {
  id: string
  trip_id: string
  cloudinary_id: string
  url: string
  thumbnail_url: string | null
  caption: string | null
  width: number
  height: number
  sort_order: number
  taken_at: string | null
}
```

```typescript
// src/types/comment.ts
export interface Comment {
  id: string
  trip_id: string
  parent_id: string | null
  author_name: string
  content: string
  is_approved: boolean
  created_at: string
  replies?: Comment[]
}
```

```typescript
// src/types/map.ts
export interface MapPoint {
  id: string
  trip_id: string | null
  name: string
  latitude: number
  longitude: number
  type: 'visited' | 'highlight' | 'wishlist'
  sort_order: number
}
```

#### Step 2.3：数据访问层

```typescript
// src/lib/data/trips.ts
import { createServerSupabase } from '@/lib/supabase/server'
import type { Trip, TripSummary } from '@/types/trip'

// 获取所有已发布的旅行（用于列表页）
export async function getPublishedTrips(): Promise<TripSummary[]> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from('trips')
    .select(`
      id, slug, title, destination, country,
      cover_image, description, start_date, tags,
      photos (url, thumbnail_url, width, height)
    `)
    .eq('is_published', true)
    .order('start_date', { ascending: false })
    .order('sort_order', { referencedTable: 'photos', ascending: true })

  if (error) {
    console.error('Error fetching trips:', error)
    return []
  }

  return data
}

// 获取单个旅行详情（用于详情页）
export async function getTripBySlug(slug: string): Promise<Trip | null> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      photos (*),
      map_points (*)
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) return null
  return data
}

// 获取所有旅行中涉及的坐标点（用于地图页）
export async function getAllMapPoints(): Promise<MapPoint[]> {
  const supabase = await createServerSupabase()

  const { data } = await supabase
    .from('map_points')
    .select('*')
    .order('sort_order')

  return data || []
}
```

---

### 第三阶段：页面实现（Day 6-12）

#### Step 3.1：根布局

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter, Noto_Sans_SC } from 'next/font/google'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ScrollProvider } from '@/components/providers/ScrollProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sc',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: '我的旅行记录',
    template: '%s | 我的旅行记录',
  },
  description: '记录每一次旅行的美好瞬间',
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${notoSansSC.variable}`}>
      <body className="bg-black text-white antialiased">
        <Navbar />
        <ScrollProvider>
          <main className="min-h-screen">{children}</main>
        </ScrollProvider>
        <Footer />
      </body>
    </html>
  )
}
```

#### Step 3.2：导航栏

关键实现要点：
- 滚动到顶部时透明背景，向下滚动后变为实色/毛玻璃
- 移动端使用 hamburger 菜单
- 使用 `usePathname()` 高亮当前页面

```tsx
// src/components/layout/Navbar.tsx (核心逻辑)
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/', label: '首页' },
  { href: '/trips', label: '旅行' },
  { href: '/gallery', label: '画廊' },
  { href: '/map', label: '地图' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={cn(
        'fixed top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'bg-black/80 backdrop-blur-md border-b border-white/10'
          : 'bg-transparent'
      )}
    >
      {/* 导航链接 */}
    </nav>
  )
}
```

#### Step 3.3：首页

```tsx
// src/app/page.tsx
import { Suspense } from 'react'
import { HeroSection } from '@/components/home/HeroSection'
import { StatsCounter } from '@/components/home/StatsCounter'
import { RecentTrips } from '@/components/home/RecentTrips'
import { MiniGlobe } from '@/components/home/MiniGlobe'
import { Skeleton } from '@/components/ui/Skeleton'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Suspense fallback={<Skeleton className="h-32" />}>
        <StatsCounter />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <RecentTrips />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <MiniGlobe />
      </Suspense>
    </>
  )
}
```

#### Step 3.4：旅行列表页

```tsx
// src/app/trips/page.tsx
import { getPublishedTrips } from '@/lib/data/trips'
import { TripCard } from '@/components/trip/TripCard'
import { TripFilters } from '@/components/trip/TripFilters'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '旅行记录',
  description: '浏览我的所有旅行记录',
}

export const revalidate = 3600 // ISR：每小时重新生成

export default async function TripsPage() {
  const trips = await getPublishedTrips()

  return (
    <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">旅行记录</h1>
      <TripFilters trips={trips} />
      {trips.length === 0 ? (
        <p className="text-white/60 text-center py-20">还没有旅行记录</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  )
}
```

#### Step 3.5：旅行卡片组件

```tsx
// src/components/trip/TripCard.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { TripSummary } from '@/types/trip'

export function TripCard({ trip }: { trip: TripSummary }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -8 }}
    >
      <Link href={`/trips/${trip.slug}`} className="block group">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
          <Image
            src={trip.cover_image || '/placeholder-trip.jpg'}
            alt={trip.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-xl font-bold text-white">{trip.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {trip.destination}
              </span>
              {trip.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {formatDate(trip.start_date)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
```

#### Step 3.6：旅行详情页

```tsx
// src/app/trips/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getTripBySlug } from '@/lib/data/trips'
import { MarkdownRenderer } from '@/components/trip/MarkdownRenderer'
import { PhotoGallery } from '@/components/gallery/PhotoGallery'
import { CommentSection } from '@/components/trip/CommentSection'
import { MiniMap } from '@/components/map/MiniMap'
import Image from 'next/image'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trip = await getTripBySlug(params.slug)
  if (!trip) return { title: '未找到' }

  return {
    title: trip.title,
    description: trip.description || `我在${trip.destination}的旅行记录`,
    openGraph: {
      images: trip.cover_image ? [trip.cover_image] : [],
    },
  }
}

export default async function TripDetailPage({ params }: Props) {
  const trip = await getTripBySlug(params.slug)

  if (!trip) {
    notFound()
  }

  return (
    <article>
      {/* 封面大图（视差效果） */}
      <div className="relative h-[70vh] overflow-hidden">
        <Image
          src={trip.cover_image || '/placeholder-hero.jpg'}
          alt={trip.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            {trip.title}
          </h1>
          <div className="flex flex-wrap gap-3 text-white/80">
            <span>{trip.destination}, {trip.country}</span>
            {trip.start_date && (
              <span>{trip.start_date} - {trip.end_date || trip.start_date}</span>
            )}
          </div>
        </div>
      </div>

      {/* 正文内容 */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {trip.content && <MarkdownRenderer content={trip.content} />}
      </div>

      {/* 照片画廊 */}
      {trip.photos && trip.photos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-8">旅行照片</h2>
          <PhotoGallery photos={trip.photos} />
        </section>
      )}

      {/* 地图标记 */}
      {trip.map_points && trip.map_points.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-8">足迹地图</h2>
          <MiniMap points={trip.map_points} />
        </section>
      )}

      {/* 评论区 */}
      <section className="max-w-3xl mx-auto px-4 py-12 border-t border-white/10">
        <CommentSection tripId={trip.id} />
      </section>
    </article>
  )
}
```

#### Step 3.7：Markdown 渲染器

```tsx
// src/components/trip/MarkdownRenderer.tsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import Image from 'next/image'
import type { Components } from 'react-markdown'

const components: Components = {
  h2: ({ children, ...props }) => (
    <h2 className="text-2xl font-bold mt-10 mb-4 text-white" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-xl font-semibold mt-8 mb-3 text-white/90" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="text-white/70 leading-relaxed mb-4" {...props}>
      {children}
    </p>
  ),
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
      {...props}
    >
      {children}
    </a>
  ),
  img: ({ src, alt }) => {
    if (!src) return null
    return (
      <div className="relative aspect-video my-6 rounded-lg overflow-hidden">
        <Image
          src={src}
          alt={alt || ''}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </div>
    )
  },
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-blue-500 pl-4 my-4 text-white/60 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside space-y-1 mb-4 text-white/70" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside space-y-1 mb-4 text-white/70" {...props}>
      {children}
    </ol>
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !className
    if (isInline) {
      return (
        <code
          className="bg-white/10 rounded px-1.5 py-0.5 text-sm text-blue-300"
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <code
        className="block bg-white/5 rounded-lg p-4 text-sm overflow-x-auto"
        {...props}
      >
        {children}
      </code>
    )
  },
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
```

#### Step 3.8：评论区组件

```tsx
// src/components/trip/CommentSection.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, User } from 'lucide-react'
import type { Comment } from '@/types/comment'

const commentSchema = z.object({
  author_name: z.string().min(1, '请输入昵称').max(50, '昵称不能超过50字'),
  content: z.string().min(1, '请输入评论内容').max(1000, '评论不能超过1000字'),
})

type CommentFormData = z.infer<typeof commentSchema>

export function CommentSection({ tripId }: { tripId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  })

  // 加载已通过的评论
  useEffect(() => {
    async function loadComments() {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('trip_id', tripId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })

      if (data) setComments(data)
    }
    loadComments()
  }, [tripId, supabase])

  const onSubmit = useCallback(async (formData: CommentFormData) => {
    setSubmitting(true)
    const { error } = await supabase
      .from('comments')
      .insert({
        trip_id: tripId,
        author_name: formData.author_name,
        content: formData.content,
      })

    if (!error) {
      reset()
      // 提示用户评论待审核
    }
    setSubmitting(false)
  }, [tripId, supabase, reset])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        评论 ({comments.length})
      </h2>

      {/* 评论表单 */}
      <form onSubmit={handleSubmit(onSubmit)} className="mb-10 space-y-4">
        <input
          {...register('author_name')}
          placeholder="你的昵称"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />
        {errors.author_name && (
          <p className="text-red-400 text-sm">{errors.author_name.message}</p>
        )}

        <textarea
          {...register('content')}
          placeholder="分享你的想法..."
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
        />
        {errors.content && (
          <p className="text-red-400 text-sm">{errors.content.message}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          <Send size={16} />
          {submitting ? '提交中...' : '发表评论'}
        </button>
      </form>

      {/* 评论列表 */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-white/50" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-white">
                  {comment.author_name}
                </span>
                <span className="text-xs text-white/40">
                  {new Date(comment.created_at).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### Step 3.9：世界地图页面

```tsx
// src/app/map/page.tsx (核心组件)
'use client'

import { useState, useRef, useCallback } from 'react'
import Map, { Marker, Source, Layer, MapRef, Popup } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { MapPoint } from '@/types/map'

interface WorldMapPageProps {
  points: MapPoint[]
  totalTrips: number
  totalCountries: number
  totalCities: number
}

export function WorldMapPage({
  points,
  totalTrips,
  totalCountries,
  totalCities,
}: WorldMapPageProps) {
  const mapRef = useRef<MapRef>(null)
  const [popupInfo, setPopupInfo] = useState<MapPoint | null>(null)
  const [viewState, setViewState] = useState({
    longitude: 100,
    latitude: 20,
    zoom: 1.5,
    bearing: 0,
    pitch: 0,
  })

  // 飞行动画到指定地点
  const flyToPoint = useCallback((point: MapPoint) => {
    mapRef.current?.flyTo({
      center: [point.longitude, point.latitude],
      zoom: 8,
      duration: 2000,
    })
  }, [])

  return (
    <div className="relative h-screen w-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        {points.map((point) => (
          <Marker
            key={point.id}
            longitude={point.longitude}
            latitude={point.latitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setPopupInfo(point)
            }}
          >
            <div
              className={`
                w-3 h-3 rounded-full cursor-pointer border-2 transition-transform hover:scale-150
                ${point.type === 'visited'
                  ? 'bg-orange-400 border-orange-300 animate-pulse'
                  : point.type === 'highlight'
                  ? 'bg-pink-500 border-pink-400'
                  : 'bg-white/30 border-white/50'
                }
              `}
            />
          </Marker>
        ))}

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeButton={false}
            className="map-popup"
          >
            <div className="p-2 text-black">
              <p className="font-medium text-sm">{popupInfo.name}</p>
            </div>
          </Popup>
        )}
      </Map>

      {/* 侧边栏统计 */}
      <div className="absolute top-20 left-4 z-10 bg-black/70 backdrop-blur-md rounded-xl p-6 text-white min-w-[200px]">
        <h2 className="text-lg font-bold mb-4">旅行统计</h2>
        <div className="space-y-3">
          <StatItem label="旅行次数" value={totalTrips} />
          <StatItem label="到访国家" value={totalCountries} />
          <StatItem label="标记城市" value={totalCities} />
        </div>
      </div>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/60 text-sm">{label}</span>
      <span className="text-xl font-bold text-orange-400">{value}</span>
    </div>
  )
}
```

#### Step 3.10：瀑布流画廊

```tsx
// src/components/gallery/MasonryGallery.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import type { Photo } from '@/types/photo'

// 将照片分成多列实现瀑布流
function distributeColumns(photos: Photo[], columnCount: number): Photo[][] {
  const columns: Photo[][] = Array.from({ length: columnCount }, () => [])
  photos.forEach((photo, index) => {
    columns[index % columnCount].push(photo)
  })
  return columns
}

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // 响应式列数
  const columns = distributeColumns(photos, 3)

  const slides = photos.map((photo) => ({
    src: photo.url,
    width: photo.width,
    height: photo.height,
    alt: photo.caption || '',
  }))

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-3">
            {column.map((photo, photoIndex) => {
              const globalIndex = colIndex * column.length + photoIndex
              return (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  className="relative overflow-hidden rounded-lg cursor-pointer group"
                  onClick={() => {
                    setLightboxIndex(globalIndex)
                    setLightboxOpen(true)
                  }}
                >
                  <Image
                    src={photo.thumbnail_url || photo.url}
                    alt={photo.caption || '旅行照片'}
                    width={photo.width}
                    height={photo.height}
                    className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm">{photo.caption}</p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        ))}
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
      />
    </>
  )
}
```

---

### 第四阶段：动画与视觉效果（Day 13-16）

#### Step 4.1：Lenis 惯性滚动

**注意：Lenis 与 Next.js App Router 的兼容性处理。**

```tsx
// src/components/providers/ScrollProvider.tsx
'use client'

import Lenis from 'lenis'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // 页面切换时销毁旧实例并创建新实例
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false, // 移动端关闭平滑滚动，避免与原生手势冲突
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)
    lenisRef.current = lenis

    return () => {
      lenis.destroy()
    }
  }, [pathname]) // 路由变化时重建

  return <>{children}</>
}
```

#### Step 4.2：Hero 视差效果

```tsx
// src/components/home/HeroSection.tsx
'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ChevronDown } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.to('.hero-image', {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-container',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })

    gsap.to('.hero-content', {
      opacity: 0,
      y: 100,
      scrollTrigger: {
        trigger: '.hero-container',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className="hero-container relative h-screen overflow-hidden">
      <div
        className="hero-image absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="hero-content relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <h1 className="text-5xl md:text-8xl font-bold text-white mb-6">
          探索世界
        </h1>
        <p className="text-lg md:text-xl text-white/70 max-w-md">
          记录每一次旅行，分享每一份感动
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="text-white/50" size={32} />
      </div>
    </div>
  )
}
```

#### Step 4.3：数字滚动动画

```tsx
// src/components/home/StatsCounter.tsx
'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Stat {
  value: number
  label: string
  suffix?: string
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    gsap.fromTo(
      ref.current,
      { innerText: 0 },
      {
        innerText: value,
        duration: 2,
        snap: { innerText: 1 },
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom-=100',
        },
      }
    )
  }, { scope: ref })

  return <span ref={ref}>{value}{suffix}</span>
}

export function StatsCounter({ stats }: { stats: Stat[] }) {
  // stats = [
  //   { value: 12, label: '次旅行' },
  //   { value: 8, label: '个国家' },
  //   { value: 24, label: '个城市' },
  //   { value: 36, label: '篇攻略', suffix: '+' },
  // ]
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-orange-400">
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
            </div>
            <div className="mt-2 text-white/60">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

#### Step 4.4：页面切换动画

```tsx
// src/components/providers/PageTransition.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

---

### 第五阶段：管理后台（Day 17-19）

#### Step 5.1：认证中间件

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 保护 /admin 路由
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  // 如果已登录，/admin/login 重定向到 /admin
  if (request.nextUrl.pathname === '/admin/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

#### Step 5.2：图片上传组件

```tsx
// src/components/admin/ImageUploader.tsx
'use client'

import { useState } from 'react'
import { CldUploadWidget } from 'next-cloudinary'
import { ImagePlus, Loader2 } from 'lucide-react'

interface ImageUploaderProps {
  onUpload: (result: { url: string; publicId: string; width: number; height: number }) => void
}

export function ImageUploader({ onUpload }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)

  return (
    <CldUploadWidget
      uploadPreset="travel_photos"
      options={{
        maxFiles: 10,
        resourceType: 'image',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxFileSize: 10000000, // 10MB
      }}
      onUpload={(error, result) => {
        if (error) {
          console.error('Upload error:', error)
          return
        }
        if (result.event === 'success') {
          onUpload({
            url: result.info.secure_url,
            publicId: result.info.public_id,
            width: result.info.width,
            height: result.info.height,
          })
        }
      }}
    >
      {({ open }) => (
        <button
          onClick={() => open()}
          disabled={uploading}
          className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-white/40 transition-colors w-full"
        >
          {uploading ? (
            <Loader2 className="animate-spin mx-auto mb-2" />
          ) : (
            <ImagePlus className="mx-auto mb-2 text-white/40" size={32} />
          )}
          <p className="text-white/60 text-sm">点击上传图片</p>
          <p className="text-white/30 text-xs mt-1">支持 JPG、PNG、WebP，单张最大 10MB</p>
        </button>
      )}
    </CldUploadWidget>
  )
}
```

---

### 第六阶段：SEO 与性能优化（Day 20-21）

#### Step 6.1：全局 SEO 配置

```typescript
// src/app/sitemap.ts
import { getPublishedTrips } from '@/lib/data/trips'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const trips = await getPublishedTrips()
  const baseUrl = process.env.SITE_URL || 'https://example.com'

  const tripRoutes = trips.map((trip) => ({
    url: `${baseUrl}/trips/${trip.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/trips`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/gallery`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/map`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    ...tripRoutes,
  ]
}
```

```typescript
// src/app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${process.env.SITE_URL}/sitemap.xml`,
  }
}
```

#### Step 6.2：性能优化要点

```typescript
// 1. 旅行列表使用 ISR（增量静态再生成）
// src/app/trips/page.tsx
export const revalidate = 3600 // 每小时重新生成

// 2. 旅行详情也使用 ISR
// src/app/trips/[slug]/page.tsx
export const revalidate = 86400 // 每天重新生成

// 3. generateStaticParams 预生成热门页面
export async function generateStaticParams() {
  const trips = await getPublishedTrips()
  return trips.map((trip) => ({ slug: trip.slug }))
}
```

```typescript
// next.config.ts — 完整配置
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'api.mapbox.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  // 开启实验性优化
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      'react-photo-album',
    ],
  },
}

export default nextConfig
```

---

## 3. 关键技术决策

### 3.1 为什么用 SSR/SSG 而不是纯 SPA

| 维度 | SSR/SSG (Next.js) | SPA (纯 React/Vite) |
|------|-------------------|---------------------|
| SEO | ✅ 搜索引擎可直接抓取 | ❌ 需要额外 SSR 方案 |
| 首屏速度 | ✅ 服务端直出 HTML | ❌ JS 加载后才能渲染 |
| 个人博客维护 | ✅ 数据不多，构建快 | ✅ 交互更灵活 |
| 部署复杂度 | ✅ Vercel 一键部署 | 需要额外配置 |

### 3.2 GSAP + Lenis + Framer Motion 三者的分工

| 场景 | 工具 | 原因 |
|------|------|------|
| 视差滚动 | GSAP ScrollTrigger | 性能最好，与 Lenis 天然兼容 |
| 页面切换 | Framer Motion | 声明式 API，与 React 集成度最高 |
| 卡片 hover | Framer Motion | `whileHover` 声明式，无需管理 JS 事件 |
| 惯性滚动 | Lenis | 唯一成熟的 React 平滑滚动方案 |
| 数字滚动 | GSAP | 跨浏览器兼容性最好 |

### 3.3 数据流架构

```
                    ┌─────────────────┐
                    │   Next.js 服务端  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         SSR/SSG        API Routes     Middleware
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │    Supabase      │
                    │  (PostgreSQL)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
          trips 表      photos 表    comments 表
```

### 3.4 状态管理策略

**不需要 Redux/Zustand。** 原因：
- 大部分数据通过服务端组件获取（`async function Page()`）
- 少量客户端状态（表单、弹窗、动画状态）用 `useState` 够用
- 全局状态只有：滚动位置、管理员登录态 → 分别用 Lenis 实例和 Supabase cookie 管理

---

## 4. 潜在风险与注意事项

### 4.1 ⚠️ 高危风险

#### 风险 1：Lenis 与 Next.js App Router 路由切换冲突

**症状：** 从 `/trips` 跳转到 `/trips/xxx` 后，Lenis 惯性滚动失效或页面滚动位置异常。

**原因：** App Router 的客户端导航不会触发完整的 `useEffect` 重新初始化，Lenis 实例可能引用了已卸载的 DOM。

**解决方案：**
```tsx
// 用 pathname 作为 key，强制在路由切换时重建 Lenis 实例
useEffect(() => {
  const lenis = new Lenis({...})
  // ...
  return () => lenis.destroy()
}, [pathname]) // ← 关键：依赖 pathname
```

#### 风险 2：GSAP ScrollTrigger 在 SSR 下报错

**症状：** 构建时报 `window is not defined` 或 `document is not defined`。

**解决方案：**
```tsx
// 1. 确保所有 GSAP 代码放在 'use client' 组件中
// 2. 使用动态导入（dynamic import）延迟加载
import dynamic from 'next/dynamic'

const HeroSection = dynamic(
  () => import('@/components/home/HeroSection').then(mod => mod.HeroSection),
  { ssr: false }
)
```

#### 风险 3：Mapbox Token 泄漏

**症状：** Mapbox token 暴露在前端代码中被滥用，产生账单。

**解决方案：**
1. 在 Mapbox Dashboard 设置 URL 白名单，限制 token 仅在你的域名生效
2. 使用 `NEXT_PUBLIC_` 前缀是必须的（Mapbox 需要客户端 token），但一定要设置域名限制

#### 风险 4：Cloudinary 上传未签名 Preset 被滥用

**症状：** 任何人都能向你的 Cloudinary 账号上传文件。

**解决方案：**
1. 在 Cloudinary 设置 → Upload Presets → 启用 "Signed uploads"
2. 或者在后端生成签名 URL，通过 API Route 代理上传

#### 风险 5：评论系统被垃圾信息攻击

**解决方案：**
1. 启用评论审核（`is_approved` 默认 false）
2. 添加内容过滤（敏感词库）
3. 可选：接入 reCAPTCHA v3
4. 设置频率限制（同一 IP 每分钟最多 3 条）

### 4.2 ⚡ 性能注意事项

| 问题 | 影响 | 解决方案 |
|------|------|---------|
| 瀑布流图片未做懒加载 | 首屏加载 10MB+ | 使用 `loading="lazy"` + `sizes` 属性 |
| Mapbox 在首页也加载 | 不必要的 JS 开销 | 用 `dynamic(() => import(...), { ssr: false })` 按需加载 |
| GSAP/Framer Motion 未做 tree-shaking | 包体积 +80KB | `optimizePackageImports` 配置 |
| 未使用 ISR | 每次请求都查数据库 | 列表页 `revalidate = 3600` |
| 封面图未压缩 | LCP 评分差 | Cloudinary 自动转换 WebP + 按尺寸裁剪 |

### 4.3 🔒 安全注意事项

```typescript
// ❌ 危险：直接拼接 SQL
const { data } = await supabase.from('trips').select('*').eq('slug', userInput)

// ✅ 安全：Supabase 自动参数化查询
// Supabase 的 .eq() 方法自带参数化，防止 SQL 注入

// ❌ 危险：前端直接使用 service_role key
const supabase = createClient(url, SERVICE_ROLE_KEY) // 这个 key 权限太高

// ✅ 正确：前端使用 anon key，服务端 API Route 使用 service_role key
```

### 4.4 📱 移动端适配要点

1. **瀑布流列数：** 移动端 2 列（用 CSS `grid-cols-2`），桌面端 3 列
2. **地图交互：** 移动端关闭 `dragRotate`，避免误触旋转
3. **Lenis：** 移动端设置 `smoothTouch: false`，保留原生滚动体验
4. **图片尺寸：** 使用 `sizes` 属性按视口宽度加载不同分辨率
5. **字体大小：** 移动端 H1 从 `text-6xl` 降到 `text-3xl`

### 4.5 🌐 中国大陆访问优化

| 层面 | 问题 | 解决方案 |
|------|------|---------|
| DNS | 域名解析慢 | 使用阿里云/腾讯云 DNS |
| CDN | Vercel 边缘节点较少 | 加一层 Cloudflare CDN |
| Mapbox | 地图加载慢 | 考虑 `mapbox.cn` 镜像或高德地图 |
| Cloudinary | 图片加载慢 | 启用 `fetch_format: 'auto'` + `quality: 'auto'` |
| Google Fonts | 被屏蔽 | 自托管字体文件 |

---

## 5. 推荐调整项

### 5.1 技术选型微调

| 原方案 | 建议调整 | 理由 |
|--------|---------|------|
| Tailwind CSS 原生 | 保持，但 建议引入 `tailwind-merge` + `clsx` | 处理类名冲突，`cn()` 工具函数是行业标准 |
| Mapbox GL JS | 保持，但 考虑备用地图源 | Mapbox 从 v2 开始收费，v3 免费额度可能缩紧。备选：Maplibre GL（开源 Fork） |
| 纯 Markdown | 保持 | `react-markdown` + `remark-gfm` + `rehype-highlight` 已覆盖所有需求 |
| 全部 GSAP | 精简：GSAP 只用于 ScrollTrigger 视差 | Framer Motion 处理其他动画，减少 bundle 体积 |

### 5.2 架构建议

1. **添加 `loading.tsx` 骨架屏**：每个 `page.tsx` 同级放一个 `loading.tsx`，提升感知性能
2. **添加 `error.tsx` 错误边界**：防止单个组件崩溃导致整个页面白屏
3. **使用 ISR 而非纯 SSR**：列表页设置 `revalidate = 3600`，兼顾实时性和性能
4. **预构建静态页面**：在 `generateStaticParams` 中返回热门旅行，让最常访问的页面在构建时生成
5. **添加 `/api/health` 端点和 Uptime 监控**：用 Vercel Analytics 或自建监控

### 5.3 建议新增的功能

| 功能 | 优先级 | 实现成本 |
|------|--------|---------|
| RSS Feed | 中 | 通过 `generateRssFeed()` 函数生成 XML |
| 暗色/亮色模式切换 | 低 | 已默认暗色，用户可选 |
| 文章搜索 | 中 | PostgreSQL `full_text_search` 或前端 Fuse.js |
| 照片 EXIF 信息展示 | 低 | Cloudinary 可返回 EXIF 元数据 |
| Web Analytics | 高 | Vercel Analytics / Umami（自部署免费） |

---

## 总结

### 时间评估

| 阶段 | 预估时间 |
|------|---------|
| 第一阶段：基础架构 | 3 天 |
| 第二阶段：数据库与数据层 | 2 天 |
| 第三阶段：页面实现 | 7 天 |
| 第四阶段：动画与视觉效果 | 4 天 |
| 第五阶段：管理后台 | 3 天 |
| 第六阶段：SEO 与优化 | 2 天 |
| **总计** | **约 3-4 周（利用业余时间）** |

### 费用总结

| 项目 | 费用 |
|------|------|
| 域名 | ¥50-100/年 |
| 服务器 | 免费（Vercel Hobby） |
| 数据库 | 免费（Supabase Free） |
| 图片存储 | 免费（Cloudinary Free） |
| 地图 | 免费（Mapbox Free Tier） |
| **年总支出** | **¥50-100** |

### 最终结论

**该方案高度可行。** 技术栈成熟、社区活跃、免费套餐充足、开发周期可控。主要风险是 Lenis 与 App Router 的兼容性，但已有成熟的解决方案。建议按照上述六个阶段推进，每完成一个阶段做一次部署验证，避免到最后一刻才发现集成问题。

---

*文档生成时间：2026-06-12*
*基于 `doc/travel-website-plan.md` 的深度分析*
