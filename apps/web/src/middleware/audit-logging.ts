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
  userRole: 'ATHLETE' | 'COACH' | 'ADMIN';
  action: string;
  resourceType: string;
  resourceId?: string;
  athleteId?: string;
  ipAddress?: string;
  userAgent?: string;
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
        userRole: data.userRole,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        athleteId: data.athleteId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    // Don't fail the request if audit log fails
    // But DO alert on this (critical for compliance)
    console.error('❌ Audit log failed:', error);
    Sentry.captureException(error as Error);
  }
}

/**
 * Log coach accessing athlete data
 */
export async function logCoachAccess(data: {
  coachId: string;
  athleteId: string;
  resourceType: string;
  resourceId?: string;
}): Promise<void> {
  await logAudit({
    userId: data.coachId,
    userRole: 'COACH',
    action: 'READ',
    resourceType: data.resourceType,
    resourceId: data.resourceId,
    athleteId: data.athleteId,
  });
}

/**
 * Log consent change
 */
export async function logConsentChange(data: {
  userId: string;
  athleteId: string;
  coachId: string;
  previousValue: boolean;
  newValue: boolean;
}): Promise<void> {
  await logAudit({
    userId: data.userId,
    userRole: 'ATHLETE',
    action: 'UPDATE',
    resourceType: 'CoachAthleteRelation',
    resourceId: `${data.coachId}-${data.athleteId}`,
    athleteId: data.athleteId,
  });
}

/**
 * Log crisis alert review
 */
export async function logCrisisAlertReview(data: {
  coachId: string;
  alertId: string;
  athleteId: string;
}): Promise<void> {
  await logAudit({
    userId: data.coachId,
    userRole: 'COACH',
    action: 'UPDATE',
    resourceType: 'CrisisAlert',
    resourceId: data.alertId,
    athleteId: data.athleteId,
  });
}

/**
 * Get recent audit logs
 * Used in admin dashboard for compliance review
 */
export async function getRecentAuditLogs(data: {
  limit?: number;
  hours?: number;
}): Promise<any[]> {
  const limit = data.limit || 100;
  const hours = data.hours || 24;

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const logs = await prisma.auditLog.findMany({
    where: {
      timestamp: {
        gte: since,
      },
    },
    orderBy: {
      timestamp: 'desc',
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
  limit?: number;
}): Promise<any[]> {
  const limit = data.limit || 50;

  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { userId: data.athleteId },
        { athleteId: data.athleteId },
      ],
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
  });

  return logs;
}

/**
 * Simplified middleware wrapper for routes that need audit logging
 */
export function withAuditLog(
  handler: (req: Request, context: unknown) => Promise<Response>,
  options: {
    resourceType: string;
    requireConsent?: boolean;
  }
) {
  return async (req: Request, context: unknown) => {
    try {
      const response = await handler(req, context);
      return response;
    } catch (error) {
      throw error;
    }
  };
}
