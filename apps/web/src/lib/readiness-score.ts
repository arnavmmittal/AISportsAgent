/**
 * Enhanced Readiness Score Algorithm
 *
 * Blends daily MoodLog (short-term state) with WeeklySummary (long-term trend)
 * to provide a comprehensive athlete readiness assessment.
 *
 * Strategy:
 * - MoodLog (if exists): 70% weight (today's state)
 * - WeeklySummary (if consented): 30% weight (past week trend)
 * - If only one source: 100% weight
 * - Risk flags from weekly summaries apply penalties
 */

export interface ReadinessInputs {
  // Daily snapshot (from MoodLog)
  moodLog?: {
    mood: number;          // 1-10
    stress: number;        // 1-10
    confidence: number;    // 1-10
    sleepQuality: number;  // 1-10
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
}

export enum ReadinessLevel {
  OPTIMAL = 'OPTIMAL',       // 90-100: Peak readiness
  GOOD = 'GOOD',             // 75-89: Normal training
  MODERATE = 'MODERATE',     // 60-74: Modify intensity
  LOW = 'LOW',               // 45-59: Active recovery
  POOR = 'POOR',             // 0-44: Rest day
}

export interface SignalSource {
  value: number;
  source: 'daily' | 'weekly' | 'activity' | 'blended';
  weight: number;
}

export interface SignalBreakdown {
  mood: SignalSource;
  stress: SignalSource;
  confidence: SignalSource;
  sleep: SignalSource;
  engagement: SignalSource;
  riskPenalty: number;
  rawScore: number;
  finalScore: number;
}

export interface ReadinessOutput {
  score: number;             // 0-100
  level: ReadinessLevel;     // OPTIMAL | GOOD | MODERATE | LOW | POOR
  confidence: number;        // 0.0-1.0 (data quality indicator)
  signals: SignalBreakdown;  // Details of what contributed
}

/**
 * Blend two values with weighted average
 * @param current - Current value (e.g., from MoodLog)
 * @param weekly - Weekly average (e.g., from WeeklySummary)
 * @param weeklyWeight - Weight for weekly value (0-1)
 */
function blend(current: number, weekly: number, weeklyWeight: number): number {
  return current * (1 - weeklyWeight) + weekly * weeklyWeight;
}

/**
 * Calculate risk penalty from weekly summary risk flags
 * @param riskFlags - Array of risk flag strings
 * @returns Total penalty points (0-50)
 */
function calculateRiskPenalty(riskFlags: string[]): number {
  // Risk flag severity mapping
  const severityMap: Record<string, number> = {
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
  };

  return riskFlags.reduce((penalty, flag) => {
    const normalizedFlag = flag.toLowerCase().trim();
    
    // Check for exact match
    if (severityMap[normalizedFlag]) {
      return penalty + severityMap[normalizedFlag];
    }

    // Check for partial matches (contains keywords)
    for (const [key, value] of Object.entries(severityMap)) {
      if (normalizedFlag.includes(key) || key.includes(normalizedFlag)) {
        return penalty + value;
      }
    }

    // Default penalty for unrecognized flags
    return penalty + 3;
  }, 0);
}

/**
 * Calculate engagement score from platform activity
 * @param activity - Recent activity metrics
 * @returns Engagement score (1-10)
 */
function calculateEngagement(activity: ReadinessInputs['recentActivity']): number {
  const { messageCount, sessionCount, goalCompletionRate } = activity;

  // Normalize to 1-10 scale
  const messageScore = Math.min(10, messageCount / 5); // 50 messages = 10
  const sessionScore = Math.min(10, sessionCount * 2); // 5 sessions = 10
  const goalScore = goalCompletionRate * 10;

  // Weighted average: messages (30%), sessions (30%), goals (40%)
  return messageScore * 0.3 + sessionScore * 0.3 + goalScore * 0.4;
}

/**
 * Convert numeric score to readiness level
 * @param score - Readiness score (0-100)
 * @returns ReadinessLevel enum
 */
function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= 90) return ReadinessLevel.OPTIMAL;
  if (score >= 75) return ReadinessLevel.GOOD;
  if (score >= 60) return ReadinessLevel.MODERATE;
  if (score >= 45) return ReadinessLevel.LOW;
  return ReadinessLevel.POOR;
}

/**
 * Calculate enhanced readiness score with weekly summary integration
 *
 * @param inputs - Readiness calculation inputs
 * @returns Comprehensive readiness assessment
 */
