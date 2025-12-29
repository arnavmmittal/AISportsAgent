/**
 * Biometric Data Sync API - POST endpoint
 *
 * Allows manual upload or webhook-triggered sync of biometric data from wearable devices.
 * Supports batch uploads and automatic deduplication.
 *
 * Use cases:
 * - Manual data upload by athlete
 * - Webhook integration with Whoop, Oura, Garmin, etc.
 * - CSV import from wearable device exports
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyOwnership } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/biometrics/sync
 *
 * Request body:
 * {
 *   athleteId: string,
 *   deviceType: "whoop" | "oura" | "garmin" | "apple_watch",
 *   metrics: [
 *     {
 *       metricType: "hrv" | "resting_hr" | "sleep_duration" | "spo2" | "recovery_score",
 *       value: number,
 *       unit: string,
 *       recordedAt: Date | string
 *     },
 *     ...
 *   ]
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     synced: number,
 *     skipped: number, // Duplicates
 *     failed: number
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  // Verify authentication
  const { authorized, user, response } = await requireAuth(req);
  if (!authorized) return response;

  try {
    // Parse request body
    const body = await req.json();
    const { athleteId, deviceType, metrics } = body;

    // Validation
    if (!athleteId || !deviceType || !Array.isArray(metrics)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body. Required: athleteId, deviceType, metrics (array)',
        },
        { status: 400 }
      );
    }

    // Authorization: Users can only upload their own data
    if (user!.role === 'ATHLETE') {
      if (!verifyOwnership(user, athleteId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden - You can only upload your own biometric data',
          },
          { status: 403 }
        );
      }
    }
    // ADMINs and COACHes can upload on behalf of athletes

    // Validate athlete exists
    const athlete = await prisma.athlete.findUnique({
      where: { userId: athleteId },
    });

    if (!athlete) {
      return NextResponse.json(
        {
          success: false,
          error: `Athlete not found: ${athleteId}`,
        },
        { status: 404 }
      );
    }

    // Validate device type
    const validDevices = ['whoop', 'oura', 'garmin', 'apple_watch', 'manual'];
    if (!validDevices.includes(deviceType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid device type. Must be one of: ${validDevices.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate metrics
    const validMetricTypes = ['hrv', 'resting_hr', 'sleep_duration', 'spo2', 'recovery_score', 'sleep_stages'];
    for (const metric of metrics) {
      if (!metric.metricType || !validMetricTypes.includes(metric.metricType)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid metricType. Must be one of: ${validMetricTypes.join(', ')}`,
          },
          { status: 400 }
        );
      }

      if (typeof metric.value !== 'number') {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid metric value. Must be a number.`,
          },
          { status: 400 }
        );
      }

      if (!metric.recordedAt) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing recordedAt timestamp for metric',
          },
          { status: 400 }
        );
      }
    }

    // Transform metrics to WearableData format
    const wearableData = metrics.map((metric: any) => ({
      athleteId,
      deviceType,
      metricType: metric.metricType,
      value: metric.value,
      unit: metric.unit || '',
      recordedAt: new Date(metric.recordedAt),
    }));

    // Bulk insert with skipDuplicates
    // Prisma will skip records that violate unique constraints
    const result = await prisma.wearableData.createMany({
      data: wearableData,
      skipDuplicates: true,
    });

    // Calculate skipped count (duplicates)
    const synced = result.count;
    const skipped = metrics.length - synced;

    console.log(`[Biometrics Sync] Athlete ${athleteId}: Synced ${synced}, Skipped ${skipped} duplicates`);

    return NextResponse.json({
      success: true,
      data: {
        synced,
        skipped,
        failed: 0, // Future: track individual failures
      },
      message: `Successfully synced ${synced} biometric data point(s)`,
    });
  } catch (error) {
    console.error('[API] Error syncing biometric data:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync biometric data',
      },
      { status: 500 }
    );
  }
}

/**
 * Webhook handler for external integrations (Whoop, Oura, etc.)
 *
 * Future enhancement: Add webhook signature verification
 * - Whoop: X-Whoop-Signature
 * - Oura: X-Oura-Signature
 * - Garmin: Garmin-Signature
 *
 * Example usage:
 * POST /api/biometrics/sync?source=whoop&token=WEBHOOK_SECRET
 */
