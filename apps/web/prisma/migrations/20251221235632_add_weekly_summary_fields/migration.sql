-- CreateEnum
CREATE TYPE "SummaryType" AS ENUM ('SESSION', 'WEEKLY');

-- AlterTable: Add new columns to ChatSummary (chat_summaries table)
ALTER TABLE "ChatSummary" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ChatSummary" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ChatSummary" ADD COLUMN "summaryType" "SummaryType" NOT NULL DEFAULT 'SESSION';
ALTER TABLE "ChatSummary" ADD COLUMN "weekStart" TIMESTAMP(3);
ALTER TABLE "ChatSummary" ADD COLUMN "weekEnd" TIMESTAMP(3);

-- Add numeric score columns
ALTER TABLE "ChatSummary" ADD COLUMN "moodScore" DOUBLE PRECISION;
ALTER TABLE "ChatSummary" ADD COLUMN "stressScore" DOUBLE PRECISION;
ALTER TABLE "ChatSummary" ADD COLUMN "sleepQualityScore" DOUBLE PRECISION;
ALTER TABLE "ChatSummary" ADD COLUMN "confidenceScore" DOUBLE PRECISION;
ALTER TABLE "ChatSummary" ADD COLUMN "sorenessScore" DOUBLE PRECISION;
ALTER TABLE "ChatSummary" ADD COLUMN "workloadPerception" DOUBLE PRECISION;

-- Add qualitative insight columns
ALTER TABLE "ChatSummary" ADD COLUMN "riskFlags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ChatSummary" ADD COLUMN "recommendedActions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ChatSummary" ADD COLUMN "athleteGoalsProgress" JSONB;
ALTER TABLE "ChatSummary" ADD COLUMN "adherenceNotes" TEXT;

-- Add summary metadata columns
ALTER TABLE "ChatSummary" ADD COLUMN "totalMessages" INTEGER;
ALTER TABLE "ChatSummary" ADD COLUMN "sessionCount" INTEGER;
ALTER TABLE "ChatSummary" ADD COLUMN "avgResponseTime" DOUBLE PRECISION;
ALTER TABLE "ChatSummary" ADD COLUMN "engagementScore" DOUBLE PRECISION;

-- Add privacy & redaction columns
ALTER TABLE "ChatSummary" ADD COLUMN "redactedContent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ChatSummary" ADD COLUMN "redactionReason" TEXT;

-- Add data retention columns
ALTER TABLE "ChatSummary" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "ChatSummary" ADD COLUMN "revokedAt" TIMESTAMP(3);

-- Make sessionId nullable (allow NULL for weekly summaries)
ALTER TABLE "ChatSummary" ALTER COLUMN "sessionId" DROP NOT NULL;

-- Add relation field name change (Athlete -> athlete)
-- Note: Field renaming is handled at Prisma level, no SQL changes needed

-- Create new indexes
CREATE INDEX "ChatSummary_athleteId_weekStart_summaryType_idx" ON "ChatSummary"("athleteId", "weekStart", "summaryType");
CREATE INDEX "ChatSummary_expiresAt_idx" ON "ChatSummary"("expiresAt");
CREATE INDEX "ChatSummary_summaryType_weekStart_idx" ON "ChatSummary"("summaryType", "weekStart");

-- Rename table to chat_summaries (using @@map directive)
-- Note: Prisma handles the mapping at application level, no ALTER TABLE needed
