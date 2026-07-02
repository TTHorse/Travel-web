-- ============================================================
-- Travel-web Supabase 数据库初始化脚本
-- 使用方法：复制到 Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. 行程表
CREATE TABLE IF NOT EXISTS trips (
  id           BIGSERIAL PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  destination  TEXT NOT NULL,
  country      TEXT NOT NULL,
  cover_image  TEXT,
  description  TEXT,
  content      TEXT,
  start_date   DATE,
  end_date     DATE,
  tags         TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 2. 照片表
CREATE TABLE IF NOT EXISTS photos (
  id            BIGSERIAL PRIMARY KEY,
  trip_id       BIGINT REFERENCES trips(id) ON DELETE CASCADE,
  cloudinary_id TEXT NOT NULL,
  url           TEXT NOT NULL,
  thumbnail_url TEXT,
  caption       TEXT,
  width         INTEGER NOT NULL DEFAULT 0,
  height        INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER DEFAULT 0,
  taken_at      TIMESTAMPTZ
);

-- 3. 评论表
CREATE TABLE IF NOT EXISTS comments (
  id          BIGSERIAL PRIMARY KEY,
  trip_id     BIGINT REFERENCES trips(id) ON DELETE CASCADE,
  parent_id   BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content     TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. 地图标记点表
CREATE TABLE IF NOT EXISTS map_points (
  id         BIGSERIAL PRIMARY KEY,
  trip_id    BIGINT REFERENCES trips(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  latitude   DOUBLE PRECISION NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  type       TEXT CHECK (type IN ('visited', 'highlight', 'wishlist')) DEFAULT 'visited',
  sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- RLS 策略
-- ============================================================

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_points ENABLE ROW LEVEL SECURITY;

-- trips: 公开读，认证用户写
CREATE POLICY "trips_select" ON trips FOR SELECT USING (true);
CREATE POLICY "trips_insert" ON trips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "trips_update" ON trips FOR UPDATE TO authenticated USING (true);
CREATE POLICY "trips_delete" ON trips FOR DELETE TO authenticated USING (true);

-- photos: 公开读，认证用户写
CREATE POLICY "photos_select" ON photos FOR SELECT USING (true);
CREATE POLICY "photos_insert" ON photos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "photos_update" ON photos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "photos_delete" ON photos FOR DELETE TO authenticated USING (true);

-- comments: 公开读，任何人可写
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (true);

-- map_points: 公开读，认证用户写
CREATE POLICY "map_points_select" ON map_points FOR SELECT USING (true);
CREATE POLICY "map_points_insert" ON map_points FOR INSERT TO authenticated WITH CHECK (true);
