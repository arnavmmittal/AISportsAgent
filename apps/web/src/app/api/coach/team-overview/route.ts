/**
 * Coach Team Overview API
 * Returns team statistics, athlete readiness data, and intervention queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    // Get coach's athletes
    const coachAthletes = await prisma.coachAthleteRelation.findMany({
      where: {
        coachId: user.id,
        consentGranted: true,
      },
      include: {
        Athlete: {
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const athleteIds = coachAthletes.map((relation) => relation.athleteId);

    // Get readiness scores for last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const readinessScores = await prisma.readinessScore.findMany({
      where: {
        athleteId: { in: athleteIds },
        calculatedAt: { gte: fourteenDaysAgo },
      },
      orderBy: {
        calculatedAt: 'asc',
      },
    });

    // Get recent mood logs for team average
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMoodLogs = await prisma.moodLog.findMany({
      where: {
        athleteId: { in: athleteIds },
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Get crisis alerts
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
                name: true,
              },
            },
          },
        },
      },
    });

    // Calculate team average readiness
    const todayReadiness = readinessScores.filter((score) => {
      const scoreDate = new Date(score.calculatedAt);
      const today = new Date();
      return scoreDate.toDateString() === today.toDateString();
    });

    const teamAvgReadiness =
      todayReadiness.length > 0
        ? todayReadiness.reduce((sum, score) => sum + score.score, 0) / todayReadiness.length
        : 0;

    // Calculate readiness change (compare to yesterday)
    const yesterdayReadiness = readinessScores.filter((score) => {
      const scoreDate = new Date(score.calculatedAt);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return scoreDate.toDateString() === yesterday.toDateString();
    });

    const yesterdayAvg =
      yesterdayReadiness.length > 0
        ? yesterdayReadiness.reduce((sum, score) => sum + score.score, 0) / yesterdayReadiness.length
        : teamAvgReadiness;

    const readinessChange = teamAvgReadiness - yesterdayAvg;

    // Count high risk athletes
    const highRiskCount = coachAthletes.filter(
      (relation) => relation.Athlete.riskLevel === 'HIGH' || relation.Athlete.riskLevel === 'CRITICAL'
    ).length;

    // Count declining trends (athletes whose readiness dropped significantly)
    const decliningTrends = coachAthletes.filter((relation) => {
      const athleteScores = readinessScores.filter((score) => score.athleteId === relation.athleteId);
      if (athleteScores.length < 7) return false;

      const recent = athleteScores.slice(-3);
      const previous = athleteScores.slice(-7, -3);

      const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / recent.length;
      const previousAvg = previous.reduce((sum, s) => sum + s.score, 0) / previous.length;

      return recentAvg < previousAvg - 10; // Dropped more than 10 points
    }).length;

    // Build athletes readiness data
    const athletesReadiness = coachAthletes.map((relation) => {
      const athleteScores = readinessScores
        .filter((score) => score.athleteId === relation.athleteId)
        .slice(-14); // Last 14 days

      const scores = athleteScores.map((score) => score.score);
      const currentScore = scores[scores.length - 1] || 0;

      // Calculate 7-day trend
      const last7 = scores.slice(-7);
      const trend = last7.length >= 2 ? last7[last7.length - 1] - last7[0] : 0;

      // Generate 7-day forecast (simple linear projection)
      const forecast = Array.from({ length: 7 }, (_, i) => {
        const forecastScore = currentScore + (trend / 7) * (i + 1);
        return Math.max(0, Math.min(100, Math.round(forecastScore)));
      });

      return {
        id: relation.Athlete.userId,
        name: relation.Athlete.User.name,
        sport: relation.Athlete.sport,
        currentReadiness: currentScore,
        scores14d: scores,
        trend: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
        trendValue: Math.abs(trend),
        forecast7d: forecast,
        riskLevel: relation.Athlete.riskLevel,
      };
    });

    // Build intervention queue (prioritized list of athletes needing attention)
    const interventions = coachAthletes
      .map((relation) => {
        const athleteScores = readinessScores
          .filter((score) => score.athleteId === relation.athleteId)
          .slice(-7);

        const avgReadiness =
          athleteScores.length > 0
            ? athleteScores.reduce((sum, s) => sum + s.score, 0) / athleteScores.length
            : 0;

        const athleteMoodLogs = recentMoodLogs.filter((log) => log.athleteId === relation.athleteId);
        const avgStress =
          athleteMoodLogs.length > 0
            ? athleteMoodLogs.reduce((sum, log) => sum + log.stress, 0) / athleteMoodLogs.length
            : 0;

        const hasCrisisAlert = crisisAlerts.some((alert) => alert.athleteId === relation.athleteId);

        // Calculate priority score (higher = more urgent)
        let priorityScore = 0;
        if (hasCrisisAlert) priorityScore += 100;
        if (relation.Athlete.riskLevel === 'CRITICAL') priorityScore += 50;
        if (relation.Athlete.riskLevel === 'HIGH') priorityScore += 30;
        if (avgReadiness < 50) priorityScore += 20;
        if (avgStress > 7) priorityScore += 15;

        let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';
        if (priorityScore >= 100) priority = 'critical';
        else if (priorityScore >= 50) priority = 'high';
        else if (priorityScore >= 20) priority = 'medium';

        return {
          id: relation.Athlete.userId,
          name: relation.Athlete.User.name,
          sport: relation.Athlete.sport,
          priority,
          readiness: Math.round(avgReadiness),
          reason: hasCrisisAlert
            ? 'Crisis alert detected'
            : avgReadiness < 50
              ? 'Low readiness score'
              : avgStress > 7
                ? 'High stress levels'
                : 'Routine check-in',
          lastContact: relation.Athlete.lastRiskUpdate
            ? new Date(relation.Athlete.lastRiskUpdate).toISOString()
            : null,
          priorityScore,
        };
      })
      .filter((intervention) => intervention.priorityScore > 0)
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 10); // Top 10 interventions

    // Return data
    return NextResponse.json({
      stats: {
        totalAthletes: coachAthletes.length,
        teamAvgReadiness: Math.round(teamAvgReadiness),
        readinessChange: Math.round(readinessChange),
        highRisk: highRiskCount,
        criticalAlerts: crisisAlerts.filter((alert) => alert.severity === 'CRITICAL').length,
        decliningTrends,
      },
      athletes: athletesReadiness,
      interventions,
    });
  } catch (error) {
    console.error('Team overview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
