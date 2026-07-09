# Design: 用户注册与密码管理

## Context

当前架构：Supabase Auth 提供 email/password 认证，`src/lib/supabase/client.ts` 封装浏览器端 client，`src/lib/supabase/server.ts` 提供服务端 client 和 service-role client。中间件（`src/proxy.ts`）守护 `/admin/*` 路由。`profiles` 表通过 `getCurrentProfile()` 自动创建（首次访问时），默认 `role='user'`。

本次设计复用这些已有能力，仅新增页面和 API 端点的组合实现用户自助注册和密码管理流程。

## Goals / Non-Goals

**Goals:**
- 任何访问者可通过 `/register` 自行注册账号（email + 显示名称 + 密码），注册后自动登录
- 已登录用户可在 `/admin/settings` 修改密码（需验证旧密码）
- 忘记密码的用户可通过 `/forgot-password` 发起重置，在 `/reset-password` 设置新密码
- 登录页提供注册引导、忘记密码入口

**Non-Goals:**
- 邮箱验证流程（Supabase 设置中关闭 `Confirm email`）
- OAuth 第三方登录
- 用户资料编辑（显示名称、头像等）
- 管理员用户管理界面

## Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| **Decision 1**: 注册即登录，关闭 Supabase 邮箱确认 | 个人网站，简化注册流程降低门槛。`signUp()` 无邮箱确认时直接返回 session | 开启邮箱确认 → 用户体验更复杂，需处理未确认账号状态；对个人网站过度设计 |
| **Decision 2**: 注册页用独立路由 `/register`，放在 `/admin/*` 之外 | 注册是公开入口，不应受 proxy 认证保护。与登录页独立避免表单切换的 UX 复杂度 | 集成到 `/admin/login` 用标签页切换 → 同一个路由承载两种模式，状态管理复杂，且 `/admin/login` 路由 proxy 会对已登录用户做重定向，影响注册后自动登录的体验 |
| **Decision 3**: 密码修改走 API Route（服务端验证旧密码） | `supabase.auth.updateUser({ password })` 不要求旧密码——这意味着一个被 hijack 的 session 可以直接改密码。在服务端用 service-role client 重新验证旧密码是必要的安全防护 | 客户端直接调 `updateUser` → 安全风险：任何持有 session 的人（如 XSS 窃取 cookie）都能改密码 |
| **Decision 4**: 忘记密码 → 重置密码走两个独立页面 | Supabase `resetPasswordForEmail()` 发送邮件，用户点击链接后 Supabase 交换 token 并重定向到我们指定的 `/reset-password` 页面；两个职责清晰的页面比单页状态机更易维护 | 单页切换（输入邮箱 → 输入新密码）→ URL 状态管理复杂，且邮件链接跳转后难以区分"刚从邮件来"和"直接访问" |
| **Decision 5**: 密码修改成功后不强制重新登录 | `updateUser` 会自动刷新 cookie，session 保持有效。显示成功提示即可 | 强制登出并重定向登录页 → UX 不友好，且 Supabase 的 session 刷新机制已处理安全问题 |
| **Decision 6**: `/reset-password` 页面检测 session 缺失时显示友好提示 | 用户可能过期访问、直接访问该 URL，应该引导重新发起重置而非显示技术错误 | 静默失败 → 用户困惑 |
| **Decision 7**: `/admin/settings` 放在 admin 布局内，侧边栏新增入口 | 设置页面仅对已登录用户有意义，自然归属 admin 的受保护路由。在侧边栏底部（用户信息和登出按钮上方）添加设置链接 | 独立路由 `/settings` → 碎片化；顶部导航 → 与当前 admin 布局风格不一致 |

## Data Flow

