/**
 * Sentry Server-Side Configuration
 *
 * This file configures Sentry for the Node.js server-side.
 * It runs in API routes, server components, and middleware.
 * Captures:
 * - Server errors
 * - API route errors
 * - Database errors
 * - External service failures
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize if DSN is configured
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment detection
    environment: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development',

    // Performance Monitoring
    // Lower sample rate in production to control costs
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',

    // Filter out expected errors
    ignoreErrors: [
      // Auth errors (expected)
      'Unauthorized',
      'Invalid token',
      'Session expired',
      // Rate limiting (expected)
      'Too many requests',
      'Rate limit exceeded',
      // Database connection issues during cold starts
      'Connection terminated unexpectedly',
      // User input validation
      'Validation failed',
    ],

    // Don't send PII
    beforeSend(event, hint) {
      // Scrub sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-auth-token'];
      }

      // Scrub sensitive data from context
      if (event.contexts?.['Request Data']?.data) {
        const data = event.contexts['Request Data'].data as Record<string, unknown>;
        if (data.password) data.password = '[REDACTED]';
        if (data.token) data.token = '[REDACTED]';
        if (data.apiKey) data.apiKey = '[REDACTED]';
      }

      return event;
    },

    // Add additional context
    beforeSendTransaction(event) {
      // Add deployment info if available
      if (process.env.VERCEL_GIT_COMMIT_SHA) {
        event.release = process.env.VERCEL_GIT_COMMIT_SHA;
      }
      return event;
    },

    // Integrations
    integrations: [
      // Automatically instrument Prisma queries
      Sentry.prismaIntegration(),
    ],
  });
}
