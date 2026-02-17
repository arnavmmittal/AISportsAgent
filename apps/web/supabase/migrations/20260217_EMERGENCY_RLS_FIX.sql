-- =========================================================
-- EMERGENCY RLS FIX - February 17, 2026
-- =========================================================
-- CRITICAL: This migration enables RLS and creates policies
-- for ALL 46 tables to fix the security vulnerability where
-- NO tables have row-level security enabled.
--
-- Run this in Supabase SQL Editor IMMEDIATELY.
-- =========================================================

-- =========================================================
-- PART 1: ENABLE RLS ON ALL TABLES
-- =========================================================

-- Auth/Session tables
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;

-- Core user tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Athlete" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coach" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "School" ENABLE ROW LEVEL SECURITY;

-- Coach-Athlete relationship
ALTER TABLE "CoachAthleteRelation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoachNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoachTouchpoint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoachDigest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoachDigestPreferences" ENABLE ROW LEVEL SECURITY;

-- Chat tables
ALTER TABLE "ChatSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatInsight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatSummary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConversationInsight" ENABLE ROW LEVEL SECURITY;

-- Crisis & Safety
ALTER TABLE "CrisisAlert" ENABLE ROW LEVEL SECURITY;

-- Mood & Wellbeing
ALTER TABLE "MoodLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReadinessScore" ENABLE ROW LEVEL SECURITY;

-- Goals & Tasks
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskPattern" ENABLE ROW LEVEL SECURITY;

-- Performance Analytics
ALTER TABLE "PerformanceMetric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PerformanceOutcome" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PreGameSession" ENABLE ROW LEVEL SECURITY;

-- Interventions & Predictions
ALTER TABLE "Intervention" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InterventionOutcome" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PredictionLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AthleteModel" ENABLE ROW LEVEL SECURITY;

-- Wearables (CRITICAL - contains OAuth tokens)
ALTER TABLE "WearableConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WearableData" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WearableDataPoint" ENABLE ROW LEVEL SECURITY;

-- Alerts
ALTER TABLE "AlertRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GeneratedAlert" ENABLE ROW LEVEL SECURITY;

-- Assignments
ALTER TABLE "Assignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssignmentSubmission" ENABLE ROW LEVEL SECURITY;

-- Settings & Config
ALTER TABLE "UserSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushToken" ENABLE ROW LEVEL SECURITY;

-- Knowledge & Content
ALTER TABLE "KnowledgeBase" ENABLE ROW LEVEL SECURITY;

-- Audit & Logging
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ErrorLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TokenUsage" ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- PART 2: USER TABLE POLICIES
-- =========================================================

-- Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (id = (SELECT auth.uid()::text));

CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (id = (SELECT auth.uid()::text))
  WITH CHECK (id = (SELECT auth.uid()::text));

-- Service role can manage all users (for admin operations)
CREATE POLICY "Service role full access to User" ON "User"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 3: ATHLETE TABLE POLICIES
-- =========================================================

-- Athletes can manage their own profile
CREATE POLICY "Athletes can manage own athlete profile" ON "Athlete"
  FOR ALL USING ("userId" = (SELECT auth.uid()::text))
  WITH CHECK ("userId" = (SELECT auth.uid()::text));

-- Coaches can view athletes who consented in their school
CREATE POLICY "Coaches can view consented athletes" ON "Athlete"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "CoachAthleteRelation"."coachId" = (SELECT auth.uid()::text)
        AND "CoachAthleteRelation"."athleteId" = "Athlete"."userId"
        AND "CoachAthleteRelation"."consentGranted" = true
    )
  );

-- Service role bypass
CREATE POLICY "Service role full access to Athlete" ON "Athlete"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 4: COACH TABLE POLICIES
-- =========================================================

CREATE POLICY "Coaches can manage own coach profile" ON "Coach"
  FOR ALL USING ("userId" = (SELECT auth.uid()::text))
  WITH CHECK ("userId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to Coach" ON "Coach"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 5: SCHOOL TABLE POLICIES
-- =========================================================

-- Users can view their own school
CREATE POLICY "Users can view own school" ON "School"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = (SELECT auth.uid()::text)
        AND "User"."schoolId" = "School".id
    )
  );

