/**
 * Crisis Escalation Service
 *
 * Automatically escalates crisis alerts that haven't been reviewed within defined timeframes.
 *
 * Escalation Tiers:
 * 1. CRITICAL alerts: Escalate immediately after 5 minutes
 * 2. HIGH alerts: Escalate after 15 minutes
 * 3. MEDIUM alerts: Escalate after 1 hour
 *
 * Escalation Actions:
 * - Send email to escalation contacts
 * - Send push notifications
 * - SMS for CRITICAL alerts (if configured)
 * - Log to monitoring system
 */

import { prisma } from '@/lib/prisma';
import { sendEmail, sendTemplatedEmail } from '@/lib/email';
import { sendPushToUser, NotificationChannel, NotificationPriority } from '@/lib/push-notifications';

// Escalation timeframes (in milliseconds)
const ESCALATION_TIMEFRAMES = {
  CRITICAL: 5 * 60 * 1000, // 5 minutes
  HIGH: 15 * 60 * 1000, // 15 minutes
  MEDIUM: 60 * 60 * 1000, // 1 hour
  LOW: 24 * 60 * 60 * 1000, // 24 hours (or never)
};

// Maximum escalation attempts before giving up
const MAX_ESCALATION_ATTEMPTS = 3;

export interface EscalationResult {
  alertId: string;
  athleteId: string;
  severity: string;
  escalationLevel: number;
  notificationsSent: {
    emails: number;
    pushNotifications: number;
    sms: number;
  };
  success: boolean;
  error?: string;
}

export interface EscalationRunResult {
  totalChecked: number;
  escalated: EscalationResult[];
  skipped: number;
  errors: string[];
}

/**
 * Run the escalation check
 * This should be called periodically (e.g., every minute via cron)
 */
