/**
 * Coach Athlete Detail API
 * Returns detailed information about a specific athlete
 * SECURITY: Only shows athletes connected via CoachAthleteRelation with consent
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const athleteId = params.id;

    // Get coach profile
    const coach = await prisma.coach.findUnique({
      where: { userId: user!.id },
    });

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      );
    }

    // Verify coach-athlete relationship exists
    const relation = await prisma.coachAthleteRelation.findUnique({
      where: {
        coachId_athleteId: {
          coachId: coach.userId,
          athleteId: athleteId,
        },
      },
    });

    if (!relation) {
      return NextResponse.json(
        { error: 'Athlete not found or not connected to this coach' },
        { status: 404 }
      );
    }

    // Get athlete with full details
    const athlete = await prisma.athlete.findUnique({
      where: { userId: athleteId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        MoodLog: {
          orderBy: { createdAt: 'desc' },
          take: 30, // Last 30 mood logs
        },
        Goal: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        ChatSession: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            createdAt: true,
            _count: {
              select: {
                Message: true,
              },
            },
          },
        },
        CrisisAlert: {
          orderBy: { detectedAt: 'desc' },
          take: 5,
          include: {
            Message: {
              select: {
                content: true,
              },
            },
          },
        },
      },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete profile not found' },
        { status: 404 }
      );
    }

    // Get coach notes for this athlete
    const coachNotes = await prisma.coachNote.findMany({
      where: {
        coachId: coach.userId,
        athleteId: athleteId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Calculate statistics
    const recentMoodLogs = athlete.MoodLog.slice(0, 7);
    const avgMood = recentMoodLogs.length > 0
      ? recentMoodLogs.reduce((sum, m) => sum + m.mood, 0) / recentMoodLogs.length
      : 0;
    const avgConfidence = recentMoodLogs.length > 0
      ? recentMoodLogs.reduce((sum, m) => sum + m.confidence, 0) / recentMoodLogs.length
      : 0;
    const avgStress = recentMoodLogs.length > 0
      ? recentMoodLogs.reduce((sum, m) => sum + m.stress, 0) / recentMoodLogs.length
      : 0;

    const activeGoals = athlete.Goal.filter(
      (g) => g.status === 'IN_PROGRESS' || g.status === 'NOT_STARTED'
    );
    const completedGoals = athlete.Goal.filter((g) => g.status === 'COMPLETED');

    // Return data based on consent status
    if (!relation.consentGranted) {
      return NextResponse.json({
        success: true,
        consentGranted: false,
        data: {
          athlete: {
            id: athlete.User.id,
            name: athlete.User.name,
            email: athlete.User.email,
            sport: athlete.sport,
            year: athlete.year,
            teamPosition: athlete.teamPosition,
            riskLevel: athlete.riskLevel,
          },
          relationship: {
            joinedAt: relation.joinedAt,
            notes: relation.notes,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      consentGranted: true,
      data: {
        athlete: {
          id: athlete.User.id,
          name: athlete.User.name,
          email: athlete.User.email,
          sport: athlete.sport,
          year: athlete.year,
          teamPosition: athlete.teamPosition,
          riskLevel: athlete.riskLevel,
          createdAt: athlete.User.createdAt,
        },
        relationship: {
          joinedAt: relation.joinedAt,
          notes: relation.notes,
        },
        statistics: {
          avgMood: Math.round(avgMood * 10) / 10,
          avgConfidence: Math.round(avgConfidence * 10) / 10,
          avgStress: Math.round(avgStress * 10) / 10,
          totalMoodLogs: athlete.MoodLog.length,
          activeGoals: activeGoals.length,
          completedGoals: completedGoals.length,
          totalGoals: athlete.Goal.length,
          chatSessions: athlete.ChatSession.length,
          crisisAlerts: athlete.CrisisAlert.length,
        },
        moodLogs: athlete.MoodLog,
        goals: athlete.Goal,
        chatSessions: athlete.ChatSession,
        crisisAlerts: athlete.CrisisAlert,
        coachNotes,
      },
    });
  } catch (error) {
    console.error('Error fetching athlete details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch athlete details' },
      { status: 500 }
    );
  }
}
