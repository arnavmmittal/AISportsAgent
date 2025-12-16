-- =====================================================
-- Row-Level Security (RLS) Setup for AI Sports Agent
-- =====================================================
-- This migration enables RLS on all tables and creates
-- policies to ensure:
-- 1. Athletes can only see their own data
-- 2. Coaches can only see athletes who granted consent
-- 3. Admins can see everything (via service_role key)
--
-- Execute this in Supabase Dashboard → SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: Enable RLS on all tables
-- =====================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Athlete" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coach" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MoodLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatSummary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrisisAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoachAthleteRelation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssignmentSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: User Table Policies
-- =====================================================

-- Athletes can view their own profile
CREATE POLICY "Athletes can view own profile"
ON "User"
FOR SELECT
USING (auth.uid()::text = id AND role = 'ATHLETE');

-- Coaches can view their own profile
CREATE POLICY "Coaches can view own profile"
ON "User"
FOR SELECT
USING (auth.uid()::text = id AND role = 'COACH');

-- Admins can view their own profile
CREATE POLICY "Admins can view own profile"
ON "User"
FOR SELECT
USING (auth.uid()::text = id AND role = 'ADMIN');

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON "User"
FOR UPDATE
USING (auth.uid()::text = id);

-- =====================================================
-- STEP 3: Athlete Table Policies
-- =====================================================

-- Athletes can view their own athlete record
CREATE POLICY "Athletes can view own athlete data"
ON "Athlete"
FOR SELECT
USING (auth.uid()::text = "userId");

-- Athletes can update their own athlete record
CREATE POLICY "Athletes can update own athlete data"
ON "Athlete"
FOR UPDATE
USING (auth.uid()::text = "userId");

-- Coaches can view athletes with consent
CREATE POLICY "Coaches can view consenting athletes"
ON "Athlete"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "CoachAthleteRelation" car
    WHERE car."athleteId" = "Athlete"."userId"
    AND car."coachId" = auth.uid()::text
    AND car."consentGranted" = true
  )
);

-- =====================================================
-- STEP 4: Coach Table Policies
-- =====================================================

-- Coaches can view their own coach record
CREATE POLICY "Coaches can view own coach data"
ON "Coach"
FOR SELECT
USING (auth.uid()::text = "userId");

-- Coaches can update their own coach record
CREATE POLICY "Coaches can update own coach data"
ON "Coach"
FOR UPDATE
USING (auth.uid()::text = "userId");

-- =====================================================
-- STEP 5: MoodLog Policies
-- =====================================================

-- Athletes can manage their own mood logs
CREATE POLICY "Athletes can manage own mood logs"
ON "MoodLog"
FOR ALL
USING (auth.uid()::text = "athleteId");

-- Coaches can view mood logs of consenting athletes
CREATE POLICY "Coaches can view consenting athlete mood logs"
ON "MoodLog"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "CoachAthleteRelation" car
    WHERE car."athleteId" = "MoodLog"."athleteId"
    AND car."coachId" = auth.uid()::text
    AND car."consentGranted" = true
  )
);

-- =====================================================
-- STEP 6: Goal Policies
-- =====================================================

-- Athletes can manage their own goals
CREATE POLICY "Athletes can manage own goals"
ON "Goal"
FOR ALL
USING (auth.uid()::text = "athleteId");

-- Coaches can view goals of consenting athletes
CREATE POLICY "Coaches can view consenting athlete goals"
ON "Goal"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "CoachAthleteRelation" car
    WHERE car."athleteId" = "Goal"."athleteId"
    AND car."coachId" = auth.uid()::text
    AND car."consentGranted" = true
  )
);

-- =====================================================
-- STEP 7: ChatSession Policies
-- =====================================================

-- Athletes can manage their own chat sessions
CREATE POLICY "Athletes can manage own chat sessions"
ON "ChatSession"
FOR ALL
USING (auth.uid()::text = "athleteId");

-- Coaches can view chat sessions of consenting athletes (summary only)
CREATE POLICY "Coaches can view consenting athlete sessions"
ON "ChatSession"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "CoachAthleteRelation" car
    JOIN "Athlete" a ON a."userId" = car."athleteId"
    WHERE car."athleteId" = "ChatSession"."athleteId"
    AND car."coachId" = auth.uid()::text
    AND car."consentGranted" = true
    AND a."consentChatSummaries" = true
  )
);

-- =====================================================
-- STEP 8: Message Policies
-- =====================================================

-- Athletes can manage their own messages
CREATE POLICY "Athletes can manage own messages"
ON "Message"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "ChatSession"
    WHERE "ChatSession".id = "Message"."sessionId"
    AND "ChatSession"."athleteId" = auth.uid()::text
  )
);

