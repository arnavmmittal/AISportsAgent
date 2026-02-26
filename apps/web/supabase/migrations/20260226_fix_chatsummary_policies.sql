-- Fix ChatSummary RLS Policies
-- Date: 2026-02-26
-- Issue: Security audit shows 0 policies on ChatSummary table

-- Ensure RLS is enabled (idempotent)
ALTER TABLE "ChatSummary" ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts (safe - we're recreating)
DROP POLICY IF EXISTS "Athletes can view own chat summaries" ON "ChatSummary";
DROP POLICY IF EXISTS "Coaches can view chat summaries with consent" ON "ChatSummary";
DROP POLICY IF EXISTS "Service role full access to ChatSummary" ON "ChatSummary";

-- Policy 1: Athletes can view their own summaries
CREATE POLICY "Athletes can view own chat summaries" ON "ChatSummary"
  FOR SELECT USING ("athleteId" = auth.uid()::text);

-- Policy 2: Coaches can view summaries when athlete has consented
CREATE POLICY "Coaches can view chat summaries with consent" ON "ChatSummary"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "ChatSummary"."athleteId"
        AND "consentChatSummaries" = true
    )
    OR
    EXISTS (
      SELECT 1 FROM "Athlete"
      WHERE "Athlete"."userId" = "ChatSummary"."athleteId"
        AND "Athlete"."consentChatSummaries" = true
        AND EXISTS (
          SELECT 1 FROM "Coach" WHERE "Coach"."userId" = auth.uid()::text
        )
    )
  );

-- Policy 3: Service role has full access (for cron jobs and system operations)
CREATE POLICY "Service role full access to ChatSummary" ON "ChatSummary"
  FOR ALL USING (auth.role() = 'service_role');

-- Verify: Check policy count
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'ChatSummary';

  IF policy_count < 3 THEN
    RAISE WARNING 'ChatSummary has % policies, expected 3', policy_count;
  ELSE
    RAISE NOTICE 'ChatSummary policies created successfully: % policies', policy_count;
  END IF;
END $$;
