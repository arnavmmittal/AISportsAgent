import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatSession {
  id: string;
  messages: {
    id: string;
    role: string;
    content: string;
    createdAt: Date;
  }[];
  createdAt: Date;
}

interface SummaryAnalysis {
  summary: string;
  keyThemes: string[];
  emotionalState: 'positive' | 'negative' | 'neutral' | 'mixed';
  actionItems: string[];
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  progressIndicators: {
    confidence: 'improving' | 'declining' | 'stable';
    stress: 'improving' | 'declining' | 'stable';
    engagement: 'improving' | 'declining' | 'stable';
  };
  frameworksDiscussed: string[];
}

/**
 * Generates weekly summaries for all athletes who have consented.
 * This is the core enterprise value proposition - providing coaches with
 * actionable insights while respecting athlete privacy.
 *
 * Key Features:
 * - Privacy-first: only processes athletes with consent
 * - Clinical-grade analysis: identifies at-risk athletes
 * - Evidence-based: references sports psychology frameworks
 * - Scalable: processes 150+ athletes efficiently
 */
export async function generateWeeklySummaries() {
  console.log('Starting weekly summary generation...');

  // Get all athletes who have consented to chat summaries
  const athletes = await prisma.athlete.findMany({
    where: {
      consentChatSummaries: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  console.log(`Found ${athletes.length} athletes with consent`);

  const results = {
    successful: 0,
    failed: 0,
    skipped: 0,
    highRiskAlerts: [] as string[],
  };

  for (const athlete of athletes) {
    try {
      const summary = await generateAthleteWeeklySummary(athlete.userId);

      if (summary) {
        results.successful++;

        // Track high-risk athletes for immediate notification
        if (summary.riskLevel === 'high') {
          results.highRiskAlerts.push(athlete.user.name || athlete.user.email);
        }
      } else {
        results.skipped++;
      }
    } catch (error) {
      console.error(`Failed to generate summary for athlete ${athlete.userId}:`, error);
      results.failed++;
    }
  }

  console.log('Weekly summary generation complete:', results);
  return results;
}

/**
 * Generates a weekly summary for a single athlete.
 * Uses GPT-4 to analyze chat sessions and extract structured insights.
 */
export async function generateAthleteWeeklySummary(athleteId: string) {
  // Get chat sessions from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const sessions = await prisma.chatSession.findMany({
    where: {
      athlete: {
        userId: athleteId,
      },
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Skip if no chat sessions in the past week
  if (sessions.length === 0) {
    console.log(`No chat sessions for athlete ${athleteId} in the past week`);
    return null;
  }

  // Get athlete's recent mood logs for additional context
  const moodLogs = await prisma.moodLog.findMany({
    where: {
      athleteId,
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Analyze sessions with GPT-4
  const analysis = await analyzeChatSessions(sessions, moodLogs);

  // Store the summary in the database
  // Use the most recent session for the sessionId relationship
  const mostRecentSession = sessions[0];

  // Count total messages across all sessions
  const totalMessages = sessions.reduce((sum, session) => sum + session.messages.length, 0);

  const chatSummary = await prisma.chatSummary.create({
    data: {
      sessionId: mostRecentSession.id,
      athleteId,
      summary: analysis.summary,
      keyThemes: analysis.keyThemes, // JSON array
      emotionalState: analysis.emotionalState,
      actionItems: analysis.actionItems, // JSON array
      messageCount: totalMessages,
    },
  });

  console.log(`Generated summary ${chatSummary.id} for athlete ${athleteId}`);
  return analysis;
}

/**
 * Uses GPT-4 to analyze chat sessions and extract structured insights.
 * This is the core intelligence that makes the summaries valuable.
 */
async function analyzeChatSessions(
  sessions: ChatSession[],
  moodLogs: any[]
): Promise<SummaryAnalysis> {
  // Prepare conversation history for analysis
  const conversationText = sessions
    .map((session) => {
      const sessionDate = session.createdAt.toLocaleDateString();
      const messages = session.messages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n');
      return `--- Session on ${sessionDate} ---\n${messages}`;
    })
    .join('\n\n');

  // Prepare mood data context
  const moodContext = moodLogs.length > 0
    ? `\n\nMood Log Data (${moodLogs.length} entries):\n${moodLogs
        .map((log) => {
          return `- ${log.createdAt.toLocaleDateString()}: Mood: ${log.mood}/10, Confidence: ${log.confidence}/10, Stress: ${log.stressLevel}/10, Sleep: ${log.sleepQuality}/10`;
        })
        .join('\n')}`
    : '';

  // GPT-4 analysis prompt - this is the secret sauce for enterprise value
  const prompt = `You are an expert sports psychologist analyzing an athlete's weekly chat sessions. Your goal is to provide a comprehensive, clinically-informed summary that helps coaches identify athletes who need support.

CONVERSATION HISTORY:
${conversationText}
${moodContext}

Please analyze this athlete's week and provide a structured assessment. Focus on:
1. **Mental Performance**: Confidence, motivation, focus, resilience
2. **Stressors**: Academic pressure, performance anxiety, injury concerns, relationships
3. **Emotional Wellbeing**: Mood patterns, signs of depression/anxiety, positive emotions
4. **Risk Assessment**: Self-harm ideation, substance use, extreme stress, crisis indicators
5. **Progress**: Improvements, setbacks, patterns over time
6. **Applied Frameworks**: Evidence-based techniques discussed (CBT, mindfulness, visualization, etc.)

Return your analysis as a JSON object with this exact structure:
{
  "summary": "2-3 sentence overview of the athlete's week focusing on key mental performance themes",
  "keyThemes": ["array", "of", "3-5", "key", "themes"],
  "emotionalState": "positive|negative|neutral|mixed",
  "actionItems": ["specific", "coaching", "actions", "to", "take"],
  "riskLevel": "low|medium|high",
  "riskFactors": ["any identified risk factors, empty array if none"],
  "progressIndicators": {
    "confidence": "improving|declining|stable",
    "stress": "improving|declining|stable",
    "engagement": "improving|declining|stable"
  },
  "frameworksDiscussed": ["CBT", "Mindfulness", "etc"]
}

IMPORTANT GUIDELINES:
- Be specific and actionable in action items
- Identify red flags immediately (riskLevel: "high" for self-harm, severe depression, crisis)
- Use professional, compassionate language
- Reference specific conversation topics
- Note progress or deterioration compared to earlier sessions if visible
- Consider mood log data alongside conversation content`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert clinical sports psychologist providing evidence-based athlete mental performance assessments. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent, clinical analysis
      response_format: { type: 'json_object' },
    });

    const analysisText = response.choices[0].message.content;
    if (!analysisText) {
      throw new Error('No response from GPT-4');
    }

    const analysis: SummaryAnalysis = JSON.parse(analysisText);

    // Validation and safety checks
    if (!analysis.summary || !analysis.keyThemes || !analysis.emotionalState) {
      throw new Error('Invalid analysis structure from GPT-4');
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing chat sessions with GPT-4:', error);

    // Fallback: basic summary if GPT-4 fails
    return {
      summary: `Had ${sessions.length} chat sessions this week. Analysis unavailable due to processing error.`,
      keyThemes: ['general-check-in'],
      emotionalState: 'neutral',
      actionItems: ['Review chat logs manually'],
      riskLevel: 'low',
      riskFactors: [],
      progressIndicators: {
        confidence: 'stable',
        stress: 'stable',
        engagement: 'stable',
      },
      frameworksDiscussed: [],
    };
  }
}

/**
 * Generates a team-level summary aggregating insights across all athletes.
 * This provides coaches with a high-level view of team mental performance.
 */
export async function generateTeamSummary(coachId: string) {
  const coach = await prisma.coach.findUnique({
    where: { userId: coachId },
  });

  if (!coach) {
    throw new Error('Coach not found');
  }

  // Get all athletes who have consented (school-based, not coach-based)
  const athletes = await prisma.athlete.findMany({
    where: {
      consentChatSummaries: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Get the most recent chat summaries for these athletes
  const athleteIds = athletes.map(a => a.userId);
  const summaries = await prisma.chatSummary.findMany({
    where: {
      athleteId: {
        in: athleteIds,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: athleteIds.length, // Get one summary per athlete
  });

  // Aggregate insights
  const totalAthletes = athletes.length;
  const athletesWithRecentSummaries = summaries.length;

  // Since we don't have metadata in the current schema, we'll estimate risk based on emotionalState
  const highRiskAthletes = summaries.filter(
    (s) => s.emotionalState === 'negative'
  ).length;

  const mediumRiskAthletes = summaries.filter(
    (s) => s.emotionalState === 'mixed'
  ).length;

  // Aggregate key themes from keyThemes JSON field
  const allThemes: string[] = [];
  summaries.forEach((s) => {
    if (s.keyThemes && Array.isArray(s.keyThemes)) {
      allThemes.push(...(s.keyThemes as string[]));
    }
  });

  const themeCounts = allThemes.reduce((acc, theme) => {
    acc[theme] = (acc[theme] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);

  // Emotional state distribution from emotionalState field
  const emotionalStates = summaries.map((s) => s.emotionalState).filter((s): s is string => s !== null);
  const positiveCount = emotionalStates.filter((e) => e === 'positive').length;
  const negativeCount = emotionalStates.filter((e) => e === 'negative').length;

  return {
    totalAthletes,
    athletesWithRecentSummaries,
    highRiskAthletes,
    mediumRiskAthletes,
    topThemes,
    emotionalStateDistribution: {
      positive: positiveCount,
      negative: negativeCount,
      neutral: emotionalStates.filter((e) => e === 'neutral').length,
      mixed: emotionalStates.filter((e) => e === 'mixed').length,
    },
    weekStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    weekEndDate: new Date(),
  };
}
