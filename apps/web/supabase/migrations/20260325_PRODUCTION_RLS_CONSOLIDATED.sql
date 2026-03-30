-- =========================================================
-- CONSOLIDATED PRODUCTION RLS MIGRATION
-- Date: 2026-03-25
-- =========================================================
-- PURPOSE: Apply ALL RLS security fixes to production database.
-- This is a single, idempotent script combining:
--   1. 20260205_comprehensive_rls_fix.sql
--   2. 20260217_EMERGENCY_RLS_FIX.sql
--   3. 20260226_fix_chatsummary_policies.sql
--   4. 20260226_add_missing_policies.sql
--
-- SAFE TO RE-RUN: Uses DROP POLICY IF EXISTS before every CREATE.
-- Run in: Supabase Dashboard → SQL Editor → Production project
-- =========================================================


-- =========================================================
-- STEP 1: ENABLE RLS ON ALL 46 TABLES
-- =========================================================
-- (Idempotent — no-op if already enabled)

-- Auth/Session tables
ALTER TABLE IF EXISTS "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "VerificationToken" ENABLE ROW LEVEL SECURITY;

-- Core user tables
ALTER TABLE IF EXISTS "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Athlete" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Coach" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "School" ENABLE ROW LEVEL SECURITY;

-- Coach-Athlete relationship
ALTER TABLE IF EXISTS "CoachAthleteRelation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "CoachNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "CoachTouchpoint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "CoachDigest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "CoachDigestPreferences" ENABLE ROW LEVEL SECURITY;

-- Chat tables
ALTER TABLE IF EXISTS "ChatSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ChatInsight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "chat_summaries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ConversationInsight" ENABLE ROW LEVEL SECURITY;

-- Crisis & Safety
ALTER TABLE IF EXISTS "CrisisAlert" ENABLE ROW LEVEL SECURITY;

-- Mood & Wellbeing
ALTER TABLE IF EXISTS "MoodLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ReadinessScore" ENABLE ROW LEVEL SECURITY;

-- Goals & Tasks
ALTER TABLE IF EXISTS "Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "TaskPattern" ENABLE ROW LEVEL SECURITY;

-- Performance Analytics
ALTER TABLE IF EXISTS "PerformanceMetric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "PerformanceOutcome" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "GameResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "GameSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "PreGameSession" ENABLE ROW LEVEL SECURITY;

-- Interventions & Predictions
ALTER TABLE IF EXISTS "Intervention" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "InterventionOutcome" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "PredictionLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AthleteModel" ENABLE ROW LEVEL SECURITY;

-- Wearables (CRITICAL - contains OAuth tokens)
ALTER TABLE IF EXISTS "WearableConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "WearableData" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "WearableDataPoint" ENABLE ROW LEVEL SECURITY;

-- Alerts
ALTER TABLE IF EXISTS "AlertRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "GeneratedAlert" ENABLE ROW LEVEL SECURITY;

-- Assignments
ALTER TABLE IF EXISTS "Assignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "AssignmentSubmission" ENABLE ROW LEVEL SECURITY;

-- Settings & Config
ALTER TABLE IF EXISTS "UserSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "TeamConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "PushToken" ENABLE ROW LEVEL SECURITY;

-- Knowledge & Content
ALTER TABLE IF EXISTS "KnowledgeBase" ENABLE ROW LEVEL SECURITY;

-- Audit & Logging
ALTER TABLE IF EXISTS "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ErrorLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "TokenUsage" ENABLE ROW LEVEL SECURITY;


-- =========================================================
-- STEP 2: USER TABLE POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Users can view own profile" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Service role full access to User" ON "User";

CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (id = auth.uid()::text);

CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

CREATE POLICY "Service role full access to User" ON "User"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 3: ATHLETE TABLE POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can manage own athlete profile" ON "Athlete";
DROP POLICY IF EXISTS "Coaches can view consented athletes" ON "Athlete";
DROP POLICY IF EXISTS "Service role full access to Athlete" ON "Athlete";

CREATE POLICY "Athletes can manage own athlete profile" ON "Athlete"
  FOR ALL USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Coaches can view consented athletes" ON "Athlete"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "CoachAthleteRelation"."coachId" = auth.uid()::text
        AND "CoachAthleteRelation"."athleteId" = "Athlete"."userId"
        AND "CoachAthleteRelation"."consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to Athlete" ON "Athlete"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 4: COACH TABLE POLICIES (enhanced from Feb 26 fix)
