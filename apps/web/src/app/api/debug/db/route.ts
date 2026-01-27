import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to test database connectivity
 * GET /api/debug/db
 */
export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    database: 'unknown',
    tables: {},
    error: null,
  };

  try {
    // Test basic connectivity
    const userCount = await prisma.user.count();
    results.database = 'connected';
    results.tables = {
      User: userCount,
    };

    // Test other tables
    try {
      const athleteCount = await prisma.athlete.count();
      (results.tables as Record<string, number>).Athlete = athleteCount;
    } catch (e) {
      (results.tables as Record<string, string>).Athlete = `error: ${e instanceof Error ? e.message : 'unknown'}`;
    }

    try {
      const moodLogCount = await prisma.moodLog.count();
      (results.tables as Record<string, number>).MoodLog = moodLogCount;
    } catch (e) {
      (results.tables as Record<string, string>).MoodLog = `error: ${e instanceof Error ? e.message : 'unknown'}`;
    }

    try {
      const goalCount = await prisma.goal.count();
      (results.tables as Record<string, number>).Goal = goalCount;
    } catch (e) {
      (results.tables as Record<string, string>).Goal = `error: ${e instanceof Error ? e.message : 'unknown'}`;
    }

    try {
      const sessionCount = await prisma.chatSession.count();
      (results.tables as Record<string, number>).ChatSession = sessionCount;
    } catch (e) {
      (results.tables as Record<string, string>).ChatSession = `error: ${e instanceof Error ? e.message : 'unknown'}`;
    }

    return NextResponse.json(results);
  } catch (error) {
    results.database = 'error';
    results.error = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(results, { status: 500 });
  }
}
