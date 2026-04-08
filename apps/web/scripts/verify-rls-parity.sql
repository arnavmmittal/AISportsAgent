-- =========================================================
-- VERIFICATION: RLS Parity Check
-- =========================================================
-- Run this in BOTH staging and production to verify they match
--
-- Expected results after applying migration:
-- - All 46 tables should have RLS enabled
-- - 100+ policies should exist
-- =========================================================

-- 1. Tables with RLS disabled (should be EMPTY)
SELECT 'Tables WITHOUT RLS:' as check_name;
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false
ORDER BY tablename;

-- 2. Total policy count (should be 100+)
SELECT 'Total policy count:' as check_name;
SELECT COUNT(*) as total_policies FROM pg_policies WHERE schemaname = 'public';

-- 3. Tables with RLS enabled count
SELECT 'Tables WITH RLS:' as check_name;
SELECT COUNT(*) as tables_with_rls
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- 4. Policy breakdown by table (top tables)
SELECT 'Policies per table:' as check_name;
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC
LIMIT 20;

-- 5. Check critical tables have policies
SELECT 'Critical tables policy check:' as check_name;
SELECT
  t.tablename,
  CASE WHEN p.policy_count IS NULL THEN 0 ELSE p.policy_count END as policies,
  t.rowsecurity as rls_enabled
FROM pg_tables t
LEFT JOIN (
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'User', 'Athlete', 'Coach', 'ChatSession', 'Message',
    'MoodLog', 'Goal', 'PerformanceMetric', 'AlertRule',
    'GeneratedAlert', 'WearableConnection', 'CoachAthleteRelation'
  )
ORDER BY t.tablename;
