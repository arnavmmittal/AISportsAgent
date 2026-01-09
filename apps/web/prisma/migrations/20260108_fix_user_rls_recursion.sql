DROP POLICY IF EXISTS "Users can view profiles (no passwords)" ON "User";
DROP POLICY IF EXISTS "Users can view own profile" ON "User";
DROP POLICY IF EXISTS "Users can view profiles" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Users can view same school" ON "User";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "User";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "User";
DROP POLICY IF EXISTS "Enable update for users based on id" ON "User";

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_select_own" ON "User"
  FOR SELECT
  USING (id = auth.uid()::text);

CREATE POLICY "user_update_own" ON "User"
  FOR UPDATE
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

CREATE POLICY "user_select_all" ON "User"
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can view knowledge base for their school" ON "KnowledgeBase";
CREATE POLICY "kb_select_authenticated" ON "KnowledgeBase"
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view team config for their school" ON "TeamConfig";
CREATE POLICY "teamconfig_select_authenticated" ON "TeamConfig"
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Coaches can manage team config" ON "TeamConfig";
CREATE POLICY "teamconfig_manage_authenticated" ON "TeamConfig"
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
