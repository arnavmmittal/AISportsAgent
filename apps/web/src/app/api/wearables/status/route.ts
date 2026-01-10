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

    // Get recent data points count
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentDataCount = await prisma.wearableDataPoint.count({
      where: {
        athleteId: user.id,
        recordedAt: { gte: oneDayAgo },
      },
    });

    return NextResponse.json({
      connected: true,
      provider: connection.provider,
      lastSyncAt: connection.lastSyncAt,
      syncStatus: connection.syncStatus,
      syncError: connection.syncError,
      syncEnabled: connection.syncEnabled,
      recentDataPoints: recentDataCount,
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
