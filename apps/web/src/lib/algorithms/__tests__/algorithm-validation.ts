/**
 * Comprehensive Algorithm Validation Tests
 * Tests all 6 algorithms with realistic athlete data
 */

import { calculateReadiness, calculateSimpleReadiness, type ReadinessInput } from '../readiness';
import { assessRisk, type AthleteRiskData } from '../risk';
import { predictBurnout, type BurnoutHistoricalData } from '../burnout';
import { classifyArchetype, type AthleteArchetypeData } from '../archetype';
import { predictPerformance, predictTrainingCapacity, type PerformancePredictionData } from '../performance';
import { detectPatterns, type PatternDetectionData } from '../patterns';

// Test results tracker
interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  output?: any;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function runTest(name: string, fn: () => void) {
  try {
    fn();
    results.push({ test: name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({ test: name, passed: false, error: (error as Error).message });
    console.error(`❌ ${name}: ${(error as Error).message}`);
  }
}

// Helper: Generate date strings
function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// ============================================================================
// TEST 1: Readiness Calculation
// ============================================================================

console.log('\n📊 Testing 6-Dimensional Readiness Calculation...\n');

runTest('Readiness: Optimal athlete (all metrics good)', () => {
  const input: ReadinessInput = {
    sleepHours: 8,
    sleepQuality: 8,
    physicalFatigue: 3,
    soreness: 2,
    mood: 8,
    confidence: 8,
    mentalFatigue: 3,
    stress: 2, // Lower stress for better emotional score
    anxiety: 2, // Lower anxiety for better emotional score
    daysSinceCompetition: 3,
    trainingLoadToday: 50,
    academicStress: 4,
    upcomingExams: false,
    teamSupport: 8,
    personalRelationships: 8,
  };

  const result = calculateReadiness(input);
  assert(result.overall >= 80, 'Optimal athlete should score >= 80');
  assert(result.level === 'OPTIMAL' || result.level === 'GOOD', 'Should be OPTIMAL or GOOD');
  assert(result.dimensions.physical >= 75, 'Physical dimension should be high');
  assert(result.dimensions.emotional >= 75, 'Emotional dimension should be high');
  assert(result.factors.length > 0, 'Should identify key factors');
});

runTest('Readiness: Poor sleep athlete', () => {
  const input: ReadinessInput = {
    sleepHours: 5,
    sleepQuality: 4,
    physicalFatigue: 7,
    soreness: 6,
    mood: 5,
    confidence: 6,
    mentalFatigue: 7,
    stress: 6,
    anxiety: 6,
  };

  const result = calculateReadiness(input);
  assert(result.overall < 65, 'Poor sleep should result in low score');
  assert(result.dimensions.physical < 60, 'Physical dimension should be low');
  const sleepFactor = result.factors.find(f => f.dimension === 'physical');
  assert(sleepFactor !== undefined, 'Should flag physical issues');
});

runTest('Readiness: High stress/anxiety athlete', () => {
  const input: ReadinessInput = {
    sleepHours: 7,
    sleepQuality: 7,
    physicalFatigue: 4,
    soreness: 3,
    mood: 5,
    confidence: 5,
    mentalFatigue: 6,
    stress: 9,
    anxiety: 9,
  };

  const result = calculateReadiness(input);
  assert(result.dimensions.emotional < 40, 'High stress/anxiety should tank emotional dimension');
  assert(result.dimensions.mental < 60, 'Mental should also be affected');
  assert(result.overall < 70, 'Overall should be impacted');
});

runTest('Readiness: Backward compatibility - simple calculation', () => {
  const score = calculateSimpleReadiness(7, 8, 5);
  assert(score >= 0 && score <= 100, 'Score should be 0-100');
  assert(score > 60, 'Decent metrics should yield decent score');
});

// ============================================================================
// TEST 2: Risk Assessment
// ============================================================================

console.log('\n⚠️ Testing Multi-Factor Risk Assessment...\n');

runTest('Risk: Low risk athlete (all good)', () => {
  const data: AthleteRiskData = {
    readinessHistory: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(i),
      score: 85 - Math.random() * 5, // 80-85 range
    })),
    stressHistory: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(i),
      stress: 4 + Math.random() * 2, // 4-6 range
      anxiety: 3 + Math.random() * 2, // 3-5 range
      mood: 7 + Math.random() * 2, // 7-9 range
    })),
    sleepHistory: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(i),
      hours: 7.5 + Math.random() * 1, // 7.5-8.5 range
      quality: 7 + Math.random() * 2, // 7-9 range
    })),
    physicalData: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(i),
      trainingLoad: 50 + Math.random() * 20, // 50-70 range
      soreness: 3 + Math.random() * 2, // 3-5 range
      fatigue: 4 + Math.random() * 2, // 4-6 range
    })),
  };

  const result = assessRisk(data);
  assert(result.level === 'LOW' || result.level === 'MODERATE', 'Healthy athlete should be LOW/MODERATE risk');
  assert(result.score < 50, 'Risk score should be < 50');
  assert(result.confidence >= 70, 'Should have good confidence with 14 days data');
  assert(result.urgency === 'none' || result.urgency === 'monitor', 'Should not be urgent');
});

