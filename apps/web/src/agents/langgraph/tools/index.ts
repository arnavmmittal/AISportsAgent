/**
 * LangGraph Tools Index
 *
 * Central export for all tools available to the agent graph.
 * Tools are organized into two categories:
 * - Athlete Tools: Core CRUD operations (mood, goals, games, knowledge)
 * - Analytics Tools: ML-powered predictions (forecast, burnout, patterns)
 */

export {
  athleteTools,
  athleteToolNames,
  // Individual tools for selective use
  getMoodHistoryTool,
  getGoalsTool,
  getUpcomingGamesTool,
  getEffectiveInterventionsTool,
  logMoodTool,
  createGoalTool,
  updateGoalProgressTool,
  logInterventionOutcomeTool,
  recordInterventionFollowUpTool,
  searchKnowledgeBaseTool,
} from './athlete-tools';

export {
  analyticsTools,
  analyticsToolNames,
  // Individual analytics tools
  forecastReadinessTrendTool,
  predictBurnoutRiskTool,
  assessWellbeingRiskTool,
  analyzeMultiModalPatternsTool,
  detectBehavioralPatternsTool,
  getEnhancedReadinessTool,
} from './analytics-tools';

// Combined tools array for use in graph
import { athleteTools } from './athlete-tools';
import { analyticsTools } from './analytics-tools';

export const allTools = [...athleteTools, ...analyticsTools];
export const allToolNames = allTools.map((t) => t.name);
