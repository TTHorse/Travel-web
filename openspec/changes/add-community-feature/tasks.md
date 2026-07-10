# Tasks

## 1. 数据库迁移

- [x] 1.1 创建 `likes` 表：`user_id UUID REFERENCES auth.users(id)`, `trip_id UUID REFERENCES trips(id) ON DELETE CASCADE`, `created_at TIMESTAMPTZ DEFAULT now()`, `PRIMARY KEY (user_id, trip_id)`
- [x] 1.2 创建 `favorites` 表：`user_id UUID REFERENCES auth.users(id)`, `trip_id UUID REFERENCES trips(id) ON DELETE CASCADE`, `created_at TIMESTAMPTZ DEFAULT now()`, `PRIMARY KEY (user_id, trip_id)`
- [x] 1.3 修改 `comments` 表：删除所有现有行 → 添加 `user_id UUID NOT NULL REFERENCES auth.users(id)` → 保留 `author_name` 列
- [x] 1.4 为 `likes` 和 `favorites` 创建 RLS 策略：SELECT 公开，INSERT/DELETE 仅 `user_id = auth.uid()`
- [x] 1.5 为 `comments` 更新 RLS 策略：SELECT 公开（`is_approved = true`），INSERT 仅 `user_id = auth.uid()`，DELETE 仅 `user_id = auth.uid() OR isAdmin()`

## 2. 数据访问层

- [x] 2.1 创建 `src/lib/data/community.ts` — `getCommunityTrips(sort, page)`, `getCommunityTripBySlug(slug)`
- [x] 2.2 创建 `src/lib/data/likes.ts` — `toggleLike(userId, tripId)`, `getLikeStatus(userId, tripId)`, `getLikesCount(tripId)`
- [x] 2.3 创建 `src/lib/data/favorites.ts` — `toggleFavorite(userId, tripId)`, `getFavoriteStatus(userId, tripId)`, `getFavoritesCount(tripId)`
- [x] 2.4 创建 `src/lib/data/users.ts` — `getUserProfile(userId)`, `getUserPublishedTrips(userId)`, `getUserFavoritedTrips(userId)`
- [x] 2.5 修改 `src/lib/data/comments.ts` — `createComment()` 改为接受 `userId`，新增 `getCommunityComments(tripId)`

## 3. API 端点

- [x] 3.1 创建 `src/app/api/community/trips/route.ts` — `GET` 返回聚合列表（支持 `?sort=newest|hottest&page=1`）
- [x] 3.2 创建 `src/app/api/community/trips/[id]/route.ts` — `GET` 返回单篇游记详情 + 互动计数 + 当前用户互动状态
- [x] 3.3 创建 `src/app/api/community/trips/[id]/like/route.ts` — `POST` 点赞, `DELETE` 取消点赞（UPSERT toggle）
- [x] 3.4 创建 `src/app/api/community/trips/[id]/favorite/route.ts` — `POST` 收藏, `DELETE` 取消收藏（UPSERT toggle）
- [x] 3.5 创建 `src/app/api/community/trips/[id]/comments/route.ts` — `GET` 评论列表, `POST` 发表评论
- [x] 3.6 创建 `src/app/api/users/[id]/route.ts` — `GET` 用户信息 + 已发布游记
- [x] 3.7 创建 `src/app/api/users/[id]/favorites/route.ts` — `GET` 用户收藏列表

## 4. 社区页面

- [x] 4.1 创建 `src/app/community/page.tsx` — 社区聚合页（Server Component），获取已发布游记 + 互动计数
- [x] 4.2 创建 `src/components/community/CommunityTabs.tsx` — "最新"/"最热" 排序切换（Client Component, URL searchParams）
- [x] 4.3 创建 `src/components/community/CommunityCard.tsx` — 游记卡片（cover, title, destination, author 头像+名, 点赞数, 评论数）
- [x] 4.4 创建 `src/app/community/trips/[slug]/page.tsx` — 社区游记详情页（Server Component）
- [x] 4.5 创建 `src/components/community/LikeButton.tsx` — 点赞按钮（Client Component, 乐观更新）
- [x] 4.6 创建 `src/components/community/FavoriteButton.tsx` — 收藏按钮（Client Component, 乐观更新）
- [x] 4.7 创建 `src/components/community/CommentSection.tsx` — 评论组件（列表 + 发表表单）
- [x] 4.8 创建 `src/components/community/AuthorCard.tsx` — 作者信息卡片（头像、名称、链接到 `/users/[id]`）

## 5. 用户主页

- [x] 5.1 创建 `src/app/users/[id]/page.tsx` — 用户主页（Server Component）
- [x] 5.2 创建 `src/components/community/UserHero.tsx` — 用户信息头部（头像、名称、加入时间、统计数字）
- [x] 5.3 创建 `src/components/community/UserTabs.tsx` — "游记"/"收藏" 标签切换（Client Component）
- [x] 5.4 创建 `src/components/community/UserTripGrid.tsx` — 游记/收藏卡片网格

## 6. UI 整合

- [x] 6.1 修改 `src/lib/constants.ts` — `NAV_LINKS` 添加 `{ href: "/community", label: "社区" }`
- [x] 6.2 创建 `src/app/community/loading.tsx` — 社区页加载骨架屏
- [x] 6.3 创建 `src/app/community/error.tsx` — 社区页错误边界
- [x] 6.4 创建 `src/app/community/trips/[slug]/loading.tsx` — 详情页加载骨架屏
- [x] 6.5 创建 `src/app/users/[id]/loading.tsx` — 用户页加载骨架屏
- [x] 6.6 创建 `src/app/users/[id]/error.tsx` — 用户页错误边界（含 404 处理）

## 7. 验证

- [x] 7.1 Run `npx tsc --noEmit` — 0 errors
- [x] 7.2 Run `npm run build` — all pages compile
- [ ] 7.3 ⚠️ 手动操作：在 Supabase SQL Editor 执行 `migration.sql`
- [ ] 7.4 手动测试社区列表页：访问 `/community` → 看到所有已发布游记卡片，切换排序
- [ ] 7.5 手动测试社区详情页：点击卡片 → 显示游记内容 + 作者信息 + 点赞/收藏按钮 + 评论区
- [ ] 7.6 手动测试点赞：登录后点赞/取消 → 计数实时更新，按钮状态切换
- [ ] 7.7 手动测试收藏：登录后收藏/取消 → 计数实时更新，用户主页收藏标签可见
- [ ] 7.8 手动测试评论：登录后发表评论 → 评论出现在列表；未登录 → 显示登录提示
- [ ] 7.9 手动测试用户主页：点击作者 → `/users/[id]` 显示用户信息和游记列表，切到收藏标签
- [ ] 7.10 手动测试 `/trips` 模块无回归：现有行程列表、详情、评论功能正常