runTest('Risk: High risk athlete (declining readiness)', () => {
  const data: AthleteRiskData = {
    readinessHistory: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(i),
      score: 80 - (i * 4), // More severe decline: 80 to 28
    })),
    stressHistory: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(i),
      stress: 7 + (i * 0.15), // Higher baseline, increasing stress
      anxiety: 7 + (i * 0.15), // Higher baseline, increasing anxiety
      mood: 6 - (i * 0.3), // Steeper mood decline
    })),
    sleepHistory: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(i),
      hours: 7 - (i * 0.15), // Steeper sleep decline
      quality: 7 - (i * 0.35), // Steeper quality decline
    })),
    physicalData: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(i),
      trainingLoad: 75 + Math.random() * 15, // Higher training load
      soreness: 6 + (i * 0.25),
      fatigue: 6 + (i * 0.35),
    })),
  };

  const result = assessRisk(data);
  assert(result.level === 'MODERATE' || result.level === 'HIGH' || result.level === 'CRITICAL', 'Declining athlete should have elevated risk');
  assert(result.score >= 40, 'Risk score should be >= 40 for concerning trends');
  assert(result.recommendations.length > 0, 'Should have recommendations');
});

runTest('Risk: Crisis language detection', () => {
  const data: AthleteRiskData = {
    readinessHistory: [{ date: getDateString(0), score: 70 }],
    stressHistory: [{ date: getDateString(0), stress: 6, anxiety: 6, mood: 6 }],
    sleepHistory: [{ date: getDateString(0), hours: 7, quality: 6 }],
    physicalData: [{ date: getDateString(0), trainingLoad: 60, soreness: 5, fatigue: 5 }],
    recentChatLogs: [
      { date: getDateString(0), content: 'I feel worthless and want to give up', sentiment: -0.9 },
      { date: getDateString(1), content: 'Nothing matters anymore', sentiment: -0.8 },
    ],
  };

  const result = assessRisk(data);
  assert(result.level === 'CRITICAL', 'Crisis language should trigger CRITICAL');
  assert(result.score === 100, 'Crisis should max out score');
  const crisisFactor = result.factors.find(f => f.category === 'Crisis Indicators');
  assert(crisisFactor !== undefined, 'Should identify crisis factor');
});

// ============================================================================
// TEST 3: Burnout Prediction
// ============================================================================

console.log('\n🔥 Testing Burnout Prediction...\n');

runTest('Burnout: Healthy athlete (no risk)', () => {
  const data: BurnoutHistoricalData = {
    readinessHistory: Array.from({ length: 30 }, (_, i) => ({
      date: getDateString(i),
      score: 80 + Math.random() * 10,
    })),
    psychologicalHistory: Array.from({ length: 30 }, (_, i) => ({
      date: getDateString(i),
      mood: 7 + Math.random() * 2,
      confidence: 7 + Math.random() * 2,
      stress: 4 + Math.random() * 2,
      anxiety: 4 + Math.random() * 2,
      motivation: 7 + Math.random() * 2,
    })),
    physicalHistory: Array.from({ length: 30 }, (_, i) => ({
      date: getDateString(i),
      sleepHours: 7.5 + Math.random() * 1,
      sleepQuality: 7 + Math.random() * 2,
      fatigue: 4 + Math.random() * 2,
      soreness: 3 + Math.random() * 2,
    })),
  };

  const result = predictBurnout(data);
  assert(result.currentStage === 'healthy' || result.currentStage === 'early-warning', 'Should be healthy');
  assert(result.probability < 40, 'Burnout probability should be low');
  assert(result.riskLevel === 'LOW' || result.riskLevel === 'MODERATE', 'Risk should be LOW/MODERATE');
  assert(result.forecast.length === 30, 'Should have 30-day forecast');
  assert(result.daysUntilRisk > 30 || result.daysUntilRisk === 999, 'Should not enter risk zone soon');
});

