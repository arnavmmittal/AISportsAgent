/**
 * Wearable Sync API
 * Trigger sync of wearable data
 *
 * POST - Sync wearable data for authenticated athlete
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/auth-helpers';
import { syncWearableData } from '@/lib/wearables/sync-service';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAthlete(request);
    if (!authorized || !user) return response;

    // Check if athlete has a wearable connection
    const connection = await prisma.wearableConnection.findUnique({
      where: { athleteId: user.id },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'No wearable connected' },
        { status: 404 }
      );
    }

    // Check if already syncing
    if (connection.syncStatus === 'SYNCING') {
      return NextResponse.json(
        { error: 'Sync already in progress' },
        { status: 409 }
      );
    }

    // Parse request body for optional parameters
    let daysBack = 7;
    try {
      const body = await request.json();
      if (body.daysBack && typeof body.daysBack === 'number') {
        daysBack = Math.min(30, Math.max(1, body.daysBack));
      }
    } catch {
      // Body is optional, use defaults
    }

    // Perform sync
    const result = await syncWearableData(user.id, daysBack);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.errors.join('; '),
          details: result,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      dataPointsCreated: result.dataPointsCreated,
      dataPointsSkipped: result.dataPointsSkipped,
      lastSyncAt: result.lastSyncAt,
    });
  } catch (error) {
    console.error('Wearable sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get recent wearable data for athlete
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAthlete(request);
    if (!authorized || !user) return response;

    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '50');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const dataPoints = await prisma.wearableDataPoint.findMany({
      where: {
        athleteId: user.id,
        recordedAt: { gte: startDate },
      },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });

    // Calculate averages
    const validRecovery = dataPoints.filter((d) => d.recoveryScore !== null);
    const validHRV = dataPoints.filter((d) => d.hrv !== null);
    const validSleep = dataPoints.filter((d) => d.sleepDuration !== null);
    const validStrain = dataPoints.filter((d) => d.strain !== null);

    const averages = {
      recoveryScore: validRecovery.length > 0
        ? validRecovery.reduce((sum, d) => sum + (d.recoveryScore || 0), 0) / validRecovery.length
        : null,
      hrv: validHRV.length > 0
        ? validHRV.reduce((sum, d) => sum + (d.hrv || 0), 0) / validHRV.length
        : null,
      sleepDuration: validSleep.length > 0
        ? validSleep.reduce((sum, d) => sum + (d.sleepDuration || 0), 0) / validSleep.length
        : null,
      strain: validStrain.length > 0
        ? validStrain.reduce((sum, d) => sum + (d.strain || 0), 0) / validStrain.length
        : null,
    };

    return NextResponse.json({
      dataPoints,
      averages,
      count: dataPoints.length,
    });
  } catch (error) {
    console.error('Wearable data fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
