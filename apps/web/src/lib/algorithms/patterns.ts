/**
 * Pattern Detection Algorithms
 * Identifies behavioral and performance patterns in athlete data
 *
 * Pattern Types:
 * 1. Anomaly Detection - Outliers and unusual spikes/drops
 * 2. Trend Detection - Systematic upward/downward patterns
 * 3. Cyclic Patterns - Weekly, monthly, or seasonal cycles
 * 4. Correlation Patterns - Relationships between metrics
 * 5. Event-Response Patterns - How external events affect metrics
 * 6. Behavioral Clusters - Grouping similar response patterns
 *
 * Techniques:
 * - Statistical anomaly detection (Z-score, IQR)
 * - Mann-Kendall trend test
 * - Autocorrelation for cycles
 * - Pearson/Spearman correlation
 * - K-means clustering (simplified)
 *
 * References:
 * - Chandola et al. (2009) - Anomaly detection survey
 * - Mann (1945) & Kendall (1975) - Trend detection
 * - Hastie et al. (2009) - Statistical learning methods
 */

export interface PatternDetectionData {
  // Time series data
  timeSeries: Array<{
    date: string;
    readiness: number;
    mood: number;
    confidence: number;
    stress: number;
    anxiety: number;
    sleep: number;
    training_load?: number;
  }>;

  // Event markers (optional)
  events?: Array<{
    date: string;
    type: 'competition' | 'exam' | 'injury' | 'travel' | 'other';
    description: string;
  }>;

  // Athlete metadata
  metadata?: {
    sport: string;
    position?: string;
    season?: 'preseason' | 'regular' | 'postseason' | 'offseason';
  };
}

export interface AnomalyDetection {
  date: string;
  metric: string;
  value: number;
  severity: 'critical' | 'high' | 'moderate';
  deviation: number; // How many standard deviations from mean
  context: string;
  possibleCauses: string[];
}

export interface TrendPattern {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: 'strong' | 'moderate' | 'weak';
  startDate: string;
  endDate: string;
  slope: number;
  significance: number; // 0-1 (p-value)
  description: string;
}

export interface CyclicPattern {
  metric: string;
  period: 'daily' | 'weekly' | 'monthly';
  strength: number; // 0-1 (autocorrelation)
  description: string;
  peakDays?: string[]; // e.g., ['Monday', 'Friday']
  lowDays?: string[];
}

export interface CorrelationPattern {
  metric1: string;
  metric2: string;
  correlation: number; // -1 to 1
  strength: 'strong' | 'moderate' | 'weak';
  direction: 'positive' | 'negative';
  description: string;
  insights: string[];
}

export interface EventResponsePattern {
  eventType: string;
  avgResponseDuration: number; // days
  typicalImpact: {
    metric: string;
    change: number; // +/- percentage
  }[];
  description: string;
}

export interface PatternDetectionResults {
  anomalies: AnomalyDetection[];
  trends: TrendPattern[];
  cycles: CyclicPattern[];
  correlations: CorrelationPattern[];
  eventResponses: EventResponsePattern[];
  summary: string;
  insights: string[];
}

/**
 * Comprehensive pattern detection
 */
export function detectPatterns(data: PatternDetectionData): PatternDetectionResults {
  const anomalies = detectAnomalies(data.timeSeries);
  const trends = detectTrends(data.timeSeries);
  const cycles = detectCycles(data.timeSeries);
  const correlations = detectCorrelations(data.timeSeries);
  const eventResponses = data.events ? analyzeEventResponses(data.timeSeries, data.events) : [];

  const insights = generateInsights(anomalies, trends, cycles, correlations, eventResponses);
  const summary = generateSummary(anomalies, trends, cycles, correlations);

  return {
    anomalies,
    trends,
    cycles,
    correlations,
    eventResponses,
    summary,
    insights,
  };
}

/**
 * Detect anomalies using Z-score and IQR methods
 */
