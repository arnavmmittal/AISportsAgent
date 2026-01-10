/**
 * Game Import API
 * Import performance data from ESPN or CSV
 *
 * POST - Import games (ESPN or CSV)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { importGamesFromESPN, importFromCSV } from '@/lib/sports-data/game-importer';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const espnImportSchema = z.object({
  source: z.literal('espn'),
  daysBack: z.number().min(1).max(365).optional(),
  sport: z.string().optional(),
  athleteIds: z.array(z.string()).optional(),
});

const csvImportSchema = z.object({
  source: z.literal('csv'),
  data: z.array(
    z.object({
      athleteEmail: z.string().email(),
      date: z.string(),
      outcomeType: z.string().optional(),
      opponent: z.string().optional(),
      homeAway: z.string().optional(),
      gameResult: z.string().optional(),
      overallRating: z.number().optional(),
    }).passthrough() // Allow additional sport-specific fields
  ),
});

const importSchema = z.union([espnImportSchema, csvImportSchema]);

export async function POST(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);
    if (!authorized || !user) return response;

    const body = await request.json();
    const validated = importSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const data = validated.data;

    if (data.source === 'espn') {
      // Import from ESPN
      const summary = await importGamesFromESPN(user.schoolId, {
        daysBack: data.daysBack,
        sport: data.sport,
        athleteIds: data.athleteIds,
      });

      return NextResponse.json({
        success: true,
        source: 'espn',
        summary,
      });
    } else {
      // Import from CSV
      const summary = await importFromCSV(user.id, data.data);

      return NextResponse.json({
        success: true,
        source: 'csv',
        summary,
      });
    }
  } catch (error) {
    console.error('Import games error:', error);
    return NextResponse.json(
      { error: 'Import failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get available sports and recent import history
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);
    if (!authorized || !user) return response;

    // Get unique sports from coach's athletes
    const coachAthletes = await prisma.coachAthleteRelation.findMany({
      where: { coachId: user.id },
      include: {
        Athlete: {
          select: { sport: true },
        },
      },
    });

    const sports = [...new Set(coachAthletes.map((ca) => ca.Athlete.sport))];

    // Get recent imports (performance outcomes created by this coach)
    const recentImports = await prisma.performanceOutcome.findMany({
      where: { recordedBy: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        Athlete: {
          include: {
            User: { select: { name: true } },
          },
        },
      },
    });

    // Get import statistics
    const importStats = await prisma.performanceOutcome.groupBy({
      by: ['outcomeType'],
      where: { recordedBy: user.id },
      _count: true,
    });

    return NextResponse.json({
      sports,
      recentImports: recentImports.map((imp) => ({
        id: imp.id,
        athleteName: imp.Athlete.User.name,
        date: imp.date,
        opponent: imp.opponent,
        outcomeType: imp.outcomeType,
        gameResult: imp.gameResult,
        overallRating: imp.overallRating,
        createdAt: imp.createdAt,
      })),
      stats: {
        total: importStats.reduce((sum, s) => sum + s._count, 0),
        byType: Object.fromEntries(importStats.map((s) => [s.outcomeType, s._count])),
      },
    });
  } catch (error) {
    console.error('Get import info error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
