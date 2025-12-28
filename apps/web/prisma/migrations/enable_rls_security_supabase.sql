-- Enable Row Level Security on all tables for Supabase
-- This migration enforces multi-tenant isolation and role-based access control
-- Compatible with Supabase SQL Editor (no auth schema functions)

-- ============================================================================
-- ACCOUNT TABLE (NextAuth sessions)
-- ============================================================================
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts"
  ON "Account" FOR SELECT
  USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can insert own accounts"
  ON "Account" FOR INSERT
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete own accounts"
  ON "Account" FOR DELETE
  USING ("userId" = auth.uid()::text);

-- ============================================================================
-- SESSION TABLE (NextAuth sessions)
-- ============================================================================
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON "Session" FOR SELECT
  USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can insert own sessions"
  ON "Session" FOR INSERT
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete own sessions"
  ON "Session" FOR DELETE
  USING ("userId" = auth.uid()::text);

-- ============================================================================
-- USER TABLE
-- ============================================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view users in same school"
  ON "User" FOR SELECT
  USING (
    "schoolId" = (
      SELECT "schoolId" FROM "User" WHERE id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own profile"
  ON "User" FOR UPDATE
  USING (id = auth.uid()::text);

CREATE POLICY "Anyone can insert users (signup)"
  ON "User" FOR INSERT
  WITH CHECK (true); -- Signup is public, application logic validates

-- ============================================================================
-- ATHLETE TABLE
-- ============================================================================
ALTER TABLE "Athlete" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view own profile"
  ON "Athlete" FOR SELECT
  USING ("userId" = auth.uid()::text);

CREATE POLICY "Coaches can view assigned athletes"
  ON "Athlete" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation" car
      WHERE car."athleteId" = "Athlete"."userId"
        AND car."coachId" = auth.uid()::text
        AND car."consentGranted" = true
    )
  );

CREATE POLICY "Athletes can update own profile"
  ON "Athlete" FOR UPDATE
  USING ("userId" = auth.uid()::text);

CREATE POLICY "Athletes can insert own profile"
  ON "Athlete" FOR INSERT
  WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- COACH TABLE
-- ============================================================================
ALTER TABLE "Coach" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own profile"
  ON "Coach" FOR SELECT
  USING ("userId" = auth.uid()::text);

CREATE POLICY "Athletes can view their coaches"
  ON "Coach" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation" car
      WHERE car."coachId" = "Coach"."userId"
        AND car."athleteId" = auth.uid()::text
    )
  );

CREATE POLICY "Coaches can update own profile"
  ON "Coach" FOR UPDATE
  USING ("userId" = auth.uid()::text);

CREATE POLICY "Coaches can insert own profile"
  ON "Coach" FOR INSERT
  WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- COACH-ATHLETE RELATION TABLE
-- ============================================================================
ALTER TABLE "CoachAthleteRelation" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view their coach relationships"
  ON "CoachAthleteRelation" FOR SELECT
  USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view their athlete relationships"
  ON "CoachAthleteRelation" FOR SELECT
  USING ("coachId" = auth.uid()::text);

CREATE POLICY "Athletes can update consent"
  ON "CoachAthleteRelation" FOR UPDATE
  USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can create relationships"
  ON "CoachAthleteRelation" FOR INSERT
  WITH CHECK ("coachId" = auth.uid()::text);

-- ============================================================================
-- CHAT SESSION TABLE
-- ============================================================================
ALTER TABLE "ChatSession" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view own chat sessions"
  ON "ChatSession" FOR SELECT
  USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Athletes can create own chat sessions"
  ON "ChatSession" FOR INSERT
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Athletes can update own chat sessions"
  ON "ChatSession" FOR UPDATE
  USING ("athleteId" = auth.uid()::text);

-- ============================================================================
-- MESSAGE TABLE
-- ============================================================================
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view messages in own sessions"
  ON "Message" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "ChatSession" cs
      WHERE cs.id = "Message"."sessionId"
        AND cs."athleteId" = auth.uid()::text
    )
  );

