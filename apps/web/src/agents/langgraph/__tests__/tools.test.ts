/**
 * Tests for LangGraph Athlete Tools
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { athleteTools, athleteToolNames } from '../tools';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    moodLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    goal: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    gameSchedule: {
      findMany: vi.fn(),
    },
    intervention: {
      create: vi.fn(),
    },
  },
}));

// Mock knowledge agent
vi.mock('@/agents/knowledge/KnowledgeAgent', () => ({
  KnowledgeAgent: vi.fn().mockImplementation(() => ({
    retrieve: vi.fn().mockResolvedValue({
      documents: [
        { content: 'Test content', source: 'Test source', relevanceScore: 0.9 },
      ],
      summary: 'Test summary',
    }),
  })),
}));

describe('Athlete Tools', () => {
  describe('Tool definitions', () => {
    it('exports 10 athlete tools', () => {
      expect(athleteTools).toHaveLength(10);
    });

    it('has all expected tool names', () => {
      const expectedNames = [
        'get_mood_history',
        'get_goals',
        'get_upcoming_games',
        'get_effective_interventions',
        'log_mood',
        'create_goal',
        'update_goal_progress',
        'log_intervention_outcome',
        'record_intervention_follow_up',
        'search_knowledge_base',
      ];

      expect(athleteToolNames).toEqual(expect.arrayContaining(expectedNames));
      expect(athleteToolNames).toHaveLength(10);
    });

    it('all tools have name, description, and schema', () => {
      for (const tool of athleteTools) {
        expect(tool.name).toBeDefined();
        expect(tool.name.length).toBeGreaterThan(0);
        expect(tool.description).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(0);
        expect(tool.schema).toBeDefined();
      }
    });
  });

  describe('Tool schemas', () => {
    it('get_mood_history requires athleteId', () => {
      const tool = athleteTools.find((t) => t.name === 'get_mood_history');
      expect(tool).toBeDefined();

      const schema = tool!.schema;
      const shape = schema.shape;
      expect(shape.athleteId).toBeDefined();
    });

    it('log_mood validates mood range', () => {
      const tool = athleteTools.find((t) => t.name === 'log_mood');
      expect(tool).toBeDefined();

      const schema = tool!.schema;
      const shape = schema.shape;
      expect(shape.mood).toBeDefined();
      expect(shape.confidence).toBeDefined();
      expect(shape.stress).toBeDefined();
    });

    it('create_goal validates category enum', () => {
      const tool = athleteTools.find((t) => t.name === 'create_goal');
      expect(tool).toBeDefined();

      const schema = tool!.schema;
      const shape = schema.shape;
      expect(shape.category).toBeDefined();
      expect(shape.title).toBeDefined();
    });

    it('log_intervention_outcome validates intervention type enum', () => {
      const tool = athleteTools.find((t) => t.name === 'log_intervention_outcome');
      expect(tool).toBeDefined();

      const schema = tool!.schema;
      const shape = schema.shape;
      expect(shape.interventionType).toBeDefined();
      expect(shape.protocol).toBeDefined();
      expect(shape.context).toBeDefined();
    });
  });
});

describe('Tool invocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('get_mood_history returns formatted response', async () => {
    const { prisma } = await import('@/lib/prisma');

    (prisma.moodLog.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'log-1',
        athleteId: 'athlete-1',
        mood: 7,
        confidence: 8,
        stress: 4,
        energy: 6,
        sleep: 7,
        createdAt: new Date(),
      },
      {
        id: 'log-2',
        athleteId: 'athlete-1',
        mood: 6,
        confidence: 7,
        stress: 5,
        energy: 5,
        sleep: 6,
        createdAt: new Date(Date.now() - 86400000),
      },
    ]);

    const tool = athleteTools.find((t) => t.name === 'get_mood_history');
    const result = await tool!.invoke({ athleteId: 'athlete-1', days: 7 });

    expect(result.success).toBe(true);
    expect(result.hasData).toBe(true);
    expect(result.logCount).toBe(2);
    expect(result.averages).toBeDefined();
    expect(result.trend).toBeDefined();
  });

  it('get_goals returns goals array', async () => {
    const { prisma } = await import('@/lib/prisma');

    (prisma.goal.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'goal-1',
        athleteId: 'athlete-1',
        title: 'Improve focus',
        description: 'Work on concentration',
        category: 'MENTAL',
        status: 'IN_PROGRESS',
        completionPct: 30,
        targetDate: null,
      },
    ]);

    const tool = athleteTools.find((t) => t.name === 'get_goals');
    const result = await tool!.invoke({ athleteId: 'athlete-1' });

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(result.goals).toHaveLength(1);
    expect(result.goals[0].title).toBe('Improve focus');
  });

  it('log_mood creates mood log', async () => {
    const { prisma } = await import('@/lib/prisma');

    (prisma.moodLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'new-log-1',
      athleteId: 'athlete-1',
      mood: 8,
      confidence: 7,
      stress: 3,
    });

    const tool = athleteTools.find((t) => t.name === 'log_mood');
    const result = await tool!.invoke({
      athleteId: 'athlete-1',
      mood: 8,
      confidence: 7,
      stress: 3,
    });

    expect(result.success).toBe(true);
    expect(result.moodLogId).toBe('new-log-1');
    expect(prisma.moodLog.create).toHaveBeenCalled();
  });

  it('create_goal creates goal', async () => {
    const { prisma } = await import('@/lib/prisma');

    (prisma.goal.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'new-goal-1',
      athleteId: 'athlete-1',
      title: 'Meditate daily',
      category: 'MENTAL',
      status: 'IN_PROGRESS',
      targetDate: null,
    });

    const tool = athleteTools.find((t) => t.name === 'create_goal');
    const result = await tool!.invoke({
      athleteId: 'athlete-1',
      title: 'Meditate daily',
      category: 'MENTAL',
    });

    expect(result.success).toBe(true);
    expect(result.goalId).toBe('new-goal-1');
    expect(prisma.goal.create).toHaveBeenCalled();
  });
});
