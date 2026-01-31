/**
 * Sentry Client-Side Configuration
 *
 * This file configures Sentry for the browser/client-side.
 * It runs in the browser and captures:
 * - JavaScript errors
 * - Unhandled promise rejections
 * - Console errors
 * - Performance metrics (Web Vitals)
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

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',

    // Filter out noisy errors
    ignoreErrors: [
      // Network errors
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'Load failed',
      // Browser extensions
      'Extension context invalidated',
      'ResizeObserver loop',
      // User actions
      'AbortError',
      'The user aborted a request',
      // Third-party scripts
      /^Script error\.?$/,
      // Hydration errors (Next.js)
      'Hydration failed',
      'Text content does not match',
      // Voice/Audio errors (expected during permission requests)
      'Permission denied',
      'NotAllowedError',
    ],

    // Don't send PII
    beforeSend(event, hint) {
      // Scrub sensitive data
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      // Scrub user data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data?.url) {
            // Remove tokens from URLs
            breadcrumb.data.url = breadcrumb.data.url
              .replace(/token=[^&]+/g, 'token=REDACTED')
              .replace(/key=[^&]+/g, 'key=REDACTED');
          }
          return breadcrumb;
        });
      }

      return event;
    },

    // Integrations
    integrations: [
      Sentry.replayIntegration({
        // Mask all text content by default
        maskAllText: true,
        // Block all media elements
        blockAllMedia: true,
      }),
    ],
  });
}
