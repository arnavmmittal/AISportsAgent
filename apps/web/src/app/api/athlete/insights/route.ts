import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { generateAthleteInsights } from '@/lib/athlete-insights';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/athlete/insights
 *
 * Returns sport psychology-forward insights: mental readiness patterns,
 * coach connection status, growth metrics, and context-aware conversation
 * starters for the wellness center.
 */
export async function GET(req: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    const athlete = await prisma.athlete.findUnique({
      where: { userId: user!.id },
      select: { id: true, userId: true, teamId: true },
    });
    if (!athlete) {
      return NextResponse.json(
        { success: false, error: 'Athlete profile not found' },
        { status: 404 },
      );
    }

    // Parallel data fetching
    const [moodLogs, coachInteractions, goals] = await Promise.all([
      prisma.moodLog.findMany({
        where: { athleteId: athlete.userId },
        orderBy: { createdAt: 'desc' },
        take: 14,
        select: {
          id: true,
          mood: true,
          confidence: true,
          stress: true,
          sleep: true,
          sleepQuality: true,
          soreness: true,
          rpe: true,
          contextTags: true,
          createdAt: true,
          notes: true,
        },
      }),
      // Coach interactions: most recent assistant message in athlete's sessions
      prisma.message.findMany({
        where: {
          role: 'assistant',
          session: { athleteId: athlete.userId },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true },
      }),
      prisma.goal.findMany({
        where: { athleteId: athlete.userId },
        select: { status: true },
      }),
    ]);

    // Calculate streak (consecutive days with logs, allow missing today)
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasLog = moodLogs.some(
        l => l.createdAt.toDateString() === checkDate.toDateString(),
      );
      if (hasLog) {
        streak++;
      } else if (i > 0) {
        break; // Allow missing today but break on other gaps
      }
    }

    const insights = await generateAthleteInsights({
      moodLogs: moodLogs.map(l => ({
        ...l,
        confidence: l.confidence,
        sleep: l.sleep,
        sleepQuality: l.sleepQuality ? Number(l.sleepQuality) : null,
        soreness: l.soreness ? Number(l.soreness) : null,
        rpe: l.rpe ? Number(l.rpe) : null,
      })),
      coachInteractions: coachInteractions.map(m => ({ date: m.createdAt })),
      goals,
      upcomingGame: null, // TODO: integrate with game schedule when available
      checkInStreak: streak,
    });

    return NextResponse.json({ success: true, data: insights });
  } catch (error) {
    console.error('Error in /api/athlete/insights:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate insights' },
      { status: 500 },
    );
  }
}
