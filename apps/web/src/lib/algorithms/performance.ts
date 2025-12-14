/**
 * Performance Prediction Models
 * Predicts athletic performance based on readiness and historical patterns
 *
 * Prediction Models:
 * 1. Game-Day Performance - Predict performance for upcoming competition
 * 2. Training Capacity - Estimate optimal training load tolerance
 * 3. Recovery Timeline - Predict time needed for full recovery
 * 4. Readiness-Performance Correlation - Athlete-specific relationship modeling
 *
 * References:
 * - Gabbett (2016) - Training load and injury/performance
 * - Buchheit (2014) - Monitoring fitness, fatigue, and performance
 * - Halson (2014) - Monitoring training load to understand fatigue
 */

export interface PerformancePredictionData {
  // Historical readiness and performance data
  historicalData: Array<{
    date: string;
    readiness: number; // 0-100
    performance?: number; // 1-10 (optional - actual performance rating)
    context?: {
      isCompetition: boolean;
      importance?: 'high' | 'medium' | 'low';
      opponent?: string;
      location?: 'home' | 'away' | 'neutral';
    };
  }>;

  // Current readiness state
  currentReadiness: number; // 0-100

  // Upcoming event details
  upcomingEvent?: {
    date: string;
    importance: 'championship' | 'playoff' | 'conference' | 'regular' | 'scrimmage';
    opponent?: string;
    location?: 'home' | 'away' | 'neutral';
    daysUntilEvent: number;
  };

  // Psychological state
  currentPsychological?: {
    confidence: number; // 1-10
    anxiety: number; // 1-10
    motivation: number; // 1-10
  };
}

export interface PerformancePrediction {
  predictedPerformance: number; // 1-10 scale
  confidenceInterval: {
    low: number;
    high: number;
  };
  confidence: number; // 0-100% prediction confidence
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    magnitude: number; // -100 to +100
    description: string;
  }>;
  recommendations: string[];
  readinessPerformanceCorrelation: number; // -1 to 1
  optimalReadinessZone: {
    min: number;
    max: number;
  };
}

export interface TrainingCapacityPrediction {
  recommendedLoad: number; // 0-100
  maxSafeLoad: number; // 0-100
  recoveryDaysNeeded: number;
  confidence: number;
  reasoning: string[];
}

/**
 * Predict game-day performance
 */
export function predictPerformance(data: PerformancePredictionData): PerformancePrediction {
  // Calculate athlete-specific readiness-performance correlation
  const correlation = calculateReadinessPerformanceCorrelation(data.historicalData);
  const optimalZone = determineOptimalReadinessZone(data.historicalData);

  // Base prediction from readiness
  const basePrediction = predictFromReadiness(data.currentReadiness, correlation, optimalZone);

  // Adjust for contextual factors
  const factors = analyzePerformanceFactors(data);
  const adjustedPrediction = applyFactorAdjustments(basePrediction, factors);

  // Calculate confidence interval
  const interval = calculateConfidenceInterval(adjustedPrediction, data.historicalData);

  // Generate recommendations
  const recommendations = generatePerformanceRecommendations(data, adjustedPrediction, factors);

  // Calculate prediction confidence
  const confidence = calculatePredictionConfidence(data);

  return {
    predictedPerformance: Math.round(adjustedPrediction * 10) / 10,
    confidenceInterval: {
      low: Math.round(interval.low * 10) / 10,
      high: Math.round(interval.high * 10) / 10,
    },
    confidence,
    factors,
    recommendations,
    readinessPerformanceCorrelation: correlation,
    optimalReadinessZone: optimalZone,
  };
}

/**
 * Calculate athlete-specific readiness-performance correlation
 */
function calculateReadinessPerformanceCorrelation(
  history: PerformancePredictionData['historicalData']
): number {
  // Filter to only entries with performance data
  const withPerformance = history.filter(entry => entry.performance !== undefined);

  if (withPerformance.length < 5) {
    return 0.65; // Default moderate-high correlation
  }

  const readinessValues = withPerformance.map(e => e.readiness);
  const performanceValues = withPerformance.map(e => e.performance!);

  return calculateCorrelation(readinessValues, performanceValues);
}

/**
 * Determine athlete's optimal readiness zone
 */
function determineOptimalReadinessZone(
  history: PerformancePredictionData['historicalData']
): { min: number; max: number } {
  const withPerformance = history.filter(e => e.performance !== undefined);

  if (withPerformance.length < 5) {
    return { min: 75, max: 95 }; // Default optimal zone
  }

  // Find top 25% performances
  const sorted = [...withPerformance].sort((a, b) => (b.performance || 0) - (a.performance || 0));
  const topPerformances = sorted.slice(0, Math.ceil(sorted.length * 0.25));

  // Find readiness range for top performances
  const readinessValues = topPerformances.map(e => e.readiness);
  const min = Math.min(...readinessValues);
  const max = Math.max(...readinessValues);

  return {
    min: Math.max(60, min - 5), // Add buffer
    max: Math.min(100, max + 5),
  };
}

