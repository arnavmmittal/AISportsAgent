/**
 * Crisis Escalation Cron Endpoint
 *
 * Triggers the escalation check for unreviewed crisis alerts.
 * Should be called every minute by a cron scheduler (Vercel Cron, Railway, etc.)
 *
 * Security:
 * - Requires CRON_SECRET header for authentication
 * - Only GET requests allowed (idempotent)
 *
 * Example Vercel cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/escalation",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { runEscalationCheck, getEscalationStats } from '@/lib/crisis-escalation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for escalation processing

/**
 * GET /api/cron/escalation
 * Trigger escalation check for unreviewed crisis alerts
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret
    const cronSecret = request.headers.get('x-cron-secret') ||
                       request.headers.get('authorization')?.replace('Bearer ', '');

    const expectedSecret = process.env.CRON_SECRET;

    // In development, allow without secret for testing
    const isDev = process.env.NODE_ENV === 'development';

    if (!isDev && (!expectedSecret || cronSecret !== expectedSecret)) {
      console.warn('[Cron Escalation] Unauthorized request attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron Escalation] Starting escalation check...');

    // Run the escalation check
    const result = await runEscalationCheck();

    const duration = Date.now() - startTime;

    // Log summary
    console.log(`[Cron Escalation] Completed in ${duration}ms:`, {
      totalChecked: result.totalChecked,
      escalated: result.escalated.length,
      skipped: result.skipped,
      errors: result.errors.length,
    });

    // Return detailed results
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      summary: {
        totalChecked: result.totalChecked,
        escalated: result.escalated.length,
        skipped: result.skipped,
        errorCount: result.errors.length,
      },
      escalations: result.escalated.map((e) => ({
        alertId: e.alertId,
        severity: e.severity,
        escalationLevel: e.escalationLevel,
        notificationsSent: e.notificationsSent,
        success: e.success,
      })),
      errors: result.errors.length > 0 ? result.errors : undefined,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Cron Escalation] Critical error:', error);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/escalation
 * Also support POST for flexibility with different cron services
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
