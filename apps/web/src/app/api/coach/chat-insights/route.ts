/**
 * Coach Chat Insights API
 *
 * Aggregates chat analysis across all team athletes to surface:
 * - Top conversation themes (what athletes are worried about)
 * - Team sentiment trends (improving/declining)
 * - Disengagement signals (athletes not chatting)
 * - Athletes mentioning concerning topics
 *
 * This enables coaches to understand team-wide psychological patterns
 * without reading individual conversations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ThemeCount {
  theme: string;
  count: number;
  athletes: string[];
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface SentimentTrend {
  date: string;
  avgSentiment: number;
  sessionCount: number;
}

interface DisengagedAthlete {
  id: string;
  name: string;
  sport: string | null;
  daysSinceChat: number;
  lastChatDate: string | null;
}

interface ConcerningAthlete {
  id: string;
  name: string;
  sport: string | null;
  concerningTopics: string[];
  avgSentiment: number;
  recentSessions: number;
}

interface ChatInsightsResponse {
  teamSentiment: {
    current: number;
    trend: 'improving' | 'stable' | 'declining';
    weeklyChange: number;
  };
  topThemes: ThemeCount[];
  sentimentHistory: SentimentTrend[];
  disengagedAthletes: DisengagedAthlete[];
  concerningAthletes: ConcerningAthlete[];
  stats: {
    totalSessions: number;
    athletesWithChats: number;
    avgSessionsPerAthlete: number;
    chatEngagementRate: number;
  };
  generatedAt: string;
}

// Concerning topic keywords that warrant coach attention
const CONCERNING_TOPICS = [
  'performance-anxiety',
  'team-conflict',
  'coach-pressure',
  'injury-concern',
  'family-issues',
];

const CONCERNING_STRESS_INDICATORS = [
  'fear of failure',
  'social isolation',
  'performance expectations',
  'comparison to others',
];

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get coach info
    const coach = await prisma.coach.findUnique({
      where: { userId: user.id },
      select: { id: true, schoolId: true },
    });

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    // Get date ranges
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all athletes under this coach with consent
    const athletes = await prisma.athlete.findMany({
      where: {
        schoolId: coach.schoolId,
        coachConsent: true,
      },
      select: {
        userId: true,
        User: { select: { name: true } },
        sport: true,
      },
    });

    const athleteIds = athletes.map(a => a.userId);
    const athleteMap = new Map(athletes.map(a => [a.userId, {
      name: a.User.name || 'Unknown',
      sport: a.sport
    }]));

    // Fetch all chat insights from the last 30 days
    const allInsights = await prisma.chatInsight.findMany({
      where: {
        athleteId: { in: athleteIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get last chat session for each athlete (for disengagement detection)
    const lastSessions = await prisma.chatSession.groupBy({
      by: ['athleteId'],
      where: {
        athleteId: { in: athleteIds },
      },
      _max: {
        createdAt: true,
      },
    });
    const lastSessionMap = new Map(lastSessions.map(s => [s.athleteId, s._max.createdAt]));

    // 1. Calculate team sentiment
    const recentInsights = allInsights.filter(i => i.createdAt >= sevenDaysAgo);
    const olderInsights = allInsights.filter(i =>
      i.createdAt >= fourteenDaysAgo && i.createdAt < sevenDaysAgo
    );

    const currentAvgSentiment = recentInsights.length > 0
      ? recentInsights.reduce((sum, i) => sum + i.overallSentiment, 0) / recentInsights.length
      : 0;

    const previousAvgSentiment = olderInsights.length > 0
      ? olderInsights.reduce((sum, i) => sum + i.overallSentiment, 0) / olderInsights.length
      : 0;

    const sentimentChange = currentAvgSentiment - previousAvgSentiment;
    const sentimentTrend: 'improving' | 'stable' | 'declining' =
      sentimentChange > 0.15 ? 'improving' :
      sentimentChange < -0.15 ? 'declining' : 'stable';

    // 2. Aggregate themes across team
    const themeCountMap = new Map<string, { count: number; athletes: Set<string>; recentCount: number; olderCount: number }>();

    for (const insight of allInsights) {
      const isRecent = insight.createdAt >= sevenDaysAgo;
      for (const topic of insight.topics) {
        const existing = themeCountMap.get(topic) || {
          count: 0,
          athletes: new Set<string>(),
          recentCount: 0,
          olderCount: 0
        };
        existing.count++;
        existing.athletes.add(insight.athleteId);
        if (isRecent) {
          existing.recentCount++;
        } else if (insight.createdAt >= fourteenDaysAgo) {
          existing.olderCount++;
        }
        themeCountMap.set(topic, existing);
      }
    }

    const topThemes: ThemeCount[] = Array.from(themeCountMap.entries())
      .map(([theme, data]) => ({
        theme,
        count: data.count,
        athletes: Array.from(data.athletes).map(id => athleteMap.get(id)?.name || 'Unknown'),
        trend: data.recentCount > data.olderCount * 1.3 ? 'increasing' as const :
               data.recentCount < data.olderCount * 0.7 ? 'decreasing' as const : 'stable' as const,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 3. Calculate daily sentiment history (last 14 days)
    const sentimentByDay = new Map<string, { sum: number; count: number }>();
    for (const insight of allInsights.filter(i => i.createdAt >= fourteenDaysAgo)) {
      const dateKey = insight.createdAt.toISOString().split('T')[0];
      const existing = sentimentByDay.get(dateKey) || { sum: 0, count: 0 };
      existing.sum += insight.overallSentiment;
      existing.count++;
      sentimentByDay.set(dateKey, existing);
    }

    const sentimentHistory: SentimentTrend[] = Array.from(sentimentByDay.entries())
      .map(([date, data]) => ({
        date,
        avgSentiment: Math.round((data.sum / data.count) * 100) / 100,
        sessionCount: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 4. Find disengaged athletes (no chat in 7+ days)
    const disengagedAthletes: DisengagedAthlete[] = [];
    for (const athlete of athletes) {
      const lastChat = lastSessionMap.get(athlete.userId);
      const daysSinceChat = lastChat
        ? Math.floor((now.getTime() - lastChat.getTime()) / (24 * 60 * 60 * 1000))
        : 999;

      if (daysSinceChat >= 7) {
        disengagedAthletes.push({
          id: athlete.userId,
          name: athlete.User.name || 'Unknown',
          sport: athlete.sport,
          daysSinceChat,
          lastChatDate: lastChat?.toISOString() || null,
        });
      }
    }
    disengagedAthletes.sort((a, b) => b.daysSinceChat - a.daysSinceChat);

    // 5. Find athletes with concerning patterns
    const athleteInsightMap = new Map<string, typeof allInsights>();
    for (const insight of recentInsights) {
      const existing = athleteInsightMap.get(insight.athleteId) || [];
      existing.push(insight);
      athleteInsightMap.set(insight.athleteId, existing);
    }

    const concerningAthletes: ConcerningAthlete[] = [];
    for (const [athleteId, insights] of athleteInsightMap.entries()) {
      const avgSentiment = insights.reduce((sum, i) => sum + i.overallSentiment, 0) / insights.length;

      // Collect concerning topics
      const concerningTopics = new Set<string>();
      for (const insight of insights) {
        for (const topic of insight.topics) {
          if (CONCERNING_TOPICS.includes(topic)) {
            concerningTopics.add(topic);
          }
        }
        for (const indicator of insight.stressIndicators) {
          if (CONCERNING_STRESS_INDICATORS.includes(indicator)) {
            concerningTopics.add(indicator);
          }
        }
      }

      // Flag if negative sentiment OR concerning topics
      if (avgSentiment < -0.2 || concerningTopics.size >= 2) {
        const athleteInfo = athleteMap.get(athleteId);
        concerningAthletes.push({
          id: athleteId,
          name: athleteInfo?.name || 'Unknown',
          sport: athleteInfo?.sport || null,
          concerningTopics: Array.from(concerningTopics),
          avgSentiment: Math.round(avgSentiment * 100) / 100,
          recentSessions: insights.length,
        });
      }
    }
    concerningAthletes.sort((a, b) => a.avgSentiment - b.avgSentiment);

    // 6. Calculate engagement stats
    const athletesWithChats = new Set(allInsights.map(i => i.athleteId)).size;
    const totalSessions = allInsights.length;
    const chatEngagementRate = athletes.length > 0
      ? Math.round((athletesWithChats / athletes.length) * 100)
      : 0;

    const chatInsightsData: ChatInsightsResponse = {
      teamSentiment: {
        current: Math.round(currentAvgSentiment * 100) / 100,
        trend: sentimentTrend,
        weeklyChange: Math.round(sentimentChange * 100) / 100,
      },
      topThemes,
      sentimentHistory,
      disengagedAthletes: disengagedAthletes.slice(0, 10),
      concerningAthletes: concerningAthletes.slice(0, 10),
      stats: {
        totalSessions,
        athletesWithChats,
        avgSessionsPerAthlete: athletesWithChats > 0
          ? Math.round((totalSessions / athletesWithChats) * 10) / 10
          : 0,
        chatEngagementRate,
      },
      generatedAt: now.toISOString(),
    };

    return NextResponse.json(chatInsightsData);

  } catch (error) {
    console.error('Error fetching chat insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat insights' },
      { status: 500 }
    );
  }
}