-- Coaches CANNOT view individual messages (privacy protection)
-- They can only view summaries via ChatSummary table

-- =====================================================
-- STEP 9: ChatSummary Policies
-- =====================================================

-- Athletes can view their own summaries
CREATE POLICY "Athletes can view own summaries"
ON "ChatSummary"
FOR SELECT
USING (auth.uid()::text = "athleteId");

-- Coaches can view summaries of consenting athletes
CREATE POLICY "Coaches can view consenting athlete summaries"
ON "ChatSummary"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "CoachAthleteRelation" car
    JOIN "Athlete" a ON a."userId" = car."athleteId"
    WHERE car."athleteId" = "ChatSummary"."athleteId"
    AND car."coachId" = auth.uid()::text
    AND car."consentGranted" = true
    AND a."consentChatSummaries" = true
  )
);

-- =====================================================
-- STEP 10: CrisisAlert Policies
-- =====================================================

-- Athletes can view their own crisis alerts
CREATE POLICY "Athletes can view own crisis alerts"
ON "CrisisAlert"
FOR SELECT
USING (auth.uid()::text = "athleteId");

-- Coaches can view crisis alerts for athletes under their care
CREATE POLICY "Coaches can view athlete crisis alerts"
ON "CrisisAlert"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "CoachAthleteRelation" car
    WHERE car."athleteId" = "CrisisAlert"."athleteId"
    AND car."coachId" = auth.uid()::text
    AND car."consentGranted" = true
  )
);

-- System can insert crisis alerts (via service_role)

-- =====================================================
-- STEP 11: CoachAthleteRelation Policies
-- =====================================================

-- Athletes can view their own coach relations
CREATE POLICY "Athletes can view own coach relations"
ON "CoachAthleteRelation"
FOR SELECT
USING (auth.uid()::text = "athleteId");

-- Athletes can update consent on their own relations
CREATE POLICY "Athletes can update own consent"
ON "CoachAthleteRelation"
FOR UPDATE
USING (auth.uid()::text = "athleteId");

-- Coaches can view their own athlete relations
CREATE POLICY "Coaches can view own athlete relations"
ON "CoachAthleteRelation"
FOR SELECT
USING (auth.uid()::text = "coachId");

-- Coaches can create new athlete relations (invite athletes)
CREATE POLICY "Coaches can create athlete relations"
ON "CoachAthleteRelation"
FOR INSERT
WITH CHECK (auth.uid()::text = "coachId");

-- =====================================================
-- STEP 12: Assignment Policies
-- =====================================================

-- Coaches can manage their own assignments
CREATE POLICY "Coaches can manage own assignments"
ON "Assignment"
FOR ALL
USING (auth.uid()::text = "coachId");

-- Athletes can view assignments assigned to them
CREATE POLICY "Athletes can view assigned assignments"
ON "Assignment"
FOR SELECT
USING (auth.uid()::text = "athleteId");

-- =====================================================
-- STEP 13: AssignmentSubmission Policies
-- =====================================================

-- Athletes can manage their own assignment submissions
CREATE POLICY "Athletes can manage own submissions"
ON "AssignmentSubmission"
FOR ALL
USING (auth.uid()::text = "athleteId");

-- Coaches can view submissions for their assignments
CREATE POLICY "Coaches can view assignment submissions"
ON "AssignmentSubmission"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Assignment" a
    WHERE a.id = "AssignmentSubmission"."assignmentId"
    AND a."coachId" = auth.uid()::text
  )
);

-- =====================================================
-- STEP 14: AuditLog Policies
-- =====================================================

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
ON "AuditLog"
FOR SELECT
USING (auth.uid()::text = "userId");

-- System can insert audit logs (via service_role)

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify RLS is enabled:

-- Check RLS is enabled on all tables
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('User', 'Athlete', 'Coach', 'MoodLog', 'Goal', 'ChatSession', 'Message', 'ChatSummary', 'CrisisAlert', 'CoachAthleteRelation', 'Assignment', 'AssignmentSubmission', 'AuditLog');

-- List all policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Admin operations should use SUPABASE_SERVICE_ROLE_KEY
--    which bypasses all RLS policies
--
-- 2. All policies use auth.uid()::text which returns the
--    authenticated user's ID from JWT token
--
-- 3. Coaches can only see athlete data if:
--    - CoachAthleteRelation.consentGranted = true
--    - For chat summaries: Athlete.consentChatSummaries = true
--
-- 4. Individual chat messages are NEVER visible to coaches
--    (only summaries)
--
-- 5. Crisis alerts are visible to coaches even without
--    chat summary consent (safety override)
-- =====================================================
