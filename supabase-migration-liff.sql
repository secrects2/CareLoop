-- ============================================================================
-- LINE LIFF 整合 — Supabase Migration
-- 在 profiles 表新增 line_user_id 欄位
-- ============================================================================

-- 新增 line_user_id 欄位（UNIQUE，允許 NULL）
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS line_user_id TEXT UNIQUE;

-- 建立索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_profiles_line_user_id
ON profiles (line_user_id)
WHERE line_user_id IS NOT NULL;

-- 說明：
-- 1. 指導員從 LINE App 開啟系統時，會自動綁定 LINE User ID
-- 2. 推播通知 API 會查詢此欄位，找到對應的指導員 LINE ID 來發送通知
-- 3. 一個 LINE 帳號只能綁定一個系統帳號（UNIQUE 約束）
