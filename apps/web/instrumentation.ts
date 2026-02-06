/**
 * Next.js Instrumentation
 *
 * This file is used by Next.js to initialize Sentry on server startup.
 * Required for proper Sentry integration in Next.js 13.4+
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
