-- Enable Row Level Security (RLS) on all tables
-- This addresses Supabase warnings about public tables without RLS

-- Enable RLS on existing tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "School" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Athlete" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coach" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MoodLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeBase" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on new tables
ALTER TABLE "PerformanceMetric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReadinessScore" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WearableData" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for User table
CREATE POLICY "Users can view own profile"
  ON "User" FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
  ON "User" FOR UPDATE
  USING (auth.uid()::text = id);

-- Create RLS policies for Athlete table
CREATE POLICY "Athletes can view own data"
  ON "Athlete" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Coaches can view athletes in same school"
  ON "Athlete" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = auth.uid()::text
      AND u.role = 'COACH'
      AND u."schoolId" = (SELECT "schoolId" FROM "User" WHERE id = "Athlete"."userId")
    )
  );

-- Create RLS policies for MoodLog table
CREATE POLICY "Athletes can manage own mood logs"
  ON "MoodLog" FOR ALL
  USING (auth.uid()::text = "athleteId");

CREATE POLICY "Coaches can view mood logs with consent"
  ON "MoodLog" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Athlete" a
      JOIN "User" u ON a."userId" = u.id
      WHERE a."userId" = "MoodLog"."athleteId"
      AND u."schoolId" = (SELECT "schoolId" FROM "User" WHERE id = auth.uid()::text)
      AND a."consentCoachView" = true
    )
  );

-- Create RLS policies for PerformanceMetric table
CREATE POLICY "Coaches can manage performance metrics"
  ON "PerformanceMetric" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = auth.uid()::text
      AND u.role IN ('COACH', 'ADMIN')
    )
  );

-- Create RLS policies for ReadinessScore table
CREATE POLICY "Coaches and athletes can view readiness scores"
  ON "ReadinessScore" FOR SELECT
  USING (
    auth.uid()::text = "athleteId" OR
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = auth.uid()::text
      AND u.role IN ('COACH', 'ADMIN')
    )
  );

-- Create RLS policies for AuditLog table (admin only)
CREATE POLICY "Admins can view audit logs"
  ON "AuditLog" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = auth.uid()::text
      AND u.role = 'ADMIN'
    )
  );

-- Create RLS policies for KnowledgeBase table (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view knowledge base"
  ON "KnowledgeBase" FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage knowledge base"
  ON "KnowledgeBase" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = auth.uid()::text
      AND u.role = 'ADMIN'
    )
  );
