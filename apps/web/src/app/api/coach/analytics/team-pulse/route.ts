/**
 * Team Pulse API
 *
 * GET /api/coach/analytics/team-pulse
 * Query params: days (7|30|90, default 30)
 *
 * Returns:
 * - Mood & confidence trends over time (daily averages)
 * - Readiness trend over time
 * - Sport cohort comparison (avg readiness, mood, stress per sport)
 * - Metric correlation matrix (mood, stress, sleep, confidence)
 * - Summary stats (avg mood, readiness, stress, engagement rate)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { authorized, user, response } = await requireCoach(req);
  if (!authorized) return response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const daysParam = searchParams.get('days');
    const days = daysParam ? Math.min(parseInt(daysParam, 10), 90) : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get consented athletes
    const relations = await prisma.coachAthleteRelation.findMany({
      where: { coachId: user!.id, consentGranted: true },
      include: {
        Athlete: {
          include: {
            User: { select: { name: true } },
          },
        },
      },
    });

    const athleteIds = relations.map((r) => r.athleteId);
    const totalAthletes = athleteIds.length;

    if (totalAthletes === 0) {
      return NextResponse.json({
        success: true,
        data: {
          stats: { avgMood: 0, avgReadiness: 0, avgStress: 0, engagementRate: 0 },
          moodTrend: [],
          readinessTrend: [],
          cohortComparison: [],
          correlationMatrix: { variables: [], matrix: [] },
        },
      });
    }

    // Fetch all mood logs in the time range
    const moodLogs = await prisma.moodLog.findMany({
      where: {
        athleteId: { in: athleteIds },
        createdAt: { gte: startDate },
      },
      include: {
        Athlete: { select: { sport: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // --- MOOD TREND (daily averages) ---
    const moodByDate = new Map<string, { mood: number[]; confidence: number[] }>();
    for (const log of moodLogs) {
      const dateKey = log.createdAt.toISOString().split('T')[0];
      if (!moodByDate.has(dateKey)) {
        moodByDate.set(dateKey, { mood: [], confidence: [] });
      }
      const entry = moodByDate.get(dateKey)!;
      entry.mood.push(log.mood);
      entry.confidence.push(log.confidence ?? 5);
    }

    const moodTrend = Array.from(moodByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        mood: round(avg(vals.mood)),
        confidence: round(avg(vals.confidence)),
      }));

    // --- READINESS TREND (daily averages from readinessScore table or computed) ---
    const readinessScores = await prisma.readinessScore.findMany({
      where: {
        athleteId: { in: athleteIds },
        calculatedAt: { gte: startDate },
      },
      orderBy: { calculatedAt: 'asc' },
    });

    const readinessByDate = new Map<string, number[]>();
    for (const rs of readinessScores) {
      const dateKey = rs.calculatedAt.toISOString().split('T')[0];
      if (!readinessByDate.has(dateKey)) readinessByDate.set(dateKey, []);
      readinessByDate.get(dateKey)!.push(rs.score);
    }

    // If no readiness scores in DB, compute from mood logs
    if (readinessScores.length === 0) {
      for (const log of moodLogs) {
        const dateKey = log.createdAt.toISOString().split('T')[0];
        if (!readinessByDate.has(dateKey)) readinessByDate.set(dateKey, []);
        const computed = ((log.mood + (log.confidence ?? 5) + (11 - log.stress)) / 3) * 10;
        readinessByDate.get(dateKey)!.push(Math.round(computed));
      }
    }

    const readinessTrend = Array.from(readinessByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, scores]) => ({
        date,
        score: round(avg(scores)),
      }));

    // --- COHORT COMPARISON (by sport) ---
    const sportMap = new Map<string, { mood: number[]; stress: number[]; readiness: number[] }>();
    for (const log of moodLogs) {
      const sport = log.Athlete?.sport || 'Unknown';
      if (!sportMap.has(sport)) sportMap.set(sport, { mood: [], stress: [], readiness: [] });
      const entry = sportMap.get(sport)!;
      entry.mood.push(log.mood);
      entry.stress.push(log.stress);
      entry.readiness.push(Math.round(((log.mood + (log.confidence ?? 5) + (11 - log.stress)) / 3) * 10));
    }

    const cohortComparison = Array.from(sportMap.entries())
      .map(([cohort, vals]) => ({
        cohort,
        readiness: round(avg(vals.readiness)),
        mood: round(avg(vals.mood)),
        stress: round(avg(vals.stress)),
      }))
      .sort((a, b) => b.readiness - a.readiness);

    // --- CORRELATION MATRIX (mood, stress, sleep, confidence) ---
    // Build paired arrays for correlation calculation
    const moods: number[] = [];
    const stresses: number[] = [];
    const sleeps: number[] = [];
    const confidences: number[] = [];

    for (const log of moodLogs) {
      moods.push(log.mood);
      stresses.push(log.stress);
      sleeps.push(log.sleep ?? 7); // Default if not logged
      confidences.push(log.confidence ?? 5);
    }

    const variables = ['Mood', 'Stress', 'Sleep', 'Confidence'];
    const arrays = [moods, stresses, sleeps, confidences];
    const matrix: number[][] = [];

    for (let i = 0; i < arrays.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < arrays.length; j++) {
        if (i === j) {
          row.push(1.0);
        } else {
          row.push(round(pearsonCorrelation(arrays[i], arrays[j])));
        }
      }
      matrix.push(row);
    }

    // --- SUMMARY STATS ---
    const allMoods = moodLogs.map((l) => l.mood);
    const allStress = moodLogs.map((l) => l.stress);
    const allReadiness = moodLogs.map((l) =>
      Math.round(((l.mood + (l.confidence ?? 5) + (11 - l.stress)) / 3) * 10)
    );

    // Engagement: % of athletes who logged at least once in the period
    const athletesWhoLogged = new Set(moodLogs.map((l) => l.athleteId)).size;
    const engagementRate = totalAthletes > 0 ? round((athletesWhoLogged / totalAthletes) * 100) : 0;

    // Calculate trends (compare last half vs first half of period)
    const midpoint = Math.floor(moodLogs.length / 2);
    const firstHalf = moodLogs.slice(0, midpoint);
    const secondHalf = moodLogs.slice(midpoint);

    const moodTrendDelta =
      firstHalf.length > 0 && secondHalf.length > 0
        ? round(avg(secondHalf.map((l) => l.mood)) - avg(firstHalf.map((l) => l.mood)))
        : 0;
    const stressTrendDelta =
      firstHalf.length > 0 && secondHalf.length > 0
        ? round(avg(secondHalf.map((l) => l.stress)) - avg(firstHalf.map((l) => l.stress)))
        : 0;
    const readinessTrendDelta =
      firstHalf.length > 0 && secondHalf.length > 0
        ? round(
            avg(secondHalf.map((l) => ((l.mood + (l.confidence ?? 5) + (11 - l.stress)) / 3) * 10)) -
              avg(firstHalf.map((l) => ((l.mood + (l.confidence ?? 5) + (11 - l.stress)) / 3) * 10))
          )
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          avgMood: allMoods.length > 0 ? round(avg(allMoods)) : 0,
          moodTrend: moodTrendDelta,
          avgReadiness: allReadiness.length > 0 ? round(avg(allReadiness)) : 0,
          readinessTrend: readinessTrendDelta,
          avgStress: allStress.length > 0 ? round(avg(allStress)) : 0,
          stressTrend: stressTrendDelta,
          engagementRate,
          engagementTrend: 0, // Would need session-level data
          totalLogs: moodLogs.length,
          athleteCount: totalAthletes,
        },
        moodTrend,
        readinessTrend,
        cohortComparison,
        correlationMatrix: { variables, matrix },
      },
    });
  } catch (error) {
    console.error('[TeamPulse API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to compute team pulse data' },
      { status: 500 }
    );
  }
}

// --- Helpers ---

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function round(n: number, decimals = 1): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;

  const avgX = avg(x.slice(0, n));
  const avgY = avg(y.slice(0, n));

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - avgX;
    const dy = y[i] - avgY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;

  return num / den;
}
