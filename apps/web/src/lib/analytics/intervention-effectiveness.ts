/**
 * Intervention Effectiveness Analytics
 *
 * Calculates personalized intervention effectiveness by:
 * - Tracking outcomes per intervention type and context
 * - Building athlete-specific effectiveness profiles
 * - Generating evidence-based recommendations
 *
 * Research basis:
 * - Sport psychology intervention effectiveness literature
 * - N-of-1 trial methodology for individual athlete optimization
 */

import { prisma } from '@/lib/prisma';
import type {
  InterventionType,
  InterventionContext,
} from '@prisma/client';

export interface InterventionEffectiveness {
  type: InterventionType;
  context: InterventionContext;
  sampleSize: number;
  avgEffectiveness: number;
  avgMoodChange: number | null;
  avgConfidenceChange: number | null;
  avgStressChange: number | null;
  avgPerformanceChange: number | null;
  avgAthleteRating: number | null;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  isReliable: boolean; // n >= 3
}

export interface AthleteEffectivenessProfile {
  athleteId: string;
  totalInterventions: number;
  effectivenessByType: Map<InterventionType, InterventionEffectiveness>;
  effectivenessByContext: Map<InterventionContext, InterventionEffectiveness>;
  topRecommendations: RecommendedIntervention[];
  lastUpdated: Date;
}

export interface RecommendedIntervention {
  type: InterventionType;
  context: InterventionContext;
  protocol: string;
  expectedEffectiveness: number;
  confidence: number;
  evidence: string;
  previousSuccess: number; // % of times this worked for this athlete
}

/**
 * Calculate effectiveness for all interventions for an athlete
 */
export async function calculateAthleteEffectivenessProfile(
  athleteId: string
): Promise<AthleteEffectivenessProfile> {
  const interventions = await prisma.intervention.findMany({
    where: { athleteId, completed: true },
    include: { Outcomes: true },
  });

  const effectivenessByType = new Map<InterventionType, InterventionEffectiveness>();
  const effectivenessByContext = new Map<InterventionContext, InterventionEffectiveness>();

  // Group interventions by type
  const byType = groupBy(interventions, 'type');
  for (const [type, typeInterventions] of Object.entries(byType)) {
    const effectiveness = calculateGroupEffectiveness(
      typeInterventions,
      type as InterventionType,
      'ALL' as any
    );
    effectivenessByType.set(type as InterventionType, effectiveness);
  }

  // Group interventions by context
  const byContext = groupBy(interventions, 'context');
  for (const [context, contextInterventions] of Object.entries(byContext)) {
    const effectiveness = calculateGroupEffectiveness(
      contextInterventions,
      'OTHER' as InterventionType,
      context as InterventionContext
    );
    effectivenessByContext.set(context as InterventionContext, effectiveness);
  }

  // Generate top recommendations
  const topRecommendations = generateRecommendations(
    effectivenessByType,
    effectivenessByContext
  );

  return {
    athleteId,
    totalInterventions: interventions.length,
    effectivenessByType,
    effectivenessByContext,
    topRecommendations,
    lastUpdated: new Date(),
  };
}

/**
 * Calculate effectiveness metrics for a group of interventions
 */
function calculateGroupEffectiveness(
  interventions: any[],
  type: InterventionType,
  context: InterventionContext
): InterventionEffectiveness {
  const n = interventions.length;
  const effectivenessScores = interventions
    .map((i) => i.effectivenessScore)
    .filter((s): s is number => s !== null);

  const ratings = interventions
    .map((i) => i.athleteRating)
    .filter((r): r is number => r !== null);

  // Aggregate outcome changes
  const moodChanges: number[] = [];
  const confChanges: number[] = [];
  const stressChanges: number[] = [];
  const perfChanges: number[] = [];

  for (const intervention of interventions) {
    for (const outcome of intervention.Outcomes) {
      if (outcome.moodChange !== null) moodChanges.push(outcome.moodChange);
      if (outcome.confidenceChange !== null) confChanges.push(outcome.confidenceChange);
      if (outcome.stressChange !== null) stressChanges.push(outcome.stressChange);
      if (outcome.performanceChange !== null) perfChanges.push(outcome.performanceChange);
    }
  }

  const avgEffectiveness =
    effectivenessScores.length > 0 ? average(effectivenessScores) : 0;
  const stdDev =
    effectivenessScores.length > 1 ? standardDeviation(effectivenessScores) : 0;

  // 95% confidence interval
  const marginOfError = effectivenessScores.length > 0
    ? 1.96 * (stdDev / Math.sqrt(effectivenessScores.length))
    : 0;

  return {
    type,
    context,
    sampleSize: n,
    avgEffectiveness,
    avgMoodChange: moodChanges.length > 0 ? average(moodChanges) : null,
    avgConfidenceChange: confChanges.length > 0 ? average(confChanges) : null,
    avgStressChange: stressChanges.length > 0 ? average(stressChanges) : null,
    avgPerformanceChange: perfChanges.length > 0 ? average(perfChanges) : null,
    avgAthleteRating: ratings.length > 0 ? average(ratings) : null,
    confidenceInterval: {
      lower: avgEffectiveness - marginOfError,
      upper: avgEffectiveness + marginOfError,
    },
    isReliable: n >= 3,
  };
}

