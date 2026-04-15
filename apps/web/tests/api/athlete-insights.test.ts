import { describe, it, expect } from 'vitest';
import { generateAthleteInsights } from '@/lib/athlete-insights';

describe('generateAthleteInsights', () => {
  it('returns mental readiness pattern when sufficient data exists', async () => {
    const mockLogs = Array.from({ length: 14 }, (_, i) => ({
      id: `log-${i}`,
      mood: i % 2 === 0 ? 8 : 5, // alternating pattern
      confidence: 6,
      stress: 4,
      sleep: 7,
      sleepQuality: 7,
      soreness: 3,
      rpe: 5,
      contextTags: i % 2 === 0 ? ['Rest Day'] : [],
      createdAt: new Date(Date.now() - i * 86400000),
      notes: null,
    }));

    const result = await generateAthleteInsights({
      moodLogs: mockLogs,
      coachInteractions: [{ date: new Date(Date.now() - 172800000) }],
      goals: [{ status: 'IN_PROGRESS' }, { status: 'COMPLETED' }],
      upcomingGame: null,
      checkInStreak: 5,
    });

    expect(result.mentalPattern).toBeDefined();
    expect(result.mentalPattern.text).toBeTruthy();
    expect(result.coachConnection).toBeDefined();
    expect(result.coachConnection.lastInteractionDaysAgo).toBe(2);
    expect(result.growthMetric).toBeDefined();
    expect(result.conversationStarters).toBeInstanceOf(Array);
    expect(result.conversationStarters.length).toBeLessThanOrEqual(4);
    expect(result.weeklyInsight).toBeTruthy();
  });

  it('returns fallback insights for new athletes with no data', async () => {
    const result = await generateAthleteInsights({
      moodLogs: [],
      coachInteractions: [],
      goals: [],
      upcomingGame: null,
      checkInStreak: 0,
    });

    expect(result.mentalPattern.text).toContain('check-in');
    expect(result.growthMetric.score).toBe(0);
    expect(result.conversationStarters.length).toBeGreaterThan(0);
  });

  it('generates game-aware starters when game is upcoming', async () => {
    const result = await generateAthleteInsights({
      moodLogs: [{
        id: '1', mood: 7, confidence: 6, stress: 5, sleep: 7,
        sleepQuality: 6, soreness: 3, rpe: 5, contextTags: [],
        createdAt: new Date(), notes: null,
      }],
      coachInteractions: [],
      goals: [],
      upcomingGame: { opponent: 'Oregon State', date: new Date(Date.now() + 86400000) },
      checkInStreak: 1,
    });

    const gameStarter = result.conversationStarters.find(s => s.type === 'game');
    expect(gameStarter).toBeDefined();
    expect(gameStarter!.prompt).toContain('game');
  });

  it('generates stress-aware starters when stress is elevated', async () => {
    const result = await generateAthleteInsights({
      moodLogs: [{
        id: '1', mood: 4, confidence: 3, stress: 9, sleep: 5,
        sleepQuality: 4, soreness: 6, rpe: 8, contextTags: ['Exam Week'],
        createdAt: new Date(), notes: null,
      }],
      coachInteractions: [],
      goals: [],
      upcomingGame: null,
      checkInStreak: 1,
    });

    const stressStarter = result.conversationStarters.find(s => s.type === 'checkin');
    expect(stressStarter).toBeDefined();
  });
});
