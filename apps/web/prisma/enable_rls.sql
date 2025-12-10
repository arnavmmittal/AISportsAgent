-- Run this in Supabase SQL Editor to enable RLS on all tables
-- This is only needed if you switch DATABASE_URL to Supabase

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "School" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Athlete" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coach" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoachNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatSummary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CrisisAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConversationInsight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MoodLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Goal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeBase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PerformanceMetric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReadinessScore" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WearableData" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- Example for User table (repeat pattern for others):
CREATE POLICY "Users can view own data" ON "User"
  FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON "User"
  FOR UPDATE
  USING (auth.uid()::text = id);

-- Note: You'll need to create appropriate policies for each table
-- based on your application's security requirements
