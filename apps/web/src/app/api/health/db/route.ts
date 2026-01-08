/**

 * Database Health Check API
 *
 * GET /api/health/db
 * Verifies database connection and basic query functionality
 *
 * Returns:
 * - 200: Database is healthy
 * - 503: Database is unhealthy (connection failed or query timeout)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Test database connection with a simple query
    // This queries a lightweight table and should be fast (< 100ms)
    const startTime = Date.now();

    await prisma.$queryRaw`SELECT 1`;

    const queryTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'healthy',
        database: 'connected',
        queryTime: `${queryTime}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Health Check] Database error:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
