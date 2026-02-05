-- =========================================================
-- COMPREHENSIVE RLS FIX - February 5, 2026
-- =========================================================
-- Purpose: Fix all RLS gaps identified in security audit
--
-- Issues Fixed:
-- 1. PerformanceMetric uses athleteId, not userId (CRITICAL)
-- 2. Message table lacks proper policies
-- 3. Newer tables missing RLS (AlertRule, GeneratedAlert, etc.)
-- 4. Prediction/intervention tables need policies
-- 5. Wearable connection security
-- =========================================================

-- =========================================================
-- PART 1: FIX PERFORMANCEMETRIC RLS (CRITICAL)
-- =========================================================
-- The old policies reference "userId" but column is "athleteId"

DROP POLICY IF EXISTS "Athletes can view own performance metrics" ON "PerformanceMetric";
DROP POLICY IF EXISTS "Athletes can manage own performance metrics" ON "PerformanceMetric";
DROP POLICY IF EXISTS "Coaches can view athlete performance with consent" ON "PerformanceMetric";

-- Correct policies using athleteId
CREATE POLICY "Athletes can manage own performance metrics" ON "PerformanceMetric"
  FOR ALL
  USING ("athleteId" = (select auth.uid()))
  WITH CHECK ("athleteId" = (select auth.uid()));

CREATE POLICY "Coaches can view athlete performance with consent" ON "PerformanceMetric"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "PerformanceMetric"."athleteId"
        AND "consentGranted" = true
    )
  );

-- =========================================================
-- PART 2: FIX MESSAGE TABLE RLS
-- =========================================================
-- Messages should only be viewable by the athlete who owns the session
-- or coaches with consent

DROP POLICY IF EXISTS "Athletes can view own messages" ON "Message";
DROP POLICY IF EXISTS "Athletes can create messages in own sessions" ON "Message";
DROP POLICY IF EXISTS "Coaches can view messages with consent" ON "Message";

CREATE POLICY "Athletes can view own messages" ON "Message"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "ChatSession"
      WHERE "ChatSession".id = "Message"."sessionId"
        AND "ChatSession"."athleteId" = (select auth.uid())
    )
  );

CREATE POLICY "Athletes can create messages in own sessions" ON "Message"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatSession"
      WHERE "ChatSession".id = "sessionId"
        AND "ChatSession"."athleteId" = (select auth.uid())
    )
  );

CREATE POLICY "Coaches can view messages with athlete consent" ON "Message"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "ChatSession" cs
      JOIN "CoachAthleteRelation" car ON car."athleteId" = cs."athleteId"
      WHERE cs.id = "Message"."sessionId"
        AND car."coachId" = (select auth.uid())
        AND car."consentGranted" = true
    )
  );

-- =========================================================
-- PART 3: ADD RLS FOR ALERTRULE TABLE
-- =========================================================
ALTER TABLE "AlertRule" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can manage own alert rules" ON "AlertRule";
CREATE POLICY "Coaches can manage own alert rules" ON "AlertRule"
  FOR ALL
  USING ("coachId" = (select auth.uid()))
  WITH CHECK ("coachId" = (select auth.uid()));

-- =========================================================
-- PART 4: ADD RLS FOR GENERATEDALERT TABLE
-- =========================================================
ALTER TABLE "GeneratedAlert" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can view own generated alerts" ON "GeneratedAlert";
CREATE POLICY "Coaches can view own generated alerts" ON "GeneratedAlert"
  FOR SELECT
  USING ("coachId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can manage own generated alerts" ON "GeneratedAlert";
CREATE POLICY "Coaches can manage own generated alerts" ON "GeneratedAlert"
  FOR UPDATE
  USING ("coachId" = (select auth.uid()))
  WITH CHECK ("coachId" = (select auth.uid()));

DROP POLICY IF EXISTS "Athletes can view alerts about them" ON "GeneratedAlert";
CREATE POLICY "Athletes can view alerts about them" ON "GeneratedAlert"
  FOR SELECT
  USING ("athleteId" = (select auth.uid()));

-- =========================================================
-- PART 5: ADD RLS FOR PERFORMANCEOUTCOME TABLE
-- =========================================================
ALTER TABLE "PerformanceOutcome" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes can manage own performance outcomes" ON "PerformanceOutcome";
CREATE POLICY "Athletes can manage own performance outcomes" ON "PerformanceOutcome"
  FOR ALL
  USING ("athleteId" = (select auth.uid()))
  WITH CHECK ("athleteId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can view athlete outcomes with consent" ON "PerformanceOutcome";
CREATE POLICY "Coaches can view athlete outcomes with consent" ON "PerformanceOutcome"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "PerformanceOutcome"."athleteId"
        AND "consentGranted" = true
    )
  );

