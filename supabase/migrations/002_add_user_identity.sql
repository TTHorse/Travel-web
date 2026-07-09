-- ============================================================
-- 002: 用户身份绑定
-- 新增 user_id 列、profiles 表、回填现有数据
-- 使用方法：复制到 Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. trips 表新增 user_id 列（允许 NULL，回填后改 NOT NULL）
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. ai_guides 表新增 user_id 列
ALTER TABLE ai_guides
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. 创建 profiles 表
CREATE TABLE IF NOT EXISTS profiles (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  display_name TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. 现有数据回填 — 将现有 trips 和 ai_guides 归属到第一个管理员账户
--    如果已有 auth.users，将第一条记录的 id 作为所有者
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- 查找第一个用户（假定的管理员）
  SELECT id INTO admin_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF admin_id IS NOT NULL THEN
    -- 回填 trips
    UPDATE trips SET user_id = admin_id WHERE user_id IS NULL;

    -- 回填 ai_guides
    UPDATE ai_guides SET user_id = admin_id WHERE user_id IS NULL;

    -- 为现有用户创建 profiles 行（缺失则插入）
    INSERT INTO profiles (user_id, role, display_name)
    SELECT id, 'user', email
    FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM profiles);

    -- 第一个用户设为 admin
    UPDATE profiles SET role = 'admin' WHERE user_id = admin_id;
  END IF;
END $$;

-- 5. profiles 表启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- profiles SELECT: 自己可以读自己，admin 可以读全部
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- profiles INSERT: 仅 admin 可以创建
CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- profiles UPDATE: 仅 admin 可以更新
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 6. 重写 RLS 策略 — trips
-- ============================================================

-- 先删除旧策略
DROP POLICY IF EXISTS "trips_select" ON trips;
DROP POLICY IF EXISTS "trips_insert" ON trips;
DROP POLICY IF EXISTS "trips_update" ON trips;
DROP POLICY IF EXISTS "trips_delete" ON trips;

-- 辅助：方便复用的管理员检查表达式
-- EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')

-- SELECT: 公开可读已发布 OR 所有者 OR admin
CREATE POLICY "trips_select" ON trips
  FOR SELECT USING (
    is_published = true
    OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- INSERT: 必须设置 user_id = auth.uid()，普通用户和 admin 都需要
CREATE POLICY "trips_insert" ON trips
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- UPDATE: 所有者 OR admin
CREATE POLICY "trips_update" ON trips
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- DELETE: 所有者 OR admin
CREATE POLICY "trips_delete" ON trips
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 7. 重写 RLS 策略 — photos（通过 trip 级联）
-- ============================================================

DROP POLICY IF EXISTS "photos_select" ON photos;
DROP POLICY IF EXISTS "photos_insert" ON photos;
DROP POLICY IF EXISTS "photos_update" ON photos;
DROP POLICY IF EXISTS "photos_delete" ON photos;

-- SELECT: 公开可读（trip 已发布）OR 所有者 OR admin
CREATE POLICY "photos_select" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips WHERE trips.id = photos.trip_id AND trips.is_published = true
    )
    OR EXISTS (
      SELECT 1 FROM trips WHERE trips.id = photos.trip_id AND trips.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- INSERT: trip 所有者 OR admin
CREATE POLICY "photos_insert" ON photos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = photos.trip_id
      AND (trips.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
    )
  );

-- UPDATE: trip 所有者 OR admin
CREATE POLICY "photos_update" ON photos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = photos.trip_id
      AND (trips.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
    )
  );

-- DELETE: trip 所有者 OR admin
CREATE POLICY "photos_delete" ON photos
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = photos.trip_id
      AND (trips.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
    )
  );

-- ============================================================
-- 8. 重写 RLS 策略 — map_points（与 photos 相同级联模式）
-- ============================================================

DROP POLICY IF EXISTS "map_points_select" ON map_points;
DROP POLICY IF EXISTS "map_points_insert" ON map_points;

-- SELECT: trip 已发布 OR trip 所有者 OR admin
CREATE POLICY "map_points_select" ON map_points
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips WHERE trips.id = map_points.trip_id AND trips.is_published = true
    )
    OR EXISTS (
      SELECT 1 FROM trips WHERE trips.id = map_points.trip_id AND trips.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- INSERT: trip 所有者 OR admin
CREATE POLICY "map_points_insert" ON map_points
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = map_points.trip_id
      AND (trips.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
    )
  );

-- ============================================================
-- 9. 重写 RLS 策略 — ai_guides
-- ============================================================

-- 当前 ai_guides 的策略（来自 001_create_ai_guides.sql，如果存在则删除）
DROP POLICY IF EXISTS "Anyone can read published guides" ON ai_guides;
DROP POLICY IF EXISTS "Authenticated users can create guides" ON ai_guides;
DROP POLICY IF EXISTS "Authenticated users can update guides" ON ai_guides;
DROP POLICY IF EXISTS "Authenticated users can delete guides" ON ai_guides;

-- SELECT: 所有者 OR admin（ai_guides 不公开展示，仅管理后台可见）
CREATE POLICY "ai_guides_select" ON ai_guides
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- INSERT: user_id = auth.uid()
CREATE POLICY "ai_guides_insert" ON ai_guides
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- UPDATE: 所有者 OR admin
CREATE POLICY "ai_guides_update" ON ai_guides
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- DELETE: 所有者 OR admin
CREATE POLICY "ai_guides_delete" ON ai_guides
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );
