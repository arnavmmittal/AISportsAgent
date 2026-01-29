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

/**
 * Correlation result with statistical significance
 */
export interface CorrelationResult {
  metric: string;
  correlation: number; // -1 to 1 (Pearson's r)
  strength: 'very_strong' | 'strong' | 'moderate' | 'weak' | 'very_weak';
  direction: 'positive' | 'negative' | 'none';
  sampleSize: number;
  isSignificant: boolean; // p < 0.05
  insight: string;
}

/**
 * Performance correlation analysis result
 */
export interface PerformanceCorrelationAnalysis {
  athleteId: string;
  dateRange: { from: Date; to: Date };
  correlations: CorrelationResult[];
  topFactor: CorrelationResult | null; // Strongest correlation
  recommendations: string[];
}

/**
 * Calculate Pearson correlation coefficient
 * r = Σ[(xi - x̄)(yi - ȳ)] / √[Σ(xi - x̄)² × Σ(yi - ȳ)²]
 */
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }

  const n = x.length;
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  let numerator = 0;
  let sumSquaredDiffX = 0;
  let sumSquaredDiffY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;

    numerator += diffX * diffY;
    sumSquaredDiffX += diffX * diffX;
    sumSquaredDiffY += diffY * diffY;
  }

  const denominator = Math.sqrt(sumSquaredDiffX * sumSquaredDiffY);

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

/**
 * Determine correlation strength based on |r| value
 * Cohen's guidelines:
 * - |r| >= 0.5: strong
 * - |r| >= 0.3: moderate
 * - |r| >= 0.1: weak
 */
function getCorrelationStrength(r: number): 'very_strong' | 'strong' | 'moderate' | 'weak' | 'very_weak' {
  const absR = Math.abs(r);

  if (absR >= 0.7) return 'very_strong';
  if (absR >= 0.5) return 'strong';
  if (absR >= 0.3) return 'moderate';
  if (absR >= 0.1) return 'weak';
  return 'very_weak';
}

/**
 * Check statistical significance using t-test approximation
 * For Pearson correlation with sample size n:
 * t = r × sqrt(n - 2) / sqrt(1 - r²)
 * Significant if |t| > 1.96 (p < 0.05, two-tailed)
 */
function isStatisticallySignificant(r: number, n: number): boolean {
  if (n < 3) return false;

  const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
  return Math.abs(t) > 1.96; // p < 0.05
}

/**
 * Generate actionable insight based on correlation result
 */
function generateInsight(metric: string, correlation: number, strength: string): string {
  const absCorr = Math.abs(correlation);
  const direction = correlation > 0 ? 'Higher' : 'Lower';
  const metricName = metric.replace('_', ' ');

  if (strength === 'very_strong' || strength === 'strong') {
    if (correlation > 0) {
      return `${direction} ${metricName} strongly predicts better performance (r=${correlation.toFixed(2)}). Focus on improving ${metricName}.`;
    } else {
      return `${direction} ${metricName} strongly predicts worse performance (r=${correlation.toFixed(2)}). Monitor and address ${metricName} concerns.`;
    }
  } else if (strength === 'moderate') {
    return `${metricName} shows moderate link to performance (r=${correlation.toFixed(2)}). Consider as a contributing factor.`;
  } else {
    return `${metricName} shows weak correlation with performance (r=${correlation.toFixed(2)}). Other factors may be more impactful.`;
  }
}

/**
 * Analyze correlations between mental state metrics and performance
 *
 * @param athleteId - Athlete user ID
 * @param days - Number of days to analyze (default 90, min 30 for reliability)
 * @returns Performance correlation analysis with insights
 */
