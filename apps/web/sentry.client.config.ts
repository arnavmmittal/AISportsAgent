/**
 * Sentry Client-Side Configuration
 * Captures errors in browser/client components
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment (development, staging, production)
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

    // Adjust this value in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay (capture user sessions for debugging)
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
    replaysOnErrorSampleRate: 1.0, // Always capture replays on errors

    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        // Enable performance monitoring
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/[^/]*\.vercel\.app/,
          /^https:\/\/aisportsagent\.com/,
        ],
      }),
      new Sentry.Replay({
        // Mask all text and input fields by default (privacy)
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Before sending events to Sentry
    beforeSend(event, hint) {
      // Filter out low-priority errors
      const error = hint.originalException;

      // Don't send network errors in development
      if (
        process.env.NODE_ENV === 'development' &&
        error instanceof Error &&
        (error.message.includes('fetch') || error.message.includes('network'))
      ) {
        return null;
      }

      // Sanitize PII from error messages
      if (event.message) {
        event.message = sanitizePII(event.message);
      }

      // Sanitize breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.message) {
            breadcrumb.message = sanitizePII(breadcrumb.message);
          }
          return breadcrumb;
        });
      }

      return event;
    },

    // Ignore common benign errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      // Network errors
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      // Cancelled requests
      'AbortError',
      'Request aborted',
    ],
  });
}

/**
 * Sanitize PII from error messages
 */
function sanitizePII(message: string): string {
  return message
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    .replace(/sk-[a-zA-Z0-9]{20,}/g, '[API_KEY]')
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/g, 'Bearer [TOKEN]');
}
