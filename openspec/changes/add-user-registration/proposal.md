# Proposal: 用户注册与密码管理

## Intent

当前系统已完成用户身份绑定（`2026-07-08-bind-user-identity`），拥有完整的多用户隔离能力（`user_id` 所有权、`profiles` 表角色系统、RLS 策略），但用户只能通过 Supabase 控制台手动创建。这阻碍了真正的多用户使用：潜在用户无法自行注册，已登录用户无法修改密码或重置遗忘的密码。本次变更补全用户自助注册、密码修改、密码重置三条核心用户管理链路。

## Scope

**包含：**
- `/register` — 开放注册页面（email + 显示名称 + 密码），注册即登录
- `/forgot-password` — 忘记密码页面，发送密码重置邮件
- `/reset-password` — 密码重置页面（接收来自重置邮件的 session）
- `/admin/settings` — 已登录用户的设置页面，包含登录后修改密码功能
- `POST /api/auth/change-password` — 密码修改 API（服务端验证旧密码）
- `/admin/login` 增加注册引导和忘记密码入口
- `/admin/layout` 侧边栏增加「设置」入口
- Supabase Auth 设置：关闭邮箱确认（注册即登录）

**不包含：**
- 邮箱验证流程（与"注册即登录"互斥，本次明确关闭）
- 手机号注册/登录
- OAuth 第三方登录（Google、GitHub 等）
- 用户资料编辑（修改显示名称、头像等 — 留待后续）
- 管理员用户管理界面（创建/禁用/删除用户）

## Approach

基于 Supabase Auth 内置能力实现——注册使用 `signUp()`、密码重置使用 `resetPasswordForEmail()`、密码修改使用 `updateUser({ password })`（API 层前置旧密码验证）。所有新页面为 Client Component（表单交互），密码修改 API 在服务端验证身份确保安全性。三个公开页面（`/register`、`/forgot-password`、`/reset-password`）位于 `/admin/*` 外，不受 proxy 认证保护。

## Capabilities

### Modified Capabilities
- `ui`: `/admin/login` 页面增加注册引导和忘记密码入口；`/admin/layout` 侧边栏增加设置入口
- `architecture`: 新增 3 条公开路由 + 1 条受保护路由 + 1 个 API 端点

### New Capabilities
- `user-auth`: 用户自助注册、密码修改、密码重置流程
