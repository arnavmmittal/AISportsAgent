/**

 * Cron Job: Cleanup Expired Weekly Chat Summaries
 *
 * Schedule: Daily at 2:00 AM (Vercel Cron: "0 2 * * *")
 *
 * Deletes weekly summaries that are:
 * 1. Expired (expiresAt < now)
 * 2. Revoked (revokedAt IS NOT NULL)
 * 3. Older than 12 weeks (automatic retention policy)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logExpiredSummaryDeletion } from '@/lib/audit';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Verify cron job authentication
 */
function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron Cleanup] CRON_SECRET not set in environment');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET handler for cleanup cron job
 */
export async function GET(req: NextRequest) {
  console.log('[Cron Cleanup] Weekly summary cleanup started');

  // Verify authentication
  if (!verifyCronAuth(req)) {
    console.error('[Cron Cleanup] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Calculate 12 weeks ago for automatic retention policy
  const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);

  console.log(`[Cron Cleanup] Deleting summaries that are:`);
  console.log(`  - Expired (expiresAt < ${now.toISOString()})`);
  console.log(`  - Revoked (revokedAt IS NOT NULL)`);
  console.log(`  - Created before ${twelveWeeksAgo.toISOString()}`);

  try {
    // Delete summaries matching any of the criteria
    const deleted = await prisma.chatSummary.deleteMany({
      where: {
        summaryType: 'WEEKLY',
        OR: [
          // Criterion 1: Expired (expiresAt < now)
          {
            expiresAt: {
              lt: now,
            },
          },
          // Criterion 2: Revoked (revokedAt IS NOT NULL)
          {
            revokedAt: {
              not: null,
            },
          },
          // Criterion 3: Older than 12 weeks
          {
            createdAt: {
              lt: twelveWeeksAgo,
            },
          },
        ],
      },
    });

    console.log(`[Cron Cleanup] ✅ Deleted ${deleted.count} weekly summaries`);

    // Log to audit trail
    await logExpiredSummaryDeletion(deleted.count);

    return NextResponse.json({
      message: 'Cleanup completed successfully',
      deleted: deleted.count,
      criteria: {
        expired: `expiresAt < ${now.toISOString()}`,
        revoked: 'revokedAt IS NOT NULL',
        retentionPolicy: `createdAt < ${twelveWeeksAgo.toISOString()}`,
      },
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron Cleanup] Cleanup failed:', error);

    return NextResponse.json(
      {
        error: 'Cleanup failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