-- =========================================================

DROP POLICY IF EXISTS "Coaches can manage own coach profile" ON "Coach";
DROP POLICY IF EXISTS "Users can view own coach profile" ON "Coach";
DROP POLICY IF EXISTS "Coaches can view school colleagues" ON "Coach";
DROP POLICY IF EXISTS "Coaches can view teammates" ON "Coach";
DROP POLICY IF EXISTS "Athletes can view their coaches" ON "Coach";
DROP POLICY IF EXISTS "Service role full access to Coach" ON "Coach";

CREATE POLICY "Coaches can manage own coach profile" ON "Coach"
  FOR ALL USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Coaches can view school colleagues" ON "Coach"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" AS me
      JOIN "User" AS them ON them."schoolId" = me."schoolId"
      WHERE me.id = auth.uid()::text
        AND them.id = "Coach"."userId"
    )
  );

CREATE POLICY "Athletes can view their coaches" ON "Coach"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = "Coach"."userId"
        AND "athleteId" = auth.uid()::text
    )
  );

CREATE POLICY "Service role full access to Coach" ON "Coach"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 5: SCHOOL TABLE POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Users can view own school" ON "School";
DROP POLICY IF EXISTS "Service role full access to School" ON "School";

CREATE POLICY "Users can view own school" ON "School"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()::text
        AND "User"."schoolId" = "School".id
    )
  );

CREATE POLICY "Service role full access to School" ON "School"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 6: COACH-ATHLETE RELATION POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Coaches can view own relations" ON "CoachAthleteRelation";
DROP POLICY IF EXISTS "Athletes can view relations to them" ON "CoachAthleteRelation";
DROP POLICY IF EXISTS "Athletes can update consent" ON "CoachAthleteRelation";
DROP POLICY IF EXISTS "Service role full access to CoachAthleteRelation" ON "CoachAthleteRelation";

CREATE POLICY "Coaches can view own relations" ON "CoachAthleteRelation"
  FOR SELECT USING ("coachId" = auth.uid()::text);

CREATE POLICY "Athletes can view relations to them" ON "CoachAthleteRelation"
  FOR SELECT USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Athletes can update consent" ON "CoachAthleteRelation"
  FOR UPDATE USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Service role full access to CoachAthleteRelation" ON "CoachAthleteRelation"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 7: MOOD LOG POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can manage own mood logs" ON "MoodLog";
DROP POLICY IF EXISTS "Coaches can view mood logs with consent" ON "MoodLog";
DROP POLICY IF EXISTS "Service role full access to MoodLog" ON "MoodLog";

CREATE POLICY "Athletes can manage own mood logs" ON "MoodLog"
  FOR ALL USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view mood logs with consent" ON "MoodLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "MoodLog"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to MoodLog" ON "MoodLog"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 8: GOAL POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can manage own goals" ON "Goal";
DROP POLICY IF EXISTS "Coaches can view goals with consent" ON "Goal";
DROP POLICY IF EXISTS "Service role full access to Goal" ON "Goal";

CREATE POLICY "Athletes can manage own goals" ON "Goal"
  FOR ALL USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view goals with consent" ON "Goal"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "Goal"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to Goal" ON "Goal"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 9: TASK POLICIES (uses athleteId, NOT userId)
-- =========================================================

DROP POLICY IF EXISTS "Athletes can manage own tasks" ON "Task";
DROP POLICY IF EXISTS "Coaches can view tasks with consent" ON "Task";
DROP POLICY IF EXISTS "Coaches can view athlete tasks with consent" ON "Task";
DROP POLICY IF EXISTS "Service role full access to Task" ON "Task";

CREATE POLICY "Athletes can manage own tasks" ON "Task"
  FOR ALL USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view tasks with consent" ON "Task"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "Task"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to Task" ON "Task"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 10: CHAT SESSION POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can manage own chat sessions" ON "ChatSession";
DROP POLICY IF EXISTS "Coaches can view chat sessions with consent" ON "ChatSession";
DROP POLICY IF EXISTS "Service role full access to ChatSession" ON "ChatSession";

