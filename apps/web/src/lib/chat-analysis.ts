/**
 * Chat Session Analysis Service
 *
 * Analyzes athlete chat sessions to extract psychological insights:
 * - Sentiment analysis (-1 to 1)
 * - Emotional tone classification
 * - Topic extraction
 * - Stress indicators and coping strategies
 * - Pre-game mental state assessment
 *
 * This data feeds into the enhanced readiness algorithm and multi-modal
 * performance correlation analysis.
 */

import { openai } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

export interface ChatAnalysisResult {
  overallSentiment: number; // -1.0 to 1.0
  emotionalTone: 'anxious' | 'confident' | 'frustrated' | 'motivated' | 'neutral';
  confidenceLevel: number; // 0-100
  topics: string[];
  dominantTheme: string | null;
  stressIndicators: string[];
  copingStrategies: string[];
  isPreGame: boolean;
  preGameMindset: string | null;
  daysUntilGame: number | null;
  sessionDuration: number; // minutes
  messageCount: number;
}

/**
 * Analyze a completed chat session using GPT-4
 */
export async function analyzeChatSession(sessionId: string): Promise<ChatAnalysisResult> {
  // Fetch session and messages
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: {
        where: { role: 'user' },
        orderBy: { createdAt: 'asc' }
      },
      athlete: {
        include: {
          performanceMetrics: {
            where: {
              gameDate: {
                gte: new Date() // Only future games
              }
            },
            orderBy: {
              gameDate: 'asc'
            },
            take: 1
          }
        }
      }
    }
  });

  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  if (session.messages.length === 0) {
    // Return default values for empty sessions
    return getDefaultAnalysis(session);
  }

  // Extract athlete messages
  const athleteMessages = session.messages.map(m => m.content);
  const conversationText = athleteMessages.join('\n\n');

  // Check for upcoming games
  const nextGame = session.athlete.performanceMetrics[0];
  const daysUntilGame = nextGame
    ? Math.ceil((nextGame.gameDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isPreGame = daysUntilGame !== null && daysUntilGame <= 7 && daysUntilGame >= 0;

  // Session duration
  const sessionStart = session.messages[0].createdAt;
  const sessionEnd = session.messages[session.messages.length - 1].createdAt;
  const sessionDuration = Math.round(
    (sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60)
  );

  // Use GPT-4 for psychological analysis
  const analysis = await analyzeWithGPT4(conversationText, isPreGame, daysUntilGame);

  return {
    ...analysis,
    sessionDuration,
    messageCount: session.messages.length,
    isPreGame,
    daysUntilGame
  };
}

/**
 * Use GPT-4 to analyze conversation for psychological insights
 */
async function analyzeWithGPT4(
  conversationText: string,
  isPreGame: boolean,
  daysUntilGame: number | null
): Promise<Omit<ChatAnalysisResult, 'sessionDuration' | 'messageCount' | 'isPreGame' | 'daysUntilGame'>> {
  const systemPrompt = `You are an expert sports psychologist analyzing an athlete's conversation for psychological insights.

Analyze the following conversation and extract:

1. **Overall Sentiment** (-1.0 to 1.0):
   - -1.0 = Very negative, anxious, stressed, low confidence
   - 0.0 = Neutral, balanced
   - +1.0 = Very positive, confident, motivated

2. **Emotional Tone** (select ONE):
   - "anxious" - Worried, nervous, stressed about performance
   - "confident" - Self-assured, prepared, optimistic
   - "frustrated" - Irritated, stuck, overwhelmed
   - "motivated" - Energized, driven, focused
   - "neutral" - Balanced, calm, matter-of-fact

3. **Confidence Level** (0-100):
   - Inferred from language patterns, self-talk, belief statements

4. **Topics Discussed** (array of strings):
   - Use these categories when applicable:
     * "performance-anxiety" - Worry about performance, outcomes
     * "team-conflict" - Issues with teammates, social dynamics
     * "coach-pressure" - Pressure from coaching staff
     * "injury-concern" - Physical pain, injury worries
     * "academic-stress" - School workload, exams
     * "family-issues" - Family expectations, personal life
     * "technique-refinement" - Skill work, practice focus
     * "competition-preparation" - Getting ready for games
     * "recovery-rest" - Sleep, recovery, fatigue
     * "mindset-mental" - Mental skills, psychology work
     * "goal-setting" - Future aspirations, targets

5. **Dominant Theme** (string or null):
   - The single most prominent topic or concern

6. **Stress Indicators** (array of strings):
   - Specific phrases or themes indicating stress:
     * "fear of failure"
     * "coach pressure"
     * "performance expectations"
     * "academic overload"
     * "social isolation"
     * "injury anxiety"
     * "comparison to others"

7. **Coping Strategies Mentioned** (array of strings):
   - Techniques or approaches the athlete discussed:
     * "visualization"
     * "breathing exercises"
     * "positive self-talk"
     * "goal setting"
     * "seeking support"
     * "rest and recovery"
     * "talking to coach"

${isPreGame ? `
8. **Pre-Game Mindset** (since game is in ${daysUntilGame} days):
   - "focused" - Clear mind, ready, locked in
   - "anxious" - Nervous, worried, overthinking
   - "overconfident" - Possibly underestimating challenge
   - "distracted" - Mind elsewhere, unfocused
` : '8. **Pre-Game Mindset**: null (no upcoming game)'}

Return ONLY valid JSON in this exact format:
{
  "overallSentiment": <number between -1.0 and 1.0>,
  "emotionalTone": "<string>",
  "confidenceLevel": <number 0-100>,
  "topics": [<array of topic strings>],
  "dominantTheme": "<string or null>",
  "stressIndicators": [<array of stress indicator strings>],
  "copingStrategies": [<array of coping strategy strings>],
  "preGameMindset": "<string or null>"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this athlete conversation:\n\n${conversationText}` }
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Validate and sanitize
    return {
      overallSentiment: clamp(result.overallSentiment ?? 0, -1, 1),
      emotionalTone: validateEmotionalTone(result.emotionalTone),
      confidenceLevel: clamp(result.confidenceLevel ?? 50, 0, 100),
      topics: Array.isArray(result.topics) ? result.topics : [],
      dominantTheme: result.dominantTheme || null,
      stressIndicators: Array.isArray(result.stressIndicators) ? result.stressIndicators : [],
      copingStrategies: Array.isArray(result.copingStrategies) ? result.copingStrategies : [],
      preGameMindset: result.preGameMindset || null
    };
  } catch (error) {
    console.error('Chat analysis failed:', error);
    // Return neutral default on error
    return {
      overallSentiment: 0,
      emotionalTone: 'neutral',
      confidenceLevel: 50,
      topics: [],
      dominantTheme: null,
      stressIndicators: [],
      copingStrategies: [],
      preGameMindset: null
    };
  }
}

