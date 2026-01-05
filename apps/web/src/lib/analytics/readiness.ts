/**
 * Advanced Readiness Calculation System
 *
 * Multi-dimensional readiness scoring based on sports science research.
 * Incorporates temporal weighting, trend analysis, and sport-specific demands.
 *
 * Research basis:
 * - Kellmann & Beckmann (2018) - Sport, Recovery, and Performance
 * - Saw et al. (2016) - Monitoring the athlete training response
 * - Taylor et al. (2012) - Fatigue monitoring in high performance sport
 */

import { getSportConfig, type SportConfig } from './sport-configs';

export type MoodLogData = {
  mood: number;            // 0-10
  confidence: number;      // 0-10
  stress: number;          // 0-10
  energy?: number;         // 0-10
  focus?: number;          // 0-10
  motivation?: number;     // 0-10
  sleep?: number;          // hours, typically 4-12
  soreness?: number;       // 0-10
  fatigue?: number;        // 0-10
  anxiety?: number;        // 0-10
  mentalClarity?: number;  // 0-10
  hrv?: number;            // Heart Rate Variability (if available)
  createdAt: Date;
};

export type ReadinessBreakdown = {
  overall: number;         // 0-100
  physical: number;        // 0-100
  mental: number;          // 0-100
  cognitive: number;       // 0-100
  confidence: number;      // 0-100
  trend: 'improving' | 'stable' | 'declining';
  riskLevel: 'optimal' | 'good' | 'moderate' | 'caution' | 'critical';
  recommendations: string[];
};

export type TemporalReadiness = {
  current: ReadinessBreakdown;
  yesterday?: ReadinessBreakdown;
  weekAverage?: ReadinessBreakdown;
  composite: ReadinessBreakdown; // Weighted combination
  volatility: number;              // Coefficient of variation (0-1)
};

/**
 * Normalize a value to 0-10 scale
 */
function normalize(value: number | undefined, defaultValue: number = 5): number {
  if (value === undefined || value === null) return defaultValue;
  return Math.max(0, Math.min(10, value));
}

/**
 * Normalize sleep hours to 0-10 scale (8 hours = optimal)
 */
function normalizeSleep(hours: number | undefined): number {
  if (!hours) return 6; // Default to 6/10 if unknown

  // Optimal sleep: 7.5-9 hours = 10/10
  // Below 6 hours or above 10 hours = lower scores
  if (hours >= 7.5 && hours <= 9) return 10;
  if (hours >= 7 && hours < 7.5) return 9;
  if (hours >= 9 && hours <= 9.5) return 9;
  if (hours >= 6.5 && hours < 7) return 8;
  if (hours > 9.5 && hours <= 10) return 8;
  if (hours >= 6 && hours < 6.5) return 6;
  if (hours > 10 && hours <= 11) return 6;
  if (hours >= 5 && hours < 6) return 4;
  if (hours > 11) return 4;
  if (hours < 5) return 2;

  return 6;
}

/**
 * Calculate physical readiness sub-score
 */
function calculatePhysicalReadiness(log: MoodLogData): number {
  const sleepScore = normalizeSleep(log.sleep);
  const energyScore = normalize(log.energy, 7);
  const sorenessScore = 10 - normalize(log.soreness, 3); // Inverted
  const fatigueScore = 10 - normalize(log.fatigue, 4);   // Inverted

  // HRV if available (normalized to 0-10, higher is better)
  const hrvScore = log.hrv ? Math.min(10, log.hrv / 10) : null;

  // Weighted average
  const weights = {
    sleep: 0.30,
    energy: 0.25,
    soreness: 0.20,
    fatigue: 0.15,
    hrv: 0.10,
  };

  let score = 0;
  let totalWeight = 0;

  score += sleepScore * weights.sleep;
  totalWeight += weights.sleep;

  score += energyScore * weights.energy;
  totalWeight += weights.energy;

  score += sorenessScore * weights.soreness;
  totalWeight += weights.soreness;

  score += fatigueScore * weights.fatigue;
  totalWeight += weights.fatigue;

  if (hrvScore !== null) {
    score += hrvScore * weights.hrv;
    totalWeight += weights.hrv;
  }

  // Normalize to 0-100
  return Math.round((score / totalWeight) * 10);
}

/**
 * Calculate mental readiness sub-score
 */