function detectAnomalies(timeSeries: PatternDetectionData['timeSeries']): AnomalyDetection[] {
  const anomalies: AnomalyDetection[] = [];

  if (timeSeries.length < 7) return anomalies;

  const metrics = ['readiness', 'mood', 'confidence', 'stress', 'anxiety', 'sleep'] as const;

  metrics.forEach(metric => {
    const values = timeSeries.map(entry => entry[metric]);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(calculateVariance(values));

    // Z-score anomaly detection
    timeSeries.forEach((entry, idx) => {
      const value = entry[metric];
      const zScore = stdDev > 0 ? Math.abs((value - mean) / stdDev) : 0;

      // Critical: >3 SD
      if (zScore > 3) {
        anomalies.push({
          date: entry.date,
          metric: formatMetricName(metric),
          value,
          severity: 'critical',
          deviation: zScore,
          context: `${formatMetricName(metric)} at ${value} is ${zScore.toFixed(1)} standard deviations from normal`,
          possibleCauses: inferAnomalyCauses(metric, value, mean, entry),
        });
      }
      // High: >2 SD
      else if (zScore > 2) {
        anomalies.push({
          date: entry.date,
          metric: formatMetricName(metric),
          value,
          severity: 'high',
          deviation: zScore,
          context: `Unusual ${metric === 'stress' || metric === 'anxiety' ? 'spike' : 'change'} in ${formatMetricName(metric)}`,
          possibleCauses: inferAnomalyCauses(metric, value, mean, entry),
        });
      }
    });
  });

  // Sort by severity and deviation
  return anomalies.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, moderate: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.deviation - a.deviation;
  });
}

/**
 * Detect trends using linear regression and Mann-Kendall test
 */
function detectTrends(timeSeries: PatternDetectionData['timeSeries']): TrendPattern[] {
  const trends: TrendPattern[] = [];

  if (timeSeries.length < 10) return trends;

  const metrics = ['readiness', 'mood', 'confidence', 'stress', 'anxiety', 'sleep'] as const;

  metrics.forEach(metric => {
    const values = timeSeries.map(entry => entry[metric]);
    const slope = calculateTrend(values);
    const significance = mannKendallTest(values);

    // Only report significant trends (p < 0.1)
    if (significance < 0.1 && Math.abs(slope) > 0.1) {
      const direction = slope > 0 ? 'increasing' : 'decreasing';
      let strength: 'strong' | 'moderate' | 'weak';

      if (Math.abs(slope) > 0.5) strength = 'strong';
      else if (Math.abs(slope) > 0.3) strength = 'moderate';
      else strength = 'weak';

      trends.push({
        metric: formatMetricName(metric),
        direction,
        strength,
        startDate: timeSeries[timeSeries.length - 1].date,
        endDate: timeSeries[0].date,
        slope,
        significance,
        description: generateTrendDescription(metric, direction, strength, slope),
      });
    }
  });

  return trends;
}

/**
 * Detect cyclic patterns using autocorrelation
 */
function detectCycles(timeSeries: PatternDetectionData['timeSeries']): CyclicPattern[] {
  const cycles: CyclicPattern[] = [];

  if (timeSeries.length < 14) return cycles;

  const metrics = ['readiness', 'mood', 'stress', 'anxiety'] as const;

  metrics.forEach(metric => {
    const values = timeSeries.map(entry => entry[metric]);

    // Weekly cycle (lag 7)
    const weeklyAutocorr = calculateAutocorrelation(values, 7);
    if (Math.abs(weeklyAutocorr) > 0.4) {
      cycles.push({
        metric: formatMetricName(metric),
        period: 'weekly',
        strength: Math.abs(weeklyAutocorr),
        description: `${formatMetricName(metric)} shows ${weeklyAutocorr > 0 ? 'consistent' : 'alternating'} weekly pattern`,
        ...identifyPeakLowDays(timeSeries, metric),
      });
    }
  });

  return cycles;
}

/**
 * Detect correlations between metrics
 */