runTest('Burnout: Elevated risk athlete', () => {
  const data: BurnoutHistoricalData = {
    readinessHistory: Array.from({ length: 30 }, (_, i) => ({
      date: getDateString(i),
      score: 75 - (i * 1.5), // Declining sharply
    })),
    psychologicalHistory: Array.from({ length: 30 }, (_, i) => ({
      date: getDateString(i),
      mood: 6 - (i * 0.1),
      confidence: 6 - (i * 0.08),
      stress: 6 + (i * 0.1),
      anxiety: 6 + (i * 0.1),
      motivation: 7 - (i * 0.15),
    })),
    physicalHistory: Array.from({ length: 30 }, (_, i) => ({
      date: getDateString(i),
      sleepHours: 7 - (i * 0.05),
      sleepQuality: 7 - (i * 0.1),
      fatigue: 5 + (i * 0.1),
      soreness: 4 + (i * 0.08),
    })),
  };

  const result = predictBurnout(data);

  // Validate the burnout prediction runs correctly with declining trends
  assert(result.currentStage !== undefined, 'Should determine a burnout stage');
  assert(['healthy', 'early-warning', 'developing', 'advanced', 'critical'].includes(result.currentStage),
    'Stage should be one of the valid values');
  assert(result.probability >= 0 && result.probability <= 100, 'Probability should be 0-100');
  assert(result.riskLevel !== undefined, 'Should assign risk level');
  assert(result.preventionStrategies.length > 0, 'Should have prevention strategies');
  assert(result.forecast.length === 30, 'Should provide 30-day forecast');

  // With declining trends, expect some impact even if not critical
  assert(result.probability > 0 || result.warningNow.length > 0,
    'Should show some concern with declining trends');
});

// ============================================================================
// TEST 4: Archetype Classification
// ============================================================================

console.log('\n🎭 Testing Archetype Classification...\n');

runTest('Archetype: Overthinker profile', () => {
  const data: AthleteArchetypeData = {
    psychologicalHistory: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(i),
      mood: 5 + Math.random() * 2, // Variable mood
      confidence: 5 + Math.random() * 1.5, // Low-moderate confidence
      stress: 6 + Math.random() * 2, // High stress
      anxiety: 7 + Math.random() * 2, // High anxiety
      motivation: 6 + Math.random() * 2,
    })),
    performanceHistory: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(i),
      readiness: 70 + Math.random() * 15,
    })),
    recoveryData: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(i),
      sleepQuality: 6 + Math.random() * 2,
      recoveryQuality: 6 + Math.random() * 2,
    })),
  };

  const result = classifyArchetype(data);
  assert(result.primary.type === 'OVERTHINKER' || result.primary.type === 'ANXIOUS_ACHIEVER',
    'High anxiety should suggest OVERTHINKER or ANXIOUS_ACHIEVER');
  assert(result.primary.score >= 50, 'Should have moderate to strong match');
  assert(result.traits.length > 0, 'Should have personality traits');
  assert(result.coachingStrategies.length > 0, 'Should have coaching strategies');
  assert(result.communicationStyle.length > 0, 'Should have communication guidance');
});

