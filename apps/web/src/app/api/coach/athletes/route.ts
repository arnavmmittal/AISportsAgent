/**
 * Coach Athletes List API
 * Returns list of athletes connected to coach
 * SECURITY: Only shows athletes connected via CoachAthleteRelation
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
    const riskLevel = searchParams.get('riskLevel');
    const consentOnly = searchParams.get('consentOnly') === 'true';

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

    // Build filter for coach-athlete relationships
    const where: any = {
      coachId: coach.userId,
    };

    // Add consent filter if requested
    if (consentOnly) {
      where.consentGranted = true;
    }

    // Get all coach-athlete relationships
    const relations = await prisma.coachAthleteRelation.findMany({
      where,
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
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            Goal: {
              where: {
                status: { in: ['IN_PROGRESS', 'NOT_STARTED'] },
              },
              take: 3,
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Apply client-side filters for sport and risk level
    let filteredRelations = relations;

    if (sport) {
      filteredRelations = filteredRelations.filter(
        (r) => r.Athlete.sport === sport
      );
    }

    if (riskLevel) {
      filteredRelations = filteredRelations.filter(
        (r) => r.Athlete.riskLevel === riskLevel
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredRelations.map((r) => ({
        // Relationship info
        relationId: r.id,
        joinedAt: r.joinedAt,
        consentGranted: r.consentGranted,
        coachNotes: r.notes,

        // Athlete info
        id: r.Athlete.User.id,
        name: r.Athlete.User.name,
        email: r.Athlete.User.email,
        sport: r.Athlete.sport,
        year: r.Athlete.year,
        position: r.Athlete.teamPosition,
        riskLevel: r.Athlete.riskLevel,

        // Latest mood log (if consent granted)
        lastMoodLog: r.consentGranted ? r.Athlete.MoodLog?.[0] || null : null,

        // Active goals count (if consent granted)
        activeGoalsCount: r.consentGranted ? r.Athlete.Goal?.length || 0 : 0,

        // Privacy indicator
        dataAccessible: r.consentGranted,
      })),
    });
  } catch (error) {
    console.error('Error fetching athletes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch athletes' },
      { status: 500 }
    );
  }
}