CREATE POLICY "Athletes can manage own chat sessions" ON "ChatSession"
  FOR ALL USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view chat sessions with consent" ON "ChatSession"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "ChatSession"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to ChatSession" ON "ChatSession"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 11: MESSAGE POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can view own messages" ON "Message";
DROP POLICY IF EXISTS "Athletes can create messages in own sessions" ON "Message";
DROP POLICY IF EXISTS "Coaches can view messages with consent" ON "Message";
DROP POLICY IF EXISTS "Coaches can view messages with athlete consent" ON "Message";
DROP POLICY IF EXISTS "Service role full access to Message" ON "Message";

CREATE POLICY "Athletes can view own messages" ON "Message"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "ChatSession"
      WHERE "ChatSession".id = "Message"."sessionId"
        AND "ChatSession"."athleteId" = auth.uid()::text
    )
  );

CREATE POLICY "Athletes can create messages in own sessions" ON "Message"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatSession"
      WHERE "ChatSession".id = "sessionId"
        AND "ChatSession"."athleteId" = auth.uid()::text
    )
  );

CREATE POLICY "Coaches can view messages with consent" ON "Message"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "ChatSession" cs
      JOIN "CoachAthleteRelation" car ON car."athleteId" = cs."athleteId"
      WHERE cs.id = "Message"."sessionId"
        AND car."coachId" = auth.uid()::text
        AND car."consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to Message" ON "Message"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 12: CHAT INSIGHT POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can view own chat insights" ON "ChatInsight";
DROP POLICY IF EXISTS "Coaches can view chat insights with consent" ON "ChatInsight";
DROP POLICY IF EXISTS "Service role full access to ChatInsight" ON "ChatInsight";

CREATE POLICY "Athletes can view own chat insights" ON "ChatInsight"
  FOR SELECT USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view chat insights with consent" ON "ChatInsight"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "ChatInsight"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to ChatInsight" ON "ChatInsight"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 13: CHAT SUMMARY POLICIES
-- =========================================================
DROP POLICY IF EXISTS "Athletes can view own chat summaries" ON "chat_summaries";
DROP POLICY IF EXISTS "Coaches can view chat summaries with consent" ON "chat_summaries";
DROP POLICY IF EXISTS "Service role full access to ChatSummary" ON "chat_summaries";
DROP POLICY IF EXISTS "Service role full access to chat_summaries" ON "chat_summaries";

CREATE POLICY "Athletes can view own chat summaries" ON "chat_summaries"
  FOR SELECT USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view chat summaries with consent" ON "chat_summaries"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "chat_summaries"."athleteId"
        AND "consentGranted" = true
    )
    OR
    EXISTS (
      SELECT 1 FROM "Athlete"
      WHERE "Athlete"."userId" = "chat_summaries"."athleteId"
        AND "Athlete"."consentChatSummaries" = true
        AND EXISTS (
          SELECT 1 FROM "Coach" WHERE "Coach"."userId" = auth.uid()::text
        )
    )
  );

CREATE POLICY "Service role full access to chat_summaries" ON "chat_summaries"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 14: CONVERSATION INSIGHT POLICIES (enhanced from Feb 26)
-- =========================================================

DROP POLICY IF EXISTS "Athletes can view own conversation insights" ON "ConversationInsight";
DROP POLICY IF EXISTS "Coaches can view insights with consent" ON "ConversationInsight";
DROP POLICY IF EXISTS "Service role full access to ConversationInsight" ON "ConversationInsight";

CREATE POLICY "Athletes can view own conversation insights" ON "ConversationInsight"
  FOR SELECT USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view insights with consent" ON "ConversationInsight"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "ConversationInsight"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to ConversationInsight" ON "ConversationInsight"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 15: CRISIS ALERT POLICIES (HIGHLY SENSITIVE)
-- =========================================================

DROP POLICY IF EXISTS "Athletes can view own crisis alerts" ON "CrisisAlert";
DROP POLICY IF EXISTS "Coaches can view crisis alerts" ON "CrisisAlert";
DROP POLICY IF EXISTS "Coaches can update crisis alert status" ON "CrisisAlert";
DROP POLICY IF EXISTS "Service role full access to CrisisAlert" ON "CrisisAlert";