DROP POLICY IF EXISTS "Coaches can record athlete outcomes" ON "PerformanceOutcome";
CREATE POLICY "Coaches can record athlete outcomes" ON "PerformanceOutcome"
  FOR INSERT
  WITH CHECK (
    "recordedBy" = (select auth.uid()::text)
    AND EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "PerformanceOutcome"."athleteId"
    )
  );

-- =========================================================
-- PART 6: ADD RLS FOR GAMESCHEDULE TABLE
-- =========================================================
ALTER TABLE "GameSchedule" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes can manage own game schedule" ON "GameSchedule";
CREATE POLICY "Athletes can manage own game schedule" ON "GameSchedule"
  FOR ALL
  USING ("athleteId" = (select auth.uid()))
  WITH CHECK ("athleteId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can view athlete schedules with consent" ON "GameSchedule";
CREATE POLICY "Coaches can view athlete schedules with consent" ON "GameSchedule"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "GameSchedule"."athleteId"
        AND "consentGranted" = true
    )
  );

-- =========================================================
-- PART 7: ADD RLS FOR PREGAMESESSION TABLE
-- =========================================================
ALTER TABLE "PreGameSession" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes can manage own pregame sessions" ON "PreGameSession";
CREATE POLICY "Athletes can manage own pregame sessions" ON "PreGameSession"
  FOR ALL
  USING ("athleteId" = (select auth.uid()))
  WITH CHECK ("athleteId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can view athlete pregame sessions with consent" ON "PreGameSession";
CREATE POLICY "Coaches can view athlete pregame sessions with consent" ON "PreGameSession"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "PreGameSession"."athleteId"
        AND "consentGranted" = true
    )
  );

-- =========================================================
-- PART 8: ADD RLS FOR INTERVENTION TABLE
-- =========================================================
ALTER TABLE "Intervention" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes can manage own interventions" ON "Intervention";
CREATE POLICY "Athletes can manage own interventions" ON "Intervention"
  FOR ALL
  USING ("athleteId" = (select auth.uid()))
  WITH CHECK ("athleteId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can view athlete interventions with consent" ON "Intervention";
CREATE POLICY "Coaches can view athlete interventions with consent" ON "Intervention"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "Intervention"."athleteId"
        AND "consentGranted" = true
    )
  );

-- =========================================================
-- PART 9: ADD RLS FOR INTERVENTIONOUTCOME TABLE
-- =========================================================
ALTER TABLE "InterventionOutcome" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view intervention outcomes they can access" ON "InterventionOutcome";
CREATE POLICY "Users can view intervention outcomes they can access" ON "InterventionOutcome"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Intervention"
      WHERE "Intervention".id = "InterventionOutcome"."interventionId"
        AND (
          "Intervention"."athleteId" = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM "CoachAthleteRelation"
            WHERE "coachId" = (select auth.uid())
              AND "athleteId" = "Intervention"."athleteId"
              AND "consentGranted" = true
          )
        )
    )
  );

-- =========================================================
-- PART 10: ADD RLS FOR WEARABLECONNECTION TABLE
-- =========================================================
ALTER TABLE "WearableConnection" ENABLE ROW LEVEL SECURITY;

-- Athletes can ONLY manage their own wearable connection
-- This is critical as it contains OAuth tokens
DROP POLICY IF EXISTS "Athletes can manage own wearable connection" ON "WearableConnection";
CREATE POLICY "Athletes can manage own wearable connection" ON "WearableConnection"
  FOR ALL
  USING ("athleteId" = (select auth.uid()))
  WITH CHECK ("athleteId" = (select auth.uid()));

-- Coaches should NOT be able to see wearable tokens, only the data