### 注册流程
```
Browser                          Server                    Supabase
  │                                │                          │
  │  POST /register (form submit)  │                          │
  │  ├─ supabase.auth.signUp()     │                          │
  │  │  ──────────────────────────────────────────────────▶  │
  │  │  ◀──────────────────── 返回 session + user            │
  │  │  (无邮箱确认，直接返回 session)                          │
  │  │                                                       │
  │  ├─ 注册成功 → router.push("/admin")                      │
  │  │  ├─ /admin 加载 → getCurrentProfile()                  │
  │  │  │  ──────────────────────────────▶  profiles 自动创建  │
  │  │  └─ 跳转 admin 首页                                    │
```

### 登录后修改密码
```
Browser                          API Route (Server)         Supabase
  │                                │                          │
  │  POST /api/auth/change-pw     │                          │
  │  { currentPassword,           │                          │
  │    newPassword }              │                          │
  │  ─────────────────────────▶   │                          │
  │                               │  1. 从 cookie 获取 user   │
  │                               │  2. supabase (service)    │
  │                               │     .auth.signInWithPassword│
  │                               │     (email, currentPw)    │
  │                               │     ──────────────────▶   │
  │                               │     ◀────── 成功/失败     │
  │                               │                          │
  │                               │  (验证通过)                │
  │                               │  3. supabase (service)    │
  │                               │     .auth.admin.updateUser│
  │                               │     (userId, {password})  │
  │                               │     ──────────────────▶   │
  │  ◀────── { success: true }    │                          │
```

### 密码重置流程
```
Browser                    Server            Supabase        Email
  │                          │                  │               │
  │  /forgot-password        │                  │               │
  │  输入 email               │                  │               │
  │  ├─ supabase.auth        │                  │               │
  │  │  .resetPasswordForEmail│                 │               │
  │  │  (email, {redirectTo: │                  │               │
  │  │   '/reset-password'}) │                  │               │
  │  │  ──────────────────────────────────────▶  │               │
  │  │                                          │ ───────────▶  │
  │  │  ◀── 成功（无异常）                        │               │
  │  └─ 显示"请查看邮件"       │                  │               │
  │                          │                  │               │
  │  (用户点击邮件中的链接)     │                  │               │
  │  ──────────────────────────────────────────▶  Supabase 交换 token
  │                          │                  │  设置 session cookie
  │                          │                  │  302 → /reset-password
  │                          │                  │               │
  │  /reset-password         │                  │               │
  │  ├─ 检查 session 存在     │                  │               │
  │  ├─ 输入新密码             │                  │               │
  │  ├─ supabase.auth        │                  │               │
  │  │  .updateUser({password})│                 │               │
  │  │  ──────────────────────────────────────▶  │               │
  │  │  ◀── 成功                                │               │
  │  └─ 显示"密码已重置，去登录" │                  │               │
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| 关闭邮箱确认后，任何人都可以用任意邮箱注册（包括不存在的邮箱） | 个人网站，恶意注册动机低。后续如需防护可加 reCAPTCHA 或重开确认 |
| `/register` 可能被机器人批量注册 | 短期可接受（个人网站流量低）；后续加 Cloudflare Turnstile 或 reCAPTCHA |
| `resetPasswordForEmail` redirectTo 指向 `/reset-password`，如果用户直接访问该 URL 会看到错误 | `/reset-password` 页面检测 session，无 session 时显示引导信息而非报错 |
| 密码修改 API 使用 service-role client 的 `admin.updateUser` 绕过 RLS | API 始终校验请求者的 session cookie 与目标 user_id 匹配；不暴露为通用用户管理端点 |

## Open Questions

- [x] 注册页面位置 — `/register`（独立路由，在 `/admin/*` 外）
- [x] 邮箱确认 — 关闭，注册即登录
- [x] 密码修改 API 是否需要验证旧密码 — 是，服务端验证
- [x] 重置密码后是否自动登录 — 否，提示用户去登录（简化流程，让用户确认新密码已生效）
- [ ] Supabase 关闭邮箱确认 — 需要手动在 Supabase Dashboard → Authentication → Settings 操作（不在代码变更范围内，记录在执行步骤中）