/**
 * Store chat analysis result in database
 */
export async function storeChatInsight(
  sessionId: string,
  athleteId: string,
  analysis: ChatAnalysisResult,
  gameDate?: Date
): Promise<void> {
  await prisma.chatInsight.create({
    data: {
      sessionId,
      athleteId,
      overallSentiment: analysis.overallSentiment,
      emotionalTone: analysis.emotionalTone,
      confidenceLevel: analysis.confidenceLevel,
      topics: analysis.topics,
      dominantTheme: analysis.dominantTheme,
      stressIndicators: analysis.stressIndicators,
      copingStrategies: analysis.copingStrategies,
      isPreGame: analysis.isPreGame,
      gameDate,
      daysUntilGame: analysis.daysUntilGame,
      preGameMindset: analysis.preGameMindset,
      sessionDuration: analysis.sessionDuration,
      messageCount: analysis.messageCount
    }
  });
}

/**
 * Analyze and store chat session in one call
 */
export async function analyzeAndStore(sessionId: string): Promise<ChatAnalysisResult> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { athleteId: true }
  });

  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const analysis = await analyzeChatSession(sessionId);

  // Get next game date if exists
  const nextGame = await prisma.performanceMetric.findFirst({
    where: {
      athleteId: session.athleteId,
      gameDate: { gte: new Date() }
    },
    orderBy: { gameDate: 'asc' },
    select: { gameDate: true }
  });

  await storeChatInsight(sessionId, session.athleteId, analysis, nextGame?.gameDate);

  return analysis;
}

/**
 * Get chat insights for an athlete over a date range
 */
export async function getAthleteInsights(
  athleteId: string,
  startDate: Date,
  endDate: Date = new Date()
) {
  return prisma.chatInsight.findMany({
    where: {
      athleteId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Calculate average chat sentiment over a period
 */
export async function getAverageSentiment(
  athleteId: string,
  daysBefore: number = 3
): Promise<number | null> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBefore);

  const insights = await getAthleteInsights(athleteId, startDate);

  if (insights.length === 0) return null;

  const avgSentiment = insights.reduce((sum, i) => sum + i.overallSentiment, 0) / insights.length;
  return Math.round(avgSentiment * 100) / 100;
}

/**
 * Get topics discussed in recent sessions
 */
export async function getRecentTopics(
  athleteId: string,
  daysBefore: number = 7
): Promise<string[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBefore);

  const insights = await getAthleteInsights(athleteId, startDate);

  const allTopics = insights.flatMap(i => i.topics);
  return [...new Set(allTopics)]; // Unique topics
}

// Helper functions
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function validateEmotionalTone(tone: string): ChatAnalysisResult['emotionalTone'] {
  const validTones: ChatAnalysisResult['emotionalTone'][] = [
    'anxious', 'confident', 'frustrated', 'motivated', 'neutral'
  ];
  return validTones.includes(tone as any) ? tone as any : 'neutral';
}

function getDefaultAnalysis(session: any): ChatAnalysisResult {
  return {
    overallSentiment: 0,
    emotionalTone: 'neutral',
    confidenceLevel: 50,
    topics: [],
    dominantTheme: null,
    stressIndicators: [],
    copingStrategies: [],
    isPreGame: false,
    daysUntilGame: null,
    preGameMindset: null,
    sessionDuration: 0,
    messageCount: 0
  };
}
