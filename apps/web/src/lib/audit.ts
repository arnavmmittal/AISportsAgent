/**
 * Audit Logging for Weekly Chat Summaries
 *
 * Logs all data access and modifications for compliance with FERPA/HIPAA
 * All coach views of summaries, consent changes, and data retention actions are logged
 */

import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

/**
 * Audit actions for weekly summary feature
 */
export enum AuditAction {
  VIEW_WEEKLY_SUMMARY = 'VIEW_WEEKLY_SUMMARY',
  GENERATE_WEEKLY_SUMMARY = 'GENERATE_WEEKLY_SUMMARY',
  CONSENT_UPDATE = 'CONSENT_UPDATE',
  REVOKE_SUMMARY = 'REVOKE_SUMMARY',
  DELETE_EXPIRED_SUMMARY = 'DELETE_EXPIRED_SUMMARY',
}

/**
 * Parameters for audit log creation
 */
export interface AuditLogParams {
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  athleteId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Get user role from userId
 * @param userId - User ID to lookup
 * @returns User role or null if not found
 */
async function getUserRole(userId: string): Promise<Role | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role || null;
}

/**
 * Create an audit log entry
 *
 * @param params - Audit log parameters
 *
 * @example
 * // Log coach viewing a summary
 * await logAudit({
 *   userId: coach.userId,
 *   action: AuditAction.VIEW_WEEKLY_SUMMARY,
 *   resourceType: 'chat_summaries',
 *   resourceId: summary.id,
 *   athleteId: athlete.userId,
 *   ipAddress: req.headers['x-forwarded-for'],
 *   userAgent: req.headers['user-agent']
 * });
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const userRole = await getUserRole(params.userId);

    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        userRole: userRole || Role.ATHLETE, // Default to ATHLETE if not found
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        athleteId: params.athleteId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should not break application flow
    console.error('[Audit Log Error]', error);
    console.error('[Audit Log Params]', params);
  }
}

/**
 * Log coach viewing a weekly summary
 *
 * @param coachId - Coach user ID
 * @param summaryId - ChatSummary ID
 * @param athleteId - Athlete user ID
 * @param request - HTTP request object for IP/User-Agent
 */
export async function logWeeklySummaryView(
  coachId: string,
  summaryId: string,
  athleteId: string,
  request?: {
    headers?: {
      'x-forwarded-for'?: string | string[];
      'user-agent'?: string;
    };
  }
): Promise<void> {
  const ipAddress = Array.isArray(request?.headers?.['x-forwarded-for'])
    ? request.headers['x-forwarded-for'][0]
    : request?.headers?.['x-forwarded-for'];

  await logAudit({
    userId: coachId,
    action: AuditAction.VIEW_WEEKLY_SUMMARY,
    resourceType: 'chat_summaries',
    resourceId: summaryId,
    athleteId,
    ipAddress: ipAddress,
    userAgent: request?.headers?.['user-agent'],
  });
}

/**
 * Log weekly summary generation
 *
 * @param athleteId - Athlete user ID
 * @param summaryId - Generated ChatSummary ID
 * @param sessionCount - Number of sessions aggregated
 */
export async function logWeeklySummaryGeneration(
  athleteId: string,
  summaryId: string,
  sessionCount: number
): Promise<void> {
  await logAudit({
    userId: 'system', // System-generated
    action: AuditAction.GENERATE_WEEKLY_SUMMARY,
    resourceType: 'chat_summaries',
    resourceId: summaryId,
    athleteId,
    details: {
      sessionCount,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log athlete consent update
 *
 * @param athleteId - Athlete user ID
 * @param consentGranted - New consent value
 * @param ipAddress - Optional IP address
 */
export async function logConsentUpdate(
  athleteId: string,
  consentGranted: boolean,
  ipAddress?: string
): Promise<void> {
  await logAudit({
    userId: athleteId,
    action: AuditAction.CONSENT_UPDATE,
    resourceType: 'athletes',
    resourceId: athleteId,
    athleteId,
    details: {
      consentChatSummaries: consentGranted,
      timestamp: new Date().toISOString(),
    },
    ipAddress,
  });
}

/**
 * Log athlete revoking summary access
 *
 * @param athleteId - Athlete user ID
 * @param revokedCount - Number of summaries revoked
 */
export async function logSummaryRevocation(
  athleteId: string,
  revokedCount: number
): Promise<void> {
  await logAudit({
    userId: athleteId,
    action: AuditAction.REVOKE_SUMMARY,
    resourceType: 'chat_summaries',
    athleteId,
    details: {
      revokedCount,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log expired summary deletion (from cleanup job)
 *
 * @param deletedCount - Number of summaries deleted
 */
export async function logExpiredSummaryDeletion(
  deletedCount: number
): Promise<void> {
  await logAudit({
    userId: 'system',
    action: AuditAction.DELETE_EXPIRED_SUMMARY,
    resourceType: 'chat_summaries',
    details: {
      deletedCount,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Query audit logs for an athlete
 *
 * @param athleteId - Athlete user ID
 * @param limit - Maximum number of logs to return
 * @returns Array of audit log entries
 */
export async function getAthleteAuditLogs(
  athleteId: string,
  limit: number = 100
) {
  return await prisma.auditLog.findMany({
    where: {
      athleteId,
      action: {
        in: [
          AuditAction.VIEW_WEEKLY_SUMMARY,
          AuditAction.GENERATE_WEEKLY_SUMMARY,
          AuditAction.CONSENT_UPDATE,
          AuditAction.REVOKE_SUMMARY,
        ],
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: limit,
  });
}

/**
 * Generate compliance report for weekly summaries
 *
 * @param startDate - Start of report period
 * @param endDate - End of report period
 * @returns Summary statistics for compliance
 */
export async function generateComplianceReport(
  startDate: Date,
  endDate: Date
) {
  const logs = await prisma.auditLog.findMany({
    where: {
      action: {
        in: [
          AuditAction.VIEW_WEEKLY_SUMMARY,
          AuditAction.GENERATE_WEEKLY_SUMMARY,
          AuditAction.CONSENT_UPDATE,
          AuditAction.REVOKE_SUMMARY,
          AuditAction.DELETE_EXPIRED_SUMMARY,
        ],
      },
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Group by action
  const summary = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    totalLogs: logs.length,
    actionBreakdown: summary,
    uniqueAthletes: new Set(logs.map(l => l.athleteId).filter(Boolean)).size,
    uniqueCoaches: new Set(
      logs
        .filter(l => l.action === AuditAction.VIEW_WEEKLY_SUMMARY)
        .map(l => l.userId)
    ).size,
  };
}
