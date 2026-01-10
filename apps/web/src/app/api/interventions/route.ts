/**
 * Interventions API
 * Tracks mental performance techniques used by athletes
 *
 * POST - Log a new intervention (athlete or AI-suggested)
 * GET - List interventions with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifySchoolAccess } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for creating an intervention
const createInterventionSchema = z.object({
  athleteId: z.string().cuid().optional(), // Optional for athletes logging their own
  type: z.enum([
    'BREATHING',
    'VISUALIZATION',
    'SELF_TALK',
    'ROUTINE',
    'FOCUS_CUE',
    'AROUSAL_REGULATION',
    'GOAL_SETTING',
    'COGNITIVE_REFRAME',
    'MINDFULNESS',
    'JOURNALING',
    'PHYSICAL_WARMUP',
    'OTHER',
  ]),
  protocol: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  performedAt: z.string().datetime(),
  context: z.enum([
    'PRE_GAME',
    'PRE_PRACTICE',
    'DURING_COMPETITION',
    'HALFTIME',
    'POST_ERROR',
    'POST_GAME',
    'POST_LOSS',
    'RECOVERY',
    'SLUMP',
    'INJURY_RETURN',
    'DAILY_ROUTINE',
    'ON_DEMAND',
  ]),
  situation: z.string().max(500).optional(),
  source: z.enum(['AI_SUGGESTED', 'COACH_ASSIGNED', 'SELF_INITIATED', 'PROTOCOL_SCHEDULED']),
  suggestedInSessionId: z.string().cuid().optional(),
  completed: z.boolean().optional(),
  athleteRating: z.number().min(1).max(5).optional(),
  athleteNotes: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized || !user) return response;

    const body = await request.json();
    const validated = createInterventionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Determine athlete ID
    let athleteId = data.athleteId;
    if (!athleteId) {
      // Athletes can only log for themselves
      if (user.role !== 'ATHLETE') {
        return NextResponse.json(
          { error: 'athleteId required for non-athletes' },
          { status: 400 }
        );
      }
      athleteId = user.id;
    }

    // Verify access
    const athlete = await prisma.athlete.findUnique({
      where: { userId: athleteId },
      include: { User: { select: { schoolId: true } } },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    const isOwnData = user.id === athleteId;
    const isCoach = user.role === 'COACH' || user.role === 'ADMIN';
    const sameSchool = verifySchoolAccess(user, athlete.User.schoolId);

    if (!isOwnData && !(isCoach && sameSchool)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create the intervention
    const intervention = await prisma.intervention.create({
      data: {
        athleteId,
        type: data.type,
        protocol: data.protocol,
        description: data.description,
        performedAt: new Date(data.performedAt),
        context: data.context,
        situation: data.situation,
        source: data.source,
        suggestedInSessionId: data.suggestedInSessionId,
        completed: data.completed ?? false,
        athleteRating: data.athleteRating,
        athleteNotes: data.athleteNotes,
      },
    });

    return NextResponse.json({ intervention }, { status: 201 });
  } catch (error) {
    console.error('Intervention creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized || !user) return response;

    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');
    const type = searchParams.get('type');
    const context = searchParams.get('context');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const completed = searchParams.get('completed');
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

    // Filters
    if (type) where.type = type;
    if (context) where.context = context;
    if (completed !== null && completed !== undefined) {
      where.completed = completed === 'true';
    }

    // Date range filter
    if (startDate || endDate) {
      where.performedAt = {};
      if (startDate) where.performedAt.gte = new Date(startDate);
      if (endDate) where.performedAt.lte = new Date(endDate);
    }

    const [interventions, total] = await Promise.all([
      prisma.intervention.findMany({
        where,
        orderBy: { performedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          Athlete: {
            include: {
              User: { select: { name: true } },
            },
          },
          Outcomes: true,
        },
      }),
      prisma.intervention.count({ where }),
    ]);

    return NextResponse.json({
      interventions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + interventions.length < total,
      },
    });
  } catch (error) {
    console.error('Interventions fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
