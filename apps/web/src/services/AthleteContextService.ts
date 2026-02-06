/**
 * AthleteContextService
 *
 * Provides real-time, enriched context for the AI agent by integrating:
 * - Current readiness (mood, sleep, stress)
 * - ML predictions (risk, slump detection)
 * - Athlete's personal model (baselines, effective interventions)
 * - Recent patterns and themes
 * - 7-day readiness forecasting (NEW)
 * - 30-day burnout prediction (NEW)
 * - Pattern detection (anomalies, cycles, correlations) (NEW)
 *
 * This enables proactive, personalized conversations where the agent
 * can anticipate needs rather than just react.
 */

import { prisma } from '@/lib/prisma';
import { forecastReadinessTrend, type ReadinessForecast } from '@/lib/analytics/forecasting';
import { predictBurnout, type BurnoutPrediction, type BurnoutHistoricalData } from '@/lib/algorithms/burnout';
import { detectPatterns, type PatternDetectionResults, type PatternDetectionData } from '@/lib/algorithms/patterns';
import { generateComprehensiveInsights, type DeepInsight } from '@/lib/analytics/deep-insights';

// Types for the enriched context
export interface AthleteInsight {
  type: 'risk' | 'pattern' | 'recommendation' | 'milestone';
  priority: 'high' | 'medium' | 'low';
  message: string;
  data?: Record<string, unknown>;
}

export interface ReadinessData {
  score: number;
  level: 'optimal' | 'good' | 'moderate' | 'low' | 'concerning';
  dimensions: {
    mood: number;
    sleep: number;
    stress: number;
    energy: number;
    confidence: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  change: number;
  comparedToBaseline: {
    mood: number;
    stress: number;
    confidence: number;
  };
}

export interface MLPrediction {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  topFactors: Array<{
    factor: string;
    impact: number;
    direction: 'positive' | 'negative';
    description: string;
  }>;
  slumpDetected: boolean;
  slumpProbability: number;
  slumpIndicators: string[];
  recommendations: string[];
}

export interface EffectiveIntervention {
  type: string;
  protocol: string;
  averageEffectiveness: number;
  timesUsed: number;
  bestContext: string;
}

export interface AthleteProfile {
  baselines: {
    mood: number | null;
    confidence: number | null;
    stress: number | null;
    sleep: number | null;
    energy: number | null;
  };
  optimalState: {
    mood: number | null;
    confidence: number | null;
    stress: number | null;
  };
  effectiveInterventions: EffectiveIntervention[];
  recurringThemes: string[];
  recentTopics: string[];
  communicationStyle: string;
}

// NEW: Forecasting data for proactive agent
export interface ForecastData {
  trend: 'improving' | 'declining' | 'stable';
  next7Days: Array<{ date: string; score: number; confidence: 'high' | 'medium' | 'low' }>;
  riskFlags: string[];
  recommendations: string[];
  currentScore: number;
}

// NEW: Burnout prediction data
export interface BurnoutData {
  stage: 'healthy' | 'early-warning' | 'developing' | 'advanced' | 'critical';
  probability: number;
  daysUntilRisk: number;
  warningNow: Array<{ indicator: string; severity: string; description: string }>;
  preventionStrategies: string[];
}

// NEW: Pattern detection data
export interface PatternData {
  anomalies: Array<{ date: string; metric: string; severity: string; context: string }>;
  trends: Array<{ metric: string; direction: string; strength: string; description: string }>;
  cycles: Array<{ metric: string; period: string; peakDays?: string[]; lowDays?: string[] }>;
  correlations: Array<{ metric1: string; metric2: string; correlation: number; insights: string[] }>;
  summary: string;
}

// NEW: Technique → Performance correlations from deep insights
export interface TechniqueEffectiveness {
  technique: string;
  sportMetric?: string;
  improvement: string; // e.g., "+10.5 points" or "+18%"
  confidence: 'high' | 'medium';
  evidence: string;
  recommendation: string;
}

// NEW: Mood trend insights for agent context
export interface MoodTrendData {
  weeklyPattern?: { bestDay: string; worstDay: string; difference: number };
  sessionImpact?: { moodChange: number; direction: 'improves' | 'decreases' };
  recoveryTime?: { avgDays: number; resilience: 'high' | 'medium' | 'low' };
}

export interface EnrichedAthleteContext {
  athleteId: string;
  athleteName: string;
  sport: string | null;

  // Real-time state
  readiness: ReadinessData;
  hasCheckedInToday: boolean;
  checkInStreak: number;

  // ML predictions (rule-based calculation)
  prediction: MLPrediction | null;

  // Personal profile
  profile: AthleteProfile;

  // Proactive insights for the agent to use
  insights: AthleteInsight[];

  // Upcoming context
  hasGameSoon: boolean;
  daysUntilNextGame: number | null;

  // Session context
  lastSessionTopics: string[];
  daysSinceLastChat: number | null;

  // NEW: 7-day readiness forecast
  forecast: ForecastData | null;

  // NEW: 30-day burnout prediction
  burnout: BurnoutData | null;

  // NEW: Behavioral pattern detection
  patterns: PatternData | null;

  // NEW: Technique → performance correlations (what works for this athlete)
  techniqueEffectiveness: TechniqueEffectiveness[];

  // NEW: Mood trend insights
  moodTrends: MoodTrendData | null;