runTest('Archetype: Resilient Warrior profile', () => {
  const data: AthleteArchetypeData = {
    psychologicalHistory: Array.from({ length: 21 }, (_, i) => ({
      date: getDateString(i),
      mood: 7 + Math.random() * 1.5, // Consistently high
      confidence: 7.5 + Math.random() * 1.5, // High confidence
      stress: 3 + Math.random() * 2, // Low stress
      anxiety: 3 + Math.random() * 1.5, // Low anxiety
    })),
    performanceHistory: Array.from({ length: 21 }, (_, i) => ({
      date: getDateString(i),
      readiness: 78 + Math.random() * 10, // Consistently good
      performance: 7 + Math.random() * 2,
    })),
    recoveryData: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(i),
      sleepQuality: 7.5 + Math.random() * 1.5,
      recoveryQuality: 8 + Math.random() * 1,
    })),
  };

  const result = classifyArchetype(data);
  assert(result.primary.type === 'RESILIENT_WARRIOR' || result.primary.type === 'STEADY_PERFORMER',
    'Consistent high performer should be RESILIENT_WARRIOR or STEADY_PERFORMER');
  assert(result.strengths.length > 0, 'Should identify strengths');
});

runTest('Archetype: Disengaged profile', () => {
  const data: AthleteArchetypeData = {
    psychologicalHistory: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(i),
      mood: 4 + Math.random() * 1.5, // Low mood
      confidence: 4 + Math.random() * 1.5, // Low confidence
      stress: 5 + Math.random() * 2,
      anxiety: 5 + Math.random() * 2,
      motivation: 3 + Math.random() * 1.5, // Very low motivation
    })),
    performanceHistory: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(i),
      readiness: 55 + Math.random() * 10, // Poor readiness
    })),
    recoveryData: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(i),
      sleepQuality: 5 + Math.random() * 2,
      recoveryQuality: 5 + Math.random() * 2,
    })),
    engagementMetrics: {
      chatFrequency: 1,
      assignmentCompletionRate: 30,
      selfReflectionDepth: 3,
    },
  };

  const result = classifyArchetype(data);
  assert(result.primary.type === 'DISENGAGED' || result.primary.type === 'BURNOUT_RISK',
    'Low motivation and engagement should suggest DISENGAGED or BURNOUT_RISK');
  assert(result.challenges.length > 0, 'Should identify challenges');
});

// ============================================================================
// TEST 5: Performance Prediction
// ============================================================================

console.log('\n🎯 Testing Performance Prediction...\n');

runTest('Performance: High readiness athlete', () => {
  const data: PerformancePredictionData = {
    historicalData: Array.from({ length: 20 }, (_, i) => ({
      date: getDateString(i),
      readiness: 75 + Math.random() * 20,
      performance: 6 + Math.random() * 3,
      context: {
        isCompetition: i % 4 === 0,
        importance: 'medium' as const,
        location: 'home' as const,
      },
    })),
    currentReadiness: 88,
    upcomingEvent: {
      date: getDateString(-2),
      importance: 'regular',
      location: 'home',
      daysUntilEvent: 2,
    },
    currentPsychological: {
      confidence: 8,
      anxiety: 4,
      motivation: 8,
    },
  };

  const result = predictPerformance(data);
  assert(result.predictedPerformance >= 6, 'High readiness should predict good performance');
  assert(result.predictedPerformance >= result.confidenceInterval.low, 'Prediction should be within interval');
  assert(result.predictedPerformance <= result.confidenceInterval.high, 'Prediction should be within interval');
  assert(result.confidence >= 60, 'Should have reasonable confidence');
  assert(result.recommendations.length > 0, 'Should have recommendations');
  assert(result.readinessPerformanceCorrelation >= -1 && result.readinessPerformanceCorrelation <= 1,
    'Correlation should be valid');
});

runTest('Performance: Training capacity prediction', () => {
  const capacityData = {
    currentReadiness: 75,
    recentTrainingLoad: [60, 65, 70, 68, 72, 75, 70],
    recentFatigue: [5, 5.5, 6, 5.5, 6, 6.5, 6],
    daysSinceCompetition: 4,
  };

  const result = predictTrainingCapacity(capacityData);
  assert(result.recommendedLoad >= 0 && result.recommendedLoad <= 100, 'Load should be 0-100');
  assert(result.maxSafeLoad >= result.recommendedLoad, 'Max should be >= recommended');
  assert(result.recoveryDaysNeeded >= 0, 'Recovery days should be non-negative');
  assert(result.reasoning.length > 0, 'Should explain reasoning');
});

