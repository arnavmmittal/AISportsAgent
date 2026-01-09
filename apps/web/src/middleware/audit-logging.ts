/**
 * Audit Logging Middleware
 *
 * Purpose: Track coach access to athlete data for FERPA compliance
 * Pilot Context: Light logging to ensure transparency and consent enforcement
 *
 * What we log:
 * - Coach viewing athlete chat sessions
 * - Coach viewing athlete performance data
 * - Consent changes (grant/revoke)
 * - Crisis alert reviews
 *
 * What we DON'T log:
 * - Athlete accessing own data (not needed)
 * - Message content (privacy)
 * - Every single query (too verbose)
 */

import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

export interface AuditLogData {
  userId: string;
  action: 'READ' | 'WRITE' | 'UPDATE' | 'DELETE' | 'EXPORT';
  resource: string;
  resourceId: string;
  metadata?: Record<string, any>;
  schoolId: string;
}

/**
 * Create an audit log entry
 * Non-blocking - won't fail the request if logging fails
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        metadata: data.metadata || {},
        schoolId: data.schoolId,
      },
    });
  } catch (error) {
    // Don't fail the request if audit log fails
    // But DO alert on this (critical for compliance)
    console.error('❌ Audit log failed:', error);
    Sentry.captureException(error, {
      level: 'error',
      tags: {
        critical: 'audit_log_failure',
        action: data.action,
        resource: data.resource,
      },
      extra: data,
    });
  }
}

/**
 * Log coach accessing athlete data
 */
export async function logCoachAccess(data: {
  coachId: string;
  athleteId: string;
  resource: string;
  resourceIds: string[];
  schoolId: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  await logAudit({
    userId: data.coachId,
    action: 'READ',
    resource: data.resource,
    resourceId: data.resourceIds.join(','),
    metadata: {
      ...data.metadata,
      athleteId: data.athleteId,
      resourceCount: data.resourceIds.length,
    },
    schoolId: data.schoolId,
  });
}

/**
 * Log consent change
 */
export async function logConsentChange(data: {
  userId: string; // Who made the change (athlete)
  coachId: string;
  athleteId: string;
  previousValue: boolean;
  newValue: boolean;
  schoolId: string;
}): Promise<void> {
  await logAudit({
    userId: data.userId,
    action: 'UPDATE',
    resource: 'CoachAthleteRelation',
    resourceId: `${data.coachId}-${data.athleteId}`,
    metadata: {
      coachId: data.coachId,
      athleteId: data.athleteId,
      field: 'consentGranted',
      previousValue: data.previousValue,
      newValue: data.newValue,
    },
    schoolId: data.schoolId,
  });
}

/**
 * Log crisis alert review
 */
export async function logCrisisAlertReview(data: {
  coachId: string;
  alertId: string;
  severity: string;
  athleteId: string;
  schoolId: string;
}): Promise<void> {
  await logAudit({
    userId: data.coachId,
    action: 'UPDATE',
    resource: 'CrisisAlert',
    resourceId: data.alertId,
    metadata: {
      severity: data.severity,
      reviewed: true,
      reviewedBy: data.coachId,
      athleteId: data.athleteId,
    },
    schoolId: data.schoolId,
  });
}

/**
 * Get recent audit logs for a school
 * Used in admin dashboard for compliance review
 */
export async function getRecentAuditLogs(data: {
  schoolId: string;
  limit?: number;
  hours?: number;
}): Promise<any[]> {
  const limit = data.limit || 100;
  const hours = data.hours || 24;

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const logs = await prisma.auditLog.findMany({
    where: {
      schoolId: data.schoolId,
      createdAt: {
        gte: since,
      },
    },
    include: {
      User: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return logs;
}

/**
 * Get audit logs for a specific athlete
 * Useful for transparency (athlete can see who accessed their data)
 */
export async function getAthleteAuditLogs(data: {
  athleteId: string;
  schoolId: string;
  limit?: number;
}): Promise<any[]> {
  const limit = data.limit || 50;

  const logs = await prisma.auditLog.findMany({
    where: {
      schoolId: data.schoolId,
      OR: [
        { userId: data.athleteId }, // Actions by the athlete
        {
          // Actions on the athlete's data
          metadata: {
            path: ['athleteId'],
            equals: data.athleteId,
          },
        },
      ],
    },
    include: {
      User: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return logs;
}

/**
 * Simplified middleware wrapper for routes that need audit logging
 * Usage:
 *
 * export const GET = withAuditLog(handler, {
 *   resource: 'ChatSession',
 *   requireConsent: true,
 * });
 */
export function withAuditLog(
  handler: Function,
  options: {
    resource: string;
    requireConsent?: boolean;
  }
) {
  return async (req: Request, context: any) => {
    const startTime = Date.now();

    // For pilot: simplified version
    // Full version would extract session, verify consent, etc.

    try {
      const response = await handler(req, context);

      // Log successful access
      // (In full implementation, would extract user from session)

      return response;
    } catch (error) {
      // Log failed access attempt
      throw error;
    }
  };
}
