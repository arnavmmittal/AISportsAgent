/**
 * Sentry Edge Configuration
 *
 * This file configures Sentry for Edge Runtime.
 * Used in middleware and edge API routes.
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
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',

    // Filter out expected errors
    ignoreErrors: [
      'Unauthorized',
      'Invalid token',
    ],
  });
}
