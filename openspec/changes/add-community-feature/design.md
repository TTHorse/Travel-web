# Design: 社区功能

## Context

当前架构：Supabase Auth email/password 认证，`profiles` 表存储用户角色和显示名称，`trips` 表有 `user_id` 所有权和 `is_published` 发布状态，`comments` 表支持嵌套回复但仅用 `author_name` 文本不关联用户。RLS 策略允许公开读取已发布内容，写操作限制为所有者或管理员。

社区模块完全复用这套架构。`/trips` 模块不动，社区是独立平行的新模块。

## Goals / Non-Goals

**Goals:**
- `/community` 全站游记聚合，最新/最热排序
- `/community/trips/[slug]` 社区游记详情，含点赞、收藏、评论
- `/users/[id]` 用户主页，展示游记和收藏
- 仅注册用户可点赞、收藏、评论
- 互动计数（点赞数、收藏数、评论数）在卡片和详情页展示
- 硬切换评论系统：清空旧数据，强制关联 `user_id`

**Non-Goals:**
- 评论/点赞通知
- 关注/粉丝系统
- 浏览量统计
- 全文搜索
- 内容审核/举报

## Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| **Decision 1**: `/community` 与 `/trips` 完全独立 | `/trips` 是遗留的单用户展示风格，大量组件已定型。独立模块避免回归风险，各自演进 | 改 `/trips` 为社区页 → 破坏现有设计，大量回归测试 |
| **Decision 2**: 社区详情页路由 `/community/trips/[slug]`（用 slug 而非 id） | 与现有 `/trips/[slug]` 风格一致，URL 可读，SEO 友好 | 用 id → URL 不友好；用 `/community/[slug]` → 与列表页层级关系不清晰 |
| **Decision 3**: 点赞/收藏用独立表，复合主键，UPSERT 语义 | 一人一游记只能点赞一次，再次点击取消。复合主键天然去重，UPSERT 避免 race condition | 单独计数器字段 → 无法追溯谁点了赞，无法做"已点赞"状态 |
| **Decision 4**: 评论表硬切换（清空 + `user_id NOT NULL`） | 当前站点的评论量极少（个人网站初期），清空成本低。保留旧数据意味着 mixed 模式（user_id 可空），所有查询和展示都要处理两种路径，长期负担大 | 渐进式（user_id 可空）→ UI 要处理匿名评论和注册评论两种展示，数据访问层到处是 null check |
| **Decision 5**: 社区 API 端点放在 `/api/community/` 下 | 社区是独立功能域，API 组织与其 UI 路由对应，清晰度高。与 `/api/trips/` 平行不冲突 | 合并到 `/api/trips/` → 语义混在一起，社区列表和后台管理列表用同一个端点容易出 bug |
| **Decision 6**: 导航栏加"社区"链接，显示在旅行和画廊之间 | 社区是主要入口，应全站可见。位置在旅行内容区（旅行 → 社区 → 画廊）逻辑连贯 | 加在首页后面 → 社区与旅行的关联被画廊打断；加在最末 → 不够突出 |
| **Decision 7**: 社区列表页用 `revalidate = 0`（动态渲染），不缓存 | 互动数据频繁变化（点赞数、评论数），缓存导致数据过时。社区页需要实时性 | ISR → 点赞/收藏后列表页数据不更新；客户端轮询 → 增加复杂度 |
| **Decision 8**: 评论用户信息冗余存储 `author_name` 在 `comments` 表 | 避免每次渲染评论列表都要 JOIN profiles。插入评论时从 profiles 同步 `display_name` 到 `author_name` | 纯 JOIN → N+1 查询或复杂 join，社区详情页加载变慢 |

## Data Flow

