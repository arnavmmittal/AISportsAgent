/**
 * AthleteContextService
 *
 * Provides real-time, enriched context for the AI agent by integrating:
 * - Current readiness (mood, sleep, stress)
 * - ML predictions (risk, slump detection)
 * - Athlete's personal model (baselines, effective interventions)
 * - Recent patterns and themes
 *
 * This enables proactive, personalized conversations where the agent
 * can anticipate needs rather than just react.
 */

import { prisma } from '@/lib/prisma';

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

export interface EnrichedAthleteContext {
  athleteId: string;
  athleteName: string;
  sport: string | null;

  // Real-time state
  readiness: ReadinessData;
  hasCheckedInToday: boolean;
  checkInStreak: number;

  // ML predictions (from MCP or calculated)
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

  // Timestamp
  generatedAt: Date;
}

class AthleteContextService {
  private mcpServerUrl: string;
  private mcpAvailable: boolean = true;

  constructor() {
    this.mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:8000';
  }

  /**
   * Get comprehensive enriched context for an athlete
   */
  async getEnrichedContext(athleteId: string): Promise<EnrichedAthleteContext> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

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
    ]);

    if (!athleteData) {
      throw new Error(`Athlete not found: ${athleteId}`);
    }

    // Calculate readiness from mood logs
    const readiness = this.calculateReadiness(recentMoodLogs, todayMoodLog, athleteModel);

    // Calculate streak
    const checkInStreak = this.calculateStreak(recentMoodLogs);

    // Get ML predictions (try MCP server first, fallback to local calculation)
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

    return {
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
      generatedAt: now,
    };
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
   * Get ML predictions from MCP server or calculate locally
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
    // Try MCP server first (if available and enabled)
    if (this.mcpAvailable && process.env.USE_MCP_SERVER === 'true') {
      try {
        const response = await fetch(`${this.mcpServerUrl}/api/predictions/athlete/${athleteId}?days=14`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.MCP_SERVICE_TOKEN}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(3000), // 3 second timeout
        });

        if (response.ok) {
          const data = await response.json();
          return this.normalizeMCPPrediction(data);
        }
      } catch (error) {
        console.warn('[AthleteContext] MCP prediction failed, using local calculation:', error);
        this.mcpAvailable = false;
        // Re-enable after 5 minutes
        setTimeout(() => { this.mcpAvailable = true; }, 5 * 60 * 1000);
      }
    }

    // Fallback: Local rule-based calculation
    return this.calculateLocalPrediction(moodLogs);
  }

  /**
   * Normalize MCP server prediction response
   */
  private normalizeMCPPrediction(data: Record<string, unknown>): MLPrediction {
    const prediction = data.prediction as Record<string, unknown> || {};
    const slump = data.slump_analysis as Record<string, unknown> || {};

    return {
      riskScore: (prediction.risk_score as number) || 50,
      riskLevel: (prediction.risk_level as MLPrediction['riskLevel']) || 'medium',
      confidence: (prediction.confidence as number) || 70,
      topFactors: ((prediction.factors as Array<Record<string, unknown>>) || []).map(f => ({
        factor: (f.feature as string) || 'unknown',
        impact: (f.impact as number) || 0,
        direction: ((f.direction as string) === 'increases' ? 'negative' : 'positive') as 'positive' | 'negative',
        description: (f.description as string) || '',
      })),
      slumpDetected: (slump.slump_detected as boolean) || false,
      slumpProbability: (slump.slump_probability as number) || 0,
      slumpIndicators: (slump.indicators as string[]) || [],
      recommendations: (prediction.recommendations as string[]) || [],
    };
  }

  /**
   * Local rule-based prediction when MCP unavailable
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

    return sections.join('\n\n');
  }
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
