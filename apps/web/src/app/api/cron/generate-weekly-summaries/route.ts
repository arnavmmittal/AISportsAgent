/**
 * Cron Job: Generate Weekly Chat Summaries
 *
 * Schedule: Sunday 11:59 PM (Vercel Cron: "59 23 * * 0")
 *
 * Generates weekly summaries for all athletes who have:
 * 1. Consented to chat summaries (consentChatSummaries = true)
 * 2. Had at least 1 chat session in the past week
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateWeeklySummary } from '@/lib/summarizer';
import { logWeeklySummaryGeneration } from '@/lib/audit';

/**
 * Verify cron job authentication
 */
function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET not set in environment');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Calculate week bounds (Monday 00:00 to Sunday 23:59)
 *
 * @param date - Reference date (defaults to now)
 * @returns { weekStart, weekEnd } for the most recently completed week
 */
function getWeekBounds(date: Date = new Date()): { weekStart: Date; weekEnd: Date } {
  // Get the most recent Sunday 23:59:59
  const weekEnd = new Date(date);
  weekEnd.setHours(23, 59, 59, 999);

  // Rewind to Sunday if not already Sunday
  const dayOfWeek = weekEnd.getDay();
  if (dayOfWeek !== 0) {
    // 0 = Sunday
    weekEnd.setDate(weekEnd.getDate() - dayOfWeek);
  }

  // Week starts on Monday 00:00:00 (7 days before Sunday)
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  return { weekStart, weekEnd };
}

/**
 * GET handler for cron job
 */
export async function GET(req: NextRequest) {
  console.log('[Cron] Weekly summary generation started');

  // Verify authentication
  if (!verifyCronAuth(req)) {
    console.error('[Cron] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { weekStart, weekEnd } = getWeekBounds();

  console.log(`[Cron] Generating summaries for week: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

  try {
    // Find all athletes who have consented
    const consentedAthletes = await prisma.athlete.findMany({
      where: {
        consentChatSummaries: true,
      },
      select: {
        userId: true,
        User: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`[Cron] Found ${consentedAthletes.length} athletes with consent`);

    const results: {
      success: string[];
      skipped: string[];
      failed: Array<{ athleteId: string; error: string }>;
    } = {
      success: [],
      skipped: [],
      failed: [],
    };

    // Generate summaries for each athlete
    for (const athlete of consentedAthletes) {
      try {
        console.log(`[Cron] Processing athlete: ${athlete.userId}`);

        // Check if summary already exists for this week
        const existing = await prisma.chatSummary.findFirst({
          where: {
            athleteId: athlete.userId,
            summaryType: 'WEEKLY',
            weekStart,
            weekEnd,
          },
        });

        if (existing) {
          console.log(`[Cron] Summary already exists for ${athlete.userId}. Skipping.`);
          results.skipped.push(athlete.userId);
          continue;
        }

        // Generate summary
        const summary = await generateWeeklySummary(athlete.userId, weekStart, weekEnd);

        if (!summary) {
          console.log(`[Cron] No activity for ${athlete.userId}. Skipped.`);
          results.skipped.push(athlete.userId);
          continue;
        }

        // Log successful generation
        await logWeeklySummaryGeneration(
          athlete.userId,
          summary.id,
          summary.sessionCount || 0
        );

        results.success.push(athlete.userId);
        console.log(`[Cron] ✅ Generated summary ${summary.id} for ${athlete.userId}`);
      } catch (error: any) {
        console.error(`[Cron] ❌ Failed to generate summary for ${athlete.userId}:`, error);
        results.failed.push({
          athleteId: athlete.userId,
          error: error.message || 'Unknown error',
        });
      }
    }

    console.log('[Cron] Weekly summary generation completed', results);

    return NextResponse.json({
      message: 'Weekly summaries generated',
      week: {
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
      },
      results: {
        total: consentedAthletes.length,
        success: results.success.length,
        skipped: results.skipped.length,
        failed: results.failed.length,
      },
      details: results,
    });
  } catch (error: any) {
    console.error('[Cron] Weekly summary generation failed:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
