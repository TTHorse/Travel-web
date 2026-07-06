-- Migration: Create ai_guides table for AI-generated travel guides
-- Run this in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/<your-project>/sql/new

CREATE TABLE IF NOT EXISTS ai_guides (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  destination   TEXT NOT NULL,
  adcode        TEXT DEFAULT '',
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  budget        INTEGER NOT NULL DEFAULT 0,
  traveler_count TEXT NOT NULL DEFAULT '',
  keywords      TEXT[] DEFAULT '{}',
  content       TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_guides ENABLE ROW LEVEL SECURITY;

-- Anyone can read published guides
CREATE POLICY "Published guides are viewable by everyone"
  ON ai_guides FOR SELECT
  USING (status = 'published');

-- Only authenticated users (admin) can create/update/delete
CREATE POLICY "Authenticated users can create guides"
  ON ai_guides FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update guides"
  ON ai_guides FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete guides"
  ON ai_guides FOR DELETE
  TO authenticated
  USING (true);
