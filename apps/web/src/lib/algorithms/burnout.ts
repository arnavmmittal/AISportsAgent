/**
 * Burnout Prediction Algorithm
 * Predicts athlete burnout risk over a 30-day forecast period
 *
 * Burnout Indicators:
 * 1. Progressive readiness decline
 * 2. Chronic stress accumulation
 * 3. Reduced recovery capacity
 * 4. Emotional exhaustion patterns
 * 5. Declining intrinsic motivation
 * 6. Increasing sense of reduced accomplishment
 *
 * References:
 * - Raedeke & Smith (2001) - Athlete Burnout Questionnaire
 * - Gustafsson et al. (2017) - Athlete burnout prevalence
 * - Smith (1986) - Cognitive-affective model of athletic burnout
 */

export interface BurnoutHistoricalData {
  // Performance and readiness history
  readinessHistory: Array<{
    date: string;
    score: number;
  }>;

  // Mood and motivation data
  psychologicalHistory: Array<{
    date: string;
    mood: number; // 1-10
    confidence: number; // 1-10
    stress: number; // 1-10
    anxiety: number; // 1-10
    motivation?: number; // 1-10 (optional)
  }>;

  // Physical indicators
  physicalHistory: Array<{
    date: string;
    sleepHours: number;
    sleepQuality: number; // 1-10
    fatigue: number; // 1-10
    soreness: number; // 1-10
  }>;

  // Recovery patterns
  recoveryHistory?: Array<{
    date: string;
    recoveryQuality: number; // 1-10
    restDays: boolean;
  }>;
}

export interface BurnoutWarningSign {
  indicator: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  trend: 'worsening' | 'stable' | 'improving';
  description: string;
  evidence: string[];
}

export interface BurnoutPrediction {
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  probability: number; // 0-100% chance of burnout in next 30 days
  confidence: number; // 0-100% confidence in prediction
  projectedDate?: string; // When burnout is likely to occur (if trend continues)
  daysUntilRisk: number; // Days until entering high-risk zone
  currentStage: 'healthy' | 'early-warning' | 'developing' | 'advanced' | 'critical';
  warningNow: BurnoutWarningSign[];
  forecast: Array<{
    date: string;
    projectedRisk: number; // 0-100
    confidence: number;
  }>;
  preventionStrategies: string[];
}

/**
 * Predict burnout risk over 30-day period
 */
export function predictBurnout(data: BurnoutHistoricalData): BurnoutPrediction {
  // Analyze current state and trends
  const warningNow = identifyWarningNow(data);
  const currentStage = determineBurnoutStage(warningNow);
  const trends = analyzeBurnoutTrends(data);

  // Generate 30-day forecast
  const forecast = generateBurnoutForecast(data, trends);
  const probability = calculateBurnoutProbability(trends, warningNow);
  const riskLevel = getBurnoutRiskLevel(probability);
  const confidence = calculatePredictionConfidence(data, trends);

  // Determine when athlete will enter high-risk zone
  const daysUntilRisk = estimateDaysUntilHighRisk(forecast);
  const projectedDate = daysUntilRisk > 0 && daysUntilRisk <= 30
    ? getDateFromNow(daysUntilRisk)
    : undefined;

  // Generate prevention strategies
  const preventionStrategies = generatePreventionStrategies(warningNow, currentStage, trends);

  return {
    riskLevel,
    probability,
    confidence,
    projectedDate,
    daysUntilRisk,
    currentStage,
    warningNow,
    forecast,
    preventionStrategies,
  };
}

/**
 * Identify current warning signs of burnout
 */
