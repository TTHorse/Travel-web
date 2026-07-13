# Design: 用户昵称与头像

## Context

当前 `profiles` 表有 `display_name`（注册时设置、不可编辑）、无 `avatar_url`。所有用户展示位用 `<User>` 图标占位。Cloudinary Upload Widget 已在照片上传中封装好（`cloudName: "ncgzlyq5"`, `uploadPreset: "travel-web-uploads"`），可直接复用。

## Goals / Non-Goals

**Goals:**
- 用户可在 `/admin/settings` 编辑昵称（display_name）和上传头像（avatar_url）
- 全局用户展示位显示真实头像（有则显示，无则首字母 fallback）
- Admin 侧边栏展示头像 + display_name

**Non-Goals:**
- 头像裁剪（Cloudinary Widget 内建基础裁剪能力）
- display_name 唯一性约束
- bio/个人简介

## Decisions

| Decision | Rationale |
|----------|-----------|
| 头像 fallback 用首字母圆形 | 零外部依赖，与暗色主题一致，比 Gravatar 更可控 |
| 昵称和头像在同一个 API 端点更新 | 设置页的个人资料是一个表单，减少两个独立请求的复杂度 |
| 头像上传复用 Cloudinary Upload Widget | 已有封装 `CloudinaryUpload.tsx`，零配置，和照片上传一致 |
| `avatar_url` 存完整 Cloudinary URL | 和 `photos.url` 模式一致，前端直接用 `<img>` 渲染 |
| `display_name` 无长度限制（仅前端截断显示） | 个人网站，不需要严格的校验边界；UI 层用 CSS `truncate` 处理过长昵称 |
| 设置页个人资料和密码修改保持两个独立区块 | 独立表单，独立提交，职责清晰 |

## Data Flow

### 更新个人资料
```
Browser                          API Route (Server)         Supabase
  │                                │                          │
  │  PATCH /api/profile            │                          │
  │  { display_name, avatar_url }  │                          │
  │  ─────────────────────────▶    │                          │
  │                                │  1. 从 cookie 获取 user   │
  │                                │  2. Zod 校验 body         │
  │                                │  3. UPDATE profiles       │
  │                                │     SET display_name,     │
  │                                │         avatar_url,       │
  │                                │         updated_at        │
  │                                │     WHERE user_id = uid   │
  │                                │     ──────────────────▶   │
  │  ◀────── { profile }          │                          │
```

### 头像上传
```
Browser                          Cloudinary
  │                                │
  │  CloudinaryUpload Widget       │
  │  ──────────────────────────────▶  upload
  │  ◀────── { secure_url }       │
  │                                │
  │  (拿到 URL 后调 PATCH /api/profile)
```

## Component Changes

```
修改文件清单:

新增:
  src/app/api/profile/route.ts       — PATCH handler

修改:
  src/types/profile.ts               — +avatar_url
  src/lib/data/profiles.ts           — +updateProfile()
  src/app/admin/settings/page.tsx    — 加个人资料区块
  src/app/admin/layout.tsx           — 侧边栏头像+昵称
  src/components/community/UserHero.tsx       — 真实头像
  src/components/community/AuthorCard.tsx     — 真实头像
  src/components/community/CommunityCard.tsx  — 真实头像
  src/components/trip/CommentSection.tsx      — 真实头像
  src/components/community/CommentSection.tsx — 真实头像

数据库:
  ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
```

## Avatar Fallback Component

新建一个小的 `UserAvatar` UI 组件，收拢头像逻辑：

```
UserAvatar({ url, name, size })
  │
  ├─ url 存在 → <img src={url} className="rounded-full" />
  └─ url 为空 → <div className="rounded-full bg-white/10 flex items-center justify-center">
                  {name?.[0]?.toUpperCase() || <User />}
                </div>
```

统一所有展示位调用这个组件，避免散落重复逻辑。

## Risks

| Risk | Mitigation |
|------|-----------|
| `avatar_url` 可能指向非 Cloudinary 的恶意 URL | 个人网站，仅用户自己设置，且 URL 仅在 `<img>` 中渲染（浏览器不会执行 JS）。如果后续需要，可限制允许的域名前缀 |
| 旧组件漏改仍然显示占位图标 | 集中到 `UserAvatar` 组件，grep 检查 `<User` 图标在用户展示位的残留引用 |
