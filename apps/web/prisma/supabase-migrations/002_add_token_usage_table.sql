-- =====================================================
-- Add TokenUsage Table for Cost Tracking
-- =====================================================
-- This migration adds the TokenUsage table to track
-- AI API costs and enforce daily/monthly limits.
--
-- Execute this in Supabase Dashboard → SQL Editor
-- =====================================================

-- Create TokenUsage table
CREATE TABLE IF NOT EXISTS "TokenUsage" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "sessionId" TEXT,
  "promptTokens" INTEGER NOT NULL,
  "completionTokens" INTEGER NOT NULL,
  "totalTokens" INTEGER NOT NULL,
  "model" TEXT,
  "endpoint" TEXT NOT NULL,
  "cost" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS "TokenUsage_userId_idx" ON "TokenUsage"("userId");
CREATE INDEX IF NOT EXISTS "TokenUsage_createdAt_idx" ON "TokenUsage"("createdAt");
CREATE INDEX IF NOT EXISTS "TokenUsage_userId_createdAt_idx" ON "TokenUsage"("userId", "createdAt");

-- Enable RLS
ALTER TABLE "TokenUsage" ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can view their own token usage
CREATE POLICY "Users can view own token usage"
ON "TokenUsage"
FOR SELECT
USING (auth.uid()::text = "userId");

-- =====================================================
-- Verification
-- =====================================================
-- Run this to verify table was created:
-- SELECT * FROM "TokenUsage" LIMIT 1;
