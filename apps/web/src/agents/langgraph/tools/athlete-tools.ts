/**
 * Athlete-Facing Tools for LangGraph
 *
 * These tools allow the AI agent to:
 * - Read athlete data (mood history, goals, upcoming games)
 * - Write athlete data (log mood, create goals, record interventions)
 * - Search knowledge base for sports psychology techniques
 *
 * All tools use Zod schemas for validation and are compatible with LangGraph's ToolNode.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// ============================================================================
// READ TOOLS - Retrieve athlete information
// ============================================================================

/**
 * Get athlete's mood history and trends
 */
export const getMoodHistoryTool = tool(
  async ({ athleteId, days }) => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await prisma.moodLog.findMany({
      where: {
        athleteId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      take: 14,
    });

    if (logs.length === 0) {
      return {
        success: true,
        hasData: false,
        message: 'No mood logs found for this period.',
      };
    }

    const avgMood = logs.reduce((s, l) => s + l.mood, 0) / logs.length;
    const avgStress = logs.reduce((s, l) => s + l.stress, 0) / logs.length;
    const avgConfidence = logs.reduce((s, l) => s + l.confidence, 0) / logs.length;
    const avgEnergy = logs.filter((l) => l.energy).reduce((s, l) => s + (l.energy || 0), 0) / logs.filter((l) => l.energy).length || null;
    const avgSleep = logs.filter((l) => l.sleep).reduce((s, l) => s + (l.sleep || 0), 0) / logs.filter((l) => l.sleep).length || null;

    // Determine trend
    const recentLogs = logs.slice(0, Math.ceil(logs.length / 2));
    const olderLogs = logs.slice(Math.ceil(logs.length / 2));
    const recentAvgMood = recentLogs.reduce((s, l) => s + l.mood, 0) / recentLogs.length;
    const olderAvgMood = olderLogs.length > 0 ? olderLogs.reduce((s, l) => s + l.mood, 0) / olderLogs.length : recentAvgMood;
    const trend = recentAvgMood > olderAvgMood + 0.5 ? 'improving' : recentAvgMood < olderAvgMood - 0.5 ? 'declining' : 'stable';

    return {
      success: true,
      hasData: true,
      logCount: logs.length,
      averages: {
        mood: Number(avgMood.toFixed(1)),
        stress: Number(avgStress.toFixed(1)),
        confidence: Number(avgConfidence.toFixed(1)),
        energy: avgEnergy ? Number(avgEnergy.toFixed(1)) : null,
        sleep: avgSleep ? Number(avgSleep.toFixed(1)) : null,
      },
      trend,
      mostRecent: {
        date: logs[0].createdAt.toISOString(),
        mood: logs[0].mood,
        stress: logs[0].stress,
        confidence: logs[0].confidence,
      },
    };
  },
  {
    name: 'get_mood_history',
    description: "Get athlete's mood history and trends over recent days. Returns averages, trends (improving/stable/declining), and most recent entry.",
    schema: z.object({
      athleteId: z.string().describe('The athlete user ID'),
      days: z.number().min(1).max(30).default(7).describe('Number of days to look back (1-30)'),
    }),
  }
);

/**
 * Get athlete's current goals
 */
export const getGoalsTool = tool(
  async ({ athleteId, status, category }) => {
    const where: Record<string, unknown> = { athleteId };
    if (status) where.status = status;
    if (category) where.category = category;

    const goals = await prisma.goal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      success: true,
      count: goals.length,
      goals: goals.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        category: g.category,
        status: g.status,
        progress: g.completionPct,
        targetDate: g.targetDate?.toISOString() || null,
      })),
    };
  },
  {
    name: 'get_goals',
    description: "Retrieve athlete's goals. Can filter by status (IN_PROGRESS, COMPLETED, etc.) or category (PERFORMANCE, MENTAL, ACADEMIC, PERSONAL).",
    schema: z.object({
      athleteId: z.string().describe('The athlete user ID'),
      status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED']).optional().describe('Filter by goal status'),
      category: z.enum(['PERFORMANCE', 'MENTAL', 'ACADEMIC', 'PERSONAL']).optional().describe('Filter by goal category'),
    }),
  }
);

/**
 * Get upcoming games/competitions
 */
