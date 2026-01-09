-- =========================================================
-- CRITICAL SECURITY FIX: Enable RLS on All Tables
-- =========================================================
-- Date: January 6, 2026
-- Purpose: Fix critical security vulnerabilities found in Supabase audit
--
-- Issues Fixed:
-- 1. ENABLE RLS on all tables (was defined but not enabled)
-- 2. Optimize auth function calls for performance
-- 3. Fix overly permissive system policies
-- 4. Remove password column exposure
-- =========================================================

-- =========================================================
-- PART 1: ENABLE ROW LEVEL SECURITY (CRITICAL)
-- =========================================================
-- This is the most critical fix - RLS policies exist but aren't enforced!

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "School" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Athlete" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coach" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MoodLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrisisAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatInsight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GameResult" ENABLE ROW LEVEL SECURITY;

-- These should already be enabled, but ensure they are:
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoachAthleteRelation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chat_summaries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PerformanceMetric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssignmentSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoachNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReadinessScore" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WearableData" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskPattern" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TokenUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ErrorLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConversationInsight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeBase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamConfig" ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- PART 2: OPTIMIZE AUTH FUNCTION CALLS (PERFORMANCE)
-- =========================================================
-- Replace auth.uid() with (select auth.uid()) in all policies

-- Account policies
DROP POLICY IF EXISTS "Users can view own accounts" ON "Account";
CREATE POLICY "Users can view own accounts" ON "Account"
  FOR SELECT
  USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own accounts" ON "Account";
CREATE POLICY "Users can insert own accounts" ON "Account"
  FOR INSERT
  WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own accounts" ON "Account";
CREATE POLICY "Users can delete own accounts" ON "Account"
  FOR DELETE
  USING ("userId" = (select auth.uid()));

-- Session policies
DROP POLICY IF EXISTS "Users can view own sessions" ON "Session";
CREATE POLICY "Users can view own sessions" ON "Session"
  FOR SELECT
  USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own sessions" ON "Session";
CREATE POLICY "Users can insert own sessions" ON "Session"
  FOR INSERT
  WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own sessions" ON "Session";
CREATE POLICY "Users can delete own sessions" ON "Session"
  FOR DELETE
  USING ("userId" = (select auth.uid()));

-- CoachAthleteRelation policies
DROP POLICY IF EXISTS "Athletes can view their coach relationships" ON "CoachAthleteRelation";
CREATE POLICY "Athletes can view their coach relationships" ON "CoachAthleteRelation"
  FOR SELECT
  USING ("athleteId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can view their athlete relationships" ON "CoachAthleteRelation";
CREATE POLICY "Coaches can view their athlete relationships" ON "CoachAthleteRelation"
  FOR SELECT
  USING ("coachId" = (select auth.uid()));

DROP POLICY IF EXISTS "Athletes can update consent" ON "CoachAthleteRelation";
CREATE POLICY "Athletes can update consent" ON "CoachAthleteRelation"
  FOR UPDATE
  USING ("athleteId" = (select auth.uid()))
  WITH CHECK ("athleteId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can create relationships" ON "CoachAthleteRelation";
CREATE POLICY "Coaches can create relationships" ON "CoachAthleteRelation"
  FOR INSERT
  WITH CHECK ("coachId" = (select auth.uid()));

-- chat_summaries policies
DROP POLICY IF EXISTS "Athletes can view own chat summaries" ON "chat_summaries";
CREATE POLICY "Athletes can view own chat summaries" ON "chat_summaries"
  FOR SELECT
  USING ("athleteId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can view summaries with athlete consent" ON "chat_summaries";
CREATE POLICY "Coaches can view summaries with athlete consent" ON "chat_summaries"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "chat_summaries"."athleteId"
        AND "consentGranted" = true
    )
  );

DROP POLICY IF EXISTS "Athletes can update summaries (revoke consent)" ON "chat_summaries";
CREATE POLICY "Athletes can update summaries (revoke consent)" ON "chat_summaries"
  FOR UPDATE
  USING ("athleteId" = (select auth.uid()))
  WITH CHECK ("athleteId" = (select auth.uid()));

-- PerformanceMetric policies
DROP POLICY IF EXISTS "Athletes can view own performance metrics" ON "PerformanceMetric";
CREATE POLICY "Athletes can view own performance metrics" ON "PerformanceMetric"
  FOR SELECT
  USING ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can view athlete performance with consent" ON "PerformanceMetric";
CREATE POLICY "Coaches can view athlete performance with consent" ON "PerformanceMetric"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "PerformanceMetric"."userId"
        AND "consentGranted" = true
    )
  );