export async function runEscalationCheck(): Promise<EscalationRunResult> {
  const now = new Date();
  const results: EscalationResult[] = [];
  const errors: string[] = [];
  let skipped = 0;

  console.log(`[Escalation] Starting escalation check at ${now.toISOString()}`);

  try {
    // Get all unreviewed alerts
    const unreviewedAlerts = await prisma.crisisAlert.findMany({
      where: {
        reviewed: false,
      },
      include: {
        Athlete: {
          include: {
            User: {
              select: { name: true, email: true },
            },
            CoachAthlete: {
              where: { consentGranted: true },
              include: {
                Coach: {
                  include: {
                    User: {
                      select: { id: true, name: true, email: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(`[Escalation] Found ${unreviewedAlerts.length} unreviewed alerts`);

    for (const alert of unreviewedAlerts) {
      const timeframe = ESCALATION_TIMEFRAMES[alert.severity as keyof typeof ESCALATION_TIMEFRAMES];
      const timeSinceDetection = now.getTime() - alert.detectedAt.getTime();

      // Skip if not yet past escalation timeframe
      if (timeSinceDetection < timeframe) {
        skipped++;
        continue;
      }

      // Skip if already at max escalation level
      // We use escalatedTo as a counter for escalation levels (stored as string)
      const currentLevel = parseInt(alert.escalatedTo || '0', 10);
      if (currentLevel >= MAX_ESCALATION_ATTEMPTS) {
        console.log(`[Escalation] Alert ${alert.id} already at max escalation level`);
        skipped++;
        continue;
      }

      // Perform escalation
      try {
        const result = await escalateAlert(alert, currentLevel + 1);
        results.push(result);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to escalate alert ${alert.id}: ${errorMsg}`);
        console.error(`[Escalation] Error escalating alert ${alert.id}:`, error);
      }
    }

    console.log(`[Escalation] Completed: ${results.length} escalated, ${skipped} skipped, ${errors.length} errors`);

    return {
      totalChecked: unreviewedAlerts.length,
      escalated: results,
      skipped,
      errors,
    };

  } catch (error) {
    console.error('[Escalation] Critical error during escalation check:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown critical error');
    return {
      totalChecked: 0,
      escalated: [],
      skipped: 0,
      errors,
    };
  }
}

/**
 * Escalate a specific alert
 */
async function escalateAlert(
  alert: any, // Alert with relations
  escalationLevel: number
): Promise<EscalationResult> {
  const athleteName = alert.Athlete?.User?.name || 'Unknown Athlete';
  const athleteEmail = alert.Athlete?.User?.email || '';

  let emailsSent = 0;
  let pushSent = 0;
  let smsSent = 0;

  console.log(`[Escalation] Escalating alert ${alert.id} to level ${escalationLevel}`);

  // Get escalation contacts based on level
  const contacts = await getEscalationContacts(alert, escalationLevel);

  // Send email notifications
  for (const contact of contacts.emails) {
    try {
      await sendEscalationEmail(
        contact.email,
        contact.name,
        athleteName,
        alert.severity,
        alert.id,
        alert.detectedAt,
        alert.notes || '',
        escalationLevel
      );
      emailsSent++;
    } catch (error) {
      console.error(`[Escalation] Failed to send email to ${contact.email}:`, error);
    }
  }

  // Send push notifications
  for (const userId of contacts.pushUserIds) {
    try {
      await sendPushToUser(userId, {
        title: `🚨 ESCALATED: Crisis Alert`,
        body: `${athleteName} needs immediate attention (Level ${escalationLevel})`,
        data: {
          type: 'escalated_crisis',
          alertId: alert.id,
          escalationLevel,
        },
        channel: NotificationChannel.CRISIS,
        priority: NotificationPriority.HIGH,
      });
      pushSent++;
    } catch (error) {
      console.error(`[Escalation] Failed to send push to user ${userId}:`, error);
    }
  }

  // SMS for CRITICAL alerts at level 2+ (if configured)
  if (alert.severity === 'CRITICAL' && escalationLevel >= 2 && process.env.TWILIO_ACCOUNT_SID) {
    for (const phone of contacts.smsNumbers) {
      try {
        await sendEscalationSms(
          phone,
          athleteName,
          alert.severity,
          escalationLevel
        );
        smsSent++;
      } catch (error) {
        console.error(`[Escalation] Failed to send SMS to ${phone}:`, error);
      }
    }
  }

  // Update alert in database
  await prisma.crisisAlert.update({
    where: { id: alert.id },
    data: {
      escalated: true,
      escalatedTo: escalationLevel.toString(),
    },
  });

  return {
    alertId: alert.id,
    athleteId: alert.athleteId,
    severity: alert.severity,
    escalationLevel,
    notificationsSent: {
      emails: emailsSent,
      pushNotifications: pushSent,
      sms: smsSent,
    },
    success: emailsSent > 0 || pushSent > 0,
  };
}

/**
 * Get escalation contacts based on level
 */
async function getEscalationContacts(
  alert: any,
  level: number
): Promise<{
  emails: Array<{ email: string; name: string }>;
  pushUserIds: string[];
  smsNumbers: string[];
}> {
  const emails: Array<{ email: string; name: string }> = [];
  const pushUserIds: string[] = [];
  const smsNumbers: string[] = [];

  // Level 1: Direct coach(es)
  if (level >= 1) {
    for (const relation of alert.Athlete?.CoachAthlete || []) {
      const coach = relation.Coach?.User;
      if (coach?.email) {
        emails.push({ email: coach.email, name: coach.name || 'Coach' });
        pushUserIds.push(coach.id);
      }
    }
  }

  // Level 2: Athletics director / admin contacts
  if (level >= 2) {
    // Get school admins
    const athlete = await prisma.athlete.findUnique({
      where: { userId: alert.athleteId },
      include: {
        User: {
          include: {
            School: true,
          },
        },
      },
    });

    if (athlete?.User?.School?.id) {
      const admins = await prisma.user.findMany({
        where: {
          schoolId: athlete.User.School.id,
          role: 'ADMIN',
        },
        select: { id: true, name: true, email: true },
      });

      for (const admin of admins) {
        if (admin.email) {
          emails.push({ email: admin.email, name: admin.name || 'Admin' });
          pushUserIds.push(admin.id);
        }
      }
    }

    // Add configured emergency contacts
    const emergencyEmail = process.env.CRISIS_EMERGENCY_EMAIL;
    if (emergencyEmail) {
      emails.push({ email: emergencyEmail, name: 'Emergency Contact' });
    }
  }

  // Level 3: External emergency contacts / SMS
  if (level >= 3) {
    const emergencyPhone = process.env.CRISIS_EMERGENCY_PHONE;
    if (emergencyPhone) {
      smsNumbers.push(emergencyPhone);
    }
  }

  return { emails, pushUserIds, smsNumbers };
}

/**
 * Send escalation email
 */
async function sendEscalationEmail(
  toEmail: string,
  toName: string,
  athleteName: string,
  severity: string,
  alertId: string,
  detectedAt: Date,
  notes: string,
  escalationLevel: number
): Promise<void> {
  const dashboardUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/coach/alerts?highlight=${alertId}`;
  const timeSince = Math.round((Date.now() - detectedAt.getTime()) / 60000);

  const severityColors: Record<string, string> = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#22c55e',
  };

  await sendEmail({
    to: toEmail,
    subject: `🚨 ESCALATED CRISIS ALERT - ${athleteName} - Level ${escalationLevel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${severityColors[severity] || '#ef4444'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">⚠️ ESCALATED Crisis Alert - Level ${escalationLevel}</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">This alert has not been reviewed and requires immediate attention</p>
        </div>

        <div style="background: #f8f9fa; padding: 24px; border: 1px solid #dee2e6; border-top: none;">
          <p style="margin: 0 0 16px;">Hi ${toName},</p>

          <p style="margin: 0 0 16px;">
            A crisis alert for <strong>${athleteName}</strong> has been escalated because
            it has not been reviewed for <strong>${timeSince} minutes</strong>.
          </p>

          <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Severity:</td>
                <td style="padding: 8px 0; font-weight: bold; color: ${severityColors[severity]}">${severity}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Detected:</td>
                <td style="padding: 8px 0;">${detectedAt.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Escalation Level:</td>
                <td style="padding: 8px 0; font-weight: bold;">${escalationLevel} of ${MAX_ESCALATION_ATTEMPTS}</td>
              </tr>
            </table>
          </div>

          ${notes ? `
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <strong>Detection Notes:</strong>
            <p style="margin: 8px 0 0; font-size: 14px; color: #664d03;">${notes}</p>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 24px 0;">
            <a href="${dashboardUrl}"
               style="display: inline-block;
                      background: #dc2626;
                      color: white;
                      padding: 14px 32px;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: 600;">
              Review Alert Now
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            <strong>Recommended actions:</strong><br>
            1. Contact the athlete directly<br>
            2. Review the chat session for context<br>
            3. Mark the alert as reviewed once addressed<br>
            4. Involve campus counseling if needed
          </p>
        </div>

        <div style="background: #1f2937; color: #9ca3af; padding: 16px; border-radius: 0 0 8px 8px; font-size: 12px; text-align: center;">
          <p style="margin: 0;">AI Sports Agent Crisis Escalation System</p>
          <p style="margin: 8px 0 0;">This is an automated alert. Do not reply to this email.</p>
        </div>
      </div>
    `,
    text: `ESCALATED CRISIS ALERT - Level ${escalationLevel}

Hi ${toName},

A crisis alert for ${athleteName} has been escalated because it has not been reviewed for ${timeSince} minutes.

Severity: ${severity}
Detected: ${detectedAt.toLocaleString()}
Escalation Level: ${escalationLevel} of ${MAX_ESCALATION_ATTEMPTS}

${notes ? `Notes: ${notes}` : ''}

Review the alert at: ${dashboardUrl}

Recommended actions:
1. Contact the athlete directly
2. Review the chat session for context
3. Mark the alert as reviewed once addressed
4. Involve campus counseling if needed`,
  });
}

/**
 * Send escalation SMS (requires Twilio)
 */
async function sendEscalationSms(
  toPhone: string,
  athleteName: string,
  severity: string,
  escalationLevel: number
): Promise<void> {
  // Only send if Twilio is configured
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.log('[Escalation] SMS not sent - Twilio not configured');
    return;
  }

  const dashboardUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/coach/alerts`;

  const message = `🚨 ESCALATED CRISIS (Level ${escalationLevel}): ${athleteName} needs immediate attention. Severity: ${severity}. View: ${dashboardUrl}`;

  try {
    // Dynamic import to avoid requiring Twilio in environments where it's not needed
    const twilio = await import('twilio');
    const client = twilio.default(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: message,
      to: toPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    console.log(`[Escalation] SMS sent to ${toPhone}`);
  } catch (error) {
    console.error('[Escalation] SMS send failed:', error);
    throw error;
  }
}

/**
 * Get escalation statistics
 */
export async function getEscalationStats(): Promise<{
  totalAlerts: number;
  unreviewed: number;
  escalated: number;
  averageReviewTime: number | null;
  bySeverity: Record<string, number>;
}> {
  const [totalAlerts, unreviewed, escalated, reviewedAlerts] = await Promise.all([
    prisma.crisisAlert.count(),
    prisma.crisisAlert.count({ where: { reviewed: false } }),
    prisma.crisisAlert.count({ where: { escalated: true } }),
    prisma.crisisAlert.findMany({
      where: { reviewed: true, reviewedAt: { not: null } },
      select: { detectedAt: true, reviewedAt: true },
    }),
  ]);

  // Calculate average review time
  let averageReviewTime: number | null = null;
  if (reviewedAlerts.length > 0) {
    const totalMs = reviewedAlerts.reduce((sum, alert) => {
      if (alert.reviewedAt) {
        return sum + (alert.reviewedAt.getTime() - alert.detectedAt.getTime());
      }
      return sum;
    }, 0);
    averageReviewTime = Math.round(totalMs / reviewedAlerts.length / 60000); // In minutes
  }

  // Group by severity
  const severityCounts = await prisma.crisisAlert.groupBy({
    by: ['severity'],
    _count: true,
  });

  const bySeverity: Record<string, number> = {};
  for (const item of severityCounts) {
    bySeverity[item.severity] = item._count;
  }

  return {
    totalAlerts,
    unreviewed,
    escalated,
    averageReviewTime,
    bySeverity,
  };
}
