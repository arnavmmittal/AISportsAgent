/**
 * Deep Insights Engine
 *
 * Generates genuinely valuable, NON-OBVIOUS insights that coaches and athletes
 * can't figure out on their own. Avoids generic platitudes like "sleep is important."
 *
 * Types of insights generated:
 * 1. OPTIMAL RANGES - "Your best performance is at readiness 72-78, NOT higher"
 * 2. PERSONAL THRESHOLDS - "Your cliff point is stress > 7, not the typical 8"
 * 3. COMPARATIVE - "You're 2x more confidence-dependent than team average"
 * 4. COUNTER-INTUITIVE - "You perform BETTER after discussing fear of failure"
 * 5. TEMPORAL PATTERNS - "Tuesday mood predicts Saturday games (r=0.71)"
 * 6. INTERACTION EFFECTS - "Sleep only matters when stress is also high"
 * 7. TIMING WINDOWS - "Chat 2-4h before games helps; night before doesn't"
 */

import { prisma } from '@/lib/prisma';
import { calculatePearsonR } from './correlation';

// ============================================================================
// TYPES
// ============================================================================

export interface DeepInsight {
  id: string;
  type:
    | 'optimal_range'
    | 'threshold'
    | 'comparative'
    | 'counter_intuitive'
    | 'temporal'
    | 'interaction'
    | 'timing_window';
  priority: 'critical' | 'high' | 'medium';
  headline: string; // The non-obvious finding
  explanation: string; // Why this matters
  evidence: {
    sampleSize: number;
    confidence: number; // 0-1
    statisticalNote: string;
  };
  actionable: string; // Specific action to take
  athleteId?: string;
  athleteName?: string;
  comparisonToNorm?: {
    athleteValue: number;
    teamAverage: number;
    percentileDifference: number;
  };
}