export const getUpcomingGamesTool = tool(
  async ({ athleteId, limit }) => {
    const games = await prisma.gameSchedule.findMany({
      where: {
        athleteId,
        gameDate: { gte: new Date() },
      },
      orderBy: { gameDate: 'asc' },
      take: limit,
    });

    if (games.length === 0) {
      return {
        success: true,
        hasGames: false,
        message: 'No upcoming games scheduled.',
      };
    }

    const nextGame = games[0];
    const daysUntilNextGame = Math.ceil((nextGame.gameDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

    return {
      success: true,
      hasGames: true,
      count: games.length,
      nextGame: {
        date: nextGame.gameDate.toISOString(),
        opponent: nextGame.opponent,
        location: nextGame.location,
        homeAway: nextGame.homeAway,
        stakes: nextGame.stakes,
        daysUntil: daysUntilNextGame,
      },
      games: games.map((g) => ({
        date: g.gameDate.toISOString(),
        opponent: g.opponent,
        location: g.location,
        homeAway: g.homeAway,
        stakes: g.stakes,
      })),
    };
  },
  {
    name: 'get_upcoming_games',
    description: "Get athlete's upcoming games and competitions. Returns next game details and days until it.",
    schema: z.object({
      athleteId: z.string().describe('The athlete user ID'),
      limit: z.number().min(1).max(10).default(3).describe('Maximum number of games to return'),
    }),
  }
);

// ============================================================================
// WRITE TOOLS - Record athlete data
// ============================================================================

/**
 * Log athlete's current mood
 */
export const logMoodTool = tool(
  async ({ athleteId, mood, confidence, stress, energy, sleep, notes, isPreGame }) => {
    const moodLog = await prisma.moodLog.create({
      data: {
        athleteId,
        mood,
        confidence,
        stress,
        energy: energy ?? null,
        sleep: sleep ?? null,
        notes: notes ?? null,
        tags: '',
        isPreGame: isPreGame ?? false,
      },
    });

    return {
      success: true,
      moodLogId: moodLog.id,
      message: `Mood logged successfully: ${mood}/10 mood, ${stress}/10 stress, ${confidence}/10 confidence.`,
      summary: {
        mood,
        stress,
        confidence,
        energy,
        sleep,
      },
    };
  },
  {
    name: 'log_mood',
    description: "Log athlete's current mood, confidence, stress, energy, and sleep. Use when athlete shares how they're feeling or for check-ins.",
    schema: z.object({
      athleteId: z.string().describe('The athlete user ID'),
      mood: z.number().min(1).max(10).describe('Mood level (1=very low, 10=excellent)'),
      confidence: z.number().min(1).max(10).describe('Confidence level (1=very low, 10=very high)'),
      stress: z.number().min(1).max(10).describe('Stress level (1=very calm, 10=extremely stressed)'),
      energy: z.number().min(1).max(10).optional().describe('Energy level (1=exhausted, 10=highly energized)'),
      sleep: z.number().min(1).max(10).optional().describe('Sleep quality last night (1=terrible, 10=excellent)'),
      notes: z.string().optional().describe('Additional notes about context'),
      isPreGame: z.boolean().optional().describe('Whether this is a pre-game check-in'),
    }),
  }
);

/**
 * Create a new goal
 */
export const createGoalTool = tool(
  async ({ athleteId, title, description, category, targetDate }) => {
    const goal = await prisma.goal.create({
      data: {
        athleteId,
        title,
        description: description ?? null,
        category,
        status: 'IN_PROGRESS',
        targetDate: targetDate ? new Date(targetDate) : null,
        completionPct: 0,
      },
    });

    return {
      success: true,
      goalId: goal.id,
      message: `Created new ${category.toLowerCase()} goal: "${title}"`,
      goal: {
        id: goal.id,
        title: goal.title,
        category: goal.category,
        targetDate: goal.targetDate?.toISOString() || null,
      },
    };
  },
  {
    name: 'create_goal',
    description: 'Create a new goal for the athlete. Use when they express wanting to work on something specific.',
    schema: z.object({
      athleteId: z.string().describe('The athlete user ID'),
      title: z.string().min(1).max(200).describe('Goal title (clear, specific)'),
      description: z.string().optional().describe('Detailed description of the goal'),
      category: z.enum(['PERFORMANCE', 'MENTAL', 'ACADEMIC', 'PERSONAL']).describe('Goal category'),
      targetDate: z.string().optional().describe('Target completion date (ISO string)'),
    }),
  }
);

/**
 * Update goal progress
 */
export const updateGoalProgressTool = tool(
  async ({ goalId, progress, status, notes }) => {
    const updateData: Record<string, unknown> = {};
    if (progress !== undefined) updateData.completionPct = progress;
    if (status) updateData.status = status;
    if (status === 'COMPLETED') updateData.completedAt = new Date();

    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
    });

    return {
      success: true,
      message: progress !== undefined
        ? `Updated goal progress to ${progress}%.`
        : `Updated goal status to ${status}.`,
      goal: {
        id: goal.id,
        title: goal.title,
        progress: goal.completionPct,
        status: goal.status,
      },
    };
  },
  {
    name: 'update_goal_progress',
    description: 'Update progress or status of an existing goal. Use when athlete reports progress or completes a goal.',
    schema: z.object({
      goalId: z.string().describe('The goal ID to update'),
      progress: z.number().min(0).max(100).optional().describe('New progress percentage (0-100)'),
      status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED']).optional().describe('New goal status'),
      notes: z.string().optional().describe('Notes about the progress'),
    }),
  }
);