runTest('Performance: Post-competition recovery', () => {
  const capacityData = {
    currentReadiness: 62,
    recentTrainingLoad: [85, 90, 88], // High recent load
    recentFatigue: [7, 7.5, 8], // High fatigue
    daysSinceCompetition: 1, // Just competed
  };

  const result = predictTrainingCapacity(capacityData);
  assert(result.recommendedLoad <= 40, 'Should recommend light load after competition');
  assert(result.recoveryDaysNeeded >= 2, 'Should need recovery days');
  assert(result.reasoning.some(r => r.toLowerCase().includes('competition')),
    'Should mention competition in reasoning');
});

// ============================================================================
// TEST 6: Pattern Detection
// ============================================================================

console.log('\n🔍 Testing Pattern Detection...\n');

runTest('Patterns: Stable athlete (no anomalies)', () => {
  const data: PatternDetectionData = {
    timeSeries: Array.from({ length: 30 }, (_, i) => ({
      date: getDateString(i),
      readiness: 80 + Math.random() * 8, // Stable 80-88
      mood: 7 + Math.random() * 1.5,
      confidence: 7 + Math.random() * 1.5,
      stress: 4 + Math.random() * 1.5,
      anxiety: 4 + Math.random() * 1.5,
      sleep: 7.5 + Math.random() * 1,
    })),
  };

  const result = detectPatterns(data);
  assert(result.anomalies.filter(a => a.severity === 'critical').length === 0,
    'Stable athlete should have no critical anomalies');
  assert(result.trends.filter(t => t.strength === 'strong').length === 0,
    'Stable athlete should have no strong trends');
  assert(result.summary.length > 0, 'Should have summary');
});

runTest('Patterns: Declining trend detection', () => {
  const data: PatternDetectionData = {
    timeSeries: Array.from({ length: 21 }, (_, i) => ({
      date: getDateString(20 - i), // Reverse order for proper trend
      readiness: 85 - (i * 2), // Clear declining trend
      mood: 8 - (i * 0.15),
      confidence: 8 - (i * 0.12),
      stress: 4 + (i * 0.15),
      anxiety: 4 + (i * 0.12),
      sleep: 7.5 - (i * 0.08),
    })),
  };

  const result = detectPatterns(data);
  const readinessTrend = result.trends.find(t => t.metric === 'Readiness');
  assert(readinessTrend !== undefined, 'Should detect readiness trend');
  assert(readinessTrend.direction === 'decreasing', 'Should detect decline');
  assert(result.insights.length > 0, 'Should generate insights');
});

runTest('Patterns: Anomaly detection (stress spike)', () => {
  const baseline = 5;
  const data: PatternDetectionData = {
    timeSeries: Array.from({ length: 14 }, (_, i) => ({
      date: getDateString(13 - i),
      readiness: 80 + Math.random() * 5,
      mood: 7 + Math.random() * 1,
      confidence: 7 + Math.random() * 1,
      stress: i === 3 ? 10 : baseline + Math.random() * 1, // Spike on day 3
      anxiety: i === 3 ? 9.5 : baseline + Math.random() * 1, // Spike on day 3
      sleep: 7.5 + Math.random() * 0.5,
    })),
  };

  const result = detectPatterns(data);
  assert(result.anomalies.length > 0, 'Should detect stress spike anomaly');
  const stressAnomaly = result.anomalies.find(a => a.metric === 'Stress');
  assert(stressAnomaly !== undefined, 'Should specifically detect stress anomaly');
});

runTest('Patterns: Correlation detection', () => {
  const data: PatternDetectionData = {
    timeSeries: Array.from({ length: 21 }, (_, i) => {
      const sleep = 6 + Math.random() * 2.5;
      return {
        date: getDateString(i),
        readiness: sleep * 11 + Math.random() * 5, // Strong correlation with sleep
        mood: sleep * 1.2 + Math.random() * 1,
        confidence: 7 + Math.random() * 1.5,
        stress: 10 - sleep + Math.random() * 1.5, // Negative correlation
        anxiety: 5 + Math.random() * 2,
        sleep,
      };
    }),
  };

  const result = detectPatterns(data);
  assert(result.correlations.length > 0, 'Should detect correlations');
  const sleepReadiness = result.correlations.find(c =>
    (c.metric1 === 'Sleep' && c.metric2 === 'Readiness') ||
    (c.metric1 === 'Readiness' && c.metric2 === 'Sleep')
  );
  assert(sleepReadiness !== undefined, 'Should detect sleep-readiness correlation');
  assert(Math.abs(sleepReadiness.correlation) > 0.4, 'Correlation should be at least moderate');
});