CREATE POLICY "Athletes can view own crisis alerts" ON "CrisisAlert"
  FOR SELECT USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view crisis alerts" ON "CrisisAlert"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "CrisisAlert"."athleteId"
    )
  );

CREATE POLICY "Coaches can update crisis alert status" ON "CrisisAlert"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "CrisisAlert"."athleteId"
    )
  );

CREATE POLICY "Service role full access to CrisisAlert" ON "CrisisAlert"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 16: READINESS SCORE POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can manage own readiness scores" ON "ReadinessScore";
DROP POLICY IF EXISTS "Coaches can view readiness scores with consent" ON "ReadinessScore";
DROP POLICY IF EXISTS "Service role full access to ReadinessScore" ON "ReadinessScore";

CREATE POLICY "Athletes can manage own readiness scores" ON "ReadinessScore"
  FOR ALL USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view readiness scores with consent" ON "ReadinessScore"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "ReadinessScore"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to ReadinessScore" ON "ReadinessScore"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 17: PERFORMANCE METRIC POLICIES (CRITICAL: uses athleteId)
-- =========================================================

DROP POLICY IF EXISTS "Athletes can view own performance metrics" ON "PerformanceMetric";
DROP POLICY IF EXISTS "Athletes can manage own performance metrics" ON "PerformanceMetric";
DROP POLICY IF EXISTS "Coaches can view athlete performance with consent" ON "PerformanceMetric";
DROP POLICY IF EXISTS "Coaches can view performance metrics with consent" ON "PerformanceMetric";
DROP POLICY IF EXISTS "Service role full access to PerformanceMetric" ON "PerformanceMetric";

CREATE POLICY "Athletes can manage own performance metrics" ON "PerformanceMetric"
  FOR ALL USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view performance metrics with consent" ON "PerformanceMetric"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "PerformanceMetric"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to PerformanceMetric" ON "PerformanceMetric"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 18: PERFORMANCE OUTCOME POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can manage own performance outcomes" ON "PerformanceOutcome";
DROP POLICY IF EXISTS "Coaches can view athlete outcomes with consent" ON "PerformanceOutcome";
DROP POLICY IF EXISTS "Coaches can view performance outcomes with consent" ON "PerformanceOutcome";
DROP POLICY IF EXISTS "Coaches can record athlete outcomes" ON "PerformanceOutcome";
DROP POLICY IF EXISTS "Service role full access to PerformanceOutcome" ON "PerformanceOutcome";

CREATE POLICY "Athletes can manage own performance outcomes" ON "PerformanceOutcome"
  FOR ALL USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view performance outcomes with consent" ON "PerformanceOutcome"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "PerformanceOutcome"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Coaches can record athlete outcomes" ON "PerformanceOutcome"
  FOR INSERT WITH CHECK (
    "recordedBy" = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "PerformanceOutcome"."athleteId"
    )
  );

CREATE POLICY "Service role full access to PerformanceOutcome" ON "PerformanceOutcome"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 19: GAME RESULT POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can manage own game results" ON "GameResult";
DROP POLICY IF EXISTS "Coaches can view game results with consent" ON "GameResult";
DROP POLICY IF EXISTS "Coaches can view athlete game results with consent" ON "GameResult";
DROP POLICY IF EXISTS "Service role full access to GameResult" ON "GameResult";

CREATE POLICY "Athletes can manage own game results" ON "GameResult"
  FOR ALL USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view game results with consent" ON "GameResult"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "GameResult"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to GameResult" ON "GameResult"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 20: GAME SCHEDULE POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can manage own game schedule" ON "GameSchedule";
DROP POLICY IF EXISTS "Coaches can view game schedules with consent" ON "GameSchedule";
DROP POLICY IF EXISTS "Coaches can view athlete schedules with consent" ON "GameSchedule";
DROP POLICY IF EXISTS "Service role full access to GameSchedule" ON "GameSchedule";

CREATE POLICY "Athletes can manage own game schedule" ON "GameSchedule"
  FOR ALL USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view game schedules with consent" ON "GameSchedule"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "GameSchedule"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to GameSchedule" ON "GameSchedule"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 21: PRE-GAME SESSION POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can manage own pregame sessions" ON "PreGameSession";