/**
 * Log an intervention/technique outcome
 */
export const logInterventionOutcomeTool = tool(
  async ({ athleteId, sessionId, interventionType, protocol, context, situation }) => {
    // Create the intervention record
    // Note: Outcomes are tracked separately via mood logs and follow-up comparisons
    const intervention = await prisma.intervention.create({
      data: {
        athleteId,
        suggestedInSessionId: sessionId ?? null,
        type: interventionType,
        protocol,
        context,
        situation: situation ?? null,
        source: 'AI_SUGGESTED',
        performedAt: new Date(),
      },
    });

    return {
      success: true,
      interventionId: intervention.id,
      message: `Logged ${protocol} intervention (${context.toLowerCase().replace('_', ' ')}).`,
      intervention: {
        id: intervention.id,
        type: interventionType,
        protocol,
        context,
      },
    };
  },
  {
    name: 'log_intervention_outcome',
    description: 'Log when a mental technique or intervention is suggested and track its effectiveness. Use after recommending a technique.',
    schema: z.object({
      athleteId: z.string().describe('The athlete user ID'),
      sessionId: z.string().optional().describe('Chat session ID'),
      interventionType: z.enum([
        'BREATHING',
        'VISUALIZATION',
        'SELF_TALK',
        'ROUTINE',
        'FOCUS_CUE',
        'AROUSAL_REGULATION',
        'GOAL_SETTING',
        'COGNITIVE_REFRAME',
      ]).describe('Type of intervention'),
      protocol: z.string().describe('Specific protocol name (e.g., "4-7-8 breathing", "centering sequence")'),
      context: z.enum([
        'PRE_GAME',
        'PRE_PRACTICE',
        'DURING_COMPETITION',
        'HALFTIME',
        'POST_ERROR',
        'POST_GAME',
        'POST_LOSS',
        'RECOVERY',
      ]).describe('Context when the intervention is used'),
      situation: z.string().optional().describe('Freeform situation description'),
    }),
  }
);

// ============================================================================
// KNOWLEDGE TOOLS - Search sports psychology knowledge base
// ============================================================================

/**
 * Search knowledge base for sports psychology techniques
 */
export const searchKnowledgeBaseTool = tool(
  async ({ query, framework }) => {
    // Import the knowledge agent dynamically to avoid circular dependencies
    const { KnowledgeAgent } = await import('@/agents/knowledge/KnowledgeAgent');
    const knowledgeAgent = new KnowledgeAgent();

    try {
      const results = await knowledgeAgent.retrieve(query, {
        sessionId: 'tool-invocation',
        athleteId: 'tool-invocation',
        userId: 'tool-invocation',
        conversationHistory: [],
      });

      // Filter by framework if specified
      let filteredDocs = results.documents;
      if (framework) {
        filteredDocs = results.documents.filter(
          (doc) => doc.content.toLowerCase().includes(framework.toLowerCase())
        );
        // If no matches, return all results
        if (filteredDocs.length === 0) filteredDocs = results.documents;
      }

      return {
        success: true,
        documentCount: filteredDocs.length,
        documents: filteredDocs.slice(0, 3).map((doc) => ({
          content: doc.content.slice(0, 500) + (doc.content.length > 500 ? '...' : ''),
          source: doc.source,
          relevance: doc.relevanceScore,
        })),
        summary: results.summary,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search knowledge base',
        documentCount: 0,
        documents: [],
      };
    }
  },
  {
    name: 'search_knowledge_base',
    description: 'Search sports psychology knowledge base for evidence-based techniques, frameworks, and research. Use when athlete asks about specific techniques or needs research-backed advice.',
    schema: z.object({
      query: z.string().min(3).describe('Search query for sports psychology topics'),
      framework: z.enum(['CBT', 'MINDFULNESS', 'FLOW', 'GOAL_SETTING']).optional().describe('Filter by specific framework'),
    }),
  }
);

// ============================================================================
// EXPORT ALL TOOLS
// ============================================================================

export const athleteTools = [
  // Read tools
  getMoodHistoryTool,
  getGoalsTool,
  getUpcomingGamesTool,
  // Write tools
  logMoodTool,
  createGoalTool,
  updateGoalProgressTool,
  logInterventionOutcomeTool,
  // Knowledge tools
  searchKnowledgeBaseTool,
];

// Tool names for reference
export const athleteToolNames = athleteTools.map((t) => t.name);