CREATE POLICY "Athletes can create messages in own sessions"
  ON "Message" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatSession" cs
      WHERE cs.id = "Message"."sessionId"
        AND cs."athleteId" = auth.uid()::text
    )
  );

-- ============================================================================
-- CHAT SUMMARY TABLE (Privacy-sensitive)
-- ============================================================================
ALTER TABLE "ChatSummary" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view own chat summaries"
  ON "ChatSummary" FOR SELECT
  USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view summaries with athlete consent"
  ON "ChatSummary" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Athlete" a
      JOIN "CoachAthleteRelation" car ON car."athleteId" = a."userId"
      WHERE a."userId" = "ChatSummary"."athleteId"
        AND car."coachId" = auth.uid()::text
        AND a."consentChatSummaries" = true
        AND "ChatSummary"."revokedAt" IS NULL
        AND "ChatSummary"."expiresAt" > NOW()
    )
  );

CREATE POLICY "System can insert chat summaries"
  ON "ChatSummary" FOR INSERT
  WITH CHECK (true); -- Generated by backend

CREATE POLICY "Athletes can update summaries (revoke consent)"
  ON "ChatSummary" FOR UPDATE
  USING ("athleteId" = auth.uid()::text);

-- ============================================================================
-- MOOD LOG TABLE
-- ============================================================================
ALTER TABLE "MoodLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view own mood logs"
  ON "MoodLog" FOR SELECT
  USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view mood logs with consent"
  ON "MoodLog" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation" car
      WHERE car."athleteId" = "MoodLog"."athleteId"
        AND car."coachId" = auth.uid()::text
        AND car."consentGranted" = true
    )
  );

CREATE POLICY "Athletes can create own mood logs"
  ON "MoodLog" FOR INSERT
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Athletes can delete own mood logs"
  ON "MoodLog" FOR DELETE
  USING ("athleteId" = auth.uid()::text);

-- ============================================================================
-- GOAL TABLE
-- ============================================================================
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view own goals"
  ON "Goal" FOR SELECT
  USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view athlete goals with consent"
  ON "Goal" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation" car
      WHERE car."athleteId" = "Goal"."athleteId"
        AND car."coachId" = auth.uid()::text
        AND car."consentGranted" = true
    )
  );

CREATE POLICY "Athletes can manage own goals"
  ON "Goal" FOR ALL
  USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

-- ============================================================================
-- PERFORMANCE METRIC TABLE
-- ============================================================================
ALTER TABLE "PerformanceMetric" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view own performance metrics"
  ON "PerformanceMetric" FOR SELECT
  USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view athlete performance with consent"
  ON "PerformanceMetric" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation" car
      WHERE car."athleteId" = "PerformanceMetric"."athleteId"
        AND car."coachId" = auth.uid()::text
        AND car."consentGranted" = true
    )
  );

CREATE POLICY "Athletes can manage own performance metrics"
  ON "PerformanceMetric" FOR ALL
  USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

-- ============================================================================
-- CRISIS ALERT TABLE (High sensitivity)
-- ============================================================================
ALTER TABLE "CrisisAlert" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view own crisis alerts"
  ON "CrisisAlert" FOR SELECT
  USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view crisis alerts for their athletes"
  ON "CrisisAlert" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation" car
      WHERE car."athleteId" = "CrisisAlert"."athleteId"
        AND car."coachId" = auth.uid()::text
    )
  );

CREATE POLICY "System can create crisis alerts"
  ON "CrisisAlert" FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Coaches can update crisis alerts (review)"
  ON "CrisisAlert" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation" car
      WHERE car."athleteId" = "CrisisAlert"."athleteId"
        AND car."coachId" = auth.uid()::text
    )
  );

-- ============================================================================
-- ASSIGNMENT TABLE
-- ============================================================================
ALTER TABLE "Assignment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own assignments"
  ON "Assignment" FOR SELECT
  USING ("coachId" = auth.uid()::text);

