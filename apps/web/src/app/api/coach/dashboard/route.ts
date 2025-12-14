/**
 * Coach Dashboard API
 * Provides aggregated athlete analytics and team insights
 * SECURITY: Only shows athletes connected via CoachAthleteRelation with consent
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Only coaches and admins can access
    if (user!.role !== 'COACH' && user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Coach access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sport = searchParams.get('sport');
    const timeRange = searchParams.get('timeRange') || '7'; // days

    // Get coach profile
    const coach = await prisma.coach.findUnique({
      where: { userId: user!.id },
      include: {
        User: {
          select: {
            name: true,
            schoolId: true,
          },
        },
      },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach profile not found' },
        { status: 404 }
      );
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get all coach-athlete relationships
    const relations = await prisma.coachAthleteRelation.findMany({
      where: { coachId: coach.userId },
      include: {
        Athlete: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            MoodLog: {
              where: {
                createdAt: { gte: startDate },
              },
              orderBy: { createdAt: 'desc' },
            },
            Goal: {
              where: {
                status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
              },
            },
          },
        },
      },
    });

    // Filter by sport if provided
    const filteredRelations = sport
      ? relations.filter((r) => r.Athlete.sport === sport)
      : relations;

    // Separate athletes by consent status
    const athletesWithConsent = filteredRelations.filter(
      (r) => r.consentGranted === true
    );
    const athletesWithoutConsent = filteredRelations.filter(
      (r) => r.consentGranted === false
    );

    // Calculate aggregate statistics (only for athletes with consent)
    const totalAthletes = filteredRelations.length;
    const athletesWithConsent_count = athletesWithConsent.length;

    // Mood statistics (only for athletes with consent)
    const allMoodLogs = athletesWithConsent.flatMap(
      (r) => r.Athlete.MoodLog || []
    );
    const avgMood =
      allMoodLogs.length > 0
        ? allMoodLogs.reduce((sum, m) => sum + m.mood, 0) / allMoodLogs.length
        : 0;
    const avgConfidence =
      allMoodLogs.length > 0
        ? allMoodLogs.reduce((sum, m) => sum + m.confidence, 0) /
          allMoodLogs.length
        : 0;
    const avgStress =
      allMoodLogs.length > 0
        ? allMoodLogs.reduce((sum, m) => sum + m.stress, 0) / allMoodLogs.length
        : 0;

    // Identify at-risk athletes (high stress, low mood)
    const atRiskAthletes = athletesWithConsent.filter((r) => {
      const recentMoodLogs = (r.Athlete.MoodLog || []).slice(0, 3);
      if (recentMoodLogs.length === 0) return false;

      const avgStress =
        recentMoodLogs.reduce((sum, m) => sum + m.stress, 0) /
        recentMoodLogs.length;
      const avgMood =
        recentMoodLogs.reduce((sum, m) => sum + m.mood, 0) /
        recentMoodLogs.length;

      return avgStress >= 7 || avgMood <= 4;
    });

    // Get crisis alerts (last 30 days) - only for connected athletes
    const crisisStartDate = new Date();
    crisisStartDate.setDate(crisisStartDate.getDate() - 30);

    const athleteIds = athletesWithConsent.map((r) => r.athleteId);

    const crisisAlerts = await prisma.crisisAlert.findMany({
      where: {
        athleteId: { in: athleteIds },
        createdAt: { gte: crisisStartDate },
        resolved: false,
      },
      include: {
        Athlete: {
          select: {
            userId: true,
            sport: true,
            year: true,
            User: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Athlete readiness summary (for today) - only for connected athletes with consent
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysMoodLogs = await prisma.moodLog.findMany({
      where: {
        athleteId: { in: athleteIds },
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        Athlete: {
          select: {
            userId: true,
            sport: true,
            teamPosition: true,
            User: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Calculate readiness score (combination of mood, confidence, inverse of stress)
    const athleteReadiness = todaysMoodLogs.map((log) => {
      const readiness = (log.mood + log.confidence + (11 - log.stress)) / 3;
      return {
        athlete: {
          id: log.Athlete.User.id,
          name: log.Athlete.User.name,
          sport: log.Athlete.sport,
          teamPosition: log.Athlete.teamPosition,
        },
        mood: log.mood,
        confidence: log.confidence,
        stress: log.stress,
        readiness: Math.round(readiness * 10) / 10,
        status:
          readiness >= 8
            ? 'excellent'
            : readiness >= 6.5
            ? 'good'
            : readiness >= 5
            ? 'fair'
            : 'at-risk',
      };
    });

    // Mood trend data (last 30 days) for charts
    const trendStartDate = new Date();
    trendStartDate.setDate(trendStartDate.getDate() - 30);

    const trendMoodLogs = await prisma.moodLog.findMany({
      where: {
        athleteId: { in: athleteIds },
        createdAt: { gte: trendStartDate },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        mood: true,
        confidence: true,
        stress: true,
        createdAt: true,
      },
    });

    // Group mood logs by day for trend visualization
    const moodTrendByDay = trendMoodLogs.reduce((acc: any, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { mood: [], confidence: [], stress: [], count: 0 };
      }
      acc[date].mood.push(log.mood);
      acc[date].confidence.push(log.confidence);
      acc[date].stress.push(log.stress);
      acc[date].count++;
      return acc;
    }, {});

    const moodTrend = Object.entries(moodTrendByDay).map(([date, data]: [string, any]) => ({
      date,
      avgMood: data.mood.reduce((sum: number, v: number) => sum + v, 0) / data.count,
      avgConfidence: data.confidence.reduce((sum: number, v: number) => sum + v, 0) / data.count,
      avgStress: data.stress.reduce((sum: number, v: number) => sum + v, 0) / data.count,
      count: data.count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalAthletes,
          athletesWithConsent: athletesWithConsent_count,
          athletesWithoutConsent: athletesWithoutConsent.length,
          atRiskCount: atRiskAthletes.length,
          crisisAlertsCount: crisisAlerts.length,
          timeRange: parseInt(timeRange),
        },
        teamMood: {
          avgMood: Math.round(avgMood * 10) / 10,
          avgConfidence: Math.round(avgConfidence * 10) / 10,
          avgStress: Math.round(avgStress * 10) / 10,
          totalLogs: allMoodLogs.length,
        },
        moodTrend,
        crisisAlerts,
        atRiskAthletes: atRiskAthletes.map((r) => ({
          id: r.Athlete.User.id,
          name: r.Athlete.User.name,
          sport: r.Athlete.sport,
          year: r.Athlete.year,
          recentMood:
            r.Athlete.MoodLog && r.Athlete.MoodLog[0]
              ? {
                  mood: r.Athlete.MoodLog[0].mood,
                  confidence: r.Athlete.MoodLog[0].confidence,
                  stress: r.Athlete.MoodLog[0].stress,
                }
              : null,
        })),
        athleteReadiness,
      },
    });
  } catch (error) {
    console.error('Error fetching coach dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
