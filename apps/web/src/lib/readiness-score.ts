/**
 * Enhanced Readiness Score Algorithm — Dual-Source Model
 *
 * Three-layer blending:
 * 1. Daily MoodLog (self-report, explicit athlete input)
 * 2. ChatSummary (AI-extracted from conversation, passive signal)
 * 3. WeeklySummary (long-term trend aggregation)
 *
 * Formula:
 *   READINESS = (0.7 × DailySignal) + (0.3 × WeeklyTrend) - RiskPenalty
 *
 * DailySignal blends MoodLog + ChatSummary:
 *   - Both exist: 60% self-report + 40% chat (intentional reflection weighted higher)
 *   - Only one: 100% of available source
 *   - Neither: decay previous score by 5%
 *
 * Dimension weights (sum = 1.0):
 *   Mood:             25%
 *   Stress (inverted): 20%
 *   Sleep Quality:     20%
 *   Confidence:        15%
 *   Physical:          10% (soreness inverted + RPE inverted)
 *   Engagement:        10%
 */

export interface ReadinessInputs {
  // Daily snapshot (from MoodLog)
  moodLog?: {
    mood: number;            // 1-10
    stress: number;          // 1-10
    confidence?: number;     // 1-10, nullable (game-week only)
    sleepQuality?: number;   // 1-10 subjective quality
    sleepHours?: number;     // hours (legacy, converted to quality)
    soreness?: number;       // 1-10
    rpe?: number;            // 1-10
  };

  // Per-session chat signal (from most recent ChatSummary)
  chatSummary?: {
    moodScore: number;
    stressScore: number;
    confidenceScore: number;
    sleepQualityScore: number;
    sorenessScore: number;
    engagementScore: number;
    riskFlags: string[];
    sentiment: string;       // "positive" | "neutral" | "negative"
  };

  // Weekly trend (from WeeklySummary, if consent granted)
  weeklySummary?: {
    moodScore: number;
    stressScore: number;
    confidenceScore: number;
    sleepQualityScore: number;
    engagementScore: number;
    sorenessScore: number;
    riskFlags: string[];
  };

  // Platform activity
  recentActivity: {
    messageCount: number;      // Last 7 days
    sessionCount: number;      // Last 7 days
    goalCompletionRate: number; // 0.0-1.0
  };

  // Previous day's score (for decay when no data)
  previousDayScore?: number;
}

export enum ReadinessLevel {
  OPTIMAL = 'OPTIMAL',       // 90-100: Peak readiness
  GOOD = 'GOOD',             // 75-89: Normal training
  MODERATE = 'MODERATE',     // 60-74: Modify intensity
  LOW = 'LOW',               // 45-59: Active recovery
  POOR = 'POOR',             // 0-44: Rest day
}

export type SignalSourceType = 'self_report' | 'chat' | 'weekly' | 'activity' | 'blended' | 'default';

export interface SignalSource {
  value: number;
  source: SignalSourceType;
  weight: number;
}

export interface SignalBreakdown {
  mood: SignalSource;
  stress: SignalSource;
  confidence: SignalSource;
  sleep: SignalSource;
  physical: SignalSource;
  engagement: SignalSource;
  riskPenalty: number;
  rawScore: number;
  finalScore: number;
  dataSources: SignalSourceType[];
}

export interface ReadinessOutput {
  score: number;             // 0-100
  level: ReadinessLevel;     // OPTIMAL | GOOD | MODERATE | LOW | POOR
  confidence: number;        // 0.0-1.0 (data quality indicator)
  signals: SignalBreakdown;  // Details of what contributed
}

// ─── Dimension Weights ───────────────────────────────────────────
const WEIGHTS = {
  mood: 0.25,
  stress: 0.20,       // inverted: 10 - stress
  sleep: 0.20,
  confidence: 0.15,
  physical: 0.10,     // inverted: 10 - avg(soreness, rpe)
  engagement: 0.10,
};

// ─── Helpers ─────────────────────────────────────────────────────

function blend(a: number, b: number, bWeight: number): number {
  return a * (1 - bWeight) + b * bWeight;
}

/**
 * Normalize sleep hours to a 1-10 quality scale.
 * Based on NCAA sleep research: 7-9 hours optimal for D1 athletes.
 */
function normalizeSleepHoursToQuality(hours: number): number {
  if (hours >= 7 && hours <= 9) return 8 + (hours - 7) * 0.5;
  if (hours >= 6) return 5 + (hours - 6) * 3;
  if (hours >= 5) return 3 + (hours - 5) * 2;
  return Math.max(1, hours);
}

/**
 * Merge a dimension from multiple sources with weighted blending.
 */
