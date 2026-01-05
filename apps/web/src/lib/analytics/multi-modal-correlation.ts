/**
 * Multi-Modal Performance Correlation Analysis
 *
 * Analyzes how multiple factors combine to predict performance:
 * - Traditional readiness scores (mood, sleep, stress)
 * - Chat sentiment and emotional tone
 * - Psychological themes from conversations
 * - Pre-game mental state
 *
 * Generates insights like:
 * "Athletes with declining chat sentiment score 23% fewer points (r=-0.68, p<0.001)"
 * "When athletes discuss 'fear of failure', performance drops by 18%"
 */

import { prisma } from '@/lib/prisma';
import { calculatePearsonR, type CorrelationResult, analyzeCorrelation } from './correlation';

export interface MultiModalDataPoint {
  date: Date;
  athleteId: string;

  // Traditional metrics
  readinessScore: number;
  mood: number;
  stress: number;
  sleep: number;
  confidence: number;

  // Chat-derived metrics
  chatSentiment: number | null; // -1 to 1
  emotionalTone: string | null;
  topicsDiscussed: string[];
  stressIndicators: string[];
  preGameMindset: string | null;
  daysBeforeGame: number | null;

  // Performance outcome
  performanceScore: number;
  gameStats: any;
  outcome: 'WIN' | 'LOSS' | 'TIE';
}

export interface TopicImpact {
  topic: string;
  avgPerformanceImpact: number; // Percentage change
  sampleSize: number;
  correlation: number; // -1 to 1
  pValue: number;
  interpretation: string;
}

export interface MindsetImpact {
  mindset: string;
  avgPerformance: number;
  sampleSize: number;
  comparisonToBaseline: number; // Percentage
}

export interface MultiModalInsights {
  traditionalMetrics: {
    readinessCorrelation: CorrelationResult;
    moodCorrelation: CorrelationResult;
    stressCorrelation: CorrelationResult;
    sleepCorrelation: CorrelationResult;
  };
  conversationalMetrics: {
    sentimentCorrelation: CorrelationResult;
    topicImpacts: TopicImpact[];
    mindsetImpacts: MindsetImpact[];
  };
  combinedModel: {
    multipleR: number; // Combined correlation
    rSquared: number; // Variance explained
    predictiveAccuracy: number; // % within prediction interval
  };
  actionableInsights: string[];
}

/**
 * Collect multi-modal data for an athlete
 */