function identifyWarningNow(data: BurnoutHistoricalData): BurnoutWarningSign[] {
  const signs: BurnoutWarningSign[] = [];

  // Sort data by date (most recent first)
  const recentReadiness = [...data.readinessHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 14);

  const recentPsych = [...data.psychologicalHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 14);

  const recentPhysical = [...data.physicalHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 14);

  // 1. Progressive readiness decline
  if (recentReadiness.length >= 7) {
    const last7Avg = recentReadiness.slice(0, 7).reduce((sum, r) => sum + r.score, 0) / 7;
    const prev7Avg = recentReadiness.slice(7, 14).reduce((sum, r) => sum + r.score, 0) / Math.min(7, recentReadiness.length - 7);

    if (last7Avg < 65 && prev7Avg - last7Avg > 10) {
      signs.push({
        indicator: 'Progressive Readiness Decline',
        severity: 'critical',
        trend: 'worsening',
        description: 'Significant and sustained drop in readiness scores',
        evidence: [
          `Current 7-day average: ${last7Avg.toFixed(1)}`,
          `Decline of ${(prev7Avg - last7Avg).toFixed(1)} points from previous week`,
        ],
      });
    } else if (last7Avg < 70 && prev7Avg - last7Avg > 5) {
      signs.push({
        indicator: 'Progressive Readiness Decline',
        severity: 'high',
        trend: 'worsening',
        description: 'Moderate decline in readiness over time',
        evidence: [`Decline of ${(prev7Avg - last7Avg).toFixed(1)} points`],
      });
    }
  }

  // 2. Chronic stress accumulation
  if (recentPsych.length >= 7) {
    const last7 = recentPsych.slice(0, 7);
    const avgStress = last7.reduce((sum, r) => sum + r.stress, 0) / 7;
    const highStressDays = last7.filter(r => r.stress >= 7).length;

    if (avgStress >= 7.5 && highStressDays >= 5) {
      signs.push({
        indicator: 'Chronic Stress Accumulation',
        severity: 'critical',
        trend: 'worsening',
        description: 'Persistent high stress without adequate recovery periods',
        evidence: [
          `Average stress: ${avgStress.toFixed(1)}/10`,
          `${highStressDays}/7 days with high stress (≥7)`,
        ],
      });
    } else if (avgStress >= 7.0 && highStressDays >= 4) {
      signs.push({
        indicator: 'Chronic Stress Accumulation',
        severity: 'high',
        trend: 'worsening',
        description: 'Elevated stress levels without sufficient breaks',
        evidence: [`${highStressDays}/7 days with high stress`],
      });
    }
  }

  // 3. Emotional exhaustion (low mood + high anxiety)
  if (recentPsych.length >= 7) {
    const last7 = recentPsych.slice(0, 7);
    const avgMood = last7.reduce((sum, r) => sum + r.mood, 0) / 7;
    const avgAnxiety = last7.reduce((sum, r) => sum + r.anxiety, 0) / 7;
    const lowMoodDays = last7.filter(r => r.mood <= 5).length;

    if (avgMood <= 4.5 && avgAnxiety >= 7) {
      signs.push({
        indicator: 'Emotional Exhaustion',
        severity: 'critical',
        trend: 'worsening',
        description: 'Severe emotional depletion with persistent low mood and anxiety',
        evidence: [
          `Average mood: ${avgMood.toFixed(1)}/10`,
          `Average anxiety: ${avgAnxiety.toFixed(1)}/10`,
          `${lowMoodDays}/7 days with low mood`,
        ],
      });
    } else if (avgMood <= 5.5 && avgAnxiety >= 6.5) {
      signs.push({
        indicator: 'Emotional Exhaustion',
        severity: 'high',
        trend: 'worsening',
        description: 'Significant emotional strain',
        evidence: [`${lowMoodDays}/7 days with low mood`],
      });
    }
  }

  // 4. Reduced recovery capacity (poor sleep + high fatigue)
  if (recentPhysical.length >= 7) {
    const last7 = recentPhysical.slice(0, 7);
    const avgSleep = last7.reduce((sum, r) => sum + r.sleepHours, 0) / 7;
    const avgSleepQuality = last7.reduce((sum, r) => sum + r.sleepQuality, 0) / 7;
    const avgFatigue = last7.reduce((sum, r) => sum + r.fatigue, 0) / 7;

    if (avgSleep < 6.5 && avgSleepQuality <= 5 && avgFatigue >= 7.5) {
      signs.push({
        indicator: 'Reduced Recovery Capacity',
        severity: 'critical',
        trend: 'worsening',
        description: 'Severe deficit in physical recovery and restoration',
        evidence: [
          `Average sleep: ${avgSleep.toFixed(1)} hours`,
          `Sleep quality: ${avgSleepQuality.toFixed(1)}/10`,
          `Average fatigue: ${avgFatigue.toFixed(1)}/10`,
        ],
      });
    } else if (avgSleep < 7 && (avgSleepQuality <= 6 || avgFatigue >= 7)) {
      signs.push({
        indicator: 'Reduced Recovery Capacity',
        severity: 'high',
        trend: 'worsening',
        description: 'Impaired physical recovery',
        evidence: [`Sleep: ${avgSleep.toFixed(1)}h, Fatigue: ${avgFatigue.toFixed(1)}/10`],
      });
    }
  }

  // 5. Declining motivation (if available)
  if (recentPsych.length >= 7 && recentPsych[0].motivation !== undefined) {
    const last7 = recentPsych.slice(0, 7).filter(r => r.motivation !== undefined);
    if (last7.length >= 5) {
      const avgMotivation = last7.reduce((sum, r) => sum + (r.motivation || 0), 0) / last7.length;
      const lowMotivationDays = last7.filter(r => (r.motivation || 0) <= 5).length;

      if (avgMotivation <= 4.5 && lowMotivationDays >= 5) {
        signs.push({
          indicator: 'Declining Intrinsic Motivation',
          severity: 'critical',
          trend: 'worsening',
          description: 'Severe loss of motivation and engagement',
          evidence: [
            `Average motivation: ${avgMotivation.toFixed(1)}/10`,
            `${lowMotivationDays}/${last7.length} days with low motivation`,
          ],
        });
      } else if (avgMotivation <= 5.5 && lowMotivationDays >= 3) {
        signs.push({
          indicator: 'Declining Intrinsic Motivation',
          severity: 'high',
          trend: 'worsening',
          description: 'Noticeable decrease in motivation',
          evidence: [`${lowMotivationDays}/${last7.length} days with low motivation`],
        });
      }
    }
  }

  // 6. Reduced sense of accomplishment (low confidence over time)
  if (recentPsych.length >= 14) {
    const last14 = recentPsych.slice(0, 14);
    const avgConfidence = last14.reduce((sum, r) => sum + r.confidence, 0) / 14;
    const confidenceTrend = calculateTrend(last14.map(r => r.confidence));

    if (avgConfidence <= 5 && confidenceTrend < -0.15) {
      signs.push({
        indicator: 'Reduced Sense of Accomplishment',
        severity: 'high',
        trend: 'worsening',
        description: 'Declining confidence and self-efficacy',
        evidence: [
          `Average confidence: ${avgConfidence.toFixed(1)}/10`,
          'Negative confidence trend over 2 weeks',
        ],
      });
    }
  }

  return signs;
}

