/**
 * Analytics Tools for LangGraph
 *
 * These tools expose the ML algorithms and analytics to the AI agent.
 * Uses correct interfaces from the underlying algorithm implementations.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Import algorithm functions
import { forecastReadinessTrend } from '@/lib/analytics/forecasting';
import { predictBurnout, type BurnoutHistoricalData } from '@/lib/algorithms/burnout';
import { assessRisk, type AthleteRiskData } from '@/lib/algorithms/risk';
import { detectPatterns, type PatternDetectionData } from '@/lib/algorithms/patterns';
import { calculateEnhancedReadiness, type EnhancedReadinessBreakdown } from '@/lib/analytics/enhanced-readiness';
import { analyzeMultiModalCorrelation } from '@/lib/analytics/multi-modal-correlation';

// ============================================================================
// TIER 1 TOOLS - Core predictive capabilities
// ============================================================================

/**
 * Forecast readiness trend for next 7 days
 */
export const forecastReadinessTrendTool = tool(
  async ({ athleteId, days }) => {
    try {
      const forecast = await forecastReadinessTrend(athleteId, days);

      return {
        success: true,
        hasData: true,
        trend: forecast.trend,
        currentScore: forecast.currentScore,
        predictions: forecast.forecast.slice(0, 7).map(p => ({
          date: p.date,
          score: Math.round(p.predictedScore),
          confidence: p.confidence,
        })),
        riskFlags: forecast.riskFlags,
        recommendations: forecast.recommendations,
        methodology: 'Double Exponential Smoothing (Holt\'s method)',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Insufficient') || errorMessage.includes('data')) {
        return {
          success: true,
          hasData: false,
          message: 'Insufficient data for forecasting. Need 14+ days of readiness scores.',
        };
      }
      console.error('[ANALYTICS_TOOL] forecastReadinessTrend error:', error);
      return { success: false, error: 'Failed to generate readiness forecast' };
    }
  },
  {
    name: 'forecast_readiness_trend',
    description: 'Predict athlete readiness for next 7 days. Use when discussing future performance or planning recovery.',
    schema: z.object({
      athleteId: z.string().describe('The athlete user ID'),
      days: z.number().min(7).max(60).default(30).describe('Days of historical data to use'),
    }),
  }
);

/**
 * Predict burnout risk
 */