function mergeDimension(
  selfReport: number | undefined,
  chatValue: number | undefined,
  selfReportWeight: number,
  chatWeight: number,
  defaultValue: number = 5,
): { value: number; source: SignalSourceType } {
  if (selfReport !== undefined && chatValue !== undefined) {
    return {
      value: selfReport * selfReportWeight + chatValue * chatWeight,
      source: 'blended',
    };
  }
  if (selfReport !== undefined) return { value: selfReport, source: 'self_report' };
  if (chatValue !== undefined) return { value: chatValue, source: 'chat' };
  return { value: defaultValue, source: 'default' };
}

/**
 * Calculate risk penalty from chat and weekly risk flags.
 */
function calculateRiskPenalty(
  chatFlags: string[] = [],
  weeklyFlags: string[] = [],
  chatSentiment?: string,
): number {
  const severityMap: Record<string, number> = {
    'crisis': 30,
    'self_harm': 30,
    'self-harm': 30,
    'suicidal': 30,
    'elevated stress': 5,
    'sleep disruption': 8,
    'injury concern': 10,
    'burnout indicators': 12,
    'low motivation': 6,
    'academic stress': 4,
    'team conflict': 7,
    'performance anxiety': 5,
    'overtraining': 10,
    'social isolation': 6,
    'chronic stress': 8,
    'mood decline': 7,
    'engagement drop': 5,
    'avoidance': 10,
  };

  const allFlags = [...new Set([...chatFlags, ...weeklyFlags])];
  let penalty = allFlags.reduce((total, flag) => {
    const normalized = flag.toLowerCase().trim();
    if (severityMap[normalized]) return total + severityMap[normalized];
    for (const [key, value] of Object.entries(severityMap)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return total + value;
      }
    }
    return total + 3;
  }, 0);

  // Negative sentiment trend penalty
  if (chatSentiment === 'negative') penalty += 10;

  return Math.min(50, penalty);
}

/**
 * Calculate engagement score from platform activity.
 */
function calculateEngagement(activity: ReadinessInputs['recentActivity']): number {
  const { messageCount, sessionCount, goalCompletionRate } = activity;
  const messageScore = Math.min(10, messageCount / 5);
  const sessionScore = Math.min(10, sessionCount * 2);
  const goalScore = goalCompletionRate * 10;
  return messageScore * 0.3 + sessionScore * 0.3 + goalScore * 0.4;
}

function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= 90) return ReadinessLevel.OPTIMAL;
  if (score >= 75) return ReadinessLevel.GOOD;
  if (score >= 60) return ReadinessLevel.MODERATE;
  if (score >= 45) return ReadinessLevel.LOW;
  return ReadinessLevel.POOR;
}

// ─── Main Calculator ─────────────────────────────────────────────

