-- ============================================================================
-- EPA Tool — 操作紀錄系統 Migration
-- 在 Supabase SQL Editor 中執行此腳本
-- ============================================================================

-- 1. 操作紀錄表
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  target_type TEXT,
  target_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 索引
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- 3. RLS：admin 可讀取所有紀錄，指導員只能讀自己的
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "使用者可讀取操作紀錄" ON activity_logs;
CREATE POLICY "使用者可讀取操作紀錄" ON activity_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "使用者可插入操作紀錄" ON activity_logs;
CREATE POLICY "使用者可插入操作紀錄" ON activity_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());