/**
 * Generate recommendations based on effectiveness data
 */
function generateRecommendations(
  byType: Map<InterventionType, InterventionEffectiveness>,
  byContext: Map<InterventionContext, InterventionEffectiveness>
): RecommendedIntervention[] {
  const recommendations: RecommendedIntervention[] = [];

  // Protocol database (should be expanded)
  const protocols: Record<InterventionType, string[]> = {
    BREATHING: ['4-7-8 Breathing', 'Box Breathing', 'Diaphragmatic Breathing'],
    VISUALIZATION: ['Performance Imagery', 'Success Visualization', 'Process Visualization'],
    SELF_TALK: ['Positive Affirmations', 'Cue Words', 'Instructional Self-Talk'],
    ROUTINE: ['Pre-Performance Routine', 'Pre-Game Ritual', 'Focus Routine'],
    FOCUS_CUE: ['Trigger Words', 'Physical Anchors', 'Centering'],
    AROUSAL_REGULATION: ['Progressive Muscle Relaxation', 'Energization', 'Psych-Up'],
    GOAL_SETTING: ['SMART Goals', 'Process Goals', 'Performance Goals'],
    COGNITIVE_REFRAME: ['Reframing Thoughts', 'Cognitive Restructuring', 'Perspective Taking'],
    MINDFULNESS: ['Body Scan', 'Present Moment Awareness', 'Mindful Breathing'],
    JOURNALING: ['Reflection Journal', 'Gratitude Journal', 'Performance Journal'],
    PHYSICAL_WARMUP: ['Dynamic Stretching', 'Activation Routine', 'Sport-Specific Warmup'],
    OTHER: ['Custom Technique'],
  };

  // Sort types by effectiveness
  const sortedTypes = Array.from(byType.entries())
    .filter(([_, eff]) => eff.isReliable && eff.avgEffectiveness > 0)
    .sort((a, b) => b[1].avgEffectiveness - a[1].avgEffectiveness);

  for (const [type, effectiveness] of sortedTypes.slice(0, 5)) {
    const protocol = protocols[type]?.[0] || type;
    const successRate = effectiveness.sampleSize > 0
      ? (effectiveness.avgEffectiveness > 0 ? 100 : 0)
      : 0;

    recommendations.push({
      type,
      context: 'ON_DEMAND',
      protocol,
      expectedEffectiveness: effectiveness.avgEffectiveness,
      confidence: effectiveness.isReliable ? 0.8 : 0.5,
      evidence: `Based on ${effectiveness.sampleSize} uses with avg effectiveness of ${effectiveness.avgEffectiveness.toFixed(2)}`,
      previousSuccess: successRate,
    });
  }

  return recommendations;
}

/**
 * Get best intervention for a specific context
 */
export async function getBestInterventionForContext(
  athleteId: string,
  context: InterventionContext
): Promise<RecommendedIntervention | null> {
  const interventions = await prisma.intervention.findMany({
    where: {
      athleteId,
      context,
      completed: true,
      effectivenessScore: { not: null },
    },
    orderBy: { effectivenessScore: 'desc' },
  });

  if (interventions.length === 0) {
    // Fall back to general best practice
    return getDefaultRecommendation(context);
  }

  // Group by type and find best
  const byType = groupBy(interventions, 'type');
  let bestType: InterventionType | null = null;
  let bestScore = -Infinity;

  for (const [type, typeInterventions] of Object.entries(byType)) {
    const avgScore = average(
      typeInterventions
        .map((i) => i.effectivenessScore)
        .filter((s): s is number => s !== null)
    );
    if (avgScore > bestScore) {
      bestScore = avgScore;
      bestType = type as InterventionType;
    }
  }

  if (!bestType) return null;

  const typeInterventions = byType[bestType];
  const successCount = typeInterventions.filter((i) => (i.effectivenessScore || 0) > 0).length;

  return {
    type: bestType,
    context,
    protocol: typeInterventions[0].protocol,
    expectedEffectiveness: bestScore,
    confidence: typeInterventions.length >= 3 ? 0.85 : 0.6,
    evidence: `Worked ${successCount}/${typeInterventions.length} times in similar situations`,
    previousSuccess: (successCount / typeInterventions.length) * 100,
  };
}

/**
 * Default recommendations based on research
 */
