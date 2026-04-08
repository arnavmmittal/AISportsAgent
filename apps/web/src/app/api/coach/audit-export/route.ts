/**
 * Coach Audit Export API
 *
 * GET /api/coach/audit-export
 *
 * Exports crisis detection logs and mood access logs for the coach's athletes.
 * Supports CSV and JSON formats with date range filtering.
 *
 * Query params:
 *   - startDate (ISO string, required)
 *   - endDate (ISO string, required)
 *   - format ("csv" | "json", default "json")
 *
 * Security:
 *   - Requires coach authentication via requireCoach
 *   - Only returns data for athletes connected to this coach
 *   - Logs the export itself to the audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verify coach authentication
    const { authorized, user, response } = await requireCoach(request);
    if (!authorized || !user) return response;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const format = searchParams.get('format') || 'json';

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'startDate and endDate query parameters are required (ISO format)' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 (e.g. 2026-01-01T00:00:00Z)' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'startDate must be before endDate' },
        { status: 400 }
      );
    }

    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json(
        { error: 'format must be "csv" or "json"' },
        { status: 400 }
      );
    }

    // Get coach's connected athletes
    const coachRelations = await prisma.coachAthleteRelation.findMany({
      where: { coachId: user.id },
      select: { athleteId: true },
    });

    const athleteIds = coachRelations.map((r) => r.athleteId);

    if (athleteIds.length === 0) {
      if (format === 'csv') {
        return new Response(
          'timestamp,event_type,athlete_name,severity,details\n',
          {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="audit-export-${startDateParam}-${endDateParam}.csv"`,
            },
          }
        );
      }
      return NextResponse.json({ records: [], count: 0 });
    }

    // Build athlete name lookup
    const athletes = await prisma.user.findMany({
      where: { id: { in: athleteIds } },
      select: { id: true, name: true },
    });
    const athleteNameMap = new Map(athletes.map((a) => [a.id, a.name]));

    // Fetch crisis alerts in the date range for the coach's athletes
    const crisisAlerts = await prisma.crisisAlert.findMany({
      where: {
        athleteId: { in: athleteIds },
        detectedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        Athlete: {
          include: {
            User: { select: { name: true } },
          },
        },
      },
      orderBy: { detectedAt: 'asc' },
    });

    // Fetch audit logs for mood access (VIEW_MOOD_LOGS, VIEW_ATHLETE_PROFILE) in the date range
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        athleteId: { in: athleteIds },
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
        action: {
          in: [
            'VIEW_MOOD_LOGS',
            'VIEW_ATHLETE_PROFILE',
            'VIEW_WEEKLY_SUMMARY',
            'VIEW_CRISIS_ALERT',
            'REVIEW_CRISIS_ALERT',
            'ESCALATE_CRISIS_ALERT',
            'CONSENT_UPDATE',
          ],
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Build unified export records
    type ExportRecord = {
      timestamp: string;
      event_type: string;
      athlete_name: string;
      severity: string;
      details: string;
    };

    const records: ExportRecord[] = [];

    // Add crisis alerts
    for (const alert of crisisAlerts) {
      records.push({
        timestamp: alert.detectedAt.toISOString(),
        event_type: 'CRISIS_DETECTION',
        athlete_name: alert.Athlete.User.name,
        severity: alert.severity,
        details: [
          `reviewed=${alert.reviewed}`,
          alert.reviewedAt ? `reviewed_at=${alert.reviewedAt.toISOString()}` : null,
          alert.reviewedBy ? `reviewed_by=${alert.reviewedBy}` : null,
          alert.escalated ? `escalated=true` : null,
          alert.escalatedTo ? `escalated_to=${alert.escalatedTo}` : null,
          alert.notes ? `notes=${alert.notes}` : null,
        ]
          .filter(Boolean)
          .join('; '),
      });
    }

    // Add audit log entries
    for (const log of auditLogs) {
      records.push({
        timestamp: log.timestamp.toISOString(),
        event_type: log.action,
        athlete_name: athleteNameMap.get(log.athleteId || '') || 'Unknown',
        severity: 'INFO',
        details: [
          `user_id=${log.userId}`,
          `user_role=${log.userRole}`,
          log.resourceType ? `resource_type=${log.resourceType}` : null,
          log.resourceId ? `resource_id=${log.resourceId}` : null,
        ]
          .filter(Boolean)
          .join('; '),
      });
    }

    // Sort by timestamp
    records.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    // Log the export action itself
    await logAudit({
      userId: user.id,
      action: AuditAction.DATA_EXPORT_REQUEST,
      resourceType: 'audit_export',
      details: {
        startDate: startDateParam,
        endDate: endDateParam,
        format,
        recordCount: records.length,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Return in requested format
    if (format === 'csv') {
      const csvHeader = 'timestamp,event_type,athlete_name,severity,details';
      const csvRows = records.map(
        (r) =>
          `${escapeCsv(r.timestamp)},${escapeCsv(r.event_type)},${escapeCsv(r.athlete_name)},${escapeCsv(r.severity)},${escapeCsv(r.details)}`
      );
      const csvContent = [csvHeader, ...csvRows].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-export-${startDateParam}-${endDateParam}.csv"`,
        },
      });
    }

    return NextResponse.json({
      records,
      count: records.length,
      dateRange: {
        start: startDateParam,
        end: endDateParam,
      },
    });
  } catch (error) {
    console.error('[Audit Export API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export audit data' },
      { status: 500 }
    );
  }
}

/**
 * Escape a value for CSV (wrap in quotes if it contains commas, quotes, or newlines)
 */
function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
