/**
 * Statistical Correlation Analysis for Performance Metrics
 *
 * Calculates Pearson correlation coefficients, linear regression, confidence intervals,
 * and sport-specific performance scores.
 *
 * Research basis:
 * - Hopkins (2000) - Measures of reliability in sports medicine
 * - Cohen (1988) - Statistical power analysis
 * - Batterham & Hopkins (2006) - Making meaningful inferences about magnitudes
 */

import { getSportConfig, type SportMetric } from './sport-configs';
import type { ReadinessBreakdown } from './readiness';

export type CorrelationResult = {
  r: number;                    // Pearson correlation coefficient (-1 to 1)
  rSquared: number;             // Coefficient of determination (0 to 1)
  pValue: number;               // Statistical significance (0 to 1)
  n: number;                    // Sample size
  confidenceInterval: {         // 95% CI for correlation
    lower: number;
    upper: number;
  };
  interpretation: string;       // Human-readable interpretation
  magnitude: 'trivial' | 'small' | 'moderate' | 'large' | 'very large';
  isSignificant: boolean;       // p < 0.05
};

export type RegressionResult = {
  slope: number;                // Change in Y per unit change in X
  intercept: number;            // Y-intercept
  rSquared: number;             // Goodness of fit
  standardError: number;        // Standard error of estimate
  prediction: (x: number) => {  // Predict Y from X with confidence interval
    value: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  };
};

export type PerformanceAnalysis = {
  sport: string;
  metric: string;
  performanceScore: number;     // 0-100 composite score
  readinessCorrelation: CorrelationResult;
  regression: RegressionResult;
  insights: {
    optimalReadinessRange: [number, number];
    performanceAtHighReadiness: number;  // Avg performance when readiness >85
    performanceAtLowReadiness: number;   // Avg performance when readiness <70
    percentageImpact: number;            // % improvement from low to high readiness
  };
  recommendations: string[];
};

/**
 * Calculate Pearson correlation coefficient
 */
export function calculatePearsonR(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) {
    throw new Error('Arrays must have equal length and at least 2 elements');
  }

  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Calculate p-value for correlation coefficient using t-distribution
 */
function calculatePValue(r: number, n: number): number {
  if (n < 3) return 1; // Not enough data

  // Calculate t-statistic
  const t = r * Math.sqrt((n - 2) / (1 - r * r));

  // Degrees of freedom
  const df = n - 2;

  // Approximate p-value using t-distribution (two-tailed)
  // For simplicity, using approximation. In production, use proper statistical library
  const p = 2 * (1 - studentTCDF(Math.abs(t), df));

  return Math.min(1, Math.max(0, p));
}

/**
 * Approximate Student's t cumulative distribution function
 */
function studentTCDF(t: number, df: number): number {
  // Approximation using normal distribution for large df
  if (df > 30) {
    return normalCDF(t);
  }

  // Simple approximation for small df
  const x = df / (df + t * t);
  const a = df / 2;
  const b = 0.5;

  // Incomplete beta function approximation
  return 1 - 0.5 * incompleteBeta(x, a, b);
}

/**
 * Normal CDF approximation
 */
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return z > 0 ? 1 - prob : prob;
}

/**
 * Incomplete beta function approximation
 */
function incompleteBeta(x: number, a: number, b: number): number {
  if (x === 0) return 0;
  if (x === 1) return 1;

  // Continued fraction approximation
  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;

  let f = 1, c = 1, d = 0;
  for (let i = 0; i <= 200; i++) {
    const m = i / 2;
    let numerator;

    if (i === 0) {
      numerator = 1;
    } else if (i % 2 === 0) {
      numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    } else {
      numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    }

    const denominator = 1;
    d = denominator + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = denominator + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const delta = c * d;
    f *= delta;

    if (Math.abs(delta - 1.0) < 1e-8) break;
  }

  return front * (f - 1);
}

/**
 * Log gamma function approximation
 */
