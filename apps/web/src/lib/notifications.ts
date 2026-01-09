/**
 * Notification Service
 *
 * Handles crisis alert notifications to coaches via multiple channels.
 * For pilot: Logs to console + creates database flag
 * For production: Add email (Resend) and SMS (Twilio) integrations
 */

import * as Sentry from '@sentry/nextjs';

export type NotificationChannel = 'email' | 'sms' | 'dashboard';
export type CrisisSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface CrisisNotification {
  athleteName: string;
  athleteId: string;
  coachEmail?: string;
  coachPhone?: string;
  severity: CrisisSeverity;
  indicators: string[];
  alertId: string;
  schoolName: string;
}

/**
 * Send crisis alert notification to coach
 *
 * PILOT IMPLEMENTATION:
 * - Logs to Sentry (if configured)
 * - Logs to console
 * - Dashboard alert already created in DB
 *
 * PRODUCTION TODO:
 * - Add Resend email integration
 * - Add Twilio SMS for CRITICAL/HIGH severity
 * - Add auto-escalation after 5 minutes if not reviewed
 */
export async function sendCrisisNotification(notification: CrisisNotification): Promise<void> {
  const { athleteName, severity, coachEmail, coachPhone, indicators, alertId, schoolName } =
    notification;

  // Log to Sentry (production monitoring)
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(`Crisis Alert: ${severity} - ${athleteName}`, {
      level: 'error',
      tags: {
        type: 'crisis_alert',
        severity,
        athleteId: notification.athleteId,
        alertId,
      },
      extra: {
        indicators,
        athleteName,
        schoolName,
      },
    });
  }

  // Console log for pilot (coaches can check logs)
  console.error('🚨 CRISIS ALERT 🚨', {
    severity,
    athleteName,
    alertId,
    indicators,
    timestamp: new Date().toISOString(),
  });

  // Email notification (production)
  if (coachEmail && isProductionEmailEnabled()) {
    await sendEmailNotification({
      to: coachEmail,
      subject: `🚨 ${severity} Crisis Alert - ${athleteName}`,
      body: formatEmailBody(notification),
    });
  } else {
    console.log(
      `[PILOT] Email notification skipped (would send to ${coachEmail || 'coach email'})`,
    );
  }

  // SMS notification for CRITICAL/HIGH (production)
  if (
    coachPhone &&
    (severity === 'CRITICAL' || severity === 'HIGH') &&
    isProductionSMSEnabled()
  ) {
    await sendSMSNotification({
      to: coachPhone,
      body: `URGENT: Crisis alert for ${athleteName}. Check dashboard immediately.`,
    });
  } else if (severity === 'CRITICAL' || severity === 'HIGH') {
    console.log(
      `[PILOT] SMS notification skipped (would send to ${coachPhone || 'coach phone'})`,
    );
  }
}

/**
 * Check if production email is configured
 */
function isProductionEmailEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    !!process.env.RESEND_API_KEY &&
    process.env.ENABLE_CRISIS_EMAILS === 'true'
  );
}

/**
 * Check if production SMS is configured
 */
function isProductionSMSEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    process.env.ENABLE_CRISIS_SMS === 'true'
  );
}

/**
 * Send email notification (production implementation)
 *
 * To enable in production:
 * 1. Add Resend: npm install resend
 * 2. Set env var: RESEND_API_KEY=re_...
 * 3. Set env var: ENABLE_CRISIS_EMAILS=true
 */
async function sendEmailNotification(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  try {
    // Production implementation (uncomment when Resend is added):
    /*
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'Crisis Alerts <alerts@aisportsagent.com>',
      to: params.to,
      subject: params.subject,
      html: params.body,
    });
    */

    console.log('[EMAIL] Would send:', params);
  } catch (error) {
    console.error('[EMAIL] Failed to send notification:', error);
    Sentry.captureException(error, {
      tags: { type: 'email_notification_failure' },
    });
  }
}

/**
 * Send SMS notification (production implementation)
 *
 * To enable in production:
 * 1. Add Twilio: npm install twilio
 * 2. Set env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 * 3. Set env var: ENABLE_CRISIS_SMS=true
 */
async function sendSMSNotification(params: { to: string; body: string }): Promise<void> {
  try {
    // Production implementation (uncomment when Twilio is added):
    /*
    const twilio = await import('twilio');
    const client = twilio.default(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: params.to,
      body: params.body,
    });
    */

    console.log('[SMS] Would send:', params);
  } catch (error) {
    console.error('[SMS] Failed to send notification:', error);
    Sentry.captureException(error, {
      tags: { type: 'sms_notification_failure' },
    });
  }
}

/**
 * Format email body for crisis alert
 */
function formatEmailBody(notification: CrisisNotification): string {
  const { athleteName, severity, indicators, alertId, schoolName } = notification;

  return `
    <h2 style="color: #DC2626;">🚨 ${severity} Crisis Alert</h2>

    <p><strong>Athlete:</strong> ${athleteName}</p>
    <p><strong>School:</strong> ${schoolName}</p>
    <p><strong>Severity:</strong> ${severity}</p>
    <p><strong>Alert ID:</strong> ${alertId}</p>

    <h3>Detected Indicators:</h3>
    <ul>
      ${indicators.map((indicator) => `<li>${indicator}</li>`).join('')}
    </ul>

    <p style="color: #DC2626; font-weight: bold;">
      IMMEDIATE ACTION REQUIRED: Please check the dashboard and reach out to this athlete as soon as possible.
    </p>

    <p>
      <a href="${process.env.NEXTAUTH_URL || 'https://app.aisportsagent.com'}/coach/dashboard"
         style="background: #DC2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        View Dashboard
      </a>
    </p>

    <hr />
    <p style="font-size: 12px; color: #666;">
      This is an automated alert from AI Sports Agent. If you believe this is a false positive, please review the alert in the dashboard.
    </p>
  `;
}

/**
 * Schedule auto-escalation if alert not reviewed
 *
 * For production: Implement this as a background job (cron or queue)
 */
export async function scheduleAutoEscalation(
  alertId: string,
  escalationDelayMs: number = 5 * 60 * 1000, // 5 minutes default
): Promise<void> {
  // Production implementation would use a job queue (Bull, BullMQ, or similar)
  // For pilot, we'll just log
  console.log(
    `[PILOT] Would schedule auto-escalation for alert ${alertId} after ${escalationDelayMs}ms`,
  );

  // Production TODO:
  /*
  await queue.add('escalate-crisis-alert', {
    alertId,
    scheduledAt: new Date(Date.now() + escalationDelayMs),
  });
  */
}
