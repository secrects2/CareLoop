-- ============================================================================
-- 據點管理 Migration
-- 在 Supabase SQL Editor 中執行此腳本
-- ============================================================================

-- 1. 建立據點表
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 在 elders 表新增 location_id 欄位
ALTER TABLE elders ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- 3. 索引
CREATE INDEX IF NOT EXISTS idx_locations_instructor ON locations(instructor_id);
CREATE INDEX IF NOT EXISTS idx_elders_location ON elders(location_id);

-- 4. RLS 策略
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "指導員管理自己的據點" ON locations;
CREATE POLICY "指導員管理自己的據點" ON locations
  FOR ALL USING (instructor_id = auth.uid());
