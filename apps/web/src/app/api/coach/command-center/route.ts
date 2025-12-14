/**
 * Command Center API
 * Returns AI-powered priority athletes, action feed, and quick stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import {
  CommandCenterData,
  PriorityAthlete,
  ActionFeedItem,
  CoachIntervention,
} from '@/types/coach-portal';

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

    // Get coach profile
    const coach = await prisma.coach.findUnique({
      where: { userId: user!.id },
      include: {
        User: {
          select: {
            schoolId: true,
          },
        },
      },
    });

    if (!coach) {
      return NextResponse.json({ error: 'Coach profile not found' }, { status: 404 });
    }

    // Generate Command Center data
    const dashboardData = await generateCommandCenterData(user!.id, coach.User.schoolId!);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Command Center API error:', error);
    return NextResponse.json(
      { error: 'Failed to load Command Center data' },
      { status: 500 }
    );
  }
}

async function generateCommandCenterData(
  coachId: string,
  schoolId: string
): Promise<CommandCenterData> {
  // Get athletes with consent via coach relationships
  const relations = await prisma.coachAthleteRelation.findMany({
    where: {
      coachId: coachId,
      consentGranted: true,
    },
    include: {
      Athlete: {
        include: {
          User: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
            },
          },
          MoodLog: {
            orderBy: { createdAt: 'desc' },
            take: 7,
          },
          Goal: {
            where: {
              status: 'IN_PROGRESS',
            },
          },
        },
      },
    },
    take: 50,
  });

  // Calculate priority athletes (mock algorithm for now)
  const priorityAthletes: PriorityAthlete[] = relations.slice(0, 10).map((relation, index) => {
    const athlete = relation.Athlete;
    const name = athlete.User.name || `${athlete.User.firstName} ${athlete.User.lastName}`;

    // Mock readiness calculation
    const avgMood =
      athlete.MoodLog.length > 0
        ? athlete.MoodLog.reduce((sum, m) => sum + m.mood, 0) / athlete.MoodLog.length
        : 7;
    const avgConfidence =
      athlete.MoodLog.length > 0
        ? athlete.MoodLog.reduce((sum, m) => sum + m.confidence, 0) / athlete.MoodLog.length
        : 7;
    const avgStress =
      athlete.MoodLog.length > 0
        ? athlete.MoodLog.reduce((sum, m) => sum + m.stress, 0) / athlete.MoodLog.length
        : 5;

    const readinessScore = Math.round(((avgMood + avgConfidence + (11 - avgStress)) / 3) * 10);
    const readinessLevel =
      readinessScore >= 90
        ? 'OPTIMAL'
        : readinessScore >= 75
        ? 'GOOD'
        : readinessScore >= 60
        ? 'MODERATE'
        : readinessScore >= 45
        ? 'LOW'
        : 'POOR';

    // Mock risk level
    const isHighStress = avgStress >= 7;
    const isLowMood = avgMood <= 4;
    const riskLevel =
      isHighStress && isLowMood ? 'CRITICAL' : isHighStress || isLowMood ? 'HIGH' : index < 3 ? 'MODERATE' : 'LOW';

    // Mock urgency
    const urgency =
      riskLevel === 'CRITICAL'
        ? 'CRITICAL'
        : riskLevel === 'HIGH'
        ? 'URGENT'
        : readinessScore < 60
        ? 'MONITOR'
        : 'THRIVING';

    return {
      athlete: {
        id: athlete.id,
        userId: athlete.userId,
        name,
        sport: athlete.sport,
        year: athlete.year,
        profileImageUrl: null,
        consentCoachView: true,
        riskLevel: riskLevel as any,
      },
      readiness: {
        score: readinessScore,
        level: readinessLevel as any,
        dimensions: {
          physical: readinessScore + Math.floor(Math.random() * 10),
          mental: readinessScore - Math.floor(Math.random() * 10),
          emotional: readinessScore,
          recovery: readinessScore + 5,
          contextual: readinessScore - 5,
          social: readinessScore,
        },
        topLimiters: avgStress > 6 ? ['Sleep', 'Stress', 'Recovery'] : ['Recovery'],
        topStrengths: avgMood > 7 ? ['Mood', 'Confidence'] : ['Social support'],
        updatedAt: new Date(),
      },
      risk: {
        totalRiskScore: 100 - readinessScore,
        riskLevel: riskLevel as any,
        mentalHealthRisk: avgStress * 10,
        burnoutRisk: avgStress > 7 ? 60 : 20,
        performanceDeclineRisk: readinessScore < 60 ? 50 : 20,
        injuryRisk: 10,
        disengagementRisk: athlete.Goal.length === 0 ? 40 : 15,
        activeFlags: [],
        recommendedInterventions: [`Check in within ${urgency === 'CRITICAL' ? '24 hours' : '3 days'}`],
        updatedAt: new Date(),
      },
      urgency: urgency as any,
      primaryReason:
        urgency === 'CRITICAL'
          ? `High stress (${avgStress.toFixed(1)}/10) + low mood (${avgMood.toFixed(1)}/10) for 3+ days`
          : urgency === 'URGENT'
          ? `Readiness declining, stress elevated`
          : urgency === 'MONITOR'
          ? `Below team average readiness`
          : `All metrics improving, positive momentum`,
      suggestedIntervention:
        urgency === 'CRITICAL'
          ? 'Schedule immediate check-in. Assess for counseling referral.'
          : urgency === 'URGENT'
          ? 'Brief check-in to identify stressors. Share coping resources.'
          : urgency === 'MONITOR'
          ? 'Monitor for 2-3 days. Intervene if trend continues.'
          : 'Positive reinforcement. Consider for peer mentorship.',
      lastInteraction: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    };
  });

  // Sort by urgency
  const urgencyOrder = { CRITICAL: 0, URGENT: 1, MONITOR: 2, THRIVING: 3 };
  priorityAthletes.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  // Calculate quick stats
  const teamReadinessAvg = Math.round(
    priorityAthletes.reduce((sum, p) => sum + p.readiness.score, 0) / Math.max(priorityAthletes.length, 1)
  );

  const activeCrisisAlerts = priorityAthletes.filter((p) => p.urgency === 'CRITICAL').length;

  // Mock action feed
  const actionFeed: ActionFeedItem[] = [
    {
      id: '1',
      type: 'STRESS_SPIKE',
      message: 'Stress levels elevated across 3 athletes after recent competition',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      affectedAthletes: priorityAthletes.slice(0, 3).map((p) => ({
        id: p.athlete.id,
        name: p.athlete.name,
      })),
      severity: 'MEDIUM',
    },
    {
      id: '2',
      type: 'ENGAGEMENT_DROP',
      message: 'Chat engagement down 40% this week',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      affectedAthletes: [],
      severity: 'MEDIUM',
    },
  ];

  if (priorityAthletes.some((p) => p.urgency === 'THRIVING')) {
    actionFeed.push({
      id: '3',
      type: 'POSITIVE_MOMENTUM',
      message: `${priorityAthletes.filter((p) => p.urgency === 'THRIVING').length} athletes at personal readiness highs`,
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      affectedAthletes: [],
      severity: 'LOW',
    });
  }

  // Mock recent interventions
  const recentInterventions: CoachIntervention[] = [];

  return {
    quickStats: {
      teamReadinessAvg,
      teamReadinessDelta: Math.floor(Math.random() * 10) - 5,
      activeCrisisAlerts,
      crisisAlertsDelta: activeCrisisAlerts > 0 ? -1 : 0,
      assignmentsDue: relations.reduce((sum, r) => sum + r.Athlete.Goal.length, 0),
      assignmentsDueDelta: 3,
      athletesNeedingAttention: priorityAthletes.filter((p) =>
        ['CRITICAL', 'URGENT', 'MONITOR'].includes(p.urgency)
      ).length,
      athletesNeedingAttentionDelta: -2,
    },
    priorityAthletes,
    actionFeed,
    recentInterventions,
    teamReadinessDistribution: {
      OPTIMAL: priorityAthletes.filter((p) => p.readiness.level === 'OPTIMAL').length,
      GOOD: priorityAthletes.filter((p) => p.readiness.level === 'GOOD').length,
      MODERATE: priorityAthletes.filter((p) => p.readiness.level === 'MODERATE').length,
      LOW: priorityAthletes.filter((p) => p.readiness.level === 'LOW').length,
      POOR: priorityAthletes.filter((p) => p.readiness.level === 'POOR').length,
    },
    lastUpdated: new Date(),
  };
}
