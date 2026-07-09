# Tasks

## 1. Supabase 配置

- [ ] 1.1 ⚠️ 手动操作：在 Supabase Dashboard → Authentication → Settings 关闭「Confirm email」

## 2. 注册页面

- [x] 2.1 创建 `src/app/register/page.tsx` — 注册表单（email + display_name + password + confirm password）
- [x] 2.2 已登录用户访问 `/register` 时自动重定向到 `/admin`

## 3. 忘记密码 & 密码重置

- [x] 3.1 创建 `src/app/forgot-password/page.tsx` — 输入邮箱，调用 `resetPasswordForEmail`，显示成功提示
- [x] 3.2 创建 `src/app/reset-password/page.tsx` — 检测 session，输入新密码，调用 `updateUser`，显示结果

## 4. 密码修改（已登录）

- [x] 4.1 创建 `src/app/api/auth/change-password/route.ts` — 验证旧密码 + 更新新密码
- [x] 4.2 创建 `src/app/admin/settings/page.tsx` — 设置页面（当前密码 + 新密码 + 确认新密码）

## 5. UI 整合

- [x] 5.1 修改 `src/app/admin/login/page.tsx` — 表单下方添加「还没有账号？立即注册」链接和「忘记密码？」链接
- [x] 5.2 修改 `src/app/admin/layout.tsx` — 侧边栏导航添加「设置」入口（`Settings` icon from lucide-react）

## 6. 验证

- [x] 6.1 Run `npx tsc --noEmit` — 0 errors
- [x] 6.2 Run `npm run build` — all pages compile
- [ ] 6.3 手动测试注册流程：访问 `/register` → 注册 → 自动跳转 `/admin`
- [ ] 6.4 手动测试忘记密码流程：`/admin/login` → `/forgot-password` → 收邮件 → 重置密码
- [ ] 6.5 手动测试密码修改：`/admin/settings` → 修改密码 → 退出 → 用新密码登录
- [ ] 6.6 手动测试已登录用户访问 `/register` 自动重定向
