/**
 * Audit Logging for Weekly Chat Summaries
 *
 * Logs all data access and modifications for compliance with FERPA/HIPAA
 * All coach views of summaries, consent changes, and data retention actions are logged
 */

import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

/**
 * Audit actions for all sensitive data access (PRODUCTION-READY)
 */
export enum AuditAction {
  // Weekly Summary Actions
  VIEW_WEEKLY_SUMMARY = 'VIEW_WEEKLY_SUMMARY',
  GENERATE_WEEKLY_SUMMARY = 'GENERATE_WEEKLY_SUMMARY',
  CONSENT_UPDATE = 'CONSENT_UPDATE',
  REVOKE_SUMMARY = 'REVOKE_SUMMARY',
  DELETE_EXPIRED_SUMMARY = 'DELETE_EXPIRED_SUMMARY',

  // Chat Session Actions
  VIEW_CHAT_SESSION = 'VIEW_CHAT_SESSION',
  VIEW_CHAT_MESSAGES = 'VIEW_CHAT_MESSAGES',
  CREATE_CHAT_MESSAGE = 'CREATE_CHAT_MESSAGE',
  DELETE_CHAT_SESSION = 'DELETE_CHAT_SESSION',
  EXPORT_CHAT_HISTORY = 'EXPORT_CHAT_HISTORY',

  // Crisis Alert Actions
  VIEW_CRISIS_ALERT = 'VIEW_CRISIS_ALERT',
  REVIEW_CRISIS_ALERT = 'REVIEW_CRISIS_ALERT',
  ESCALATE_CRISIS_ALERT = 'ESCALATE_CRISIS_ALERT',

  // Athlete Data Access
  VIEW_ATHLETE_PROFILE = 'VIEW_ATHLETE_PROFILE',
  UPDATE_ATHLETE_PROFILE = 'UPDATE_ATHLETE_PROFILE',
  VIEW_MOOD_LOGS = 'VIEW_MOOD_LOGS',
  VIEW_GOALS = 'VIEW_GOALS',
  UPDATE_GOALS = 'UPDATE_GOALS',

  // Authentication & Security
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',

  // Admin Actions
  ADMIN_VIEW_USER = 'ADMIN_VIEW_USER',
  ADMIN_UPDATE_USER = 'ADMIN_UPDATE_USER',
  ADMIN_DELETE_USER = 'ADMIN_DELETE_USER',
  ADMIN_IMPERSONATE = 'ADMIN_IMPERSONATE',
  ADMIN_EXPORT_DATA = 'ADMIN_EXPORT_DATA',

  // Knowledge Base
  VIEW_KNOWLEDGE = 'VIEW_KNOWLEDGE',
  ADD_KNOWLEDGE = 'ADD_KNOWLEDGE',
  UPDATE_KNOWLEDGE = 'UPDATE_KNOWLEDGE',
  DELETE_KNOWLEDGE = 'DELETE_KNOWLEDGE',

  // System Events
  DATA_EXPORT_REQUEST = 'DATA_EXPORT_REQUEST',
  DATA_DELETION_REQUEST = 'DATA_DELETION_REQUEST',
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
 * Log chat session view
 *
 * @param userId - User viewing the session
 * @param sessionId - ChatSession ID
 * @param athleteId - Athlete user ID (if different from viewer)
 * @param request - HTTP request object for IP/User-Agent
 */
export async function logChatSessionView(
  userId: string,
  sessionId: string,
  athleteId?: string,
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
    userId,
    action: AuditAction.VIEW_CHAT_SESSION,
    resourceType: 'chat_sessions',
    resourceId: sessionId,
    athleteId: athleteId || userId,
    ipAddress: ipAddress,
    userAgent: request?.headers?.['user-agent'],
  });
}

/**
 * Log chat message view
 *
 * @param userId - User viewing the messages
 * @param sessionId - ChatSession ID
 * @param messageCount - Number of messages viewed
 * @param athleteId - Athlete user ID
 */
