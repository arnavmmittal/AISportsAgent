/**
 * Email Service Utility
 *
 * Provides email sending functionality using SendGrid or console logging in development.
 * Supports transactional emails for password reset, verification, notifications, etc.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

interface SendGridResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using SendGrid (production) or console log (development)
 */
export async function sendEmail(options: EmailOptions): Promise<SendGridResponse> {
  const {
    to,
    subject,
    html,
    text,
    from = process.env.EMAIL_FROM || 'Flow Sports Coach <noreply@flowsportscoach.com>',
    replyTo = process.env.EMAIL_REPLY_TO,
  } = options;

  // Development mode: log to console instead of sending
  if (process.env.NODE_ENV === 'development' && !process.env.SENDGRID_API_KEY) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 EMAIL (Development Mode - Not Sent)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${to}`);
    console.log(`From: ${from}`);
    console.log(`Subject: ${subject}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('HTML Content:');
    console.log(html);
    if (text) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Text Content:');
      console.log(text);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  }

  // Production: Send via SendGrid
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    console.error('[Email] SENDGRID_API_KEY not configured');
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],
        from: parseEmailAddress(from),
        reply_to: replyTo ? parseEmailAddress(replyTo) : undefined,
        subject,
        content: [
          ...(text ? [{ type: 'text/plain', value: text }] : []),
          { type: 'text/html', value: html },
        ],
      }),
    });

    if (response.ok || response.status === 202) {
      const messageId = response.headers.get('x-message-id') || `sg-${Date.now()}`;
      console.log(`[Email] Sent successfully to ${to}, messageId: ${messageId}`);
      return {
        success: true,
        messageId,
      };
    }

    const errorText = await response.text();
    console.error(`[Email] SendGrid error: ${response.status} - ${errorText}`);
    return {
      success: false,
      error: `SendGrid error: ${response.status}`,
    };

  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse email address string into SendGrid format
 * Handles formats like "Name <email@example.com>" or "email@example.com"
 */
function parseEmailAddress(address: string): { email: string; name?: string } {
  const match = address.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return {
      name: match[1].trim(),
      email: match[2].trim(),
    };
  }
  return { email: address.trim() };
}

/**
 * Send a templated email with predefined styling
 */
export async function sendTemplatedEmail(
  to: string,
  subject: string,
  content: {
    heading: string;
    body: string;
    ctaText?: string;
    ctaUrl?: string;
    footer?: string;
  }
): Promise<SendGridResponse> {
  const { heading, body, ctaText, ctaUrl, footer } = content;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <!-- Logo/Brand -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 12px 24px; border-radius: 8px;">
                <span style="color: white; font-weight: bold; font-size: 18px;">Flow Sports Coach</span>
              </div>
            </div>

            <!-- Heading -->
            <h1 style="color: #18181b; font-size: 24px; margin: 0 0 20px; text-align: center;">
              ${heading}
            </h1>

            <!-- Body -->
            <div style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              ${body}
            </div>

            ${ctaText && ctaUrl ? `
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${ctaUrl}"
                 style="display: inline-block;
                        background: linear-gradient(135deg, #6366f1, #8b5cf6);
                        color: white;
                        padding: 14px 32px;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 16px;">
                ${ctaText}
              </a>
            </div>
            ` : ''}

            ${footer ? `
            <!-- Footer Note -->
            <p style="color: #a1a1aa; font-size: 14px; margin-top: 30px; text-align: center;">
              ${footer}
            </p>
            ` : ''}
          </div>

          <!-- Email Footer -->
          <div style="text-align: center; margin-top: 30px; color: #a1a1aa; font-size: 12px;">
            <p style="margin: 0;">Flow Sports Coach - Mental Performance Support for Athletes</p>
            <p style="margin: 8px 0 0;">© ${new Date().getFullYear()} Flow Sports Coach. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Generate plain text version
  const text = `${heading}\n\n${body.replace(/<[^>]*>/g, '')}${ctaUrl ? `\n\n${ctaText}: ${ctaUrl}` : ''}${footer ? `\n\n${footer}` : ''}`;

  return sendEmail({ to, subject, html, text });
}
