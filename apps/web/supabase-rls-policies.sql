-- =========================================
-- Supabase RLS Policies for AI Sports Agent
-- =========================================
-- These policies must be run in Supabase SQL Editor
-- to fix the coach login 406 error

-- Enable RLS on User table (if not already enabled)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to read their own User record
-- This fixes the middleware role check (src/middleware.ts:66-70)
CREATE POLICY "Users can read own record"
ON "User"
FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

-- Policy 2: Allow users to update their own User record
-- (For profile updates, settings, etc.)
CREATE POLICY "Users can update own record"
ON "User"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- =========================================
-- Additional policies for related tables
-- =========================================

-- Athlete table: Allow athletes to read/update own record
ALTER TABLE "Athlete" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can read own record"
ON "Athlete"
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM "User"
  WHERE "User".id = "Athlete"."userId"
  AND "User".id = auth.uid()::text
));

CREATE POLICY "Athletes can update own record"
ON "Athlete"
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM "User"
  WHERE "User".id = "Athlete"."userId"
  AND "User".id = auth.uid()::text
))
WITH CHECK (EXISTS (
  SELECT 1 FROM "User"
  WHERE "User".id = "Athlete"."userId"
  AND "User".id = auth.uid()::text
));

-- Coach table: Allow coaches to read/update own record
ALTER TABLE "Coach" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can read own record"
ON "Coach"
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM "User"
  WHERE "User".id = "Coach"."userId"
  AND "User".id = auth.uid()::text
));

CREATE POLICY "Coaches can update own record"
ON "Coach"
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM "User"
  WHERE "User".id = "Coach"."userId"
  AND "User".id = auth.uid()::text
))
WITH CHECK (EXISTS (
  SELECT 1 FROM "User"
  WHERE "User".id = "Coach"."userId"
  AND "User".id = auth.uid()::text
));

-- MoodLog table: Allow athletes to CRUD own logs
ALTER TABLE "MoodLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can manage own mood logs"
ON "MoodLog"
FOR ALL
TO authenticated
USING ("athleteId" = auth.uid()::text)
WITH CHECK ("athleteId" = auth.uid()::text);

-- Goal table: Allow athletes to CRUD own goals
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can manage own goals"
ON "Goal"
FOR ALL
TO authenticated
USING ("athleteId" = auth.uid()::text)
WITH CHECK ("athleteId" = auth.uid()::text);

-- ChatSession table: Allow users to CRUD own sessions
ALTER TABLE "ChatSession" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chat sessions"
ON "ChatSession"
FOR ALL
TO authenticated
USING ("athleteId" = auth.uid()::text)
WITH CHECK ("athleteId" = auth.uid()::text);

-- Message table: Allow users to CRUD messages in own sessions
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage messages in own sessions"
ON "Message"
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM "ChatSession"
  WHERE "ChatSession".id = "Message"."sessionId"
  AND "ChatSession"."athleteId" = auth.uid()::text
))
WITH CHECK (EXISTS (
  SELECT 1 FROM "ChatSession"
  WHERE "ChatSession".id = "Message"."sessionId"
  AND "ChatSession"."athleteId" = auth.uid()::text
));

-- =========================================
-- Coach access policies (with athlete consent)
-- =========================================

-- Coaches can read athlete data only if athlete has given consent
CREATE POLICY "Coaches can read consenting athletes"
ON "Athlete"
FOR SELECT
TO authenticated
USING (
  -- Coach accessing own athletes
  EXISTS (
    SELECT 1 FROM "User" u
    INNER JOIN "Coach" c ON c."userId" = u.id
    WHERE u.id = auth.uid()::text
    AND c."schoolId" = "Athlete"."schoolId"
    AND "Athlete"."consentCoachView" = true
  )
);

-- Note: Add similar consent-based policies for MoodLog, Goal, ChatSession as needed

-- =========================================
-- Admin policies (full access)
-- =========================================

-- Admins can read all User records in their school
CREATE POLICY "Admins can read all users in school"
ON "User"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "User" admin
    WHERE admin.id = auth.uid()::text
    AND admin.role = 'ADMIN'
    AND admin."schoolId" = "User"."schoolId"
  )
);

-- =========================================
-- How to apply these policies
-- =========================================
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- 5. Test coach login at http://localhost:3000/auth/signin
--    - Email: coach@uw.edu
--    - Password: Coach123!
-- 6. Should now redirect to /coach/team-overview successfully
