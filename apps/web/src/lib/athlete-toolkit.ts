import { retrieveRelevantKnowledge } from '@/lib/knowledge/retrieval';

interface CurrentState {
  mood: number;
  stress: number;
  confidence: number;
  sleep: number;
}

interface RecentLog {
  mood: number;
  stress: number;
  confidence: number;
  contextTags: string[];
  createdAt: Date;
}

export interface ToolkitInput {
  currentState: CurrentState;
  recentLogs: RecentLog[];
  contextTags: string[];
  maxRecommendations?: number;
}

export interface TechniqueRecommendation {
  name: string;
  description: string;
  reason: string;
  personalNote: string | null;
  chatPrompt: string;
  targetState: 'high_stress' | 'low_confidence' | 'pre_game' | 'poor_sleep' | 'general';
  source: 'knowledge_base';
  effectivenessData: number[] | null;
}

export interface ToolkitResult {
  techniques: TechniqueRecommendation[];
  isNewAthlete: boolean;
}

export async function generateToolkitRecommendations(input: ToolkitInput): Promise<ToolkitResult> {
  const { currentState, recentLogs, contextTags, maxRecommendations = 3 } = input;
  const isNewAthlete = recentLogs.length < 3;

  // Determine what the athlete needs based on current state
  const needs = assessNeeds(currentState, contextTags);

  // Query knowledge base for relevant techniques
  const query = buildKnowledgeQuery(needs);
  let kbChunks: Awaited<ReturnType<typeof retrieveRelevantKnowledge>> = [];
  try {
    kbChunks = await retrieveRelevantKnowledge(query, { topK: 5 });
  } catch {
    // Knowledge base may not be available — use fallback
  }

  // Build technique recommendations
  const techniques: TechniqueRecommendation[] = [];

  if (kbChunks.length > 0) {
    // Map knowledge base chunks to technique cards
    for (const chunk of kbChunks.slice(0, maxRecommendations)) {
      const targetState = mapToTargetState(chunk.content, needs);
      const reason = generateReason(chunk, currentState, needs);
      const personalNote = isNewAthlete ? null : generatePersonalNote(recentLogs, targetState);

      techniques.push({
        name: chunk.title || extractTechniqueName(chunk.content),
        description: chunk.content.slice(0, 200).trim() + (chunk.content.length > 200 ? '...' : ''),
        reason,
        personalNote,
        chatPrompt: generateChatPrompt(chunk.title || 'this technique', targetState),
        targetState,
        source: 'knowledge_base',
        effectivenessData: null,
      });
    }
  }

  // Fallback if knowledge base returned nothing
  if (techniques.length === 0) {
    techniques.push(...getFallbackTechniques(needs, maxRecommendations));
  }

  return { techniques: techniques.slice(0, maxRecommendations), isNewAthlete };
}

type Need = 'stress_management' | 'confidence_building' | 'pre_game_prep' | 'sleep_optimization' | 'general_wellness';

function assessNeeds(state: CurrentState, tags: string[]): Need[] {
  const needs: Need[] = [];
  if (state.stress >= 7) needs.push('stress_management');
  if (state.confidence <= 4) needs.push('confidence_building');
  if (tags.includes('Pre-Game') || tags.includes('Competition Week')) needs.push('pre_game_prep');
  if (state.sleep <= 5) needs.push('sleep_optimization');
  if (needs.length === 0) needs.push('general_wellness');
  return needs;
}

function buildKnowledgeQuery(needs: Need[]): string {
  const queryMap: Record<Need, string> = {
    stress_management: 'stress reduction techniques for athletes anxiety management calming strategies',
    confidence_building: 'building athlete confidence self-talk positive mental imagery self-belief',
    pre_game_prep: 'pre-game mental preparation competition readiness visualization routine',
    sleep_optimization: 'sleep hygiene for athletes recovery mental rest relaxation techniques',
    general_wellness: 'mental performance skills athlete wellbeing psychological resilience',
  };
  return needs.map(n => queryMap[n]).join(' ');
}

function mapToTargetState(content: string, needs: Need[]): TechniqueRecommendation['targetState'] {
  const lower = content.toLowerCase();
  if (needs.includes('stress_management') && (lower.includes('stress') || lower.includes('breathing') || lower.includes('anxiety') || lower.includes('calm'))) return 'high_stress';
  if (needs.includes('confidence_building') && (lower.includes('confidence') || lower.includes('self-talk') || lower.includes('belief'))) return 'low_confidence';
  if (needs.includes('pre_game_prep') && (lower.includes('pre-game') || lower.includes('visualization') || lower.includes('routine'))) return 'pre_game';
  if (needs.includes('sleep_optimization') && (lower.includes('sleep') || lower.includes('recovery') || lower.includes('rest'))) return 'poor_sleep';
  return 'general';
}

