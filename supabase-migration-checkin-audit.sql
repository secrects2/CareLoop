-- ============================================================================
-- 簽到稽核欄位 — Supabase Migration
-- 新增 checkin_method 和 device_info 欄位至 event_checkins
-- ============================================================================

-- checkin_method: 簽到方式 (line=LINE本人掃碼, qr_proxy=工作人員代掃, offline=離線簽到)
ALTER TABLE event_checkins ADD COLUMN IF NOT EXISTS checkin_method TEXT DEFAULT 'line';

-- device_info: 前端裝置的 User-Agent 資訊
ALTER TABLE event_checkins ADD COLUMN IF NOT EXISTS device_info TEXT;