export async function logChatMessagesView(
  userId: string,
  sessionId: string,
  messageCount: number,
  athleteId?: string
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.VIEW_CHAT_MESSAGES,
    resourceType: 'messages',
    resourceId: sessionId,
    athleteId: athleteId || userId,
    details: {
      messageCount,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log chat message creation
 *
 * @param userId - User creating the message
 * @param sessionId - ChatSession ID
 * @param messageId - Message ID
 */
export async function logChatMessageCreation(
  userId: string,
  sessionId: string,
  messageId: string
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.CREATE_CHAT_MESSAGE,
    resourceType: 'messages',
    resourceId: messageId,
    athleteId: userId,
    details: {
      sessionId,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log crisis alert view
 *
 * @param coachId - Coach viewing the alert
 * @param alertId - CrisisAlert ID
 * @param athleteId - Athlete user ID
 * @param request - HTTP request object
 */
export async function logCrisisAlertView(
  coachId: string,
  alertId: string,
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
    action: AuditAction.VIEW_CRISIS_ALERT,
    resourceType: 'crisis_alerts',
    resourceId: alertId,
    athleteId,
    ipAddress: ipAddress,
    userAgent: request?.headers?.['user-agent'],
  });
}

/**
 * Log crisis alert review (coach acknowledges)
 *
 * @param coachId - Coach reviewing the alert
 * @param alertId - CrisisAlert ID
 * @param athleteId - Athlete user ID
 * @param action - Action taken (e.g., "contacted athlete", "referred to counselor")
 */
export async function logCrisisAlertReview(
  coachId: string,
  alertId: string,
  athleteId: string,
  action: string
): Promise<void> {
  await logAudit({
    userId: coachId,
    action: AuditAction.REVIEW_CRISIS_ALERT,
    resourceType: 'crisis_alerts',
    resourceId: alertId,
    athleteId,
    details: {
      action,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log athlete profile view
 *
 * @param viewerId - User viewing the profile
 * @param athleteId - Athlete user ID
 * @param request - HTTP request object
 */
export async function logAthleteProfileView(
  viewerId: string,
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
    userId: viewerId,
    action: AuditAction.VIEW_ATHLETE_PROFILE,
    resourceType: 'athletes',
    resourceId: athleteId,
    athleteId,
    ipAddress: ipAddress,
    userAgent: request?.headers?.['user-agent'],
  });
}

/**
 * Log mood logs view
 *
 * @param viewerId - User viewing the mood logs
 * @param athleteId - Athlete user ID
 * @param logCount - Number of logs viewed
 */
export async function logMoodLogsView(
  viewerId: string,
  athleteId: string,
  logCount: number
): Promise<void> {
  await logAudit({
    userId: viewerId,
    action: AuditAction.VIEW_MOOD_LOGS,
    resourceType: 'mood_logs',
    athleteId,
    details: {
      logCount,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log login attempt
 *
 * @param userId - User ID (if successful) or email (if failed)
 * @param success - Whether login was successful
 * @param request - HTTP request object
 * @param failureReason - Reason for failure (if applicable)
 */
export async function logLoginAttempt(
  userId: string,
  success: boolean,
  request?: {
    headers?: {
      'x-forwarded-for'?: string | string[];
      'user-agent'?: string;
    };
  },
  failureReason?: string
): Promise<void> {
  const ipAddress = Array.isArray(request?.headers?.['x-forwarded-for'])
    ? request.headers['x-forwarded-for'][0]
    : request?.headers?.['x-forwarded-for'];

  await logAudit({
    userId,
    action: success ? AuditAction.LOGIN_SUCCESS : AuditAction.LOGIN_FAILURE,
    resourceType: 'users',
    ipAddress: ipAddress,
    userAgent: request?.headers?.['user-agent'],
    details: {
      success,
      failureReason: failureReason || null,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log unauthorized access attempt
 *
 * @param userId - User attempting unauthorized access
 * @param resource - Resource they tried to access
 * @param resourceId - Resource ID
 * @param request - HTTP request object
 */
export async function logUnauthorizedAccess(
  userId: string,
  resource: string,
  resourceId: string,
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
    userId,
    action: AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
    resourceType: resource,
    resourceId,
    ipAddress: ipAddress,
    userAgent: request?.headers?.['user-agent'],
    details: {
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log knowledge base view
 *
 * @param userId - User accessing knowledge
 * @param knowledgeId - KnowledgeBase ID
 */
export async function logKnowledgeView(
  userId: string,
  knowledgeId: string
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.VIEW_KNOWLEDGE,
    resourceType: 'knowledge_base',
    resourceId: knowledgeId,
    details: {
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log data export request
 *
 * @param userId - User requesting export
 * @param exportType - Type of export (e.g., "athlete_data", "chat_history")
 * @param athleteId - Athlete ID if exporting athlete-specific data
 */
export async function logDataExport(
  userId: string,
  exportType: string,
  athleteId?: string
): Promise<void> {
  await logAudit({
    userId,
    action: AuditAction.DATA_EXPORT_REQUEST,
    resourceType: exportType,
    athleteId,
    details: {
      exportType,
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