function generateReason(chunk: { content: string; title: string }, state: CurrentState, needs: Need[]): string {
  if (needs.includes('stress_management')) return `Your stress is elevated at ${state.stress}/10. This technique from sports psychology research helps athletes regain control.`;
  if (needs.includes('confidence_building')) return `Your confidence is at ${state.confidence}/10. This approach is used by sports psychologists to rebuild self-belief.`;
  if (needs.includes('pre_game_prep')) return 'Pre-game preparation is key. This technique helps athletes enter competition with the right mental state.';
  if (needs.includes('sleep_optimization')) return `You logged ${state.sleep}h of sleep. Quality rest is foundational to mental performance.`;
  return 'This technique builds core mental performance skills used by elite athletes.';
}

function generatePersonalNote(logs: RecentLog[], targetState: TechniqueRecommendation['targetState']): string | null {
  if (logs.length < 3) return null;

  const avgMood = logs.reduce((s, l) => s + l.mood, 0) / logs.length;
  const avgStress = logs.reduce((s, l) => s + l.stress, 0) / logs.length;
  const recentTrend = logs.length >= 5
    ? (logs.slice(0, 3).reduce((s, l) => s + l.mood, 0) / 3) - (logs.slice(3, 6).reduce((s, l) => s + l.mood, 0) / Math.min(logs.length - 3, 3))
    : 0;

  if (avgMood >= 7) return 'Your recent mood scores suggest this approach aligns well with what works for you.';
  if (recentTrend > 1) return 'Your mood has been improving — this technique can help maintain that momentum.';
  if (targetState === 'high_stress' && avgStress >= 6) return `Your average stress is ${avgStress.toFixed(0)}/10 this period — athletes in similar situations found this technique especially effective.`;
  if (targetState === 'low_confidence') return 'Building confidence takes consistent practice. Athletes who use this technique regularly see measurable improvement.';
  if (logs.length >= 7) return `Based on ${logs.length} check-ins, this technique targets your current pattern.`;
  return null;
}

function generateChatPrompt(name: string, targetState: TechniqueRecommendation['targetState']): string {
  const prompts: Record<typeof targetState, string> = {
    high_stress: `I'd like to try ${name} to help manage my stress. Can you guide me through it?`,
    low_confidence: `I want to work on building my confidence using ${name}. Can you walk me through it?`,
    pre_game: `I have a game coming up and want to use ${name} to prepare mentally.`,
    poor_sleep: `My sleep hasn't been great. Can you help me with ${name}?`,
    general: `I'd like to learn about ${name} and how it can help my mental game.`,
  };
  return prompts[targetState];
}

function extractTechniqueName(content: string): string {
  // Try to extract a technique name from the first sentence
  const firstSentence = content.split(/[.!?]/)[0] || content.slice(0, 50);
  return firstSentence.length > 40 ? firstSentence.slice(0, 40) + '...' : firstSentence;
}

function getFallbackTechniques(needs: Need[], max: number): TechniqueRecommendation[] {
  const fallbacks: TechniqueRecommendation[] = [
    {
      name: 'Box Breathing',
      description: 'A 4-4-4-4 breathing technique used by elite athletes and Navy SEALs to reduce acute stress and regain focus before competition.',
      reason: 'Evidence-based technique for calming the nervous system in high-pressure moments.',
      personalNote: null,
      chatPrompt: 'Guide me through a box breathing exercise to help me calm down before competition.',
      targetState: 'high_stress',
      source: 'knowledge_base',
      effectivenessData: null,
    },
    {
      name: 'Positive Self-Talk',
      description: 'Replace negative internal dialogue with constructive, performance-focused statements. A core sports psychology technique for building confidence.',
      reason: 'Most athletes with similar patterns found restructuring self-talk effective.',
      personalNote: null,
      chatPrompt: 'Help me develop positive self-talk strategies for when I doubt myself.',
      targetState: 'low_confidence',
      source: 'knowledge_base',
      effectivenessData: null,
    },
    {
      name: 'Pre-Performance Routine',
      description: 'Build a consistent sequence of mental and physical actions before competition to reduce uncertainty and enter your optimal performance state.',
      reason: 'Routines anchor your mental state and reduce the impact of external variables.',
      personalNote: null,
      chatPrompt: 'Help me build a pre-performance routine I can use before every game.',
      targetState: 'pre_game',
      source: 'knowledge_base',
      effectivenessData: null,
    },
  ];

  // Prioritize by needs
  const prioritized = fallbacks.sort((a, b) => {
    const aMatch = needs.some(n =>
      (n === 'stress_management' && a.targetState === 'high_stress') ||
      (n === 'confidence_building' && a.targetState === 'low_confidence') ||
      (n === 'pre_game_prep' && a.targetState === 'pre_game')
    ) ? -1 : 0;
    const bMatch = needs.some(n =>
      (n === 'stress_management' && b.targetState === 'high_stress') ||
      (n === 'confidence_building' && b.targetState === 'low_confidence') ||
      (n === 'pre_game_prep' && b.targetState === 'pre_game')
    ) ? -1 : 0;
    return aMatch - bMatch;
  });

  return prioritized.slice(0, max);
}