-- =========================================================
-- PART 11: ADD RLS FOR WEARABLEDATAPOINT TABLE
-- =========================================================
ALTER TABLE "WearableDataPoint" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes can manage own wearable data points" ON "WearableDataPoint";
CREATE POLICY "Athletes can manage own wearable data points" ON "WearableDataPoint"
  FOR ALL
  USING ("athleteId" = (select auth.uid()))
  WITH CHECK ("athleteId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can view wearable data points with consent" ON "WearableDataPoint";
CREATE POLICY "Coaches can view wearable data points with consent" ON "WearableDataPoint"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "WearableDataPoint"."athleteId"
        AND "consentGranted" = true
    )
  );

-- =========================================================
-- PART 12: ADD RLS FOR ATHLETEMODEL TABLE
-- =========================================================
ALTER TABLE "AthleteModel" ENABLE ROW LEVEL SECURITY;

-- Only athletes can see their own model (contains personalization data)
DROP POLICY IF EXISTS "Athletes can view own model" ON "AthleteModel";
CREATE POLICY "Athletes can view own model" ON "AthleteModel"
  FOR SELECT
  USING ("athleteId" = (select auth.uid()));

-- System can update models (needs service role key)
-- Individual athletes shouldn't be able to modify their model

-- =========================================================
-- PART 13: ADD RLS FOR PREDICTIONLOG TABLE
-- =========================================================
ALTER TABLE "PredictionLog" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes can view own predictions" ON "PredictionLog";
CREATE POLICY "Athletes can view own predictions" ON "PredictionLog"
  FOR SELECT
  USING ("athleteId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can view athlete predictions with consent" ON "PredictionLog";
CREATE POLICY "Coaches can view athlete predictions with consent" ON "PredictionLog"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "PredictionLog"."athleteId"
        AND "consentGranted" = true
    )
  );

-- =========================================================
-- PART 14: ADD RLS FOR COACHTOUCHPOINT TABLE
-- =========================================================
ALTER TABLE "CoachTouchpoint" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can manage own touchpoints" ON "CoachTouchpoint";
CREATE POLICY "Coaches can manage own touchpoints" ON "CoachTouchpoint"
  FOR ALL
  USING ("coachId" = (select auth.uid()))
  WITH CHECK ("coachId" = (select auth.uid()));

DROP POLICY IF EXISTS "Athletes can view touchpoints about them" ON "CoachTouchpoint";
CREATE POLICY "Athletes can view touchpoints about them" ON "CoachTouchpoint"
  FOR SELECT
  USING ("athleteId" = (select auth.uid()));

-- =========================================================
-- PART 15: ADD RLS FOR GAMERESULT TABLE
-- =========================================================
ALTER TABLE "GameResult" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes can manage own game results" ON "GameResult";
CREATE POLICY "Athletes can manage own game results" ON "GameResult"
  FOR ALL
  USING ("athleteId" = (select auth.uid()))
  WITH CHECK ("athleteId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can view athlete game results with consent" ON "GameResult";
CREATE POLICY "Coaches can view athlete game results with consent" ON "GameResult"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "GameResult"."athleteId"
        AND "consentGranted" = true
    )
  );

-- =========================================================
-- PART 16: FIX TASK TABLE (uses athleteId, not userId)
-- =========================================================
DROP POLICY IF EXISTS "Athletes can manage own tasks" ON "Task";
CREATE POLICY "Athletes can manage own tasks" ON "Task"
  FOR ALL
  USING ("athleteId" = (select auth.uid()))
  WITH CHECK ("athleteId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can view athlete tasks with consent" ON "Task";
CREATE POLICY "Coaches can view athlete tasks with consent" ON "Task"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "Task"."athleteId"
        AND "consentGranted" = true
    )
  );

-- =========================================================
-- VERIFICATION QUERIES
-- =========================================================
-- Run these in Supabase SQL Editor to verify:

-- 1. Check all tables have RLS enabled:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND rowsecurity = false;
-- Expected: Empty (all tables should have RLS)

-- 2. Count policies:
-- SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
-- Expected: 100+ policies

-- 3. Check for policies with wrong column names:
-- SELECT tablename, policyname, definition
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND definition LIKE '%"userId"%'
--   AND tablename IN ('PerformanceMetric', 'Task', 'MoodLog');
-- Expected: Empty (these tables use athleteId)

-- =========================================================
-- NOTES FOR PRODUCTION DEPLOYMENT
-- =========================================================
-- 1. Run this migration on STAGING first
-- 2. Test all user flows (athlete, coach, admin)
-- 3. Verify consent-based access works correctly
-- 4. Check performance of JOIN-based policies
-- 5. Only then deploy to production