CREATE POLICY "Athletes can view assignments targeted to them"
  ON "Assignment" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation" car
      WHERE car."coachId" = "Assignment"."coachId"
        AND car."athleteId" = auth.uid()::text
    )
  );

CREATE POLICY "Coaches can manage own assignments"
  ON "Assignment" FOR ALL
  USING ("coachId" = auth.uid()::text)
  WITH CHECK ("coachId" = auth.uid()::text);

-- ============================================================================
-- ASSIGNMENT SUBMISSION TABLE
-- ============================================================================
ALTER TABLE "AssignmentSubmission" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view own submissions"
  ON "AssignmentSubmission" FOR SELECT
  USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view submissions for their assignments"
  ON "AssignmentSubmission" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Assignment" a
      WHERE a.id = "AssignmentSubmission"."assignmentId"
        AND a."coachId" = auth.uid()::text
    )
  );

CREATE POLICY "Athletes can manage own submissions"
  ON "AssignmentSubmission" FOR ALL
  USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

-- ============================================================================
-- COACH NOTE TABLE (Private notes)
-- ============================================================================
ALTER TABLE "CoachNote" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own notes"
  ON "CoachNote" FOR SELECT
  USING ("coachId" = auth.uid()::text);

CREATE POLICY "Coaches can manage own notes"
  ON "CoachNote" FOR ALL
  USING ("coachId" = auth.uid()::text)
  WITH CHECK ("coachId" = auth.uid()::text);

-- ============================================================================
-- TASK TABLE
-- ============================================================================
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can manage own tasks"
  ON "Task" FOR ALL
  USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view athlete tasks with consent"
  ON "Task" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation" car
      WHERE car."athleteId" = "Task"."athleteId"
        AND car."coachId" = auth.uid()::text
        AND car."consentGranted" = true
    )
  );

-- ============================================================================
-- READINESS SCORE TABLE
-- ============================================================================
ALTER TABLE "ReadinessScore" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view own readiness scores"
  ON "ReadinessScore" FOR SELECT
  USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view athlete readiness with consent"
  ON "ReadinessScore" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation" car
      WHERE car."athleteId" = "ReadinessScore"."athleteId"
        AND car."coachId" = auth.uid()::text
        AND car."consentGranted" = true
    )
  );

CREATE POLICY "System can create readiness scores"
  ON "ReadinessScore" FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- WEARABLE DATA TABLE
-- ============================================================================
ALTER TABLE "WearableData" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can manage own wearable data"
  ON "WearableData" FOR ALL
  USING ("athleteId" = auth.uid()::text)
  WITH CHECK ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view wearable data with consent"
  ON "WearableData" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation" car
      WHERE car."athleteId" = "WearableData"."athleteId"
        AND car."coachId" = auth.uid()::text
        AND car."consentGranted" = true
    )
  );

-- ============================================================================
-- TASK PATTERN TABLE
-- ============================================================================
ALTER TABLE "TaskPattern" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view own task patterns"
  ON "TaskPattern" FOR SELECT
  USING ("athleteId" = auth.uid()::text);

CREATE POLICY "System can create task patterns"
  ON "TaskPattern" FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- USER SETTINGS TABLE
-- ============================================================================
ALTER TABLE "UserSettings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON "UserSettings" FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- PUSH TOKEN TABLE
-- ============================================================================
ALTER TABLE "PushToken" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push tokens"
  ON "PushToken" FOR ALL
  USING ("userId" = auth.uid()::text)
  WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- AUDIT LOG TABLE (Read-only for users)
-- ============================================================================
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON "AuditLog" FOR SELECT
  USING (
    "userId" = auth.uid()::text OR
    (SELECT role FROM "User" WHERE id = auth.uid()::text) = 'ADMIN'
  );

CREATE POLICY "System can create audit logs"
  ON "AuditLog" FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- TOKEN USAGE TABLE
