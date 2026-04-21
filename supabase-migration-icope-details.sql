-- ============================================================================
-- ICOPE 初評細項欄位擴充 — Migration Script
-- 為 primary_assessments 新增 JSONB 欄位存放各面向的逐題回答
-- 在 Supabase SQL Editor 中執行此腳本
-- ============================================================================

-- 認知功能細項：memory_repeat, orientation_date, orientation_place, memory_recall
ALTER TABLE primary_assessments
  ADD COLUMN IF NOT EXISTS cognition_details JSONB DEFAULT '{}';

-- 行動功能細項：chair_stand_seconds, completed
ALTER TABLE primary_assessments
  ADD COLUMN IF NOT EXISTS mobility_details JSONB DEFAULT '{}';

-- 營養不良細項：weight_loss, appetite_loss
ALTER TABLE primary_assessments
  ADD COLUMN IF NOT EXISTS nutrition_details JSONB DEFAULT '{}';

-- 視力障礙細項：difficulty_reported, who_far_pass, who_near_pass, high_risk_eye
ALTER TABLE primary_assessments
  ADD COLUMN IF NOT EXISTS vision_details JSONB DEFAULT '{}';

-- 聽力障礙細項：group1_pass, group2_pass
ALTER TABLE primary_assessments
  ADD COLUMN IF NOT EXISTS hearing_details JSONB DEFAULT '{}';

-- 憂鬱細項：feeling_hopeless, reduced_interest
ALTER TABLE primary_assessments
  ADD COLUMN IF NOT EXISTS depression_details JSONB DEFAULT '{}';

-- 欄位註解
COMMENT ON COLUMN primary_assessments.cognition_details IS '認知功能細項回答 (JSONB)';
COMMENT ON COLUMN primary_assessments.mobility_details IS '行動功能細項回答 (JSONB)';
COMMENT ON COLUMN primary_assessments.nutrition_details IS '營養不良細項回答 (JSONB)';
COMMENT ON COLUMN primary_assessments.vision_details IS '視力障礙細項回答 (JSONB)';
COMMENT ON COLUMN primary_assessments.hearing_details IS '聽力障礙細項回答 (JSONB)';
COMMENT ON COLUMN primary_assessments.depression_details IS '憂鬱細項回答 (JSONB)';
