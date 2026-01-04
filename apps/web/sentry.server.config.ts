/**
 * Sentry Server-Side Configuration
 * Captures errors in API routes, server components, and middleware
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment (development, staging, production)
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',

    // Adjust this value in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Integrations
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Prisma({ client: undefined }), // Will auto-detect Prisma client
    ],

    // Before sending events to Sentry
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Don't send errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('[Sentry - Not Sent in Dev]', error);
        return null;
      }

      // Sanitize PII from error messages
      if (event.message) {
        event.message = sanitizePII(event.message);
      }

      // Sanitize request data
      if (event.request) {
        if (event.request.headers) {
          // Remove sensitive headers
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['x-api-key'];
        }

        if (event.request.data) {
          // Sanitize request body
          event.request.data = sanitizeObject(event.request.data);
        }
      }

      // Sanitize extra data
      if (event.extra) {
        event.extra = sanitizeObject(event.extra);
      }

      return event;
    },

    // Ignore common benign errors
    ignoreErrors: [
      'AbortError',
      'Request aborted',
      // Prisma connection errors (logged separately)
      'PrismaClientKnownRequestError',
      // OpenAI rate limits (handled gracefully)
      'rate_limit_exceeded',
    ],
  });
}

/**
 * Sanitize PII from strings
 */
function sanitizePII(message: string): string {
  return message
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    .replace(/sk-[a-zA-Z0-9]{20,}/g, '[API_KEY]')
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/g, 'Bearer [TOKEN]')
    .replace(/password["\s:=]+[^"'\s]+/gi, 'password=[REDACTED]');
}

/**
 * Recursively sanitize objects
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizePII(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  for (const key in obj) {
    const lowerKey = key.toLowerCase();

    // Remove sensitive fields entirely
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('apikey') ||
      lowerKey.includes('api_key')
    ) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }

  return sanitized;
}

/**
 * Custom error tracking with context
 */
export function logError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      // Sanitize context before adding
      const sanitizedContext = sanitizeObject(context);
      Object.keys(sanitizedContext).forEach((key) => {
        scope.setExtra(key, sanitizedContext[key]);
      });
    }
    Sentry.captureException(error);
  });
}

/**
 * Track custom events (non-errors)
 */
export function trackEvent(eventName: string, data?: Record<string, any>) {
  Sentry.captureMessage(eventName, {
    level: 'info',
    extra: data ? sanitizeObject(data) : undefined,
  });
}