-- ============================================================================
ALTER TABLE "TokenUsage" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own token usage"
  ON "TokenUsage" FOR SELECT
  USING (
    "userId" = auth.uid()::text OR
    (SELECT role FROM "User" WHERE id = auth.uid()::text) = 'ADMIN'
  );

CREATE POLICY "System can create token usage records"
  ON "TokenUsage" FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- ERROR LOG TABLE
-- ============================================================================
ALTER TABLE "ErrorLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own error logs"
  ON "ErrorLog" FOR SELECT
  USING (
    "userId" = auth.uid()::text OR
    (SELECT role FROM "User" WHERE id = auth.uid()::text) = 'ADMIN'
  );

CREATE POLICY "System can create error logs"
  ON "ErrorLog" FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- CONVERSATION INSIGHT TABLE
-- ============================================================================
ALTER TABLE "ConversationInsight" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view own conversation insights"
  ON "ConversationInsight" FOR SELECT
  USING ("athleteId" = auth.uid()::text);

CREATE POLICY "System can create insights"
  ON "ConversationInsight" FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- SCHOOL TABLE (Multi-tenant boundary)
-- ============================================================================
ALTER TABLE "School" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own school"
  ON "School" FOR SELECT
  USING (
    id = (SELECT "schoolId" FROM "User" WHERE id = auth.uid()::text)
  );

CREATE POLICY "Admins can manage schools"
  ON "School" FOR ALL
  USING ((SELECT role FROM "User" WHERE id = auth.uid()::text) = 'ADMIN')
  WITH CHECK ((SELECT role FROM "User" WHERE id = auth.uid()::text) = 'ADMIN');

-- ============================================================================
-- KNOWLEDGE BASE TABLE
-- ============================================================================
ALTER TABLE "KnowledgeBase" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view knowledge base for their school"
  ON "KnowledgeBase" FOR SELECT
  USING (
    "schoolId" IS NULL OR
    "schoolId" = (SELECT "schoolId" FROM "User" WHERE id = auth.uid()::text)
  );

CREATE POLICY "Admins can manage knowledge base"
  ON "KnowledgeBase" FOR ALL
  USING ((SELECT role FROM "User" WHERE id = auth.uid()::text) = 'ADMIN')
  WITH CHECK ((SELECT role FROM "User" WHERE id = auth.uid()::text) = 'ADMIN');

-- ============================================================================
-- TEAM CONFIG TABLE
-- ============================================================================
ALTER TABLE "TeamConfig" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team config for their school"
  ON "TeamConfig" FOR SELECT
  USING (
    "schoolId" = (SELECT "schoolId" FROM "User" WHERE id = auth.uid()::text)
  );

CREATE POLICY "Coaches can manage team config"
  ON "TeamConfig" FOR ALL
  USING (
    (SELECT role FROM "User" WHERE id = auth.uid()::text) IN ('COACH', 'ADMIN')
    AND "schoolId" = (SELECT "schoolId" FROM "User" WHERE id = auth.uid()::text)
  )
  WITH CHECK (
    (SELECT role FROM "User" WHERE id = auth.uid()::text) IN ('COACH', 'ADMIN')
    AND "schoolId" = (SELECT "schoolId" FROM "User" WHERE id = auth.uid()::text)
  );

-- ============================================================================
-- VERIFICATION TOKEN TABLE (NextAuth)
-- ============================================================================
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read verification tokens"
  ON "VerificationToken" FOR SELECT
  USING (true);

CREATE POLICY "System can manage verification tokens"
  ON "VerificationToken" FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Indexes for performance on RLS queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_auth_uid ON "User"(id) WHERE id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coach_athlete_consent ON "CoachAthleteRelation"("athleteId", "coachId", "consentGranted");
CREATE INDEX IF NOT EXISTS idx_athlete_consent_summaries ON "Athlete"("userId", "consentChatSummaries");
CREATE INDEX IF NOT EXISTS idx_chat_summary_revoked ON "ChatSummary"("athleteId", "revokedAt", "expiresAt");
