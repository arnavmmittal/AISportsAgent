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
import { assessRisk, type AthleteRiskData } from '@/lib/algorithms/risk';

// ============================================================================
// TIER 1 TOOLS - Core predictive capabilities
// ============================================================================


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


// ============================================================================
// EXPORT ALL ANALYTICS TOOLS
// ============================================================================

export const analyticsTools = [
  assessWellbeingRiskTool,
];

export const analyticsToolNames = analyticsTools.map((t) => t.name);