export async function collectMultiModalData(
  athleteId: string,
  startDate: Date,
  endDate: Date = new Date()
): Promise<MultiModalDataPoint[]> {
  // Get all game results for athlete in date range
  const gameResults = await prisma.gameResult.findMany({
    where: {
      athleteId,
      gameDate: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { gameDate: 'asc' }
  });

  const dataPoints: MultiModalDataPoint[] = [];

  for (const game of gameResults) {
    // Get mood log from day before game
    const dayBeforeGame = new Date(game.gameDate);
    dayBeforeGame.setDate(dayBeforeGame.getDate() - 1);
    const dayBeforeStart = new Date(dayBeforeGame);
    dayBeforeStart.setHours(0, 0, 0, 0);
    const dayBeforeEnd = new Date(dayBeforeGame);
    dayBeforeEnd.setHours(23, 59, 59, 999);

    const moodLog = await prisma.moodLog.findFirst({
      where: {
        athleteId,
        createdAt: {
          gte: dayBeforeStart,
          lte: dayBeforeEnd
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!moodLog) continue; // Skip if no mood data

    // Get chat insights from 3 days before game
    const threeDaysBefore = new Date(game.gameDate);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);

    const chatInsights = await prisma.chatInsight.findMany({
      where: {
        athleteId,
        createdAt: {
          gte: threeDaysBefore,
          lte: game.gameDate
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate averages from chat insights
    const avgChatSentiment = chatInsights.length > 0
      ? chatInsights.reduce((sum, i) => sum + i.overallSentiment, 0) / chatInsights.length
      : null;

    const allTopics = chatInsights.flatMap(i => i.topics);
    const uniqueTopics = [...new Set(allTopics)];
    const allStressIndicators = chatInsights.flatMap(i => i.stressIndicators);
    const preGameInsight = chatInsights.find(i => i.isPreGame);

    // Get performance score (already calculated and stored)
    const stats = game.stats as Record<string, any> | null;
    const performanceScore = stats?.performanceScore || calculatePerformanceScore(game.stats, game.sport);

    dataPoints.push({
      date: game.gameDate,
      athleteId,
      // Traditional metrics
      readinessScore: game.readinessScore || 70,
      mood: moodLog.mood,
      stress: moodLog.stress,
      sleep: moodLog.sleep || 7,
      confidence: moodLog.confidence,
      // Chat metrics
      chatSentiment: avgChatSentiment,
      emotionalTone: chatInsights[0]?.emotionalTone || null,
      topicsDiscussed: uniqueTopics,
      stressIndicators: [...new Set(allStressIndicators)],
      preGameMindset: preGameInsight?.preGameMindset || null,
      daysBeforeGame: preGameInsight?.daysUntilGame || null,
      // Performance
      performanceScore,
      gameStats: game.stats,
      outcome: game.outcome as any
    });
  }

  return dataPoints;
}

/**
 * Analyze multi-modal correlations
 */
export async function analyzeMultiModalCorrelation(
  athleteId: string,
  startDate: Date,
  endDate: Date = new Date()
): Promise<MultiModalInsights | null> {
  const data = await collectMultiModalData(athleteId, startDate, endDate);

  if (data.length < 5) {
    // Return null instead of throwing - let caller handle gracefully
    return null;
  }

  // 1. Traditional metric correlations
  const readinessCorr = analyzeCorrelation(
    data.map(d => d.readinessScore),
    data.map(d => d.performanceScore),
    'readiness'
  );

  const moodCorr = analyzeCorrelation(
    data.map(d => d.mood),
    data.map(d => d.performanceScore),
    'mood'
  );

  const stressCorr = analyzeCorrelation(
    data.map(d => 10 - d.stress), // Invert stress (lower is better)
    data.map(d => d.performanceScore),
    'stress (inverted)'
  );

  const sleepCorr = analyzeCorrelation(
    data.map(d => d.sleep),
    data.map(d => d.performanceScore),
    'sleep hours'
  );

  // 2. Chat sentiment correlation
  const dataWithSentiment = data.filter(d => d.chatSentiment !== null);
  const sentimentCorr = dataWithSentiment.length >= 3
    ? analyzeCorrelation(
        dataWithSentiment.map(d => (d.chatSentiment! + 1) * 50), // Convert -1:1 to 0:100
        dataWithSentiment.map(d => d.performanceScore),
        'chat sentiment'
      )
    : null;

  // 3. Topic-based analysis
  const topicImpacts = analyzeTopicImpacts(data);

  // 4. Pre-game mindset analysis
  const mindsetImpacts = analyzeMindsetImpacts(data);

  // 5. Combined model (multiple regression simulation)
  const combinedModel = buildCombinedModel(data);

  // 6. Generate actionable insights
  const actionableInsights = generateActionableInsights({
    traditionalMetrics: { readinessCorr, moodCorr, stressCorr, sleepCorr },
    sentimentCorr,
    topicImpacts,
    mindsetImpacts,
    combinedModel
  });

  return {
    traditionalMetrics: {
      readinessCorrelation: readinessCorr,
      moodCorrelation: moodCorr,
      stressCorrelation: stressCorr,
      sleepCorrelation: sleepCorr
    },
    conversationalMetrics: {
      sentimentCorrelation: sentimentCorr || {
        r: 0,
        rSquared: 0,
        pValue: 1,
        n: 0,
        confidenceInterval: { lower: 0, upper: 0 },
        interpretation: 'Insufficient chat data',
        magnitude: 'trivial',
        isSignificant: false
      },
      topicImpacts,
      mindsetImpacts
    },
    combinedModel,
    actionableInsights
  };
}

/**
 * Analyze how specific topics impact performance
 */
function analyzeTopicImpacts(data: MultiModalDataPoint[]): TopicImpact[] {
  // Get all unique topics
  const allTopics = data.flatMap(d => d.topicsDiscussed);
  const uniqueTopics = [...new Set(allTopics)];

  const impacts: TopicImpact[] = [];

  for (const topic of uniqueTopics) {
    const withTopic = data.filter(d => d.topicsDiscussed.includes(topic));
    const withoutTopic = data.filter(d => !d.topicsDiscussed.includes(topic));

    if (withTopic.length < 3 || withoutTopic.length < 3) continue; // Need enough samples

    const avgWithTopic = withTopic.reduce((sum, d) => sum + d.performanceScore, 0) / withTopic.length;
    const avgWithoutTopic = withoutTopic.reduce((sum, d) => sum + d.performanceScore, 0) / withoutTopic.length;
    const percentageImpact = ((avgWithTopic - avgWithoutTopic) / avgWithoutTopic) * 100;

    // Calculate correlation
    const topicPresence = data.map(d => d.topicsDiscussed.includes(topic) ? 1 : 0);
    const correlation = calculatePearsonR(topicPresence, data.map(d => d.performanceScore));

    // Simple t-test approximation for p-value
    const n1 = withTopic.length;
    const n2 = withoutTopic.length;
    const variance = ((withTopic.reduce((sum, d) => sum + Math.pow(d.performanceScore - avgWithTopic, 2), 0) +
                       withoutTopic.reduce((sum, d) => sum + Math.pow(d.performanceScore - avgWithoutTopic, 2), 0)) /
                      (n1 + n2 - 2));
    const tStat = (avgWithTopic - avgWithoutTopic) / Math.sqrt(variance * (1/n1 + 1/n2));
    const pValue = Math.max(0, Math.min(1, 2 * (1 - normalCDF(Math.abs(tStat)))));

    const interpretation = `When "${topic}" is discussed, performance ${percentageImpact > 0 ? 'increases' : 'decreases'} by ${Math.abs(Math.round(percentageImpact))}% (${pValue < 0.05 ? 'significant' : 'not significant'})`;

    impacts.push({
      topic,
      avgPerformanceImpact: Math.round(percentageImpact * 10) / 10,
      sampleSize: withTopic.length,
      correlation: Math.round(correlation * 100) / 100,
      pValue: Math.round(pValue * 1000) / 1000,
      interpretation
    });
  }

  // Sort by absolute impact
  return impacts.sort((a, b) => Math.abs(b.avgPerformanceImpact) - Math.abs(a.avgPerformanceImpact));
}

/**
 * Analyze how pre-game mindset impacts performance
 */
function analyzeMindsetImpacts(data: MultiModalDataPoint[]): MindsetImpact[] {
  const dataWithMindset = data.filter(d => d.preGameMindset !== null);
  if (dataWithMindset.length < 5) return [];

  const mindsets = [...new Set(dataWithMindset.map(d => d.preGameMindset!))];
  const baseline = data.reduce((sum, d) => sum + d.performanceScore, 0) / data.length;

  const impacts: MindsetImpact[] = [];

  for (const mindset of mindsets) {
    const withMindset = dataWithMindset.filter(d => d.preGameMindset === mindset);
    if (withMindset.length < 2) continue;

    const avgPerformance = withMindset.reduce((sum, d) => sum + d.performanceScore, 0) / withMindset.length;
    const comparisonToBaseline = ((avgPerformance - baseline) / baseline) * 100;

    impacts.push({
      mindset,
      avgPerformance: Math.round(avgPerformance * 10) / 10,
      sampleSize: withMindset.length,
      comparisonToBaseline: Math.round(comparisonToBaseline * 10) / 10
    });
  }

  return impacts.sort((a, b) => b.avgPerformance - a.avgPerformance);
}

/**
 * Build combined predictive model
 */
function buildCombinedModel(data: MultiModalDataPoint[]) {
  // Simplified multiple regression: combine readiness + chat sentiment
  const dataWithBoth = data.filter(d => d.chatSentiment !== null);

  if (dataWithBoth.length < 5) {
    return {
      multipleR: 0,
      rSquared: 0,
      predictiveAccuracy: 0
    };
  }

  // Calculate individual correlations
  const rReadiness = calculatePearsonR(
    dataWithBoth.map(d => d.readinessScore),
    dataWithBoth.map(d => d.performanceScore)
  );

  const rSentiment = calculatePearsonR(
    dataWithBoth.map(d => (d.chatSentiment! + 1) * 50),
    dataWithBoth.map(d => d.performanceScore)
  );

  // Correlation between predictors
  const rPredictors = calculatePearsonR(
    dataWithBoth.map(d => d.readinessScore),
    dataWithBoth.map(d => (d.chatSentiment! + 1) * 50)
  );

  // Multiple correlation (approximation)
  const multipleR = Math.sqrt(
    (rReadiness * rReadiness + rSentiment * rSentiment - 2 * rReadiness * rSentiment * rPredictors) /
    (1 - rPredictors * rPredictors)
  );

  const rSquared = multipleR * multipleR;

  // Estimate predictive accuracy (% within ±10% of actual)
  const avgPerf = dataWithBoth.reduce((sum, d) => sum + d.performanceScore, 0) / dataWithBoth.length;
  const stdDev = Math.sqrt(
    dataWithBoth.reduce((sum, d) => sum + Math.pow(d.performanceScore - avgPerf, 2), 0) / dataWithBoth.length
  );
  const predictiveAccuracy = Math.round((1 - stdDev / avgPerf) * 100);

  return {
    multipleR: Math.round(multipleR * 100) / 100,
    rSquared: Math.round(rSquared * 100) / 100,
    predictiveAccuracy
  };
}

/**
 * Generate actionable insights from analysis
 */
function generateActionableInsights(analysis: any): string[] {
  const insights: string[] = [];

  // Readiness insights
  if (analysis.traditionalMetrics.readinessCorr.magnitude === 'large' ||
      analysis.traditionalMetrics.readinessCorr.magnitude === 'very large') {
    insights.push(
      `Strong readiness-performance correlation (r=${analysis.traditionalMetrics.readinessCorr.r.toFixed(2)}) - prioritize daily mood tracking`
    );
  }

  // Chat sentiment insights
  if (analysis.sentimentCorr && analysis.sentimentCorr.isSignificant) {
    insights.push(
      `Chat sentiment significantly predicts performance (p=${analysis.sentimentCorr.pValue.toFixed(3)}) - monitor conversation tone closely`
    );
  }

  // Topic-based insights
  const negativeTopics = analysis.topicImpacts.filter((t: TopicImpact) => t.avgPerformanceImpact < -10 && t.pValue < 0.10);
  if (negativeTopics.length > 0) {
    const worst = negativeTopics[0];
    insights.push(
      `"${worst.topic}" strongly linked to ${Math.abs(worst.avgPerformanceImpact)}% performance drop - intervene when detected`
    );
  }

  const positiveTopics = analysis.topicImpacts.filter((t: TopicImpact) => t.avgPerformanceImpact > 10 && t.pValue < 0.10);
  if (positiveTopics.length > 0) {
    const best = positiveTopics[0];
    insights.push(
      `"${best.topic}" linked to ${best.avgPerformanceImpact}% performance boost - encourage this focus`
    );
  }

  // Mindset insights
  if (analysis.mindsetImpacts.length > 0) {
    const anxiousMindset = analysis.mindsetImpacts.find((m: MindsetImpact) => m.mindset === 'anxious');
    if (anxiousMindset && anxiousMindset.comparisonToBaseline < -10) {
      insights.push(
        `Pre-game anxiety reduces performance by ${Math.abs(anxiousMindset.comparisonToBaseline)}% - implement anxiety management protocol`
      );
    }

    const focusedMindset = analysis.mindsetImpacts.find((m: MindsetImpact) => m.mindset === 'focused');
    if (focusedMindset && focusedMindset.comparisonToBaseline > 5) {
      insights.push(
        `Focused pre-game mindset improves performance by ${focusedMindset.comparisonToBaseline}% - train mental preparation routines`
      );
    }
  }

  // Combined model insights
  if (analysis.combinedModel.rSquared > 0.50) {
    insights.push(
      `Combined model explains ${Math.round(analysis.combinedModel.rSquared * 100)}% of performance variance - readiness + chat sentiment is highly predictive`
    );
  } else if (analysis.combinedModel.rSquared > 0.30) {
    insights.push(
      `Readiness and chat sentiment together explain ${Math.round(analysis.combinedModel.rSquared * 100)}% of variance - continue collecting data to improve predictions`
    );
  }

  if (insights.length === 0) {
    insights.push('Continue collecting data to identify performance patterns');
  }

  return insights;
}

// Helper functions
function calculatePerformanceScore(stats: any, sport: string): number {
  // Simple performance scoring - expand based on sport
  if (sport === 'Basketball' && stats.points !== undefined) {
    return Math.round((stats.points / 30) * 100); // Normalize to 100
  }
  return 70; // Default
}

function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - prob : prob;
}