  // Timestamp
  generatedAt: Date;
}

class AthleteContextService {
  constructor() {
    // No external dependencies - all calculations done locally
  }

  /**
   * Get comprehensive enriched context for an athlete
   * @param athleteId - Athlete ID
   * @param options - Optional settings
   * @param options.forceRefresh - Bypass cache and fetch fresh data
   */
  async getEnrichedContext(
    athleteId: string,
    options?: { forceRefresh?: boolean }
  ): Promise<EnrichedAthleteContext> {
    // Check Redis cache first (unless force refresh requested)
    if (!options?.forceRefresh) {
      const cached = await getCachedContext(athleteId);
      if (cached) {
        return cached;
      }
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all data in parallel for performance
    const [
      athleteData,
      recentMoodLogs,
      todayMoodLog,
      athleteModel,
      recentInterventions,
      recentChatSessions,
      recentInsights,
      goals,
      // NEW: Additional data for ML algorithms
      readinessScores,
      extendedMoodLogs,
    ] = await Promise.all([
      // Athlete profile with user data
      prisma.athlete.findUnique({
        where: { userId: athleteId },
        include: { User: true },
      }),

      // Last 14 days of mood logs
      prisma.moodLog.findMany({
        where: {
          athleteId,
          createdAt: { gte: fourteenDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 28, // Up to 2 per day
      }),

      // Today's mood log
      prisma.moodLog.findFirst({
        where: {
          athleteId,
          createdAt: { gte: today },
        },
      }),

      // Athlete's personal model (baselines, effective interventions)
      prisma.athleteModel.findUnique({
        where: { athleteId },
      }),

      // Recent interventions with outcomes
      prisma.intervention.findMany({
        where: {
          athleteId,
          performedAt: { gte: sevenDaysAgo },
        },
        orderBy: { performedAt: 'desc' },
        take: 10,
      }),

      // Recent chat sessions for topics
      prisma.chatSession.findMany({
        where: { athleteId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          topic: true,
          focusArea: true,
          updatedAt: true,
        },
      }),

      // Recent chat insights for themes
      prisma.chatInsight.findMany({
        where: {
          athleteId,
          createdAt: { gte: fourteenDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          topics: true,
          dominantTheme: true,
          stressIndicators: true,
          copingStrategies: true,
        },
      }),

      // Active goals
      prisma.goal.findMany({
        where: {
          athleteId,
          status: 'IN_PROGRESS',
        },
        take: 5,
      }),

      // NEW: Readiness scores for forecasting (need 14+ days)
      prisma.readinessScore.findMany({
        where: {
          athleteId,
          calculatedAt: { gte: thirtyDaysAgo },
        },
        orderBy: { calculatedAt: 'asc' },
      }),

      // NEW: Extended mood logs for burnout/patterns (30 days)
      prisma.moodLog.findMany({
        where: {
          athleteId,
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 60, // Up to 2 per day for 30 days
      }),
    ]);

    if (!athleteData) {
      throw new Error(`Athlete not found: ${athleteId}`);
    }

    // Calculate readiness from mood logs
    const readiness = this.calculateReadiness(recentMoodLogs, todayMoodLog, athleteModel);

    // Calculate streak
    const checkInStreak = this.calculateStreak(recentMoodLogs);

    // Get ML predictions (local rule-based calculation)
    let prediction: MLPrediction | null = null;
    if (recentMoodLogs.length >= 3) {
      prediction = await this.getMLPredictions(athleteId, recentMoodLogs);
    }

    // Build athlete profile
    const profile = this.buildAthleteProfile(athleteModel, recentInterventions, recentInsights);

    // Generate proactive insights
    const insights = this.generateInsights(
      readiness,
      prediction,
      profile,
      checkInStreak,
      goals,
      recentChatSessions
    );

    // Calculate days until next game (simplified - would use calendar API in production)
    const { hasGameSoon, daysUntilNextGame } = this.checkUpcomingGame(now);

    // Days since last chat
    const daysSinceLastChat = recentChatSessions.length > 0
      ? Math.floor((now.getTime() - new Date(recentChatSessions[0].updatedAt).getTime()) / (24 * 60 * 60 * 1000))
      : null;

    // NEW: Get 7-day readiness forecast (requires 14+ days of data)
    const forecast = await this.getForecast(athleteId, readinessScores);

    // NEW: Get burnout prediction (requires sufficient mood log data)
    const burnout = await this.getBurnoutPrediction(extendedMoodLogs, readinessScores);

    // NEW: Get pattern detection (anomalies, trends, cycles, correlations)
    const patterns = this.getPatterns(extendedMoodLogs, readinessScores);

    // NEW: Get technique effectiveness and mood trends from deep insights engine
    const { techniqueEffectiveness, moodTrends } = await this.getDeepInsightsData(
      athleteId,
      athleteData.User.name,
      thirtyDaysAgo
    );

    const enrichedContext: EnrichedAthleteContext = {
      athleteId,
      athleteName: athleteData.User.name,
      sport: athleteData.sport,
      readiness,
      hasCheckedInToday: !!todayMoodLog,
      checkInStreak,
      prediction,
      profile,
      insights,
      hasGameSoon,
      daysUntilNextGame,
      lastSessionTopics: recentChatSessions
        .map(s => s.topic || s.focusArea)
        .filter((t): t is string => t !== null)
        .slice(0, 3),
      daysSinceLastChat,
      forecast,
      burnout,
      patterns,
      techniqueEffectiveness,
      moodTrends,
      generatedAt: now,
    };

    // Cache the result in Redis for subsequent requests
    await setCachedContext(athleteId, enrichedContext);

    return enrichedContext;
  }

  /**
   * Calculate real-time readiness from mood logs
   */
  private calculateReadiness(
    moodLogs: Array<{
      mood: number;
      confidence: number;
      stress: number;
      energy: number | null;
      sleep: number | null;
      createdAt: Date;
    }>,
    todayLog: typeof moodLogs[0] | null,
    athleteModel: { baselineMood: number | null; baselineConfidence: number | null; baselineStress: number | null } | null
  ): ReadinessData {
    if (moodLogs.length === 0) {
      return {
        score: 50,
        level: 'moderate',
        dimensions: { mood: 50, sleep: 50, stress: 50, energy: 50, confidence: 50 },
        trend: 'stable',
        change: 0,
        comparedToBaseline: { mood: 0, stress: 0, confidence: 0 },
      };
    }

    const latest = todayLog || moodLogs[0];

    // Normalize dimensions to 0-100
    const moodNorm = (latest.mood / 10) * 100;
    const sleepNorm = latest.sleep ? (latest.sleep / 10) * 100 : 50;
    const stressNorm = (latest.stress / 10) * 100;
    const energyNorm = latest.energy ? (latest.energy / 10) * 100 : 50;
    const confidenceNorm = (latest.confidence / 10) * 100;

    // Composite score (stress inverted - lower stress = higher readiness)
    const score = Math.round(
      moodNorm * 0.25 +
      sleepNorm * 0.20 +
      (100 - stressNorm) * 0.20 +
      energyNorm * 0.15 +
      confidenceNorm * 0.20
    );

    // Determine level
    let level: ReadinessData['level'];
    if (score >= 80) level = 'optimal';
    else if (score >= 65) level = 'good';
    else if (score >= 50) level = 'moderate';
    else if (score >= 35) level = 'low';
    else level = 'concerning';

    // Calculate trend from recent vs older logs
    let trend: ReadinessData['trend'] = 'stable';
    let change = 0;

    if (moodLogs.length >= 4) {
      const recentAvg = moodLogs.slice(0, 3).reduce((sum, log) => sum + log.mood, 0) / 3;
      const olderAvg = moodLogs.slice(3, 7).reduce((sum, log) => sum + log.mood, 0) /
                        Math.min(4, moodLogs.length - 3);

      if (moodLogs.length > 3) {
        const diff = recentAvg - olderAvg;
        change = Math.abs(Math.round(diff * 10));
        if (diff > 0.5) trend = 'improving';
        else if (diff < -0.5) trend = 'declining';
      }
    }

    // Compare to personal baselines
    const comparedToBaseline = {
      mood: athleteModel?.baselineMood ? Math.round((latest.mood - athleteModel.baselineMood) * 10) : 0,
      stress: athleteModel?.baselineStress ? Math.round((latest.stress - athleteModel.baselineStress) * 10) : 0,
      confidence: athleteModel?.baselineConfidence ? Math.round((latest.confidence - athleteModel.baselineConfidence) * 10) : 0,
    };

    return {
      score,
      level,
      dimensions: {
        mood: Math.round(moodNorm),
        sleep: Math.round(sleepNorm),
        stress: Math.round(100 - stressNorm), // Invert for display
        energy: Math.round(energyNorm),
        confidence: Math.round(confidenceNorm),
      },
      trend,
      change,
      comparedToBaseline,
    };
  }

  /**
   * Calculate check-in streak
   */
  private calculateStreak(moodLogs: Array<{ createdAt: Date }>): number {
    if (moodLogs.length === 0) return 0;

    let streak = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const logDates = new Set(
      moodLogs.map(log => {
        const d = new Date(log.createdAt);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;

      if (logDates.has(dateKey)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  }

  /**
   * Get ML predictions using local rule-based calculation
   */
  private async getMLPredictions(
    athleteId: string,
    moodLogs: Array<{
      mood: number;
      confidence: number;
      stress: number;
      energy: number | null;
      sleep: number | null;
      createdAt: Date;
    }>
  ): Promise<MLPrediction | null> {
    // Use local rule-based calculation
    return this.calculateLocalPrediction(moodLogs);
  }

  /**
   * Local rule-based prediction calculation
   */
  private calculateLocalPrediction(
    moodLogs: Array<{
      mood: number;
      confidence: number;
      stress: number;
      energy: number | null;
      sleep: number | null;
    }>
  ): MLPrediction {
    const recentLogs = moodLogs.slice(0, 7);

    // Calculate averages
    const avgMood = recentLogs.reduce((sum, l) => sum + l.mood, 0) / recentLogs.length;
    const avgStress = recentLogs.reduce((sum, l) => sum + l.stress, 0) / recentLogs.length;
    const avgConfidence = recentLogs.reduce((sum, l) => sum + l.confidence, 0) / recentLogs.length;
    const avgSleep = recentLogs.filter(l => l.sleep).length > 0
      ? recentLogs.filter(l => l.sleep).reduce((sum, l) => sum + (l.sleep || 0), 0) / recentLogs.filter(l => l.sleep).length
      : 5;

    // Simple risk calculation
    let riskScore = 50;
    const factors: MLPrediction['topFactors'] = [];

    // High stress increases risk
    if (avgStress > 7) {
      riskScore += 20;
      factors.push({
        factor: 'stress',
        impact: 0.2,
        direction: 'negative',
        description: `High average stress (${avgStress.toFixed(1)}/10)`,
      });
    }

    // Low mood increases risk
    if (avgMood < 5) {
      riskScore += 15;
      factors.push({
        factor: 'mood',
        impact: 0.15,
        direction: 'negative',
        description: `Low average mood (${avgMood.toFixed(1)}/10)`,
      });
    }

    // Low confidence increases risk
    if (avgConfidence < 5) {
      riskScore += 15;
      factors.push({
        factor: 'confidence',
        impact: 0.15,
        direction: 'negative',
        description: `Low confidence (${avgConfidence.toFixed(1)}/10)`,
      });
    }

    // Poor sleep increases risk
    if (avgSleep < 6) {
      riskScore += 10;
      factors.push({
        factor: 'sleep',
        impact: 0.1,
        direction: 'negative',
        description: `Poor sleep quality (${avgSleep.toFixed(1)}/10)`,
      });
    }

    // Clamp risk score
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Determine risk level
    let riskLevel: MLPrediction['riskLevel'];
    if (riskScore < 25) riskLevel = 'low';
    else if (riskScore < 50) riskLevel = 'medium';
    else if (riskScore < 75) riskLevel = 'high';
    else riskLevel = 'critical';

    // Simple slump detection (declining trend)
    const slumpDetected = moodLogs.length >= 5 &&
      moodLogs.slice(0, 3).every((log, i) => {
        if (i === 0) return true;
        return log.mood <= moodLogs[i - 1].mood;
      });

    const recommendations: string[] = [];
    if (avgStress > 7) recommendations.push('Consider stress management techniques like 4-7-8 breathing');
    if (avgSleep < 6) recommendations.push('Focus on sleep hygiene - aim for consistent bedtime');
    if (avgMood < 5) recommendations.push('Try a mood-boosting activity: exercise or social connection');
    if (avgConfidence < 5) recommendations.push('Review recent successes and practice visualization');

    return {
      riskScore,
      riskLevel,
      confidence: 70, // Lower confidence for rule-based
      topFactors: factors.slice(0, 3),
      slumpDetected,
      slumpProbability: slumpDetected ? 65 : 20,
      slumpIndicators: slumpDetected ? ['Declining mood trend', 'Consistent downward pattern'] : [],
      recommendations,
    };
  }

  /**
   * Build athlete's personal profile from historical data
   */
  private buildAthleteProfile(
    athleteModel: {
      baselineMood: number | null;
      baselineConfidence: number | null;
      baselineStress: number | null;
      baselineSleep: number | null;
      optimalMood: number | null;
      optimalConfidence: number | null;
      optimalStress: number | null;
      interventionProfile: unknown;
    } | null,
    interventions: Array<{
      type: string;
      protocol: string;
      context: string;
      effectivenessScore: number | null;
    }>,
    insights: Array<{
      topics: string[];
      dominantTheme: string | null;
      copingStrategies: string[];
    }>
  ): AthleteProfile {
    // Extract effective interventions
    const interventionStats = new Map<string, { total: number; count: number; contexts: string[] }>();

    for (const intervention of interventions) {
      if (intervention.effectivenessScore && intervention.effectivenessScore > 0) {
        const key = `${intervention.type}-${intervention.protocol}`;
        const existing = interventionStats.get(key) || { total: 0, count: 0, contexts: [] };
        existing.total += intervention.effectivenessScore;
        existing.count += 1;
        if (!existing.contexts.includes(intervention.context)) {
          existing.contexts.push(intervention.context);
        }
        interventionStats.set(key, existing);
      }
    }

    const effectiveInterventions: EffectiveIntervention[] = [];
    for (const [key, stats] of interventionStats) {
      const [type, protocol] = key.split('-');
      if (stats.count >= 2 && stats.total / stats.count > 0.5) {
        effectiveInterventions.push({
          type,
          protocol,
          averageEffectiveness: stats.total / stats.count,
          timesUsed: stats.count,
          bestContext: stats.contexts[0],
        });
      }
    }

    // Sort by effectiveness
    effectiveInterventions.sort((a, b) => b.averageEffectiveness - a.averageEffectiveness);

    // Extract recurring themes
    const themeCounts = new Map<string, number>();
    for (const insight of insights) {
      if (insight.dominantTheme) {
        themeCounts.set(insight.dominantTheme, (themeCounts.get(insight.dominantTheme) || 0) + 1);
      }
      for (const topic of insight.topics) {
        themeCounts.set(topic, (themeCounts.get(topic) || 0) + 1);
      }
    }

    const recurringThemes = [...themeCounts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([theme]) => theme)
      .slice(0, 5);

    // Recent topics
    const recentTopics = [...new Set(
      insights.flatMap(i => i.topics).slice(0, 5)
    )];

    return {
      baselines: {
        mood: athleteModel?.baselineMood || null,
        confidence: athleteModel?.baselineConfidence || null,
        stress: athleteModel?.baselineStress || null,
        sleep: athleteModel?.baselineSleep || null,
        energy: null,
      },
      optimalState: {
        mood: athleteModel?.optimalMood || null,
        confidence: athleteModel?.optimalConfidence || null,
        stress: athleteModel?.optimalStress || null,
      },
      effectiveInterventions: effectiveInterventions.slice(0, 5),
      recurringThemes,
      recentTopics,
      communicationStyle: 'supportive', // Would come from user settings
    };
  }

  /**
   * Generate proactive insights for the agent
   */
  private generateInsights(
    readiness: ReadinessData,
    prediction: MLPrediction | null,
    profile: AthleteProfile,
    streak: number,
    goals: Array<{ title: string; status: string }>,
    sessions: Array<{ updatedAt: Date }>
  ): AthleteInsight[] {
    const insights: AthleteInsight[] = [];

    // Critical: High risk prediction
    if (prediction?.riskLevel === 'critical' || prediction?.riskLevel === 'high') {
      insights.push({
        type: 'risk',
        priority: 'high',
        message: `Performance risk is ${prediction.riskLevel}. Key factors: ${prediction.topFactors.map(f => f.description).join(', ')}`,
        data: { riskScore: prediction.riskScore, factors: prediction.topFactors },
      });
    }

    // Slump detection
    if (prediction?.slumpDetected) {
      insights.push({
        type: 'pattern',
        priority: 'high',
        message: `Potential slump pattern detected (${prediction.slumpProbability}% probability). Indicators: ${prediction.slumpIndicators.join(', ')}`,
        data: { probability: prediction.slumpProbability, indicators: prediction.slumpIndicators },
      });
    }

    // Declining readiness
    if (readiness.trend === 'declining' && readiness.change > 10) {
      insights.push({
        type: 'pattern',
        priority: 'medium',
        message: `Readiness has declined ${readiness.change}% recently. Consider checking in about recent challenges.`,
        data: { change: readiness.change, currentLevel: readiness.level },
      });
    }

    // Below baseline alerts
    if (readiness.comparedToBaseline.mood < -20) {
      insights.push({
        type: 'pattern',
        priority: 'medium',
        message: `Mood is significantly below personal baseline. This athlete usually feels better - explore what's different.`,
        data: { deviation: readiness.comparedToBaseline.mood },
      });
    }

    if (readiness.comparedToBaseline.stress > 20) {
      insights.push({
        type: 'pattern',
        priority: 'medium',
        message: `Stress is elevated above personal baseline. Consider stress management interventions.`,
        data: { deviation: readiness.comparedToBaseline.stress },
      });
    }

    // Streak milestone
    if (streak >= 7 && streak % 7 === 0) {
      insights.push({
        type: 'milestone',
        priority: 'low',
        message: `Amazing ${streak}-day check-in streak! Acknowledge this consistency.`,
        data: { streak },
      });
    }

    // Effective intervention recommendation
    if (profile.effectiveInterventions.length > 0 && readiness.level !== 'optimal') {
      const topIntervention = profile.effectiveInterventions[0];
      insights.push({
        type: 'recommendation',
        priority: 'medium',
        message: `${topIntervention.protocol} has been effective for this athlete (${Math.round(topIntervention.averageEffectiveness * 100)}% effectiveness). Consider suggesting it.`,
        data: { intervention: topIntervention },
      });
    }

    // Goals context
    const activeGoals = goals.filter(g => g.status === 'IN_PROGRESS');
    if (activeGoals.length > 0) {
      insights.push({
        type: 'pattern',
        priority: 'low',
        message: `Working on ${activeGoals.length} active goal(s): ${activeGoals.map(g => g.title).join(', ')}`,
        data: { goals: activeGoals.map(g => g.title) },
      });
    }

    // Recurring themes
    if (profile.recurringThemes.length > 0) {
      insights.push({
        type: 'pattern',
        priority: 'low',
        message: `Recurring themes: ${profile.recurringThemes.join(', ')}. These may come up again.`,
        data: { themes: profile.recurringThemes },
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return insights.slice(0, 6); // Max 6 insights
  }

  /**
   * Check for upcoming game (simplified - would use calendar API in production)
   */
  private checkUpcomingGame(now: Date): { hasGameSoon: boolean; daysUntilNextGame: number | null } {
    // Simple heuristic: games typically on weekends
    const day = now.getDay();
    const daysUntilWeekend = day === 0 ? 6 : day === 6 ? 0 : 6 - day;

    return {
      hasGameSoon: daysUntilWeekend <= 2,
      daysUntilNextGame: daysUntilWeekend,
    };
  }

  /**
   * Get 7-day readiness forecast using double exponential smoothing
   * Requires at least 14 days of historical readiness scores
   */
  private async getForecast(
    athleteId: string,
    readinessScores: Array<{ score: number; calculatedAt: Date }>
  ): Promise<ForecastData | null> {
    // Need at least 14 data points for reliable forecasting
    if (readinessScores.length < 14) {
      return null;
    }

    try {
      const result: ReadinessForecast = await forecastReadinessTrend(athleteId, 30);

      return {
        trend: result.trend,
        next7Days: result.forecast.map(f => ({
          date: f.date,
          score: f.predictedScore,
          confidence: f.confidence,
        })),
        riskFlags: result.riskFlags,
        recommendations: result.recommendations,
        currentScore: result.currentScore,
      };
    } catch (error) {
      // Forecasting requires data - gracefully return null if insufficient
      console.warn('[AthleteContext] Forecasting failed:', error);
      return null;
    }
  }

  /**
   * Get 30-day burnout prediction using multi-factor analysis
   * Analyzes progressive decline, chronic stress, recovery capacity, emotional exhaustion
   */
  private async getBurnoutPrediction(
    moodLogs: Array<{
      mood: number;
      confidence: number;
      stress: number;
      energy: number | null;
      sleep: number | null;
      createdAt: Date;
    }>,
    readinessScores: Array<{ score: number; calculatedAt: Date }>
  ): Promise<BurnoutData | null> {
    // Need sufficient data for burnout prediction
    if (moodLogs.length < 7 || readinessScores.length < 7) {
      return null;
    }

    try {
      // Assemble burnout historical data from mood logs and readiness scores
      const burnoutData: BurnoutHistoricalData = {
        readinessHistory: readinessScores.map(s => ({
          date: s.calculatedAt.toISOString().split('T')[0],
          score: s.score,
        })),
        psychologicalHistory: moodLogs.map(log => ({
          date: log.createdAt.toISOString().split('T')[0],
          mood: log.mood,
          confidence: log.confidence,
          stress: log.stress,
          anxiety: log.stress, // Use stress as proxy for anxiety if not available
        })),
        physicalHistory: moodLogs
          .filter(log => log.sleep !== null)
          .map(log => ({
            date: log.createdAt.toISOString().split('T')[0],
            sleepHours: log.sleep || 7,
            sleepQuality: log.sleep || 5,
            fatigue: 10 - (log.energy || 5), // Invert energy to fatigue
            soreness: 5, // Default if not available
          })),
      };

      const result: BurnoutPrediction = predictBurnout(burnoutData);

      return {
        stage: result.currentStage,
        probability: result.probability,
        daysUntilRisk: result.daysUntilRisk,
        warningNow: result.warningNow.slice(0, 3).map(w => ({
          indicator: w.indicator,
          severity: w.severity,
          description: w.description,
        })),
        preventionStrategies: result.preventionStrategies.slice(0, 3),
      };
    } catch (error) {
      console.warn('[AthleteContext] Burnout prediction failed:', error);
      return null;
    }
  }

  /**
   * Detect behavioral patterns: anomalies, trends, cycles, correlations
   * Uses statistical methods (Z-score, Mann-Kendall, autocorrelation, Pearson)
   */
  private getPatterns(
    moodLogs: Array<{
      mood: number;
      confidence: number;
      stress: number;
      energy: number | null;
      sleep: number | null;
      createdAt: Date;
    }>,
    readinessScores: Array<{ score: number; calculatedAt: Date }>
  ): PatternData | null {
    // Need sufficient data for pattern detection
    if (moodLogs.length < 7) {
      return null;
    }

    try {
      // Assemble pattern detection data
      const patternData: PatternDetectionData = {
        timeSeries: moodLogs.map(log => ({
          date: log.createdAt.toISOString().split('T')[0],
          readiness: readinessScores.find(
            r => r.calculatedAt.toISOString().split('T')[0] === log.createdAt.toISOString().split('T')[0]
          )?.score || 70,
          mood: log.mood,
          confidence: log.confidence,
          stress: log.stress,
          anxiety: log.stress, // Use stress as proxy
          sleep: log.sleep || 7,
        })),
      };

      const result: PatternDetectionResults = detectPatterns(patternData);

      return {
        anomalies: result.anomalies.slice(0, 3).map(a => ({
          date: a.date,
          metric: a.metric,
          severity: a.severity,
          context: a.context,
        })),
        trends: result.trends.slice(0, 3).map(t => ({
          metric: t.metric,
          direction: t.direction,
          strength: t.strength,
          description: t.description,
        })),
        cycles: result.cycles.slice(0, 2).map(c => ({
          metric: c.metric,
          period: c.period,
          peakDays: c.peakDays,
          lowDays: c.lowDays,
        })),
        correlations: result.correlations.slice(0, 3).map(c => ({
          metric1: c.metric1,
          metric2: c.metric2,
          correlation: c.correlation,
          insights: c.insights,
        })),
        summary: result.summary,
      };
    } catch (error) {
      console.warn('[AthleteContext] Pattern detection failed:', error);
      return null;
    }
  }

  /**
   * Get technique effectiveness and mood trends from deep insights engine
   * Connects chat topics, interventions, and KB techniques to sport outcomes
   */
  private async getDeepInsightsData(
    athleteId: string,
    athleteName: string,
    startDate: Date
  ): Promise<{ techniqueEffectiveness: TechniqueEffectiveness[]; moodTrends: MoodTrendData | null }> {
    try {
      const deepInsights = await generateComprehensiveInsights(athleteId, athleteName, startDate);

      // Extract technique effectiveness from intervention_outcome and counter_intuitive insights
      const techniqueEffectiveness: TechniqueEffectiveness[] = deepInsights
        .filter(
          (insight) =>
            insight.type === 'intervention_outcome' ||
            (insight.type === 'counter_intuitive' && insight.interventionDetails)
        )
        .slice(0, 5) // Top 5 techniques
        .map((insight) => {
          const details = insight.interventionDetails;
          if (details) {
            const sign = details.improvement >= 0 ? '+' : '';
            return {
              technique: details.technique,
              sportMetric: details.sportMetric,
              improvement: `${sign}${details.improvement.toFixed(1)} ${details.metricUnit}`,
              confidence: insight.evidence.confidence >= 0.7 ? 'high' : 'medium',
              evidence: `Based on ${details.gamesWithTechnique} games with technique vs ${details.gamesWithout} without (p=${insight.evidence.statisticalNote.match(/p[=<][\d.]+/)?.[0] || '<0.1'})`,
              recommendation: insight.actionable,
            } as TechniqueEffectiveness;
          }

          // Fallback for counter_intuitive without detailed interventionDetails
          return {
            technique: insight.headline.split("'")[0] || 'Unknown technique',
            improvement: insight.evidence.statisticalNote.includes('%')
              ? insight.evidence.statisticalNote.match(/\d+%/)?.[0] || '+15%'
              : '+improvement',
            confidence: insight.evidence.confidence >= 0.7 ? 'high' : 'medium',
            evidence: insight.evidence.statisticalNote,
            recommendation: insight.actionable,
          } as TechniqueEffectiveness;
        });

      // Extract mood trends from temporal insights
      const moodTrendInsights = deepInsights.filter(
        (insight) =>
          insight.type === 'temporal' ||
          insight.headline.toLowerCase().includes('mood') ||
          insight.headline.toLowerCase().includes('weekly')
      );

      let moodTrends: MoodTrendData | null = null;
      if (moodTrendInsights.length > 0) {
        moodTrends = {};

        for (const insight of moodTrendInsights) {
          // Parse weekly pattern from headlines like "Mood is 2.1 points higher on Fridays vs Mondays"
          const weeklyMatch = insight.headline.match(
            /(\d+\.?\d*)\s*points?\s*higher\s*on\s*(\w+)s?\s*vs\s*(\w+)/i
          );
          if (weeklyMatch) {
            moodTrends.weeklyPattern = {
              bestDay: weeklyMatch[2],
              worstDay: weeklyMatch[3],
              difference: parseFloat(weeklyMatch[1]),
            };
          }

          // Parse session impact from headlines about chat improving/decreasing mood
          const sessionMatch = insight.headline.match(
            /mood\s*(improves?|increases?|decreases?|drops?)\s*(\d+\.?\d*)?/i
          );
          if (sessionMatch) {
            const direction = sessionMatch[1].toLowerCase().startsWith('i') ? 'improves' : 'decreases';
            moodTrends.sessionImpact = {
              moodChange: parseFloat(sessionMatch[2] || '1'),
              direction,
            };
          }

          // Parse recovery patterns
          const recoveryMatch = insight.headline.match(/recover[sy]?\s*in\s*(\d+\.?\d*)\s*days?/i);
          if (recoveryMatch) {
            const days = parseFloat(recoveryMatch[1]);
            moodTrends.recoveryTime = {
              avgDays: days,
              resilience: days <= 1 ? 'high' : days <= 3 ? 'medium' : 'low',
            };
          }
        }

        // If no patterns were extracted, return null
        if (Object.keys(moodTrends).length === 0) {
          moodTrends = null;
        }
      }

      return { techniqueEffectiveness, moodTrends };
    } catch (error) {
      console.warn('[AthleteContext] Deep insights extraction failed:', error);
      return { techniqueEffectiveness: [], moodTrends: null };
    }
  }

  /**
   * Generate a system prompt enhancement based on the enriched context
   */
  generatePromptEnhancement(context: EnrichedAthleteContext): string {
    const sections: string[] = [];

    // Athlete identity
    sections.push(`ATHLETE CONTEXT:
You are speaking with ${context.athleteName}, a ${context.sport || 'collegiate'} athlete.`);

    // Current state
    sections.push(`CURRENT STATE:
- Readiness: ${context.readiness.score}/100 (${context.readiness.level})
- Mood: ${context.readiness.dimensions.mood}% | Sleep: ${context.readiness.dimensions.sleep}% | Stress: ${100 - context.readiness.dimensions.stress}% (inverted - lower is worse) | Confidence: ${context.readiness.dimensions.confidence}%
- Trend: ${context.readiness.trend}${context.readiness.change > 5 ? ` (${context.readiness.change}% change)` : ''}
- Check-in streak: ${context.checkInStreak} days
- Today's check-in: ${context.hasCheckedInToday ? 'completed' : 'not yet'}`);

    // Proactive insights - the key differentiator
    if (context.insights.length > 0) {
      const highPriority = context.insights.filter(i => i.priority === 'high');
      const mediumPriority = context.insights.filter(i => i.priority === 'medium');

      if (highPriority.length > 0) {
        sections.push(`⚠️ PRIORITY ALERTS (address proactively):
${highPriority.map(i => `- ${i.message}`).join('\n')}`);
      }

      if (mediumPriority.length > 0) {
        sections.push(`INSIGHTS TO CONSIDER:
${mediumPriority.map(i => `- ${i.message}`).join('\n')}`);
      }
    }

    // ML predictions
    if (context.prediction) {
      if (context.prediction.riskLevel !== 'low') {
        sections.push(`PERFORMANCE PREDICTION:
- Risk Level: ${context.prediction.riskLevel.toUpperCase()} (${context.prediction.riskScore}%)
- Top Factors: ${context.prediction.topFactors.map(f => f.description).join('; ')}
- Recommended: ${context.prediction.recommendations.slice(0, 2).join('; ')}`);
      }

      if (context.prediction.slumpDetected) {
        sections.push(`🚨 SLUMP PATTERN DETECTED:
- Probability: ${context.prediction.slumpProbability}%
- Indicators: ${context.prediction.slumpIndicators.join(', ')}
- Approach with extra care and validation. Explore what's been happening.`);
      }
    }

    // Effective interventions
    if (context.profile.effectiveInterventions.length > 0) {
      const top = context.profile.effectiveInterventions[0];
      sections.push(`WHAT WORKS FOR THIS ATHLETE:
- Best intervention: ${top.protocol} (${Math.round(top.averageEffectiveness * 100)}% effective, used ${top.timesUsed}x)
- Best context: ${top.bestContext}
Consider suggesting this when appropriate.`);
    }

    // Upcoming context
    if (context.hasGameSoon && context.daysUntilNextGame !== null) {
      sections.push(`UPCOMING:
- Game in ${context.daysUntilNextGame} days. Tailor advice to pre-competition preparation.`);
    }

    // Previous conversation context
    if (context.lastSessionTopics.length > 0) {
      sections.push(`RECENT TOPICS:
Previously discussed: ${context.lastSessionTopics.join(', ')}`);
    }

    // Recurring themes
    if (context.profile.recurringThemes.length > 0) {
      sections.push(`RECURRING THEMES FOR THIS ATHLETE:
${context.profile.recurringThemes.join(', ')}`);
    }

    // NEW: Technique → Performance correlations (the most valuable insight type)
    if (context.techniqueEffectiveness.length > 0) {
      const techniqueLines = context.techniqueEffectiveness.map((t) => {
        if (t.sportMetric) {
          return `- ${t.technique} → ${t.improvement} ${t.sportMetric} (${t.confidence} confidence)`;
        }
        return `- ${t.technique} → ${t.improvement} improvement (${t.confidence} confidence)`;
      });

      sections.push(`🎯 PROVEN TECHNIQUES FOR THIS ATHLETE:
${techniqueLines.join('\n')}

Use this data proactively! Example: "Last time you used visualization before a game, you scored 10 more points. Want to try that technique for your upcoming game?"`);
    }

    // NEW: Mood trend patterns for personalized timing
    if (context.moodTrends) {
      const trendLines: string[] = [];

      if (context.moodTrends.weeklyPattern) {
        const p = context.moodTrends.weeklyPattern;
        trendLines.push(`- Best mood on ${p.bestDay}s, lowest on ${p.worstDay}s (${p.difference.toFixed(1)} point difference)`);
      }

      if (context.moodTrends.sessionImpact) {
        const s = context.moodTrends.sessionImpact;
        trendLines.push(`- Chat sessions ${s.direction === 'improves' ? 'improve' : 'decrease'} mood by ${s.moodChange.toFixed(1)} points`);
      }

      if (context.moodTrends.recoveryTime) {
        const r = context.moodTrends.recoveryTime;
        trendLines.push(`- Recovery from setbacks: ${r.avgDays.toFixed(1)} days (${r.resilience} resilience)`);
      }

      if (trendLines.length > 0) {
        sections.push(`📊 MOOD PATTERNS:
${trendLines.join('\n')}`);
      }
    }

    return sections.join('\n\n');
  }
}

// =============================================
// Context Caching Layer (Redis-backed)
// =============================================

import { kvGet, kvSet, kvDelete } from '@/lib/redis';

const CONTEXT_CACHE_TTL_SECONDS = 5 * 60; // 5 minutes
const CONTEXT_CACHE_PREFIX = 'athlete:context:';

/**
 * Get cached context or null if expired/missing
 */
async function getCachedContext(athleteId: string): Promise<EnrichedAthleteContext | null> {
  try {
    const cached = await kvGet<EnrichedAthleteContext>(`${CONTEXT_CACHE_PREFIX}${athleteId}`);
    if (cached) {
      // Restore Date object (JSON serialization converts to string)
      cached.generatedAt = new Date(cached.generatedAt);
    }
    return cached;
  } catch (error) {
    console.warn('[AthleteContext] Cache get error:', error);
    return null;
  }
}

/**
 * Cache context with TTL
 */
async function setCachedContext(athleteId: string, context: EnrichedAthleteContext): Promise<void> {
  try {
    await kvSet(`${CONTEXT_CACHE_PREFIX}${athleteId}`, context, CONTEXT_CACHE_TTL_SECONDS);
  } catch (error) {
    console.warn('[AthleteContext] Cache set error:', error);
  }
}

/**
 * Invalidate cached context for an athlete
 * Call this when mood log is submitted, goals updated, etc.
 */
export async function invalidateAthleteContextCache(athleteId: string): Promise<void> {
  try {
    await kvDelete(`${CONTEXT_CACHE_PREFIX}${athleteId}`);
  } catch (error) {
    console.warn('[AthleteContext] Cache invalidate error:', error);
  }
}

/**
 * Clear entire context cache
 * Note: Caches expire naturally after 5 minutes
 */
export async function clearAthleteContextCache(): Promise<void> {
  console.warn('[AthleteContext] clearAthleteContextCache called - caches will expire naturally');
}

// Export singleton instance
let serviceInstance: AthleteContextService | null = null;

export function getAthleteContextService(): AthleteContextService {
  if (!serviceInstance) {
    serviceInstance = new AthleteContextService();
  }
  return serviceInstance;
}

export { AthleteContextService };
