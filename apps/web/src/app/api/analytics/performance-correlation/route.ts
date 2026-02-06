/**
 * Performance Correlation Analysis API
 *
 * GET /api/analytics/performance-correlation
 * Query params:
 *   - athleteId (optional): Specific athlete ID for individual analysis
 *   - days (optional, default 90): Number of days to analyze
 *
 * Without athleteId:
 *   - Coaches get team-wide aggregated correlations
 *   - Athletes get their own analysis
 *
 * Returns correlation analysis between mental state metrics and performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyOwnership } from '@/lib/auth-helpers';
import {
  analyzePerformanceCorrelations,
  analyzeTeamPerformanceCorrelations,
} from '@/lib/analytics/performance-correlation';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Verify authentication
  const { authorized, user, response } = await requireAuth(req);
  if (!authorized) return response;

  try {
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const athleteId = searchParams.get('athleteId');
    const daysParam = searchParams.get('days');
    const days = daysParam ? Math.min(parseInt(daysParam, 10), 365) : 90;

    // If no athleteId provided, handle based on role
    if (!athleteId) {
      if (user!.role === 'COACH' || user!.role === 'ADMIN') {
        // Get team-wide correlations for coaches
        const schoolId = user!.schoolId;

        if (!schoolId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Coach must be associated with a school',
            },
            { status: 400 }
          );
        }

        const teamAnalysis = await analyzeTeamPerformanceCorrelations(schoolId, undefined, days);

        return NextResponse.json({
          success: true,
          data: {
            type: 'team',
            teamSize: teamAnalysis.teamSize,
            correlations: teamAnalysis.avgCorrelations,
            consistentFactors: teamAnalysis.consistentFactors,
            dateRange: {
              from: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
              to: new Date(),
            },
          },
        });
      } else if (user!.role === 'ATHLETE') {
        // Athletes get their own analysis when no athleteId specified
        const analysis = await analyzePerformanceCorrelations(user!.id, days);
        return NextResponse.json({
          success: true,
          data: analysis,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Unknown user role',
          },
          { status: 403 }
        );
      }
    }

    // Specific athleteId provided - authorization check
    if (user!.role === 'ATHLETE') {
      if (!verifyOwnership(user, athleteId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden - You can only access your own analytics',
          },
          { status: 403 }
        );
      }
    } else if (user!.role === 'COACH') {
      // Verify coach has access to athlete (consent required)
      const relation = await prisma.coachAthleteRelation.findFirst({
        where: {
          coachId: user!.id,
          athleteId,
          consentGranted: true,
        },
      });

      if (!relation) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden - Athlete has not granted consent',
          },
          { status: 403 }
        );
      }
    }
    // ADMINs can access all analytics

    // Run individual correlation analysis
    const analysis = await analyzePerformanceCorrelations(athleteId, days);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('[API] Error analyzing performance correlations:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze performance correlations',
      },
      { status: 500 }
    );
  }
}
