/**
 * Standardized API Error Handling
 *
 * Provides consistent error responses across all API routes.
 * All error responses follow the format:
 * {
 *   success: false,
 *   error: {
 *     code: "ERROR_CODE",
 *     message: "Human-readable message",
 *     details?: any,
 *     requestId?: string
 *   },
 *   timestamp: "ISO-8601"
 * }
 *
 * Usage:
 * ```typescript
 * import { ApiError, ErrorCode, errorResponse } from '@/lib/api-errors';
 *
 * // Throwing errors (in handlers)
 * throw new ApiError(ErrorCode.NOT_FOUND, 'Athlete not found');
 *
 * // Direct response
 * return errorResponse(ErrorCode.VALIDATION_FAILED, 'Invalid input', { field: 'mood' });
 * ```
 */

import { NextResponse } from 'next/server';
import { logError } from './monitoring';

/**
 * Standard error codes for the API
 * Using uppercase snake_case for machine readability
 */
export enum ErrorCode {
  // 400 Bad Request
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  INVALID_PARAMETER = 'INVALID_PARAMETER',

  // 401 Unauthorized
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // 403 Forbidden
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_ACCESS_DENIED = 'RESOURCE_ACCESS_DENIED',
  CSRF_INVALID = 'CSRF_INVALID',
  CONSENT_REQUIRED = 'CONSENT_REQUIRED',

  // 404 Not Found
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',

  // 409 Conflict
  CONFLICT = 'CONFLICT',
  RESOURCE_EXISTS = 'RESOURCE_EXISTS',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // 422 Unprocessable Entity
  UNPROCESSABLE = 'UNPROCESSABLE',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',

  // 429 Too Many Requests
  RATE_LIMITED = 'RATE_LIMITED',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',

  // 500 Internal Server Error
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // 503 Service Unavailable
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
}

/**
 * HTTP status code mapping for error codes
 */
const errorCodeToStatus: Record<ErrorCode, number> = {
  // 400
  [ErrorCode.VALIDATION_FAILED]: 400,
  [ErrorCode.INVALID_REQUEST]: 400,
  [ErrorCode.MISSING_PARAMETER]: 400,
  [ErrorCode.INVALID_PARAMETER]: 400,

  // 401
  [ErrorCode.AUTHENTICATION_REQUIRED]: 401,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.SESSION_EXPIRED]: 401,

  // 403
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.RESOURCE_ACCESS_DENIED]: 403,
  [ErrorCode.CSRF_INVALID]: 403,
  [ErrorCode.CONSENT_REQUIRED]: 403,

  // 404
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.SESSION_NOT_FOUND]: 404,

  // 409
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.RESOURCE_EXISTS]: 409,
  [ErrorCode.DUPLICATE_ENTRY]: 409,

  // 422
  [ErrorCode.UNPROCESSABLE]: 422,
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 422,

  // 429
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.BUDGET_EXCEEDED]: 429,

  // 500
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 500,

  // 503
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.MAINTENANCE_MODE]: 503,
};

/**
 * API Error class for throwing structured errors
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = errorCodeToStatus[code];
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Standard error response interface
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    requestId?: string;
  };
  timestamp: string;
}

/**
 * Standard success response interface
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/**
 * Generate a unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a standardized error response
 *
 * @param code - Error code from ErrorCode enum
 * @param message - Human-readable error message
 * @param details - Optional additional details
 * @param options - Additional options (headers, requestId)
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown,
  options?: {
    headers?: Record<string, string>;
    requestId?: string;
    logError?: boolean;
  }
): NextResponse<ApiErrorResponse> {
  const requestId = options?.requestId || generateRequestId();
  const statusCode = errorCodeToStatus[code];

  // Log server errors (5xx) automatically
  if (options?.logError !== false && statusCode >= 500) {
    logError(new Error(message), {
      code,
      requestId,
      details,
    });
  }

  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      requestId,
    },
    timestamp: new Date().toISOString(),
  };

  const headers: Record<string, string> = {
    'X-Request-Id': requestId,
    ...options?.headers,
  };

  // Add retry-after header for rate limits
  if (code === ErrorCode.RATE_LIMITED && details && typeof details === 'object') {
    const retryAfter = (details as { retryAfter?: number }).retryAfter;
    if (retryAfter) {
      headers['Retry-After'] = retryAfter.toString();
    }
  }

  return NextResponse.json(body, { status: statusCode, headers });
}

/**
 * Create a standardized success response
 *
 * @param data - Response data
 * @param options - Additional options (status, headers, meta)
 */
export function successResponse<T>(
  data: T,
  options?: {
    status?: number;
    headers?: Record<string, string>;
    meta?: ApiSuccessResponse['meta'];
    requestId?: string;
  }
): NextResponse<ApiSuccessResponse<T>> {
  const requestId = options?.requestId || generateRequestId();

  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(options?.meta && { meta: options.meta }),
  };

  const headers: Record<string, string> = {
    'X-Request-Id': requestId,
    ...options?.headers,
  };

  return NextResponse.json(body, {
    status: options?.status || 200,
    headers,
  });
}

/**
 * Handle unknown errors (catch blocks)
 * Converts any error to a standardized ApiError response
 */
export function handleError(error: unknown, context?: string): NextResponse<ApiErrorResponse> {
  // If it's already an ApiError, use it directly
  if (error instanceof ApiError) {
    return errorResponse(error.code, error.message, error.details);
  }

  // Log the actual error
  const actualError = error instanceof Error ? error : new Error(String(error));
  logError(actualError, { context });

  // Return generic error to client (don't expose internals)
  const message = process.env.NODE_ENV === 'development'
    ? actualError.message
    : 'An unexpected error occurred';

  return errorResponse(
    ErrorCode.INTERNAL_ERROR,
    message,
    process.env.NODE_ENV === 'development' ? { stack: actualError.stack } : undefined
  );
}

/**
 * Convenience functions for common error types
 */
export const errors = {
  badRequest: (message: string, details?: unknown) =>
    errorResponse(ErrorCode.INVALID_REQUEST, message, details),

  validationFailed: (message: string, details?: unknown) =>
    errorResponse(ErrorCode.VALIDATION_FAILED, message, details),

  unauthorized: (message = 'Authentication required') =>
    errorResponse(ErrorCode.AUTHENTICATION_REQUIRED, message),

  forbidden: (message = 'Access denied') =>
    errorResponse(ErrorCode.FORBIDDEN, message),

  notFound: (resource = 'Resource') =>
    errorResponse(ErrorCode.NOT_FOUND, `${resource} not found`),

  conflict: (message: string, details?: unknown) =>
    errorResponse(ErrorCode.CONFLICT, message, details),

  rateLimited: (retryAfter: number) =>
    errorResponse(ErrorCode.RATE_LIMITED, 'Too many requests', { retryAfter }),

  internalError: (message = 'An unexpected error occurred') =>
    errorResponse(ErrorCode.INTERNAL_ERROR, message),
};

/**
 * Type guard for ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