export const predictBurnoutRiskTool = tool(
  async ({ athleteId }) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [readinessScores, moodLogs] = await Promise.all([
        prisma.readinessScore.findMany({
          where: { athleteId, calculatedAt: { gte: thirtyDaysAgo } },
          orderBy: { calculatedAt: 'asc' },
        }),
        prisma.moodLog.findMany({
          where: { athleteId, createdAt: { gte: thirtyDaysAgo } },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      if (moodLogs.length < 7) {
        return {
          success: true,
          hasData: false,
          message: `Insufficient data. Need 7+ days of mood logs, have ${moodLogs.length}.`,
        };
      }

      const historicalData: BurnoutHistoricalData = {
        readinessHistory: readinessScores.map(r => ({
          date: r.calculatedAt.toISOString().split('T')[0],
          score: r.score,
        })),
        psychologicalHistory: moodLogs.map(m => ({
          date: m.createdAt.toISOString().split('T')[0],
          mood: m.mood,
          stress: m.stress,
          confidence: m.confidence,
          anxiety: Math.round(m.stress * 0.8), // Approximate anxiety from stress
        })),
        physicalHistory: moodLogs.filter(m => m.energy && m.sleep).map(m => ({
          date: m.createdAt.toISOString().split('T')[0],
          sleepHours: (m.sleep ?? 5) * 0.9, // Convert 1-10 to ~4-9 hours
          sleepQuality: m.sleep ?? 5,
          fatigue: 10 - (m.energy ?? 5), // Invert energy to fatigue
          soreness: 3, // Default moderate soreness
        })),
      };

      const prediction = predictBurnout(historicalData);

      return {
        success: true,
        hasData: true,
        stage: prediction.currentStage,
        probability: Math.round(prediction.probability),
        daysUntilRisk: prediction.daysUntilRisk,
        riskLevel: prediction.riskLevel,
        currentWarnings: prediction.warningNow.slice(0, 3).map(w => ({
          indicator: w.indicator,
          severity: w.severity,
          description: w.description,
        })),
        preventionStrategies: prediction.preventionStrategies,
        interpretation: `${prediction.currentStage} stage with ${prediction.probability}% probability.`,
      };
    } catch (error) {
      console.error('[ANALYTICS_TOOL] predictBurnoutRisk error:', error);
      return { success: false, error: 'Failed to predict burnout risk' };
    }
  },
  {
    name: 'predict_burnout_risk',
    description: 'Assess 30-day burnout risk. Use when athlete shows fatigue or declining motivation.',
    schema: z.object({
      athleteId: z.string().describe('The athlete user ID'),
    }),
  }
);

/**
 * Wellbeing risk assessment
 */
export const assessWellbeingRiskTool = tool(
  async ({ athleteId }) => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [moodLogs, readinessScores] = await Promise.all([
        prisma.moodLog.findMany({
          where: { athleteId, createdAt: { gte: sevenDaysAgo } },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.readinessScore.findMany({
          where: { athleteId, calculatedAt: { gte: sevenDaysAgo } },
          orderBy: { calculatedAt: 'desc' },
        }),
      ]);

      if (moodLogs.length === 0) {
        return {
          success: true,
          hasData: false,
          message: 'No recent mood logs. Cannot assess wellbeing risk.',
        };
      }

      const riskData: AthleteRiskData = {
        readinessHistory: readinessScores.map(r => ({
          date: r.calculatedAt.toISOString().split('T')[0],
          score: r.score,
        })),
        stressHistory: moodLogs.map(m => ({
          date: m.createdAt.toISOString().split('T')[0],
          stress: m.stress,
          anxiety: Math.round(m.stress * 0.8),
          mood: m.mood,
        })),
        sleepHistory: moodLogs.filter(m => m.sleep).map(m => ({
          date: m.createdAt.toISOString().split('T')[0],
          hours: (m.sleep ?? 5) * 0.9,
          quality: m.sleep ?? 5,
        })),
        // Derive physical data from energy/stress levels in mood logs
        physicalData: moodLogs.map(m => ({
          date: m.createdAt.toISOString().split('T')[0],
          trainingLoad: 50, // Default moderate load (no actual training data available)
          soreness: 5, // Default moderate soreness
          fatigue: 10 - (m.energy ?? 5), // Invert energy to fatigue (low energy = high fatigue)
        })),
      };

      const assessment = assessRisk(riskData);

      return {
        success: true,
        hasData: true,
        riskLevel: assessment.level,
        score: assessment.score,
        confidence: assessment.confidence,
        factors: assessment.factors.slice(0, 5).map(f => ({
          category: f.category,
          severity: f.severity,
          description: f.description,
        })),
        recommendations: assessment.recommendations,
        urgency: assessment.urgency,
        interpretation: `${assessment.level} risk (${assessment.score}/100). Urgency: ${assessment.urgency}.`,
      };
    } catch (error) {
      console.error('[ANALYTICS_TOOL] assessWellbeingRisk error:', error);
      return { success: false, error: 'Failed to assess wellbeing risk' };
    }
  },
  {
    name: 'assess_wellbeing_risk',
    description: 'Comprehensive wellbeing risk assessment. Use when concerned about athlete mental state.',
    schema: z.object({
      athleteId: z.string().describe('The athlete user ID'),
    }),
  }
);

// ============================================================================
// TIER 2 TOOLS - Advanced analytics
// ============================================================================

/**
 * Detect behavioral patterns
 */
export const detectBehavioralPatternsTool = tool(
  async ({ athleteId }) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [moodLogs, readinessScores] = await Promise.all([
        prisma.moodLog.findMany({
          where: { athleteId, createdAt: { gte: thirtyDaysAgo } },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.readinessScore.findMany({
          where: { athleteId, calculatedAt: { gte: thirtyDaysAgo } },
          orderBy: { calculatedAt: 'asc' },
        }),
      ]);

      if (moodLogs.length < 7) {
        return {
          success: true,
          hasData: false,
          message: `Insufficient data. Need 7+ days, have ${moodLogs.length}.`,
        };
      }

      // Build a readiness map by date for quick lookup
      const readinessMap = new Map(
        readinessScores.map(r => [r.calculatedAt.toISOString().split('T')[0], r.score])
      );

      const patternData: PatternDetectionData = {
        timeSeries: moodLogs.map(m => {
          const dateStr = m.createdAt.toISOString().split('T')[0];
          return {
            date: dateStr,
            readiness: readinessMap.get(dateStr) ?? 50,
            mood: m.mood,
            confidence: m.confidence,
            stress: m.stress,
            anxiety: Math.round(m.stress * 0.8),
            sleep: m.sleep ?? 5,
          };
        }),
      };

      const patterns = detectPatterns(patternData);

      return {
        success: true,
        hasData: true,
        anomalies: patterns.anomalies.slice(0, 3).map(a => ({
          date: a.date,
          metric: a.metric,
          severity: a.severity,
          context: a.context,
        })),
        trends: patterns.trends.slice(0, 3).map(t => ({
          metric: t.metric,
          direction: t.direction,
          strength: t.strength,
          description: t.description,
        })),
        cycles: patterns.cycles.slice(0, 2).map(c => ({
          metric: c.metric,
          period: c.period,
          peakDays: c.peakDays,
          lowDays: c.lowDays,
        })),
        summary: patterns.summary,
        insights: patterns.insights,
      };
    } catch (error) {
      console.error('[ANALYTICS_TOOL] detectBehavioralPatterns error:', error);
      return { success: false, error: 'Failed to detect behavioral patterns' };
    }
  },
  {
    name: 'detect_behavioral_patterns',
    description: 'Detect anomalies, trends, and weekly cycles. Use when investigating behavior changes.',
    schema: z.object({
      athleteId: z.string().describe('The athlete user ID'),
    }),
  }
);

/**
 * Get enhanced readiness score
 */
export const getEnhancedReadinessTool = tool(
  async ({ athleteId }) => {
    try {
      const latestMoodLog = await prisma.moodLog.findFirst({
        where: { athleteId },
        orderBy: { createdAt: 'desc' },
      });

      if (!latestMoodLog) {
        return {
          success: true,
          hasData: false,
          message: 'No mood logs found. Cannot calculate enhanced readiness.',
        };
      }

      const athlete = await prisma.athlete.findUnique({
        where: { userId: athleteId },
        select: { sport: true },
      });

      const moodLogData = {
        mood: latestMoodLog.mood,
        stress: latestMoodLog.stress,
        confidence: latestMoodLog.confidence,
        energy: latestMoodLog.energy ?? undefined,
        sleep: latestMoodLog.sleep ?? undefined,
        createdAt: latestMoodLog.createdAt,
      };

      const enhanced: EnhancedReadinessBreakdown = await calculateEnhancedReadiness(
        athleteId,
        moodLogData,
        athlete?.sport
      );

      return {
        success: true,
        hasData: true,
        enhancedScore: Math.round(enhanced.enhancedReadiness),
        baseScore: Math.round(enhanced.baseReadiness),
        overall: Math.round(enhanced.overall),
        breakdown: {
          physical: Math.round(enhanced.physical),
          mental: Math.round(enhanced.mental),
          cognitive: Math.round(enhanced.cognitive),
        },
        trend: enhanced.trend,
        riskLevel: enhanced.riskLevel,
        chatInfluence: enhanced.chatInfluence ? {
          sentimentTrend: enhanced.chatInfluence.sentimentTrend,
          contribution: enhanced.chatInfluence.contribution,
          dominantThemes: enhanced.chatInfluence.dominantThemes,
        } : null,
        recommendations: enhanced.recommendations,
        methodology: 'Base readiness adjusted by chat sentiment',
      };
    } catch (error) {
      console.error('[ANALYTICS_TOOL] getEnhancedReadiness error:', error);
      return { success: false, error: 'Failed to calculate enhanced readiness' };
    }
  },
  {
    name: 'get_enhanced_readiness',
    description: 'Calculate readiness score blending mood logs with chat sentiment. Use before important events.',
    schema: z.object({
      athleteId: z.string().describe('The athlete user ID'),
    }),
  }
);

/**
 * Analyze multi-modal correlations
 */
export const analyzeMultiModalPatternsTool = tool(
  async ({ athleteId, days }) => {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const insights = await analyzeMultiModalCorrelation(athleteId, startDate, endDate);

      if (!insights) {
        return {
          success: true,
          hasData: false,
          message: 'Insufficient data for correlation analysis.',
        };
      }

      return {
        success: true,
        hasData: true,
        traditionalMetrics: {
          readinessCorrelation: insights.traditionalMetrics.readinessCorrelation.r.toFixed(2),
          moodCorrelation: insights.traditionalMetrics.moodCorrelation.r.toFixed(2),
        },
        conversationalInsights: {
          topTopics: insights.conversationalMetrics.topicImpacts.slice(0, 3).map(t => ({
            topic: t.topic,
            impact: t.avgPerformanceImpact > 0 ? 'positive' : 'negative',
            significance: t.pValue < 0.05 ? 'significant' : 'not significant',
          })),
        },
        combinedModel: {
          rSquared: (insights.combinedModel.rSquared * 100).toFixed(1) + '%',
          predictiveAccuracy: (insights.combinedModel.predictiveAccuracy * 100).toFixed(1) + '%',
        },
        actionableInsights: insights.actionableInsights,
      };
    } catch (error) {
      console.error('[ANALYTICS_TOOL] analyzeMultiModalPatterns error:', error);
      return { success: false, error: 'Failed to analyze correlations' };
    }
  },
  {
    name: 'analyze_multi_modal_patterns',
    description: 'Analyze correlations between chat topics, mood, and performance.',
    schema: z.object({
      athleteId: z.string().describe('The athlete user ID'),
      days: z.number().min(7).max(90).default(30).describe('Days of data to analyze'),
    }),
  }
);

// ============================================================================
// EXPORT ALL ANALYTICS TOOLS
// ============================================================================

export const analyticsTools = [
  forecastReadinessTrendTool,
  predictBurnoutRiskTool,
  assessWellbeingRiskTool,
  detectBehavioralPatternsTool,
  getEnhancedReadinessTool,
  analyzeMultiModalPatternsTool,
];

export const analyticsToolNames = analyticsTools.map((t) => t.name);