export function calculateReadinessScore(inputs: ReadinessInputs): ReadinessOutput {
  const { moodLog, weeklySummary, recentActivity } = inputs;

  // Initialize with neutral defaults
  let mood = 5, stress = 5, confidence = 5, sleep = 5, engagement = 5;
  let confidenceLevel = 0.3; // Low confidence with defaults
  let source: 'daily' | 'weekly' | 'blended' = 'daily';

  // STRATEGY: Blend daily MoodLog (short-term) + WeeklySummary (long-term trend)

  // Phase 1: Use MoodLog if available (today's state)
  if (moodLog) {
    mood = moodLog.mood;
    stress = moodLog.stress;
    confidence = moodLog.confidence;
    sleep = moodLog.sleepQuality;
    confidenceLevel += 0.4; // High confidence (explicit athlete input)
    source = 'daily';
  }

  // Phase 2: Blend with WeeklySummary (past week trend)
  if (weeklySummary) {
    const weeklyWeight = moodLog ? 0.3 : 1.0; // 30% if MoodLog exists, 100% if not

    if (moodLog) {
      // Blend scores using weighted average
      mood = blend(mood, weeklySummary.moodScore, weeklyWeight);
      stress = blend(stress, weeklySummary.stressScore, weeklyWeight);
      confidence = blend(confidence, weeklySummary.confidenceScore, weeklyWeight);
      sleep = blend(sleep, weeklySummary.sleepQualityScore, weeklyWeight);
      source = 'blended';
    } else {
      // Use weekly summary as primary source
      mood = weeklySummary.moodScore;
      stress = weeklySummary.stressScore;
      confidence = weeklySummary.confidenceScore;
      sleep = weeklySummary.sleepQualityScore;
      source = 'weekly';
    }

    engagement = weeklySummary.engagementScore;
    confidenceLevel += 0.3; // Moderate confidence (AI-derived)
  }

  // Phase 3: Incorporate platform activity (if no weekly summary)
  if (!weeklySummary) {
    engagement = calculateEngagement(recentActivity);
  }

  // Calculate base score (same formula as original)
  const rawScore = (
    0.30 * mood +
    0.25 * (10 - stress) +  // Stress is inverted (lower stress = higher readiness)
    0.20 * confidence +
    0.15 * sleep +
    0.10 * engagement
  ) * 10;

  // Phase 4: Apply risk flag penalties
  let riskPenalty = 0;
  if (weeklySummary?.riskFlags && weeklySummary.riskFlags.length > 0) {
    riskPenalty = calculateRiskPenalty(weeklySummary.riskFlags);
    confidenceLevel += 0.1; // Risk detection adds signal
  }

  // Cap penalty at 50 points max
  riskPenalty = Math.min(50, riskPenalty);

  const finalScore = Math.max(0, Math.min(100, rawScore - riskPenalty));

  return {
    score: Math.round(finalScore),
    level: getReadinessLevel(finalScore),
    confidence: Math.min(1.0, confidenceLevel),
    signals: {
      mood: { 
        value: mood, 
        source, 
        weight: 0.30 
      },
      stress: { 
        value: stress, 
        source, 
        weight: 0.25 
      },
      confidence: { 
        value: confidence, 
        source, 
        weight: 0.20 
      },
      sleep: { 
        value: sleep, 
        source, 
        weight: 0.15 
      },
      engagement: { 
        value: engagement, 
        source: weeklySummary ? 'weekly' : 'activity', 
        weight: 0.10 
      },
      riskPenalty,
      rawScore: Math.round(rawScore),
      finalScore: Math.round(finalScore),
    },
  };
}

/**
 * Calculate readiness score trend (improvement/decline)
 * @param previousScore - Previous readiness score
 * @param currentScore - Current readiness score
 * @returns Trend direction and magnitude
 */
export function calculateReadinessTrend(
  previousScore: number,
  currentScore: number
): { direction: 'IMPROVING' | 'STABLE' | 'DECLINING'; delta: number } {
  const delta = currentScore - previousScore;
  const absDelta = Math.abs(delta);

  if (absDelta < 3) {
    return { direction: 'STABLE', delta };
  }

  return {
    direction: delta > 0 ? 'IMPROVING' : 'DECLINING',
    delta,
  };
}

/**
 * Format readiness score for display
 * @param score - Readiness score (0-100)
 * @param level - Readiness level
 * @returns Formatted display string
 */
export function formatReadinessDisplay(score: number, level: ReadinessLevel): string {
  const emoji = {
    OPTIMAL: '🟢',
    GOOD: '🟢',
    MODERATE: '🟡',
    LOW: '🟠',
    POOR: '🔴',
  }[level];

  return `${score} (${level}) ${emoji}`;
}

/**
 * Get color class for readiness level (Tailwind CSS)
 * @param level - Readiness level
 * @returns Tailwind color class
 */
export function getReadinessColorClass(level: ReadinessLevel): string {
  return {
    OPTIMAL: 'text-secondary bg-secondary/10',
    GOOD: 'text-secondary bg-secondary/10',
    MODERATE: 'text-muted-foreground bg-muted/10',
    LOW: 'text-muted-foreground bg-muted/10',
    POOR: 'text-muted-foreground bg-muted-foreground/10',
  }[level];
}
