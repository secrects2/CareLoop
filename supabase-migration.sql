-- ============================================================================
-- EPA Tool 数据库迁移脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================================

-- 1. 指导员表（profiles，由 Auth 触发自动创建）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '指导员',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  organization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 长辈表
CREATE TABLE IF NOT EXISTS elders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')),
  birth_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI 分析会话表
CREATE TABLE IF NOT EXISTS analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id UUID NOT NULL REFERENCES elders(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id),
  test_type TEXT NOT NULL CHECK (test_type IN ('pre', 'post', 'practice')),
  avg_elbow_rom REAL,
  avg_shoulder_rom REAL,
  avg_trunk_tilt REAL,
  avg_core_stability REAL,
  avg_shoulder_velocity REAL,
  avg_elbow_velocity REAL,
  avg_wrist_velocity REAL,
  tremor_detected BOOLEAN DEFAULT FALSE,
  tremor_severity TEXT,
  compensation_detected BOOLEAN DEFAULT FALSE,
  compensation_type TEXT,
  posture_status TEXT,
  duration_seconds INTEGER,
  raw_metrics JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 投球标记表
CREATE TABLE IF NOT EXISTS throw_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  mark_index INTEGER NOT NULL,
  elbow_rom REAL,
  shoulder_rom REAL,
  trunk_tilt REAL,
  core_stability REAL,
  shoulder_velocity REAL,
  elbow_velocity REAL,
  wrist_velocity REAL,
  timestamp_ms INTEGER,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 索引
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_elders_instructor ON elders(instructor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_elder ON analysis_sessions(elder_id);
CREATE INDEX IF NOT EXISTS idx_sessions_instructor ON analysis_sessions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_throw_marks_session ON throw_marks(session_id);

-- ============================================================================
-- RLS 策略
-- ============================================================================

-- profiles: 用户只能读写自己的 profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用户可读取自己的profile" ON profiles;
CREATE POLICY "用户可读取自己的profile" ON profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "用户可更新自己的profile" ON profiles;
CREATE POLICY "用户可更新自己的profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "用户可插入自己的profile" ON profiles;
CREATE POLICY "用户可插入自己的profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- elders: 指导员只能访问自己的长辈
ALTER TABLE elders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "指导员管理自己的长辈" ON elders;
CREATE POLICY "指导员管理自己的长辈" ON elders
  FOR ALL USING (instructor_id = auth.uid());

-- analysis_sessions: 指导员只能访问自己的分析会话
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "指导员管理自己的分析会话" ON analysis_sessions;
CREATE POLICY "指导员管理自己的分析会话" ON analysis_sessions
  FOR ALL USING (instructor_id = auth.uid());

-- throw_marks: 指导员只能访问自己会话的投球标记
ALTER TABLE throw_marks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "指导员访问自己的投球标记" ON throw_marks;
CREATE POLICY "指导员访问自己的投球标记" ON throw_marks
  FOR ALL USING (
    session_id IN (
      SELECT id FROM analysis_sessions WHERE instructor_id = auth.uid()
    )
  );

-- ============================================================================
-- 自动更新 updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_elders_updated_at ON elders;
CREATE TRIGGER update_elders_updated_at
    BEFORE UPDATE ON elders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
