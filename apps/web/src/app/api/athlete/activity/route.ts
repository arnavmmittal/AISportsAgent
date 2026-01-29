/**
 * Athlete Activity API
 *
 * Tracks real-time athlete chat activity for coach visibility.
 * Uses in-memory storage for real-time tracking (production would use Redis).
 *
 * POST /api/athlete/activity - Report activity status
 * GET  /api/athlete/activity - Get activity for coach's athletes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In-memory activity store (production: use Redis)
// Key: athleteId, Value: activity state
const activityStore = new Map<string, {
  sessionId: string;
  status: 'active' | 'inactive';
  lastHeartbeat: Date;
  chatStartedAt: Date;
}>();

// Clean up stale entries (older than 2 minutes)
const STALE_THRESHOLD_MS = 2 * 60 * 1000;

function cleanupStaleEntries() {
  const now = Date.now();
  for (const [athleteId, activity] of activityStore.entries()) {
    if (now - activity.lastHeartbeat.getTime() > STALE_THRESHOLD_MS) {
      activityStore.delete(athleteId);
    }
  }
}

// Validation schema
const ActivityReportSchema = z.object({
  athleteId: z.string(),
  sessionId: z.string(),
  status: z.enum(['active', 'inactive']),
});

// POST - Report athlete activity (called by athletes)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = ActivityReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { athleteId, sessionId, status } = validation.data;

    if (status === 'active') {
      const existing = activityStore.get(athleteId);
      activityStore.set(athleteId, {
        sessionId,
        status: 'active',
        lastHeartbeat: new Date(),
        chatStartedAt: existing?.chatStartedAt || new Date(),
      });
    } else {
      // Mark as inactive but don't remove immediately
      const existing = activityStore.get(athleteId);
      if (existing) {
        activityStore.set(athleteId, {
          ...existing,
          status: 'inactive',
          lastHeartbeat: new Date(),
        });
      }
    }

    // Periodic cleanup
    cleanupStaleEntries();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording activity:', error);
    return NextResponse.json(
      { error: 'Failed to record activity' },
      { status: 500 }
    );
  }
}

// GET - Get activity status for coach's athletes
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clean up stale entries first
    cleanupStaleEntries();

    // Get coach's athlete IDs
    const relations = await prisma.coachAthleteRelation.findMany({
      where: {
        coachId: user.id,
        consentGranted: true,
      },
      include: {
        Athlete: {
          include: {
            User: { select: { name: true } },
          },
        },
      },
    });

    const athleteIds = new Set(relations.map((r) => r.athleteId));

    // Get activity status for each athlete
    const activities: Array<{
      athleteId: string;
      athleteName: string;
      status: 'active' | 'inactive' | 'offline';
      sessionId?: string;
      lastHeartbeat?: string;
      chatDuration?: number; // minutes
    }> = [];

    for (const relation of relations) {
      const activity = activityStore.get(relation.athleteId);

      if (activity && activity.status === 'active') {
        const durationMs = Date.now() - activity.chatStartedAt.getTime();
        activities.push({
          athleteId: relation.athleteId,
          athleteName: relation.Athlete?.User?.name || 'Unknown',
          status: 'active',
          sessionId: activity.sessionId,
          lastHeartbeat: activity.lastHeartbeat.toISOString(),
          chatDuration: Math.floor(durationMs / 60000),
        });
      } else if (activity && activity.status === 'inactive') {
        activities.push({
          athleteId: relation.athleteId,
          athleteName: relation.Athlete?.User?.name || 'Unknown',
          status: 'inactive',
          lastHeartbeat: activity.lastHeartbeat.toISOString(),
        });
      }
      // Don't include athletes with no activity record (offline)
    }

    // Sort: active first, then by last heartbeat
    activities.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return 0;
    });

    return NextResponse.json({
      activities,
      summary: {
        totalAthletes: relations.length,
        activeNow: activities.filter((a) => a.status === 'active').length,
        recentlyActive: activities.filter((a) => a.status === 'inactive').length,
      },
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
