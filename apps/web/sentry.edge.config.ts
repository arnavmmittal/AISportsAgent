/**
 * Sentry Edge Configuration
 * Captures errors in middleware and edge functions
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',

    // Reduced sample rate for edge (cheaper, less critical)
    tracesSampleRate: 0.01,

    // Before sending
    beforeSend(event) {
      // Don't send in development
      if (process.env.NODE_ENV === 'development') {
        return null;
      }

      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      return event;
    },
  });
}
