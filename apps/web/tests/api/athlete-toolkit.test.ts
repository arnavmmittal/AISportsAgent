import { describe, it, expect, vi } from 'vitest';
import { generateToolkitRecommendations } from '@/lib/athlete-toolkit';

// Mock the knowledge retrieval
vi.mock('@/lib/knowledge/retrieval', () => ({
  retrieveRelevantKnowledge: vi.fn().mockResolvedValue([
    { content: 'Cognitive reframing is a technique where athletes learn to reinterpret anxiety-provoking thoughts...', source: 'KB', title: 'Cognitive Reframing', category: 'SPORTS_PSYCHOLOGY', similarity: 0.85 },
    { content: 'Box breathing (4-4-4-4) is an evidence-based technique for acute stress reduction...', source: 'KB', title: 'Box Breathing', category: 'SPORTS_PSYCHOLOGY', similarity: 0.80 },
    { content: 'Visualization or mental imagery involves creating vivid mental pictures of successful performance...', source: 'KB', title: 'Visualization', category: 'SPORTS_PSYCHOLOGY', similarity: 0.75 },
  ]),
}));

describe('generateToolkitRecommendations', () => {
  it('returns 2-3 technique recommendations', async () => {
    const result = await generateToolkitRecommendations({
      currentState: { mood: 5, stress: 7, confidence: 4, sleep: 6 },
      recentLogs: [],
      contextTags: ['Pre-Game'],
      maxRecommendations: 3,
    });

    expect(result.techniques.length).toBeGreaterThanOrEqual(1);
    expect(result.techniques.length).toBeLessThanOrEqual(3);

    const technique = result.techniques[0];
    expect(technique.name).toBeTruthy();
    expect(technique.description).toBeTruthy();
    expect(technique.reason).toBeTruthy();
    expect(technique.chatPrompt).toBeTruthy();
    expect(technique.source).toBe('knowledge_base');
  });

  it('personalizes based on high stress state', async () => {
    const result = await generateToolkitRecommendations({
      currentState: { mood: 3, stress: 9, confidence: 3, sleep: 5 },
      recentLogs: [],
      contextTags: [],
      maxRecommendations: 3,
    });

    // Should prioritize stress-management techniques
    const hasStressRelated = result.techniques.some(
      t => t.targetState === 'high_stress' || t.name.toLowerCase().includes('breathing') || t.name.toLowerCase().includes('reframing')
    );
    expect(hasStressRelated).toBe(true);
  });

  it('includes personal effectiveness when history exists', async () => {
    const pastLogs = Array.from({ length: 8 }, (_, i) => ({
      mood: 6,
      stress: 6,
      confidence: 4,
      contextTags: ['Pre-Game'],
      createdAt: new Date(Date.now() - (i + 1) * 86400000),
    }));

    const result = await generateToolkitRecommendations({
      currentState: { mood: 5, stress: 7, confidence: 4, sleep: 7 },
      recentLogs: pastLogs,
      contextTags: ['Pre-Game'],
      maxRecommendations: 3,
    });

    expect(result.techniques.length).toBeGreaterThan(0);
    expect(result.isNewAthlete).toBe(false);
    // With 8+ logs and stress/confidence triggers, at least one technique should have a personal note
    const withPersonalNote = result.techniques.filter(t => t.personalNote !== null);
    expect(withPersonalNote.length).toBeGreaterThan(0);
  });

  it('returns fallback for new athletes', async () => {
    const result = await generateToolkitRecommendations({
      currentState: { mood: 5, stress: 5, confidence: 5, sleep: 7 },
      recentLogs: [],
      contextTags: [],
      maxRecommendations: 3,
    });

    expect(result.techniques.length).toBeGreaterThan(0);
    expect(result.isNewAthlete).toBe(true);
  });
});
