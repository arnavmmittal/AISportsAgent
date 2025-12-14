/**
 * Coach Dashboard API
 * Provides aggregated athlete analytics and team insights
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

    // Get coach's school
    const coach = await prisma.user.findUnique({
      where: { id: user!.id },
      include: { Coach: true, School: true },
    });

    if (!coach || !coach.Coach) {
      return NextResponse.json(
        { error: 'Coach profile not found' },
        { status: 404 }
      );
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Build athlete filter
    const athleteWhere: any = {
      schoolId: coach.schoolId,
      role: 'ATHLETE',
      Athlete: sport ? { sport } : undefined,
    };

    // Get all athletes in school/sport
    const athletes = await prisma.user.findMany({
      where: athleteWhere,
      include: {
        Athlete: {
          include: {
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

    // Filter athletes based on consent
    const athletesWithConsent = athletes.filter(
      (a) => a.Athlete?.consentCoachView === true
    );

    // Calculate aggregate statistics
    const totalAthletes = athletes.length;
    const athletesWithConsent_count = athletesWithConsent.length;

    // Mood statistics (only for athletes with consent)
    const allMoodLogs = athletesWithConsent.flatMap((a) => a.Athlete?.MoodLog || []);
    const avgMood =
      allMoodLogs.length > 0
        ? allMoodLogs.reduce((sum, m) => sum + m.mood, 0) / allMoodLogs.length
        : 0;
    const avgConfidence =
      allMoodLogs.length > 0
        ? allMoodLogs.reduce((sum, m) => sum + m.confidence, 0) / allMoodLogs.length
        : 0;
    const avgStress =
      allMoodLogs.length > 0
        ? allMoodLogs.reduce((sum, m) => sum + m.stress, 0) / allMoodLogs.length
        : 0;

    // Identify at-risk athletes (high stress, low mood)
    const atRiskAthletes = athletesWithConsent.filter((a) => {
      const recentMoodLogs = (a.Athlete?.MoodLog || []).slice(0, 3);
      if (recentMoodLogs.length === 0) return false;

      const avgStress =
        recentMoodLogs.reduce((sum, m) => sum + m.stress, 0) / recentMoodLogs.length;
      const avgMood =
        recentMoodLogs.reduce((sum, m) => sum + m.mood, 0) / recentMoodLogs.length;

      return avgStress >= 7 || avgMood <= 4;
    });

    // Get crisis alerts (last 30 days)
    const crisisStartDate = new Date();
    crisisStartDate.setDate(crisisStartDate.getDate() - 30);

    const crisisAlerts = await prisma.crisisAlert.findMany({
      where: {
        Athlete: {
          User: {
            schoolId: coach.schoolId,
          },
        },
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

    // Athlete readiness summary (for today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysMoodLogs = await prisma.moodLog.findMany({
      where: {
        Athlete: {
          consentCoachView: true,
          User: {
            schoolId: coach.schoolId,
          },
        },
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

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalAthletes,
          athletesWithConsent: athletesWithConsent_count,
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
        crisisAlerts,
        atRiskAthletes: atRiskAthletes.map((a) => ({
          id: a.id,
          name: a.name,
          sport: a.Athlete?.sport,
          year: a.Athlete?.year,
          recentMood: a.Athlete?.MoodLog && a.Athlete.MoodLog[0]
            ? {
                mood: a.Athlete.MoodLog[0].mood,
                confidence: a.Athlete.MoodLog[0].confidence,
                stress: a.Athlete.MoodLog[0].stress,
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
