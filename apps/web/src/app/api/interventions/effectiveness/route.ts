/**
 * Intervention Effectiveness API
 * Get statistics on intervention effectiveness
 *
 * GET - Get effectiveness statistics by type, context, athlete
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifySchoolAccess } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface EffectivenessStats {
  type: string;
  context: string;
  count: number;
  completedCount: number;
  avgEffectiveness: number | null;
  avgMoodChange: number | null;
  avgConfidenceChange: number | null;
  avgStressChange: number | null;
  avgPerformanceChange: number | null;
  avgRating: number | null;
}

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized || !user) return response;

    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');
    const groupBy = searchParams.get('groupBy') || 'type'; // type, context, or both

    // Build where clause
    const where: any = {};

    if (user.role === 'ATHLETE') {
      where.athleteId = user.id;
    } else if (athleteId) {
      // Verify school access for coaches
      const athlete = await prisma.athlete.findUnique({
        where: { userId: athleteId },
        include: { User: { select: { schoolId: true } } },
      });

      if (!athlete || !verifySchoolAccess(user, athlete.User.schoolId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      where.athleteId = athleteId;
    } else if (user.role === 'COACH') {
      // Get all athletes for this coach
      const coachAthletes = await prisma.coachAthleteRelation.findMany({
        where: { coachId: user.id },
        select: { athleteId: true },
      });
      where.athleteId = { in: coachAthletes.map((ca) => ca.athleteId) };
    }

    // Get all interventions with their outcomes
    const interventions = await prisma.intervention.findMany({
      where,
      include: {
        Outcomes: true,
      },
    });

    // Calculate effectiveness by grouping
    const statsMap = new Map<string, EffectivenessStats>();

    for (const intervention of interventions) {
      // Determine group key
      let key: string;
      if (groupBy === 'both') {
        key = `${intervention.type}|${intervention.context}`;
      } else if (groupBy === 'context') {
        key = intervention.context;
      } else {
        key = intervention.type;
      }

      if (!statsMap.has(key)) {
        statsMap.set(key, {
          type: groupBy === 'context' ? 'ALL' : intervention.type,
          context: groupBy === 'type' ? 'ALL' : intervention.context,
          count: 0,
          completedCount: 0,
          avgEffectiveness: null,
          avgMoodChange: null,
          avgConfidenceChange: null,
          avgStressChange: null,
          avgPerformanceChange: null,
          avgRating: null,
        });
      }

      const stats = statsMap.get(key)!;
      stats.count++;

      if (intervention.completed) {
        stats.completedCount++;
      }

      // Aggregate ratings
      if (intervention.athleteRating !== null) {
        if (stats.avgRating === null) {
          stats.avgRating = intervention.athleteRating;
        } else {
          // Rolling average
          stats.avgRating =
            (stats.avgRating * (stats.count - 1) + intervention.athleteRating) / stats.count;
        }
      }

      // Aggregate effectiveness scores
      if (intervention.effectivenessScore !== null) {
        if (stats.avgEffectiveness === null) {
          stats.avgEffectiveness = intervention.effectivenessScore;
        } else {
          stats.avgEffectiveness =
            (stats.avgEffectiveness * (stats.count - 1) + intervention.effectivenessScore) /
            stats.count;
        }
      }

      // Aggregate outcome changes
      for (const outcome of intervention.Outcomes) {
        if (outcome.moodChange !== null) {
          stats.avgMoodChange =
            stats.avgMoodChange === null
              ? outcome.moodChange
              : (stats.avgMoodChange + outcome.moodChange) / 2;
        }
        if (outcome.confidenceChange !== null) {
          stats.avgConfidenceChange =
            stats.avgConfidenceChange === null
              ? outcome.confidenceChange
              : (stats.avgConfidenceChange + outcome.confidenceChange) / 2;
        }
        if (outcome.stressChange !== null) {
          stats.avgStressChange =
            stats.avgStressChange === null
              ? outcome.stressChange
              : (stats.avgStressChange + outcome.stressChange) / 2;
        }
        if (outcome.performanceChange !== null) {
          stats.avgPerformanceChange =
            stats.avgPerformanceChange === null
              ? outcome.performanceChange
              : (stats.avgPerformanceChange + outcome.performanceChange) / 2;
        }
      }
    }

    // Convert to array and sort by effectiveness
    const stats = Array.from(statsMap.values())
      .filter((s) => s.completedCount > 0)
      .sort((a, b) => {
        const aEff = a.avgEffectiveness ?? -999;
        const bEff = b.avgEffectiveness ?? -999;
        return bEff - aEff;
      });

    // Calculate overall summary
    const summary = {
      totalInterventions: interventions.length,
      completedInterventions: interventions.filter((i) => i.completed).length,
      withOutcomeData: interventions.filter((i) => i.Outcomes.length > 0).length,
      topPerforming: stats.slice(0, 3).map((s) => ({
        type: s.type,
        context: s.context,
        effectiveness: s.avgEffectiveness,
      })),
    };

    return NextResponse.json({
      stats,
      summary,
      groupBy,
    });
  } catch (error) {
    console.error('Effectiveness stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