function logGamma(x: number): number {
  const cof = [
    76.18009172947146, -86.50532032941677,
    24.01409824083091, -1.231739572450155,
    0.001208650973866179, -0.000005395239384953
  ];

  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;

  for (let j = 0; j < 6; j++) {
    ser += cof[j] / ++y;
  }

  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

/**
 * Calculate 95% confidence interval for correlation coefficient using Fisher z-transformation
 */
function calculateCorrelationCI(r: number, n: number): { lower: number; upper: number } {
  if (n < 4) return { lower: -1, upper: 1 }; // Not enough data

  // Fisher z-transformation
  const z = 0.5 * Math.log((1 + r) / (1 - r));
  const se = 1 / Math.sqrt(n - 3);

  // 95% CI in z-space (z ± 1.96 * SE)
  const zLower = z - 1.96 * se;
  const zUpper = z + 1.96 * se;

  // Transform back to r-space
  const rLower = (Math.exp(2 * zLower) - 1) / (Math.exp(2 * zLower) + 1);
  const rUpper = (Math.exp(2 * zUpper) - 1) / (Math.exp(2 * zUpper) + 1);

  return {
    lower: Math.max(-1, rLower),
    upper: Math.min(1, rUpper),
  };
}

/**
 * Interpret correlation magnitude (Hopkins, 2002)
 */
function getCorrelationMagnitude(r: number): CorrelationResult['magnitude'] {
  const absR = Math.abs(r);

  if (absR < 0.10) return 'trivial';
  if (absR < 0.30) return 'small';
  if (absR < 0.50) return 'moderate';
  if (absR < 0.70) return 'large';
  return 'very large';
}

/**
 * Generate interpretation text for correlation
 */
function interpretCorrelation(r: number, pValue: number, metric: string): string {
  const absR = Math.abs(r);
  const magnitude = getCorrelationMagnitude(r);
  const direction = r > 0 ? 'positive' : 'negative';
  const significant = pValue < 0.05 ? 'statistically significant' : 'not statistically significant';

  if (absR < 0.10) {
    return `Trivial correlation between readiness and ${metric} (${significant}, p=${pValue.toFixed(3)})`;
  }

  return `${magnitude.charAt(0).toUpperCase() + magnitude.slice(1)} ${direction} correlation (r=${r.toFixed(2)}) between readiness and ${metric} (${significant}, p=${pValue.toFixed(3)})`;
}

/**
 * Calculate full correlation analysis
 */
export function analyzeCorrelation(
  readinessScores: number[],
  performanceScores: number[],
  metricName: string = 'performance'
): CorrelationResult {
  const r = calculatePearsonR(readinessScores, performanceScores);
  const n = readinessScores.length;
  const rSquared = r * r;
  const pValue = calculatePValue(r, n);
  const ci = calculateCorrelationCI(r, n);

  return {
    r,
    rSquared,
    pValue,
    n,
    confidenceInterval: ci,
    interpretation: interpretCorrelation(r, pValue, metricName),
    magnitude: getCorrelationMagnitude(r),
    isSignificant: pValue < 0.05,
  };
}

/**
 * Calculate linear regression (Y = slope * X + intercept)
 */
export function calculateLinearRegression(
  x: number[],
  y: number[]
): RegressionResult {
  if (x.length !== y.length || x.length < 2) {
    throw new Error('Arrays must have equal length and at least 2 elements');
  }

  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

  const meanX = sumX / n;
  const meanY = sumY / n;

  // Calculate slope and intercept
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = meanY - slope * meanX;

  // Calculate R-squared
  const ssTotal = sumY2 - (sumY * sumY) / n;
  const ssResidual = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + (yi - predicted) ** 2;
  }, 0);
  const rSquared = 1 - ssResidual / ssTotal;

  // Calculate standard error of estimate
  const standardError = Math.sqrt(ssResidual / (n - 2));

  // Prediction function with 95% confidence interval
  const prediction = (xValue: number) => {
    const predicted = slope * xValue + intercept;

    // Standard error of prediction
    const sumXDiffSq = x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0);
    const sePrediction = standardError * Math.sqrt(
      1 + 1 / n + ((xValue - meanX) ** 2) / sumXDiffSq
    );

    // 95% CI (using t-distribution with df = n-2)
    const tValue = 1.96; // Approximation for large samples
    const margin = tValue * sePrediction;

    return {
      value: predicted,
      confidenceInterval: {
        lower: predicted - margin,
        upper: predicted + margin,
      },
    };
  };

  return {
    slope,
    intercept,
    rSquared,
    standardError,
    prediction,
  };
}

/**
 * Calculate composite performance score from sport-specific metrics
 */
