-- ============================================================================
-- CareLoop — 角色權限管理系統 (RBAC) Migration
-- 四級角色：super_admin / sub_admin / instructor / employee
-- 在 Supabase SQL Editor 中執行此腳本
-- ============================================================================

-- 1. 擴充 role 欄位支援四種角色
--    將現有 admin → super_admin，保留 instructor 不變
-- ============================================================================

-- 先將現有 admin 改為 super_admin（在修改約束前）
UPDATE profiles SET role = 'super_admin' WHERE role = 'admin';

-- 移除舊的 CHECK 約束，加入新的四級角色
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('super_admin', 'sub_admin', 'instructor', 'employee'));

-- 2. 更新 RLS 策略
-- ============================================================================

-- 僅 super_admin 可讀取所有 profiles（sub_admin 和 instructor 只能讀自己的）
DROP POLICY IF EXISTS "使用者可讀取 profile" ON profiles;
CREATE POLICY "使用者可讀取 profile" ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- 僅 super_admin 可更新所有 profiles（停用/啟用帳號、角色管理）
DROP POLICY IF EXISTS "使用者可更新 profile" ON profiles;
CREATE POLICY "使用者可更新 profile" ON profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- 保留原有的插入策略
DROP POLICY IF EXISTS "使用者可插入 profile" ON profiles;
CREATE POLICY "使用者可插入 profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================================
-- 3. 設定最高管理員
-- ============================================================================
UPDATE profiles SET role = 'super_admin' WHERE email = 'secrects2@gmail.com';