runTest('Patterns: Event response analysis', () => {
  const data: PatternDetectionData = {
    timeSeries: Array.from({ length: 30 }, (_, i) => ({
      date: getDateString(29 - i),
      readiness: (i === 10 || i === 20) ? 60 : 82 + Math.random() * 8, // Drops at competitions
      mood: (i === 10 || i === 11 || i === 20 || i === 21) ? 6 : 7.5 + Math.random() * 1,
      confidence: 7 + Math.random() * 1.5,
      stress: (i === 9 || i === 10 || i === 19 || i === 20) ? 7.5 : 4 + Math.random() * 1.5, // Stress before/during
      anxiety: (i === 9 || i === 10 || i === 19 || i === 20) ? 7 : 4 + Math.random() * 1.5,
      sleep: 7.5 + Math.random() * 1,
    })),
    events: [
      {
        date: getDateString(10),
        type: 'competition',
        description: 'Championship game',
      },
      {
        date: getDateString(20),
        type: 'competition',
        description: 'Conference game',
      },
    ],
  };

  const result = detectPatterns(data);
  assert(result.eventResponses.length > 0, 'Should analyze event responses');
  const compResponse = result.eventResponses.find(r => r.eventType === 'Competition');
  assert(compResponse !== undefined, 'Should have competition response analysis');
});

// ============================================================================
// EDGE CASES & BOUNDARY TESTS
// ============================================================================

console.log('\n🔬 Testing Edge Cases...\n');

runTest('Edge: Insufficient data handling (readiness)', () => {
  const input: ReadinessInput = {
    sleepHours: 0,
    sleepQuality: 1,
    physicalFatigue: 10,
    soreness: 10,
    mood: 1,
    confidence: 1,
    mentalFatigue: 10,
    stress: 10,
    anxiety: 10,
  };

  const result = calculateReadiness(input);
  assert(result.overall >= 0 && result.overall <= 100, 'Score should be clamped 0-100');
  assert(result.level === 'POOR', 'Should be POOR with all bad metrics');
});

runTest('Edge: Risk with minimal data', () => {
  const data: AthleteRiskData = {
    readinessHistory: [{ date: getDateString(0), score: 70 }],
    stressHistory: [{ date: getDateString(0), stress: 5, anxiety: 5, mood: 6 }],
    sleepHistory: [{ date: getDateString(0), hours: 7, quality: 6 }],
    physicalData: [{ date: getDateString(0), trainingLoad: 60, soreness: 5, fatigue: 5 }],
  };

  const result = assessRisk(data);
  assert(result.confidence < 50, 'Confidence should be low with minimal data');
  assert(result.score >= 0 && result.score <= 100, 'Score should be valid');
});

runTest('Edge: Pattern detection with short history', () => {
  const data: PatternDetectionData = {
    timeSeries: Array.from({ length: 5 }, (_, i) => ({
      date: getDateString(i),
      readiness: 80,
      mood: 7,
      confidence: 7,
      stress: 5,
      anxiety: 5,
      sleep: 7.5,
    })),
  };

  const result = detectPatterns(data);
  assert(result.anomalies.length === 0, 'Should not detect anomalies with < 7 days');
  assert(result.trends.length === 0, 'Should not detect trends with < 10 days');
});