/**
 * Predict performance from readiness score
 */
function predictFromReadiness(
  readiness: number,
  correlation: number,
  optimalZone: { min: number; max: number }
): number {
  // Base prediction: linear mapping with correlation strength
  let prediction = 5.5; // Neutral baseline

  // Strong correlation: readiness directly predicts performance
  if (correlation > 0.5) {
    // Map readiness (0-100) to performance (1-10)
    prediction = 1 + (readiness / 100) * 9;

    // Boost if in optimal zone
    if (readiness >= optimalZone.min && readiness <= optimalZone.max) {
      prediction += 0.5;
    }
  } else {
    // Weak correlation: more conservative prediction
    if (readiness >= 80) prediction = 7.5;
    else if (readiness >= 70) prediction = 6.5;
    else if (readiness >= 60) prediction = 5.5;
    else if (readiness >= 50) prediction = 4.5;
    else prediction = 3.5;
  }

  return Math.max(1, Math.min(10, prediction));
}

/**
 * Analyze factors affecting performance
 */
function analyzePerformanceFactors(data: PerformancePredictionData) {
  const factors: PerformancePrediction['factors'] = [];

  // 1. Current readiness level
  if (data.currentReadiness >= 85) {
    factors.push({
      factor: 'Excellent Readiness',
      impact: 'positive',
      magnitude: 25,
      description: `Readiness at ${data.currentReadiness} - optimal condition`,
    });
  } else if (data.currentReadiness <= 60) {
    factors.push({
      factor: 'Low Readiness',
      impact: 'negative',
      magnitude: -30,
      description: `Readiness at ${data.currentReadiness} - below optimal`,
    });
  } else if (data.currentReadiness >= 75) {
    factors.push({
      factor: 'Good Readiness',
      impact: 'positive',
      magnitude: 10,
      description: `Readiness at ${data.currentReadiness} - good condition`,
    });
  }

  // 2. Event importance (pressure factor)
  if (data.upcomingEvent) {
    const { importance, daysUntilEvent } = data.upcomingEvent;

    if (importance === 'championship' || importance === 'playoff') {
      // High pressure can enhance or hurt depending on anxiety
      const anxiety = data.currentPsychological?.anxiety || 5;
      if (anxiety <= 5) {
        factors.push({
          factor: 'Championship Motivation',
          impact: 'positive',
          magnitude: 15,
          description: 'High stakes event with manageable anxiety',
        });
      } else if (anxiety >= 8) {
        factors.push({
          factor: 'High-Pressure Anxiety',
          impact: 'negative',
          magnitude: -20,
          description: 'Championship pressure with high anxiety',
        });
      }
    }

    // Days until event (taper effect)
    if (daysUntilEvent <= 3 && daysUntilEvent >= 1) {
      factors.push({
        factor: 'Optimal Taper Period',
        impact: 'positive',
        magnitude: 10,
        description: `${daysUntilEvent} days out - good timing for peak`,
      });
    } else if (daysUntilEvent === 0) {
      // Game day - depends on readiness
      if (data.currentReadiness >= 75) {
        factors.push({
          factor: 'Game-Day Ready',
          impact: 'positive',
          magnitude: 5,
          description: 'Rested and prepared for competition',
        });
      }
    }
  }

  // 3. Psychological factors
  if (data.currentPsychological) {
    const { confidence, anxiety, motivation } = data.currentPsychological;

    // Confidence
    if (confidence >= 8) {
      factors.push({
        factor: 'High Confidence',
        impact: 'positive',
        magnitude: 20,
        description: `Confidence at ${confidence}/10`,
      });
    } else if (confidence <= 5) {
      factors.push({
        factor: 'Low Confidence',
        impact: 'negative',
        magnitude: -15,
        description: `Confidence at ${confidence}/10`,
      });
    }

    // Motivation
    if (motivation >= 8) {
      factors.push({
        factor: 'High Motivation',
        impact: 'positive',
        magnitude: 15,
        description: `Motivation at ${motivation}/10`,
      });
    } else if (motivation <= 5) {
      factors.push({
        factor: 'Low Motivation',
        impact: 'negative',
        magnitude: -20,
        description: `Motivation at ${motivation}/10`,
      });
    }

    // Anxiety (moderate is optimal)
    if (anxiety >= 4 && anxiety <= 6) {
      factors.push({
        factor: 'Optimal Arousal',
        impact: 'positive',
        magnitude: 10,
        description: 'Anxiety at optimal activation level',
      });
    } else if (anxiety >= 8) {
      factors.push({
        factor: 'High Anxiety',
        impact: 'negative',
        magnitude: -25,
        description: `Anxiety at ${anxiety}/10 - may impair performance`,
      });
    } else if (anxiety <= 2) {
      factors.push({
        factor: 'Low Arousal',
        impact: 'negative',
        magnitude: -10,
        description: 'May lack competitive edge',
      });
    }
  }

  // 4. Home vs Away
  if (data.upcomingEvent?.location) {
    if (data.upcomingEvent.location === 'home') {
      factors.push({
        factor: 'Home Field Advantage',
        impact: 'positive',
        magnitude: 8,
        description: 'Competing at home venue',
      });
    } else if (data.upcomingEvent.location === 'away') {
      factors.push({
        factor: 'Away Game Challenge',
        impact: 'negative',
        magnitude: -5,
        description: 'Competing at away venue',
      });
    }
  }

  // 5. Historical trend
  const recentPerformances = data.historicalData
    .filter(e => e.performance !== undefined)
    .slice(0, 5);

  if (recentPerformances.length >= 3) {
    const trend = calculateTrend(recentPerformances.map(e => e.performance!));
    if (trend > 0.3) {
      factors.push({
        factor: 'Positive Momentum',
        impact: 'positive',
        magnitude: 12,
        description: 'Recent performances trending upward',
      });
    } else if (trend < -0.3) {
      factors.push({
        factor: 'Negative Trend',
        impact: 'negative',
        magnitude: -12,
        description: 'Recent performances declining',
      });
    }
  }

  return factors;
}

