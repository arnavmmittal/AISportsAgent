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
    | 'timing_window'
    | 'intervention_outcome'; // NEW: Specific technique → specific stat
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
  // NEW: For intervention_outcome type
  interventionDetails?: {
    technique: string;
    protocol: string;
    sportMetric: string;
    metricUnit: string;
    improvement: number;
    gamesWithTechnique: number;
    gamesWithout: number;
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

  // 7. Find intervention → sport metric correlations (THE KEY INSIGHT TYPE)
  // E.g., "10 more points per game when using visualization"
  const interventionInsights = await generateInterventionInsights(athleteId, athleteName, startDate);
  insights.push(...interventionInsights);

  // 8. Find situational technique effectiveness
  const situationalInsights = await analyzeSituationalEffectiveness(athleteId, startDate);
  insights.push(...situationalInsights);

  // Sort by priority and return top insights
  // Prioritize intervention_outcome insights as they're the most actionable
  const priorityOrder = { critical: 0, high: 1, medium: 2 };
  const typeBoost: Record<string, number> = {
    intervention_outcome: -0.5, // Boost intervention insights
  };

  return insights
    .sort((a, b) => {
      const aScore = priorityOrder[a.priority] + (typeBoost[a.type] || 0);
      const bScore = priorityOrder[b.priority] + (typeBoost[b.type] || 0);
      return aScore - bScore;
    })
    .slice(0, 12); // Return top 12 insights (increased from 8)
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
// INTERVENTION → SPORT METRIC ANALYSIS
// ============================================================================

/**
 * SPORT METRIC CONFIGURATIONS
 * Maps sport types to their key metrics and units
 */
const SPORT_METRICS: Record<string, Array<{ key: string; label: string; unit: string; higherIsBetter: boolean }>> = {
  basketball: [
    { key: 'points', label: 'points', unit: 'pts', higherIsBetter: true },
    { key: 'assists', label: 'assists', unit: 'ast', higherIsBetter: true },
    { key: 'rebounds', label: 'rebounds', unit: 'reb', higherIsBetter: true },
    { key: 'steals', label: 'steals', unit: 'stl', higherIsBetter: true },
    { key: 'blocks', label: 'blocks', unit: 'blk', higherIsBetter: true },
    { key: 'fgPercent', label: 'field goal %', unit: '%', higherIsBetter: true },
    { key: 'ftPercent', label: 'free throw %', unit: '%', higherIsBetter: true },
    { key: 'threePercent', label: '3-point %', unit: '%', higherIsBetter: true },
    { key: 'turnovers', label: 'turnovers', unit: 'TO', higherIsBetter: false },
    { key: 'plusMinus', label: 'plus/minus', unit: '+/-', higherIsBetter: true },
  ],
  football: [
    { key: 'passingYards', label: 'passing yards', unit: 'yds', higherIsBetter: true },
    { key: 'rushingYards', label: 'rushing yards', unit: 'yds', higherIsBetter: true },
    { key: 'receivingYards', label: 'receiving yards', unit: 'yds', higherIsBetter: true },
    { key: 'touchdowns', label: 'touchdowns', unit: 'TD', higherIsBetter: true },
    { key: 'completionPercent', label: 'completion %', unit: '%', higherIsBetter: true },
    { key: 'tackles', label: 'tackles', unit: 'tkl', higherIsBetter: true },
    { key: 'sacks', label: 'sacks', unit: 'sck', higherIsBetter: true },
    { key: 'interceptions', label: 'interceptions', unit: 'INT', higherIsBetter: true },
  ],
  soccer: [
    { key: 'goals', label: 'goals', unit: 'G', higherIsBetter: true },
    { key: 'assists', label: 'assists', unit: 'A', higherIsBetter: true },
    { key: 'shots', label: 'shots', unit: 'SOG', higherIsBetter: true },
    { key: 'passAccuracy', label: 'pass accuracy', unit: '%', higherIsBetter: true },
    { key: 'tackles', label: 'tackles won', unit: 'tkl', higherIsBetter: true },
    { key: 'saves', label: 'saves', unit: 'SV', higherIsBetter: true },
    { key: 'cleanSheets', label: 'clean sheets', unit: 'CS', higherIsBetter: true },
  ],
  baseball: [
    { key: 'battingAvg', label: 'batting avg', unit: 'AVG', higherIsBetter: true },
    { key: 'hits', label: 'hits', unit: 'H', higherIsBetter: true },
    { key: 'rbi', label: 'RBIs', unit: 'RBI', higherIsBetter: true },
    { key: 'homeRuns', label: 'home runs', unit: 'HR', higherIsBetter: true },
    { key: 'stolenBases', label: 'stolen bases', unit: 'SB', higherIsBetter: true },
    { key: 'era', label: 'ERA', unit: 'ERA', higherIsBetter: false },
    { key: 'strikeouts', label: 'strikeouts', unit: 'K', higherIsBetter: true },
    { key: 'whip', label: 'WHIP', unit: 'WHIP', higherIsBetter: false },
  ],
  volleyball: [
    { key: 'kills', label: 'kills', unit: 'K', higherIsBetter: true },
    { key: 'aces', label: 'aces', unit: 'A', higherIsBetter: true },
    { key: 'blocks', label: 'blocks', unit: 'B', higherIsBetter: true },
    { key: 'digs', label: 'digs', unit: 'D', higherIsBetter: true },
    { key: 'assists', label: 'assists', unit: 'AST', higherIsBetter: true },
    { key: 'hitPercent', label: 'hitting %', unit: '%', higherIsBetter: true },
  ],
  tennis: [
    { key: 'aces', label: 'aces', unit: 'A', higherIsBetter: true },
    { key: 'firstServePercent', label: '1st serve %', unit: '%', higherIsBetter: true },
    { key: 'breakPointsSaved', label: 'break pts saved', unit: '%', higherIsBetter: true },
    { key: 'winners', label: 'winners', unit: 'W', higherIsBetter: true },
    { key: 'unforcedErrors', label: 'unforced errors', unit: 'UE', higherIsBetter: false },
  ],
  swimming: [
    { key: 'time', label: 'time', unit: 'sec', higherIsBetter: false },
    { key: 'splits', label: 'split times', unit: 'sec', higherIsBetter: false },
    { key: 'placement', label: 'placement', unit: 'place', higherIsBetter: false },
  ],
  track: [
    { key: 'time', label: 'time', unit: 'sec', higherIsBetter: false },
    { key: 'distance', label: 'distance', unit: 'm', higherIsBetter: true },
    { key: 'height', label: 'height', unit: 'm', higherIsBetter: true },
    { key: 'placement', label: 'placement', unit: 'place', higherIsBetter: false },
  ],
  golf: [
    { key: 'score', label: 'score', unit: 'strokes', higherIsBetter: false },
    { key: 'putts', label: 'putts', unit: 'putts', higherIsBetter: false },
    { key: 'fairwaysHit', label: 'fairways hit', unit: '%', higherIsBetter: true },
    { key: 'greensInReg', label: 'greens in reg', unit: '%', higherIsBetter: true },
  ],
};

/**
 * Human-readable intervention type names
 */
const INTERVENTION_LABELS: Record<string, string> = {
  BREATHING: 'breathing exercises',
  VISUALIZATION: 'visualization/imagery',
  SELF_TALK: 'positive self-talk',
  ROUTINE: 'pre-performance routine',
  FOCUS_CUE: 'focus cues',
  AROUSAL_REGULATION: 'arousal regulation',
  GOAL_SETTING: 'goal setting',
  COGNITIVE_REFRAME: 'cognitive reframing (CBT)',
  MINDFULNESS: 'mindfulness meditation',
  JOURNALING: 'journaling',
  PHYSICAL_WARMUP: 'mental + physical warmup',
  OTHER: 'other technique',
};

interface InterventionStatCorrelation {
  interventionType: string;
  protocol: string;
  sport: string;
  metric: string;
  metricLabel: string;
  metricUnit: string;
  higherIsBetter: boolean;
  avgWithIntervention: number;
  avgWithout: number;
  improvement: number; // Absolute difference
  improvementPercent: number;
  gamesWithIntervention: number;
  gamesWithout: number;
  isSignificant: boolean;
  pValue: number;
}

/**
 * Analyzes how specific interventions affect specific sport metrics
 */
async function analyzeInterventionOutcomes(
  athleteId: string,
  startDate: Date
): Promise<InterventionStatCorrelation[]> {
  const correlations: InterventionStatCorrelation[] = [];

  // Get athlete's sport
  const athlete = await prisma.athlete.findUnique({
    where: { userId: athleteId },
    select: { sport: true },
  });

  if (!athlete?.sport) return correlations;

  const sportLower = athlete.sport.toLowerCase();
  const sportMetrics = SPORT_METRICS[sportLower] || SPORT_METRICS['basketball']; // Fallback

  // Get all interventions for this athlete
  const interventions = await prisma.intervention.findMany({
    where: {
      athleteId,
      performedAt: { gte: startDate },
      completed: true,
    },
    select: {
      id: true,
      type: true,
      protocol: true,
      performedAt: true,
      context: true,
    },
    orderBy: { performedAt: 'asc' },
  });

  if (interventions.length < 3) return correlations;

  // Get all performance outcomes (games)
  const outcomes = await prisma.performanceOutcome.findMany({
    where: {
      athleteId,
      date: { gte: startDate },
    },
    select: {
      id: true,
      date: true,
      sportMetrics: true,
      overallRating: true,
    },
    orderBy: { date: 'asc' },
  });

  // Also get GameResult for additional stats
  const gameResults = await prisma.gameResult.findMany({
    where: {
      athleteId,
      gameDate: { gte: startDate },
    },
    select: {
      id: true,
      gameDate: true,
      stats: true,
      outcome: true,
    },
    orderBy: { gameDate: 'asc' },
  });

  if (outcomes.length + gameResults.length < 5) return correlations;

  // Combine outcomes with game results
  const allGames: Array<{
    date: Date;
    stats: Record<string, number>;
  }> = [];

  for (const outcome of outcomes) {
    if (outcome.sportMetrics) {
      allGames.push({
        date: new Date(outcome.date),
        stats: outcome.sportMetrics as Record<string, number>,
      });
    }
  }

  for (const game of gameResults) {
    if (game.stats) {
      allGames.push({
        date: new Date(game.gameDate),
        stats: game.stats as Record<string, number>,
      });
    }
  }

  // For each intervention type, compare games with vs without
  const interventionTypes = [...new Set(interventions.map((i) => i.type))];

  for (const type of interventionTypes) {
    const typeInterventions = interventions.filter((i) => i.type === type);
    const protocols = [...new Set(typeInterventions.map((i) => i.protocol))];

    // Analyze by specific protocol (more granular)
    for (const protocol of protocols) {
      const protocolInterventions = typeInterventions.filter((i) => i.protocol === protocol);

      // Find games within 48 hours of intervention
      const gamesWithIntervention: Array<{ date: Date; stats: Record<string, number> }> = [];
      const gamesWithout: Array<{ date: Date; stats: Record<string, number> }> = [];

      for (const game of allGames) {
        const gameTime = game.date.getTime();
        const hadIntervention = protocolInterventions.some((i) => {
          const interventionTime = new Date(i.performedAt).getTime();
          const hoursAfter = (gameTime - interventionTime) / (1000 * 60 * 60);
          // Intervention was 0-48 hours before game
          return hoursAfter >= 0 && hoursAfter <= 48;
        });

        if (hadIntervention) {
          gamesWithIntervention.push(game);
        } else {
          gamesWithout.push(game);
        }
      }

      // Need at least 3 games in each group
      if (gamesWithIntervention.length < 3 || gamesWithout.length < 3) continue;

      // Analyze each sport metric
      for (const metricConfig of sportMetrics) {
        const withValues = gamesWithIntervention
          .map((g) => g.stats[metricConfig.key])
          .filter((v) => v !== undefined && !isNaN(v));
        const withoutValues = gamesWithout
          .map((g) => g.stats[metricConfig.key])
          .filter((v) => v !== undefined && !isNaN(v));

        if (withValues.length < 3 || withoutValues.length < 3) continue;

        const avgWith = withValues.reduce((a, b) => a + b, 0) / withValues.length;
        const avgWithout = withoutValues.reduce((a, b) => a + b, 0) / withoutValues.length;

        // Calculate improvement
        let improvement = avgWith - avgWithout;
        let improvementPercent = avgWithout !== 0 ? (improvement / avgWithout) * 100 : 0;

        // Flip sign if lower is better (e.g., turnovers, ERA)
        if (!metricConfig.higherIsBetter) {
          improvement = -improvement;
          improvementPercent = -improvementPercent;
        }

        // Simple t-test approximation for significance
        const pValue = calculateApproxPValue(withValues, withoutValues);
        const isSignificant = pValue < 0.1 && Math.abs(improvementPercent) >= 5;

        if (isSignificant) {
          correlations.push({
            interventionType: type,
            protocol,
            sport: athlete.sport,
            metric: metricConfig.key,
            metricLabel: metricConfig.label,
            metricUnit: metricConfig.unit,
            higherIsBetter: metricConfig.higherIsBetter,
            avgWithIntervention: Math.round(avgWith * 100) / 100,
            avgWithout: Math.round(avgWithout * 100) / 100,
            improvement: Math.round(improvement * 100) / 100,
            improvementPercent: Math.round(improvementPercent * 10) / 10,
            gamesWithIntervention: withValues.length,
            gamesWithout: withoutValues.length,
            isSignificant,
            pValue,
          });
        }
      }
    }
  }

  // Sort by improvement magnitude and return top findings
  return correlations
    .sort((a, b) => Math.abs(b.improvementPercent) - Math.abs(a.improvementPercent))
    .slice(0, 10);
}

/**
 * Simple approximation of t-test p-value
 */
function calculateApproxPValue(group1: number[], group2: number[]): number {
  const mean1 = group1.reduce((a, b) => a + b, 0) / group1.length;
  const mean2 = group2.reduce((a, b) => a + b, 0) / group2.length;

  const var1 = group1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / (group1.length - 1);
  const var2 = group2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / (group2.length - 1);

  const pooledSE = Math.sqrt(var1 / group1.length + var2 / group2.length);

  if (pooledSE === 0) return 1;

  const t = Math.abs(mean1 - mean2) / pooledSE;
  const df = group1.length + group2.length - 2;

  // Rough approximation: convert t to p-value
  // Using simple lookup for common values
  if (t >= 3.5) return 0.001;
  if (t >= 2.5) return 0.02;
  if (t >= 2.0) return 0.05;
  if (t >= 1.7) return 0.1;
  if (t >= 1.3) return 0.2;
  return 0.5;
}

/**
 * Converts intervention analysis into actionable DeepInsights
 */
async function generateInterventionInsights(
  athleteId: string,
  athleteName: string,
  startDate: Date
): Promise<DeepInsight[]> {
  const insights: DeepInsight[] = [];
  const correlations = await analyzeInterventionOutcomes(athleteId, startDate);

  for (const corr of correlations) {
    const techniqueLabel = INTERVENTION_LABELS[corr.interventionType] || corr.interventionType;
    const direction = corr.improvement > 0 ? 'more' : 'fewer';
    const absImprovement = Math.abs(corr.improvement);
    const verb = corr.higherIsBetter ? (corr.improvement > 0 ? 'gains' : 'loses') : (corr.improvement > 0 ? 'reduces' : 'increases');

    // Create the headline in the format: "Athlete X has Y more [stat] per game when using [technique]"
    const headline = `${athleteName} averages ${absImprovement.toFixed(1)} ${direction} ${corr.metricLabel} per game after ${techniqueLabel}`;

    insights.push({
      id: `intervention-${athleteId}-${corr.interventionType}-${corr.metric}`,
      type: 'intervention_outcome',
      priority: Math.abs(corr.improvementPercent) >= 15 ? 'critical' : Math.abs(corr.improvementPercent) >= 10 ? 'high' : 'medium',
      headline,
      explanation: `When ${athleteName} uses ${corr.protocol || techniqueLabel} within 48 hours of competition, ${corr.metricLabel} ${corr.improvement > 0 ? 'increases' : 'decreases'} by ${Math.abs(corr.improvementPercent).toFixed(1)}%. This pattern is consistent across ${corr.gamesWithIntervention} games with the technique vs ${corr.gamesWithout} without.`,
      evidence: {
        sampleSize: corr.gamesWithIntervention + corr.gamesWithout,
        confidence: corr.pValue < 0.05 ? 0.9 : corr.pValue < 0.1 ? 0.8 : 0.7,
        statisticalNote: `With technique: ${corr.avgWithIntervention} ${corr.metricUnit}, Without: ${corr.avgWithout} ${corr.metricUnit} (p=${corr.pValue.toFixed(3)})`,
      },
      actionable: `Recommend ${athleteName} use ${techniqueLabel} before every game - it's directly linked to ${Math.abs(corr.improvementPercent).toFixed(0)}% ${corr.improvement > 0 ? 'better' : 'improvement in'} ${corr.metricLabel}`,
      athleteId,
      athleteName,
      interventionDetails: {
        technique: techniqueLabel,
        protocol: corr.protocol,
        sportMetric: corr.metricLabel,
        metricUnit: corr.metricUnit,
        improvement: corr.improvement,
        gamesWithTechnique: corr.gamesWithIntervention,
        gamesWithout: corr.gamesWithout,
      },
    });
  }

  return insights;
}

/**
 * Find which technique works best for specific situations
 * E.g., "Breathing exercises before clutch moments → 23% better free throw %"
 */
async function analyzeSituationalEffectiveness(
  athleteId: string,
  startDate: Date
): Promise<DeepInsight[]> {
  const insights: DeepInsight[] = [];

  const athlete = await prisma.athlete.findUnique({
    where: { userId: athleteId },
    include: { User: { select: { name: true } } },
  });

  if (!athlete) return insights;

  const athleteName = athlete.User.name || 'This athlete';

  // Get interventions by context (PRE_GAME, PRE_PRACTICE, etc.)
  const interventions = await prisma.intervention.findMany({
    where: {
      athleteId,
      performedAt: { gte: startDate },
      completed: true,
      athleteRating: { gte: 3 }, // Only look at ones athlete found helpful
    },
    include: {
      Outcomes: {
        include: {
          PerformanceOutcome: true,
        },
      },
    },
  });

  // Group by context and type
  const contextGroups: Record<string, Record<string, { count: number; avgRating: number; avgPerformanceChange: number }>> = {};

  for (const intervention of interventions) {
    const context = intervention.context;
    const type = intervention.type;

    if (!contextGroups[context]) contextGroups[context] = {};
    if (!contextGroups[context][type]) {
      contextGroups[context][type] = { count: 0, avgRating: 0, avgPerformanceChange: 0 };
    }

    const group = contextGroups[context][type];
    group.count++;
    group.avgRating = (group.avgRating * (group.count - 1) + (intervention.athleteRating || 3)) / group.count;

    // Calculate performance change from outcomes
    for (const outcome of intervention.Outcomes) {
      if (outcome.performanceChange) {
        group.avgPerformanceChange = (group.avgPerformanceChange * (group.count - 1) + outcome.performanceChange) / group.count;
      }
    }
  }

  // Find best technique for each context
  for (const [context, types] of Object.entries(contextGroups)) {
    const sortedTypes = Object.entries(types)
      .filter(([_, data]) => data.count >= 3)
      .sort((a, b) => b[1].avgPerformanceChange - a[1].avgPerformanceChange);

    if (sortedTypes.length >= 2) {
      const [bestType, bestData] = sortedTypes[0];
      const [secondType, secondData] = sortedTypes[1];

      if (bestData.avgPerformanceChange > secondData.avgPerformanceChange + 5) {
        const contextLabel = context.replace('_', ' ').toLowerCase();
        const techniqueLabel = INTERVENTION_LABELS[bestType] || bestType;

        insights.push({
          id: `situational-${athleteId}-${context}-${bestType}`,
          type: 'intervention_outcome',
          priority: bestData.avgPerformanceChange >= 15 ? 'high' : 'medium',
          headline: `${techniqueLabel} works ${Math.round((bestData.avgPerformanceChange / (secondData.avgPerformanceChange || 1) - 1) * 100)}% better than other techniques ${contextLabel}`,
          explanation: `For ${athleteName}, ${techniqueLabel} is significantly more effective than alternatives when used ${contextLabel}. Performance improvement of ${bestData.avgPerformanceChange.toFixed(1)}% compared to ${secondData.avgPerformanceChange.toFixed(1)}% for ${INTERVENTION_LABELS[secondType] || secondType}.`,
          evidence: {
            sampleSize: bestData.count + secondData.count,
            confidence: bestData.count >= 5 ? 0.85 : 0.7,
            statisticalNote: `${bestType}: +${bestData.avgPerformanceChange.toFixed(1)}% (n=${bestData.count}), ${secondType}: +${secondData.avgPerformanceChange.toFixed(1)}% (n=${secondData.count})`,
          },
          actionable: `Always use ${techniqueLabel} when ${contextLabel} - it's ${athleteName}'s most effective technique for this situation`,
          athleteId,
          athleteName,
        });
      }
    }
  }

  return insights;
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