CREATE POLICY "Service role full access to School" ON "School"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 6: COACH-ATHLETE RELATION POLICIES
-- =========================================================

CREATE POLICY "Coaches can view own relations" ON "CoachAthleteRelation"
  FOR SELECT USING ("coachId" = (SELECT auth.uid()::text));

CREATE POLICY "Athletes can view relations to them" ON "CoachAthleteRelation"
  FOR SELECT USING ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Athletes can update consent" ON "CoachAthleteRelation"
  FOR UPDATE USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to CoachAthleteRelation" ON "CoachAthleteRelation"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 7: MOOD LOG POLICIES
-- =========================================================

CREATE POLICY "Athletes can manage own mood logs" ON "MoodLog"
  FOR ALL USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view mood logs with consent" ON "MoodLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "MoodLog"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to MoodLog" ON "MoodLog"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 8: GOAL POLICIES
-- =========================================================

CREATE POLICY "Athletes can manage own goals" ON "Goal"
  FOR ALL USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view goals with consent" ON "Goal"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "Goal"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to Goal" ON "Goal"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 9: TASK POLICIES
-- =========================================================

CREATE POLICY "Athletes can manage own tasks" ON "Task"
  FOR ALL USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view tasks with consent" ON "Task"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "Task"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to Task" ON "Task"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 10: CHAT SESSION POLICIES
-- =========================================================

CREATE POLICY "Athletes can manage own chat sessions" ON "ChatSession"
  FOR ALL USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view chat sessions with consent" ON "ChatSession"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "ChatSession"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to ChatSession" ON "ChatSession"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 11: MESSAGE POLICIES
-- =========================================================

CREATE POLICY "Athletes can view own messages" ON "Message"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "ChatSession"
      WHERE "ChatSession".id = "Message"."sessionId"
        AND "ChatSession"."athleteId" = (SELECT auth.uid()::text)
    )
  );

CREATE POLICY "Athletes can create messages in own sessions" ON "Message"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatSession"
      WHERE "ChatSession".id = "sessionId"
        AND "ChatSession"."athleteId" = (SELECT auth.uid()::text)
    )
  );

CREATE POLICY "Coaches can view messages with consent" ON "Message"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "ChatSession" cs
      JOIN "CoachAthleteRelation" car ON car."athleteId" = cs."athleteId"
      WHERE cs.id = "Message"."sessionId"
        AND car."coachId" = (SELECT auth.uid()::text)
        AND car."consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to Message" ON "Message"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 12: CHAT INSIGHT POLICIES
-- =========================================================

CREATE POLICY "Athletes can view own chat insights" ON "ChatInsight"
  FOR SELECT USING ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view chat insights with consent" ON "ChatInsight"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "ChatInsight"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to ChatInsight" ON "ChatInsight"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 13: CHAT SUMMARY POLICIES
-- =========================================================

CREATE POLICY "Athletes can view own chat summaries" ON "ChatSummary"
  FOR SELECT USING ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view chat summaries with consent" ON "ChatSummary"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "ChatSummary"."athleteId"
        AND "consentGranted" = true
    )
    AND EXISTS (
      SELECT 1 FROM "Athlete"
      WHERE "Athlete"."userId" = "ChatSummary"."athleteId"
        AND "Athlete"."consentChatSummaries" = true
    )
  );

CREATE POLICY "Service role full access to ChatSummary" ON "ChatSummary"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 14: CONVERSATION INSIGHT POLICIES
-- =========================================================

CREATE POLICY "Athletes can view own conversation insights" ON "ConversationInsight"
  FOR SELECT USING ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to ConversationInsight" ON "ConversationInsight"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 15: CRISIS ALERT POLICIES (HIGHLY SENSITIVE)
-- =========================================================

CREATE POLICY "Athletes can view own crisis alerts" ON "CrisisAlert"
  FOR SELECT USING ("athleteId" = (SELECT auth.uid()::text));