/**
 * Apply factor adjustments to base prediction
 */
function applyFactorAdjustments(
  basePrediction: number,
  factors: PerformancePrediction['factors']
): number {
  // Sum magnitude impacts (convert to 1-10 scale adjustment)
  const totalImpact = factors.reduce((sum, f) => sum + f.magnitude, 0);
  const adjustment = (totalImpact / 100) * 2; // Scale to ±2 points max

  return Math.max(1, Math.min(10, basePrediction + adjustment));
}

/**
 * Calculate confidence interval
 */
function calculateConfidenceInterval(
  prediction: number,
  history: PerformancePredictionData['historicalData']
): { low: number; high: number } {
  const withPerformance = history.filter(e => e.performance !== undefined);

  if (withPerformance.length < 5) {
    // Wide interval with limited data
    return {
      low: Math.max(1, prediction - 1.5),
      high: Math.min(10, prediction + 1.5),
    };
  }

  // Calculate standard deviation of performances
  const performances = withPerformance.map(e => e.performance!);
  const stdDev = Math.sqrt(calculateVariance(performances));

  // 68% confidence interval (±1 SD)
  return {
    low: Math.max(1, prediction - stdDev * 0.8),
    high: Math.min(10, prediction + stdDev * 0.8),
  };
}

/**
 * Calculate prediction confidence
 */
function calculatePredictionConfidence(data: PerformancePredictionData): number {
  let confidence = 50;

  // More historical data = higher confidence
  const historyLength = data.historicalData.length;
  if (historyLength >= 30) confidence += 25;
  else if (historyLength >= 15) confidence += 15;
  else if (historyLength >= 7) confidence += 10;

  // More performance data = higher confidence
  const perfData = data.historicalData.filter(e => e.performance !== undefined);
  if (perfData.length >= 10) confidence += 15;
  else if (perfData.length >= 5) confidence += 10;

  // Psychological data available
  if (data.currentPsychological) confidence += 10;

  return Math.min(95, confidence);
}

/**
 * Generate performance recommendations
 */
