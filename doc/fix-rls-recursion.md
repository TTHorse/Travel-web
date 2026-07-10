# 修复 RLS 递归错误

## 问题

创建行程时 API 报错：

```
数据库错误: infinite recursion detected in policy for relation "profiles"
```

## 原因

`POST /api/trips` → `isAdmin()` → `getCurrentProfile()` → 查询 `profiles` 表。

`profiles` 表上的 RLS SELECT 策略通常会写：

```sql
-- ❌ 这条策略导致无限递归
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

**递归链路**：Supabase 评估策略 → 查询 `profiles` 检查是否 admin → 触发自身 RLS 策略 → 再查 `profiles` → 又触发策略 → ∞

## 修复

在 Supabase SQL Editor 中执行以下 SQL：

```sql
-- 1. 查看现有 profiles 策略（定位问题策略）
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';

-- 2. 删除导致递归的策略
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admin read" ON profiles;

-- 3. 将 profiles 的 SELECT 设为公开可读（安全，无敏感字段）
DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
CREATE POLICY "Public can read profiles" ON profiles
  FOR SELECT USING (true);

-- 4. 确保 RLS 已开启
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## 安全性说明

`profiles` 表只有以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | UUID | Supabase Auth 用户 ID |
| `role` | text | `'user'` 或 `'admin'` |
| `display_name` | text | 显示名称 |
| `created_at` | timestamptz | 创建时间 |
| `updated_at` | timestamptz | 更新时间 |

**无敏感数据**：没有邮箱、密码、手机号等 PII 信息。

**社区功能需要公开显示作者名字**，`SELECT USING (true)` 是合理且必要的。

**写操作**（INSERT/UPDATE/DELETE）另有独立策略保护，不受此变更影响：

```sql
-- 示例：已有的写保护策略
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

## 验证

修复后执行：

1. 重新创建行程 — 不再报递归错误
2. 确保现有鉴权逻辑正常：`isAdmin()` 仍正确判断管理员身份
3. 确保 RLS 写保护生效：非 admin 用户无法修改他人 profile