DROP POLICY IF EXISTS "Coaches can view pregame sessions with consent" ON "PreGameSession";
DROP POLICY IF EXISTS "Coaches can view athlete pregame sessions with consent" ON "PreGameSession";
DROP POLICY IF EXISTS "Service role full access to PreGameSession" ON "PreGameSession";

CREATE POLICY "Athletes can manage own pregame sessions" ON "PreGameSession"
  FOR ALL USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view pregame sessions with consent" ON "PreGameSession"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "PreGameSession"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to PreGameSession" ON "PreGameSession"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 22: INTERVENTION POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can manage own interventions" ON "Intervention";
DROP POLICY IF EXISTS "Coaches can view interventions with consent" ON "Intervention";
DROP POLICY IF EXISTS "Coaches can view athlete interventions with consent" ON "Intervention";
DROP POLICY IF EXISTS "Service role full access to Intervention" ON "Intervention";

CREATE POLICY "Athletes can manage own interventions" ON "Intervention"
  FOR ALL USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view interventions with consent" ON "Intervention"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "Intervention"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to Intervention" ON "Intervention"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 23: INTERVENTION OUTCOME POLICIES (enhanced from Feb 26)
-- =========================================================

DROP POLICY IF EXISTS "Users can view intervention outcomes" ON "InterventionOutcome";
DROP POLICY IF EXISTS "Users can view intervention outcomes they can access" ON "InterventionOutcome";
DROP POLICY IF EXISTS "Athletes can view own intervention outcomes" ON "InterventionOutcome";
DROP POLICY IF EXISTS "Coaches can view intervention outcomes" ON "InterventionOutcome";
DROP POLICY IF EXISTS "Service role full access to InterventionOutcome" ON "InterventionOutcome";

CREATE POLICY "Athletes can view own intervention outcomes" ON "InterventionOutcome"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Intervention"
      WHERE "Intervention"."id" = "InterventionOutcome"."interventionId"
        AND "Intervention"."athleteId" = auth.uid()::text
    )
  );

CREATE POLICY "Coaches can view intervention outcomes" ON "InterventionOutcome"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Intervention" i
      JOIN "CoachAthleteRelation" car ON car."athleteId" = i."athleteId"
      WHERE i."id" = "InterventionOutcome"."interventionId"
        AND car."coachId" = auth.uid()::text
        AND car."consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to InterventionOutcome" ON "InterventionOutcome"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 24: WEARABLE CONNECTION POLICIES (CRITICAL - OAuth tokens)
-- =========================================================

DROP POLICY IF EXISTS "Athletes can manage own wearable connection" ON "WearableConnection";
DROP POLICY IF EXISTS "Service role full access to WearableConnection" ON "WearableConnection";

CREATE POLICY "Athletes can manage own wearable connection" ON "WearableConnection"
  FOR ALL USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

-- Coaches should NOT have access to wearable connections (OAuth tokens)
CREATE POLICY "Service role full access to WearableConnection" ON "WearableConnection"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 25: WEARABLE DATA POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can manage own wearable data" ON "WearableData";
DROP POLICY IF EXISTS "Coaches can view wearable data with consent" ON "WearableData";
DROP POLICY IF EXISTS "Service role full access to WearableData" ON "WearableData";

CREATE POLICY "Athletes can manage own wearable data" ON "WearableData"
  FOR ALL USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view wearable data with consent" ON "WearableData"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "WearableData"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to WearableData" ON "WearableData"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 26: WEARABLE DATA POINT POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can manage own wearable data points" ON "WearableDataPoint";
DROP POLICY IF EXISTS "Coaches can view wearable data points with consent" ON "WearableDataPoint";
DROP POLICY IF EXISTS "Service role full access to WearableDataPoint" ON "WearableDataPoint";

CREATE POLICY "Athletes can manage own wearable data points" ON "WearableDataPoint"
  FOR ALL USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view wearable data points with consent" ON "WearableDataPoint"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "WearableDataPoint"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to WearableDataPoint" ON "WearableDataPoint"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 27: ATHLETE MODEL POLICIES (enhanced from Feb 26)
-- =========================================================

