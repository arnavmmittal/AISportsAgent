/**
 * Context Node - Load Enriched Athlete Context
 *
 * Fetches comprehensive athlete context using AthleteContextService:
 * - Real-time readiness scores
 * - ML predictions (risk level, slump detection)
 * - Personal baselines and optimal states
 * - Effective past interventions
 * - Upcoming games
 * - Conversation insights
 *
 * This context allows the agent to be proactive and personalized.
 */

import type { ConversationState } from '../state';
import { getAthleteContextService } from '@/services/AthleteContextService';

/**
 * Load enriched context node
 * Fetches comprehensive athlete data for personalized responses
 */
export async function loadContextNode(
  state: ConversationState
): Promise<Partial<ConversationState>> {
  const startTime = Date.now();

  // Skip if context already loaded (e.g., from previous turn in same session)
  if (state.enrichedContext) {
    return {};
  }

  try {
    const contextService = getAthleteContextService();
    const enrichedContext = await contextService.getEnrichedContext(state.athleteId);

    const duration = Date.now() - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log('[LANGGRAPH:CONTEXT]', {
        athleteId: state.athleteId,
        readinessScore: enrichedContext.readiness.score,
        readinessLevel: enrichedContext.readiness.level,
        riskLevel: enrichedContext.prediction?.riskLevel,
        slumpDetected: enrichedContext.prediction?.slumpDetected,
        insightsCount: enrichedContext.insights.length,
        hasGameSoon: enrichedContext.hasGameSoon,
        duration: `${duration}ms`,
      });
    }

    return { enrichedContext };
  } catch (error) {
    console.error('[LANGGRAPH:CONTEXT] Failed to load enriched context:', error);

    // Continue without enriched context - agent will still work but be less personalized
    return {
      enrichedContext: null,
      error: state.error
        ? `${state.error}; Context loading failed`
        : `Context loading failed: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

/**
 * Build system prompt enhancement from enriched context
 * This is injected into the main system prompt for personalization
 */
export function buildContextPromptSection(state: ConversationState): string {
  const ctx = state.enrichedContext;
  if (!ctx) {
    return '';
  }

  const sections: string[] = [];

  // Current state
  sections.push('## Current Athlete State');
  sections.push(`- **Readiness**: ${ctx.readiness.score}/100 (${ctx.readiness.level})`);
  sections.push(`- **Trend**: ${ctx.readiness.trend}`);

  if (ctx.readiness.comparedToBaseline) {
    const baseline = ctx.readiness.comparedToBaseline;
    if (baseline.mood_delta !== 0) {
      sections.push(`- Mood is ${baseline.mood_delta > 0 ? 'above' : 'below'} baseline by ${Math.abs(baseline.mood_delta).toFixed(1)} points`);
    }
    if (baseline.stress_delta !== 0) {
      sections.push(`- Stress is ${baseline.stress_delta > 0 ? 'higher' : 'lower'} than baseline by ${Math.abs(baseline.stress_delta).toFixed(1)} points`);
    }
  }

  // Risk/prediction info
  if (ctx.prediction) {
    sections.push('');
    sections.push('## Risk Assessment');
    sections.push(`- **Risk Level**: ${ctx.prediction.riskLevel}`);
    if (ctx.prediction.slumpDetected) {
      sections.push(`- ⚠️ **Slump Detected** (${Math.round((ctx.prediction.slumpProbability || 0) * 100)}% probability)`);
    }
    if (ctx.prediction.topFactors && ctx.prediction.topFactors.length > 0) {
      sections.push('- Top factors:');
      ctx.prediction.topFactors.slice(0, 3).forEach((f: { factor: string; direction: string }) => {
        sections.push(`  - ${f.factor}: ${f.direction}`);
      });
    }
  }

  // Upcoming game context
  if (ctx.hasGameSoon && ctx.daysUntilNextGame !== null) {
    sections.push('');
    sections.push('## Competition Context');
    if (ctx.daysUntilNextGame === 0) {
      sections.push('- 🎯 **Game TODAY** - Focus on immediate mental prep');
    } else if (ctx.daysUntilNextGame === 1) {
      sections.push('- 🎯 **Game TOMORROW** - Pre-competition preparation');
    } else {
      sections.push(`- Next game in ${ctx.daysUntilNextGame} days`);
    }
  }

  // Personal profile - what works for this athlete
  if (ctx.profile) {
    const profile = ctx.profile;

    if (profile.effectiveInterventions && profile.effectiveInterventions.length > 0) {
      sections.push('');
      sections.push('## What Works for This Athlete');
      profile.effectiveInterventions.slice(0, 3).forEach((intervention: { protocol: string; effectiveness: number }) => {
        sections.push(`- ${intervention.protocol} (${intervention.effectiveness}/10 effectiveness)`);
      });
    }

    if (profile.recurringThemes && profile.recurringThemes.length > 0) {
      sections.push('');
      sections.push('## Recurring Themes');
      sections.push(`Common topics: ${profile.recurringThemes.join(', ')}`);
    }

    if (profile.communicationStyle) {
      sections.push(`- Communication style: ${profile.communicationStyle}`);
    }
  }

  // Proactive insights
  if (ctx.insights && ctx.insights.length > 0) {
    sections.push('');
    sections.push('## Proactive Insights');
    ctx.insights.slice(0, 3).forEach((insight: { type: string; message: string }) => {
      sections.push(`- [${insight.type}] ${insight.message}`);
    });
  }

  // Days since last chat
  if (ctx.daysSinceLastChat !== null && ctx.daysSinceLastChat > 3) {
    sections.push('');
    sections.push(`Note: It's been ${ctx.daysSinceLastChat} days since this athlete last chatted. Consider acknowledging this.`);
  }

  return sections.join('\n');
}
