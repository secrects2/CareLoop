CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS "使用者可讀取 profile" ON profiles;
CREATE POLICY "使用者可讀取 profile" ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR get_current_user_role() IN ('super_admin', 'sub_admin')
  );

DROP POLICY IF EXISTS "使用者可更新 profile" ON profiles;
CREATE POLICY "使用者可更新 profile" ON profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR get_current_user_role() IN ('super_admin', 'sub_admin')
  );
