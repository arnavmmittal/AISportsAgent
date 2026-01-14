-- ============================================================================
-- Row Level Security (RLS) Policies for AI Sports Agent
--
-- Purpose: Protect sensitive data at the database level
-- Note: These policies work WITH the seeded accounts (coach@uw.edu, athlete1@uw.edu, etc.)
--
-- Key principle: auth.uid() returns the Supabase Auth user ID, which matches
-- our Prisma User.id (we sync them in the seed script)
-- ============================================================================

-- ============================================================================
-- 1. USER TABLE
-- Users can read their own profile, admins can read all
-- ============================================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Users can read their own row (CRITICAL for login - middleware reads role)
CREATE POLICY "Users can read own profile"
  ON "User"
  FOR SELECT
  USING (auth.uid()::text = id);

-- Users can update their own row
CREATE POLICY "Users can update own profile"
  ON "User"
  FOR UPDATE
  USING (auth.uid()::text = id);

-- Service role can do anything (for admin operations, seeding)
CREATE POLICY "Service role has full access to User"
  ON "User"
  FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================================
-- 2. ATHLETE TABLE
-- Athletes can read/update their own profile
-- Coaches can read athletes in their school (for dashboard)
-- ============================================================================
ALTER TABLE "Athlete" ENABLE ROW LEVEL SECURITY;

-- Athletes can read their own profile
CREATE POLICY "Athletes can read own profile"
  ON "Athlete"
  FOR SELECT
  USING (auth.uid()::text = "userId");

-- Athletes can update their own profile
CREATE POLICY "Athletes can update own profile"
  ON "Athlete"
  FOR UPDATE
  USING (auth.uid()::text = "userId");

-- Coaches can read athletes in their school
CREATE POLICY "Coaches can read athletes in same school"
  ON "Athlete"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "User" coach_user
      JOIN "User" athlete_user ON athlete_user.id = "Athlete"."userId"
      WHERE coach_user.id = auth.uid()::text
      AND coach_user.role IN ('COACH', 'ADMIN')
      AND coach_user."schoolId" = athlete_user."schoolId"
    )
  );

-- Service role bypass
CREATE POLICY "Service role has full access to Athlete"
  ON "Athlete"
  FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================================
-- 3. COACH TABLE
-- Coaches can read their own profile
-- ============================================================================
ALTER TABLE "Coach" ENABLE ROW LEVEL SECURITY;

-- Coaches can read their own profile
CREATE POLICY "Coaches can read own profile"
  ON "Coach"
  FOR SELECT
  USING (auth.uid()::text = "userId");

-- Coaches can update their own profile
CREATE POLICY "Coaches can update own profile"
  ON "Coach"
  FOR UPDATE
  USING (auth.uid()::text = "userId");

-- Service role bypass
CREATE POLICY "Service role has full access to Coach"
  ON "Coach"
  FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================================
-- 4. CHAT SESSION TABLE
-- Athletes can read/create their own sessions
-- Coaches can read sessions of athletes who granted consent
-- ============================================================================
ALTER TABLE "ChatSession" ENABLE ROW LEVEL SECURITY;

-- Athletes can read their own chat sessions
CREATE POLICY "Athletes can read own sessions"
  ON "ChatSession"
  FOR SELECT
  USING (auth.uid()::text = "athleteId");

-- Athletes can create their own chat sessions
CREATE POLICY "Athletes can create own sessions"
  ON "ChatSession"
  FOR INSERT
  WITH CHECK (auth.uid()::text = "athleteId");

-- Athletes can update their own chat sessions
CREATE POLICY "Athletes can update own sessions"
  ON "ChatSession"
  FOR UPDATE
  USING (auth.uid()::text = "athleteId");

-- Coaches can read sessions of consented athletes
CREATE POLICY "Coaches can read consented athlete sessions"
  ON "ChatSession"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation" car
      JOIN "User" u ON u.id = auth.uid()::text
      WHERE car."coachId" = u.id
      AND car."athleteId" = "ChatSession"."athleteId"
      AND car."consentGranted" = true
    )
  );

-- Service role bypass
CREATE POLICY "Service role has full access to ChatSession"
  ON "ChatSession"
  FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================================
-- 5. MESSAGE TABLE
-- Athletes can read/create messages in their own sessions
-- Coaches can read messages of consented athletes
-- ============================================================================
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- Athletes can read messages in their own sessions
CREATE POLICY "Athletes can read own messages"
  ON "Message"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "ChatSession" cs
      WHERE cs.id = "Message"."sessionId"
      AND cs."athleteId" = auth.uid()::text
    )
  );

-- Athletes can create messages in their own sessions
CREATE POLICY "Athletes can create messages in own sessions"
  ON "Message"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatSession" cs
      WHERE cs.id = "Message"."sessionId"
      AND cs."athleteId" = auth.uid()::text
    )
  );

-- Coaches can read messages of consented athletes
CREATE POLICY "Coaches can read consented athlete messages"
  ON "Message"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "ChatSession" cs
      JOIN "CoachAthleteRelation" car ON car."athleteId" = cs."athleteId"
      JOIN "User" u ON u.id = auth.uid()::text
      WHERE cs.id = "Message"."sessionId"
      AND car."coachId" = u.id
      AND car."consentGranted" = true
    )
  );

-- Service role bypass
CREATE POLICY "Service role has full access to Message"
  ON "Message"
  FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================================
-- 6. MOOD LOG TABLE
-- Athletes can read/create their own mood logs
-- Coaches can read mood logs of consented athletes
-- ============================================================================
ALTER TABLE "MoodLog" ENABLE ROW LEVEL SECURITY;

-- Athletes can read their own mood logs
CREATE POLICY "Athletes can read own mood logs"
  ON "MoodLog"
  FOR SELECT
  USING (auth.uid()::text = "athleteId");

