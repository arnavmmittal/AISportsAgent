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
 * - 7-day readiness forecast (NEW)
 * - 30-day burnout prediction (NEW)
 * - Behavioral pattern detection (NEW)
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
        // NEW: Forecast, burnout, patterns
        forecastTrend: enrichedContext.forecast?.trend ?? 'unavailable',
        burnoutStage: enrichedContext.burnout?.stage ?? 'unavailable',
        patternsDetected: enrichedContext.patterns ? {
          anomalies: enrichedContext.patterns.anomalies.length,
          trends: enrichedContext.patterns.trends.length,
          cycles: enrichedContext.patterns.cycles.length,
        } : 'unavailable',
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
    const baseline = ctx.readiness.comparedToBaseline as Record<string, number>;
    if (baseline.mood && baseline.mood !== 0) {
      sections.push(`- Mood is ${baseline.mood > 0 ? 'above' : 'below'} baseline by ${Math.abs(baseline.mood).toFixed(1)} points`);
    }
    if (baseline.stress && baseline.stress !== 0) {
      sections.push(`- Stress is ${baseline.stress > 0 ? 'higher' : 'lower'} than baseline by ${Math.abs(baseline.stress).toFixed(1)} points`);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile.effectiveInterventions.slice(0, 3).forEach((intervention: any) => {
        const effectScore = intervention.effectivenessScore || intervention.effectiveness || 'N/A';
        sections.push(`- ${intervention.protocol} (${effectScore}/10 effectiveness)`);
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

  // NEW: 7-Day Readiness Forecast
  if (ctx.forecast) {
    sections.push('');
    sections.push('## 7-Day Readiness Forecast');
    sections.push(`- **Trend**: ${ctx.forecast.trend} (current: ${ctx.forecast.currentScore}/100)`);

    // Highlight concerning days
    const lowDays = ctx.forecast.next7Days.filter(d => d.score < 50);
    if (lowDays.length > 0) {
      sections.push('- ⚠️ **Low readiness predicted**:');
      lowDays.slice(0, 3).forEach(d => {
        const date = new Date(d.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        sections.push(`  - ${dayName}: ${d.score}/100 (${d.confidence} confidence)`);
      });
    }

    if (ctx.forecast.riskFlags.length > 0) {
      sections.push(`- Risk flags: ${ctx.forecast.riskFlags.join(', ')}`);
    }

    if (ctx.forecast.recommendations.length > 0) {
      sections.push('- Forecast-based recommendations:');
      ctx.forecast.recommendations.slice(0, 2).forEach(r => {
        sections.push(`  - ${r}`);
      });
    }
  }

  // NEW: 30-Day Burnout Prediction
  if (ctx.burnout) {
    sections.push('');
    sections.push('## Burnout Risk Assessment');

    const burnoutEmoji = {
      'healthy': '✅',
      'early-warning': '⚡',
      'developing': '⚠️',
      'advanced': '🔴',
      'critical': '🚨',
    }[ctx.burnout.stage] || '❓';

    sections.push(`- **Stage**: ${burnoutEmoji} ${ctx.burnout.stage.replace('-', ' ')} (${Math.round(ctx.burnout.probability * 100)}% probability)`);

    if (ctx.burnout.daysUntilRisk < 14 && ctx.burnout.stage !== 'healthy') {
      sections.push(`- ⏰ **Risk window**: ${ctx.burnout.daysUntilRisk} days until elevated risk`);
    }

    if (ctx.burnout.warningNow.length > 0) {
      sections.push('- Current warning signs:');
      ctx.burnout.warningNow.slice(0, 3).forEach(w => {
        sections.push(`  - [${w.severity}] ${w.indicator}: ${w.description}`);
      });
    }

    if (ctx.burnout.preventionStrategies.length > 0 && ctx.burnout.stage !== 'healthy') {
      sections.push('- Prevention strategies to suggest:');
      ctx.burnout.preventionStrategies.slice(0, 2).forEach(s => {
        sections.push(`  - ${s}`);
      });
    }
  }

  // NEW: Behavioral Pattern Detection
  if (ctx.patterns) {
    sections.push('');
    sections.push('## Behavioral Patterns Detected');

    // Anomalies are high priority
    if (ctx.patterns.anomalies.length > 0) {
      sections.push('- 🔍 **Anomalies detected**:');
      ctx.patterns.anomalies.slice(0, 2).forEach(a => {
        sections.push(`  - [${a.severity}] ${a.metric} on ${new Date(a.date).toLocaleDateString()}: ${a.context}`);
      });
    }

    // Trends help understand trajectory
    if (ctx.patterns.trends.length > 0) {
      sections.push('- Trends:');
      ctx.patterns.trends.slice(0, 2).forEach(t => {
        const arrow = t.direction === 'increasing' ? '↗️' : t.direction === 'decreasing' ? '↘️' : '→';
        sections.push(`  - ${arrow} ${t.metric}: ${t.description} (${t.strength} strength)`);
      });
    }

    // Cycles help with timing
    if (ctx.patterns.cycles.length > 0) {
      sections.push('- Weekly patterns:');
      ctx.patterns.cycles.slice(0, 2).forEach(c => {
        let cycleInfo = `${c.metric} has ${c.period} cycle`;
        if (c.peakDays && c.peakDays.length > 0) {
          cycleInfo += ` (peaks: ${c.peakDays.join(', ')})`;
        }
        if (c.lowDays && c.lowDays.length > 0) {
          cycleInfo += ` (lows: ${c.lowDays.join(', ')})`;
        }
        sections.push(`  - ${cycleInfo}`);
      });
    }

    // Cross-metric correlations
    if (ctx.patterns.correlations.length > 0) {
      const strongCorr = ctx.patterns.correlations.filter(c => Math.abs(c.correlation) >= 0.5);
      if (strongCorr.length > 0) {
        sections.push('- Strong correlations:');
        strongCorr.slice(0, 2).forEach(c => {
          const direction = c.correlation > 0 ? 'positively' : 'negatively';
          sections.push(`  - ${c.metric1} ↔ ${c.metric2}: ${direction} correlated (${c.insights[0] || ''})`);
        });
      }
    }

    if (ctx.patterns.summary) {
      sections.push(`- Summary: ${ctx.patterns.summary}`);
    }
  }

  return sections.join('\n');
}