-- Coaches can view crisis alerts for athletes in their school
CREATE POLICY "Coaches can view crisis alerts" ON "CrisisAlert"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "CrisisAlert"."athleteId"
    )
  );

CREATE POLICY "Coaches can update crisis alert status" ON "CrisisAlert"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "CrisisAlert"."athleteId"
    )
  );

CREATE POLICY "Service role full access to CrisisAlert" ON "CrisisAlert"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 16: READINESS SCORE POLICIES
-- =========================================================

CREATE POLICY "Athletes can manage own readiness scores" ON "ReadinessScore"
  FOR ALL USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view readiness scores with consent" ON "ReadinessScore"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "ReadinessScore"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to ReadinessScore" ON "ReadinessScore"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 17: PERFORMANCE METRIC POLICIES
-- =========================================================

CREATE POLICY "Athletes can manage own performance metrics" ON "PerformanceMetric"
  FOR ALL USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view performance metrics with consent" ON "PerformanceMetric"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "PerformanceMetric"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to PerformanceMetric" ON "PerformanceMetric"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 18: PERFORMANCE OUTCOME POLICIES
-- =========================================================

CREATE POLICY "Athletes can manage own performance outcomes" ON "PerformanceOutcome"
  FOR ALL USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view performance outcomes with consent" ON "PerformanceOutcome"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "PerformanceOutcome"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to PerformanceOutcome" ON "PerformanceOutcome"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 19: GAME RESULT POLICIES
-- =========================================================

CREATE POLICY "Athletes can manage own game results" ON "GameResult"
  FOR ALL USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view game results with consent" ON "GameResult"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "GameResult"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to GameResult" ON "GameResult"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 20: GAME SCHEDULE POLICIES
-- =========================================================

CREATE POLICY "Athletes can manage own game schedule" ON "GameSchedule"
  FOR ALL USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view game schedules with consent" ON "GameSchedule"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "GameSchedule"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to GameSchedule" ON "GameSchedule"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 21: PRE-GAME SESSION POLICIES
-- =========================================================

CREATE POLICY "Athletes can manage own pregame sessions" ON "PreGameSession"
  FOR ALL USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view pregame sessions with consent" ON "PreGameSession"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "PreGameSession"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to PreGameSession" ON "PreGameSession"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 22: INTERVENTION POLICIES
-- =========================================================

CREATE POLICY "Athletes can manage own interventions" ON "Intervention"
  FOR ALL USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view interventions with consent" ON "Intervention"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "Intervention"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to Intervention" ON "Intervention"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 23: INTERVENTION OUTCOME POLICIES
-- =========================================================

CREATE POLICY "Users can view intervention outcomes" ON "InterventionOutcome"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Intervention"
      WHERE "Intervention".id = "InterventionOutcome"."interventionId"
        AND (
          "Intervention"."athleteId" = (SELECT auth.uid()::text)
          OR EXISTS (
            SELECT 1 FROM "CoachAthleteRelation"
            WHERE "coachId" = (SELECT auth.uid()::text)
              AND "athleteId" = "Intervention"."athleteId"
              AND "consentGranted" = true
          )
        )
    )
  );

CREATE POLICY "Service role full access to InterventionOutcome" ON "InterventionOutcome"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 24: WEARABLE CONNECTION POLICIES (CRITICAL - OAuth tokens)
-- =========================================================

-- Only athletes can access their own wearable connection (contains OAuth tokens)
CREATE POLICY "Athletes can manage own wearable connection" ON "WearableConnection"
  FOR ALL USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

-- Coaches should NOT have access to wearable connections (OAuth tokens)
-- Only service role can access for sync operations
CREATE POLICY "Service role full access to WearableConnection" ON "WearableConnection"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 25: WEARABLE DATA POLICIES
-- =========================================================

CREATE POLICY "Athletes can manage own wearable data" ON "WearableData"
  FOR ALL USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view wearable data with consent" ON "WearableData"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "WearableData"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to WearableData" ON "WearableData"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 26: WEARABLE DATA POINT POLICIES
