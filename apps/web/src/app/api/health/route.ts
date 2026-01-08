/**

 * Health Check API
 *
 * GET /api/health
 * Returns 200 if application is healthy
 *
 * Used by:
 * - UptimeRobot for uptime monitoring
 * - Load balancers for health checks
 * - CI/CD for deployment verification
 */

import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Basic health check - just return 200
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ai-sports-agent-web',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
