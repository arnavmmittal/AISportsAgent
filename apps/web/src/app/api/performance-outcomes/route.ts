/**
 * Performance Outcomes API
 * Tracks game/practice results with mental state context
 *
 * POST - Create a new performance outcome (coach or athlete)
 * GET - List performance outcomes (filtered by athlete, date range, type)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifySchoolAccess } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for creating a performance outcome
const createOutcomeSchema = z.object({
  athleteId: z.string().cuid(),
  date: z.string().datetime(),
  outcomeType: z.enum(['PRACTICE', 'SCRIMMAGE', 'GAME', 'TOURNAMENT', 'COMPETITION']),

  // Universal metrics (optional)
  overallRating: z.number().min(1).max(10).optional(),
  consistencyScore: z.number().min(0).max(100).optional(),
  clutchScore: z.number().min(0).max(100).optional(),
  effortScore: z.number().min(0).max(100).optional(),
  focusScore: z.number().min(0).max(100).optional(),

  // Sport-specific metrics (flexible JSON)
  sportMetrics: z.record(z.any()).optional(),

  // Context
  opponent: z.string().optional(),
  stakes: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  homeAway: z.enum(['HOME', 'AWAY', 'NEUTRAL']).optional(),
  gameResult: z.enum(['WIN', 'LOSS', 'DRAW']).optional(),

  // Pre-event state (captured at time of competition)
  preEventMood: z.number().min(1).max(10).optional(),
  preEventConfidence: z.number().min(1).max(10).optional(),
  preEventStress: z.number().min(1).max(10).optional(),
  preEventSleep: z.number().min(0).max(24).optional(),
  preEventHRV: z.number().positive().optional(),
  preEventRecovery: z.number().min(0).max(100).optional(),

  notes: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized || !user) return response;

    const body = await request.json();
    const validated = createOutcomeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Verify access to athlete
    const athlete = await prisma.athlete.findUnique({
      where: { userId: data.athleteId },
      include: { User: { select: { schoolId: true } } },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    // Check permissions: athlete can log their own, coach can log for their athletes
    const isOwnData = user.id === data.athleteId;
    const isCoach = user.role === 'COACH' || user.role === 'ADMIN';
    const sameSchool = verifySchoolAccess(user, athlete.User.schoolId);

    if (!isOwnData && !(isCoach && sameSchool)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create the performance outcome
    const outcome = await prisma.performanceOutcome.create({
      data: {
        athleteId: data.athleteId,
        date: new Date(data.date),
        outcomeType: data.outcomeType,
        overallRating: data.overallRating,
        consistencyScore: data.consistencyScore,
        clutchScore: data.clutchScore,
        effortScore: data.effortScore,
        focusScore: data.focusScore,
        sportMetrics: data.sportMetrics,
        opponent: data.opponent,
        stakes: data.stakes || 'MEDIUM',
        homeAway: data.homeAway,
        gameResult: data.gameResult,
        preEventMood: data.preEventMood,
        preEventConfidence: data.preEventConfidence,
        preEventStress: data.preEventStress,
        preEventSleep: data.preEventSleep,
        preEventHRV: data.preEventHRV,
        preEventRecovery: data.preEventRecovery,
        notes: data.notes,
        recordedBy: isCoach ? user.id : undefined,
      },
    });

    return NextResponse.json({ outcome }, { status: 201 });
  } catch (error) {
    console.error('Performance outcome creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized || !user) return response;

    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const outcomeType = searchParams.get('outcomeType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    // For athletes, only show their own data
    if (user.role === 'ATHLETE') {
      where.athleteId = user.id;
    } else if (athleteId) {
      // For coaches, verify school access
      const athlete = await prisma.athlete.findUnique({
        where: { userId: athleteId },
        include: { User: { select: { schoolId: true } } },
      });

      if (!athlete || !verifySchoolAccess(user, athlete.User.schoolId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      where.athleteId = athleteId;
    } else if (user.role === 'COACH') {
      // Coach viewing all their athletes
      const coachAthletes = await prisma.coachAthleteRelation.findMany({
        where: { coachId: user.id },
        select: { athleteId: true },
      });
      where.athleteId = { in: coachAthletes.map((ca) => ca.athleteId) };
    }

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Outcome type filter
    if (outcomeType) {
      where.outcomeType = outcomeType;
    }

    const [outcomes, total] = await Promise.all([
      prisma.performanceOutcome.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
        include: {
          Athlete: {
            include: {
              User: { select: { name: true } },
            },
          },
        },
      }),
      prisma.performanceOutcome.count({ where }),
    ]);

    return NextResponse.json({
      outcomes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + outcomes.length < total,
      },
    });
  } catch (error) {
    console.error('Performance outcomes fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
