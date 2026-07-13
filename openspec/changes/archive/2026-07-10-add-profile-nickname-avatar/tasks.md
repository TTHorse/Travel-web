# Tasks

## 1. 数据库与类型

- [ ] 1.1 数据库 migration：`ALTER TABLE profiles ADD COLUMN avatar_url TEXT;`（Supabase Dashboard SQL Editor 手动执行）
- [x] 1.2 更新 `src/types/profile.ts` — `Profile` 接口加 `avatar_url: string | null`

## 2. 数据访问层

- [x] 2.1 在 `src/lib/data/profiles.ts` 新增 `updateProfile()` 函数
- [x] 2.2 `PublicUserProfile`（`src/lib/data/users.ts`）加 `avatar_url: string | null`

## 3. API

- [x] 3.1 创建 `src/app/api/profile/route.ts` — `GET` + `PATCH` handler（Zod 校验 + session 验证 + 调用 updateProfile）

## 4. 通用组件

- [x] 4.1 创建 `src/components/ui/UserAvatar.tsx` — 头像组件（url → img / fallback → 首字母 / fallback → User 图标）

## 5. 设置页

- [x] 5.1 重构 `src/app/admin/settings/page.tsx` — 拆分为「个人资料」+「修改密码」两个区块
- [x] 5.2 个人资料区块加载当前 profile 数据（display_name + avatar_url）
- [x] 5.3 集成 CloudinaryUpload 组件用于头像上传
- [x] 5.4 实现保存逻辑（调用 PATCH /api/profile）+ 成功/错误提示

## 6. 全局头像替换

- [x] 6.1 `UserHero.tsx` — 替换 `<User>` 图标为 `<UserAvatar>`
- [x] 6.2 `AuthorCard.tsx` — 替换 `<User>` 图标为 `<UserAvatar>`（新增 avatarUrl prop）
- [x] 6.3 `CommunityCard.tsx` — 替换 `<User>` 图标为 `<UserAvatar>`
- [x] 6.4 `src/components/community/CommentSection.tsx` — 替换 `<User>` 图标为 `<UserAvatar>`
- [x] 6.5 `src/components/trip/CommentSection.tsx` — 替换 `<User>` 图标为 `<UserAvatar>`
- [x] 6.6 `Comment` 类型 + comments 数据层 — 批量获取 `author_avatar_url`
- [x] 6.7 `CommunityTripSummary` / `CommunityTripDetail` — 加 `author_avatar_url` 字段

## 7. 侧边栏

- [x] 7.1 修改 `src/app/admin/layout.tsx` 侧边栏底部 — 展示 `<UserAvatar>` + display_name + email

## 8. 验证

- [x] 8.1 Run `npx tsc --noEmit` — 0 errors
- [x] 8.2 Run `npm run build` — 编译通过
- [ ] 8.3 手动测试：登录 → `/admin/settings` → 修改昵称 → 刷新确认
- [ ] 8.4 手动测试：上传头像 → 预览 → 保存 → 刷新确认
- [ ] 8.5 手动测试：移除头像 → 确认 fallback 显示
- [ ] 8.6 手动测试：公开主页 `UserHero`、`AuthorCard`、`CommentSection` 头像显示
- [ ] 8.7 手动测试：侧边栏底部头像 + 昵称显示
