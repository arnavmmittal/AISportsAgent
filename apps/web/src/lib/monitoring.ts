/**
 * Monitoring & Alerting Utilities
 *
 * Centralized monitoring functions for error tracking, performance monitoring,
 * and custom metrics using Sentry.
 *
 * Requirements:
 * - Set NEXT_PUBLIC_SENTRY_DSN environment variable for Sentry to be enabled
 * - Sentry SDK is configured in sentry.client.config.ts and sentry.server.config.ts
 *
 * Usage:
 *   import { logError, trackMetric, trackPerformance } from '@/lib/monitoring';
 */

import * as Sentry from '@sentry/nextjs';

// Check if Sentry is initialized (DSN is set)
const isSentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Log error to Sentry with context
 *
 * @param error - Error object
 * @param context - Additional context (will be sanitized)
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   logError(error as Error, {
 *     userId: user.id,
 *     operation: 'riskyOperation',
 *   });
 * }
 * ```
 */
export function logError(error: Error, context?: Record<string, any>) {
  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', error, context);
  }

  // Send to Sentry if enabled
  if (isSentryEnabled) {
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
  } else if (process.env.NODE_ENV !== 'development') {
    // In production without Sentry, still log to console
    console.error('[Error]', error.message, context);
  }
}

/**
 * Track custom metric (for alerting and analytics)
 *
 * @param metricName - Name of metric (e.g., 'login_failure_count')
 * @param value - Metric value
 * @param tags - Tags for filtering/grouping
 *
 * @example
 * ```typescript
 * trackMetric('chat_message_sent', 1, {
 *   athlete_id: user.id,
 *   sport: athlete.sport,
 * });
 * ```
 */
export function trackMetric(
  metricName: string,
  value: number,
  tags?: Record<string, string>
) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Metric]', metricName, value, tags);
  }

  if (isSentryEnabled) {
    Sentry.metrics.distribution(metricName, value, {
      attributes: tags,
    });
  }
}

/**
 * Track event (non-error, informational)
 *
 * @param eventName - Name of event
 * @param data - Event data (will be sanitized)
 *
 * @example
 * ```typescript
 * trackEvent('crisis_detected', {
 *   severity: 'CRITICAL',
 *   athleteId: athlete.id,
 * });
 * ```
 */
export function trackEvent(eventName: string, data?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Event]', eventName, data);
  }

  if (isSentryEnabled) {
    Sentry.captureMessage(eventName, {
      level: 'info',
      extra: data ? sanitizeObject(data) : undefined,
    });
  }
}

/**
 * Track login failure (for brute force detection)
 *
 * @param email - Email attempted
 * @param reason - Failure reason (e.g., 'invalid_password', 'user_not_found')
 *
 * @example
 * ```typescript
 * if (!user) {
 *   trackLoginFailure(email, 'user_not_found');
 * }
 * ```
 */
export function trackLoginFailure(email: string, reason: string) {
  // Increment metric for alerting
  if (isSentryEnabled) {
    Sentry.metrics.count('login_failure_count', 1, {
      attributes: {
        reason,
      },
    });
  }

  // Log event with sanitized email
  trackEvent('login_failed', {
    email: sanitizePII(email),
    reason,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track OpenAI cost (for budget monitoring)
 *
 * @param costUSD - Cost in USD
 * @param schoolId - School ID
 * @param model - OpenAI model used
 * @param tokens - Token count
 *
 * @example
 * ```typescript
 * trackOpenAICost(0.05, school.id, 'gpt-4-turbo-preview', 2500);
 * ```
 */
export function trackOpenAICost(
  costUSD: number,
  schoolId: string,
  model: string,
  tokens: number
) {
  if (isSentryEnabled) {
    Sentry.metrics.distribution('openai_cost_usd', costUSD, {
      attributes: {
        school_id: schoolId,
        model,
      },
    });

    Sentry.metrics.distribution('openai_tokens_used', tokens, {
      attributes: {
        school_id: schoolId,
        model,
      },
    });

    // If cost spike (> $10 for single request), alert
    if (costUSD > 10) {
      Sentry.captureMessage('OpenAI cost spike detected', {
        level: 'warning',
        extra: {
          costUSD,
          schoolId,
          model,
          tokens,
        },
      });
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Cost]', { costUSD, schoolId, model, tokens });
  }
}

/**
 * Track crisis detection (critical alert)
 *
 * @param severity - Crisis severity
 * @param athleteId - Athlete ID
 * @param sessionId - Chat session ID
 * @param indicators - Crisis indicators detected
 *
 * @example
 * ```typescript
 * trackCrisisDetection('CRITICAL', athlete.id, session.id, ['self-harm']);
 * ```
 */
export function trackCrisisDetection(
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  athleteId: string,
  sessionId: string,
  indicators: string[]
) {
  // Always log crisis detections
  console.warn('[Crisis]', { severity, athleteId, sessionId, indicators });

  if (isSentryEnabled) {
    // Increment metric
    Sentry.metrics.count('crisis_detection_count', 1, {
      attributes: {
        severity,
      },
    });

    // If CRITICAL, send immediate alert
    if (severity === 'CRITICAL') {
      Sentry.captureMessage('🚨 CRITICAL crisis detected', {
        level: 'fatal', // Highest priority
        extra: {
          athleteId,
          sessionId,
          severity,
          indicators,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Track event regardless of severity
  trackEvent('crisis_detected', {
    severity,
    athleteId,
    sessionId,
    indicators,
  });
}

/**
 * Track performance (transaction timing)
 *
 * @param transactionName - Name of transaction (e.g., 'chat_stream')
 * @param durationMs - Duration in milliseconds
 * @param success - Whether transaction succeeded
 *
 * @example
 * ```typescript
 * const start = Date.now();
 * try {
 *   await processChat(message);
 *   trackPerformance('chat_stream', Date.now() - start, true);
 * } catch (error) {
 *   trackPerformance('chat_stream', Date.now() - start, false);
 * }
 * ```
 */
export function trackPerformance(
  transactionName: string,
  durationMs: number,
  success: boolean
) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Perf]', transactionName, `${durationMs}ms`, success ? '✓' : '✗');
  }

  if (isSentryEnabled) {
    Sentry.metrics.distribution('transaction_duration_ms', durationMs, {
      attributes: {
        transaction: transactionName,
        success: success.toString(),
      },
    });

    // Alert if transaction took > 5 seconds
    if (durationMs > 5000) {
      Sentry.captureMessage('Slow transaction detected', {
        level: 'warning',
        extra: {
          transactionName,
          durationMs,
          success,
        },
      });
    }
  }
}

/**
 * Set user context for error tracking
 *
 * @param user - User object
 *
 * @example
 * ```typescript
 * setUserContext({
 *   id: user.id,
 *   email: user.email,
 *   role: user.role,
 * });
 * ```
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  role?: string;
  schoolId?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email ? sanitizePII(user.email) : undefined,
    role: user.role,
    schoolId: user.schoolId,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
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
