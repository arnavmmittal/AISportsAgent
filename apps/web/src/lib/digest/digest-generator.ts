/**
 * Weekly Digest Generator
 *
 * Aggregates athlete data into actionable insights for coaches managing
 * large rosters (150+ athletes). Focuses on patterns and athletes
 * needing attention rather than raw data dumps.
 */

import { prisma } from '@/lib/prisma';

export interface DigestData {
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  summary: {
    totalAthletes: number;
    activeAthletes: number; // Athletes with activity this period
    engagementRate: number; // Percentage of active athletes
  };
  highlights: DigestHighlight[];
  alerts: DigestAlert[];
  moodTrends: MoodTrendSummary;
  chatActivity: ChatActivitySummary;
  touchpoints: TouchpointSummary;
  athletesNeedingAttention: AthleteAttentionItem[];
  topPerformers: AthletePerformanceItem[];
}

export interface DigestHighlight {
  type: 'positive' | 'neutral' | 'concern';
  icon: string;
  title: string;
  description: string;
  metric?: string;
}

export interface DigestAlert {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  athleteName: string;
  athleteId: string;
  message: string;
  timestamp: Date;
}

export interface MoodTrendSummary {
  averageMood: number;
  moodChange: number; // Change from previous period
  logsThisPeriod: number;
  athletesReporting: number;
  trendDirection: 'up' | 'down' | 'stable';
  concerningAthletes: number; // Athletes with consistently low mood
}