/**
 * Determine current burnout stage
 */
function determineBurnoutStage(warnings: BurnoutWarningSign[]): 'healthy' | 'early-warning' | 'developing' | 'advanced' | 'critical' {
  const criticalSigns = warnings.filter(w => w.severity === 'critical').length;
  const highSigns = warnings.filter(w => w.severity === 'high').length;
  const totalSigns = warnings.length;

  if (criticalSigns >= 3 || (criticalSigns >= 2 && highSigns >= 2)) {
    return 'critical';
  } else if (criticalSigns >= 2 || (criticalSigns >= 1 && highSigns >= 2)) {
    return 'advanced';
  } else if (criticalSigns >= 1 || highSigns >= 2 || totalSigns >= 3) {
    return 'developing';
  } else if (totalSigns >= 1) {
    return 'early-warning';
  }
  return 'healthy';
}

/**
 * Analyze burnout-related trends
 */
function analyzeBurnoutTrends(data: BurnoutHistoricalData) {
  const recentReadiness = [...data.readinessHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30);

  const recentPsych = [...data.psychologicalHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30);

  const recentPhysical = [...data.physicalHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30);

  return {
    readinessTrend: calculateTrend(recentReadiness.map(r => r.score)),
    stressTrend: recentPsych.length > 0 ? calculateTrend(recentPsych.map(r => r.stress)) : 0,
    moodTrend: recentPsych.length > 0 ? calculateTrend(recentPsych.map(r => r.mood)) : 0,
    sleepTrend: recentPhysical.length > 0 ? calculateTrend(recentPhysical.map(r => r.sleepHours)) : 0,
    fatigueTrend: recentPhysical.length > 0 ? calculateTrend(recentPhysical.map(r => r.fatigue)) : 0,
    readinessVolatility: calculateVariance(recentReadiness.map(r => r.score)),
  };
}

