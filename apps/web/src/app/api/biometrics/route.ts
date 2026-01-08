/**
 * Biometric Data API - GET endpoint
 *
 * Query biometric data for an athlete with flexible filtering:
 * - By metric type (hrv, resting_hr, sleep_duration, recovery_score)
 * - By date range (last N days)
 * - By device type
 *
 * Returns time-series data for visualization components
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyOwnership } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering (prevent static generation)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/biometrics
 *
 * Query parameters:
 * - athleteId (required): User ID of athlete
 * - metricType (optional): hrv | resting_hr | sleep_duration | recovery_score
 * - days (optional): Number of days to fetch (default: 30, max: 90)
 * - deviceType (optional): Filter by device (whoop, oura, garmin, apple_watch)
 *
 * Returns:
 * {
 *   success: true,
 *   data: [
 *     {
 *       id: string,
 *       metricType: string,
 *       value: number,
 *       unit: string,
 *       recordedAt: Date,
 *       deviceType: string
 *     },
 *     ...
 *   ],
 *   meta: {
 *     athleteId: string,
 *     metricType?: string,
 *     dateRange: { from: Date, to: Date },
 *     count: number
 *   }
 * }
 */
export async function GET(req: NextRequest) {
  // Verify authentication
  const { authorized, user, response } = await requireAuth(req);
  if (!authorized) return response;

  try {
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const athleteId = searchParams.get('athleteId');
    const metricType = searchParams.get('metricType');
    const daysParam = searchParams.get('days');
    const deviceType = searchParams.get('deviceType');

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

    // Authorization: Users can only access their own data, admins/coaches can access athletes
    if (user!.role === 'ATHLETE') {
      if (!verifyOwnership(user, athleteId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden - You can only access your own biometric data',
          },
          { status: 403 }
        );
      }
    } else if (user!.role === 'COACH') {
      // Coaches can only access athletes who have granted consent
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
    // ADMINs can access all data

    // Parse days parameter (default 30, max 90)
    const days = daysParam ? Math.min(parseInt(daysParam, 10), 90) : 30;

    // Calculate date range
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Build query filter
    const where: any = {
      athleteId,
      recordedAt: {
        gte: fromDate,
        lte: toDate,
      },
    };

    if (metricType) {
      where.metricType = metricType;
    }

    if (deviceType) {
      where.deviceType = deviceType;
    }

    // Fetch biometric data
    const biometrics = await prisma.wearableData.findMany({
      where,
      orderBy: {
        recordedAt: 'asc', // Chronological order for time-series visualization
      },
      select: {
        id: true,
        metricType: true,
        value: true,
        unit: true,
        recordedAt: true,
        deviceType: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: biometrics,
      meta: {
        athleteId,
        metricType: metricType || 'all',
        dateRange: {
          from: fromDate,
          to: toDate,
        },
        count: biometrics.length,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching biometric data:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch biometric data',
      },
      { status: 500 }
    );
  }
}