function calculateMentalReadiness(log: MoodLogData): number {
  const moodScore = normalize(log.mood, 7);
  const stressScore = 10 - normalize(log.stress, 5);    // Inverted
  const anxietyScore = 10 - normalize(log.anxiety, 4);  // Inverted
  const motivationScore = normalize(log.motivation, 7);

  // Weighted average
  const weights = {
    mood: 0.30,
    stress: 0.30,
    anxiety: 0.20,
    motivation: 0.20,
  };

  const score = (
    (moodScore * weights.mood) +
    (stressScore * weights.stress) +
    (anxietyScore * weights.anxiety) +
    (motivationScore * weights.motivation)
  );

  return Math.round(score * 10);
}

/**
 * Calculate cognitive readiness sub-score
 */
function calculateCognitiveReadiness(log: MoodLogData): number {
  const focusScore = normalize(log.focus, 7);
  const clarityScore = normalize(log.mentalClarity, 7);
  const confidenceScore = normalize(log.confidence, 7);

  // Weighted average
  const weights = {
    focus: 0.35,
    clarity: 0.35,
    confidence: 0.30,
  };

  const score = (
    (focusScore * weights.focus) +
    (clarityScore * weights.clarity) +
    (confidenceScore * weights.confidence)
  );

  return Math.round(score * 10);
}

/**
 * Calculate overall readiness with sport-specific weighting
 */
function calculateOverallReadiness(
  physical: number,
  mental: number,
  cognitive: number,
  sportConfig?: SportConfig
): number {
  // Default weights (balanced)
  const weights = {
    physical: 0.35,
    mental: 0.35,
    cognitive: 0.30,
  };

  // Adjust based on sport demands
  if (sportConfig) {
    const demands = sportConfig.primaryDemands;

    if (demands.includes('endurance')) {
      weights.physical += 0.10;
      weights.mental -= 0.05;
      weights.cognitive -= 0.05;
    }

    if (demands.includes('precision') || demands.includes('skill')) {
      weights.cognitive += 0.10;
      weights.physical -= 0.05;
      weights.mental -= 0.05;
    }

    if (demands.includes('strategy')) {
      weights.cognitive += 0.05;
      weights.mental += 0.05;
      weights.physical -= 0.10;
    }

    if (demands.includes('power')) {
      weights.physical += 0.05;
      weights.mental += 0.05;
      weights.cognitive -= 0.10;
    }
  }

  const overall = (
    (physical * weights.physical) +
    (mental * weights.mental) +
    (cognitive * weights.cognitive)
  );

  return Math.round(overall);
}

/**
 * Determine risk level based on readiness score
 */
function getRiskLevel(readiness: number): ReadinessBreakdown['riskLevel'] {
  if (readiness >= 85) return 'optimal';
  if (readiness >= 75) return 'good';
  if (readiness >= 65) return 'moderate';
  if (readiness >= 55) return 'caution';
  return 'critical';
}

/**
 * Generate recommendations based on readiness breakdown
 */
function generateRecommendations(breakdown: Omit<ReadinessBreakdown, 'recommendations'>): string[] {
  const recs: string[] = [];

  // Physical recommendations
  if (breakdown.physical < 70) {
    if (breakdown.physical < 50) {
      recs.push('Critical: Consider rest day or light recovery session');
    } else {
      recs.push('Physical recovery needed - prioritize sleep and nutrition');
    }
  }

  // Mental recommendations
  if (breakdown.mental < 70) {
    if (breakdown.mental < 50) {
      recs.push('High stress/low mood detected - consider speaking with coach or sport psych');
    } else {
      recs.push('Mental recovery recommended - use relaxation or mindfulness techniques');
    }
  }

  // Cognitive recommendations
  if (breakdown.cognitive < 70) {
    if (breakdown.cognitive < 50) {
      recs.push('Low confidence/focus - review past successes, use visualization');
    } else {
      recs.push('Sharpen mental focus with pre-performance routines');
    }
  }

  // Optimal state
  if (breakdown.overall >= 85) {
    recs.push('Optimal readiness - ideal for peak performance');
  }

  // Trending
  if (breakdown.trend === 'declining') {
    recs.push('Declining trend detected - proactive recovery to prevent slump');
  } else if (breakdown.trend === 'improving') {
    recs.push('Positive momentum - maintain current recovery habits');
  }

  return recs.length > 0 ? recs : ['Maintain current training and recovery balance'];
}

/**
 * Calculate readiness from a single mood log
 */
export function calculateReadiness(
  log: MoodLogData,
  sport?: string
): ReadinessBreakdown {
  const sportConfig = sport ? getSportConfig(sport) : undefined;

  const physical = calculatePhysicalReadiness(log);
  const mental = calculateMentalReadiness(log);
  const cognitive = calculateCognitiveReadiness(log);
  const overall = calculateOverallReadiness(physical, mental, cognitive, sportConfig || undefined);

  const breakdown: Omit<ReadinessBreakdown, 'recommendations'> = {
    overall,
    physical,
    mental,
    cognitive,
    confidence: normalize(log.confidence, 7) * 10,
    trend: 'stable',
    riskLevel: getRiskLevel(overall),
  };

  return {
    ...breakdown,
    recommendations: generateRecommendations(breakdown),
  };
}

