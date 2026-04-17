/**
 * Weekly Pulse API
 * Aggregates past 7 days of team data for the WeeklyPulseCard
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);
    if (!authorized || !user) return response;

    const coach = await prisma.coach.findUnique({
      where: { userId: user.id },
    });

    if (!coach) {
      return NextResponse.json({ error: 'Coach profile not found' }, { status: 404 });
    }

    const relations = await prisma.coachAthleteRelation.findMany({
      where: { coachId: coach.userId },
      include: {
        Athlete: {
          include: { User: { select: { name: true, id: true } } },
        },
      },
    });

    const athleteIds = relations.map(r => r.athleteId);
    if (athleteIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          teamReadiness: { current: 0, delta: 0, weekAgo: 0 },
          checkInRate: { active: 0, total: 0, percentage: 0 },
          topImprover: null,
          needsAttention: null,
          mostConsistent: null,
          pendingInterventions: 0,
          inactiveAthletes: 0,
          nextGameDate: null,
        },
      });
    }

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Fetch mood logs for past 14 days (to compare this week vs last week)
    const moodLogs = await prisma.moodLog.findMany({
      where: {
        athleteId: { in: athleteIds },
        createdAt: { gte: twoWeeksAgo },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        athleteId: true,
        mood: true,
        confidence: true,
        stress: true,
        createdAt: true,
      },
    });

    // Compute per-athlete readiness (simple average of mood + confidence, scaled)
    const athleteScores: Record<string, { thisWeek: number[]; lastWeek: number[]; allDates: string[]; name: string }> = {};

    for (const rel of relations) {
      const name = rel.Athlete?.User?.name || 'Unknown';
      athleteScores[rel.athleteId] = { thisWeek: [], lastWeek: [], allDates: [], name };
    }

    for (const log of moodLogs) {
      const entry = athleteScores[log.athleteId];
      if (!entry) continue;

      // Simple readiness: average of mood and confidence, scaled to 0-100
      const score = ((log.mood + (log.confidence ?? 5)) / 2) * 10;
      const logDate = new Date(log.createdAt);
      entry.allDates.push(logDate.toISOString().split('T')[0]);

      if (logDate >= weekAgo) {
        entry.thisWeek.push(score);
      } else {
        entry.lastWeek.push(score);
      }
    }

    // Team readiness
    const thisWeekScores: number[] = [];
    const lastWeekScores: number[] = [];
    let activeCount = 0;
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    let inactiveCount = 0;

    // Per-athlete deltas for top improver / needs attention
    const deltas: { athleteId: string; name: string; thisAvg: number; lastAvg: number; delta: number; trend: number[] }[] = [];

    // Streak tracking
    let bestStreak = { athleteId: '', name: '', streak: 0 };

    for (const [athleteId, scores] of Object.entries(athleteScores)) {
      const thisAvg = scores.thisWeek.length > 0
        ? scores.thisWeek.reduce((a, b) => a + b, 0) / scores.thisWeek.length
        : 0;
      const lastAvg = scores.lastWeek.length > 0
        ? scores.lastWeek.reduce((a, b) => a + b, 0) / scores.lastWeek.length
        : 0;

      if (scores.thisWeek.length > 0) {
        thisWeekScores.push(thisAvg);
        activeCount++;
      }
      if (scores.lastWeek.length > 0) {
        lastWeekScores.push(lastAvg);
      }

      // Check if inactive
      const lastLog = scores.allDates.length > 0 ? new Date(scores.allDates[scores.allDates.length - 1]) : null;
      if (!lastLog || lastLog < threeDaysAgo) {
        inactiveCount++;
      }

      // Delta
      if (scores.thisWeek.length > 0) {
        deltas.push({
          athleteId,
          name: scores.name,
          thisAvg,
          lastAvg,
          delta: thisAvg - lastAvg,
          trend: scores.thisWeek.slice(-7),
        });
      }

      // Streak: count consecutive days with logs ending at today
      const uniqueDates = [...new Set(scores.allDates)].sort().reverse();
      let streak = 0;
      const checkDate = new Date(now);
      for (let i = 0; i < 90; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (uniqueDates.includes(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      if (streak > bestStreak.streak) {
        bestStreak = { athleteId, name: scores.name, streak };
      }
    }

    const teamCurrentAvg = thisWeekScores.length > 0
      ? Math.round(thisWeekScores.reduce((a, b) => a + b, 0) / thisWeekScores.length)
      : 0;
    const teamLastAvg = lastWeekScores.length > 0
      ? Math.round(lastWeekScores.reduce((a, b) => a + b, 0) / lastWeekScores.length)
      : 0;

    // Sort deltas
    const sortedByDelta = [...deltas].sort((a, b) => b.delta - a.delta);
    const topImprover = sortedByDelta.length > 0 && sortedByDelta[0].delta > 0
      ? {
          athleteId: sortedByDelta[0].athleteId,
          name: sortedByDelta[0].name,
          trend: sortedByDelta[0].trend,
          delta: Math.round(sortedByDelta[0].delta),
        }
      : null;

    const sortedByDeltaAsc = [...deltas].sort((a, b) => a.delta - b.delta);
    const needsAttention = sortedByDeltaAsc.length > 0 && sortedByDeltaAsc[0].delta < 0
      ? {
          athleteId: sortedByDeltaAsc[0].athleteId,
          name: sortedByDeltaAsc[0].name,
          trend: sortedByDeltaAsc[0].trend,
          readiness: Math.round(sortedByDeltaAsc[0].thisAvg),
        }
      : null;

    return NextResponse.json({
      success: true,
      data: {
        teamReadiness: {
          current: teamCurrentAvg,
          delta: teamCurrentAvg - teamLastAvg,
          weekAgo: teamLastAvg,
        },
        checkInRate: {
          active: activeCount,
          total: athleteIds.length,
          percentage: Math.round((activeCount / athleteIds.length) * 100),
        },
        topImprover,
        needsAttention,
        mostConsistent: bestStreak.streak > 0 ? bestStreak : null,
        pendingInterventions: 0, // TODO: wire to intervention system
        inactiveAthletes: inactiveCount,
        nextGameDate: null, // TODO: wire to schedule system
      },
    });
  } catch (error) {
    console.error('Weekly pulse API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
