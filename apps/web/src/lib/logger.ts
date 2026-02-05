/**
 * Structured Logging Utility
 *
 * Provides consistent, structured logging across the application:
 * - Log levels: debug, info, warn, error
 * - Structured context (timestamps, request ID, user ID, etc.)
 * - JSON format in production for log aggregation (Datadog, CloudWatch, etc.)
 * - Pretty format in development for readability
 * - Sentry integration for errors
 *
 * Usage:
 * ```typescript
 * import { logger, createLogger } from '@/lib/logger';
 *
 * // Global logger
 * logger.info('User logged in', { userId: '123', method: 'email' });
 *
 * // Scoped logger for a module
 * const log = createLogger('ChatService');
 * log.debug('Processing message', { sessionId: 'abc', messageLength: 150 });
 * ```
 */

import * as Sentry from '@sentry/nextjs';

// Log levels in order of severity
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level from environment (default: info in production, debug in development)
const MIN_LOG_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Use JSON format in production
const USE_JSON_FORMAT = process.env.NODE_ENV === 'production';

// Check if Sentry is enabled
const SENTRY_ENABLED = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Structured log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  scope?: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Context that can be added to all logs (e.g., request-scoped)
 */
interface LogContext {
  requestId?: string;
  userId?: string;
  schoolId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

// Global context that persists across log calls (useful for request-scoped logging)
let globalContext: LogContext = {};

/**
 * Set global context for all subsequent logs
 * Useful in middleware to add request ID, user ID, etc.
 */
export function setLogContext(context: LogContext): void {
  globalContext = { ...globalContext, ...context };
}

/**
 * Clear global context (call at end of request)
 */
export function clearLogContext(): void {
  globalContext = {};
}

/**
 * Get global context
 */
export function getLogContext(): LogContext {
  return { ...globalContext };
}

/**
 * Sanitize sensitive data from log context
 */
function sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'apikey', 'api_key', 'authorization', 'cookie'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeContext(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Format log entry for output
 */
function formatLog(entry: LogEntry): string {
  if (USE_JSON_FORMAT) {
    // JSON format for production log aggregation
    return JSON.stringify({
      ...entry,
      context: entry.context ? sanitizeContext(entry.context) : undefined,
    });
  }

  // Pretty format for development
  const levelColors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
  };
  const reset = '\x1b[0m';
  const dim = '\x1b[2m';

  const color = levelColors[entry.level];
  const levelStr = `[${entry.level.toUpperCase()}]`.padEnd(7);
  const scope = entry.scope ? `[${entry.scope}] ` : '';
  const timestamp = dim + entry.timestamp.split('T')[1].split('.')[0] + reset;
  const contextStr = entry.context && Object.keys(entry.context).length > 0
    ? dim + ' ' + JSON.stringify(sanitizeContext(entry.context)) + reset
    : '';

  let output = `${timestamp} ${color}${levelStr}${reset} ${scope}${entry.message}${contextStr}`;

  if (entry.error) {
    output += `\n${dim}Error: ${entry.error.name}: ${entry.error.message}${reset}`;
    if (entry.error.stack && process.env.NODE_ENV === 'development') {
      output += `\n${dim}${entry.error.stack}${reset}`;
    }
  }

  return output;
}

/**
 * Core logging function
 */
function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: Error,
  scope?: string
): void {
  // Check if we should log at this level
  if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LOG_LEVEL]) {
    return;
  }

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    scope,
    context: { ...globalContext, ...context },
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  const formatted = formatLog(entry);

  // Output to console
  switch (level) {
    case 'debug':
    case 'info':
      console.log(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }

  // Send errors and warnings to Sentry
  if (SENTRY_ENABLED) {
    if (level === 'error' && error) {
      Sentry.withScope((scope) => {
        if (entry.context) {
          Object.entries(sanitizeContext(entry.context)).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }
        Sentry.captureException(error);
      });
    } else if (level === 'warn') {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: entry.context ? sanitizeContext(entry.context) : undefined,
      });
    }
  }
}

/**
 * Logger interface
 */
export interface Logger {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, error?: Error, context?: Record<string, unknown>) => void;
}

/**
 * Create a scoped logger for a specific module/service
 */
export function createLogger(scope: string): Logger {
  return {
    debug: (message, context) => log('debug', message, context, undefined, scope),
    info: (message, context) => log('info', message, context, undefined, scope),
    warn: (message, context) => log('warn', message, context, undefined, scope),
    error: (message, error, context) => log('error', message, context, error, scope),
  };
}

/**
 * Global logger instance
 */
export const logger: Logger = {
  debug: (message, context) => log('debug', message, context),
  info: (message, context) => log('info', message, context),
  warn: (message, context) => log('warn', message, context),
  error: (message, error, context) => log('error', message, context, error),
};

/**
 * Request logging middleware helper
 * Call at the start of API handlers to log the request
 */
export function logRequest(
  method: string,
  path: string,
  context?: {
    userId?: string;
    userAgent?: string;
    ip?: string;
    params?: Record<string, string>;
  }
): void {
  logger.info(`${method} ${path}`, {
    method,
    path,
    ...context,
  });
}

/**
 * Response logging middleware helper
 * Call at the end of API handlers to log the response
 */
export function logResponse(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  context?: Record<string, unknown>
): void {
  const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  log(level, `${method} ${path} -> ${statusCode} (${durationMs}ms)`, {
    method,
    path,
    statusCode,
    durationMs,
    ...context,
  });
}

/**
 * Convenience: Log database operations
 */
export const dbLogger = createLogger('Database');

/**
 * Convenience: Log external API calls
 */
export const apiLogger = createLogger('ExternalAPI');

/**
 * Convenience: Log authentication events
 */
export const authLogger = createLogger('Auth');

/**
 * Convenience: Log chat/AI operations
 */
export const chatLogger = createLogger('Chat');

/**
 * Convenience: Log crisis detection
 */
export const crisisLogger = createLogger('Crisis');
