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

    // Return mock data for demo coach
    if (user!.id.startsWith('demo-')) {
      const mockAthletes = [
        {
          relationId: 'rel-1',
          joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          consentGranted: true,
          coachNotes: 'Strong performer, working on pre-game anxiety',
          id: 'athlete-1',
          name: 'Sarah Johnson',
          email: 'sarah.j@university.edu',
          sport: 'Basketball',
          year: 'Junior',
          position: 'Point Guard',
          riskLevel: 'LOW',
          lastMoodLog: { mood: 8, confidence: 9, stress: 3, createdAt: new Date().toISOString() },
          activeGoalsCount: 2,
          dataAccessible: true,
        },
        {
          relationId: 'rel-2',
          joinedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          consentGranted: true,
          coachNotes: 'At-risk - declining mood scores',
          id: 'athlete-2',
          name: 'Mike Chen',
          email: 'mike.c@university.edu',
          sport: 'Basketball',
          year: 'Sophomore',
          position: 'Forward',
          riskLevel: 'HIGH',
          lastMoodLog: { mood: 5, confidence: 4, stress: 8, createdAt: new Date().toISOString() },
          activeGoalsCount: 1,
          dataAccessible: true,
        },
        {
          relationId: 'rel-3',
          joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          consentGranted: true,
          coachNotes: null,
          id: 'athlete-3',
          name: 'Emily Rodriguez',
          email: 'emily.r@university.edu',
          sport: 'Soccer',
          year: 'Senior',
          position: 'Midfielder',
          riskLevel: 'MEDIUM',
          lastMoodLog: { mood: 6, confidence: 6, stress: 6, createdAt: new Date().toISOString() },
          activeGoalsCount: 3,
          dataAccessible: true,
        },
        {
          relationId: 'rel-4',
          joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          consentGranted: false,
          coachNotes: null,
          id: 'athlete-4',
          name: 'Alex Turner',
          email: 'alex.t@university.edu',
          sport: 'Track',
          year: 'Freshman',
          position: 'Sprinter',
          riskLevel: 'LOW',
          lastMoodLog: null,
          activeGoalsCount: 0,
          dataAccessible: false,
        },
      ];

      // Apply filters
      let filtered = mockAthletes;
      if (sport) {
        filtered = filtered.filter((a) => a.sport === sport);
      }
      if (riskLevel) {
        filtered = filtered.filter((a) => a.riskLevel === riskLevel);
      }
      if (consentOnly) {
        filtered = filtered.filter((a) => a.consentGranted);
      }

      return NextResponse.json({
        success: true,
        data: filtered,
      });
    }

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
