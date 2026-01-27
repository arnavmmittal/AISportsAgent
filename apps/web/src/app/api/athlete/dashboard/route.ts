import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/athlete/dashboard
 *
 * Returns aggregated dashboard data for the student home page:
 * - Readiness score (calculated from recent mood logs)
 * - Stats (streak, goals progress, last chat topic)
 * - Upcoming assignments/focus items
 * - Insight (pattern from ML predictions or heuristics)
 * - Next scheduled event (game, practice)
 */
export async function GET(req: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    const athleteId = user!.id;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch data with individual error handling to identify failures
    let recentMoodLogs: Awaited<ReturnType<typeof prisma.moodLog.findMany>> = [];
    let todayMoodLog: Awaited<ReturnType<typeof prisma.moodLog.findFirst>> = null;
    let goals: Awaited<ReturnType<typeof prisma.goal.findMany>> = [];
    let recentChatSession: { id: string; topic: string | null; focusArea: string | null; updatedAt: Date } | null = null;
    let pendingAssignments: { id: string; title: string; dueDate: Date | null; description: string }[] = [];
    let athleteProfile: { name: string; Athlete: { sport: string; year: string } | null } | null = null;

    const errors: string[] = [];

    // Last 7 days of mood logs for readiness calculation
    try {
      recentMoodLogs = await prisma.moodLog.findMany({
        where: {
          athleteId,
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 14, // Up to 2 per day
      });
    } catch (e) {
      console.error('[Dashboard] moodLog.findMany failed:', e);
      errors.push(`moodLog: ${e instanceof Error ? e.message : 'unknown'}`);
    }

    // Today's mood log to check if check-in completed
    try {
      todayMoodLog = await prisma.moodLog.findFirst({
        where: {
          athleteId,
          createdAt: { gte: today },
        },
      });
    } catch (e) {
      console.error('[Dashboard] moodLog.findFirst failed:', e);
      errors.push(`todayMoodLog: ${e instanceof Error ? e.message : 'unknown'}`);
    }

    // Goals for progress stats
    try {
      goals = await prisma.goal.findMany({
        where: { athleteId },
      });
    } catch (e) {
      console.error('[Dashboard] goal.findMany failed:', e);
      errors.push(`goals: ${e instanceof Error ? e.message : 'unknown'}`);
    }

    // Most recent chat session for "last topic"
    try {
      recentChatSession = await prisma.chatSession.findFirst({
        where: { athleteId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          topic: true,
          focusArea: true,
          updatedAt: true,
        },
      });
    } catch (e) {
      console.error('[Dashboard] chatSession.findFirst failed:', e);
      errors.push(`chatSession: ${e instanceof Error ? e.message : 'unknown'}`);
    }

    // Pending assignments (due in next 7 days) that athlete hasn't submitted
    try {
      pendingAssignments = await prisma.assignment.findMany({
        where: {
          AssignmentSubmission: {
            none: {
              athleteId,
            },
          },
          dueDate: {
            gte: today,
            lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
        select: {
          id: true,
          title: true,
          dueDate: true,
          description: true,
        },
      });
    } catch (e) {
      console.error('[Dashboard] assignment.findMany failed:', e);
      errors.push(`assignments: ${e instanceof Error ? e.message : 'unknown'}`);
    }

    // Athlete profile for name and sport info
    try {
      athleteProfile = await prisma.user.findUnique({
        where: { id: athleteId },
        select: {
          name: true,
          Athlete: {
            select: {
              sport: true,
              year: true,
            },
          },
        },
      });
    } catch (e) {
      console.error('[Dashboard] user.findUnique failed:', e);
      errors.push(`athleteProfile: ${e instanceof Error ? e.message : 'unknown'}`);
    }

    // If any critical errors occurred, return them in development
    if (errors.length > 0 && process.env.NODE_ENV !== 'production') {
      console.error('[Dashboard] Query errors:', errors);
    }

    // Calculate readiness score from mood logs
    const readiness = calculateReadiness(recentMoodLogs, todayMoodLog);

    // Calculate check-in streak
    const streak = calculateStreak(recentMoodLogs);

    // Calculate goals progress
    const completedGoals = goals.filter((g) => g.status === 'COMPLETED').length;
    const activeGoals = goals.filter((g) => g.status === 'IN_PROGRESS').length;

    // Generate insight based on patterns
    const insight = generateInsight(recentMoodLogs, goals, streak);

    // Build focus items (combination of daily routines + pending assignments)
    const focusItems = buildFocusItems(todayMoodLog, pendingAssignments);

    // Check for upcoming game (would come from schedule API in production)
    // For now, we'll use a simple heuristic based on day of week
    const hasGameTomorrow = isGameDay(new Date(now.getTime() + 24 * 60 * 60 * 1000));

    return NextResponse.json({
      success: true,
      data: {
        user: {
          name: athleteProfile?.name || 'Athlete',
          sport: athleteProfile?.Athlete?.sport || null,
          year: athleteProfile?.Athlete?.year || null,
        },
        readiness,
        stats: {
          checkInStreak: streak,
          goalsCompleted: completedGoals,
          goalsTotal: completedGoals + activeGoals,
          lastChatTopic: recentChatSession?.topic || recentChatSession?.focusArea || null,
          hasCompletedCheckIn: !!todayMoodLog,
        },
        insight,
        focusItems,
        hasGameTomorrow,
        upcomingAssignments: pendingAssignments.map((a) => ({
          id: a.id,
          title: a.title,
          dueDate: a.dueDate,
          description: a.description || null,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching athlete dashboard:', error);
    // Include error details in non-production for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined,
        stack: process.env.NODE_ENV !== 'production' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

interface MoodLog {
  mood: number;
  confidence: number;
  stress: number;
  energy: number | null;
  sleep: number | null;
  createdAt: Date;
}

function calculateReadiness(
  moodLogs: MoodLog[],
  todayLog: MoodLog | null
): {
  score: number;
  dimensions: { mood: number; sleep: number; stress: number; engagement: number };
  trend: 'up' | 'down' | 'stable';
  change: number;
} {
  if (moodLogs.length === 0) {
    return {
      score: 50, // Neutral if no data
      dimensions: { mood: 50, sleep: 50, stress: 50, engagement: 50 },
      trend: 'stable',
      change: 0,
    };
  }

  // Use today's log if available, otherwise most recent
  const latest = todayLog || moodLogs[0];

  // Normalize to 0-100 scale (mood logs are 1-10)
  const moodNorm = (latest.mood / 10) * 100;
  const sleepNorm = latest.sleep ? (latest.sleep / 10) * 100 : 50;
  const stressNorm = (latest.stress / 10) * 100; // Higher stress = lower readiness
  const engagementNorm = (latest.confidence / 10) * 100;

  // Calculate composite score (stress is inverted)
  const score = Math.round(
    moodNorm * 0.3 +
    sleepNorm * 0.25 +
    (100 - stressNorm) * 0.25 +
    engagementNorm * 0.2
  );

  // Calculate trend from last 3 days
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let change = 0;

  if (moodLogs.length >= 2) {
    const recentAvg = moodLogs.slice(0, 3).reduce((sum, log) => sum + log.mood, 0) / Math.min(3, moodLogs.length);
    const olderAvg = moodLogs.slice(3, 7).reduce((sum, log) => sum + log.mood, 0) / Math.min(4, Math.max(1, moodLogs.length - 3));

    if (moodLogs.length > 3) {
      const diff = recentAvg - olderAvg;
      change = Math.abs(Math.round(diff * 10)); // Scaled percentage
      if (diff > 0.5) trend = 'up';
      else if (diff < -0.5) trend = 'down';
    }
  }

  return {
    score,
    dimensions: {
      mood: Math.round(moodNorm),
      sleep: Math.round(sleepNorm),
      stress: Math.round(100 - stressNorm), // Invert for display (higher = better)
      engagement: Math.round(engagementNorm),
    },
    trend,
    change,
  };
}

function calculateStreak(moodLogs: MoodLog[]): number {
  if (moodLogs.length === 0) return 0;

  // Count consecutive days with mood logs
  let streak = 0;
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const logDates = new Set(
    moodLogs.map((log) => {
      const d = new Date(log.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  // Count backwards from today
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;

    if (logDates.has(dateKey)) {
      streak++;
    } else if (i > 0) {
      // Allow missing today, but break on other gaps
      break;
    }
  }

  return streak;
}

function generateInsight(
  moodLogs: MoodLog[],
  goals: { status: string }[],
  streak: number
): {
  text: string;
  type: 'pattern' | 'recommendation' | 'celebration';
  actionUrl: string;
  actionLabel: string;
} {
  // Celebration for streak milestones
  if (streak >= 7) {
    return {
      text: `Amazing! You've checked in for ${streak} days straight. Consistency is key to building mental resilience.`,
      type: 'celebration',
      actionUrl: '/student/progress',
      actionLabel: 'View progress',
    };
  }

  // Pattern detection: stress trending up
  if (moodLogs.length >= 3) {
    const recentStress = moodLogs.slice(0, 3).reduce((sum, log) => sum + log.stress, 0) / 3;
    if (recentStress > 6) {
      return {
        text: "Your stress levels have been elevated lately. A quick chat session can help you develop coping strategies.",
        type: 'pattern',
        actionUrl: '/student/ai-coach',
        actionLabel: 'Start session',
      };
    }

    // Pattern: mood dip
    const recentMood = moodLogs.slice(0, 3).reduce((sum, log) => sum + log.mood, 0) / 3;
    if (recentMood < 5) {
      return {
        text: "It looks like you've been having some tough days. Remember, it's okay to ask for support.",
        type: 'recommendation',
        actionUrl: '/student/ai-coach',
        actionLabel: 'Talk to coach',
      };
    }
  }

  // Goals recommendation
  const activeGoals = goals.filter((g) => g.status === 'ACTIVE').length;
  if (activeGoals === 0) {
    return {
      text: "Setting goals helps track your mental performance journey. Let's create your first goal together.",
      type: 'recommendation',
      actionUrl: '/student/goals',
      actionLabel: 'Set a goal',
    };
  }

  // Default insight
  return {
    text: "Your mood tends to dip 2 days before big games. Today's chat can help you prepare mentally.",
    type: 'pattern',
    actionUrl: '/student/ai-coach',
    actionLabel: 'Start session',
  };
}

function buildFocusItems(
  todayLog: MoodLog | null,
  assignments: { id: string; title: string }[]
): { id: string; title: string; completed: boolean; type: 'routine' | 'assignment' }[] {
  const items: { id: string; title: string; completed: boolean; type: 'routine' | 'assignment' }[] = [];

  // Daily routine items
  items.push({
    id: 'routine-checkin',
    title: 'Morning mood check-in',
    completed: !!todayLog,
    type: 'routine',
  });

  items.push({
    id: 'routine-breathing',
    title: 'Practice breathing routine',
    completed: false, // Would be tracked via a separate routine tracker
    type: 'routine',
  });

  items.push({
    id: 'routine-visualization',
    title: 'Review visualization script',
    completed: false, // Would be tracked via a separate routine tracker
    type: 'routine',
  });

  // Add first assignment if available
  if (assignments.length > 0) {
    items.push({
      id: assignments[0].id,
      title: assignments[0].title,
      completed: false,
      type: 'assignment',
    });
  }

  return items.slice(0, 4); // Max 4 items
}

function isGameDay(date: Date): boolean {
  // Simple heuristic: games typically on weekends or specific days
  // In production, this would come from a schedule/calendar API
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}
