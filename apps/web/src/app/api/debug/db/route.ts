import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to test database connectivity
 * GET /api/debug/db - Basic connectivity test
 * GET /api/debug/db?test=dashboard&userId=xxx - Test dashboard queries for a specific user
 *
 * SECURITY: Requires admin auth and is disabled in production by default
 */
export async function GET(req: NextRequest) {
  // Block in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_ROUTES !== 'true') {
    return NextResponse.json({ error: 'Debug routes disabled in production' }, { status: 404 });
  }

  // Require admin authentication
  const { authorized, response } = await requireAdmin(req);
  if (!authorized) return response!;

  const { searchParams } = new URL(req.url);
  const testType = searchParams.get('test');
  const userId = searchParams.get('userId');

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    database: 'unknown',
    tables: {},
    dashboardTest: null,
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

    try {
      const assignmentCount = await prisma.assignment.count();
      (results.tables as Record<string, number>).Assignment = assignmentCount;
    } catch (e) {
      (results.tables as Record<string, string>).Assignment = `error: ${e instanceof Error ? e.message : 'unknown'}`;
    }

    // If dashboard test requested with a userId
    if (testType === 'dashboard' && userId) {
      const dashboardTest: Record<string, unknown> = {
        userId,
        queries: {},
      };

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Test each dashboard query individually
      try {
        const moodLogs = await prisma.moodLog.findMany({
          where: { athleteId: userId, createdAt: { gte: sevenDaysAgo } },
          orderBy: { createdAt: 'desc' },
          take: 14,
        });
        (dashboardTest.queries as Record<string, unknown>).moodLogs = { success: true, count: moodLogs.length };
      } catch (e) {
        (dashboardTest.queries as Record<string, unknown>).moodLogs = { success: false, error: e instanceof Error ? e.message : 'unknown' };
      }

      try {
        const todayLog = await prisma.moodLog.findFirst({
          where: { athleteId: userId, createdAt: { gte: today } },
        });
        (dashboardTest.queries as Record<string, unknown>).todayMoodLog = { success: true, found: !!todayLog };
      } catch (e) {
        (dashboardTest.queries as Record<string, unknown>).todayMoodLog = { success: false, error: e instanceof Error ? e.message : 'unknown' };
      }

      try {
        const goals = await prisma.goal.findMany({ where: { athleteId: userId } });
        (dashboardTest.queries as Record<string, unknown>).goals = { success: true, count: goals.length };
      } catch (e) {
        (dashboardTest.queries as Record<string, unknown>).goals = { success: false, error: e instanceof Error ? e.message : 'unknown' };
      }

      try {
        const session = await prisma.chatSession.findFirst({
          where: { athleteId: userId },
          orderBy: { updatedAt: 'desc' },
          select: { id: true, topic: true, focusArea: true, updatedAt: true },
        });
        (dashboardTest.queries as Record<string, unknown>).chatSession = { success: true, found: !!session };
      } catch (e) {
        (dashboardTest.queries as Record<string, unknown>).chatSession = { success: false, error: e instanceof Error ? e.message : 'unknown' };
      }

      try {
        const assignments = await prisma.assignment.findMany({
          where: {
            AssignmentSubmission: { none: { athleteId: userId } },
            dueDate: { gte: today, lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) },
          },
          orderBy: { dueDate: 'asc' },
          take: 5,
          select: { id: true, title: true, dueDate: true, description: true },
        });
        (dashboardTest.queries as Record<string, unknown>).pendingAssignments = { success: true, count: assignments.length };
      } catch (e) {
        (dashboardTest.queries as Record<string, unknown>).pendingAssignments = { success: false, error: e instanceof Error ? e.message : 'unknown' };
      }

      try {
        const profile = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, Athlete: { select: { sport: true, year: true } } },
        });
        (dashboardTest.queries as Record<string, unknown>).athleteProfile = { success: true, found: !!profile, hasAthlete: !!profile?.Athlete };
      } catch (e) {
        (dashboardTest.queries as Record<string, unknown>).athleteProfile = { success: false, error: e instanceof Error ? e.message : 'unknown' };
      }

      results.dashboardTest = dashboardTest;
    }

    // List first few users for reference (to get valid userIds)
    try {
      const users = await prisma.user.findMany({
        take: 5,
        select: { id: true, email: true, role: true },
      });
      results.sampleUsers = users;
    } catch (e) {
      results.sampleUsers = `error: ${e instanceof Error ? e.message : 'unknown'}`;
    }

    return NextResponse.json(results);
  } catch (error) {
    results.database = 'error';
    results.error = error instanceof Error ? error.message : 'Unknown error';
    results.stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(results, { status: 500 });
  }
}
