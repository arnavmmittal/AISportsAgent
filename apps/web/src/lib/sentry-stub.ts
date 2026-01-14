/**
 * Sentry stub - placeholder until Sentry is properly configured
 *
 * Replace with actual @sentry/nextjs when ready for production monitoring
 */

interface SentryContext {
  tags?: Record<string, string | number | boolean>;
  extra?: Record<string, unknown>;
  level?: 'info' | 'warning' | 'error';
}

export const captureException = (error: Error, context?: SentryContext) => {
  console.error('[Sentry Stub] Exception:', error.message, context);
};

export const captureMessage = (
  message: string,
  levelOrContext?: 'info' | 'warning' | 'error' | SentryContext
) => {
  const level = typeof levelOrContext === 'string'
    ? levelOrContext
    : levelOrContext?.level || 'info';
  console.log(`[Sentry Stub] ${level}:`, message);
};