function detectCorrelations(timeSeries: PatternDetectionData['timeSeries']): CorrelationPattern[] {
  const correlations: CorrelationPattern[] = [];

  if (timeSeries.length < 10) return correlations;

  // Interesting metric pairs to analyze
  const pairs: Array<[keyof PatternDetectionData['timeSeries'][0], keyof PatternDetectionData['timeSeries'][0]]> = [
    ['sleep', 'readiness'],
    ['sleep', 'mood'],
    ['stress', 'readiness'],
    ['stress', 'mood'],
    ['anxiety', 'confidence'],
    ['confidence', 'readiness'],
    ['mood', 'readiness'],
  ];

  pairs.forEach(([metric1, metric2]) => {
    if (metric1 === 'date' || metric2 === 'date') return;

    const values1 = timeSeries.map(entry => entry[metric1] as number);
    const values2 = timeSeries.map(entry => entry[metric2] as number);

    const correlation = calculateCorrelation(values1, values2);

    // Only report moderate to strong correlations
    if (Math.abs(correlation) > 0.4) {
      let strength: 'strong' | 'moderate' | 'weak';
      if (Math.abs(correlation) > 0.7) strength = 'strong';
      else if (Math.abs(correlation) > 0.5) strength = 'moderate';
      else strength = 'weak';

      const direction = correlation > 0 ? 'positive' : 'negative';

      correlations.push({
        metric1: formatMetricName(metric1),
        metric2: formatMetricName(metric2),
        correlation,
        strength,
        direction,
        description: generateCorrelationDescription(metric1, metric2, correlation),
        insights: generateCorrelationInsights(metric1, metric2, correlation),
      });
    }
  });

  // Sort by absolute correlation strength
  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

/**
 * Analyze how events affect metrics
 */
function analyzeEventResponses(
  timeSeries: PatternDetectionData['timeSeries'],
  events: NonNullable<PatternDetectionData['events']>
): EventResponsePattern[] {
  const responses: EventResponsePattern[] = [];

  // Group events by type
  const eventsByType = new Map<string, typeof events>();
  events.forEach(event => {
    if (!eventsByType.has(event.type)) {
      eventsByType.set(event.type, []);
    }
    eventsByType.get(event.type)!.push(event);
  });

  // Analyze each event type
  eventsByType.forEach((eventList, eventType) => {
    if (eventList.length < 2) return; // Need at least 2 occurrences

    const impacts: Array<{ metric: string; change: number }> = [];
    let totalDuration = 0;

    // For each event, measure impact on metrics
    eventList.forEach(event => {
      const eventDate = new Date(event.date);
      const eventIdx = timeSeries.findIndex(e => e.date === event.date);
      if (eventIdx === -1) return;

      // Compare 3 days before vs 3 days after
      const before = timeSeries.slice(Math.max(0, eventIdx - 3), eventIdx);
      const after = timeSeries.slice(eventIdx + 1, Math.min(timeSeries.length, eventIdx + 4));

      if (before.length === 0 || after.length === 0) return;

      // Calculate impact on each metric
      const metrics = ['readiness', 'mood', 'stress', 'anxiety'] as const;
      metrics.forEach(metric => {
        const beforeAvg = before.reduce((sum, e) => sum + e[metric], 0) / before.length;
        const afterAvg = after.reduce((sum, e) => sum + e[metric], 0) / after.length;
        const change = ((afterAvg - beforeAvg) / beforeAvg) * 100;

        const existing = impacts.find(i => i.metric === formatMetricName(metric));
        if (existing) {
          existing.change = (existing.change + change) / 2; // Average
        } else {
          impacts.push({ metric: formatMetricName(metric), change });
        }
      });

      // Track duration (days until return to baseline)
      let daysToRecover = 0;
      const baselineReadiness = before.reduce((sum, e) => sum + e.readiness, 0) / before.length;
      for (let i = eventIdx + 1; i < Math.min(timeSeries.length, eventIdx + 14); i++) {
        if (Math.abs(timeSeries[i].readiness - baselineReadiness) < 5) {
          break;
        }
        daysToRecover++;
      }
      totalDuration += daysToRecover;
    });

    responses.push({
      eventType: eventType.charAt(0).toUpperCase() + eventType.slice(1),
      avgResponseDuration: Math.round(totalDuration / eventList.length),
      typicalImpact: impacts.filter(i => Math.abs(i.change) > 5), // Only significant impacts
      description: generateEventResponseDescription(eventType, impacts),
    });
  });

  return responses;
}

/**
 * Generate insights from detected patterns
 */
function generateInsights(
  anomalies: AnomalyDetection[],
  trends: TrendPattern[],
  cycles: CyclicPattern[],
  correlations: CorrelationPattern[],
  eventResponses: EventResponsePattern[]
): string[] {
  const insights: string[] = [];

  // Critical anomalies
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
  if (criticalAnomalies.length > 0) {
    insights.push(`⚠️ ${criticalAnomalies.length} critical anomalies detected requiring immediate attention`);
  }

  // Declining trends
  const decliningTrends = trends.filter(
    t => t.direction === 'decreasing' && ['Readiness', 'Mood', 'Confidence', 'Sleep'].includes(t.metric)
  );
  if (decliningTrends.length > 0) {
    insights.push(`📉 Declining trends in ${decliningTrends.map(t => t.metric).join(', ')} - monitor closely`);
  }

  // Increasing negative trends
  const increasingNegative = trends.filter(
    t => t.direction === 'increasing' && ['Stress', 'Anxiety'].includes(t.metric)
  );
  if (increasingNegative.length > 0) {
    insights.push(`📈 Rising ${increasingNegative.map(t => t.metric).join(' and ')} - intervention may be needed`);
  }

  // Strong correlations
  const strongCorrs = correlations.filter(c => c.strength === 'strong');
  if (strongCorrs.length > 0) {
    insights.push(`🔗 Strong relationships found: ${strongCorrs.map(c => `${c.metric1}-${c.metric2}`).join(', ')}`);
  }

  // Weekly patterns
  const weeklyCycles = cycles.filter(c => c.period === 'weekly');
  if (weeklyCycles.length > 0) {
    insights.push(`📅 Weekly patterns detected - consider adjusting schedules based on peak/low days`);
  }

  // Event impacts
  if (eventResponses.length > 0) {
    const highImpact = eventResponses.filter(e => e.avgResponseDuration > 5);
    if (highImpact.length > 0) {
      insights.push(`🎯 ${highImpact.map(e => e.eventType).join(', ')} events have extended impact (${highImpact[0].avgResponseDuration}+ days)`);
    }
  }

  // Sleep-performance correlation
  const sleepReadiness = correlations.find(c =>
    (c.metric1 === 'Sleep' && c.metric2 === 'Readiness') ||
    (c.metric1 === 'Readiness' && c.metric2 === 'Sleep')
  );
  if (sleepReadiness && sleepReadiness.strength === 'strong') {
    insights.push(`💤 Sleep is a strong predictor of readiness - prioritize sleep hygiene`);
  }

  return insights;
}

/**
 * Generate summary
 */
function generateSummary(
  anomalies: AnomalyDetection[],
  trends: TrendPattern[],
  cycles: CyclicPattern[],
  correlations: CorrelationPattern[]
): string {
  const parts: string[] = [];

  if (anomalies.length > 0) {
    parts.push(`${anomalies.length} anomalies`);
  }
  if (trends.length > 0) {
    parts.push(`${trends.length} significant trends`);
  }
  if (cycles.length > 0) {
    parts.push(`${cycles.length} cyclic patterns`);
  }
  if (correlations.length > 0) {
    parts.push(`${correlations.length} strong correlations`);
  }

  return parts.length > 0
    ? `Detected ${parts.join(', ')} in athlete data`
    : 'No significant patterns detected - data appears stable';
}

/**
 * Helper functions
 */

function formatMetricName(metric: string): string {
  return metric.charAt(0).toUpperCase() + metric.slice(1).replace('_', ' ');
}

function inferAnomalyCauses(
  metric: string,
  value: number,
  mean: number,
  entry: PatternDetectionData['timeSeries'][0]
): string[] {
  const causes: string[] = [];

  if (metric === 'stress' && value > mean) {
    causes.push('Possible exam period or academic pressure');
    causes.push('Competition anxiety');
    if (entry.sleep < 6) causes.push('Sleep deprivation contributing to stress');
  } else if (metric === 'readiness' && value < mean) {
    causes.push('Poor recovery from recent training');
    if (entry.sleep < 6.5) causes.push('Insufficient sleep');
    if (entry.stress > 7) causes.push('High stress levels impacting readiness');
  } else if (metric === 'mood' && value < mean) {
    causes.push('Personal or academic issues');
    causes.push('Performance disappointment');
    if (entry.sleep < 7) causes.push('Sleep affecting mood');
  }

  return causes.length > 0 ? causes : ['Isolated incident - monitor for recurrence'];
}

function generateTrendDescription(
  metric: string,
  direction: string,
  strength: string,
  slope: number
): string {
  const metricName = formatMetricName(metric);
  const change = Math.abs(slope * 30).toFixed(1); // Project over 30 days

  if (direction === 'decreasing' && ['readiness', 'mood', 'confidence', 'sleep'].includes(metric)) {
    return `${metricName} ${strength}ly declining (~${change} points/month) - ${strength === 'strong' ? 'requires attention' : 'monitor closely'}`;
  } else if (direction === 'increasing' && ['stress', 'anxiety'].includes(metric)) {
    return `${metricName} ${strength}ly increasing (~${change} points/month) - ${strength === 'strong' ? 'intervention needed' : 'watch for escalation'}`;
  } else if (direction === 'increasing') {
    return `${metricName} improving over time - positive trajectory`;
  } else {
    return `${metricName} trending ${direction}`;
  }
}

function generateCorrelationDescription(metric1: string, metric2: string, correlation: number): string {
  const m1 = formatMetricName(metric1);
  const m2 = formatMetricName(metric2);
  const strength = Math.abs(correlation) > 0.7 ? 'strongly' : 'moderately';

  if (correlation > 0) {
    return `${m1} and ${m2} are ${strength} positively correlated (r=${correlation.toFixed(2)})`;
  } else {
    return `${m1} and ${m2} are ${strength} negatively correlated (r=${correlation.toFixed(2)})`;
  }
}

function generateCorrelationInsights(metric1: string, metric2: string, correlation: number): string[] {
  const insights: string[] = [];

  if ((metric1 === 'sleep' || metric2 === 'sleep') && correlation > 0.5) {
    insights.push('Better sleep predicts better overall wellbeing');
    insights.push('Prioritize sleep as recovery tool');
  }

  if ((metric1 === 'stress' || metric2 === 'stress') && correlation < -0.5) {
    insights.push('Stress significantly impairs performance metrics');
    insights.push('Stress management interventions may improve outcomes');
  }

  if ((metric1 === 'confidence' && metric2 === 'readiness') || (metric1 === 'readiness' && metric2 === 'confidence')) {
    if (correlation > 0.6) {
      insights.push('Confidence and readiness move together');
      insights.push('Building confidence may improve readiness and vice versa');
    }
  }

  return insights;
}

function generateEventResponseDescription(eventType: string, impacts: Array<{ metric: string; change: number }>): string {
  const significant = impacts.filter(i => Math.abs(i.change) > 10);
  if (significant.length === 0) return `${eventType} events have minimal impact on metrics`;

  const negativeImpacts = significant.filter(i => i.change < 0);
  if (negativeImpacts.length > 0) {
    return `${eventType} events typically decrease ${negativeImpacts.map(i => i.metric).join(', ')} by ${Math.abs(Math.round(negativeImpacts[0].change))}%`;
  }

  return `${eventType} events affect multiple metrics`;
}

function identifyPeakLowDays(
  timeSeries: PatternDetectionData['timeSeries'],
  metric: keyof Omit<PatternDetectionData['timeSeries'][0], 'date'>
): { peakDays?: string[]; lowDays?: string[] } {
  // Group by day of week
  const byDayOfWeek = new Map<number, number[]>();

  timeSeries.forEach(entry => {
    const date = new Date(entry.date);
    const dayOfWeek = date.getDay(); // 0 = Sunday
    if (!byDayOfWeek.has(dayOfWeek)) {
      byDayOfWeek.set(dayOfWeek, []);
    }
    byDayOfWeek.get(dayOfWeek)!.push(entry[metric] as number);
  });

  // Calculate averages
  const dayAverages: Array<{ day: number; avg: number }> = [];
  byDayOfWeek.forEach((values, day) => {
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    dayAverages.push({ day, avg });
  });

  if (dayAverages.length < 3) return {};

  // Sort and identify peaks/lows
  const sorted = [...dayAverages].sort((a, b) => b.avg - a.avg);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    peakDays: sorted.slice(0, 2).map(d => dayNames[d.day]),
    lowDays: sorted.slice(-2).map(d => dayNames[d.day]),
  };
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

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

  return (n * sumXY - sumX * sumY) / denominator;
}

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

function calculateAutocorrelation(values: number[], lag: number): number {
  if (values.length < lag + 1) return 0;

  const n = values.length - lag;
  const x = values.slice(0, n);
  const y = values.slice(lag, lag + n);

  return calculateCorrelation(x, y);
}

/**
 * Simplified Mann-Kendall trend test
 * Returns approximate p-value (0-1, lower = more significant)
 */
function mannKendallTest(values: number[]): number {
  const n = values.length;
  let s = 0;

  // Calculate S statistic
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      if (values[j] > values[i]) s += 1;
      else if (values[j] < values[i]) s -= 1;
    }
  }

  // Calculate variance
  const varS = (n * (n - 1) * (2 * n + 5)) / 18;

  // Calculate Z statistic
  let z = 0;
  if (s > 0) z = (s - 1) / Math.sqrt(varS);
  else if (s < 0) z = (s + 1) / Math.sqrt(varS);

  // Approximate p-value from Z (two-tailed)
  // Simplified: use absolute Z value
  const absZ = Math.abs(z);
  if (absZ > 2.58) return 0.01; // Very significant
  if (absZ > 1.96) return 0.05; // Significant
  if (absZ > 1.64) return 0.10; // Marginally significant
  return 0.20; // Not significant
}
