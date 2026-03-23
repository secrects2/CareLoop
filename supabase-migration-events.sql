-- ============================================================================
-- 活動簽到系統 — Supabase Migration
-- 建立 events（活動）和 event_checkins（簽到紀錄）表
-- ============================================================================

-- ─── events 活動表 ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- ─── event_checkins 簽到紀錄表 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    line_user_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    picture_url TEXT,
    checked_in_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, line_user_id)  -- 同一活動同一人只能報到一次
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;

-- events 政策：已登入使用者可讀，建立者可寫
CREATE POLICY "events_select" ON events FOR SELECT USING (true);
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "events_update" ON events FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "events_delete" ON events FOR DELETE USING (auth.uid() = created_by);

-- event_checkins 政策：任何人可插入（公開簽到），所有人可讀
CREATE POLICY "checkins_select" ON event_checkins FOR SELECT USING (true);
CREATE POLICY "checkins_insert" ON event_checkins FOR INSERT WITH CHECK (true);

-- ─── 索引 ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_event_checkins_event_id ON event_checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- 啟用 Realtime 推送 event_checkins 變更
ALTER PUBLICATION supabase_realtime ADD TABLE event_checkins;

-- ─── 說明 ─────────────────────────────────────────────────────────────────────
-- 1. events 表儲存活動基本資訊（標題、日期、時間、地點）
-- 2. event_checkins 表儲存簽到紀錄，透過 LINE LIFF 取得使用者資訊
-- 3. UNIQUE(event_id, line_user_id) 確保同一活動同一人只能報到一次
-- 4. Realtime 已啟用，前端可即時監聽簽到變更
