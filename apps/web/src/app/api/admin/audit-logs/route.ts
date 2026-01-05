/**
 * Admin API: Query Audit Logs
 *
 * GET /api/admin/audit-logs
 * Query parameters:
 * - athleteId: Filter by athlete ID
 * - userId: Filter by user ID
 * - action: Filter by action type
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 * - limit: Max results (default 100, max 1000)
 * - offset: Pagination offset
 *
 * Security: Admin-only access
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { AuditAction } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized) return response;

    const fullUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { role: true },
    });

    if (fullUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query filters
    const where: any = {};

    if (athleteId) {
      where.athleteId = athleteId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (action && Object.values(AuditAction).includes(action as AuditAction)) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    // Query audit logs
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          userId: true,
          userRole: true,
          action: true,
          resourceType: true,
          resourceId: true,
          athleteId: true,
          ipAddress: true,
          userAgent: true,
          timestamp: true,
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[Audit Logs API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch audit logs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/audit-logs/summary
 * Get summary statistics for audit logs
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized) return response;

    const fullUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { role: true },
    });

    if (fullUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Import compliance report generator
    const { generateComplianceReport } = await import('@/lib/audit');

    const report = await generateComplianceReport(
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('[Audit Summary API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate audit summary',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
