# Proposal: 用户身份绑定

## Intent

当前系统已实现登录功能，但管理后台的所有操作均未与用户身份关联：任何登录用户可查看、编辑、删除所有行程和照片。需引入用户身份绑定机制，使内容归属明确、操作权限可控。

## Scope

**包含：**
- 新增 `profiles` 表，存储用户角色（user / admin）
- `trips`、`ai_guides` 表新增 `user_id` 列，关联 `auth.users`
- 重写所有 RLS 策略，执行基于所有权的读写控制
- API 路由（trips、photos）增加所有权验证
- 管理后台按用户角色区分视图：管理员可切换"所有行程"/"我的行程"，普通用户仅见自己的内容
- 修复中间件未启用的问题（`src/proxy.ts` 调用 `updateSession`）

**不包含：**
- 用户注册页面（手动在 Supabase 控制台创建账号）
- 用户管理界面（管理员创建/禁用用户等操作留待后续）

## Approach

四层改动，自底向上：**Schema**（添加 `user_id` + `profiles` 表并迁移现有数据）→ **RLS**（重写策略，`profiles.role = 'admin'` 绕过所有权检查）→ **API**（POST 存储 `user_id`，PUT/DELETE 验证所有权）→ **UI**（管理员标签页切换，普通用户仅见自己的数据）。

## Capabilities

### Modified Capabilities
- `data`: 全部表新增 `user_id` 列 + `profiles` 表，RLS 策略基于所有权重写
- `architecture`: 中间件启用（`src/proxy.ts`），引入基于角色的访问控制
- `ui`: 管理后台行程列表页、画廊管理页按用户角色区分渲染

### New Capabilities
- `user-identity`: profiles 表管理用户角色，支撑全链路身份绑定

## Impact

| 影响范围 | 文件 |
|----------|------|
| 数据库 | `trips`、`ai_guides` 加 `user_id` 列；新建 `profiles` 表；全部 RLS 策略重写 |
| 新数据层 | `src/lib/data/profiles.ts` |
| 修改数据层 | `src/lib/data/trips.ts`、`src/lib/data/ai-guides.ts` |
| 修改类型 | `src/types/trip.ts`、`src/types/ai-guide.ts`；新增 `src/types/profile.ts` |
| 修改 API | `src/app/api/trips/route.ts`、`src/app/api/photos/route.ts` |
| 修改页面 | `src/app/admin/page.tsx`、`src/app/admin/trips/page.tsx`、`src/app/admin/trips/[id]/edit/page.tsx`、`src/app/admin/gallery/page.tsx`、`src/app/admin/guide/generated/page.tsx` |
| 修改组件 | `src/components/admin/TripList.tsx`、`src/components/admin/GalleryManager.tsx`、`src/app/admin/layout.tsx` |
| 中间件修复 | `src/proxy.ts`（引入 `updateSession`） |