-- =========================================================

CREATE POLICY "Athletes can manage own wearable data points" ON "WearableDataPoint"
  FOR ALL USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view wearable data points with consent" ON "WearableDataPoint"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "WearableDataPoint"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to WearableDataPoint" ON "WearableDataPoint"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 27: ATHLETE MODEL POLICIES
-- =========================================================

-- Athletes can only view their model (not modify - system managed)
CREATE POLICY "Athletes can view own athlete model" ON "AthleteModel"
  FOR SELECT USING ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to AthleteModel" ON "AthleteModel"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 28: PREDICTION LOG POLICIES
-- =========================================================

CREATE POLICY "Athletes can view own predictions" ON "PredictionLog"
  FOR SELECT USING ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view predictions with consent" ON "PredictionLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (SELECT auth.uid()::text)
        AND "athleteId" = "PredictionLog"."athleteId"
        AND "consentGranted" = true
    )
  );

CREATE POLICY "Service role full access to PredictionLog" ON "PredictionLog"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 29: ALERT RULE POLICIES
-- =========================================================

CREATE POLICY "Coaches can manage own alert rules" ON "AlertRule"
  FOR ALL USING ("coachId" = (SELECT auth.uid()::text))
  WITH CHECK ("coachId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to AlertRule" ON "AlertRule"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 30: GENERATED ALERT POLICIES
-- =========================================================

CREATE POLICY "Coaches can view own generated alerts" ON "GeneratedAlert"
  FOR SELECT USING ("coachId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can manage own generated alerts" ON "GeneratedAlert"
  FOR UPDATE USING ("coachId" = (SELECT auth.uid()::text))
  WITH CHECK ("coachId" = (SELECT auth.uid()::text));

CREATE POLICY "Athletes can view alerts about them" ON "GeneratedAlert"
  FOR SELECT USING ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to GeneratedAlert" ON "GeneratedAlert"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 31: COACH NOTE POLICIES
-- =========================================================

CREATE POLICY "Coaches can manage own notes" ON "CoachNote"
  FOR ALL USING ("coachId" = (SELECT auth.uid()::text))
  WITH CHECK ("coachId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to CoachNote" ON "CoachNote"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 32: COACH TOUCHPOINT POLICIES
-- =========================================================

CREATE POLICY "Coaches can manage own touchpoints" ON "CoachTouchpoint"
  FOR ALL USING ("coachId" = (SELECT auth.uid()::text))
  WITH CHECK ("coachId" = (SELECT auth.uid()::text));

CREATE POLICY "Athletes can view touchpoints about them" ON "CoachTouchpoint"
  FOR SELECT USING ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to CoachTouchpoint" ON "CoachTouchpoint"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 33: COACH DIGEST POLICIES
-- =========================================================

CREATE POLICY "Coaches can view own digests" ON "CoachDigest"
  FOR SELECT USING ("coachId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to CoachDigest" ON "CoachDigest"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 34: COACH DIGEST PREFERENCES POLICIES
-- =========================================================

CREATE POLICY "Coaches can manage own digest preferences" ON "CoachDigestPreferences"
  FOR ALL USING ("coachId" = (SELECT auth.uid()::text))
  WITH CHECK ("coachId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to CoachDigestPreferences" ON "CoachDigestPreferences"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 35: ASSIGNMENT POLICIES
-- =========================================================

CREATE POLICY "Coaches can manage own assignments" ON "Assignment"
  FOR ALL USING ("coachId" = (SELECT auth.uid()::text))
  WITH CHECK ("coachId" = (SELECT auth.uid()::text));

-- Athletes can view assignments targeted to them
CREATE POLICY "Athletes can view targeted assignments" ON "Assignment"
  FOR SELECT USING (
    "targetAthleteIds"::jsonb ? (SELECT auth.uid()::text)
    OR "targetAthleteIds" IS NULL
  );

CREATE POLICY "Service role full access to Assignment" ON "Assignment"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 36: ASSIGNMENT SUBMISSION POLICIES
-- =========================================================

CREATE POLICY "Athletes can manage own submissions" ON "AssignmentSubmission"
  FOR ALL USING ("athleteId" = (SELECT auth.uid()::text))
  WITH CHECK ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Coaches can view submissions for own assignments" ON "AssignmentSubmission"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Assignment"
      WHERE "Assignment".id = "AssignmentSubmission"."assignmentId"
        AND "Assignment"."coachId" = (SELECT auth.uid()::text)
    )
  );

CREATE POLICY "Service role full access to AssignmentSubmission" ON "AssignmentSubmission"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 37: USER SETTINGS POLICIES
-- =========================================================

CREATE POLICY "Users can manage own settings" ON "UserSettings"
  FOR ALL USING ("userId" = (SELECT auth.uid()::text))
  WITH CHECK ("userId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to UserSettings" ON "UserSettings"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 38: TEAM CONFIG POLICIES
-- =========================================================

-- Only service role can modify team config
CREATE POLICY "Users can view team config" ON "TeamConfig"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = (SELECT auth.uid()::text)
        AND "User"."schoolId" = "TeamConfig"."schoolId"
    )
  );

CREATE POLICY "Service role full access to TeamConfig" ON "TeamConfig"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 39: PUSH TOKEN POLICIES
-- =========================================================

CREATE POLICY "Users can manage own push tokens" ON "PushToken"
  FOR ALL USING ("userId" = (SELECT auth.uid()::text))
  WITH CHECK ("userId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to PushToken" ON "PushToken"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 40: TASK PATTERN POLICIES
-- =========================================================

CREATE POLICY "Athletes can view own task patterns" ON "TaskPattern"
  FOR SELECT USING ("athleteId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to TaskPattern" ON "TaskPattern"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 41: KNOWLEDGE BASE POLICIES
-- =========================================================

-- Knowledge base is read-only for authenticated users
CREATE POLICY "Authenticated users can read knowledge base" ON "KnowledgeBase"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role full access to KnowledgeBase" ON "KnowledgeBase"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 42: AUDIT LOG POLICIES (HIGHLY RESTRICTED)
-- =========================================================

-- Only admins in same school can view audit logs
CREATE POLICY "Admins can view school audit logs" ON "AuditLog"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = (SELECT auth.uid()::text)
        AND "User".role = 'ADMIN'
        AND "User"."schoolId" = "AuditLog"."schoolId"
    )
  );

CREATE POLICY "Service role full access to AuditLog" ON "AuditLog"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 43: ERROR LOG POLICIES
-- =========================================================

-- Only service role can access error logs
CREATE POLICY "Service role full access to ErrorLog" ON "ErrorLog"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 44: TOKEN USAGE POLICIES
-- =========================================================

CREATE POLICY "Users can view own token usage" ON "TokenUsage"
  FOR SELECT USING ("userId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to TokenUsage" ON "TokenUsage"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- PART 45: SESSION & AUTH POLICIES
-- =========================================================

CREATE POLICY "Users can view own sessions" ON "Session"
  FOR SELECT USING ("userId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to Session" ON "Session"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own accounts" ON "Account"
  FOR SELECT USING ("userId" = (SELECT auth.uid()::text));

CREATE POLICY "Service role full access to Account" ON "Account"
  FOR ALL USING (auth.role() = 'service_role');

-- Verification tokens are service-role only
CREATE POLICY "Service role full access to VerificationToken" ON "VerificationToken"
  FOR ALL USING (auth.role() = 'service_role');

-- =========================================================
-- VERIFICATION QUERIES - RUN AFTER MIGRATION
-- =========================================================
--
-- 1. Check all tables have RLS enabled:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND rowsecurity = false;
-- Expected: Empty (all tables should have RLS)
--
-- 2. Count total policies (should be 90+):
-- SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
--
-- 3. List all policies:
-- SELECT tablename, policyname, cmd, permissive
-- FROM pg_policies WHERE schemaname = 'public'
-- ORDER BY tablename;
-- =========================================================
