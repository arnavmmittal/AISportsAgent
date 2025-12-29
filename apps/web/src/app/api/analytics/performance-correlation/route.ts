/**
 * Performance Correlation Analysis API
 *
 * GET /api/analytics/performance-correlation
 * Query params: athleteId, days (optional, default 90)
 *
 * Returns correlation analysis between mental state metrics and performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyOwnership, verifySchoolAccess } from '@/lib/auth-helpers';
import { analyzePerformanceCorrelations } from '@/lib/analytics/performance-correlation';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verify authentication
  const { authorized, user, response } = await requireAuth(req);
  if (!authorized) return response;

  try {
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const athleteId = searchParams.get('athleteId');
    const daysParam = searchParams.get('days');

    // Validation
    if (!athleteId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: athleteId',
        },
        { status: 400 }
      );
    }

    const days = daysParam ? Math.min(parseInt(daysParam, 10), 365) : 90;

    // Authorization check
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

    // Run correlation analysis
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
