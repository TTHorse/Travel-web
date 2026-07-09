# Delta for Data

## MODIFIED Requirements

### Requirement: Supabase Auth Configuration
The Supabase project SHALL have email confirmation disabled (`Confirm email = false` in Authentication → Settings). This ensures `signUp()` returns a session immediately without requiring email verification.

(Previously: Email confirmation was enabled — the auth callback route handles `exchangeCodeForSession`, but it was designed for a manual-account-creation flow without public sign-up.)

#### Scenario: 注册即登录
- GIVEN Supabase has email confirmation disabled
- WHEN a user completes the registration form on `/register`
- THEN `supabase.auth.signUp()` returns a session immediately, and the user is logged in

#### Scenario: 无需邮箱验证的注册流程
- GIVEN email confirmation is disabled
- WHEN `signUp()` is called
- THEN no confirmation email is sent, and no callback to `/api/auth/callback` is needed for this flow

---

### Requirement: Profiles 数据访问层扩展
The `src/lib/data/profiles.ts` module SHALL continue to handle auto-creation of profile rows on first access via `getCurrentProfile()`. No schema changes are needed — the existing `profiles` table with `user_id`, `role`, and `display_name` columns is sufficient. Registration stores `display_name` via Supabase Auth's `user_metadata`, and the auto-creation path reads `user.email` as fallback.

(Previously: Profile auto-creation already existed. No functional change, but the path is now triggered from `/register` sign-up in addition to the prior manual-account flow.)

#### Scenario: 新注册用户自动获得 profile
- GIVEN a user completes registration via `/register`
- WHEN they are redirected to `/admin`
- THEN `getCurrentProfile()` finds no existing profile and creates one with `role='user'` and `display_name` from user metadata or email
