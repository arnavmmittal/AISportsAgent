/**
 * Weekly Chat Summary Generator
 *
 * Aggregates metadata from athlete chat sessions and generates
 * privacy-first weekly summaries using OpenAI.
 *
 * PRIVACY: Only processes MESSAGE METADATA, never raw chat content
 */

import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { encryptFieldSafe, encryptArray } from './encryption';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Metadata extracted from a single message
 * This is what AthleteAgent already stores in Message.metadata
 */
interface MessageMetadata {
  mood_score?: number; // 1-10
  stress_score?: number; // 1-10
  confidence_score?: number; // 1-10
  sleep_quality?: number; // 1-10
  soreness_score?: number; // 0-10
  themes?: string[]; // Topics discussed
  risk_flags?: string[]; // Detected concerns
  session_stage?: string; // check_in | explore | clarify | plan
}

/**
 * Aggregated metadata for a week of sessions
 */
interface WeeklyAggregatedMetadata {
  athleteId: string;
  weekStart: Date;
  weekEnd: Date;
  sessionCount: number;
  totalMessages: number;

  // Average scores (calculated from metadata)
  avgMoodScore: number | null;
  avgStressScore: number | null;
  avgConfidenceScore: number | null;
  avgSleepQuality: number | null;
  avgSorenessScore: number | null;

  // Frequency counts
  themeFrequency: Record<string, number>;
  riskFlagFrequency: Record<string, number>;

  // Engagement metrics
  avgMessagesPerSession: number;
  avgResponseTime: number; // Seconds between messages
}

/**
 * Structured output from OpenAI summarization
 */
export interface WeeklySummaryOutput {
  // Numeric scores (from aggregated metadata)
  moodScore: number;
  stressScore: number;
  sleepQualityScore: number;
  confidenceScore: number;
  sorenessScore: number;
  workloadPerception: number;

  // Qualitative insights (AI-synthesized)
  keyThemes: string[];
  riskFlags: string[];
  recommendedActions: string[];
  athleteGoalsProgress: Record<string, { status: string; notes: string; confidence: number }>;
  adherenceNotes: string;

  // Engagement metrics
  totalMessages: number;
  sessionCount: number;
  avgResponseTime: number;
  engagementScore: number; // 1-10

  // Metadata
  confidence: number; // AI confidence in summary accuracy (0.0-1.0)
}

/**
 * Aggregate metadata from chat sessions for a given week
 *
 * @param athleteId - Athlete user ID
 * @param weekStart - Start of week (Monday 00:00)
 * @param weekEnd - End of week (Sunday 23:59)
 * @returns Aggregated metadata (NO raw chat content)
 */
