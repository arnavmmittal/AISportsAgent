/**
 * Coach Dashboard API
 * Returns aggregated team metrics from real database
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    // Get coach profile
    const coach = await prisma.coach.findUnique({
      where: { userId: user.id },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach profile not found' },
        { status: 404 }
      );
    }

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
              },
            },
            MoodLog: {
              orderBy: { createdAt: 'desc' },
              take: 7, // Last 7 days for trends
            },
          },
        },
      },
    });

    const totalAthletes = relations.length;
    const athletesWithConsent = relations.filter((r) => r.consentGranted).length;
    const athletesWithoutConsent = totalAthletes - athletesWithConsent;

    // Get crisis alerts for athletes with consent
    const athleteIds = relations
      .filter((r) => r.consentGranted)
      .map((r) => r.athleteId);

    const crisisAlerts = await prisma.crisisAlert.findMany({
      where: {
        athleteId: { in: athleteIds },
        reviewed: false,
      },
      include: {
        Athlete: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { detectedAt: 'desc' },
      take: 10,
    });

    // Calculate team mood metrics (only athletes with consent)
    const athletesWithMoodData = relations
      .filter((r) => r.consentGranted && r.Athlete.MoodLog.length > 0)
      .map((r) => r.Athlete);

    let avgMood = 0;
    let avgConfidence = 0;
    let avgStress = 0;
    let totalLogs = 0;

    if (athletesWithMoodData.length > 0) {
      // Calculate averages from most recent mood log per athlete
      athletesWithMoodData.forEach((athlete) => {
        if (athlete.MoodLog.length > 0) {
          const latestMood = athlete.MoodLog[0];
          avgMood += latestMood.mood;
          avgConfidence += latestMood.confidence;
          avgStress += latestMood.stress;
          totalLogs += athlete.MoodLog.length;
        }
      });

      avgMood = avgMood / athletesWithMoodData.length;
      avgConfidence = avgConfidence / athletesWithMoodData.length;
      avgStress = avgStress / athletesWithMoodData.length;
    }

    // Calculate mood trends for last 7 days
    const moodTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Get all mood logs for this day
      const dayMoodLogs = await prisma.moodLog.findMany({
        where: {
          athleteId: { in: athleteIds },
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      if (dayMoodLogs.length > 0) {
        const dayAvgMood =
          dayMoodLogs.reduce((sum, log) => sum + log.mood, 0) / dayMoodLogs.length;
        const dayAvgConfidence =
          dayMoodLogs.reduce((sum, log) => sum + log.confidence, 0) / dayMoodLogs.length;
        const dayAvgStress =
          dayMoodLogs.reduce((sum, log) => sum + log.stress, 0) / dayMoodLogs.length;

        moodTrend.push({
          date: date.toISOString(),
          avgMood: Math.round(dayAvgMood * 10) / 10,
          avgConfidence: Math.round(dayAvgConfidence * 10) / 10,
          avgStress: Math.round(dayAvgStress * 10) / 10,
          count: dayMoodLogs.length,
        });
      } else {
        // No data for this day
        moodTrend.push({
          date: date.toISOString(),
          avgMood: 0,
          avgConfidence: 0,
          avgStress: 0,
          count: 0,
        });
      }
    }

    // Identify at-risk athletes (low mood, high stress, or crisis alerts)
    const atRiskAthletes = athletesWithMoodData
      .filter((athlete) => {
        if (athlete.MoodLog.length === 0) return false;
        const latestMood = athlete.MoodLog[0];
        return (
          latestMood.mood <= 5 ||
          latestMood.stress >= 7 ||
          athlete.riskLevel === 'HIGH' ||
          athlete.riskLevel === 'CRITICAL'
        );
      })
      .map((athlete) => ({
        id: athlete.User.id,
        name: athlete.User.name,
        sport: athlete.sport,
        year: athlete.year,
        recentMood: {
          mood: athlete.MoodLog[0].mood,
          confidence: athlete.MoodLog[0].confidence,
          stress: athlete.MoodLog[0].stress,
        },
      }));

    // Calculate athlete readiness scores
    const athleteReadiness = athletesWithMoodData
      .map((athlete) => {
        if (athlete.MoodLog.length === 0) return null;

        const latestMood = athlete.MoodLog[0];
        // Readiness formula: (mood + confidence + (11 - stress)) / 3 * 10
        const readiness = Math.round(
          ((latestMood.mood + latestMood.confidence + (11 - latestMood.stress)) / 3) * 10
        );

        let status: 'excellent' | 'good' | 'fair' | 'at-risk' = 'good';
        if (readiness >= 85) status = 'excellent';
        else if (readiness >= 70) status = 'good';
        else if (readiness >= 55) status = 'fair';
        else status = 'at-risk';

        return {
          athlete: {
            id: athlete.User.id,
            name: athlete.User.name,
            sport: athlete.sport,
            teamPosition: athlete.teamPosition,
          },
          mood: latestMood.mood,
          confidence: latestMood.confidence,
          stress: latestMood.stress,
          readiness,
          status,
        };
      })
      .filter((a) => a !== null)
      .sort((a, b) => (b?.readiness || 0) - (a?.readiness || 0)); // Sort by readiness descending

    const dashboardData = {
      overview: {
        totalAthletes,
        athletesWithConsent,
        athletesWithoutConsent,
        atRiskCount: atRiskAthletes.length,
        crisisAlertsCount: crisisAlerts.length,
        timeRange: 7,
      },
      teamMood: {
        avgMood: Math.round(avgMood * 10) / 10,
        avgConfidence: Math.round(avgConfidence * 10) / 10,
        avgStress: Math.round(avgStress * 10) / 10,
        totalLogs,
      },
      moodTrend,
      crisisAlerts: crisisAlerts.map((alert) => ({
        id: alert.id,
        athleteId: alert.athleteId,
        athlete: {
          id: alert.Athlete.User.id,
          name: alert.Athlete.User.name,
          sport: alert.Athlete.sport,
          year: alert.Athlete.year,
        },
        severity: alert.severity,
        notes: alert.notes,
        detectedAt: alert.detectedAt.toISOString(),
        reviewed: alert.reviewed,
        reviewedBy: alert.reviewedBy,
        reviewedAt: alert.reviewedAt?.toISOString(),
      })),
      atRiskAthletes,
      athleteReadiness,
    };

    return NextResponse.json({ data: dashboardData });
  } catch (error) {
    console.error('Coach dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
