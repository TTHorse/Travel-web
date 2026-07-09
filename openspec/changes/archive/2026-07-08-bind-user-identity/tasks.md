# Tasks

## 1. Schema & Migration

- [x] 1.1 编写数据库迁移 SQL：`trips` 和 `ai_guides` 表新增 `user_id UUID REFERENCES auth.users(id)` 列
- [x] 1.2 创建 `profiles` 表（`user_id UUID PK REFERENCES auth.users`, `role TEXT DEFAULT 'user'`, `display_name TEXT`, `created_at`, `updated_at`）
- [x] 1.3 迁移 SQL 中添加现有数据回填逻辑（现有 `trips` 和 `ai_guides` 的 `user_id` 设为管理员账户）
- [ ] 1.4 在 Supabase Dashboard SQL Editor 执行迁移脚本

## 2. RLS 策略重写

- [x] 2.1 重写 `trips` 表 RLS 策略 — SELECT（public 可读已发布 OR owner OR admin）、INSERT（必须设置 user_id）、UPDATE/DELETE（owner OR admin 子查询）
- [x] 2.2 重写 `photos` 表 RLS 策略 — SELECT（public 可读 OR owner OR admin 通过 trip 级联）、INSERT（trip owner OR admin 子查询）、DELETE（同上）
- [x] 2.3 重写 `map_points` 表 RLS 策略 — 与 photos 相同级联模式
- [x] 2.4 重写 `ai_guides` 表 RLS 策略 — SELECT（owner OR admin）、INSERT（user_id = auth.uid()）、UPDATE/DELETE（owner OR admin）
- [x] 2.5 创建 `profiles` 表 RLS 策略 — SELECT（自己或 admin）、INSERT/UPDATE（admin 专用）
- [x] 2.6 `comments` 保持公开读写策略不变

## 3. Types & 数据访问层

- [x] 3.1 新建 `src/types/profile.ts` — 定义 `Profile` 类型（user_id, role, display_name）
- [x] 3.2 修改 `src/types/trip.ts` — 新增 `user_id: string` 字段
- [x] 3.3 修改 `src/types/ai-guide.ts` — 新增 `user_id: string` 字段
- [x] 3.4 新建 `src/lib/data/profiles.ts` — `getProfile(userId)`、`isAdmin(userId)`、`upsertProfile()`
- [x] 3.5 修改 `src/lib/data/trips.ts` — 新增 `getTripsByUser(userId)`、`getAllTripsAdmin()`；改造 `getPublishedTrips()` 支持按用户过滤
- [x] 3.6 修改 `src/lib/data/ai-guides.ts` — 查询函数增加 `userId` 参数过滤

## 4. API 路由更新

- [x] 4.1 修改 `POST /api/trips` — 存储 `user_id = user.id`，创建时自动写入
- [x] 4.2 修改 `PUT /api/trips` — 操作前检查 `trip.user_id === user.id` OR `profile.role === 'admin'`
- [x] 4.3 修改 `DELETE /api/trips` — 操作前检查所有权（同 PUT 逻辑），禁止变更 `user_id`
- [x] 4.4 修改 `POST /api/photos` — 验证父 trip 所有权后才能添加照片
- [x] 4.5 修改 `DELETE /api/photos` — 通过 trip 级联验证所有权
- [x] 4.6 修改 `POST /api/ai/generate-guide` — 存储 `user_id` 到 `ai_guides` 表

## 5. 管理后台页面

- [x] 5.1 修改 `src/app/admin/layout.tsx` — 读取 profile.role 并通过 context 或 props 传递给子页面
- [x] 5.2 修改 `src/app/admin/page.tsx`（仪表盘） — 管理员显示全站统计，普通用户显示个人统计
- [x] 5.3 修改 `src/app/admin/trips/page.tsx` — 管理员添加「所有行程」「我的行程」标签页切换；普通用户直接显示自己的行程列表
- [x] 5.4 修改 `src/app/admin/trips/[id]/edit/page.tsx` — 加载前验证所有权（非管理员且非所有者 → 403）
- [x] 5.5 修改 `src/app/admin/gallery/page.tsx` — 按用户过滤照片查询（通过先查用户拥有哪些 trip_id）
- [x] 5.6 修改 `src/app/admin/guide/generated/page.tsx` — 添加认证检查，按用户或管理员范围过滤查询
- [x] 5.7 修改 `src/components/admin/TripList.tsx` — 表格新增「所有者」列（仅管理员视图显示）
- [x] 5.8 修改 `src/components/admin/GalleryManager.tsx` — 管理员不限制删除（自己的或他人的），普通用户仅可删除自己的 trip 下的照片

## 6. Profiles 初始化

- [x] 6.1 创建 profiles 初始化逻辑 — 用户首次访问管理后台时自动创建 profile（默认 `role='user'`）
- [ ] 6.2 在 Supabase Dashboard 手动为管理员账户设置 `role='admin'`
- [ ] 6.3 确认现有管理员账户在 `auth.users` 中存在且 profiles 行已创建

## 7. 中间件启用

- [x] 7.1 创建或修改 `src/proxy.ts` — 导入并调用 `updateSession` from `src/lib/supabase/middleware.ts`（已有 `src/proxy.ts`，matcher 覆盖 `/admin/:path*`）
- [x] 7.2 确保 `/admin/guide/*` 路由受认证保护（`/admin/:path*` matcher 已覆盖所有子路由）
- [x] 7.3 验证中间件正确刷新 session cookie + 重定向未登录用户（`updateSession` 已实现）

## 8. Verification

- [x] 8.1 Run `npx tsc --noEmit` — 0 errors（仅剩预存的 `@amap/amap-jsapi-loader` 类型声明问题，非本次变更引入）
- [x] 8.2 Run `npm run build` — all pages compile
- [ ] 8.3 手动测试：管理员登录 → 管理后台可查看所有行程 → 可编辑/删除任何行程
- [ ] 8.4 手动测试：普通用户登录 → 管理后台仅显示自己创建的行程 → 无法通过直接 URL 访问他人行程编辑页
- [ ] 8.5 手动测试：未登录访问 `/admin`、`/admin/guide` → 重定向到 `/admin/login`
- [ ] 8.6 手动测试：登录用户在 `/admin/login` → 重定向到 `/admin`
- [ ] 8.7 手动测试：创建新行程 → 确认 `user_id` 正确写入 → 确认仅所有者和管理员可见
