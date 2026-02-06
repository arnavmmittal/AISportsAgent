/**
 * Structured Output Tools for Chat Widgets
 *
 * These tools allow the LangGraph agent to generate structured data
 * that gets rendered as interactive widgets in the chat interface.
 *
 * Widget Types:
 * - ActionPlanWidget: 3-tier action plan (today, this_week, next_competition)
 * - PracticeDrillCard: Mental skill practice drills with 4-week progression
 * - RoutineBuilderWidget: Pre-performance routines with timer cues
 *
 * The tools output to state.widgetMetadata, which is streamed to the client
 * and rendered alongside the assistant's text response.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';

// ============================================================================
// ACTION PLAN TOOL
// ============================================================================

const actionPlanSchema = z.object({
  today: z
    .array(z.string())
    .describe('Immediate actions to take today (2-4 items)'),
  this_week: z
    .array(z.string())
    .describe('Actions to complete this week (2-4 items)'),
  next_competition: z
    .array(z.string())
    .describe('Actions for the next competition/event (2-4 items)'),
});

export type ActionPlan = z.infer<typeof actionPlanSchema>;

export const generateActionPlanTool = tool(
  async (input) => {
    // The tool just validates and returns the structured data
    // The persist node will extract this and stream it as widget metadata
    return JSON.stringify({
      widgetType: 'action_plan',
      data: input,
    });
  },
  {
    name: 'generate_action_plan',
    description: `Generate a structured 3-tier action plan for the athlete.
Use this when the athlete needs concrete next steps organized by timeframe.
The plan should be specific, measurable, and achievable.

Example situations to use this tool:
- Athlete needs a game-day preparation plan
- Athlete is working on a mental skill and needs practice structure
- Athlete is preparing for an upcoming competition

IMPORTANT: Only use this tool when you have enough context to create a meaningful plan.
Do NOT use this tool for general advice or when the athlete is just venting.`,
    schema: actionPlanSchema,
  }
);

// ============================================================================
// PRACTICE DRILL TOOL
// ============================================================================

const practiceDrillSchema = z.object({
  name: z
    .string()
    .describe('A descriptive name for the drill (e.g., "Pressure Free Throws")'),
  mental_skill: z
    .enum([
      'focus_control',
      'confidence_building',
      'anxiety_management',
      'visualization',
      'self_talk',
      'emotional_regulation',
      'flow_state',
      'concentration',
    ])
    .describe('The primary mental skill this drill develops'),
  setup: z
    .string()
    .describe('Equipment and environment setup required'),
  mental_component: z
    .string()
    .describe('The mental/psychological aspect of the drill'),
  physical_component: z
    .string()
    .describe('The physical/technical aspect of the drill'),
  progression: z
    .array(z.string())
    .length(4)
    .describe('4-week progression plan, one description per week'),
  success_metrics: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe('How to measure progress/success (2-4 metrics)'),
  duration_minutes: z
    .number()
    .min(5)
    .max(60)
    .describe('Duration of the drill in minutes'),
  coaching_notes: z
    .string()
    .describe('Tips for coaches or self-coaching notes'),
});

export type PracticeDrill = z.infer<typeof practiceDrillSchema>;

export const generatePracticeDrillTool = tool(
  async (input) => {
    return JSON.stringify({
      widgetType: 'practice_drill',
      data: input,
    });
  },
  {
    name: 'generate_practice_drill',
    description: `Generate a structured practice drill that integrates mental skills with physical training.
Use this when the athlete needs a specific, progressive drill to develop a mental skill.

The drill should be:
- Sport-specific when possible
- Progressive over 4 weeks
- Include both mental and physical components
- Have clear success metrics

Example situations to use this tool:
- Athlete struggles with free throw pressure → Create a pressure simulation drill
- Athlete wants to improve focus during games → Create a concentration drill
- Athlete needs help with pre-shot routine → Create a routine-building drill

IMPORTANT: Tailor the drill to the athlete's sport and specific challenge.`,
    schema: practiceDrillSchema,
  }
);

// ============================================================================
// PRE-PERFORMANCE ROUTINE TOOL
// ============================================================================

const routineCueSchema = z.object({
  type: z
    .enum(['physical', 'mental', 'environmental', 'social'])
    .describe('Category of the cue'),
  description: z
    .string()
    .describe('What to do during this step'),
  duration_seconds: z
    .number()
    .min(5)
    .max(300)
    .describe('How long this step takes (5-300 seconds)'),
  why_included: z
    .string()
    .optional()
    .describe('Brief explanation of why this step matters'),
});

const prePerformanceRoutineSchema = z.object({
  name: z
    .string()
    .describe('Name of the routine (e.g., "Pre-Game Activation Routine")'),
  sport: z
    .string()
    .describe('The sport this routine is designed for'),
  phase: z
    .enum(['pre_game', 'pre_practice', 'pre_performance', 'warm_up', 'cool_down'])
    .describe('When this routine is performed'),
  total_duration_seconds: z
    .number()
    .min(60)
    .max(1800)
    .describe('Total duration in seconds (1-30 minutes)'),
  cues: z
    .array(routineCueSchema)
    .min(3)
    .max(10)
    .describe('The steps/cues in the routine (3-10 steps)'),
  customization_notes: z
    .string()
    .describe('How the athlete can personalize this routine'),
  effectiveness_tracking: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe('What to track to measure routine effectiveness'),
});

export type PrePerformanceRoutine = z.infer<typeof prePerformanceRoutineSchema>;

export const generatePrePerformanceRoutineTool = tool(
  async (input) => {
    return JSON.stringify({
      widgetType: 'routine',
      data: input,
    });
  },
  {
    name: 'generate_pre_performance_routine',
    description: `Generate a structured pre-performance routine with timed cues.
Use this when the athlete needs a consistent routine for competition or practice.

A good routine includes:
- Physical cues (stretching, movement patterns)
- Mental cues (breathing, self-talk, visualization)
- Environmental cues (checking equipment, finding space)
- Social cues (if applicable, like team rituals)

Example situations to use this tool:
- Athlete has inconsistent pre-game preparation
- Athlete gets too nervous before competition
- Athlete wants to get in the "zone" consistently
- Athlete needs a mental reset routine between plays

IMPORTANT: Make the routine practical and appropriate for the athlete's sport and context.`,
    schema: prePerformanceRoutineSchema,
  }
);

// ============================================================================
// EXPORTS
// ============================================================================

export const structuredOutputTools = [
  generateActionPlanTool,
  generatePracticeDrillTool,
  generatePrePerformanceRoutineTool,
];

export const structuredOutputToolNames = structuredOutputTools.map((t) => t.name);

// Widget metadata types for state
export interface WidgetMetadata {
  widgetType: 'action_plan' | 'practice_drill' | 'routine';
  data: ActionPlan | PracticeDrill | PrePerformanceRoutine;
}