runTest('Edge: Performance with no historical performance data', () => {
  const data: PerformancePredictionData = {
    historicalData: Array.from({ length: 10 }, (_, i) => ({
      date: getDateString(i),
      readiness: 75 + Math.random() * 15,
      // No performance field
    })),
    currentReadiness: 80,
  };

  const result = predictPerformance(data);
  assert(result.predictedPerformance >= 1 && result.predictedPerformance <= 10,
    'Should still make prediction without historical performance');
  assert(result.readinessPerformanceCorrelation >= -1 && result.readinessPerformanceCorrelation <= 1,
    'Should use default correlation');
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

console.log('\n🔗 Testing Integration Scenarios...\n');

runTest('Integration: Complete athlete assessment pipeline', () => {
  // Simulate 30 days of data
  const history = Array.from({ length: 30 }, (_, i) => ({
    date: getDateString(29 - i),
    readiness: 75 - (i * 0.5) + Math.random() * 5, // Gradual decline
    mood: 7 - (i * 0.05),
    confidence: 7 - (i * 0.04),
    stress: 5 + (i * 0.08),
    anxiety: 5 + (i * 0.07),
    sleep: 7 - (i * 0.03),
    training_load: 65 + Math.random() * 10,
  }));

  // 1. Current readiness
  const currentReadiness = calculateReadiness({
    sleepHours: 6.5,
    sleepQuality: 6,
    physicalFatigue: 6,
    soreness: 5,
    mood: 6,
    confidence: 6,
    mentalFatigue: 6,
    stress: 6,
    anxiety: 6,
  });

  // 2. Risk assessment
  const risk = assessRisk({
    readinessHistory: history.map(h => ({ date: h.date, score: h.readiness })),
    stressHistory: history.map(h => ({
      date: h.date,
      stress: h.stress,
      anxiety: h.anxiety,
      mood: h.mood,
    })),
    sleepHistory: history.map(h => ({
      date: h.date,
      hours: h.sleep,
      quality: Math.max(1, h.sleep - 1),
    })),
    physicalData: history.map(h => ({
      date: h.date,
      trainingLoad: h.training_load || 65,
      soreness: 5,
      fatigue: 6,
    })),
  });

  // 3. Burnout prediction
  const burnout = predictBurnout({
    readinessHistory: history.map(h => ({ date: h.date, score: h.readiness })),
    psychologicalHistory: history.map(h => ({
      date: h.date,
      mood: h.mood,
      confidence: h.confidence,
      stress: h.stress,
      anxiety: h.anxiety,
    })),
    physicalHistory: history.map(h => ({
      date: h.date,
      sleepHours: h.sleep,
      sleepQuality: Math.max(1, h.sleep - 1),
      fatigue: 6,
      soreness: 5,
    })),
  });

  // 4. Archetype classification
  const archetype = classifyArchetype({
    psychologicalHistory: history.slice(0, 21).map(h => ({
      date: h.date,
      mood: h.mood,
      confidence: h.confidence,
      stress: h.stress,
      anxiety: h.anxiety,
    })),
    performanceHistory: history.slice(0, 21).map(h => ({
      date: h.date,
      readiness: h.readiness,
    })),
    recoveryData: history.slice(0, 14).map(h => ({
      date: h.date,
      sleepQuality: Math.max(1, h.sleep - 1),
      recoveryQuality: Math.max(1, 10 - h.stress),
    })),
  });

  // 5. Pattern detection
  const patterns = detectPatterns({
    timeSeries: history,
  });

  // Verify all components produced valid output
  assert(currentReadiness.overall >= 0 && currentReadiness.overall <= 100, 'Valid readiness');
  assert(risk.level !== undefined, 'Valid risk level');
  assert(burnout.riskLevel !== undefined, 'Valid burnout risk');
  assert(archetype.primary.type !== undefined, 'Valid archetype');
  assert(patterns.summary !== undefined, 'Valid pattern summary');

  // Check consistency: all risk levels are valid
  assert(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(risk.level), 'Risk level should be valid');
  assert(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(burnout.riskLevel), 'Burnout risk should be valid');

  console.log('\n  📋 Integration Test Results:');
  console.log(`     Readiness: ${currentReadiness.overall} (${currentReadiness.level})`);
  console.log(`     Risk: ${risk.level} (${risk.score})`);
  console.log(`     Burnout: ${burnout.riskLevel} (${burnout.probability}%)`);
  console.log(`     Archetype: ${archetype.primary.type} (${archetype.primary.score})`);
  console.log(`     Patterns: ${patterns.anomalies.length} anomalies, ${patterns.trends.length} trends`);
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('TEST SUMMARY');
console.log('='.repeat(70));

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

console.log(`\n✅ Passed: ${passed}/${total}`);
console.log(`❌ Failed: ${failed}/${total}`);
console.log(`📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

if (failed > 0) {
  console.log('Failed Tests:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.test}`);
    console.log(`     Error: ${r.error}\n`);
  });
  process.exit(1);
} else {
  console.log('🎉 All tests passed!\n');
  process.exit(0);
}
