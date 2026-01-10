/**
 * Wearable Status API
 * Get and manage wearable connection status
 *
 * GET - Get current connection status
 * DELETE - Disconnect wearable
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAthlete(request);
    if (!authorized || !user) return response;

    const connection = await prisma.wearableConnection.findUnique({
      where: { athleteId: user.id },
    });

    if (!connection) {
      return NextResponse.json({
        connected: false,
        provider: null,
        lastSyncAt: null,
        syncStatus: null,
      });
    }

    // Get recent data points for display
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentData = await prisma.wearableDataPoint.findMany({
      where: {
        athleteId: user.id,
        recordedAt: { gte: sevenDaysAgo },
      },
      orderBy: { recordedAt: 'desc' },
      take: 7,
    });

    // Calculate summary stats
    const validRecovery = recentData.filter((d) => d.recoveryScore !== null);
    const validHRV = recentData.filter((d) => d.hrv !== null);
    const validSleep = recentData.filter((d) => d.sleepDuration !== null);
    const validStrain = recentData.filter((d) => d.strain !== null);

    const summary = {
      avgRecovery:
        validRecovery.length > 0
          ? Math.round(validRecovery.reduce((sum, d) => sum + (d.recoveryScore || 0), 0) / validRecovery.length)
          : null,
      avgHRV:
        validHRV.length > 0
          ? Math.round(validHRV.reduce((sum, d) => sum + (d.hrv || 0), 0) / validHRV.length)
          : null,
      avgSleep:
        validSleep.length > 0
          ? Math.round(validSleep.reduce((sum, d) => sum + (d.sleepDuration || 0), 0) / validSleep.length * 10) / 10
          : null,
      avgStrain:
        validStrain.length > 0
          ? Math.round(validStrain.reduce((sum, d) => sum + (d.strain || 0), 0) / validStrain.length * 10) / 10
          : null,
      dataPointCount: recentData.length,
    };

    return NextResponse.json({
      connected: true,
      provider: connection.provider,
      lastSyncAt: connection.lastSyncAt,
      syncStatus: connection.syncStatus,
      syncError: connection.syncError,
      syncEnabled: connection.syncEnabled,
      summary,
      recentData: recentData.map((d) => ({
        id: d.id,
        recordedAt: d.recordedAt,
        recoveryScore: d.recoveryScore,
        hrv: d.hrv,
        sleepDuration: d.sleepDuration,
        sleepQuality: d.sleepQuality,
        strain: d.strain,
        restingHR: d.restingHR,
      })),
    });
  } catch (error) {
    console.error('Wearable status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAthlete(request);
    if (!authorized || !user) return response;

    const connection = await prisma.wearableConnection.findUnique({
      where: { athleteId: user.id },
    });

    if (!connection) {
      return NextResponse.json({ error: 'No connection found' }, { status: 404 });
    }

    // Delete the connection
    await prisma.wearableConnection.delete({
      where: { athleteId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Wearable disconnected successfully',
    });
  } catch (error) {
    console.error('Wearable disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