/**
 * Generate 30-day burnout risk forecast
 */
function generateBurnoutForecast(
  data: BurnoutHistoricalData,
  trends: ReturnType<typeof analyzeBurnoutTrends>
): Array<{ date: string; projectedRisk: number; confidence: number }> {
  const forecast: Array<{ date: string; projectedRisk: number; confidence: number }> = [];

  // Get current baseline risk
  const currentReadiness = data.readinessHistory[0]?.score || 75;
  const currentStress = data.psychologicalHistory[0]?.stress || 5;

  // Project forward 30 days
  for (let day = 1; day <= 30; day++) {
    // Project readiness decline
    const projectedReadiness = Math.max(0, Math.min(100,
      currentReadiness + (trends.readinessTrend * day)
    ));

    // Project stress increase
    const projectedStress = Math.max(0, Math.min(10,
      currentStress + (trends.stressTrend * day)
    ));

    // Calculate risk score (inverse of readiness + stress component)
    const readinessRisk = (100 - projectedReadiness) * 0.6;
    const stressRisk = (projectedStress / 10) * 100 * 0.4;
    const projectedRisk = Math.round(readinessRisk + stressRisk);

    // Confidence decreases with distance into future
    const confidence = Math.max(40, 95 - (day * 1.5));

    forecast.push({
      date: getDateFromNow(day),
      projectedRisk,
      confidence: Math.round(confidence),
    });
  }

  return forecast;
}

/**
 * Calculate probability of burnout in next 30 days
 */
function calculateBurnoutProbability(
  trends: ReturnType<typeof analyzeBurnoutTrends>,
  warnings: BurnoutWarningSign[]
): number {
  let probability = 0;

  // Base probability from warning signs
  const criticalCount = warnings.filter(w => w.severity === 'critical').length;
  const highCount = warnings.filter(w => w.severity === 'high').length;

  probability += criticalCount * 25;
  probability += highCount * 15;

  // Trend multipliers
  if (trends.readinessTrend < -0.5) probability += 20; // Steep readiness decline
  else if (trends.readinessTrend < -0.3) probability += 10;

  if (trends.stressTrend > 0.1) probability += 15; // Increasing stress
  if (trends.moodTrend < -0.1) probability += 10; // Declining mood
  if (trends.fatigueTrend > 0.1) probability += 10; // Increasing fatigue

  // High volatility = instability
  if (trends.readinessVolatility > 400) probability += 10;

  return Math.min(100, Math.round(probability));
}

/**
 * Get risk level from probability
 */
function getBurnoutRiskLevel(probability: number): 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' {
  if (probability >= 75) return 'CRITICAL';
  if (probability >= 50) return 'HIGH';
  if (probability >= 30) return 'MODERATE';
  return 'LOW';
}

/**
 * Calculate confidence in prediction
 */
