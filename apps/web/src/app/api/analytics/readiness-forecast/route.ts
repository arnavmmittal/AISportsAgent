/**
 * Readiness Forecast API
 *
 * GET /api/analytics/readiness-forecast
 * Query params: athleteId, days (optional, default 30)
 *
 * Returns 7-day readiness forecast using exponential smoothing
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyOwnership } from '@/lib/auth-helpers';
import { forecastReadinessTrend } from '@/lib/analytics/forecasting';
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

    const days = daysParam ? Math.min(parseInt(daysParam, 10), 90) : 30;

    // Authorization check
    if (user!.role === 'ATHLETE') {
      if (!verifyOwnership(user, athleteId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden - You can only access your own forecast',
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
    // ADMINs can access all forecasts

    // Generate forecast
    const forecastData = await forecastReadinessTrend(athleteId, days);

    return NextResponse.json({
      success: true,
      data: forecastData,
    });
  } catch (error) {
    console.error('[API] Error generating readiness forecast:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate readiness forecast',
      },
      { status: 500 }
    );
  }
}
