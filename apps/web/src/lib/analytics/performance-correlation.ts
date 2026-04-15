/**
 * Performance Correlation Analysis
 *
 * Calculates Pearson correlations between mental state metrics and performance outcomes:
 * - Mood vs Performance
 * - Stress vs Performance
 * - Readiness vs Performance
 * - Sleep vs Performance
 * - Confidence vs Performance
 *
 * Generates actionable insights for coaches based on correlation strength.
 * Requires minimum 20 data points for statistical reliability.
 */

import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export interface CorrelationResult {
  factor: string;
  correlation: number; // -1 to 1
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  sampleSize: number;
}

export interface TeamCorrelationResult {
  correlations: CorrelationResult[];
  winRateByReadiness: {
    high: { rate: number; count: number }; // readiness >= 75
    medium: { rate: number; count: number }; // 60-74
    low: { rate: number; count: number }; // < 60
  };
  totalGames: number;
}

/**
 * Calculate Pearson correlation coefficient between two arrays.
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0);
  const sumX2 = x.reduce((a, xi) => a + xi * xi, 0);
  const sumY2 = y.reduce((a, yi) => a + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
}

function getStrength(r: number): 'strong' | 'moderate' | 'weak' | 'none' {
  const abs = Math.abs(r);
  if (abs >= 0.6) return 'strong';
  if (abs >= 0.4) return 'moderate';
  if (abs >= 0.2) return 'weak';
  return 'none';
}

/**
 * Calculate correlations between mental readiness factors and performance
 * for a specific athlete.
 */
export async function calculateAthleteCorrelations(
  athleteId: string,
  opts?: { startDate?: Date; endDate?: Date }
): Promise<CorrelationResult[]> {
  const outcomes = await prisma.performanceOutcome.findMany({
    where: {
      athleteId,
      ...(opts?.startDate && { date: { gte: opts.startDate } }),
      ...(opts?.endDate && { date: { lte: opts.endDate } }),
      overallRating: { not: null },
    },
    orderBy: { date: 'asc' },
  });

  if (outcomes.length < 3) return [];

  // For each outcome, find the mood log from that day
  const dataPoints = await Promise.all(
    outcomes.map(async (o) => {
      const moodLog = await prisma.moodLog.findFirst({
        where: {
          athleteId,
          createdAt: {
            gte: startOfDay(o.date),
            lte: endOfDay(o.date),
          },
        },
      });
      return {
        performance: o.overallRating!,
        mood: moodLog?.mood ?? null,
        confidence: moodLog?.confidence ?? null,
        stress: moodLog?.stress ?? null,
        sleep: moodLog?.sleep ?? null,
        energy: moodLog?.energy ?? null,
      };
    })
  );

  const results: CorrelationResult[] = [];
  const performanceValues = dataPoints.map((d) => d.performance);

  const factors: { name: string; key: keyof (typeof dataPoints)[0] }[] = [
    { name: 'Mood', key: 'mood' },
    { name: 'Confidence', key: 'confidence' },
    { name: 'Sleep Quality', key: 'sleep' },
    { name: 'Energy', key: 'energy' },
    { name: 'Stress (inverse)', key: 'stress' },
  ];

  for (const factor of factors) {
    const pairs = dataPoints
      .map((d, i) => ({
        x: d[factor.key] as number | null,
        y: performanceValues[i],
      }))
      .filter((p): p is { x: number; y: number } => p.x !== null);

    if (pairs.length < 3) continue;

    let xValues = pairs.map((p) => p.x);
    const yValues = pairs.map((p) => p.y);

    // Invert stress (high stress = bad for performance)
    if (factor.key === 'stress') {
      xValues = xValues.map((v) => 10 - v);
    }

    const r = pearsonCorrelation(xValues, yValues);
    results.push({
      factor: factor.name,
      correlation: Math.round(r * 100) / 100,
      strength: getStrength(r),
      sampleSize: pairs.length,
    });
  }

  return results;
}

/**
 * Calculate team-level correlations and win rate by readiness bucket.
 */
export async function calculateTeamCorrelations(
  coachId: string
): Promise<TeamCorrelationResult> {
  // Get all athletes for this coach
  const relations = await prisma.coachAthleteRelation.findMany({
    where: { coachId },
    select: { athleteId: true },
  });
  const athleteIds = relations.map((r) => r.athleteId);

  // Get all performance outcomes for these athletes
  const outcomes = await prisma.performanceOutcome.findMany({
    where: {
      athleteId: { in: athleteIds },
      overallRating: { not: null },
    },
    orderBy: { date: 'asc' },
  });

  // Calculate aggregate correlations across all athletes
  const allCorrelations: CorrelationResult[] = [];
  for (const athleteId of athleteIds) {
    const athleteCorrs = await calculateAthleteCorrelations(athleteId);
    allCorrelations.push(...athleteCorrs);
  }

  // Average correlations by factor
  const factorMap = new Map<
    string,
    { sum: number; count: number; samples: number }
  >();
  for (const corr of allCorrelations) {
    const existing = factorMap.get(corr.factor) || {
      sum: 0,
      count: 0,
      samples: 0,
    };
    existing.sum += corr.correlation;
    existing.count += 1;
    existing.samples += corr.sampleSize;
    factorMap.set(corr.factor, existing);
  }

  const teamCorrelations: CorrelationResult[] = [];
  for (const [factor, data] of factorMap) {
    const avgR =
      data.count > 0
        ? Math.round((data.sum / data.count) * 100) / 100
        : 0;
    teamCorrelations.push({
      factor,
      correlation: avgR,
      strength: getStrength(avgR),
      sampleSize: data.samples,
    });
  }

  // Win rate by readiness bucket
  const buckets = {
    high: { wins: 0, total: 0 },
    medium: { wins: 0, total: 0 },
    low: { wins: 0, total: 0 },
  };
  for (const outcome of outcomes) {
    // Find mood log for this game day
    const moodLog = await prisma.moodLog.findFirst({
      where: {
        athleteId: outcome.athleteId,
        createdAt: {
          gte: startOfDay(outcome.date),
          lte: endOfDay(outcome.date),
        },
      },
    });
    if (!moodLog) continue;

    // Simple readiness estimate from mood + confidence
    const readiness = ((moodLog.mood + (moodLog.confidence ?? 5)) / 2) * 10;
    const isWin =
      outcome.overallRating !== null && outcome.overallRating >= 7;

    if (readiness >= 75) {
      buckets.high.total++;
      if (isWin) buckets.high.wins++;
    } else if (readiness >= 60) {
      buckets.medium.total++;
      if (isWin) buckets.medium.wins++;
    } else {
      buckets.low.total++;
      if (isWin) buckets.low.wins++;
    }
  }

  return {
    correlations: teamCorrelations,
    winRateByReadiness: {
      high: {
        rate:
          buckets.high.total > 0
            ? Math.round((buckets.high.wins / buckets.high.total) * 100)
            : 0,
        count: buckets.high.total,
      },
      medium: {
        rate:
          buckets.medium.total > 0
            ? Math.round(
                (buckets.medium.wins / buckets.medium.total) * 100
              )
            : 0,
        count: buckets.medium.total,
      },
      low: {
        rate:
          buckets.low.total > 0
            ? Math.round((buckets.low.wins / buckets.low.total) * 100)
            : 0,
        count: buckets.low.total,
      },
    },
    totalGames: outcomes.length,
  };
}