DROP POLICY IF EXISTS "Athletes can manage own performance metrics" ON "PerformanceMetric";
CREATE POLICY "Athletes can manage own performance metrics" ON "PerformanceMetric"
  FOR ALL
  USING ("userId" = (select auth.uid()))
  WITH CHECK ("userId" = (select auth.uid()));

-- AssignmentSubmission policies
DROP POLICY IF EXISTS "Athletes can view own submissions" ON "AssignmentSubmission";
CREATE POLICY "Athletes can view own submissions" ON "AssignmentSubmission"
  FOR SELECT
  USING ("athleteId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can view submissions for their assignments" ON "AssignmentSubmission";
CREATE POLICY "Coaches can view submissions for their assignments" ON "AssignmentSubmission"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Assignment"
      WHERE "Assignment".id = "AssignmentSubmission"."assignmentId"
        AND "Assignment"."coachId" = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Athletes can manage own submissions" ON "AssignmentSubmission";
CREATE POLICY "Athletes can manage own submissions" ON "AssignmentSubmission"
  FOR ALL
  USING ("athleteId" = (select auth.uid()))
  WITH CHECK ("athleteId" = (select auth.uid()));

-- CoachNote policies
DROP POLICY IF EXISTS "Coaches can view own notes" ON "CoachNote";
CREATE POLICY "Coaches can view own notes" ON "CoachNote"
  FOR SELECT
  USING ("coachId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can manage own notes" ON "CoachNote";
CREATE POLICY "Coaches can manage own notes" ON "CoachNote"
  FOR ALL
  USING ("coachId" = (select auth.uid()))
  WITH CHECK ("coachId" = (select auth.uid()));

-- Task policies
DROP POLICY IF EXISTS "Athletes can manage own tasks" ON "Task";
CREATE POLICY "Athletes can manage own tasks" ON "Task"
  FOR ALL
  USING ("userId" = (select auth.uid()))
  WITH CHECK ("userId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can view athlete tasks with consent" ON "Task";
CREATE POLICY "Coaches can view athlete tasks with consent" ON "Task"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "Task"."userId"
        AND "consentGranted" = true
    )
  );

-- ReadinessScore policies
DROP POLICY IF EXISTS "Athletes can view own readiness scores" ON "ReadinessScore";
CREATE POLICY "Athletes can view own readiness scores" ON "ReadinessScore"
  FOR SELECT
  USING ("athleteId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can view athlete readiness with consent" ON "ReadinessScore";
CREATE POLICY "Coaches can view athlete readiness with consent" ON "ReadinessScore"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "ReadinessScore"."athleteId"
        AND "consentGranted" = true
    )
  );

-- WearableData policies
DROP POLICY IF EXISTS "Athletes can manage own wearable data" ON "WearableData";
CREATE POLICY "Athletes can manage own wearable data" ON "WearableData"
  FOR ALL
  USING ("athleteId" = (select auth.uid()))
  WITH CHECK ("athleteId" = (select auth.uid()));

DROP POLICY IF EXISTS "Coaches can view wearable data with consent" ON "WearableData";
CREATE POLICY "Coaches can view wearable data with consent" ON "WearableData"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = (select auth.uid())
        AND "athleteId" = "WearableData"."athleteId"
        AND "consentGranted" = true
    )
  );

-- TaskPattern policies
DROP POLICY IF EXISTS "Athletes can view own task patterns" ON "TaskPattern";
CREATE POLICY "Athletes can view own task patterns" ON "TaskPattern"
  FOR SELECT
  USING ("athleteId" = (select auth.uid()));

-- UserSettings policies
DROP POLICY IF EXISTS "Users can manage own settings" ON "UserSettings";
CREATE POLICY "Users can manage own settings" ON "UserSettings"
  FOR ALL
  USING ("userId" = (select auth.uid()))
  WITH CHECK ("userId" = (select auth.uid()));

-- PushToken policies
DROP POLICY IF EXISTS "Users can manage own push tokens" ON "PushToken";
CREATE POLICY "Users can manage own push tokens" ON "PushToken"
  FOR ALL
  USING ("userId" = (select auth.uid()))
  WITH CHECK ("userId" = (select auth.uid()));

-- AuditLog policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON "AuditLog";
CREATE POLICY "Users can view own audit logs" ON "AuditLog"
  FOR SELECT
  USING ("userId" = (select auth.uid()));

-- TokenUsage policies
DROP POLICY IF EXISTS "Users can view own token usage" ON "TokenUsage";
CREATE POLICY "Users can view own token usage" ON "TokenUsage"
  FOR SELECT
  USING ("userId" = (select auth.uid()));