function calculatePredictionConfidence(
  data: BurnoutHistoricalData,
  trends: ReturnType<typeof analyzeBurnoutTrends>
): number {
  let confidence = 50; // Base confidence

  // More data = higher confidence
  if (data.readinessHistory.length >= 30) confidence += 20;
  else if (data.readinessHistory.length >= 14) confidence += 10;

  if (data.psychologicalHistory.length >= 30) confidence += 15;
  else if (data.psychologicalHistory.length >= 14) confidence += 8;

  if (data.physicalHistory.length >= 30) confidence += 15;
  else if (data.physicalHistory.length >= 14) confidence += 7;

  // Stable trends = higher confidence
  if (trends.readinessVolatility < 200) confidence += 10;

  return Math.min(100, confidence);
}

/**
 * Estimate days until athlete enters high-risk zone
 */
function estimateDaysUntilHighRisk(forecast: Array<{ date: string; projectedRisk: number; confidence: number }>): number {
  const highRiskThreshold = 60;

  for (let i = 0; i < forecast.length; i++) {
    if (forecast[i].projectedRisk >= highRiskThreshold) {
      return i + 1;
    }
  }

  return 999; // Not within forecast period
}

/**
 * Generate prevention strategies based on current state
 */
function generatePreventionStrategies(
  warnings: BurnoutWarningSign[],
  stage: string,
  trends: ReturnType<typeof analyzeBurnoutTrends>
): string[] {
  const strategies: string[] = [];

  // Critical stage interventions
  if (stage === 'critical') {
    strategies.push('URGENT: Schedule immediate meeting with athlete and support staff');
    strategies.push('Consider temporary reduction or pause in training/competition');
    strategies.push('Refer to sports psychologist for comprehensive burnout assessment');
    strategies.push('Implement daily check-ins and close monitoring');
    return strategies;
  }

  // Advanced stage interventions
  if (stage === 'advanced') {
    strategies.push('Schedule comprehensive meeting within 24-48 hours');
    strategies.push('Reduce training volume by 30-40% for next 1-2 weeks');
    strategies.push('Implement structured recovery protocols');
  }

  // Specific warning-based strategies
  const warningCategories = new Set(warnings.map(w => w.indicator));

  if (warningCategories.has('Progressive Readiness Decline')) {
    strategies.push('Implement 2-3 complete rest days this week');
    strategies.push('Review and adjust training load progression');
  }

  if (warningCategories.has('Chronic Stress Accumulation')) {
    strategies.push('Introduce daily stress management practice (mindfulness, breathing)');
    strategies.push('Connect athlete with mental health resources');
  }

  if (warningCategories.has('Emotional Exhaustion')) {
    strategies.push('Schedule session with sports psychologist');
    strategies.push('Explore sources of emotional strain (academic, personal, athletic)');
  }

  if (warningCategories.has('Reduced Recovery Capacity')) {
    strategies.push('Prioritize sleep hygiene education and implementation');
    strategies.push('Add recovery modalities (massage, ice baths, active recovery)');
  }

  if (warningCategories.has('Declining Intrinsic Motivation')) {
    strategies.push('Revisit athlete goals and personal "why"');
    strategies.push('Introduce variety and autonomy in training');
  }

  // General prevention strategies
  if (strategies.length === 0) {
    strategies.push('Continue monitoring with weekly check-ins');
    strategies.push('Maintain focus on sleep, nutrition, and stress management');
    strategies.push('Encourage open communication about wellbeing');
  }

  return strategies;
}

/**
 * Helper: Get date N days from now
 */
function getDateFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Helper: Calculate variance
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Helper: Calculate linear trend (slope)
 */
function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  const sumX = indices.reduce((sum, val) => sum + val, 0);
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = indices.reduce((sum, val, i) => sum + val * values[i], 0);
  const sumX2 = indices.reduce((sum, val) => sum + val * val, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  return slope;
}