export interface ChatActivitySummary {
  totalSessions: number;
  totalMessages: number;
  averageSessionLength: number;
  topTopics: { topic: string; count: number }[];
  sentimentOverview: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface TouchpointSummary {
  completed: number;
  pending: number;
  overdue: number;
  sentThisPeriod: number;
}

export interface AthleteAttentionItem {
  athleteId: string;
  athleteName: string;
  sport: string;
  reasons: string[];
  priority: 'urgent' | 'high' | 'medium';
  lastContact?: Date;
}

export interface AthletePerformanceItem {
  athleteId: string;
  athleteName: string;
  sport: string;
  achievement: string;
  metrics?: Record<string, number>;
}

/**
 * Generate digest data for a coach
 */
export async function generateDigestData(
  coachId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<DigestData> {
  // Get all athletes for this coach
  const relations = await prisma.coachAthleteRelation.findMany({
    where: {
      coachId,
      consentGranted: true,
    },
    include: {
      Athlete: {
        include: {
          User: { select: { name: true } },
        },
      },
    },
  });

  const athleteIds = relations.map((r) => r.athleteId);
  const totalAthletes = relations.length;

  if (totalAthletes === 0) {
    return createEmptyDigest(periodStart, periodEnd);
  }

  // Parallel data fetching for performance
  const [
    moodLogs,
    chatSessions,
    alerts,
    touchpoints,
    readinessScores,
  ] = await Promise.all([
    // Mood logs in period
    prisma.moodLog.findMany({
      where: {
        athleteId: { in: athleteIds },
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      include: {
        Athlete: {
          include: { User: { select: { name: true } } },
        },
      },
    }),
    // Chat sessions in period
    prisma.chatSession.findMany({
      where: {
        athleteId: { in: athleteIds },
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      include: {
        Athlete: {
          include: { User: { select: { name: true } } },
        },
        Message: true,
        ConversationInsight: true,
      },
    }),
    // Crisis alerts in period
    prisma.crisisAlert.findMany({
      where: {
        athleteId: { in: athleteIds },
        detectedAt: { gte: periodStart, lte: periodEnd },
      },
      include: {
        Athlete: {
          include: { User: { select: { name: true } } },
        },
      },
      orderBy: { detectedAt: 'desc' },
    }),
    // Touchpoints for this coach
    prisma.coachTouchpoint.findMany({
      where: {
        coachId,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    }),
    // Readiness scores
    prisma.readinessScore.findMany({
      where: {
        athleteId: { in: athleteIds },
        calculatedAt: { gte: periodStart, lte: periodEnd },
      },
      include: {
        Athlete: {
          include: { User: { select: { name: true } } },
        },
      },
    }),
  ]);

  // Calculate active athletes
  const activeAthleteIds = new Set([
    ...moodLogs.map((m) => m.athleteId),
    ...chatSessions.map((c) => c.athleteId),
  ]);
  const activeAthletes = activeAthleteIds.size;

  // Mood trends
  const moodTrends = calculateMoodTrends(moodLogs, totalAthletes);

  // Chat activity
  const chatActivity = calculateChatActivity(chatSessions);

  // Touchpoint summary
  const touchpointSummary = calculateTouchpointSummary(touchpoints);

  // Generate highlights
  const highlights = generateHighlights(
    moodTrends,
    chatActivity,
    touchpointSummary,
    totalAthletes,
    activeAthletes
  );

  // Format alerts
  const digestAlerts = alerts.map((alert) => ({
    severity: alert.severity as 'HIGH' | 'MEDIUM' | 'LOW',
    athleteName: alert.Athlete?.User?.name || 'Unknown Athlete',
    athleteId: alert.athleteId,
    message: `Crisis alert detected`,
    timestamp: alert.detectedAt,
  }));

  // Athletes needing attention
  const athletesNeedingAttention = identifyAthletesNeedingAttention(
    relations,
    moodLogs,
    chatSessions,
    readinessScores,
    periodStart
  );

  // Top performers (athletes showing improvement)
  const topPerformers = identifyTopPerformers(
    relations,
    moodLogs,
    readinessScores
  );

  return {
    period: {
      start: periodStart,
      end: periodEnd,
      label: formatPeriodLabel(periodStart, periodEnd),
    },
    summary: {
      totalAthletes,
      activeAthletes,
      engagementRate: Math.round((activeAthletes / totalAthletes) * 100),
    },
    highlights,
    alerts: digestAlerts,
    moodTrends,
    chatActivity,
    touchpoints: touchpointSummary,
    athletesNeedingAttention,
    topPerformers,
  };
}

function createEmptyDigest(periodStart: Date, periodEnd: Date): DigestData {
  return {
    period: {
      start: periodStart,
      end: periodEnd,
      label: formatPeriodLabel(periodStart, periodEnd),
    },
    summary: {
      totalAthletes: 0,
      activeAthletes: 0,
      engagementRate: 0,
    },
    highlights: [{
      type: 'neutral',
      icon: 'users',
      title: 'No Athletes Connected',
      description: 'Share your invite code to connect with athletes.',
    }],
    alerts: [],
    moodTrends: {
      averageMood: 0,
      moodChange: 0,
      logsThisPeriod: 0,
      athletesReporting: 0,
      trendDirection: 'stable',
      concerningAthletes: 0,
    },
    chatActivity: {
      totalSessions: 0,
      totalMessages: 0,
      averageSessionLength: 0,
      topTopics: [],
      sentimentOverview: { positive: 0, neutral: 0, negative: 0 },
    },
    touchpoints: {
      completed: 0,
      pending: 0,
      overdue: 0,
      sentThisPeriod: 0,
    },
    athletesNeedingAttention: [],
    topPerformers: [],
  };
}

function calculateMoodTrends(
  moodLogs: Array<{
    athleteId: string;
    mood: number;
    confidence: number | null;
    stress: number | null;
    createdAt: Date;
  }>,
  totalAthletes: number
): MoodTrendSummary {
  if (moodLogs.length === 0) {
    return {
      averageMood: 0,
      moodChange: 0,
      logsThisPeriod: 0,
      athletesReporting: 0,
      trendDirection: 'stable',
      concerningAthletes: 0,
    };
  }

  const athletesReporting = new Set(moodLogs.map((m) => m.athleteId)).size;
  const averageMood = moodLogs.reduce((acc, m) => acc + m.mood, 0) / moodLogs.length;

  // Count athletes with consistently low mood (average < 3)
  const athleteMoods = new Map<string, number[]>();
  moodLogs.forEach((log) => {
    const existing = athleteMoods.get(log.athleteId) || [];
    existing.push(log.mood);
    athleteMoods.set(log.athleteId, existing);
  });

  const concerningAthletes = Array.from(athleteMoods.entries()).filter(([_, moods]) => {
    const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
    return avg < 3;
  }).length;

  return {
    averageMood: Math.round(averageMood * 10) / 10,
    moodChange: 0, // Would need previous period data
    logsThisPeriod: moodLogs.length,
    athletesReporting,
    trendDirection: 'stable',
    concerningAthletes,
  };
}

function calculateChatActivity(
  sessions: Array<{
    id: string;
    athleteId: string;
    Message?: Array<{ role: string }>;
    ConversationInsight?: Array<{ themes: unknown; sentiment: number }>;
  }>
): ChatActivitySummary {
  const totalSessions = sessions.length;
  const totalMessages = sessions.reduce((acc, s) => acc + (s.Message?.length || 0), 0);
  const averageSessionLength = totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0;

  // Aggregate sentiment
  const insights = sessions.flatMap((s) => s.ConversationInsight || []);
  const sentimentOverview = {
    positive: insights.filter((i) => i.sentiment > 0.3).length,
    neutral: insights.filter((i) => i.sentiment >= -0.3 && i.sentiment <= 0.3).length,
    negative: insights.filter((i) => i.sentiment < -0.3).length,
  };

  // Extract topics from themes
  const topicCounts = new Map<string, number>();
  insights.forEach((insight) => {
    if (Array.isArray(insight.themes)) {
      (insight.themes as string[]).forEach((theme: string) => {
        topicCounts.set(theme, (topicCounts.get(theme) || 0) + 1);
      });
    }
  });

  const topTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));

  return {
    totalSessions,
    totalMessages,
    averageSessionLength,
    topTopics,
    sentimentOverview,
  };
}

function calculateTouchpointSummary(
  touchpoints: Array<{ status: string }>
): TouchpointSummary {
  return {
    completed: touchpoints.filter((t) => t.status === 'COMPLETED').length,
    pending: touchpoints.filter((t) => t.status === 'PENDING').length,
    overdue: touchpoints.filter((t) => t.status === 'OVERDUE').length,
    sentThisPeriod: touchpoints.length,
  };
}

function generateHighlights(
  moodTrends: MoodTrendSummary,
  chatActivity: ChatActivitySummary,
  touchpoints: TouchpointSummary,
  totalAthletes: number,
  activeAthletes: number
): DigestHighlight[] {
  const highlights: DigestHighlight[] = [];

  // Engagement highlight
  const engagementRate = Math.round((activeAthletes / totalAthletes) * 100);
  if (engagementRate >= 70) {
    highlights.push({
      type: 'positive',
      icon: 'trending-up',
      title: 'Strong Team Engagement',
      description: `${engagementRate}% of your athletes were active this week.`,
      metric: `${activeAthletes}/${totalAthletes}`,
    });
  } else if (engagementRate < 40) {
    highlights.push({
      type: 'concern',
      icon: 'alert-circle',
      title: 'Low Team Engagement',
      description: `Only ${engagementRate}% of athletes were active. Consider sending check-ins.`,
      metric: `${activeAthletes}/${totalAthletes}`,
    });
  }

  // Mood highlight
  if (moodTrends.logsThisPeriod > 0) {
    if (moodTrends.averageMood >= 4) {
      highlights.push({
        type: 'positive',
        icon: 'smile',
        title: 'Team Mood is High',
        description: `Average mood rating of ${moodTrends.averageMood}/5 this week.`,
        metric: `${moodTrends.averageMood}/5`,
      });
    } else if (moodTrends.averageMood < 3) {
      highlights.push({
        type: 'concern',
        icon: 'frown',
        title: 'Team Mood Needs Attention',
        description: `Average mood is ${moodTrends.averageMood}/5. ${moodTrends.concerningAthletes} athletes showing consistently low mood.`,
        metric: `${moodTrends.averageMood}/5`,
      });
    }
  }

  // Chat activity highlight
  if (chatActivity.totalSessions > 0) {
    highlights.push({
      type: 'neutral',
      icon: 'message-circle',
      title: 'AI Coaching Sessions',
      description: `${chatActivity.totalSessions} sessions with ${chatActivity.totalMessages} messages exchanged.`,
      metric: `${chatActivity.totalSessions}`,
    });
  }

  // Overdue touchpoints
  if (touchpoints.overdue > 0) {
    highlights.push({
      type: 'concern',
      icon: 'clock',
      title: 'Overdue Follow-ups',
      description: `${touchpoints.overdue} scheduled touchpoints are past due.`,
      metric: `${touchpoints.overdue}`,
    });
  }

  return highlights;
}

function identifyAthletesNeedingAttention(
  relations: Array<{
    athleteId: string;
    Athlete: {
      sport: string;
      riskLevel: string;
      User: { name: string | null };
    };
  }>,
  moodLogs: Array<{ athleteId: string; mood: number; createdAt: Date }>,
  sessions: Array<{ athleteId: string; createdAt: Date }>,
  readinessScores: Array<{ athleteId: string; overallScore?: number; Athlete?: { User: { name: string } } }>,
  periodStart: Date
): AthleteAttentionItem[] {
  const attentionItems: AthleteAttentionItem[] = [];
  const now = new Date();

  relations.forEach((relation) => {
    const reasons: string[] = [];
    let priority: 'urgent' | 'high' | 'medium' = 'medium';

    // Check risk level
    if (relation.Athlete.riskLevel === 'HIGH') {
      reasons.push('High risk level');
      priority = 'urgent';
    }

    // Check mood logs
    const athleteMoods = moodLogs.filter((m) => m.athleteId === relation.athleteId);
    if (athleteMoods.length > 0) {
      const avgMood = athleteMoods.reduce((a, m) => a + m.mood, 0) / athleteMoods.length;
      if (avgMood < 2.5) {
        reasons.push('Consistently low mood');
        priority = priority === 'urgent' ? 'urgent' : 'high';
      }
    } else {
      // No mood logs this period - check if they've been inactive
      reasons.push('No check-ins this week');
    }

    // Check readiness scores
    const athleteReadiness = readinessScores.filter((r) => r.athleteId === relation.athleteId);
    if (athleteReadiness.length > 0) {
      const avgReadiness = athleteReadiness.reduce((a, r) => a + (r.overallScore || 0), 0) / athleteReadiness.length;
      if (avgReadiness < 50) {
        reasons.push('Low readiness scores');
        priority = priority === 'urgent' ? 'urgent' : 'high';
      }
    }

    // Check last activity
    const athleteSessions = sessions.filter((s) => s.athleteId === relation.athleteId);
    const lastActivity = athleteSessions.length > 0
      ? new Date(Math.max(...athleteSessions.map((s) => s.createdAt.getTime())))
      : null;

    if (reasons.length > 0) {
      attentionItems.push({
        athleteId: relation.athleteId,
        athleteName: relation.Athlete.User.name || 'Unknown',
        sport: relation.Athlete.sport,
        reasons,
        priority,
        lastContact: lastActivity || undefined,
      });
    }
  });

  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2 };
  return attentionItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 10);
}

function identifyTopPerformers(
  relations: Array<{
    athleteId: string;
    Athlete: {
      sport: string;
      User: { name: string | null };
    };
  }>,
  moodLogs: Array<{ athleteId: string; mood: number }>,
  readinessScores: Array<{ athleteId: string; overallScore?: number; Athlete?: { User: { name: string } } }>
): AthletePerformanceItem[] {
  const performers: AthletePerformanceItem[] = [];

  relations.forEach((relation) => {
    const athleteMoods = moodLogs.filter((m) => m.athleteId === relation.athleteId);
    const athleteReadiness = readinessScores.filter((r) => r.athleteId === relation.athleteId);

    if (athleteMoods.length >= 3 && athleteReadiness.length >= 3) {
      const avgMood = athleteMoods.reduce((a, m) => a + m.mood, 0) / athleteMoods.length;
      const avgReadiness = athleteReadiness.reduce((a, r) => a + (r.overallScore || 0), 0) / athleteReadiness.length;

      if (avgMood >= 4 && avgReadiness >= 75) {
        performers.push({
          athleteId: relation.athleteId,
          athleteName: relation.Athlete.User.name || 'Unknown',
          sport: relation.Athlete.sport,
          achievement: 'Maintaining excellent mood and readiness',
          metrics: {
            avgMood: Math.round(avgMood * 10) / 10,
            avgReadiness: Math.round(avgReadiness),
          },
        });
      }
    }
  });

  return performers.slice(0, 5);
}

function formatPeriodLabel(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', options);
  return `${startStr} - ${endStr}`;
}

/**
 * Generate HTML email content for digest
 */
export function generateDigestHtml(data: DigestData, coachName: string): string {
  const { period, summary, highlights, alerts, moodTrends, chatActivity, touchpoints, athletesNeedingAttention } = data;

  const highlightBgColors = {
    positive: '#ECFDF5',
    neutral: '#F3F4F6',
    concern: '#FEF2F2',
  };

  const highlightTextColors = {
    positive: '#065F46',
    neutral: '#374151',
    concern: '#991B1B',
  };

  const priorityColors = {
    urgent: '#DC2626',
    high: '#EA580C',
    medium: '#CA8A04',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Team Digest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); color: white; padding: 24px; text-align: center;">
      <h1 style="margin: 0 0 8px 0; font-size: 24px;">Weekly Team Digest</h1>
      <p style="margin: 0; opacity: 0.9; font-size: 14px;">${period.label}</p>
    </div>

    <!-- Greeting -->
    <div style="padding: 24px 24px 0;">
      <p style="margin: 0 0 16px 0; font-size: 16px;">Hi ${coachName},</p>
      <p style="margin: 0 0 24px 0; color: #6b7280;">Here's your weekly summary for your team of ${summary.totalAthletes} athletes.</p>
    </div>

    <!-- Summary Stats -->
    <div style="padding: 0 24px;">
      <div style="display: flex; background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="flex: 1; text-align: center; border-right: 1px solid #e5e7eb;">
          <div style="font-size: 24px; font-weight: bold; color: #3B82F6;">${summary.activeAthletes}</div>
          <div style="font-size: 12px; color: #6b7280;">Active Athletes</div>
        </div>
        <div style="flex: 1; text-align: center; border-right: 1px solid #e5e7eb;">
          <div style="font-size: 24px; font-weight: bold; color: #10B981;">${summary.engagementRate}%</div>
          <div style="font-size: 12px; color: #6b7280;">Engagement</div>
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #8B5CF6;">${chatActivity.totalSessions}</div>
          <div style="font-size: 12px; color: #6b7280;">Chat Sessions</div>
        </div>
      </div>
    </div>

    ${alerts.length > 0 ? `
    <!-- Alerts -->
    <div style="padding: 0 24px; margin-bottom: 24px;">
      <h2 style="font-size: 16px; margin: 0 0 12px 0; color: #DC2626;">Alerts This Week</h2>
      ${alerts.slice(0, 3).map(alert => `
        <div style="background: #FEF2F2; border-left: 4px solid #DC2626; padding: 12px; margin-bottom: 8px; border-radius: 0 8px 8px 0;">
          <strong>${alert.athleteName}</strong>
          <span style="color: #6b7280; font-size: 14px;"> - ${alert.message}</span>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Highlights -->
    <div style="padding: 0 24px; margin-bottom: 24px;">
      <h2 style="font-size: 16px; margin: 0 0 12px 0;">Key Highlights</h2>
      ${highlights.map(h => `
        <div style="background: ${highlightBgColors[h.type]}; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px;">
          <div style="color: ${highlightTextColors[h.type]};">
            <strong>${h.title}</strong>
            ${h.metric ? `<span style="float: right; font-weight: bold;">${h.metric}</span>` : ''}
          </div>
          <div style="color: #6b7280; font-size: 14px; margin-top: 4px;">${h.description}</div>
        </div>
      `).join('')}
    </div>

    ${athletesNeedingAttention.length > 0 ? `
    <!-- Athletes Needing Attention -->
    <div style="padding: 0 24px; margin-bottom: 24px;">
      <h2 style="font-size: 16px; margin: 0 0 12px 0;">Athletes Needing Attention</h2>
      ${athletesNeedingAttention.slice(0, 5).map(a => `
        <div style="border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <strong>${a.athleteName}</strong>
            <span style="background: ${priorityColors[a.priority]}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">${a.priority}</span>
          </div>
          <div style="color: #6b7280; font-size: 13px; margin-top: 4px;">${a.sport}</div>
          <div style="color: #9CA3AF; font-size: 12px; margin-top: 4px;">${a.reasons.join(' • ')}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Touchpoints Summary -->
    <div style="padding: 0 24px; margin-bottom: 24px;">
      <h2 style="font-size: 16px; margin: 0 0 12px 0;">Your Touchpoints</h2>
      <div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Completed</span>
          <strong style="color: #10B981;">${touchpoints.completed}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span>Pending</span>
          <strong style="color: #6B7280;">${touchpoints.pending}</strong>
        </div>
        ${touchpoints.overdue > 0 ? `
        <div style="display: flex; justify-content: space-between;">
          <span>Overdue</span>
          <strong style="color: #DC2626;">${touchpoints.overdue}</strong>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- CTA -->
    <div style="padding: 0 24px 24px; text-align: center;">
      <a href="${process.env.NEXTAUTH_URL || 'https://app.flowsportscoach.com'}/coach/dashboard"
         style="display: inline-block; background: #3B82F6; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        View Full Dashboard
      </a>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #6b7280;">
      <p style="margin: 0 0 8px 0;">Flow Sports Coach - Supporting Student-Athlete Mental Performance</p>
      <p style="margin: 0;">
        <a href="${process.env.NEXTAUTH_URL || 'https://app.flowsportscoach.com'}/coach/settings" style="color: #3B82F6; text-decoration: none;">Manage email preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Get week boundaries for digest generation
 */
export function getWeekBoundaries(date: Date = new Date()): { start: Date; end: Date } {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}