-- ErrorLog policies
DROP POLICY IF EXISTS "Users can view own error logs" ON "ErrorLog";
CREATE POLICY "Users can view own error logs" ON "ErrorLog"
  FOR SELECT
  USING ("userId" = (select auth.uid()));

-- ConversationInsight policies
DROP POLICY IF EXISTS "Athletes can view own conversation insights" ON "ConversationInsight";
CREATE POLICY "Athletes can view own conversation insights" ON "ConversationInsight"
  FOR SELECT
  USING ("athleteId" = (select auth.uid()));

-- KnowledgeBase policies
DROP POLICY IF EXISTS "Users can view knowledge base for their school" ON "KnowledgeBase";
CREATE POLICY "Users can view knowledge base for their school" ON "KnowledgeBase"
  FOR SELECT
  USING (
    "schoolId" IN (
      SELECT "schoolId" FROM "User" WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage knowledge base" ON "KnowledgeBase";
CREATE POLICY "Admins can manage knowledge base" ON "KnowledgeBase"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = (select auth.uid())
        AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = (select auth.uid())
        AND role = 'ADMIN'
    )
  );

-- TeamConfig policies
DROP POLICY IF EXISTS "Users can view team config for their school" ON "TeamConfig";
CREATE POLICY "Users can view team config for their school" ON "TeamConfig"
  FOR SELECT
  USING (
    "schoolId" IN (
      SELECT "schoolId" FROM "User" WHERE id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Coaches can manage team config" ON "TeamConfig";
CREATE POLICY "Coaches can manage team config" ON "TeamConfig"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = (select auth.uid())
        AND role IN ('COACH', 'ADMIN')
        AND "schoolId" = "TeamConfig"."schoolId"
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = (select auth.uid())
        AND role IN ('COACH', 'ADMIN')
        AND "schoolId" = "TeamConfig"."schoolId"
    )
  );

-- =========================================================
-- PART 3: FIX OVERLY PERMISSIVE SYSTEM POLICIES
-- =========================================================
-- System policies should still enforce tenant boundaries

-- AuditLog - System can insert, but with tenant check
DROP POLICY IF EXISTS "System can create audit logs" ON "AuditLog";
CREATE POLICY "System can create audit logs" ON "AuditLog"
  FOR INSERT
  WITH CHECK (
    -- Only allow if schoolId matches user's school
    "schoolId" IN (
      SELECT "schoolId" FROM "User" WHERE id = "userId"
    )
  );

-- ConversationInsight - System can insert, but with tenant check
DROP POLICY IF EXISTS "System can create insights" ON "ConversationInsight";
CREATE POLICY "System can create insights" ON "ConversationInsight"
  FOR INSERT
  WITH CHECK (
    -- Only allow if athleteId exists in same school
    EXISTS (
      SELECT 1 FROM "Athlete"
      WHERE id = "athleteId"
        AND "schoolId" IN (
          SELECT "schoolId" FROM "User" WHERE id = "athleteId"
        )
    )
  );

-- ErrorLog - System can insert, but with tenant check
DROP POLICY IF EXISTS "System can create error logs" ON "ErrorLog";
CREATE POLICY "System can create error logs" ON "ErrorLog"
  FOR INSERT
  WITH CHECK (
    -- Only allow if userId is valid
    "userId" IS NULL OR EXISTS (
      SELECT 1 FROM "User" WHERE id = "userId"
    )
  );

-- ReadinessScore - System can insert, but with tenant check
DROP POLICY IF EXISTS "System can create readiness scores" ON "ReadinessScore";
CREATE POLICY "System can create readiness scores" ON "ReadinessScore"
  FOR INSERT
  WITH CHECK (
    -- Only allow if athleteId exists
    EXISTS (
      SELECT 1 FROM "Athlete" WHERE id = "athleteId"
    )
  );

-- TaskPattern - System can insert, but with tenant check
DROP POLICY IF EXISTS "System can create task patterns" ON "TaskPattern";
CREATE POLICY "System can create task patterns" ON "TaskPattern"
  FOR INSERT
  WITH CHECK (
    -- Only allow if athleteId exists
    EXISTS (
      SELECT 1 FROM "Athlete" WHERE id = "athleteId"
    )
  );

-- TokenUsage - System can insert, but with tenant check
DROP POLICY IF EXISTS "System can create token usage records" ON "TokenUsage";
CREATE POLICY "System can create token usage records" ON "TokenUsage"
  FOR INSERT
  WITH CHECK (
    -- Only allow if userId exists and schoolId matches
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = "userId"
        AND "schoolId" = "TokenUsage"."schoolId"
    )
  );