export async function analyzePerformanceCorrelations(
  athleteId: string,
  days: number = 90
): Promise<PerformanceCorrelationAnalysis> {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  // Fetch performance metrics (games/competitions)
  const performanceData = await prisma.performanceMetric.findMany({
    where: {
      athleteId,
      gameDate: {
        gte: fromDate,
        lte: toDate,
      },
    },
    orderBy: {
      gameDate: 'asc',
    },
    select: {
      id: true,
      gameDate: true,
      readinessScore: true, // Use readiness score as proxy for performance
      stats: true, // Could be used to calculate custom performance score
    },
  });

  if (performanceData.length < 20) {
    // Not enough data for reliable correlation analysis
    return {
      athleteId,
      dateRange: { from: fromDate, to: toDate },
      correlations: [],
      topFactor: null,
      recommendations: [
        `Need at least 20 performance data points for reliable analysis. Currently have ${performanceData.length}.`,
        'Continue tracking performance and mental state metrics.',
      ],
    };
  }

  const correlations: CorrelationResult[] = [];

  // For each performance metric, find the closest mental state data (within 24 hours before)
  const performanceDates = performanceData.map((p) => p.gameDate);

  // Fetch mood logs (within 24 hours before each performance)
  const moodData = await prisma.moodLog.findMany({
    where: {
      athleteId,
      createdAt: {
        gte: new Date(fromDate.getTime() - 24 * 60 * 60 * 1000), // 24h before first performance
        lte: toDate,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      createdAt: true,
      mood: true,
      stress: true,
      confidence: true,
      sleep: true,
    },
  });

  // Fetch readiness scores (within 24 hours before each performance)
  const readinessData = await prisma.readinessScore.findMany({
    where: {
      athleteId,
      calculatedAt: {
        gte: new Date(fromDate.getTime() - 24 * 60 * 60 * 1000),
        lte: toDate,
      },
    },
    orderBy: {
      calculatedAt: 'asc',
    },
    select: {
      calculatedAt: true,
      score: true,
    },
  });

  // Match each performance with the closest mental state metric (within 24h before)
  const matchedData: {
    performance: number;
    mood?: number;
    stress?: number;
    confidence?: number;
    sleep?: number;
    readiness?: number;
  }[] = [];

  for (const perf of performanceData) {
    // Skip performances without readiness score
    if (!perf.readinessScore) continue;

    const perfDate = perf.gameDate.getTime();
    const match: any = { performance: perf.readinessScore };

    // Find closest mood log (within 24h before performance)
    const closestMood = moodData.find((m) => {
      const moodTime = m.createdAt.getTime();
      const hoursBefore = (perfDate - moodTime) / (1000 * 60 * 60);
      return hoursBefore >= 0 && hoursBefore <= 24;
    });

    if (closestMood) {
      match.mood = closestMood.mood;
      match.stress = closestMood.stress;
      match.confidence = closestMood.confidence;
      match.sleep = closestMood.sleep;
    }

    // Find closest readiness score
    const closestReadiness = readinessData.find((r) => {
      const readinessTime = r.calculatedAt.getTime();
      const hoursBefore = (perfDate - readinessTime) / (1000 * 60 * 60);
      return hoursBefore >= 0 && hoursBefore <= 24;
    });

    if (closestReadiness) {
      match.readiness = closestReadiness.score;
    }

    matchedData.push(match);
  }

  // Calculate correlations for each metric
  const metrics: { key: keyof typeof matchedData[0]; name: string }[] = [
    { key: 'mood', name: 'Mood' },
    { key: 'stress', name: 'Stress' },
    { key: 'confidence', name: 'Confidence' },
    { key: 'sleep', name: 'Sleep Quality' },
    { key: 'readiness', name: 'Readiness Score' },
  ];

  for (const metric of metrics) {
    const metricValues = matchedData
      .filter((d) => d[metric.key] !== undefined)
      .map((d) => d[metric.key]!);

    const performanceValues = matchedData
      .filter((d) => d[metric.key] !== undefined)
      .map((d) => d.performance);

    if (metricValues.length >= 10) {
      // Need at least 10 paired observations
      const r = calculatePearsonCorrelation(metricValues, performanceValues);
      const strength = getCorrelationStrength(r);
      const isSignificant = isStatisticallySignificant(r, metricValues.length);
      const direction = r > 0.05 ? 'positive' : r < -0.05 ? 'negative' : 'none';

      correlations.push({
        metric: metric.name,
        correlation: Math.round(r * 100) / 100, // 2 decimal places
        strength,
        direction,
        sampleSize: metricValues.length,
        isSignificant,
        insight: generateInsight(metric.name, r, strength),
      });
    }
  }

  // Sort by absolute correlation strength
  correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  // Identify top factor (strongest significant correlation)
  const topFactor = correlations.find((c) => c.isSignificant) || correlations[0] || null;

  // Generate recommendations
  const recommendations: string[] = [];

  if (topFactor) {
    if (topFactor.strength === 'very_strong' || topFactor.strength === 'strong') {
      recommendations.push(
        `Focus interventions on ${topFactor.metric} - it has the strongest link to performance.`
      );
    }

    // Identify concerning patterns
    const negativeFactors = correlations.filter(
      (c) => c.direction === 'negative' && c.isSignificant && Math.abs(c.correlation) >= 0.3
    );

    if (negativeFactors.length > 0) {
      recommendations.push(
        `Warning: ${negativeFactors.map((f) => f.metric).join(', ')} negatively impact performance. Address these immediately.`
      );
    }

    // Sample size notes
    const lowSampleMetrics = correlations.filter((c) => c.sampleSize < 20);
    if (lowSampleMetrics.length > 0) {
      recommendations.push(
        `Increase tracking frequency for ${lowSampleMetrics.map((m) => m.metric).join(', ')} to improve analysis reliability.`
      );
    }
  } else {
    recommendations.push('No significant correlations found. Continue tracking data to identify patterns.');
  }

  return {
    athleteId,
    dateRange: { from: fromDate, to: toDate },
    correlations,
    topFactor,
    recommendations,
  };
}

/**
 * Get team-wide performance correlations (aggregated across athletes)
 *
 * OPTIMIZED: Uses batched queries to fetch all data at once instead of per-athlete
 */
export async function analyzeTeamPerformanceCorrelations(
  schoolId: string,
  sport?: string,
  days: number = 90
): Promise<{
  teamSize: number;
  avgCorrelations: CorrelationResult[];
  consistentFactors: string[]; // Factors that correlate across >70% of athletes
}> {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  const fromDateMinus24h = new Date(fromDate.getTime() - 24 * 60 * 60 * 1000);

  // Get all athletes for the school/sport
  const athletes = await prisma.athlete.findMany({
    where: {
      User: { schoolId },
      ...(sport && { sport }),
    },
    select: { userId: true },
  });

  const athleteIds = athletes.map((a) => a.userId);

  if (athleteIds.length === 0) {
    return { teamSize: 0, avgCorrelations: [], consistentFactors: [] };
  }

  // BATCH FETCH: Get all data for all athletes in parallel
  const [allPerformance, allMoods, allReadiness] = await Promise.all([
    prisma.performanceMetric.findMany({
      where: {
        athleteId: { in: athleteIds },
        gameDate: { gte: fromDate, lte: toDate },
      },
      orderBy: { gameDate: 'asc' },
      select: { athleteId: true, gameDate: true, readinessScore: true },
    }),
    prisma.moodLog.findMany({
      where: {
        athleteId: { in: athleteIds },
        createdAt: { gte: fromDateMinus24h, lte: toDate },
      },
      orderBy: { createdAt: 'asc' },
      select: { athleteId: true, createdAt: true, mood: true, stress: true, confidence: true, sleep: true },
    }),
    prisma.readinessScore.findMany({
      where: {
        athleteId: { in: athleteIds },
        calculatedAt: { gte: fromDateMinus24h, lte: toDate },
      },
      orderBy: { calculatedAt: 'asc' },
      select: { athleteId: true, calculatedAt: true, score: true },
    }),
  ]);

  // Index data by athleteId
  const perfByAthlete = new Map<string, typeof allPerformance>();
  for (const p of allPerformance) {
    if (!perfByAthlete.has(p.athleteId)) perfByAthlete.set(p.athleteId, []);
    perfByAthlete.get(p.athleteId)!.push(p);
  }

  const moodsByAthlete = new Map<string, typeof allMoods>();
  for (const m of allMoods) {
    if (!moodsByAthlete.has(m.athleteId)) moodsByAthlete.set(m.athleteId, []);
    moodsByAthlete.get(m.athleteId)!.push(m);
  }

  const readinessByAthlete = new Map<string, typeof allReadiness>();
  for (const r of allReadiness) {
    if (!readinessByAthlete.has(r.athleteId)) readinessByAthlete.set(r.athleteId, []);
    readinessByAthlete.get(r.athleteId)!.push(r);
  }

  // Calculate correlations per athlete using pre-fetched data
  const metricAggregates: Record<string, { correlations: number[]; athleteCount: number }> = {};

  for (const athleteId of athleteIds) {
    const performanceData = perfByAthlete.get(athleteId) || [];
    const moodData = moodsByAthlete.get(athleteId) || [];
    const readinessData = readinessByAthlete.get(athleteId) || [];

    if (performanceData.length < 10) continue; // Need minimum data

    // Match performance with mental state metrics
    const matchedData: {
      performance: number;
      mood?: number;
      stress?: number;
      confidence?: number;
      sleep?: number;
      readiness?: number;
    }[] = [];

    for (const perf of performanceData) {
      if (!perf.readinessScore) continue;
      const perfDate = perf.gameDate.getTime();
      const match: any = { performance: perf.readinessScore };

      const closestMood = moodData.find((m) => {
        const hoursBefore = (perfDate - m.createdAt.getTime()) / (1000 * 60 * 60);
        return hoursBefore >= 0 && hoursBefore <= 24;
      });

      if (closestMood) {
        match.mood = closestMood.mood;
        match.stress = closestMood.stress;
        match.confidence = closestMood.confidence;
        match.sleep = closestMood.sleep;
      }

      const closestReadiness = readinessData.find((r) => {
        const hoursBefore = (perfDate - r.calculatedAt.getTime()) / (1000 * 60 * 60);
        return hoursBefore >= 0 && hoursBefore <= 24;
      });

      if (closestReadiness) {
        match.readiness = closestReadiness.score;
      }

      matchedData.push(match);
    }

    // Calculate correlations for this athlete
    const metrics: { key: string; name: string }[] = [
      { key: 'mood', name: 'Mood' },
      { key: 'stress', name: 'Stress' },
      { key: 'confidence', name: 'Confidence' },
      { key: 'sleep', name: 'Sleep Quality' },
      { key: 'readiness', name: 'Readiness Score' },
    ];

    for (const metric of metrics) {
      const metricValues = matchedData
        .filter((d) => (d as any)[metric.key] !== undefined)
        .map((d) => (d as any)[metric.key] as number);
      const performanceValues = matchedData
        .filter((d) => (d as any)[metric.key] !== undefined)
        .map((d) => d.performance);

      if (metricValues.length >= 5) {
        const r = calculatePearsonCorrelation(metricValues, performanceValues);
        const isSignificant = isStatisticallySignificant(r, metricValues.length);

        if (!metricAggregates[metric.name]) {
          metricAggregates[metric.name] = { correlations: [], athleteCount: 0 };
        }
        metricAggregates[metric.name].correlations.push(r);
        if (isSignificant) {
          metricAggregates[metric.name].athleteCount++;
        }
      }
    }
  }

  // Calculate average correlations
  const avgCorrelations: CorrelationResult[] = Object.entries(metricAggregates).map(
    ([metric, data]) => {
      const avgR = data.correlations.reduce((sum, r) => sum + r, 0) / data.correlations.length;
      const strength = getCorrelationStrength(avgR);
      const direction = avgR > 0.05 ? 'positive' : avgR < -0.05 ? 'negative' : 'none';

      return {
        metric,
        correlation: Math.round(avgR * 100) / 100,
        strength,
        direction,
        sampleSize: data.correlations.length,
        isSignificant: data.athleteCount / athletes.length >= 0.5,
        insight: generateInsight(metric, avgR, strength),
      };
    }
  );

  // Identify consistent factors
  const consistentFactors = Object.entries(metricAggregates)
    .filter(([_, data]) => data.athleteCount / athletes.length >= 0.7)
    .map(([metric]) => metric);

  return {
    teamSize: athletes.length,
    avgCorrelations: avgCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)),
    consistentFactors,
  };
}