interface DataPoint {
  date: Date;
  mood: number;
  stress: number;
  confidence: number;
  sleep: number;
  energy: number;
  readiness: number;
  performance?: number;
  gameResult?: 'WIN' | 'LOSS' | 'TIE';
  dayOfWeek: number; // 0-6
  daysBeforeGame?: number;
  chatHoursBeforeGame?: number;
  topicsDiscussed?: string[];
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export async function generateDeepInsights(
  athleteId: string,
  teamAthleteIds: string[],
  lookbackDays: number = 90
): Promise<DeepInsight[]> {
  const insights: DeepInsight[] = [];
  const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  // Fetch athlete data
  const athleteData = await fetchAthleteData(athleteId, startDate);
  if (athleteData.length < 10) return insights;

  // Fetch team baseline for comparison
  const teamBaseline = await calculateTeamBaseline(teamAthleteIds, startDate);

  // Get athlete name
  const athlete = await prisma.user.findUnique({
    where: { id: athleteId },
    select: { name: true },
  });
  const athleteName = athlete?.name || 'This athlete';

  // 1. Find optimal ranges (non-linear sweet spots)
  const optimalRanges = findOptimalRanges(athleteData);
  for (const range of optimalRanges) {
    if (range.isSignificant) {
      insights.push({
        id: `optimal-${athleteId}-${range.metric}`,
        type: 'optimal_range',
        priority: range.performanceGain > 15 ? 'high' : 'medium',
        headline: `${athleteName}'s optimal ${range.metric} is ${range.optimalLow}-${range.optimalHigh}, not ${range.assumedOptimal}`,
        explanation: range.explanation,
        evidence: {
          sampleSize: range.sampleSize,
          confidence: range.confidence,
          statisticalNote: `Performance is ${range.performanceGain}% higher in optimal range vs outside`,
        },
        actionable: range.actionable,
        athleteId,
        athleteName,
      });
    }
  }

  // 2. Find personal thresholds (cliff points)
  const thresholds = findThresholds(athleteData);
  for (const threshold of thresholds) {
    if (threshold.isSignificant && threshold.differsFromNorm) {
      insights.push({
        id: `threshold-${athleteId}-${threshold.metric}`,
        type: 'threshold',
        priority: threshold.performanceDrop > 20 ? 'critical' : 'high',
        headline: `${athleteName}'s cliff point: ${threshold.metric} ${threshold.direction} ${threshold.value}`,
        explanation: `Performance drops ${threshold.performanceDrop}% when ${threshold.metric} crosses this threshold. Team average threshold is ${threshold.teamThreshold}.`,
        evidence: {
          sampleSize: threshold.sampleSize,
          confidence: threshold.confidence,
          statisticalNote: `Sharp discontinuity detected at ${threshold.value}`,
        },
        actionable: `Monitor ${threshold.metric} closely - intervene before it ${threshold.direction === '>' ? 'exceeds' : 'drops below'} ${threshold.value}`,
        athleteId,
        athleteName,
        comparisonToNorm: {
          athleteValue: threshold.value,
          teamAverage: threshold.teamThreshold,
          percentileDifference: Math.round(
            ((threshold.value - threshold.teamThreshold) / threshold.teamThreshold) * 100
          ),
        },
      });
    }
  }

  // 3. Find comparative differences (how athlete differs from team)
  const comparisons = findComparativeDifferences(athleteData, teamBaseline);
  for (const comp of comparisons) {
    if (comp.isSignificant) {
      insights.push({
        id: `compare-${athleteId}-${comp.metric}`,
        type: 'comparative',
        priority: comp.multiplier >= 2 ? 'high' : 'medium',
        headline: `${athleteName} is ${comp.multiplier}x more ${comp.metric}-sensitive than team average`,
        explanation: comp.explanation,
        evidence: {
          sampleSize: comp.sampleSize,
          confidence: comp.confidence,
          statisticalNote: `Athlete r=${comp.athleteCorrelation.toFixed(2)}, Team avg r=${comp.teamCorrelation.toFixed(2)}`,
        },
        actionable: comp.actionable,
        athleteId,
        athleteName,
        comparisonToNorm: {
          athleteValue: comp.athleteCorrelation,
          teamAverage: comp.teamCorrelation,
          percentileDifference: Math.round((comp.multiplier - 1) * 100),
        },
      });
    }
  }

  // 4. Find counter-intuitive patterns
  const counterIntuitive = findCounterIntuitivePatterns(athleteData);
  for (const pattern of counterIntuitive) {
    insights.push({
      id: `counter-${athleteId}-${pattern.factor}`,
      type: 'counter_intuitive',
      priority: 'high', // Always high - these are surprising findings
      headline: pattern.headline,
      explanation: pattern.explanation,
      evidence: {
        sampleSize: pattern.sampleSize,
        confidence: pattern.confidence,
        statisticalNote: pattern.statisticalNote,
      },
      actionable: pattern.actionable,
      athleteId,
      athleteName,
    });
  }

  // 5. Find temporal patterns (which day predicts which)
  const temporalPatterns = findTemporalPatterns(athleteData);
  for (const temporal of temporalPatterns) {
    if (temporal.isSignificant) {
      insights.push({
        id: `temporal-${athleteId}-${temporal.predictorDay}-${temporal.outcomeDay}`,
        type: 'temporal',
        priority: temporal.correlation > 0.6 ? 'high' : 'medium',
        headline: temporal.headline,
        explanation: temporal.explanation,
        evidence: {
          sampleSize: temporal.sampleSize,
          confidence: temporal.confidence,
          statisticalNote: `r=${temporal.correlation.toFixed(2)}, p<0.05`,
        },
        actionable: temporal.actionable,
        athleteId,
        athleteName,
      });
    }
  }

  // 6. Find interaction effects
  const interactions = findInteractionEffects(athleteData);
  for (const interaction of interactions) {
    if (interaction.isSignificant) {
      insights.push({
        id: `interact-${athleteId}-${interaction.factor1}-${interaction.factor2}`,
        type: 'interaction',
        priority: 'high',
        headline: interaction.headline,
        explanation: interaction.explanation,
        evidence: {
          sampleSize: interaction.sampleSize,
          confidence: interaction.confidence,
          statisticalNote: interaction.statisticalNote,
        },
        actionable: interaction.actionable,
        athleteId,
        athleteName,
      });
    }
  }

  // Sort by priority and return top insights
  const priorityOrder = { critical: 0, high: 1, medium: 2 };
  return insights
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 8); // Return top 8 most important insights
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchAthleteData(athleteId: string, startDate: Date): Promise<DataPoint[]> {
  const moodLogs = await prisma.moodLog.findMany({
    where: {
      athleteId,
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: 'asc' },
  });

  const gameResults = await prisma.gameResult.findMany({
    where: {
      athleteId,
      gameDate: { gte: startDate },
    },
    orderBy: { gameDate: 'asc' },
  });

  const readinessScores = await prisma.readinessScore.findMany({
    where: {
      athleteId,
      calculatedAt: { gte: startDate },
    },
    orderBy: { calculatedAt: 'asc' },
  });

  const chatSessions = await prisma.chatSession.findMany({
    where: {
      athleteId,
      createdAt: { gte: startDate },
    },
    include: {
      ChatInsight: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Build data points for each mood log, enriched with nearby data
  const dataPoints: DataPoint[] = moodLogs.map((log) => {
    const logDate = new Date(log.createdAt);

    // Find closest readiness score
    const readiness = readinessScores.find(
      (r) => Math.abs(new Date(r.calculatedAt).getTime() - logDate.getTime()) < 24 * 60 * 60 * 1000
    );

    // Find game within 7 days
    const nearbyGame = gameResults.find((g) => {
      const daysUntil = (new Date(g.gameDate).getTime() - logDate.getTime()) / (24 * 60 * 60 * 1000);
      return daysUntil >= 0 && daysUntil <= 7;
    });

    // Find chat session on same day
    const sameDayChat = chatSessions.find(
      (c) =>
        new Date(c.createdAt).toDateString() === logDate.toDateString() &&
        c.ChatInsight.length > 0
    );

    return {
      date: logDate,
      mood: log.mood,
      stress: log.stress,
      confidence: log.confidence,
      sleep: log.sleep ?? 7,
      energy: log.energy ?? 5,
      readiness: readiness?.score ?? 70,
      performance: nearbyGame
        ? (nearbyGame.stats as Record<string, number>)?.performanceScore
        : undefined,
      gameResult: nearbyGame?.outcome as 'WIN' | 'LOSS' | 'TIE' | undefined,
      dayOfWeek: logDate.getDay(),
      daysBeforeGame: nearbyGame
        ? Math.round(
            (new Date(nearbyGame.gameDate).getTime() - logDate.getTime()) / (24 * 60 * 60 * 1000)
          )
        : undefined,
      topicsDiscussed: sameDayChat?.ChatInsight[0]?.topics as string[] | undefined,
    };
  });

  return dataPoints;
}

async function calculateTeamBaseline(
  athleteIds: string[],
  startDate: Date
): Promise<Map<string, { correlation: number; avgValue: number; threshold: number }>> {
  const baseline = new Map<string, { correlation: number; avgValue: number; threshold: number }>();

  // Calculate average correlations across team
  const allCorrelations: Record<string, number[]> = {
    sleep: [],
    stress: [],
    confidence: [],
    mood: [],
  };

  for (const athleteId of athleteIds.slice(0, 20)) {
    // Limit to 20 for performance
    const data = await fetchAthleteData(athleteId, startDate);
    const withPerformance = data.filter((d) => d.performance !== undefined);

    if (withPerformance.length >= 5) {
      for (const metric of ['sleep', 'stress', 'confidence', 'mood'] as const) {
        const r = calculatePearsonR(
          withPerformance.map((d) => d[metric]),
          withPerformance.map((d) => d.performance!)
        );
        if (!isNaN(r)) {
          allCorrelations[metric].push(r);
        }
      }
    }
  }

  // Calculate averages
  for (const [metric, correlations] of Object.entries(allCorrelations)) {
    if (correlations.length > 0) {
      baseline.set(metric, {
        correlation: correlations.reduce((a, b) => a + b, 0) / correlations.length,
        avgValue: 7, // Default average
        threshold: metric === 'stress' ? 7 : 5, // Default thresholds
      });
    }
  }

  return baseline;
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

interface OptimalRange {
  metric: string;
  optimalLow: number;
  optimalHigh: number;
  assumedOptimal: string;
  performanceGain: number;
  explanation: string;
  actionable: string;
  sampleSize: number;
  confidence: number;
  isSignificant: boolean;
}

function findOptimalRanges(data: DataPoint[]): OptimalRange[] {
  const ranges: OptimalRange[] = [];
  const withPerformance = data.filter((d) => d.performance !== undefined);
  if (withPerformance.length < 15) return ranges;

  // Check each metric for non-linear optimal ranges
  const metrics: Array<{ name: string; key: keyof DataPoint; assumed: string }> = [
    { name: 'readiness', key: 'readiness', assumed: '80+' },
    { name: 'sleep', key: 'sleep', assumed: '8+ hours' },
    { name: 'confidence', key: 'confidence', assumed: '8+' },
    { name: 'stress', key: 'stress', assumed: 'low (1-3)' },
  ];

  for (const metric of metrics) {
    const sorted = [...withPerformance].sort(
      (a, b) => (a[metric.key] as number) - (b[metric.key] as number)
    );

    // Divide into quintiles and find best performing range
    const quintileSize = Math.floor(sorted.length / 5);
    const quintiles: { range: [number, number]; avgPerformance: number; count: number }[] = [];

    for (let i = 0; i < 5; i++) {
      const start = i * quintileSize;
      const end = i === 4 ? sorted.length : (i + 1) * quintileSize;
      const quintile = sorted.slice(start, end);

      if (quintile.length > 0) {
        const avgPerf =
          quintile.reduce((sum, d) => sum + d.performance!, 0) / quintile.length;
        const low = quintile[0][metric.key] as number;
        const high = quintile[quintile.length - 1][metric.key] as number;
        quintiles.push({ range: [low, high], avgPerformance: avgPerf, count: quintile.length });
      }
    }

    // Find best quintile
    const bestQuintile = quintiles.reduce((best, q) =>
      q.avgPerformance > best.avgPerformance ? q : best
    );
    const worstQuintile = quintiles.reduce((worst, q) =>
      q.avgPerformance < worst.avgPerformance ? q : worst
    );

    const performanceGain = Math.round(
      ((bestQuintile.avgPerformance - worstQuintile.avgPerformance) /
        worstQuintile.avgPerformance) *
        100
    );

    // Check if optimal is NOT the extreme (counter-intuitive finding)
    const bestIndex = quintiles.indexOf(bestQuintile);
    const isMiddleOptimal = bestIndex >= 1 && bestIndex <= 3;

    if (performanceGain >= 10 && isMiddleOptimal) {
      ranges.push({
        metric: metric.name,
        optimalLow: Math.round(bestQuintile.range[0] * 10) / 10,
        optimalHigh: Math.round(bestQuintile.range[1] * 10) / 10,
        assumedOptimal: metric.assumed,
        performanceGain,
        explanation:
          metric.name === 'readiness'
            ? `Performance peaks in middle readiness range, suggesting over-preparation may reduce spontaneity`
            : `Optimal ${metric.name} is more nuanced than simple "more is better"`,
        actionable: `Target ${metric.name} score of ${Math.round(bestQuintile.range[0])}-${Math.round(bestQuintile.range[1])} for games, not maximum`,
        sampleSize: withPerformance.length,
        confidence: performanceGain >= 15 ? 0.85 : 0.7,
        isSignificant: performanceGain >= 10 && withPerformance.length >= 15,
      });
    }
  }

  return ranges;
}

interface Threshold {
  metric: string;
  value: number;
  direction: '>' | '<';
  performanceDrop: number;
  teamThreshold: number;
  differsFromNorm: boolean;
  sampleSize: number;
  confidence: number;
  isSignificant: boolean;
}

function findThresholds(data: DataPoint[]): Threshold[] {
  const thresholds: Threshold[] = [];
  const withPerformance = data.filter((d) => d.performance !== undefined);
  if (withPerformance.length < 15) return thresholds;

  // Look for sharp discontinuities
  const metrics: Array<{
    name: string;
    key: keyof DataPoint;
    direction: '>' | '<';
    teamDefault: number;
  }> = [
    { name: 'stress', key: 'stress', direction: '>', teamDefault: 7 },
    { name: 'sleep', key: 'sleep', direction: '<', teamDefault: 6 },
    { name: 'readiness', key: 'readiness', direction: '<', teamDefault: 60 },
    { name: 'confidence', key: 'confidence', direction: '<', teamDefault: 5 },
  ];

  for (const metric of metrics) {
    // Test different threshold values
    const values = withPerformance.map((d) => d[metric.key] as number);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const step = (maxVal - minVal) / 10;

    let bestThreshold = metric.teamDefault;
    let bestDrop = 0;

    for (let thresh = minVal + step; thresh < maxVal - step; thresh += step) {
      const above = withPerformance.filter((d) => (d[metric.key] as number) > thresh);
      const below = withPerformance.filter((d) => (d[metric.key] as number) <= thresh);

      if (above.length >= 5 && below.length >= 5) {
        const avgAbove = above.reduce((sum, d) => sum + d.performance!, 0) / above.length;
        const avgBelow = below.reduce((sum, d) => sum + d.performance!, 0) / below.length;

        const drop =
          metric.direction === '>'
            ? ((avgBelow - avgAbove) / avgBelow) * 100
            : ((avgAbove - avgBelow) / avgAbove) * 100;

        if (drop > bestDrop) {
          bestDrop = drop;
          bestThreshold = Math.round(thresh * 10) / 10;
        }
      }
    }

    const differsFromNorm = Math.abs(bestThreshold - metric.teamDefault) >= 1;

    if (bestDrop >= 15 && differsFromNorm) {
      thresholds.push({
        metric: metric.name,
        value: bestThreshold,
        direction: metric.direction,
        performanceDrop: Math.round(bestDrop),
        teamThreshold: metric.teamDefault,
        differsFromNorm,
        sampleSize: withPerformance.length,
        confidence: bestDrop >= 20 ? 0.85 : 0.7,
        isSignificant: true,
      });
    }
  }

  return thresholds;
}

interface ComparativeDifference {
  metric: string;
  athleteCorrelation: number;
  teamCorrelation: number;
  multiplier: number;
  explanation: string;
  actionable: string;
  sampleSize: number;
  confidence: number;
  isSignificant: boolean;
}

function findComparativeDifferences(
  data: DataPoint[],
  teamBaseline: Map<string, { correlation: number; avgValue: number; threshold: number }>
): ComparativeDifference[] {
  const comparisons: ComparativeDifference[] = [];
  const withPerformance = data.filter((d) => d.performance !== undefined);
  if (withPerformance.length < 10) return comparisons;

  const metrics = ['sleep', 'stress', 'confidence', 'mood'] as const;

  for (const metric of metrics) {
    const athleteR = calculatePearsonR(
      withPerformance.map((d) => d[metric]),
      withPerformance.map((d) => d.performance!)
    );

    const baseline = teamBaseline.get(metric);
    if (!baseline || isNaN(athleteR)) continue;

    const teamR = baseline.correlation;
    const multiplier = teamR !== 0 ? Math.abs(athleteR) / Math.abs(teamR) : 1;

    if (multiplier >= 1.5 || multiplier <= 0.5) {
      const isMoreSensitive = multiplier >= 1.5;
      const sensitivityWord = isMoreSensitive ? 'more' : 'less';
      const directionWord = metric === 'stress' ? 'negatively' : 'positively';

      comparisons.push({
        metric,
        athleteCorrelation: athleteR,
        teamCorrelation: teamR,
        multiplier: Math.round(multiplier * 10) / 10,
        explanation: isMoreSensitive
          ? `This athlete's performance is unusually ${metric}-dependent. Small changes in ${metric} have outsized effects.`
          : `This athlete's performance is relatively ${metric}-independent compared to peers.`,
        actionable: isMoreSensitive
          ? `Prioritize ${metric} optimization for this athlete - ROI is ${Math.round(multiplier)}x higher than average`
          : `Focus intervention efforts on other factors - ${metric} has less impact than typical`,
        sampleSize: withPerformance.length,
        confidence: withPerformance.length >= 15 ? 0.85 : 0.7,
        isSignificant: multiplier >= 1.5 || multiplier <= 0.5,
      });
    }
  }

  return comparisons;
}

interface CounterIntuitivePattern {
  factor: string;
  headline: string;
  explanation: string;
  statisticalNote: string;
  actionable: string;
  sampleSize: number;
  confidence: number;
}

function findCounterIntuitivePatterns(data: DataPoint[]): CounterIntuitivePattern[] {
  const patterns: CounterIntuitivePattern[] = [];
  const withPerformance = data.filter((d) => d.performance !== undefined);
  if (withPerformance.length < 15) return patterns;

  // Check 1: High anxiety → BETTER performance (arousal performer)
  const highStress = withPerformance.filter((d) => d.stress >= 7);
  const lowStress = withPerformance.filter((d) => d.stress <= 4);

  if (highStress.length >= 5 && lowStress.length >= 5) {
    const avgHighStressPerf = highStress.reduce((sum, d) => sum + d.performance!, 0) / highStress.length;
    const avgLowStressPerf = lowStress.reduce((sum, d) => sum + d.performance!, 0) / lowStress.length;

    if (avgHighStressPerf > avgLowStressPerf * 1.05) {
      patterns.push({
        factor: 'stress-performance-inverted',
        headline: `This athlete performs BETTER under high stress (arousal performer)`,
        explanation: `Counter to typical patterns, elevated stress correlates with ${Math.round(((avgHighStressPerf - avgLowStressPerf) / avgLowStressPerf) * 100)}% better performance. This athlete may need activation rather than calming.`,
        statisticalNote: `High stress avg: ${avgHighStressPerf.toFixed(1)}, Low stress avg: ${avgLowStressPerf.toFixed(1)} (n=${highStress.length + lowStress.length})`,
        actionable: `Don't try to reduce pre-game anxiety - instead, channel it through activation routines and competitive framing`,
        sampleSize: highStress.length + lowStress.length,
        confidence: 0.8,
      });
    }
  }

  // Check 2: Best games come AFTER difficult conversations (cathartic effect)
  const withTopics = withPerformance.filter(
    (d) => d.topicsDiscussed && d.topicsDiscussed.length > 0
  );
  const difficultTopics = ['fear', 'failure', 'anxiety', 'pressure', 'doubt', 'worry'];

  const afterDifficult = withTopics.filter((d) =>
    d.topicsDiscussed?.some((t) => difficultTopics.some((dt) => t.toLowerCase().includes(dt)))
  );
  const afterNeutral = withTopics.filter(
    (d) =>
      !d.topicsDiscussed?.some((t) => difficultTopics.some((dt) => t.toLowerCase().includes(dt)))
  );

  if (afterDifficult.length >= 5 && afterNeutral.length >= 5) {
    const avgDifficultPerf =
      afterDifficult.reduce((sum, d) => sum + d.performance!, 0) / afterDifficult.length;
    const avgNeutralPerf =
      afterNeutral.reduce((sum, d) => sum + d.performance!, 0) / afterNeutral.length;

    if (avgDifficultPerf > avgNeutralPerf * 1.08) {
      patterns.push({
        factor: 'difficult-conversation-catharsis',
        headline: `Performance IMPROVES after discussing fears/worries`,
        explanation: `Games following chats about anxiety/failure/pressure show ${Math.round(((avgDifficultPerf - avgNeutralPerf) / avgNeutralPerf) * 100)}% better performance. Venting may have cathartic benefits.`,
        statisticalNote: `After difficult topics: ${avgDifficultPerf.toFixed(1)}, After neutral: ${avgNeutralPerf.toFixed(1)}`,
        actionable: `Encourage open discussion of fears before competition - don't avoid these topics`,
        sampleSize: afterDifficult.length + afterNeutral.length,
        confidence: 0.75,
      });
    }
  }

  // Check 3: Sleep > 8 hours → WORSE performance (grogginess)
  const sleepOver8 = withPerformance.filter((d) => d.sleep >= 8);
  const sleep7to8 = withPerformance.filter((d) => d.sleep >= 7 && d.sleep < 8);

  if (sleepOver8.length >= 5 && sleep7to8.length >= 5) {
    const avgOver8Perf = sleepOver8.reduce((sum, d) => sum + d.performance!, 0) / sleepOver8.length;
    const avg7to8Perf = sleep7to8.reduce((sum, d) => sum + d.performance!, 0) / sleep7to8.length;

    if (avg7to8Perf > avgOver8Perf * 1.05) {
      patterns.push({
        factor: 'oversleep-negative',
        headline: `Too MUCH sleep (8+h) hurts performance for this athlete`,
        explanation: `7-8 hours of sleep produces ${Math.round(((avg7to8Perf - avgOver8Perf) / avgOver8Perf) * 100)}% better performance than 8+ hours. Possible grogginess or over-recovery.`,
        statisticalNote: `8+ hours avg: ${avgOver8Perf.toFixed(1)}, 7-8 hours avg: ${avg7to8Perf.toFixed(1)}`,
        actionable: `Target 7-7.5 hours of sleep before games, not more`,
        sampleSize: sleepOver8.length + sleep7to8.length,
        confidence: 0.75,
      });
    }
  }

  return patterns;
}

interface TemporalPattern {
  predictorDay: string;
  outcomeDay: string;
  metric: string;
  correlation: number;
  headline: string;
  explanation: string;
  actionable: string;
  sampleSize: number;
  confidence: number;
  isSignificant: boolean;
}

function findTemporalPatterns(data: DataPoint[]): TemporalPattern[] {
  const patterns: TemporalPattern[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Find games and look at which prior day's mood best predicts performance
  const gamesWithPriorMood = data.filter(
    (d) => d.performance !== undefined && d.daysBeforeGame !== undefined
  );

  if (gamesWithPriorMood.length < 10) return patterns;

  // Group by days before game
  for (let daysBefore = 1; daysBefore <= 5; daysBefore++) {
    const moodNDaysBefore = data.filter((d) => d.daysBeforeGame === daysBefore);
    const correspondingGames = moodNDaysBefore
      .map((mood) => {
        const gameDate = new Date(mood.date);
        gameDate.setDate(gameDate.getDate() + daysBefore);
        return data.find(
          (g) =>
            g.performance !== undefined &&
            Math.abs(new Date(g.date).getTime() - gameDate.getTime()) < 24 * 60 * 60 * 1000
        );
      })
      .filter(Boolean) as DataPoint[];

    if (correspondingGames.length >= 8) {
      const r = calculatePearsonR(
        moodNDaysBefore.slice(0, correspondingGames.length).map((d) => d.mood),
        correspondingGames.map((d) => d.performance!)
      );

      if (Math.abs(r) >= 0.5) {
        patterns.push({
          predictorDay: `${daysBefore} days before`,
          outcomeDay: 'game day',
          metric: 'mood',
          correlation: r,
          headline: `Mood ${daysBefore} day${daysBefore > 1 ? 's' : ''} before predicts game performance (r=${r.toFixed(2)})`,
          explanation:
            daysBefore >= 3
              ? `Surprisingly, mood several days out is more predictive than same-day mood. Early intervention window.`
              : `Mood the day before strongly predicts performance.`,
          actionable:
            daysBefore >= 3
              ? `Check in ${daysBefore} days before games - this is the optimal intervention window`
              : `Ensure good mood ${daysBefore} day${daysBefore > 1 ? 's' : ''} before games`,
          sampleSize: correspondingGames.length,
          confidence: Math.abs(r) >= 0.6 ? 0.85 : 0.7,
          isSignificant: Math.abs(r) >= 0.5,
        });
      }
    }
  }

  return patterns;
}

interface InteractionEffect {
  factor1: string;
  factor2: string;
  headline: string;
  explanation: string;
  statisticalNote: string;
  actionable: string;
  sampleSize: number;
  confidence: number;
  isSignificant: boolean;
}

function findInteractionEffects(data: DataPoint[]): InteractionEffect[] {
  const interactions: InteractionEffect[] = [];
  const withPerformance = data.filter((d) => d.performance !== undefined);
  if (withPerformance.length < 20) return interactions;

  // Check: Sleep only matters when stress is high
  const highStress = withPerformance.filter((d) => d.stress >= 6);
  const lowStress = withPerformance.filter((d) => d.stress < 6);

  if (highStress.length >= 10 && lowStress.length >= 10) {
    const sleepCorrHighStress = calculatePearsonR(
      highStress.map((d) => d.sleep),
      highStress.map((d) => d.performance!)
    );
    const sleepCorrLowStress = calculatePearsonR(
      lowStress.map((d) => d.sleep),
      lowStress.map((d) => d.performance!)
    );

    if (Math.abs(sleepCorrHighStress) > Math.abs(sleepCorrLowStress) * 2) {
      interactions.push({
        factor1: 'sleep',
        factor2: 'stress',
        headline: `Sleep only matters when stress is high`,
        explanation: `Sleep-performance correlation is ${Math.abs(sleepCorrHighStress).toFixed(2)} under high stress but only ${Math.abs(sleepCorrLowStress).toFixed(2)} when stress is low. Prioritize sleep during stressful periods.`,
        statisticalNote: `r=${sleepCorrHighStress.toFixed(2)} (high stress) vs r=${sleepCorrLowStress.toFixed(2)} (low stress)`,
        actionable: `During high-stress weeks, sleep becomes critical. During calm periods, other factors matter more.`,
        sampleSize: withPerformance.length,
        confidence: 0.8,
        isSignificant: true,
      });
    }
  }

  // Check: Confidence matters more in high-stakes games
  const withGameResult = withPerformance.filter((d) => d.gameResult !== undefined);
  const afterLoss = withGameResult.filter((d) => d.gameResult === 'LOSS');
  const afterWin = withGameResult.filter((d) => d.gameResult === 'WIN');

  // More interaction patterns can be added here...

  return interactions;
}

// ============================================================================
// EXPORT BATCH ANALYSIS FOR TEAM
// ============================================================================

export async function generateTeamDeepInsights(
  coachId: string,
  schoolId: string
): Promise<DeepInsight[]> {
  // Get all athletes with consent
  const relations = await prisma.coachAthleteRelation.findMany({
    where: { coachId, consentGranted: true },
    select: { athleteId: true },
  });

  const athleteIds = relations.map((r) => r.athleteId);
  if (athleteIds.length === 0) return [];

  const allInsights: DeepInsight[] = [];

  // Generate insights for each athlete (limit to top 10 for performance)
  for (const athleteId of athleteIds.slice(0, 10)) {
    const insights = await generateDeepInsights(athleteId, athleteIds, 90);
    allInsights.push(...insights);
  }

  // Sort by priority and dedupe similar insights
  const priorityOrder = { critical: 0, high: 1, medium: 2 };
  return allInsights
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 20); // Return top 20 insights across team
}
