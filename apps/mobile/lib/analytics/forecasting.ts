/**
 * Readiness Trend Forecasting
 *
 * Uses exponential smoothing to forecast readiness scores 7 days ahead:
 * - Single exponential smoothing for level
 * - Double exponential smoothing (Holt's method) for trend
 * - Confidence bounds (±1 standard deviation)
 * - Risk flags for predicted declines
 *
 * Requires minimum 14 days of historical data for reliable forecasts
 */

import { prisma } from '@/lib/prisma';

export interface ForecastPoint {
  date: string; // YYYY-MM-DD
  predictedScore: number; // 0-100
  lowerBound: number; // predictedScore - 1 std dev
  upperBound: number; // predictedScore + 1 std dev
  confidence: 'high' | 'medium' | 'low';
}

export interface ReadinessForecast {
  athleteId: string;
  historicalData: { date: string; score: number }[];
  forecast: ForecastPoint[];
  currentScore: number;
  trend: 'improving' | 'declining' | 'stable';
  riskFlags: string[];
  recommendations: string[];
}

/**
 * Calculate exponential smoothing forecast using Holt's method
 * (double exponential smoothing with level + trend components)
 *
 * @param data - Historical time series data
 * @param alpha - Smoothing parameter for level (0-1, typical 0.3)
 * @param beta - Smoothing parameter for trend (0-1, typical 0.1)
 * @param forecastHorizon - Number of periods to forecast ahead
 */
function doubleExponentialSmoothing(
  data: number[],
  alpha: number = 0.3,
  beta: number = 0.1,
  forecastHorizon: number = 7
): { forecast: number[]; residuals: number[] } {
  if (data.length < 2) {
    throw new Error('Need at least 2 data points for forecasting');
  }

  const n = data.length;
  const level: number[] = new Array(n);
  const trend: number[] = new Array(n);
  const fitted: number[] = new Array(n);
  const residuals: number[] = new Array(n);

  // Initialize level and trend
  level[0] = data[0];
  trend[0] = data[1] - data[0]; // Initial trend

  fitted[0] = level[0];
  residuals[0] = data[0] - fitted[0];

  // Update level and trend for each observation
  for (let t = 1; t < n; t++) {
    // Level equation: L_t = α * y_t + (1 - α) * (L_{t-1} + T_{t-1})
    const prevLevel = level[t - 1];
    const prevTrend = trend[t - 1];

    level[t] = alpha * data[t] + (1 - alpha) * (prevLevel + prevTrend);

    // Trend equation: T_t = β * (L_t - L_{t-1}) + (1 - β) * T_{t-1}
    trend[t] = beta * (level[t] - prevLevel) + (1 - beta) * prevTrend;

    // Fitted value (one-step-ahead forecast)
    fitted[t] = prevLevel + prevTrend;
    residuals[t] = data[t] - fitted[t];
  }

  // Generate forecast
  const forecast: number[] = [];
  const currentLevel = level[n - 1];
  const currentTrend = trend[n - 1];

  for (let h = 1; h <= forecastHorizon; h++) {
    // Forecast equation: F_{t+h} = L_t + h * T_t
    const forecastValue = currentLevel + h * currentTrend;
    forecast.push(forecastValue);
  }

  return { forecast, residuals };
}

/**
 * Calculate forecast confidence based on historical accuracy
 */
function calculateConfidence(residuals: number[], dataPoints: number): 'high' | 'medium' | 'low' {
  // Mean Absolute Percentage Error (MAPE)
  const mae = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / residuals.length;

  // Confidence based on error and sample size
  const hasEnoughData = dataPoints >= 30;
  const isAccurate = mae < 10; // < 10 points error

  if (hasEnoughData && isAccurate) return 'high';
  if (hasEnoughData || isAccurate) return 'medium';
  return 'low';
}

/**
 * Detect risk patterns in forecast
 */