function generatePerformanceRecommendations(
  data: PerformancePredictionData,
  prediction: number,
  factors: PerformancePrediction['factors']
): string[] {
  const recommendations: string[] = [];

  // Readiness-based recommendations
  if (data.currentReadiness < 70) {
    recommendations.push('Prioritize rest and recovery before competition');
    recommendations.push('Consider light training day or complete rest');
  } else if (data.currentReadiness >= 85) {
    recommendations.push('Readiness optimal - maintain current preparation');
  }

  // Psychological recommendations
  if (data.currentPsychological) {
    const { confidence, anxiety, motivation } = data.currentPsychological;

    if (confidence <= 6) {
      recommendations.push('Build confidence through visualization and past success review');
      recommendations.push('Focus on process goals and controllables');
    }

    if (anxiety >= 7) {
      recommendations.push('Implement pre-competition anxiety management (breathing, routine)');
      recommendations.push('Use centering and mindfulness techniques');
    }

    if (motivation <= 6) {
      recommendations.push('Revisit personal goals and "why" behind competition');
      recommendations.push('Connect with intrinsic motivators');
    }
  }

  // Event-specific recommendations
  if (data.upcomingEvent) {
    const { importance, daysUntilEvent } = data.upcomingEvent;

    if (importance === 'championship' || importance === 'playoff') {
      recommendations.push('Stick to established routines - avoid major changes');
      recommendations.push('Focus on controllable performance goals, not outcome');
    }

    if (daysUntilEvent === 1) {
      recommendations.push('Finalize game-day routine and preparation plan');
      recommendations.push('Get quality sleep tonight (8+ hours)');
    } else if (daysUntilEvent === 0) {
      recommendations.push('Execute pre-competition routine consistently');
      recommendations.push('Stay present and trust preparation');
    }
  }

  // Factor-based recommendations
  const negativeFactors = factors.filter(f => f.impact === 'negative');
  if (negativeFactors.length >= 3) {
    recommendations.push('Address multiple concerning factors with coach');
    recommendations.push('May need adjusted expectations or additional support');
  }

  // Default if no specific recommendations
  if (recommendations.length === 0) {
    recommendations.push('Continue current preparation approach');
    recommendations.push('Monitor readiness and adjust as needed');
  }

  return recommendations;
}

/**
 * Predict optimal training capacity
 */
export function predictTrainingCapacity(data: {
  currentReadiness: number;
  recentTrainingLoad: number[]; // Last 7-14 days
  recentFatigue: number[]; // 1-10 scale
  daysSinceCompetition: number;
}): TrainingCapacityPrediction {
  const reasoning: string[] = [];

  // Base capacity from current readiness
  let recommendedLoad = data.currentReadiness * 0.7; // Conservative
  let maxSafeLoad = data.currentReadiness * 0.9;

  // Adjust for recent load trend
  if (data.recentTrainingLoad.length >= 7) {
    const avgLoad = data.recentTrainingLoad.reduce((sum, l) => sum + l, 0) / data.recentTrainingLoad.length;
    const trend = calculateTrend(data.recentTrainingLoad);

    if (trend > 5) {
      // Increasing load - reduce to prevent overload
      recommendedLoad *= 0.85;
      maxSafeLoad *= 0.9;
      reasoning.push('Recent load increasing - recommend caution');
    } else if (avgLoad > 75) {
      recommendedLoad *= 0.8;
      reasoning.push('Recent high training load - prioritize recovery');
    }
  }

  // Adjust for fatigue
  if (data.recentFatigue.length >= 3) {
    const avgFatigue = data.recentFatigue.reduce((sum, f) => sum + f, 0) / data.recentFatigue.length;
    if (avgFatigue >= 7.5) {
      recommendedLoad *= 0.7;
      maxSafeLoad *= 0.8;
      reasoning.push('High fatigue - significant load reduction needed');
    } else if (avgFatigue >= 6.5) {
      recommendedLoad *= 0.85;
      reasoning.push('Moderate fatigue - reduce training volume');
    }
  }

  // Adjust for days since competition
  if (data.daysSinceCompetition <= 1) {
    recommendedLoad = Math.min(recommendedLoad, 30);
    maxSafeLoad = Math.min(maxSafeLoad, 50);
    reasoning.push('Recent competition - active recovery only');
  } else if (data.daysSinceCompetition <= 2) {
    recommendedLoad *= 0.6;
    maxSafeLoad *= 0.75;
    reasoning.push('Post-competition recovery period');
  }

  // Recovery days calculation
  let recoveryDaysNeeded = 0;
  if (data.currentReadiness < 60) {
    recoveryDaysNeeded = 3;
    reasoning.push('Low readiness - 3 rest days recommended');
  } else if (data.currentReadiness < 70) {
    recoveryDaysNeeded = 2;
    reasoning.push('Moderate readiness - 2 rest days recommended');
  } else if (data.currentReadiness < 75) {
    recoveryDaysNeeded = 1;
  }

  const confidence = data.recentTrainingLoad.length >= 7 && data.recentFatigue.length >= 7 ? 85 : 65;

  return {
    recommendedLoad: Math.round(recommendedLoad),
    maxSafeLoad: Math.round(maxSafeLoad),
    recoveryDaysNeeded,
    confidence,
    reasoning: reasoning.length > 0 ? reasoning : ['Normal training capacity'],
  };
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

/**
 * Helper: Calculate correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  const numerator = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
  const denomX = Math.sqrt(x.reduce((sum, val) => sum + Math.pow(val - meanX, 2), 0));
  const denomY = Math.sqrt(y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0));

  if (denomX === 0 || denomY === 0) return 0;

  return numerator / (denomX * denomY);
}
