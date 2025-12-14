/**
 * Readiness Calculation Algorithm
 * 6-dimensional readiness scoring system based on sports psychology research
 *
 * Dimensions:
 * 1. Physical - Sleep, recovery, soreness, energy
 * 2. Mental - Focus, motivation, mental fatigue
 * 3. Emotional - Mood, anxiety, stress
 * 4. Recovery - Rest quality, training load balance
 * 5. Contextual - Academic stress, life events, schedule
 * 6. Social - Team cohesion, support system, relationships
 *
 * References:
 * - Kellmann et al. (2018) - Recovery-Stress State
 * - Saw et al. (2016) - Monitoring athletes through self-report
 * - Gastin et al. (2013) - Perceptual wellness and athlete monitoring
 */

export interface ReadinessInput {
  // Physical dimension
  sleepHours: number; // 0-12 hours
  sleepQuality: number; // 1-10 scale
  physicalFatigue: number; // 1-10 scale (higher = more fatigued)
  soreness: number; // 1-10 scale (higher = more sore)

  // Mental dimension
  mood: number; // 1-10 scale
  confidence: number; // 1-10 scale
  mentalFatigue: number; // 1-10 scale (higher = more fatigued)

  // Emotional dimension
  stress: number; // 1-10 scale (higher = more stress)
  anxiety: number; // 1-10 scale (higher = more anxious)

  // Recovery dimension
  daysSinceCompetition?: number; // 0-30+ days
  trainingLoadToday?: number; // 0-100 (RPE * duration)

  // Contextual dimension (optional)
  academicStress?: number; // 1-10 scale
  upcomingExams?: boolean;

  // Social dimension (optional)
  teamSupport?: number; // 1-10 scale
  personalRelationships?: number; // 1-10 scale
}

export interface ReadinessDimensions {
  physical: number; // 0-100
  mental: number; // 0-100
  emotional: number; // 0-100
  recovery: number; // 0-100
  contextual: number; // 0-100
  social: number; // 0-100
}

export interface ReadinessScore {
  overall: number; // 0-100
  dimensions: ReadinessDimensions;
  level: 'OPTIMAL' | 'GOOD' | 'MODERATE' | 'LOW' | 'POOR';
  factors: {
    dimension: string;
    score: number;
    impact: 'positive' | 'negative' | 'neutral';
    detail: string;
  }[];
}

/**
 * Calculate 6-dimensional readiness score
 */
export function calculateReadiness(input: ReadinessInput): ReadinessScore {
  const dimensions: ReadinessDimensions = {
    physical: calculatePhysicalReadiness(input),
    mental: calculateMentalReadiness(input),
    emotional: calculateEmotionalReadiness(input),
    recovery: calculateRecoveryReadiness(input),
    contextual: calculateContextualReadiness(input),
    social: calculateSocialReadiness(input),
  };

  // Weighted average - emotional and physical slightly higher weight
  const overall = Math.round(
    (dimensions.physical * 0.25 +
      dimensions.mental * 0.20 +
      dimensions.emotional * 0.25 +
      dimensions.recovery * 0.15 +
      dimensions.contextual * 0.10 +
      dimensions.social * 0.05) / 1.0
  );

  const level = getReadinessLevel(overall);
  const factors = identifyKeyFactors(dimensions, input);

  return { overall, dimensions, level, factors };
}

/**
 * Physical readiness based on sleep and fatigue
 */
function calculatePhysicalReadiness(input: ReadinessInput): number {
  // Sleep quality is most important (40% weight)
  const sleepScore = (input.sleepQuality / 10) * 100;

  // Sleep duration (30% weight) - optimal 7-9 hours
  let durationScore = 100;
  if (input.sleepHours < 6) {
    durationScore = (input.sleepHours / 6) * 60; // Severe penalty for <6hrs
  } else if (input.sleepHours < 7) {
    durationScore = 70 + ((input.sleepHours - 6) / 1) * 20;
  } else if (input.sleepHours <= 9) {
    durationScore = 100; // Optimal range
  } else {
    durationScore = 100 - ((input.sleepHours - 9) * 5); // Slight penalty for oversleeping
  }

  // Physical fatigue (20% weight) - inverted scale
  const fatigueScore = ((10 - input.physicalFatigue) / 10) * 100;

  // Soreness (10% weight) - inverted scale
  const sorenessScore = ((10 - input.soreness) / 10) * 100;

  const physical = Math.round(
    sleepScore * 0.4 +
    durationScore * 0.3 +
    fatigueScore * 0.2 +
    sorenessScore * 0.1
  );

  return Math.max(0, Math.min(100, physical));
}

/**
 * Mental readiness based on mood, confidence, and mental fatigue
 */
function calculateMentalReadiness(input: ReadinessInput): number {
  // Mood (40% weight)
  const moodScore = (input.mood / 10) * 100;

  // Confidence (40% weight)
  const confidenceScore = (input.confidence / 10) * 100;

  // Mental fatigue (20% weight) - inverted
  const mentalFatigueScore = ((10 - input.mentalFatigue) / 10) * 100;

  const mental = Math.round(
    moodScore * 0.4 +
    confidenceScore * 0.4 +
    mentalFatigueScore * 0.2
  );

  return Math.max(0, Math.min(100, mental));
}

/**
 * Emotional readiness based on stress and anxiety
 */
function calculateEmotionalReadiness(input: ReadinessInput): number {
  // Stress (50% weight) - inverted scale
  const stressScore = ((10 - input.stress) / 10) * 100;

  // Anxiety (50% weight) - inverted scale
  const anxietyScore = ((10 - input.anxiety) / 10) * 100;

  const emotional = Math.round((stressScore + anxietyScore) / 2);

  return Math.max(0, Math.min(100, emotional));
}

