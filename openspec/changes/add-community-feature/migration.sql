-- ============================================================
-- 社区功能数据库迁移
-- ============================================================
-- 在 Supabase SQL Editor 中执行此脚本
-- 执行前请确认已备份数据
-- ============================================================

-- 1. 清空现有评论（硬切换：强制关联 user_id）
DELETE FROM comments;

-- 2. 为 comments 表添加 user_id 列（NOT NULL，关联 auth.users）
-- 先检查列是否已存在，避免重复执行报错
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE comments ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id);
  END IF;
END $$;

-- 3. 创建 likes 表（点赞）
CREATE TABLE IF NOT EXISTS likes (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  trip_id BIGINT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, trip_id)
);

-- 4. 创建 favorites 表（收藏）
CREATE TABLE IF NOT EXISTS favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  trip_id BIGINT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, trip_id)
);

-- 5. RLS 策略：likes 表
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 5a. 公开可读点赞数据
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Public can read likes'
    AND tablename = 'likes'
  ) THEN
    CREATE POLICY "Public can read likes" ON likes
      FOR SELECT USING (true);
  END IF;
END $$;

-- 5b. 用户只能创建自己的点赞
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can insert own likes'
    AND tablename = 'likes'
  ) THEN
    CREATE POLICY "Users can insert own likes" ON likes
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 5c. 用户只能删除自己的点赞
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can delete own likes'
    AND tablename = 'likes'
  ) THEN
    CREATE POLICY "Users can delete own likes" ON likes
      FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- 6. RLS 策略：favorites 表
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 6a. 公开可读收藏数据
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Public can read favorites'
    AND tablename = 'favorites'
  ) THEN
    CREATE POLICY "Public can read favorites" ON favorites
      FOR SELECT USING (true);
  END IF;
END $$;

-- 6b. 用户只能创建自己的收藏
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can insert own favorites'
    AND tablename = 'favorites'
  ) THEN
    CREATE POLICY "Users can insert own favorites" ON favorites
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 6c. 用户只能删除自己的收藏
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can delete own favorites'
    AND tablename = 'favorites'
  ) THEN
    CREATE POLICY "Users can delete own favorites" ON favorites
      FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- 7. 更新 comments 表的 RLS 策略
-- 注意：需要先删除旧的 INSERT 策略（如果有的话），再创建新的
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 7a. 公开可读已批准评论
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Public can read approved comments'
    AND tablename = 'comments'
  ) THEN
    CREATE POLICY "Public can read approved comments" ON comments
      FOR SELECT USING (is_approved = true);
  END IF;
END $$;

-- 7b. 注册用户可发表评论（user_id 必须等于 auth.uid()）
-- 先删除旧的 INSERT 策略
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON comments;
DROP POLICY IF EXISTS "Anyone can insert comments" ON comments;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Authenticated users can insert comments'
    AND tablename = 'comments'
  ) THEN
    CREATE POLICY "Authenticated users can insert comments" ON comments
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 7c. 用户可删除自己的评论，管理员可删除任意评论
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Users can delete own comments'
    AND tablename = 'comments'
  ) THEN
    CREATE POLICY "Users can delete own comments" ON comments
      FOR DELETE USING (
        user_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================
-- 执行完成后验证
-- ============================================================
-- SELECT table_name, table_type FROM information_schema.tables WHERE table_name IN ('likes', 'favorites');
-- SELECT * FROM pg_policies WHERE tablename IN ('likes', 'favorites', 'comments');
