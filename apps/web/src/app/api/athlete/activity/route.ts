/**
 * Athlete Activity API
 *
 * Tracks real-time athlete chat activity for coach visibility.
 * Uses Redis/KV when configured (staging/production), falls back to in-memory for dev.
 *
 * POST /api/athlete/activity - Report activity status
 * GET  /api/athlete/activity - Get activity for coach's athletes
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { kvSet, kvGet, kvKeys, kvDelete, isRedisConfigured } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Activity entry structure
interface ActivityEntry {
  sessionId: string;
  status: 'active' | 'inactive';
  lastHeartbeat: string; // ISO string
  chatStartedAt: string; // ISO string
}

// Key prefix for activity entries
const ACTIVITY_PREFIX = 'activity:athlete:';

// TTL for activity entries (2 minutes for stale cleanup)
const ACTIVITY_TTL_SECONDS = 2 * 60;

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
    const key = `${ACTIVITY_PREFIX}${athleteId}`;
    const now = new Date().toISOString();

    if (status === 'active') {
      // Get existing to preserve chatStartedAt
      const existing = await kvGet<ActivityEntry>(key);

      const entry: ActivityEntry = {
        sessionId,
        status: 'active',
        lastHeartbeat: now,
        chatStartedAt: existing?.chatStartedAt || now,
      };

      await kvSet(key, entry, ACTIVITY_TTL_SECONDS);
    } else {
      // Mark as inactive but keep for a bit (so coaches see "recently active")
      const existing = await kvGet<ActivityEntry>(key);
      if (existing) {
        const entry: ActivityEntry = {
          ...existing,
          status: 'inactive',
          lastHeartbeat: now,
        };
        await kvSet(key, entry, ACTIVITY_TTL_SECONDS);
      }
    }

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
      const key = `${ACTIVITY_PREFIX}${relation.athleteId}`;
      const activity = await kvGet<ActivityEntry>(key);

      if (activity && activity.status === 'active') {
        const chatStartedAt = new Date(activity.chatStartedAt);
        const durationMs = Date.now() - chatStartedAt.getTime();
        activities.push({
          athleteId: relation.athleteId,
          athleteName: relation.Athlete?.User?.name || 'Unknown',
          status: 'active',
          sessionId: activity.sessionId,
          lastHeartbeat: activity.lastHeartbeat,
          chatDuration: Math.floor(durationMs / 60000),
        });
      } else if (activity && activity.status === 'inactive') {
        activities.push({
          athleteId: relation.athleteId,
          athleteName: relation.Athlete?.User?.name || 'Unknown',
          status: 'inactive',
          lastHeartbeat: activity.lastHeartbeat,
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
      _meta: {
        store: isRedisConfigured() ? 'redis' : 'memory',
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
