/**
 * Performance Record API - Save game performance metrics
 *
 * POST /api/performance/record
 * - Validates input with Zod
 * - Links to nearest MoodLog (mental state snapshot)
 * - Calculates readiness score for that game
 * - Saves PerformanceMetric to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireCoach, verifySchoolAccess } from '@/lib/auth-helpers';

// Request validation schema
const recordPerformanceSchema = z.object({
  athleteId: z.string().min(1),
  gameDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  opponentName: z.string().min(1),
  outcome: z.enum(['win', 'loss', 'draw']),
  stats: z.record(z.number()),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication and require COACH role
    const { authorized, session, response } = await requireCoach();
    if (!authorized || !session) return response;

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = recordPerformanceSchema.parse(body);

    // 3. Verify athlete exists and belongs to coach's school
    const athlete = await prisma.athlete.findUnique({
      where: { userId: validatedData.athleteId },
      include: {
        User: true,
      },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    // 5. Parse game date
    const gameDate = new Date(validatedData.gameDate);
    if (isNaN(gameDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid game date' },
        { status: 400 }
      );
    }

    // 6. Find nearest MoodLog (±3 days from game)
    const threeDaysAgo = new Date(gameDate);
    threeDaysAgo.setDate(gameDate.getDate() - 3);
    const threeDaysLater = new Date(gameDate);
    threeDaysLater.setDate(gameDate.getDate() + 3);

    const nearestMoodLogs = await prisma.moodLog.findMany({
      where: {
        athleteId: validatedData.athleteId,
        createdAt: {
          gte: threeDaysAgo,
          lte: threeDaysLater,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });

    const nearestMoodLog = nearestMoodLogs[0];

    // 7. Extract mental state snapshot from mood log
    const mentalState = nearestMoodLog
      ? {
          mentalMoodScore: nearestMoodLog.mood,
          mentalStressScore: nearestMoodLog.stress,
          mentalSleepHours: nearestMoodLog.sleep,
          mentalHRVScore: null, // Will be populated from wearable data later
        }
      : {
          mentalMoodScore: null,
          mentalStressScore: null,
          mentalSleepHours: null,
          mentalHRVScore: null,
        };

    // 8. Calculate readiness score by calling MCP backend
    let readinessScore: number | null = null;

    try {
      const readinessResponse = await fetch(
        `http://localhost:8000/api/analytics/readiness?athlete_id=${validatedData.athleteId}&game_date=${validatedData.gameDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (readinessResponse.ok) {
        const readinessData = await readinessResponse.json();
        readinessScore = readinessData.score;
      }
    } catch (error) {
      console.error('Failed to calculate readiness score:', error);
      // Continue without readiness score
    }

    // 9. Get athlete's sport for PerformanceMetric
    const sport = athlete.sport;

    // 10. Save PerformanceMetric to database
    const performanceMetric = await prisma.performanceMetric.create({
      data: {
        athleteId: validatedData.athleteId,
        gameDate: gameDate,
        sport: sport,
        opponentName: validatedData.opponentName,
        outcome: validatedData.outcome,
        stats: validatedData.stats,
        ...mentalState,
        readinessScore: readinessScore,
        slumpPrediction: null, // Will be calculated by ML model later
      },
    });

    // 11. Return success response
    return NextResponse.json({
      success: true,
      performanceMetricId: performanceMetric.id,
      message: 'Game stats saved successfully',
      data: {
        athleteName: athlete.User.name,
        gameDate: performanceMetric.gameDate.toISOString(),
        outcome: performanceMetric.outcome,
        readinessScore: readinessScore,
        mentalStateLinked: !!nearestMoodLog,
        moodLogDate: nearestMoodLog?.createdAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('Error recording performance:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle Prisma errors
    if (error instanceof Error && error.message.includes('Prisma')) {
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // Generic error
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve performance history (optional)
export async function GET(request: NextRequest) {
  try {
    // Require COACH role
    const { authorized, session, response } = await requireCoach();
    if (!authorized || !session) return response;

    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');

    if (!athleteId) {
      return NextResponse.json(
        { error: 'athleteId query parameter required' },
        { status: 400 }
      );
    }

    const performanceHistory = await prisma.performanceMetric.findMany({
      where: {
        athleteId: athleteId,
      },
      orderBy: {
        gameDate: 'desc',
      },
      take: 50, // Last 50 games
    });

    return NextResponse.json({
      success: true,
      count: performanceHistory.length,
      data: performanceHistory,
    });

  } catch (error) {
    console.error('Error fetching performance history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
