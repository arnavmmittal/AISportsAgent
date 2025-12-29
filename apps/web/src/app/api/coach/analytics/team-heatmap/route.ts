/**
 * Team Readiness Heatmap API
 *
 * GET /api/coach/analytics/team-heatmap
 * Query params: coachId, days (optional, default 14)
 *
 * Returns 2D grid of readiness scores for all consented athletes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verify coach authentication
  const { authorized, user, response } = await requireCoach(req);
  if (!authorized) return response;

  try {
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const coachId = searchParams.get('coachId') || user!.id;
    const daysParam = searchParams.get('days');

    const days = daysParam ? Math.min(parseInt(daysParam, 10), 30) : 14;

    // Get all athletes with consent for this coach
    const athleteRelations = await prisma.coachAthleteRelation.findMany({
      where: {
        coachId,
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
      orderBy: {
        Athlete: {
          User: {
            name: 'asc',
          },
        },
      },
    });

    if (athleteRelations.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          athletes: [],
          dates: [],
          data: [],
        },
      });
    }

    // Generate date range
    const dates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]); // YYYY-MM-DD
    }

    // Fetch readiness scores for all athletes over the date range
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const athleteIds = athleteRelations.map((rel) => rel.athleteId);

    const readinessScores = await prisma.readinessScore.findMany({
      where: {
        athleteId: {
          in: athleteIds,
        },
        createdAt: {
          gte: fromDate,
        },
      },
      select: {
        athleteId: true,
        overallScore: true,
        level: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group scores by athlete and date
    const scoresByAthleteDate: Record<string, Record<string, { score: number; level: string }>> = {};

    for (const score of readinessScores) {
      const athleteId = score.athleteId;
      const dateKey = score.createdAt.toISOString().split('T')[0];

      if (!scoresByAthleteDate[athleteId]) {
        scoresByAthleteDate[athleteId] = {};
      }

      // Take the most recent score for each date (they're ordered desc)
      if (!scoresByAthleteDate[athleteId][dateKey]) {
        scoresByAthleteDate[athleteId][dateKey] = {
          score: score.overallScore,
          level: score.level,
        };
      }
    }

    // Build heatmap grid
    const athletes = athleteRelations.map((rel) => ({
      id: rel.athleteId,
      name: rel.Athlete.User.name || rel.Athlete.User.email,
    }));

    const heatmapData = athleteRelations.map((rel) => {
      const athleteId = rel.athleteId;
      const athleteName = rel.Athlete.User.name || rel.Athlete.User.email;

      return dates.map((date) => {
        const scoreData = scoresByAthleteDate[athleteId]?.[date];

        return {
          athleteId,
          athleteName,
          date,
          score: scoreData?.score || null,
          level: scoreData?.level || 'NO_DATA',
        };
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        athletes,
        dates,
        data: heatmapData,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching team heatmap:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch team heatmap',
      },
      { status: 500 }
    );
  }
}