async function aggregateWeeklyMetadata(
  athleteId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<WeeklyAggregatedMetadata> {
  // Fetch all sessions from the past week
  const sessions = await prisma.chatSession.findMany({
    where: {
      athleteId,
      createdAt: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    include: {
      Message: {
        where: {
          role: 'assistant', // Only AI responses have metadata
        },
        select: {
          id: true,
          embedding: true, // This contains the metadata JSON
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (sessions.length === 0) {
    return {
      athleteId,
      weekStart,
      weekEnd,
      sessionCount: 0,
      totalMessages: 0,
      avgMoodScore: null,
      avgStressScore: null,
      avgConfidenceScore: null,
      avgSleepQuality: null,
      avgSorenessScore: null,
      themeFrequency: {},
      riskFlagFrequency: {},
      avgMessagesPerSession: 0,
      avgResponseTime: 0,
    };
  }

  // Extract metadata from all messages
  const metadataList: MessageMetadata[] = [];
  const messageTimes: Date[] = [];

  for (const session of sessions) {
    for (const message of session.Message) {
      // embedding field contains metadata (legacy naming)
      const metadata = message.embedding as any as MessageMetadata;
      if (metadata) {
        metadataList.push(metadata);
      }
      messageTimes.push(message.createdAt);
    }
  }

  // Calculate average scores
  const moodScores = metadataList
    .map(m => m.mood_score)
    .filter((s): s is number => s !== undefined);
  const stressScores = metadataList
    .map(m => m.stress_score)
    .filter((s): s is number => s !== undefined);
  const confidenceScores = metadataList
    .map(m => m.confidence_score)
    .filter((s): s is number => s !== undefined);
  const sleepScores = metadataList
    .map(m => m.sleep_quality)
    .filter((s): s is number => s !== undefined);
  const sorenessScores = metadataList
    .map(m => m.soreness_score)
    .filter((s): s is number => s !== undefined);

  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  // Count theme and risk flag frequencies
  const themeFrequency: Record<string, number> = {};
  const riskFlagFrequency: Record<string, number> = {};

  for (const metadata of metadataList) {
    if (metadata.themes) {
      for (const theme of metadata.themes) {
        themeFrequency[theme] = (themeFrequency[theme] || 0) + 1;
      }
    }
    if (metadata.risk_flags) {
      for (const flag of metadata.risk_flags) {
        riskFlagFrequency[flag] = (riskFlagFrequency[flag] || 0) + 1;
      }
    }
  }

  // Calculate average response time
  const responseTimes: number[] = [];
  for (let i = 1; i < messageTimes.length; i++) {
    const diff = (messageTimes[i].getTime() - messageTimes[i - 1].getTime()) / 1000; // seconds
    if (diff < 600) {
      // Only count if < 10 minutes (filter out long breaks)
      responseTimes.push(diff);
    }
  }

  return {
    athleteId,
    weekStart,
    weekEnd,
    sessionCount: sessions.length,
    totalMessages: metadataList.length,
    avgMoodScore: avg(moodScores),
    avgStressScore: avg(stressScores),
    avgConfidenceScore: avg(confidenceScores),
    avgSleepQuality: avg(sleepScores),
    avgSorenessScore: avg(sorenessScores),
    themeFrequency,
    riskFlagFrequency,
    avgMessagesPerSession: metadataList.length / sessions.length,
    avgResponseTime: avg(responseTimes) || 0,
  };
}

/**
 * Generate a weekly summary using OpenAI
 *
 * @param aggregated - Aggregated metadata (NO raw chat content)
 * @param athleteGoals - Current athlete goals (for progress tracking)
 * @returns Structured weekly summary
 */
async function generateSummaryWithAI(
  aggregated: WeeklyAggregatedMetadata,
  athleteGoals: any[]
): Promise<WeeklySummaryOutput> {
  // If no activity, return empty summary
  if (aggregated.sessionCount === 0) {
    return {
      moodScore: 5,
      stressScore: 5,
      sleepQualityScore: 5,
      confidenceScore: 5,
      sorenessScore: 0,
      workloadPerception: 5,
      keyThemes: [],
      riskFlags: [],
      recommendedActions: [],
      athleteGoalsProgress: {},
      adherenceNotes: 'No activity this week',
      totalMessages: 0,
      sessionCount: 0,
      avgResponseTime: 0,
      engagementScore: 0,
      confidence: 1.0,
    };
  }

  // Prepare context for AI (metadata only, NO raw content)
  const topThemes = Object.entries(aggregated.themeFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([theme, count]) => `${theme} (${count} mentions)`);

  const topRiskFlags = Object.entries(aggregated.riskFlagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([flag, count]) => `${flag} (${count} mentions)`);

  const prompt = `You are a sports psychology expert analyzing weekly trends for a collegiate athlete.

AGGREGATED METADATA (Privacy-first - NO raw chat content):
- Session count: ${aggregated.sessionCount}
- Total messages: ${aggregated.totalMessages}
- Average mood score: ${aggregated.avgMoodScore?.toFixed(1) || 'N/A'}/10
- Average stress score: ${aggregated.avgStressScore?.toFixed(1) || 'N/A'}/10
- Average confidence score: ${aggregated.avgConfidenceScore?.toFixed(1) || 'N/A'}/10
- Average sleep quality: ${aggregated.avgSleepQuality?.toFixed(1) || 'N/A'}/10
- Average soreness score: ${aggregated.avgSorenessScore?.toFixed(1) || 'N/A'}/10

Top themes discussed:
${topThemes.join('\n')}

Risk flags detected:
${topRiskFlags.join('\n') || 'None'}

Current goals:
${athleteGoals.map(g => `- ${g.title} (${g.status})`).join('\n') || 'No active goals'}

TASK: Generate a structured weekly summary JSON with:
1. Synthesized numeric scores (1-10 scale)
2. 3-5 key themes (high-level patterns)
3. Risk flags (if any concerning patterns)
4. 2-4 recommended actions (specific, actionable)
5. Goal progress assessment
6. Adherence notes (engagement with suggested techniques)
7. Engagement score (1-10 based on frequency and depth)
8. Your confidence in the summary (0.0-1.0)

IMPORTANT: Keep themes GENERAL (e.g., "Pre-game anxiety", NOT specific examples or quotes).

Return ONLY a JSON object with this structure:
{
  "moodScore": number,
  "stressScore": number,
  "sleepQualityScore": number,
  "confidenceScore": number,
  "sorenessScore": number,
  "workloadPerception": number,
  "keyThemes": string[],
  "riskFlags": string[],
  "recommendedActions": string[],
  "athleteGoalsProgress": {},
  "adherenceNotes": string,
  "engagementScore": number,
  "confidence": number
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are a sports psychology expert creating concise, privacy-preserving weekly summaries.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Low temperature for consistency
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    const summaryData = JSON.parse(content);

    return {
      ...summaryData,
      totalMessages: aggregated.totalMessages,
      sessionCount: aggregated.sessionCount,
      avgResponseTime: aggregated.avgResponseTime,
    };
  } catch (error) {
    console.error('[Summarizer] AI generation failed:', error);

    // Fallback to basic aggregation if AI fails
    return {
      moodScore: aggregated.avgMoodScore || 5,
      stressScore: aggregated.avgStressScore || 5,
      sleepQualityScore: aggregated.avgSleepQuality || 5,
      confidenceScore: aggregated.avgConfidenceScore || 5,
      sorenessScore: aggregated.avgSorenessScore || 0,
      workloadPerception: 5,
      keyThemes: Object.keys(aggregated.themeFrequency).slice(0, 3),
      riskFlags: Object.keys(aggregated.riskFlagFrequency),
      recommendedActions: [],
      athleteGoalsProgress: {},
      adherenceNotes: 'Summary generated from aggregated data',
      totalMessages: aggregated.totalMessages,
      sessionCount: aggregated.sessionCount,
      avgResponseTime: aggregated.avgResponseTime,
      engagementScore: Math.min(10, aggregated.sessionCount * 2),
      confidence: 0.5,
    };
  }
}

/**
 * Generate and store a weekly chat summary for an athlete
 *
 * @param athleteId - Athlete user ID
 * @param weekStart - Start of week (Monday 00:00)
 * @param weekEnd - End of week (Sunday 23:59)
 * @returns Created ChatSummary record
 */
export async function generateWeeklySummary(
  athleteId: string,
  weekStart: Date,
  weekEnd: Date
) {
  // Check if athlete has consented
  const athlete = await prisma.athlete.findUnique({
    where: { userId: athleteId },
    select: { consentChatSummaries: true },
  });

  if (!athlete?.consentChatSummaries) {
    console.log(`[Summarizer] Athlete ${athleteId} has not consented. Skipping.`);
    return null;
  }

  // Aggregate metadata from sessions
  const aggregated = await aggregateWeeklyMetadata(athleteId, weekStart, weekEnd);

  if (aggregated.sessionCount === 0) {
    console.log(`[Summarizer] No activity for athlete ${athleteId}. Skipping.`);
    return null;
  }

  // Fetch athlete goals for progress tracking
  const goals = await prisma.goal.findMany({
    where: {
      athleteId,
      status: 'IN_PROGRESS',
    },
    select: {
      id: true,
      title: true,
      status: true,
    },
  });

  // Generate AI summary
  const summaryOutput = await generateSummaryWithAI(aggregated, goals);

  // Encrypt sensitive fields before storing
  const encryptedAdherenceNotes = encryptFieldSafe(summaryOutput.adherenceNotes);
  const encryptedKeyThemes = encryptArray(summaryOutput.keyThemes);
  const encryptedRecommendedActions = encryptArray(summaryOutput.recommendedActions);

  // Calculate expiration date (12 weeks from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 12 * 7);

  // Create ChatSummary record
  const chatSummary = await prisma.chatSummary.create({
    data: {
      athleteId,
      summaryType: 'WEEKLY',
      weekStart,
      weekEnd,

      // Summary text (non-encrypted, general)
      summary: `Weekly activity: ${aggregated.sessionCount} sessions, ${aggregated.totalMessages} messages. Key focus: ${summaryOutput.keyThemes.slice(0, 2).join(', ')}`,

      // Encrypted qualitative fields
      keyThemes: encryptedKeyThemes,
      adherenceNotes: encryptedAdherenceNotes,
      recommendedActions: encryptedRecommendedActions,
      riskFlags: summaryOutput.riskFlags, // Not encrypted (needed for penalties)

      // Numeric scores (not encrypted - needed for aggregation)
      moodScore: summaryOutput.moodScore,
      stressScore: summaryOutput.stressScore,
      sleepQualityScore: summaryOutput.sleepQualityScore,
      confidenceScore: summaryOutput.confidenceScore,
      sorenessScore: summaryOutput.sorenessScore,
      workloadPerception: summaryOutput.workloadPerception,

      // Metadata
      totalMessages: summaryOutput.totalMessages,
      sessionCount: summaryOutput.sessionCount,
      avgResponseTime: summaryOutput.avgResponseTime,
      engagementScore: summaryOutput.engagementScore,

      // Privacy
      redactedContent: true, // Always true for weekly summaries
      messageCount: aggregated.totalMessages,

      // Data retention
      expiresAt,

      // Audit
      generatedAt: new Date(),
      emotionalState: null,
      actionItems: null,
      athleteGoalsProgress: summaryOutput.athleteGoalsProgress,
    },
  });

  console.log(`[Summarizer] Generated weekly summary ${chatSummary.id} for athlete ${athleteId}`);

  return chatSummary;
}
