-- ============================================================================
-- EPA Tool — 用印申請系統 Migration
-- 在 Supabase SQL Editor 中執行此腳本
-- ============================================================================

-- 1. 用印申請表
CREATE TABLE IF NOT EXISTS seal_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department TEXT NOT NULL,                          -- 借印部門
  applicant_name TEXT NOT NULL,                      -- 借印人
  borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,    -- 借印日期
  seal_type TEXT NOT NULL,                           -- 印章類型
  purpose TEXT NOT NULL,                             -- 用印事宜
  file_urls TEXT[] DEFAULT '{}',                     -- 用印文件 URL 陣列
  return_date DATE NOT NULL,                         -- 歸還日期
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'returned')),
  reviewer_id UUID REFERENCES profiles(id),          -- 簽核主管
  reviewer_comment TEXT,                             -- 審核意見
  reviewed_at TIMESTAMPTZ,                           -- 審核時間
  returned_at TIMESTAMPTZ,                           -- 實際歸還時間
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 索引
CREATE INDEX IF NOT EXISTS idx_seal_applications_applicant ON seal_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_seal_applications_status ON seal_applications(status);
CREATE INDEX IF NOT EXISTS idx_seal_applications_created ON seal_applications(created_at DESC);

-- 3. RLS
ALTER TABLE seal_applications ENABLE ROW LEVEL SECURITY;

-- 使用者可讀取自己的申請；super_admin 和 sub_admin 可讀取所有（數據管理）
DROP POLICY IF EXISTS "用印申請讀取" ON seal_applications;
CREATE POLICY "用印申請讀取" ON seal_applications
  FOR SELECT USING (
    applicant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'sub_admin'))
  );

-- 使用者可新增自己的申請
DROP POLICY IF EXISTS "用印申請新增" ON seal_applications;
CREATE POLICY "用印申請新增" ON seal_applications
  FOR INSERT WITH CHECK (applicant_id = auth.uid());

-- 使用者可更新自己的草稿；super_admin 可更新所有（審核）
DROP POLICY IF EXISTS "用印申請更新" ON seal_applications;
CREATE POLICY "用印申請更新" ON seal_applications
  FOR UPDATE USING (
    (applicant_id = auth.uid() AND status = 'draft')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- 使用者可刪除自己的草稿
DROP POLICY IF EXISTS "用印申請刪除" ON seal_applications;
CREATE POLICY "用印申請刪除" ON seal_applications
  FOR DELETE USING (
    applicant_id = auth.uid() AND status = 'draft'
  );

-- 4. 自動更新 updated_at
DROP TRIGGER IF EXISTS update_seal_applications_updated_at ON seal_applications;
CREATE TRIGGER update_seal_applications_updated_at
    BEFORE UPDATE ON seal_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Storage bucket（在 Supabase Dashboard 手動建立或用以下語句）
-- INSERT INTO storage.buckets (id, name, public) VALUES ('seal-files', 'seal-files', false);