export function calculateReadinessScore(inputs: ReadinessInputs): ReadinessOutput {
  const { moodLog, chatSummary, weeklySummary, recentActivity, previousDayScore } = inputs;

  const dataSources: SignalSourceType[] = [];
  let dataConfidence = 0.2; // Base confidence

  // Determine daily source blending weights
  const hasSelfReport = !!moodLog;
  const hasChat = !!chatSummary;
  const selfW = hasSelfReport && hasChat ? 0.60 : (hasSelfReport ? 1.0 : 0);
  const chatW = hasSelfReport && hasChat ? 0.40 : (hasChat ? 1.0 : 0);

  if (hasSelfReport) { dataSources.push('self_report'); dataConfidence += 0.35; }
  if (hasChat) { dataSources.push('chat'); dataConfidence += 0.25; }
  if (weeklySummary) { dataSources.push('weekly'); dataConfidence += 0.15; }

  // ── Resolve each dimension ──

  // Mood
  const mood = mergeDimension(moodLog?.mood, chatSummary?.moodScore, selfW, chatW);

  // Stress
  const stress = mergeDimension(moodLog?.stress, chatSummary?.stressScore, selfW, chatW);

  // Confidence
  const confidence = mergeDimension(
    moodLog?.confidence ?? undefined,
    chatSummary?.confidenceScore,
    selfW, chatW,
  );

  // Sleep — prefer sleepQuality, fall back to normalized sleepHours
  const selfSleep = moodLog?.sleepQuality
    ?? (moodLog?.sleepHours ? normalizeSleepHoursToQuality(moodLog.sleepHours) : undefined);
  const sleep = mergeDimension(selfSleep, chatSummary?.sleepQualityScore, selfW, chatW);

  // Physical readiness (soreness + RPE, both inverted)
  const selfPhysical = moodLog?.soreness !== undefined || moodLog?.rpe !== undefined
    ? (() => {
        const vals: number[] = [];
        if (moodLog!.soreness !== undefined) vals.push(10 - moodLog!.soreness);
        if (moodLog!.rpe !== undefined) vals.push(10 - moodLog!.rpe);
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      })()
    : undefined;
  const chatPhysical = chatSummary?.sorenessScore !== undefined
    ? 10 - chatSummary.sorenessScore
    : undefined;
  const physical = mergeDimension(selfPhysical, chatPhysical, selfW, chatW, 5);

  // Engagement
  let engagementValue = calculateEngagement(recentActivity);
  let engagementSource: SignalSourceType = 'activity';
  if (chatSummary?.engagementScore) {
    engagementValue = blend(engagementValue, chatSummary.engagementScore, 0.5);
    engagementSource = 'blended';
  }
  if (weeklySummary?.engagementScore) {
    engagementValue = blend(engagementValue, weeklySummary.engagementScore, 0.3);
    engagementSource = 'blended';
  }

  // ── Compute daily signal ──
  let dailySignal = (
    WEIGHTS.mood * mood.value +
    WEIGHTS.stress * (10 - stress.value) +
    WEIGHTS.sleep * sleep.value +
    WEIGHTS.confidence * confidence.value +
    WEIGHTS.physical * physical.value +
    WEIGHTS.engagement * engagementValue
  ) * 10;

  // If no daily data at all, decay from previous score
  if (!hasSelfReport && !hasChat) {
    if (previousDayScore !== undefined) {
      dailySignal = previousDayScore * 0.95; // 5% daily decay
    }
    // else dailySignal stays at neutral (~50 from defaults)
  }

  // ── Blend with weekly trend ──
  let rawScore = dailySignal;
  if (weeklySummary) {
    const weeklySignal = (
      WEIGHTS.mood * weeklySummary.moodScore +
      WEIGHTS.stress * (10 - weeklySummary.stressScore) +
      WEIGHTS.sleep * weeklySummary.sleepQualityScore +
      WEIGHTS.confidence * weeklySummary.confidenceScore +
      WEIGHTS.physical * (10 - (weeklySummary.sorenessScore || 5)) +
      WEIGHTS.engagement * weeklySummary.engagementScore
    ) * 10;

    rawScore = dailySignal * 0.70 + weeklySignal * 0.30;
  }

  // ── Risk penalties ──
  const riskPenalty = calculateRiskPenalty(
    chatSummary?.riskFlags,
    weeklySummary?.riskFlags,
    chatSummary?.sentiment,
  );
  if (riskPenalty > 0) dataConfidence += 0.05;

  const finalScore = Math.max(0, Math.min(100, rawScore - riskPenalty));

  return {
    score: Math.round(finalScore),
    level: getReadinessLevel(finalScore),
    confidence: Math.min(1.0, dataConfidence),
    signals: {
      mood: { value: mood.value, source: mood.source, weight: WEIGHTS.mood },
      stress: { value: stress.value, source: stress.source, weight: WEIGHTS.stress },
      confidence: { value: confidence.value, source: confidence.source, weight: WEIGHTS.confidence },
      sleep: { value: sleep.value, source: sleep.source, weight: WEIGHTS.sleep },
      physical: { value: physical.value, source: physical.source, weight: WEIGHTS.physical },
      engagement: { value: engagementValue, source: engagementSource, weight: WEIGHTS.engagement },
      riskPenalty,
      rawScore: Math.round(rawScore),
      finalScore: Math.round(finalScore),
      dataSources,
    },
  };
}

// ─── Utilities ───────────────────────────────────────────────────

export function calculateReadinessTrend(
  previousScore: number,
  currentScore: number
): { direction: 'IMPROVING' | 'STABLE' | 'DECLINING'; delta: number } {
  const delta = currentScore - previousScore;
  if (Math.abs(delta) < 3) return { direction: 'STABLE', delta };
  return { direction: delta > 0 ? 'IMPROVING' : 'DECLINING', delta };
}

export function formatReadinessDisplay(score: number, level: ReadinessLevel): string {
  const label = {
    OPTIMAL: 'Peak',
    GOOD: 'Ready',
    MODERATE: 'Monitor',
    LOW: 'Recovery',
    POOR: 'Rest',
  }[level];
  return `${score} (${label})`;
}

export function getReadinessColorClass(level: ReadinessLevel): string {
  return {
    OPTIMAL: 'text-secondary bg-secondary/10',
    GOOD: 'text-secondary bg-secondary/10',
    MODERATE: 'text-muted-foreground bg-muted/10',
    LOW: 'text-muted-foreground bg-muted/10',
    POOR: 'text-muted-foreground bg-muted-foreground/10',
  }[level];
}

export { normalizeSleepHoursToQuality };
