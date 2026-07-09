# Delta for UI

## ADDED Requirements

### Requirement: 注册页面
The system SHALL provide a registration page at `/register` where any visitor can create an account with email, display name, and password. The form SHALL validate that passwords match before submission. On successful registration the user SHALL be automatically signed in and redirected to `/admin`.

#### Scenario: 成功注册
- GIVEN a visitor navigates to `/register`
- WHEN they fill in valid email, display name, password, and confirm password, then click「注册」
- THEN `signUp()` is called, the user is automatically logged in, and redirected to `/admin`

#### Scenario: 密码不匹配
- GIVEN a visitor fills in the registration form
- WHEN the two password fields differ
- THEN an inline validation error "两次输入的密码不一致" is shown, and the form does not submit

#### Scenario: 邮箱已被注册
- GIVEN a visitor fills in an already-registered email
- WHEN they submit the form
- THEN an error message "该邮箱已被注册" is displayed

#### Scenario: 已登录用户访问注册页
- GIVEN a user is already logged in
- WHEN they navigate to `/register`
- THEN they are redirected to `/admin`

---

### Requirement: 忘记密码页面
The system SHALL provide a forgot-password page at `/forgot-password` where a user can enter their email to receive a password reset link.

#### Scenario: 提交忘记密码请求
- GIVEN a user on `/forgot-password`
- WHEN they enter a registered email and submit
- THEN `resetPasswordForEmail()` is called, and a success message "密码重置邮件已发送，请查看邮箱" is displayed

#### Scenario: 未填写邮箱
- GIVEN a user on `/forgot-password`
- WHEN they submit with an empty email field
- THEN an inline validation error is shown

---

### Requirement: 密码重置页面
The system SHALL provide a password reset page at `/reset-password` where a user lands from a reset email link can set a new password.

#### Scenario: 从重置邮件进入并设置新密码
- GIVEN a user clicks the password reset link in their email and lands on `/reset-password` with a valid session
- WHEN they enter a new password and submit
- THEN `updateUser({ password })` is called, a success message "密码已重置" is displayed, and the user is prompted to navigate to login

#### Scenario: 直接访问重置页面（无 session）
- GIVEN a user directly navigates to `/reset-password` without coming from a reset email
- WHEN the page loads and no valid session is detected
- THEN a friendly message "链接已失效，请重新发起密码重置" is displayed with a link to `/forgot-password`

---

### Requirement: 设置页面
The system SHALL provide a settings page at `/admin/settings` accessible to authenticated users. The page SHALL include a password change form with current password, new password, and confirm new password fields.

#### Scenario: 成功修改密码
- GIVEN an authenticated user on `/admin/settings`
- WHEN they enter their correct current password, a valid new password, and matching confirmation, then click「修改密码」
- THEN `POST /api/auth/change-password` is called, and a success message "密码修改成功" is displayed

#### Scenario: 旧密码错误
- GIVEN an authenticated user on `/admin/settings`
- WHEN they enter an incorrect current password and submit
- THEN an error message "当前密码不正确" is displayed

#### Scenario: 新密码不匹配
- GIVEN an authenticated user on `/admin/settings`
- WHEN the new password and confirmation don't match
- THEN an inline validation error "两次输入的密码不一致" is shown, and the form does not submit

---

## MODIFIED Requirements

### Requirement: 登录页面
The system SHALL provide a login page at `/admin/login`. The login page SHALL include a link to `/register` for new users and a link to `/forgot-password` for password recovery.

(Previously: The login page only had email/password fields and a submit button.)

#### Scenario: 登录页面显示注册引导
- GIVEN a visitor is on `/admin/login`
- WHEN the page renders
- THEN a "还没有账号？立即注册" link pointing to `/register` is visible below the login form

#### Scenario: 登录页面显示忘记密码入口
- GIVEN a visitor is on `/admin/login`
- WHEN the page renders
- THEN a "忘记密码？" link pointing to `/forgot-password` is visible below the password field

---

### Requirement: 管理后台侧边栏导航
The admin layout sidebar SHALL include a「设置」navigation item linking to `/admin/settings`.

(Previously: The sidebar had「总览」「行程管理」「新建行程」「行程攻略」「画廊管理」. Now「设置」is added.)

#### Scenario: 侧边栏显示设置链接
- GIVEN an authenticated user views the admin sidebar
- WHEN the sidebar is rendered
- THEN a「设置」link pointing to `/admin/settings` is present in the navigation list
