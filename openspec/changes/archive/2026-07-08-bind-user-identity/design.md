# Design: 用户身份绑定

## Context

当前架构：Supabase Auth 提供邮箱/密码登录，`src/lib/supabase/middleware.ts` 导出 `updateSession()` 但未被根级中间件启用（无 `src/proxy.ts` 调用）。管理后台页面各自内联 `supabase.auth.getUser()` 检查登录状态。

核心问题：所有数据表无 `user_id` 列，RLS 策略为 `USING (true)`，任何认证用户可操作任何行。API 路由检查认证但不存储或验证 `user_id`。

## Goals / Non-Goals

**Goals:**
- 每个用户只能查看/编辑/删除自己创建的 trip、ai_guide、photo、map_point
- 管理员（profiles.role = 'admin'）可查看/编辑/删除所有用户的全部内容
- RLS 在数据库层强制执行所有权隔离
- API 层做双重验证（防御性编程）
- 管理后台 UI 根据角色差异化渲染

**Non-Goals:**
- 用户注册功能
- 用户管理界面
- 评论作者绑定（评论保持公开、匿名可写，不属于行程所有者）

## Decisions

### Decision 1: `profiles` 表存储角色

**选择**：新建 `profiles(user_id UUID PK → auth.users, role TEXT DEFAULT 'user', display_name TEXT, ...)`。RLS 策略通过子查询 `EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')` 判断管理员。

**理由**：与 Supabase Auth 解耦，角色数据在应用层可查询、可迁移。无需 Supabase 的 custom claims hook（需额外配置，更改后需等待 token 刷新）。

**备选**：Supabase custom claims (JWT hook) — 拒绝，因为需要修改 `supabase/config.toml` 或 Supabase Dashboard 钩子设置，且更改不会立即生效（需 token 刷新），调试体验差。

### Decision 2: RLS 管理员子查询 vs 应用层检查

**选择**：两者兼用。

- **RLS 层**：每个写策略（INSERT/UPDATE/DELETE）的 USING 条件为 `user_id = auth.uid() OR EXISTS (admin 子查询)`。SELECT 策略允许公开读已发布内容，管理员可读全部。
- **API 层**：POST 存储 `user_id`，PUT/DELETE 在操作前检查 `trip.user_id === user.id || profile.role === 'admin'`，作为防御层。

**理由**：RLS 是最终防线（即使 API 代码有 bug 也不会泄露数据），API 检查提供更友好的错误消息和审计日志。

### Decision 3: 管理员 UI — 标签页切换

**选择**：管理后台行程列表页顶部增加「所有行程」「我的行程」标签页，管理员默认显示「所有行程」。普通用户不显示标签页，直接显示自己的行程。

数据流：
- **管理员「所有行程」**：Server Component 使用 `createServiceSupabase()` 查询全表（绕过 RLS），或通过 RLS 管理员子查询透传。
- **管理员「我的行程」**：按 `user_id = currentUserId` 查询。
- **普通用户**：按 `user_id = currentUserId` 查询，RLS 强制执行。

**理由**：管理员需要全局视图管理内容，普通用户不需要切换。使用 `createServiceSupabase()` 避免管理员查询受 RLS 限于 `user_id` 匹配的问题（因为管理员子查询的 SELECT 策略虽然允许读全表，但用 service_role 更直接）。

### Decision 4: photos / map_points 通过 trip 级联

**选择**：不在 `photos`、`map_points` 表冗余存储 `user_id`。所有权通过 `trip_id → trip.user_id` 级联。RLS 策略在 USING 条件中 JOIN trips 表检查所有权。

```sql
-- photos INSERT: 只允许向自己拥有的 trip 添加照片
CREATE POLICY "photos_insert" ON photos FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trips 
    WHERE trips.id = photos.trip_id 
    AND (trips.user_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
  )
);
```

**理由**：避免冗余数据和不一致。photo/map_point 的生命周期始终跟随 trip。

### Decision 5: 数据迁移 — 现有数据回填

**选择**：迁移 SQL 中包含回填步骤，将所有现有行的 `user_id` 设置为当前唯一管理员账户。

```sql
-- 假定已有管理员用户
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users LIMIT 1;
  UPDATE trips SET user_id = admin_id WHERE user_id IS NULL;
  UPDATE ai_guides SET user_id = admin_id WHERE user_id IS NULL;
END $$;
```

**理由**：避免数据孤岛。如果现有数据属于同一个管理员，回填是最简单的处理方式。

### Decision 6: 中间件启用

**选择**：创建 `src/proxy.ts`（Next.js 16 约定），在其中调用 `updateSession` 处理所有 `/admin` 路由的认证逻辑。

**理由**：当前 `src/lib/supabase/middleware.ts` 中的 `updateSession` 未被任何文件导入。Next.js 16 使用 `proxy.ts` 而非 `middleware.ts` 作为中间件入口。同时补充 `/admin/guide/*` 路由的认证保护（当前缺失）。

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| 管理员子查询在每个 RLS 检查中执行 | 个人网站流量，每次查询 < 1ms 开销，可忽略 |
| 现有数据迁移错误可能造成数据丢失 | 迁移前备份；先在 Supabase Dashboard 执行 SELECT 验证回填范围 |
| `createServiceSupabase()` 绕过 RLS — 管理员 API 可能误操作 | 仅在 Server Component 和 API Route 的服务端使用，不暴露到浏览器 |
| profiles 表为空时所有用户无角色 → RLS 退化为仅限所有者 | 初始化脚本插入 admin 行；登录后自动为无 profile 的用户创建默认 `role='user'` 行 |

## Open Questions

- [x] 管理员账户如何标记 — 手动在 `profiles` 表 INSERT admin 行
- [x] RLS 管理员检查位置 — 每个策略的子查询，API 层双重验证
- [x] 中间件是否修复 — 是，创建 `src/proxy.ts` 并补充 `/admin/guide` 认证
- [ ] profile 自动创建时机 — 登录后首次访问时触发，还是 API 调用时兜底？