/**
 * Recovery readiness based on rest time and training load
 */
function calculateRecoveryReadiness(input: ReadinessInput): number {
  let recoveryScore = 80; // Base score

  // Days since last competition
  if (input.daysSinceCompetition !== undefined) {
    if (input.daysSinceCompetition === 0) {
      recoveryScore -= 20; // Just competed
    } else if (input.daysSinceCompetition === 1) {
      recoveryScore -= 10; // Day after
    } else if (input.daysSinceCompetition >= 3) {
      recoveryScore += 10; // Well-rested
    }
  }

  // Training load today
  if (input.trainingLoadToday !== undefined) {
    if (input.trainingLoadToday > 80) {
      recoveryScore -= 15; // Very high load
    } else if (input.trainingLoadToday > 60) {
      recoveryScore -= 5; // Moderate load
    } else if (input.trainingLoadToday < 30) {
      recoveryScore += 10; // Light day
    }
  }

  // Sleep contributes to recovery
  if (input.sleepHours < 7) {
    recoveryScore -= 15;
  } else if (input.sleepHours >= 8) {
    recoveryScore += 10;
  }

  return Math.max(0, Math.min(100, recoveryScore));
}

/**
 * Contextual readiness based on life stressors
 */
function calculateContextualReadiness(input: ReadinessInput): number {
  let contextScore = 85; // Base score

  // Academic stress
  if (input.academicStress !== undefined) {
    const academicImpact = ((10 - input.academicStress) / 10) * 30;
    contextScore = contextScore * 0.7 + academicImpact;
  }

  // Upcoming exams
  if (input.upcomingExams === true) {
    contextScore -= 15;
  }

  return Math.max(0, Math.min(100, Math.round(contextScore)));
}

/**
 * Social readiness based on support systems
 */
function calculateSocialReadiness(input: ReadinessInput): number {
  let socialScore = 80; // Base score - assume neutral

  if (input.teamSupport !== undefined) {
    socialScore = (input.teamSupport / 10) * 60;
  }

  if (input.personalRelationships !== undefined) {
    socialScore += (input.personalRelationships / 10) * 40;
  }

  return Math.max(0, Math.min(100, Math.round(socialScore)));
}

/**
 * Get readiness level category
 */
function getReadinessLevel(score: number): 'OPTIMAL' | 'GOOD' | 'MODERATE' | 'LOW' | 'POOR' {
  if (score >= 90) return 'OPTIMAL';
  if (score >= 75) return 'GOOD';
  if (score >= 60) return 'MODERATE';
  if (score >= 45) return 'LOW';
  return 'POOR';
}

/**
 * Identify key factors impacting readiness
 */
function identifyKeyFactors(
  dimensions: ReadinessDimensions,
  input: ReadinessInput
): ReadinessScore['factors'] {
  const factors: ReadinessScore['factors'] = [];

  // Check each dimension
  Object.entries(dimensions).forEach(([dimension, score]) => {
    if (score >= 85) {
      factors.push({
        dimension,
        score,
        impact: 'positive',
        detail: getFactorDetail(dimension, score, input),
      });
    } else if (score <= 60) {
      factors.push({
        dimension,
        score,
        impact: 'negative',
        detail: getFactorDetail(dimension, score, input),
      });
    }
  });

  // Sort by impact magnitude
  return factors.sort((a, b) => {
    if (a.impact === 'negative' && b.impact !== 'negative') return -1;
    if (a.impact !== 'negative' && b.impact === 'negative') return 1;
    return Math.abs(b.score - 75) - Math.abs(a.score - 75);
  });
}

/**
 * Get detailed explanation for a factor
 */
function getFactorDetail(dimension: string, score: number, input: ReadinessInput): string {
  switch (dimension) {
    case 'physical':
      if (input.sleepHours < 6) return `Poor sleep duration (${input.sleepHours}hrs)`;
      if (input.sleepQuality <= 5) return `Low sleep quality (${input.sleepQuality}/10)`;
      if (score >= 85) return `Excellent physical recovery`;
      return `Physical fatigue present`;

    case 'mental':
      if (input.mood <= 5) return `Low mood (${input.mood}/10)`;
      if (input.confidence <= 5) return `Low confidence (${input.confidence}/10)`;
      if (score >= 85) return `Strong mental state`;
      return `Mental fatigue affecting readiness`;

    case 'emotional':
      if (input.stress >= 7) return `High stress levels (${input.stress}/10)`;
      if (input.anxiety >= 7) return `Elevated anxiety (${input.anxiety}/10)`;
      if (score >= 85) return `Emotionally balanced`;
      return `Emotional challenges present`;

    case 'recovery':
      if (input.daysSinceCompetition === 0) return `Just competed today`;
      if (input.trainingLoadToday && input.trainingLoadToday > 80) return `High training load today`;
      if (score >= 85) return `Well-recovered`;
      return `Recovery needs attention`;

    case 'contextual':
      if (input.upcomingExams) return `Exams approaching`;
      if (input.academicStress && input.academicStress >= 7) return `High academic stress`;
      if (score >= 85) return `Life balance maintained`;
      return `External stressors present`;

    case 'social':
      if (input.teamSupport && input.teamSupport <= 5) return `Limited team support`;
      if (score >= 85) return `Strong support system`;
      return `Social factors neutral`;

    default:
      return '';
  }
}

/**
 * Simple readiness from mood log (backward compatibility)
 */
export function calculateSimpleReadiness(mood: number, confidence: number, stress: number): number {
  // Legacy calculation for mood logs without full readiness data
  const score = ((mood + confidence + (11 - stress)) / 3) * 10;
  return Math.round(Math.max(0, Math.min(100, score)));
}