-- Athletes can create their own mood logs
CREATE POLICY "Athletes can create own mood logs"
  ON "MoodLog"
  FOR INSERT
  WITH CHECK (auth.uid()::text = "athleteId");

-- Athletes can update their own mood logs
CREATE POLICY "Athletes can update own mood logs"
  ON "MoodLog"
  FOR UPDATE
  USING (auth.uid()::text = "athleteId");

-- Coaches can read mood logs of consented athletes
CREATE POLICY "Coaches can read consented athlete mood logs"
  ON "MoodLog"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation" car
      JOIN "User" u ON u.id = auth.uid()::text
      WHERE car."coachId" = u.id
      AND car."athleteId" = "MoodLog"."athleteId"
      AND car."consentGranted" = true
    )
  );

-- Service role bypass
CREATE POLICY "Service role has full access to MoodLog"
  ON "MoodLog"
  FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================================
-- 7. GOAL TABLE
-- Athletes can CRUD their own goals
-- Coaches can read goals of consented athletes
-- ============================================================================
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;

-- Athletes can read their own goals
CREATE POLICY "Athletes can read own goals"
  ON "Goal"
  FOR SELECT
  USING (auth.uid()::text = "athleteId");

-- Athletes can create their own goals
CREATE POLICY "Athletes can create own goals"
  ON "Goal"
  FOR INSERT
  WITH CHECK (auth.uid()::text = "athleteId");

-- Athletes can update their own goals
CREATE POLICY "Athletes can update own goals"
  ON "Goal"
  FOR UPDATE
  USING (auth.uid()::text = "athleteId");

-- Athletes can delete their own goals
CREATE POLICY "Athletes can delete own goals"
  ON "Goal"
  FOR DELETE
  USING (auth.uid()::text = "athleteId");

-- Coaches can read goals of consented athletes
CREATE POLICY "Coaches can read consented athlete goals"
  ON "Goal"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation" car
      JOIN "User" u ON u.id = auth.uid()::text
      WHERE car."coachId" = u.id
      AND car."athleteId" = "Goal"."athleteId"
      AND car."consentGranted" = true
    )
  );

-- Service role bypass
CREATE POLICY "Service role has full access to Goal"
  ON "Goal"
  FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================================
-- 8. CRISIS ALERT TABLE (Most sensitive!)
-- Athletes can read their own alerts
-- Coaches can read/update alerts of their athletes
-- ============================================================================
ALTER TABLE "CrisisAlert" ENABLE ROW LEVEL SECURITY;

-- Athletes can read their own crisis alerts
CREATE POLICY "Athletes can read own alerts"
  ON "CrisisAlert"
  FOR SELECT
  USING (auth.uid()::text = "athleteId");

-- Coaches can read alerts for athletes in their school
CREATE POLICY "Coaches can read alerts for their athletes"
  ON "CrisisAlert"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "User" coach_user
      JOIN "Athlete" a ON a."userId" = "CrisisAlert"."athleteId"
      JOIN "User" athlete_user ON athlete_user.id = a."userId"
      WHERE coach_user.id = auth.uid()::text
      AND coach_user.role IN ('COACH', 'ADMIN')
      AND coach_user."schoolId" = athlete_user."schoolId"
    )
  );

-- Coaches can update (review) alerts
CREATE POLICY "Coaches can update alerts for their athletes"
  ON "CrisisAlert"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "User" coach_user
      JOIN "Athlete" a ON a."userId" = "CrisisAlert"."athleteId"
      JOIN "User" athlete_user ON athlete_user.id = a."userId"
      WHERE coach_user.id = auth.uid()::text
      AND coach_user.role IN ('COACH', 'ADMIN')
      AND coach_user."schoolId" = athlete_user."schoolId"
    )
  );

-- Service role bypass
CREATE POLICY "Service role has full access to CrisisAlert"
  ON "CrisisAlert"
  FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================================
-- 9. SCHOOL TABLE
-- All authenticated users can read schools (for dropdowns, etc.)
-- Only admins can modify
-- ============================================================================
ALTER TABLE "School" ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read schools
CREATE POLICY "Authenticated users can read schools"
  ON "School"
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Service role bypass
CREATE POLICY "Service role has full access to School"
  ON "School"
  FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================================
-- 10. COACH-ATHLETE RELATION TABLE
-- Athletes can read/update their own consent relations
-- Coaches can read relations where they are the coach
-- ============================================================================
ALTER TABLE "CoachAthleteRelation" ENABLE ROW LEVEL SECURITY;

-- Athletes can read their own relations
CREATE POLICY "Athletes can read own relations"
  ON "CoachAthleteRelation"
  FOR SELECT
  USING (auth.uid()::text = "athleteId");

-- Athletes can update their own consent
CREATE POLICY "Athletes can update own consent"
  ON "CoachAthleteRelation"
  FOR UPDATE
  USING (auth.uid()::text = "athleteId");

-- Coaches can read relations where they are the coach
CREATE POLICY "Coaches can read their relations"
  ON "CoachAthleteRelation"
  FOR SELECT
  USING (auth.uid()::text = "coachId");

-- Service role bypass
CREATE POLICY "Service role has full access to CoachAthleteRelation"
  ON "CoachAthleteRelation"
  FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================================
-- 11. AUDIT LOG TABLE
-- Only admins and service role can read audit logs
-- System creates logs (via service role)
-- ============================================================================
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON "AuditLog"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = auth.uid()::text
      AND u.role = 'ADMIN'
    )
  );

-- Service role has full access (for creating logs)
CREATE POLICY "Service role has full access to AuditLog"
  ON "AuditLog"
  FOR ALL
  USING (auth.role() = 'service_role');
