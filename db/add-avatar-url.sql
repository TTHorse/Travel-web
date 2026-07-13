-- Migration: 用户头像支持
-- 在 Supabase Dashboard → SQL Editor 中执行此语句
-- 或通过 supabase CLI: supabase db push

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