export function calculatePerformanceScore(
  stats: Record<string, number>,
  sport: string
): number {
  const config = getSportConfig(sport);
  if (!config) {
    throw new Error(`Sport configuration not found: ${sport}`);
  }

  let totalScore = 0;
  let totalWeight = 0;

  for (const metric of config.metrics) {
    const value = stats[metric.key];
    if (value === undefined || value === null) continue;

    // Normalize metric to 0-100 scale based on typical ranges
    let normalizedValue: number;

    // For metrics where higher is better
    if (metric.higherIsBetter) {
      // Use heuristic normalization (sport-specific ranges would be better)
      if (metric.key.includes('Pct') || metric.key.includes('Percentage') || metric.key.includes('Accuracy')) {
        // Already in percentage (0-100 or 0-1)
        normalizedValue = value > 1 ? value : value * 100;
      } else if (metric.key === 'points') {
        normalizedValue = Math.min(100, (value / 30) * 100); // 30 points = 100 score
      } else if (metric.key === 'goals') {
        normalizedValue = Math.min(100, (value / 3) * 100); // 3 goals = 100 score
      } else {
        // General normalization
        normalizedValue = Math.min(100, (value / 10) * 100);
      }
    } else {
      // For metrics where lower is better (turnovers, errors, etc.)
      if (metric.key === 'turnovers' || metric.key.includes('Error')) {
        normalizedValue = Math.max(0, 100 - (value * 20)); // 5 turnovers = 0 score
      } else if (metric.key === 'time') {
        // Time-based - context dependent, assume lower is better
        normalizedValue = Math.max(0, 100 - value); // Simplified
      } else {
        normalizedValue = Math.max(0, 100 - (value * 10));
      }
    }

    totalScore += normalizedValue * metric.correlationWeight;
    totalWeight += metric.correlationWeight;
  }

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

/**
 * Comprehensive performance-readiness analysis
 */
export function analyzePerformanceReadiness(
  data: Array<{
    readiness: number;
    stats: Record<string, number>;
  }>,
  sport: string,
  metricKey?: string
): PerformanceAnalysis {
  const config = getSportConfig(sport);
  if (!config) {
    throw new Error(`Sport configuration not found: ${sport}`);
  }

  // Use primary metric if not specified
  const targetMetric = metricKey || config.primaryMetric;
  const metricConfig = config.metrics.find(m => m.key === targetMetric);
  if (!metricConfig) {
    throw new Error(`Metric not found: ${targetMetric}`);
  }

  // Extract readiness and metric values
  const readinessScores: number[] = [];
  const metricValues: number[] = [];
  const performanceScores: number[] = [];

  for (const item of data) {
    const metricValue = item.stats[targetMetric];
    if (metricValue !== undefined && metricValue !== null) {
      readinessScores.push(item.readiness);
      metricValues.push(metricValue);
      performanceScores.push(calculatePerformanceScore(item.stats, sport));
    }
  }

  if (readinessScores.length < 3) {
    throw new Error('Insufficient data for analysis (minimum 3 data points required)');
  }

  // Calculate correlation
  const correlation = analyzeCorrelation(readinessScores, metricValues, metricConfig.label);

  // Calculate regression
  const regression = calculateLinearRegression(readinessScores, metricValues);

  // Calculate insights
  const highReadinessData = data.filter(d => d.readiness >= 85);
  const lowReadinessData = data.filter(d => d.readiness < 70);

  const avgHighPerformance = highReadinessData.length > 0
    ? highReadinessData.reduce((sum, d) => sum + (d.stats[targetMetric] || 0), 0) / highReadinessData.length
    : 0;

  const avgLowPerformance = lowReadinessData.length > 0
    ? lowReadinessData.reduce((sum, d) => sum + (d.stats[targetMetric] || 0), 0) / lowReadinessData.length
    : 0;

  const percentageImpact = avgLowPerformance > 0
    ? ((avgHighPerformance - avgLowPerformance) / avgLowPerformance) * 100
    : 0;

  // Find optimal readiness range (where performance is highest)
  const sortedByReadiness = [...data].sort((a, b) => b.readiness - a.readiness);
  const top25Percent = sortedByReadiness.slice(0, Math.ceil(sortedByReadiness.length * 0.25));
  const readinessRange: [number, number] = [
    Math.min(...top25Percent.map(d => d.readiness)),
    Math.max(...top25Percent.map(d => d.readiness)),
  ];

  // Generate recommendations
  const recommendations: string[] = [];

  if (correlation.magnitude === 'large' || correlation.magnitude === 'very large') {
    recommendations.push(
      `Strong correlation detected (r=${correlation.r.toFixed(2)}) - readiness is a key performance driver`
    );
  }

  if (percentageImpact > 30) {
    recommendations.push(
      `${Math.round(percentageImpact)}% performance improvement when readiness >85 vs <70 - prioritize recovery`
    );
  }

  if (readinessRange[0] >= 80) {
    recommendations.push(
      `Optimal performance zone: readiness ${Math.round(readinessRange[0])}-${Math.round(readinessRange[1])} - maintain this range for peak performance`
    );
  }

  if (correlation.isSignificant && correlation.r > 0.5) {
    recommendations.push(
      `Statistically significant correlation (p=${correlation.pValue.toFixed(3)}) - use readiness as predictive indicator`
    );
  } else {
    recommendations.push(
      `Correlation not yet significant (p=${correlation.pValue.toFixed(3)}) - collect more data for reliable predictions`
    );
  }

  return {
    sport,
    metric: metricConfig.label,
    performanceScore: Math.round(
      performanceScores.reduce((sum, s) => sum + s, 0) / performanceScores.length
    ),
    readinessCorrelation: correlation,
    regression,
    insights: {
      optimalReadinessRange: readinessRange,
      performanceAtHighReadiness: Math.round(avgHighPerformance * 10) / 10,
      performanceAtLowReadiness: Math.round(avgLowPerformance * 10) / 10,
      percentageImpact: Math.round(percentageImpact * 10) / 10,
    },
    recommendations,
  };
}