function detectRiskFlags(
  forecast: number[],
  currentScore: number,
  trend: number
): string[] {
  const flags: string[] = [];

  // Check for predicted decline
  const avgForecast = forecast.reduce((sum, val) => sum + val, 0) / forecast.length;
  if (avgForecast < currentScore - 10) {
    flags.push('Predicted decline detected');
  }

  // Check if forecast goes below optimal threshold
  const belowOptimalCount = forecast.filter((val) => val < 70).length;
  if (belowOptimalCount >= 4) {
    flags.push('Multiple days below optimal threshold (70)');
  }

  // Check for concerning low values
  const lowCount = forecast.filter((val) => val < 50).length;
  if (lowCount > 0) {
    flags.push(`${lowCount} day(s) predicted below 50 - high risk`);
  }

  // Check trend direction
  if (trend < -1.5) {
    flags.push('Strong declining trend detected');
  }

  // Variability warning
  const forecastStd = Math.sqrt(
    forecast.reduce((sum, val) => sum + Math.pow(val - avgForecast, 2), 0) / forecast.length
  );
  if (forecastStd > 15) {
    flags.push('High variability in forecast - unpredictable pattern');
  }

  return flags;
}

/**
 * Generate actionable recommendations based on forecast
 */
function generateRecommendations(
  forecast: number[],
  riskFlags: string[],
  trend: number
): string[] {
  const recommendations: string[] = [];

  if (riskFlags.length === 0) {
    recommendations.push('Readiness trajectory looks stable. Maintain current routine.');
    return recommendations;
  }

  if (trend < -1) {
    recommendations.push('Schedule recovery-focused week to reverse declining trend.');
    recommendations.push('Reduce training load by 20-30% over next 7 days.');
  }

  if (riskFlags.some((f) => f.includes('below 50'))) {
    recommendations.push('URGENT: High risk of burnout. Implement rest protocol immediately.');
    recommendations.push('Schedule 1-on-1 check-in within 24 hours.');
  }

  if (riskFlags.some((f) => f.includes('variability'))) {
    recommendations.push('Inconsistent patterns detected. Improve sleep and stress management consistency.');
  }

  if (forecast[0] < 60) {
    recommendations.push('Tomorrow\'s forecast is low. Consider light training or rest day.');
  }

  return recommendations;
}

/**
 * Forecast readiness trend for an athlete
 *
 * @param athleteId - Athlete user ID
 * @param days - Number of historical days to use (default 30, min 14)
 * @returns 7-day readiness forecast with confidence bounds
 */
export async function forecastReadinessTrend(
  athleteId: string,
  days: number = 30
): Promise<ReadinessForecast> {
  // Fetch historical readiness scores
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const historicalScores = await prisma.readinessScore.findMany({
    where: {
      athleteId,
      calculatedAt: {
        gte: fromDate,
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

  if (historicalScores.length < 14) {
    throw new Error(`Insufficient data for forecasting. Need at least 14 days, have ${historicalScores.length}`);
  }

  // Extract scores and dates
  const scores = historicalScores.map((s) => s.score);
  const dates = historicalScores.map((s) => s.calculatedAt.toISOString().split('T')[0]);

  // Run exponential smoothing forecast
  const { forecast, residuals } = doubleExponentialSmoothing(scores, 0.3, 0.1, 7);

  // Calculate standard deviation of residuals for confidence bounds
  const residualMean = residuals.reduce((sum, r) => sum + r, 0) / residuals.length;
  const residualStd = Math.sqrt(
    residuals.reduce((sum, r) => sum + Math.pow(r - residualMean, 2), 0) / residuals.length
  );

  // Build forecast points with confidence bounds
  const forecastPoints: ForecastPoint[] = forecast.map((score, idx) => {
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + idx + 1);

    return {
      date: forecastDate.toISOString().split('T')[0],
      predictedScore: Math.round(Math.max(0, Math.min(100, score))),
      lowerBound: Math.round(Math.max(0, score - residualStd)),
      upperBound: Math.round(Math.min(100, score + residualStd)),
      confidence: calculateConfidence(residuals, historicalScores.length),
    };
  });

  // Calculate current trend
  const currentScore = scores[scores.length - 1];
  const trendSlope = (scores[scores.length - 1] - scores[scores.length - 7]) / 7; // 7-day trend
  const trend: 'improving' | 'declining' | 'stable' =
    trendSlope > 1.5 ? 'improving' : trendSlope < -1.5 ? 'declining' : 'stable';

  // Detect risk flags
  const riskFlags = detectRiskFlags(forecast, currentScore, trendSlope);

  // Generate recommendations
  const recommendations = generateRecommendations(forecast, riskFlags, trendSlope);

  return {
    athleteId,
    historicalData: historicalScores.map((s, idx) => ({
      date: dates[idx],
      score: s.score,
    })),
    forecast: forecastPoints,
    currentScore,
    trend,
    riskFlags,
    recommendations,
  };
}