/**
 * Calculate temporal readiness with weighted combination of recent logs
 */
export function calculateTemporalReadiness(
  logs: MoodLogData[],
  sport?: string,
  gameDate?: Date
): TemporalReadiness {
  if (logs.length === 0) {
    throw new Error('No mood logs provided');
  }

  // Sort logs by date (most recent first)
  const sortedLogs = [...logs].sort((a, b) =>
    b.createdAt.getTime() - a.createdAt.getTime()
  );

  const sportConfig = sport ? getSportConfig(sport) : undefined;
  const weights = sportConfig?.temporalWeights || {
    today: 0.50,
    yesterday: 0.30,
    week: 0.20,
  };

  // Get reference date (game date or today)
  const refDate = gameDate || new Date();
  const refDateStart = new Date(refDate);
  refDateStart.setHours(0, 0, 0, 0);
  const refDateEnd = new Date(refDate);
  refDateEnd.setHours(23, 59, 59, 999);

  // Find logs for each time period
  const todayLog = sortedLogs.find(log => {
    const logDate = new Date(log.createdAt);
    return logDate >= refDateStart && logDate <= refDateEnd;
  });

  const yesterdayStart = new Date(refDateStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(refDateEnd);
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

  const yesterdayLog = sortedLogs.find(log => {
    const logDate = new Date(log.createdAt);
    return logDate >= yesterdayStart && logDate <= yesterdayEnd;
  });

  const weekStart = new Date(refDateStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const weekLogs = sortedLogs.filter(log => {
    const logDate = new Date(log.createdAt);
    return logDate >= weekStart && logDate <= refDateEnd;
  });

  // Calculate readiness for each period
  const current = todayLog ? calculateReadiness(todayLog, sport) : null;
  const yesterday = yesterdayLog ? calculateReadiness(yesterdayLog, sport) : null;

  let weekAverage: ReadinessBreakdown | null = null;
  if (weekLogs.length > 0) {
    const weekReadiness = weekLogs.map(log => calculateReadiness(log, sport));
    const avgPhysical = Math.round(
      weekReadiness.reduce((sum, r) => sum + r.physical, 0) / weekReadiness.length
    );
    const avgMental = Math.round(
      weekReadiness.reduce((sum, r) => sum + r.mental, 0) / weekReadiness.length
    );
    const avgCognitive = Math.round(
      weekReadiness.reduce((sum, r) => sum + r.cognitive, 0) / weekReadiness.length
    );
    const avgOverall = Math.round(
      weekReadiness.reduce((sum, r) => sum + r.overall, 0) / weekReadiness.length
    );

    weekAverage = {
      overall: avgOverall,
      physical: avgPhysical,
      mental: avgMental,
      cognitive: avgCognitive,
      confidence: Math.round(
        weekReadiness.reduce((sum, r) => sum + r.confidence, 0) / weekReadiness.length
      ),
      trend: 'stable',
      riskLevel: getRiskLevel(avgOverall),
      recommendations: [],
    };
  }

  // Calculate weighted composite
  let composite: ReadinessBreakdown;

  if (current) {
    // Use temporal weights
    let compositeOverall = 0;
    let compositePhysical = 0;
    let compositeMental = 0;
    let compositeCognitive = 0;
    let compositeConfidence = 0;
    let totalWeight = 0;

    compositeOverall += current.overall * weights.today;
    compositePhysical += current.physical * weights.today;
    compositeMental += current.mental * weights.today;
    compositeCognitive += current.cognitive * weights.today;
    compositeConfidence += current.confidence * weights.today;
    totalWeight += weights.today;

    if (yesterday) {
      compositeOverall += yesterday.overall * weights.yesterday;
      compositePhysical += yesterday.physical * weights.yesterday;
      compositeMental += yesterday.mental * weights.yesterday;
      compositeCognitive += yesterday.cognitive * weights.yesterday;
      compositeConfidence += yesterday.confidence * weights.yesterday;
      totalWeight += weights.yesterday;
    }

    if (weekAverage) {
      compositeOverall += weekAverage.overall * weights.week;
      compositePhysical += weekAverage.physical * weights.week;
      compositeMental += weekAverage.mental * weights.week;
      compositeCognitive += weekAverage.cognitive * weights.week;
      compositeConfidence += weekAverage.confidence * weights.week;
      totalWeight += weights.week;
    }

    // Normalize by total weight
    compositeOverall = Math.round(compositeOverall / totalWeight);
    compositePhysical = Math.round(compositePhysical / totalWeight);
    compositeMental = Math.round(compositeMental / totalWeight);
    compositeCognitive = Math.round(compositeCognitive / totalWeight);
    compositeConfidence = Math.round(compositeConfidence / totalWeight);

    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (weekAverage && current) {
      const delta = current.overall - weekAverage.overall;
      if (delta >= 8) trend = 'improving';
      else if (delta <= -8) trend = 'declining';
    }

    composite = {
      overall: compositeOverall,
      physical: compositePhysical,
      mental: compositeMental,
      cognitive: compositeCognitive,
      confidence: compositeConfidence,
      trend,
      riskLevel: getRiskLevel(compositeOverall),
      recommendations: generateRecommendations({
        overall: compositeOverall,
        physical: compositePhysical,
        mental: compositeMental,
        cognitive: compositeCognitive,
        confidence: compositeConfidence,
        trend,
        riskLevel: getRiskLevel(compositeOverall),
      }),
    };
  } else {
    // Fallback to week average or yesterday
    composite = weekAverage || yesterday || {
      overall: 70,
      physical: 70,
      mental: 70,
      cognitive: 70,
      confidence: 70,
      trend: 'stable',
      riskLevel: 'moderate',
      recommendations: ['Insufficient data - log mood regularly for accurate readiness'],
    };
  }

  // Calculate volatility (coefficient of variation)
  const allReadiness = weekLogs.map(log => calculateReadiness(log, sport).overall);
  let volatility = 0;
  if (allReadiness.length > 1) {
    const mean = allReadiness.reduce((sum, r) => sum + r, 0) / allReadiness.length;
    const variance = allReadiness.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / allReadiness.length;
    const stdDev = Math.sqrt(variance);
    volatility = mean > 0 ? stdDev / mean : 0;
  }

  return {
    current: current || composite,
    yesterday: yesterday || undefined,
    weekAverage: weekAverage || undefined,
    composite,
    volatility: Math.min(1, volatility),
  };
}

/**
 * Predict performance slump risk based on readiness trends
 */
export function predictSlumpRisk(logs: MoodLogData[], sport?: string): {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  probability: number; // 0-1
  reasoning: string[];
} {
  if (logs.length < 3) {
    return {
      riskLevel: 'low',
      probability: 0,
      reasoning: ['Insufficient data for slump prediction'],
    };
  }

  const sortedLogs = [...logs].sort((a, b) =>
    b.createdAt.getTime() - a.createdAt.getTime()
  ).slice(0, 7); // Last 7 days

  const readinessScores = sortedLogs.map(log =>
    calculateReadiness(log, sport).overall
  );

  const reasoning: string[] = [];
  let probability = 0;

  // Check for declining trend
  let decliningCount = 0;
  for (let i = 0; i < readinessScores.length - 1; i++) {
    if (readinessScores[i] < readinessScores[i + 1]) {
      decliningCount++;
    }
  }

  if (decliningCount >= 3) {
    probability += 0.30;
    reasoning.push(`Declining readiness trend (${decliningCount}/${readinessScores.length - 1} days)`);
  }

  // Check for low absolute readiness
  const avgReadiness = readinessScores.reduce((sum, r) => sum + r, 0) / readinessScores.length;
  if (avgReadiness < 65) {
    probability += 0.40;
    reasoning.push(`Low average readiness (${Math.round(avgReadiness)}/100)`);
  } else if (avgReadiness < 75) {
    probability += 0.20;
    reasoning.push(`Below-optimal readiness (${Math.round(avgReadiness)}/100)`);
  }

  // Check for high volatility
  const temporal = calculateTemporalReadiness(logs, sport);
  if (temporal.volatility > 0.15) {
    probability += 0.20;
    reasoning.push(`High readiness volatility (unstable mental/physical state)`);
  }

  // Check for consecutive low days
  const consecutiveLowDays = readinessScores.filter(r => r < 70).length;
  if (consecutiveLowDays >= 4) {
    probability += 0.30;
    reasoning.push(`${consecutiveLowDays} consecutive low-readiness days`);
  }

  // Determine risk level
  let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  if (probability >= 0.75) riskLevel = 'critical';
  else if (probability >= 0.50) riskLevel = 'high';
  else if (probability >= 0.30) riskLevel = 'moderate';
  else riskLevel = 'low';

  if (reasoning.length === 0) {
    reasoning.push('Readiness stable - no slump indicators detected');
  }

  return {
    riskLevel,
    probability: Math.min(1, probability),
    reasoning,
  };
}