### 社区列表页加载
```
Browser                          Server                    Supabase
  │                                │                          │
  │  GET /community                │                          │
  │  ──────────────────────────▶   │                          │
  │                                │  getCommunityTrips()     │
  │                                │  ├─ SELECT trips         │
  │                                │  │  WHERE is_published   │
  │                                │  │  ORDER BY sort        │
  │                                │  ├─ LEFT JOIN profiles   │
  │                                │  │  (author display_name)│
  │                                │  ├─ likes_count 子查询   │
  │                                │  ├─ comments_count 子查询│
  │                                │  ──────────────────────▶ │
  │                                │  ◀────────────────────── │
  │  ◀── RSC 渲染的卡片网格 ────── │                          │
```

### 点赞/收藏 Toggle
```
Browser                          API Route (Server)         Supabase
  │                                │                          │
  │  POST /api/community/trips/   │                          │
  │       [id]/like               │                          │
  │  ─────────────────────────▶   │                          │
  │                                │  auth.getUser()         │
  │                                │  ├─ 未认证 → 401        │
  │                                │  ├─ UPSERT likes        │
  │                                │  │  (user_id, trip_id)  │
  │                                │  │  ON CONFLICT DELETE   │
  │                                │  │  (toggle 语义)       │
  │                                │  ──────────────────────▶ │
  │                                │  ◀── { liked: bool } ──  │
  │  ◀── 200 { liked: false } ──── │                          │
```

### 评论提交
```
Browser                          API Route (Server)         Supabase
  │                                │                          │
  │  POST /api/community/trips/   │                          │
  │       [id]/comments           │                          │
  │  { content, parent_id? }      │                          │
  │  ─────────────────────────▶   │                          │
  │                                │  auth.getUser()         │
  │                                │  ├─ 未认证 → 401        │
  │                                │  ├─ SELECT display_name │
  │                                │  │  FROM profiles       │
  │                                │  ├─ INSERT comments     │
  │                                │  │  (trip_id, user_id,  │
  │                                │  │   author_name,       │
  │                                │  │   content, parent_id)│
  │                                │  ──────────────────────▶ │
  │                                │  ◀────────────────────── │
  │  ◀── 201 { comment } ──────── │                          │
```

## Component Boundaries

### Server Components (默认)
- `/community/page.tsx` — 服务端获取数据，渲染卡片网格
- `/community/trips/[slug]/page.tsx` — 服务端获取游记详情 + 互动计数
- `/users/[id]/page.tsx` — 服务端获取用户信息 + 游记列表

### Client Components ('use client')
- `CommunityTabs` — "最新"/"最热" 排序切换（URL searchParams）
- `LikeButton` — 点赞 toggle，乐观更新
- `FavoriteButton` — 收藏 toggle，乐观更新
- `CommentSection` — 评论列表 + 发表表单（需登录状态）
- `CommunityCard` — 游记卡片（hover 效果等交互）
- `UserTabs` — "游记"/"收藏" 标签切换

### Data Access (`src/lib/data/`)
- `community.ts` — `getCommunityTrips()`, `getCommunityTripBySlug()`, `getUserProfile()`, `getUserTrips()`, `getUserFavorites()`
- `likes.ts` — `toggleLike()`, `getLikeStatus()`
- `favorites.ts` — `toggleFavorite()`, `getFavoriteStatus()`
- `comments.ts` — 修改 `createComment()` 接受 `userId`，新称 `createCommunityComment()`

## Route Map
```
src/app/
├── community/
│   ├── page.tsx                    # 社区聚合页 (Server)
│   └── trips/
│       └── [slug]/
│           └── page.tsx            # 社区游记详情 (Server + Client children)
├── users/
│   └── [id]/
│       └── page.tsx                # 用户主页 (Server)
└── api/
    ├── community/
    │   └── trips/
    │       ├── route.ts             # GET: 列表
    │       └── [id]/
    │           ├── route.ts         # GET: 详情
    │           ├── like/
    │           │   └── route.ts     # POST/DELETE: 点赞 toggle
    │           ├── favorite/
    │           │   └── route.ts     # POST/DELETE: 收藏 toggle
    │           └── comments/
    │               └── route.ts     # GET/POST: 评论
    └── users/
        └── [id]/
            ├── route.ts             # GET: 用户信息 + 游记
            └── favorites/
                └── route.ts         # GET: 用户收藏列表
```