function getDefaultRecommendation(context: InterventionContext): RecommendedIntervention {
  const defaults: Record<InterventionContext, RecommendedIntervention> = {
    PRE_GAME: {
      type: 'BREATHING',
      context: 'PRE_GAME',
      protocol: '4-7-8 Breathing',
      expectedEffectiveness: 0.15,
      confidence: 0.6,
      evidence: 'Research shows breathing exercises reduce pre-competition anxiety',
      previousSuccess: 0,
    },
    PRE_PRACTICE: {
      type: 'ROUTINE',
      context: 'PRE_PRACTICE',
      protocol: 'Focus Routine',
      expectedEffectiveness: 0.1,
      confidence: 0.6,
      evidence: 'Consistent routines improve practice quality',
      previousSuccess: 0,
    },
    DURING_COMPETITION: {
      type: 'FOCUS_CUE',
      context: 'DURING_COMPETITION',
      protocol: 'Centering',
      expectedEffectiveness: 0.12,
      confidence: 0.6,
      evidence: 'Focus cues help maintain concentration under pressure',
      previousSuccess: 0,
    },
    HALFTIME: {
      type: 'COGNITIVE_REFRAME',
      context: 'HALFTIME',
      protocol: 'Reframing Thoughts',
      expectedEffectiveness: 0.1,
      confidence: 0.5,
      evidence: 'Cognitive reframing helps reset mindset',
      previousSuccess: 0,
    },
    POST_ERROR: {
      type: 'SELF_TALK',
      context: 'POST_ERROR',
      protocol: 'Positive Affirmations',
      expectedEffectiveness: 0.15,
      confidence: 0.7,
      evidence: 'Positive self-talk reduces error rumination',
      previousSuccess: 0,
    },
    POST_GAME: {
      type: 'MINDFULNESS',
      context: 'POST_GAME',
      protocol: 'Body Scan',
      expectedEffectiveness: 0.1,
      confidence: 0.6,
      evidence: 'Mindfulness aids recovery and processing',
      previousSuccess: 0,
    },
    POST_LOSS: {
      type: 'COGNITIVE_REFRAME',
      context: 'POST_LOSS',
      protocol: 'Perspective Taking',
      expectedEffectiveness: 0.18,
      confidence: 0.7,
      evidence: 'Reframing prevents negative spirals after losses',
      previousSuccess: 0,
    },
    RECOVERY: {
      type: 'MINDFULNESS',
      context: 'RECOVERY',
      protocol: 'Mindful Breathing',
      expectedEffectiveness: 0.12,
      confidence: 0.7,
      evidence: 'Mindfulness enhances recovery quality',
      previousSuccess: 0,
    },
    SLUMP: {
      type: 'VISUALIZATION',
      context: 'SLUMP',
      protocol: 'Success Visualization',
      expectedEffectiveness: 0.2,
      confidence: 0.65,
      evidence: 'Visualization helps rebuild confidence during slumps',
      previousSuccess: 0,
    },
    INJURY_RETURN: {
      type: 'VISUALIZATION',
      context: 'INJURY_RETURN',
      protocol: 'Performance Imagery',
      expectedEffectiveness: 0.18,
      confidence: 0.7,
      evidence: 'Mental practice during injury accelerates return',
      previousSuccess: 0,
    },
    DAILY_ROUTINE: {
      type: 'JOURNALING',
      context: 'DAILY_ROUTINE',
      protocol: 'Reflection Journal',
      expectedEffectiveness: 0.08,
      confidence: 0.6,
      evidence: 'Regular journaling improves self-awareness',
      previousSuccess: 0,
    },
    ON_DEMAND: {
      type: 'BREATHING',
      context: 'ON_DEMAND',
      protocol: 'Box Breathing',
      expectedEffectiveness: 0.12,
      confidence: 0.7,
      evidence: 'Breathing is quick and effective in any situation',
      previousSuccess: 0,
    },
  };

  return defaults[context] || defaults.ON_DEMAND;
}

/**
 * Update athlete's personalization model with new effectiveness data
 */
export async function updateAthleteModel(athleteId: string): Promise<void> {
  const profile = await calculateAthleteEffectivenessProfile(athleteId);

  // Convert maps to JSON-serializable objects
  const interventionProfile: Record<string, { avg: number; n: number }> = {};

  for (const [type, effectiveness] of profile.effectivenessByType) {
    interventionProfile[type] = {
      avg: effectiveness.avgEffectiveness,
      n: effectiveness.sampleSize,
    };
  }

  await prisma.athleteModel.upsert({
    where: { athleteId },
    create: {
      athleteId,
      interventionProfile,
      dataPointsUsed: profile.totalInterventions,
      lastTrainedAt: new Date(),
    },
    update: {
      interventionProfile,
      dataPointsUsed: profile.totalInterventions,
      lastTrainedAt: new Date(),
    },
  });
}

// Helper functions
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const keyValue = String(item[key]);
      if (!result[keyValue]) result[keyValue] = [];
      result[keyValue].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = average(values);
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
  return Math.sqrt(average(squareDiffs));
}