DROP POLICY IF EXISTS "Athletes can view own model" ON "AthleteModel";
DROP POLICY IF EXISTS "Athletes can view own athlete model" ON "AthleteModel";
DROP POLICY IF EXISTS "Coaches can view model with consent" ON "AthleteModel";
DROP POLICY IF EXISTS "Service role full access to AthleteModel" ON "AthleteModel";

CREATE POLICY "Athletes can view own athlete model" ON "AthleteModel"
  FOR SELECT USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view model with consent" ON "AthleteModel"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "AthleteModel"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to AthleteModel" ON "AthleteModel"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 28: PREDICTION LOG POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can view own predictions" ON "PredictionLog";
DROP POLICY IF EXISTS "Coaches can view predictions with consent" ON "PredictionLog";
DROP POLICY IF EXISTS "Coaches can view athlete predictions with consent" ON "PredictionLog";
DROP POLICY IF EXISTS "Service role full access to PredictionLog" ON "PredictionLog";

CREATE POLICY "Athletes can view own predictions" ON "PredictionLog"
  FOR SELECT USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view predictions with consent" ON "PredictionLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "PredictionLog"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to PredictionLog" ON "PredictionLog"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 29: ALERT RULE POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Coaches can manage own alert rules" ON "AlertRule";
DROP POLICY IF EXISTS "Service role full access to AlertRule" ON "AlertRule";

CREATE POLICY "Coaches can manage own alert rules" ON "AlertRule"
  FOR ALL USING ("coachId" = auth.uid()::text)
  WITH CHECK ("coachId" = auth.uid()::text);

CREATE POLICY "Service role full access to AlertRule" ON "AlertRule"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 30: GENERATED ALERT POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Coaches can view own generated alerts" ON "GeneratedAlert";
DROP POLICY IF EXISTS "Coaches can manage own generated alerts" ON "GeneratedAlert";
DROP POLICY IF EXISTS "Athletes can view alerts about them" ON "GeneratedAlert";
DROP POLICY IF EXISTS "Service role full access to GeneratedAlert" ON "GeneratedAlert";

CREATE POLICY "Coaches can view own generated alerts" ON "GeneratedAlert"
  FOR SELECT USING ("coachId" = auth.uid()::text);

CREATE POLICY "Coaches can manage own generated alerts" ON "GeneratedAlert"
  FOR UPDATE USING ("coachId" = auth.uid()::text)
  WITH CHECK ("coachId" = auth.uid()::text);

CREATE POLICY "Athletes can view alerts about them" ON "GeneratedAlert"
  FOR SELECT USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Service role full access to GeneratedAlert" ON "GeneratedAlert"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 31: COACH NOTE POLICIES (enhanced from Feb 26)
-- =========================================================

DROP POLICY IF EXISTS "Coaches can manage own notes" ON "CoachNote";
DROP POLICY IF EXISTS "Admins can view school notes" ON "CoachNote";
DROP POLICY IF EXISTS "Admins can view all notes" ON "CoachNote";
DROP POLICY IF EXISTS "Service role full access to CoachNote" ON "CoachNote";

CREATE POLICY "Coaches can manage own notes" ON "CoachNote"
  FOR ALL USING ("coachId" = auth.uid()::text);

CREATE POLICY "Admins can view school notes" ON "CoachNote"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User"."id" = auth.uid()::text
        AND "User"."role" = 'ADMIN'
    )
  );

CREATE POLICY "Service role full access to CoachNote" ON "CoachNote"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 32: COACH TOUCHPOINT POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Coaches can manage own touchpoints" ON "CoachTouchpoint";
DROP POLICY IF EXISTS "Athletes can view touchpoints about them" ON "CoachTouchpoint";
DROP POLICY IF EXISTS "Service role full access to CoachTouchpoint" ON "CoachTouchpoint";

CREATE POLICY "Coaches can manage own touchpoints" ON "CoachTouchpoint"
  FOR ALL USING ("coachId" = auth.uid()::text)
  WITH CHECK ("coachId" = auth.uid()::text);

CREATE POLICY "Athletes can view touchpoints about them" ON "CoachTouchpoint"
  FOR SELECT USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Service role full access to CoachTouchpoint" ON "CoachTouchpoint"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 33: COACH DIGEST POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Coaches can view own digests" ON "CoachDigest";
DROP POLICY IF EXISTS "Service role full access to CoachDigest" ON "CoachDigest";

