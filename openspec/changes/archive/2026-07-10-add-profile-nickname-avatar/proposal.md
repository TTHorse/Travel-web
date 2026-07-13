# Proposal: 用户昵称与头像

## Intent

`profiles` 表已有 `display_name` 字段但不提供注册后编辑入口，头像功能完全缺失——所有展示用户的地方都用 `<User>` 图标占位。本次变更补全昵称编辑和头像上传能力，并更新全局用户展示组件。

## Scope

**包含：**
- `/admin/settings` 增加「个人资料」区块（编辑 display_name + 上传 avatar）
- `PATCH /api/profile` — 更新当前用户的 display_name / avatar_url
- `profiles` 表新增 `avatar_url TEXT` 列
- Cloudinary Upload Widget 复用（头像上传）
- 头像 fallback：无头像时显示 display_name 首字母
- 全局替换 User 图标占位为真实头像：`UserHero`、`AuthorCard`、`CommunityCard`、`CommentSection`
- Admin 侧边栏底部展示头像 + display_name（替换纯 email）

**不包含：**
- 用户名/唯一 handle（`display_name` 无唯一性约束）
- 头像裁剪（Cloudinary Widget 自带基础裁剪，不做额外服务端裁剪）
- 个人简介/bio 等扩展字段
- Gravatar 等第三方头像服务集成

## Approach

复用 Cloudinary Upload Widget（已在 `CloudinaryUpload.tsx` 封装），新增 `PATCH /api/profile` 做服务端校验更新。`display_name` 复用现有字段，去掉「不可编辑」的现状。头像用纯前端 fallback（首字母圆形），不上传时走 Cloudinary URL。

## Capabilities

### Modified Capabilities
- `data`: `profiles` 表新增 `avatar_url` 列；`profiles.ts` 新增 `updateProfile()` 函数
- `ui`: `/admin/settings` 扩展个人资料区块；UserHero / AuthorCard / CommunityCard / CommentSection / AdminLayout 头像展示
- `architecture`: 新增 `PATCH /api/profile` 端点

## Impact

- 涉及文件：~12 个（1 个 API route、1 个 data accessor 修改、1 个设置页扩展、5 个组件头像替换、1 个 layout 修改、1 个 type 修改、1 个 DB migration）
- 无破坏性变更：`display_name` 语义不变，`avatar_url` 为新列允许 NULL
- 性能影响：无（头像 URL 来自 profiles 表，已在现有查询中覆盖）
