# Delta for Architecture

## ADDED Requirements

### Requirement: 公开认证路由
The system SHALL serve three publicly accessible authentication routes: `/register` (sign-up), `/forgot-password` (password reset request), and `/reset-password` (set new password). These routes SHALL NOT be protected by the `/admin/*` authentication proxy.

#### Scenario: 访问注册页
- GIVEN an unauthenticated visitor
- WHEN they navigate to `/register`
- THEN the registration form is displayed without redirection

#### Scenario: 已登录用户访问注册页
- GIVEN an authenticated user
- WHEN they navigate to `/register`
- THEN the page detects the session and redirects to `/admin`

#### Scenario: 访问密码重置页无需登录
- GIVEN any visitor
- WHEN they navigate to `/forgot-password`
- THEN the form is displayed without authentication check

---

### Requirement: 密码修改 API
The system SHALL provide `POST /api/auth/change-password` that accepts `{ currentPassword: string, newPassword: string }`. The endpoint SHALL verify the current password before updating. The endpoint SHALL only process requests for the currently authenticated user.

#### Scenario: 成功修改密码
- GIVEN an authenticated user sends a valid `currentPassword` and a new `newPassword`
- WHEN the API processes the request
- THEN `supabase.auth.signInWithPassword(email, currentPassword)` verifies the old password, then `supabase.auth.admin.updateUser(userId, { password: newPassword })` updates it, and `{ success: true }` is returned with HTTP 200

#### Scenario: 旧密码错误
- GIVEN an authenticated user sends an incorrect `currentPassword`
- WHEN the API processes the request
- THEN HTTP 401 is returned with `{ error: "当前密码不正确" }`

#### Scenario: 未认证请求
- GIVEN an unauthenticated request to `/api/auth/change-password`
- WHEN the API processes the request
- THEN HTTP 401 is returned

---

## MODIFIED Requirements

### Requirement: Route Structure
All protected admin page routes SHALL be under `/admin/`. All API routes SHALL be under `src/app/api/`. The following routes are added:

| Route | Auth Required | Purpose |
|-------|:---:|---------|
| `/register` | No | User sign-up |
| `/forgot-password` | No | Password reset request |
| `/reset-password` | No | Set new password |
| `/admin/settings` | Yes | User settings (password change) |
| `/api/auth/change-password` | Yes | Password change API |

(Previously: Only `/admin/*` routes and `/api/auth/callback` existed. Now public auth routes are added alongside a new protected admin route and API endpoint.)