CREATE POLICY "Coaches can view own digests" ON "CoachDigest"
  FOR SELECT USING ("coachId" = auth.uid()::text);

CREATE POLICY "Service role full access to CoachDigest" ON "CoachDigest"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 34: COACH DIGEST PREFERENCES POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Coaches can manage own digest preferences" ON "CoachDigestPreferences";
DROP POLICY IF EXISTS "Service role full access to CoachDigestPreferences" ON "CoachDigestPreferences";

CREATE POLICY "Coaches can manage own digest preferences" ON "CoachDigestPreferences"
  FOR ALL USING ("coachId" = auth.uid()::text)
  WITH CHECK ("coachId" = auth.uid()::text);

CREATE POLICY "Service role full access to CoachDigestPreferences" ON "CoachDigestPreferences"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 35: ASSIGNMENT POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Coaches can manage own assignments" ON "Assignment";
DROP POLICY IF EXISTS "Athletes can view targeted assignments" ON "Assignment";
DROP POLICY IF EXISTS "Service role full access to Assignment" ON "Assignment";

CREATE POLICY "Coaches can manage own assignments" ON "Assignment"
  FOR ALL USING ("coachId" = auth.uid()::text)
  WITH CHECK ("coachId" = auth.uid()::text);

CREATE POLICY "Athletes can view targeted assignments" ON "Assignment"
  FOR SELECT USING (
    "targetAthleteIds"::jsonb ? auth.uid()::text
    OR "targetAthleteIds" IS NULL
  );

CREATE POLICY "Service role full access to Assignment" ON "Assignment"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 36: ASSIGNMENT SUBMISSION POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can manage own submissions" ON "AssignmentSubmission";
DROP POLICY IF EXISTS "Coaches can view submissions for own assignments" ON "AssignmentSubmission";
DROP POLICY IF EXISTS "Service role full access to AssignmentSubmission" ON "AssignmentSubmission";

CREATE POLICY "Athletes can manage own submissions" ON "AssignmentSubmission"
  FOR ALL USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view submissions for own assignments" ON "AssignmentSubmission"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Assignment"
      WHERE "Assignment".id = "AssignmentSubmission"."assignmentId"
        AND "Assignment"."coachId" = auth.uid()::text
    )
  );

CREATE POLICY "Service role full access to AssignmentSubmission" ON "AssignmentSubmission"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 37: USER SETTINGS POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Users can manage own settings" ON "UserSettings";
DROP POLICY IF EXISTS "Service role full access to UserSettings" ON "UserSettings";

CREATE POLICY "Users can manage own settings" ON "UserSettings"
  FOR ALL USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Service role full access to UserSettings" ON "UserSettings"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 38: TEAM CONFIG POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Users can view team config" ON "TeamConfig";
DROP POLICY IF EXISTS "Service role full access to TeamConfig" ON "TeamConfig";

CREATE POLICY "Users can view team config" ON "TeamConfig"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()::text
        AND "User"."schoolId" = "TeamConfig"."schoolId"
    )
  );

CREATE POLICY "Service role full access to TeamConfig" ON "TeamConfig"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 39: PUSH TOKEN POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Users can manage own push tokens" ON "PushToken";
DROP POLICY IF EXISTS "Service role full access to PushToken" ON "PushToken";

CREATE POLICY "Users can manage own push tokens" ON "PushToken"
  FOR ALL USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Service role full access to PushToken" ON "PushToken"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 40: TASK PATTERN POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Athletes can view own task patterns" ON "TaskPattern";
DROP POLICY IF EXISTS "Service role full access to TaskPattern" ON "TaskPattern";

CREATE POLICY "Athletes can view own task patterns" ON "TaskPattern"
  FOR SELECT USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Service role full access to TaskPattern" ON "TaskPattern"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 41: KNOWLEDGE BASE POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Authenticated users can read knowledge base" ON "KnowledgeBase";
DROP POLICY IF EXISTS "Service role full access to KnowledgeBase" ON "KnowledgeBase";

CREATE POLICY "Authenticated users can read knowledge base" ON "KnowledgeBase"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role full access to KnowledgeBase" ON "KnowledgeBase"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 42: AUDIT LOG POLICIES (HIGHLY RESTRICTED)
-- =========================================================