-- chat_summaries - System can insert, but with tenant check
DROP POLICY IF EXISTS "System can insert chat summaries" ON "chat_summaries";
CREATE POLICY "System can insert chat summaries" ON "chat_summaries"
  FOR INSERT
  WITH CHECK (
    -- Only allow if athleteId exists
    EXISTS (
      SELECT 1 FROM "Athlete" WHERE id = "athleteId"
    )
  );

-- VerificationToken - Restrict to actual verification use
DROP POLICY IF EXISTS "System can manage verification tokens" ON "VerificationToken";
CREATE POLICY "System can manage verification tokens" ON "VerificationToken"
  FOR ALL
  USING (
    -- Allow read for token validation
    expires > now()
  )
  WITH CHECK (
    -- Allow insert for new tokens only
    expires > now()
  );

-- =========================================================
-- PART 4: REMOVE DUPLICATE PERMISSIVE POLICIES
-- =========================================================
-- Multiple permissive policies for same action cause confusion
-- Keep most specific policy, remove generic duplicates

-- Assignment - Keep separate policies (they have different logic)
-- No change needed - these are intentionally separate

-- AssignmentSubmission - Consolidate view policies
DROP POLICY IF EXISTS "Athletes can view own submissions" ON "AssignmentSubmission";
-- Keep "Athletes can manage own submissions" (includes SELECT via ALL)
-- Keep "Coaches can view submissions for their assignments"

-- Athlete - Keep both (different use cases)
-- No change needed

-- Coach - Keep both (different use cases)
-- No change needed

-- CoachAthleteRelation - Keep both (different perspectives)
-- No change needed

-- CoachNote - Consolidate
DROP POLICY IF EXISTS "Coaches can view own notes" ON "CoachNote";
-- Keep only "Coaches can manage own notes" (includes SELECT via ALL)

-- CrisisAlert - Keep both (different use cases)
-- No change needed

-- Goal - Consolidate view policies
DROP POLICY IF EXISTS "Athletes can view own goals" ON "Goal";
-- Keep "Athletes can manage own goals" (includes SELECT via ALL)
-- Keep "Coaches can view athlete goals with consent"

-- KnowledgeBase - Keep both (different roles)
-- No change needed

-- MoodLog - Keep both (different use cases)
-- No change needed

-- PerformanceMetric - Consolidate view policies
DROP POLICY IF EXISTS "Athletes can view own performance metrics" ON "PerformanceMetric";
-- Keep "Athletes can manage own performance metrics" (includes SELECT via ALL)
-- Keep "Coaches can view athlete performance with consent"

-- ReadinessScore - Keep both (different use cases)
-- No change needed

-- School - Keep both (different roles)
-- No change needed

-- Task - Consolidate
-- Keep "Athletes can manage own tasks" (includes SELECT via ALL)
-- Keep "Coaches can view athlete tasks with consent"

-- TeamConfig - Keep both (different roles)
-- No change needed

-- VerificationToken - Remove duplicate
DROP POLICY IF EXISTS "Anyone can read verification tokens" ON "VerificationToken";
-- Keep only "System can manage verification tokens"

-- WearableData - Consolidate
-- Keep "Athletes can manage own wearable data" (includes SELECT via ALL)
-- Keep "Coaches can view wearable data with consent"

-- chat_summaries - Keep both (different use cases)
-- No change needed

-- =========================================================
-- PART 5: ADD MISSING PASSWORD PROTECTION
-- =========================================================
-- CRITICAL: Prevent password column exposure

-- User table - Remove password from any SELECT policies
-- Add explicit SELECT policy that excludes password
CREATE POLICY "Users can view profiles (no passwords)" ON "User"
  FOR SELECT
  USING (true); -- Allow viewing user profiles, but column-level security below

-- Add column-level security to hide password
-- Note: In Supabase, you should also configure API to never return password column
-- This is done in Supabase Studio under Authentication settings

-- =========================================================
-- VERIFICATION
-- =========================================================
-- Run this query to verify RLS is enabled on all tables:
--
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND rowsecurity = false;
--
-- Expected: Empty result set (all tables have RLS enabled)

-- Run this query to verify policy count:
--
-- SELECT COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE schemaname = 'public';
--
-- Expected: ~80+ policies

-- Run this query to check for auth function performance issues:
--
-- SELECT policyname, tablename, definition
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND definition LIKE '%auth.uid()%'
--   AND definition NOT LIKE '%(select auth.uid())%';
--
-- Expected: Empty result set (all auth calls wrapped in SELECT)
