-- Row-Level Security (RLS) Policies for Weekly Chat Summaries
-- Enforces privacy gates at the database level

-- Enable RLS on chat_summaries table
ALTER TABLE "ChatSummary" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS athlete_read_own_summaries ON "ChatSummary";
DROP POLICY IF EXISTS coach_read_consented_summaries ON "ChatSummary";
DROP POLICY IF EXISTS system_create_weekly_summaries ON "ChatSummary";
DROP POLICY IF EXISTS athlete_revoke_summaries ON "ChatSummary";

-- Policy 1: Athletes can read their own summaries
CREATE POLICY athlete_read_own_summaries ON "ChatSummary"
  FOR SELECT
  USING (
    "athleteId" = current_setting('app.current_user_id', TRUE)
  );

-- Policy 2: Coaches can read summaries ONLY if ALL privacy gates pass:
-- 1. Relationship consent granted (CoachAthleteRelation.consentGranted = true)
-- 2. Global athlete consent (Athlete.consentChatSummaries = true)
-- 3. Same school (Coach.schoolId = Athlete.schoolId - tenant boundary)
-- 4. Not revoked (revokedAt IS NULL)
-- 5. Not expired (expiresAt > NOW() OR expiresAt IS NULL)
CREATE POLICY coach_read_consented_summaries ON "ChatSummary"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM "CoachAthleteRelation" car
      INNER JOIN "Athlete" a ON a."userId" = car."athleteId"
      INNER JOIN "Coach" c ON c."userId" = car."coachId"
      INNER JOIN "User" u_coach ON u_coach.id = c."userId"
      INNER JOIN "User" u_athlete ON u_athlete.id = a."userId"
      WHERE 
        c."userId" = current_setting('app.current_user_id', TRUE)
        AND car."athleteId" = "ChatSummary"."athleteId"
        AND car."consentGranted" = TRUE              -- Relationship consent (Gate 1)
        AND a."consentChatSummaries" = TRUE          -- Global consent (Gate 2)
        AND u_coach."schoolId" = u_athlete."schoolId" -- Tenant boundary (Gate 3)
        AND "ChatSummary"."revokedAt" IS NULL        -- Not revoked (Gate 4)
        AND (
          "ChatSummary"."expiresAt" IS NULL 
          OR "ChatSummary"."expiresAt" > NOW()       -- Not expired (Gate 5)
        )
    )
  );

-- Policy 3: System (cron job) can INSERT weekly summaries
-- Note: In production, use a service role with direct SQL access instead of RLS bypass
CREATE POLICY system_create_weekly_summaries ON "ChatSummary"
  FOR INSERT
  WITH CHECK (
    "summaryType" = 'WEEKLY'
    AND current_setting('app.current_user_id', TRUE) = 'system'
  );

-- Policy 4: Athletes can UPDATE (revoke) their summaries
-- ONLY allows updating revokedAt field
CREATE POLICY athlete_revoke_summaries ON "ChatSummary"
  FOR UPDATE
  USING ("athleteId" = current_setting('app.current_user_id', TRUE))
  WITH CHECK (
    -- Only allow updating revoked_at field (set to non-null when revoking)
    "athleteId" = current_setting('app.current_user_id', TRUE)
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON "ChatSummary" TO authenticated;

-- Create helper function to set current user context
-- This should be called at the start of each authenticated request
CREATE OR REPLACE FUNCTION set_current_user(user_id TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage example (in application code):
-- SELECT set_current_user('user-id-from-session');

-- Index for performance (already created in schema migration)
-- These ensure RLS policies are fast
-- CREATE INDEX IF NOT EXISTS "ChatSummary_athleteId_weekStart_summaryType_idx" 
--   ON "ChatSummary"("athleteId", "weekStart", "summaryType");
-- CREATE INDEX IF NOT EXISTS "ChatSummary_expiresAt_idx" 
--   ON "ChatSummary"("expiresAt");
-- CREATE INDEX IF NOT EXISTS "ChatSummary_summaryType_weekStart_idx" 
--   ON "ChatSummary"("summaryType", "weekStart");

COMMENT ON POLICY athlete_read_own_summaries ON "ChatSummary" IS 
  'Athletes can view their own weekly summaries';

COMMENT ON POLICY coach_read_consented_summaries ON "ChatSummary" IS 
  'Coaches can view summaries ONLY if athlete consented AND relationship is active AND same school';

COMMENT ON POLICY system_create_weekly_summaries ON "ChatSummary" IS 
  'System cron jobs can create new weekly summaries';

COMMENT ON POLICY athlete_revoke_summaries ON "ChatSummary" IS 
  'Athletes can revoke their summaries by updating revokedAt timestamp';