DROP POLICY IF EXISTS "Admins can view school audit logs" ON "AuditLog";
DROP POLICY IF EXISTS "Admins can view audit logs" ON "AuditLog";
DROP POLICY IF EXISTS "Service role full access to AuditLog" ON "AuditLog";

CREATE POLICY "Admins can view audit logs" ON "AuditLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()::text
        AND "User".role = 'ADMIN'
    )
  );

CREATE POLICY "Service role full access to AuditLog" ON "AuditLog"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 43: ERROR LOG POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Service role full access to ErrorLog" ON "ErrorLog";

CREATE POLICY "Service role full access to ErrorLog" ON "ErrorLog"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 44: TOKEN USAGE POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Users can view own token usage" ON "TokenUsage";
DROP POLICY IF EXISTS "Service role full access to TokenUsage" ON "TokenUsage";

CREATE POLICY "Users can view own token usage" ON "TokenUsage"
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Service role full access to TokenUsage" ON "TokenUsage"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- STEP 45: SESSION & AUTH POLICIES
-- =========================================================

DROP POLICY IF EXISTS "Users can view own sessions" ON "Session";
DROP POLICY IF EXISTS "Service role full access to Session" ON "Session";

CREATE POLICY "Users can view own sessions" ON "Session"
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Service role full access to Session" ON "Session"
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view own accounts" ON "Account";
DROP POLICY IF EXISTS "Service role full access to Account" ON "Account";

CREATE POLICY "Users can view own accounts" ON "Account"
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY "Service role full access to Account" ON "Account"
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to VerificationToken" ON "VerificationToken";

CREATE POLICY "Service role full access to VerificationToken" ON "VerificationToken"
  FOR ALL USING (auth.role() = 'service_role');


-- =========================================================
-- =========================================================
--
--   VERIFICATION QUERIES — RUN THESE AFTER THE MIGRATION
--
-- =========================================================
-- =========================================================

-- CHECK 1: Tables WITHOUT RLS (should be EMPTY)
SELECT '--- CHECK 1: Tables WITHOUT RLS (expect EMPTY) ---' as check_name;
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false
ORDER BY tablename;

-- CHECK 2: Total tables WITH RLS (expect 46+)
SELECT '--- CHECK 2: Tables WITH RLS ---' as check_name;
SELECT COUNT(*) as tables_with_rls
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- CHECK 3: Total policy count (expect 100+)
SELECT '--- CHECK 3: Total policy count (expect 100+) ---' as check_name;
SELECT COUNT(*) as total_policies FROM pg_policies WHERE schemaname = 'public';

-- CHECK 4: Policy breakdown per table
SELECT '--- CHECK 4: Policies per table ---' as check_name;
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;

-- CHECK 5: Critical tables — verify all have 2+ policies
SELECT '--- CHECK 5: Critical tables check ---' as check_name;
SELECT
  t.tablename,
  COALESCE(p.policy_count, 0) as policies,
  t.rowsecurity as rls_enabled
FROM pg_tables t
LEFT JOIN (
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies WHERE schemaname = 'public'
  GROUP BY tablename
) p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'User', 'Athlete', 'Coach', 'ChatSession', 'Message',
    'MoodLog', 'Goal', 'PerformanceMetric', 'AlertRule',
    'GeneratedAlert', 'WearableConnection', 'CoachAthleteRelation',
    'ChatInsight', 'CrisisAlert', 'Intervention', 'AthleteModel'
  )
ORDER BY policies ASC;

-- CHECK 6: Verify no policies reference wrong column (userId on athleteId tables)
SELECT '--- CHECK 6: Wrong column references (expect EMPTY) ---' as check_name;
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND qual::text LIKE '%"userId"%'
  AND tablename IN (
    'MoodLog', 'Goal', 'Task', 'ChatSession', 'ChatInsight',
    'PerformanceMetric', 'PerformanceOutcome', 'GameResult',
    'ReadinessScore', 'Intervention', 'WearableConnection',
    'WearableData', 'WearableDataPoint', 'AthleteModel',
    'PredictionLog', 'CrisisAlert', 'ConversationInsight',
    'GeneratedAlert', 'CoachTouchpoint', 'GameSchedule',
    'PreGameSession', 'TaskPattern'
  );
