/**
 * API Middleware Utilities
 *
 * Reusable middleware for API routes:
 * - Request validation
 * - Authentication checks
 * - CSRF protection (auto-enabled for mutations)
 * - Rate limiting
 * - Cost control
 * - Error handling
 * - Audit logging
 *
 * CRITICAL SECURITY: All API routes should use these utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { z } from 'zod';
import { validateRequest, ValidationError } from './api-validation';
import { checkRateLimit } from '@/middleware/rate-limit';
import { checkCostLimit } from '@/middleware/cost-control';
import { csrfProtection } from './csrf';
import {
  ErrorCode,
  errorResponse as standardErrorResponse,
  successResponse as standardSuccessResponse,
  handleError,
  ApiError,
} from './api-errors';
import { logger, setLogContext, clearLogContext } from './logger';

/**
 * API handler context
 * Passed to all API route handlers
 */
export interface ApiContext {
  user: {
    id: string;
    email: string;
    role: 'ATHLETE' | 'COACH' | 'ADMIN';
    schoolId: string;
    name?: string;
  };
  request: NextRequest;
}

/**
 * API route handler function type
 */
export type ApiHandler<T = any> = (
  context: ApiContext,
  validatedData?: T
) => Promise<NextResponse>;

/**
 * API middleware options
 */
export interface ApiMiddlewareOptions<T = any> {
  /** Zod schema for request validation (optional) */
  schema?: z.ZodSchema<T>;

  /** Required roles (if any) */
  requireRole?: Array<'ATHLETE' | 'COACH' | 'ADMIN'>;

  /** Require authentication (default: true) */
  requireAuth?: boolean;

  /** Enable rate limiting (default: true) */
  rateLimit?: boolean;

  /** Enable CSRF protection (default: true for mutations, auto-skips GET/HEAD/OPTIONS) */
  csrfProtection?: boolean;

  /** Enable cost control (default: false, only for LLM endpoints) */
  costControl?: boolean;

  /** Enable audit logging (default: false, only for sensitive operations) */
  auditLog?: boolean;

  /** Custom rate limit (overrides default) */
  customRateLimit?: {
    limit: number;
    window: number; // in milliseconds
  };
}

/**
 * Wrap API route with middleware
 *
 * Usage:
 * ```typescript
 * export const POST = withApiMiddleware(
 *   { schema: chatMessageSchema, requireRole: ['ATHLETE'] },
 *   async (context, data) => {
 *     // Handler logic here
 *     return NextResponse.json({ success: true });
 *   }
 * );
 * ```
 */
export function withApiMiddleware<T = any>(
  options: ApiMiddlewareOptions<T>,
  handler: ApiHandler<T>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    const { pathname } = new URL(request.url);

    // Set request context for all logs during this request
    setLogContext({ requestId, path: pathname, method: request.method });

    try {
      // 1. AUTHENTICATION CHECK
      let user: ApiContext['user'] | null = null;

      if (options.requireAuth !== false) {
        const { authorized, user: authUser, response } = await requireAuth(request);

        if (!authorized || !authUser) {
          return response || NextResponse.json(
            { error: 'Unauthorized', message: 'Authentication required' },
            { status: 401 }
          );
        }

        user = {
          id: authUser.id,
          email: authUser.email || '',
          role: authUser.role as 'ATHLETE' | 'COACH' | 'ADMIN',
          schoolId: authUser.schoolId,
          name: undefined, // authUser doesn't have name
        };

        // Add user context to all logs for this request
        setLogContext({ userId: user.id, userRole: user.role, schoolId: user.schoolId });
      }

      // 2. CSRF PROTECTION (for mutation methods)
      // Auto-skips GET/HEAD/OPTIONS and JWT-only auth
      if (options.csrfProtection !== false) {
        const csrfResult = csrfProtection(request);
        if (csrfResult) {
          return csrfResult;
        }
      }

      // 3. ROLE-BASED ACCESS CONTROL
      if (options.requireRole && user) {
        if (!options.requireRole.includes(user.role)) {
          return NextResponse.json(
            {
              error: 'Forbidden',
              message: `This endpoint requires one of the following roles: ${options.requireRole.join(', ')}`,
            },
            { status: 403 }
          );
        }
      }

      // 4. RATE LIMITING
      if (options.rateLimit !== false && user) {
        const rateLimitResult = await checkRateLimit(
          user.id,
          user.role,
          user.schoolId
        );

        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            {
              error: 'Too many requests',
              message: `Rate limit exceeded. Please try again in ${rateLimitResult.retryAfter} seconds.`,
              retryAfter: rateLimitResult.retryAfter,
            },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
                'Retry-After': rateLimitResult.retryAfter!.toString(),
              },
            }
          );
        }
      }

      // 5. COST CONTROL (for LLM endpoints)
      if (options.costControl && user) {
        const costResult = await checkCostLimit(user.schoolId);

        if (!costResult.allowed) {
          return NextResponse.json(
            {
              error: 'Budget exceeded',
              message: costResult.error,
              usage: costResult.usage,
            },
            { status: 429 }
          );
        }
      }

      // 6. REQUEST VALIDATION
      let validatedData: T | undefined;

      if (options.schema) {
        // Parse request body
        let body: unknown;
        try {
          const contentType = request.headers.get('content-type') || '';

          if (contentType.includes('application/json')) {
            body = await request.json();
          } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await request.formData();
            body = Object.fromEntries(formData);
          } else {
            body = await request.json(); // Default to JSON
          }
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid request', message: 'Failed to parse request body' },
            { status: 400 }
          );
        }

        // Validate against schema
        try {
          validatedData = await validateRequest(options.schema, body);
        } catch (error) {
          if (error instanceof ValidationError) {
            return NextResponse.json(
              {
                error: 'Validation failed',
                message: error.message,
                details: error.errors,
              },
              { status: 400 }
            );
          }
          throw error;
        }
      }

      // 7. EXECUTE HANDLER
      const context: ApiContext = {
        user: user || {
          id: '',
          email: '',
          role: 'ATHLETE',
          schoolId: '',
        },
        request,
      };

      const response = await handler(context, validatedData);

      // 8. AUDIT LOGGING (if enabled)
      if (options.auditLog && user) {
        // TODO: Implement audit logging
        // await logAuditEvent({
        //   userId: user.id,
        //   action: request.method,
        //   resource: request.url,
        //   schoolId: user.schoolId,
        //   success: response.status < 400,
        // });
      }

      // Log successful request completion
      const durationMs = Date.now() - startTime;
      logger.info(`${request.method} ${pathname} -> ${response.status}`, {
        durationMs,
        status: response.status,
      });

      // Clear request context
      clearLogContext();

      return response;
    } catch (error) {
      // GLOBAL ERROR HANDLER - uses standardized error responses
      const durationMs = Date.now() - startTime;

      // Log the error
      logger.error(
        `${request.method} ${pathname} failed`,
        error instanceof Error ? error : new Error(String(error)),
        { durationMs }
      );

      // Clear request context
      clearLogContext();

      // Handle ApiError (thrown intentionally)
      if (error instanceof ApiError) {
        return standardErrorResponse(error.code, error.message, error.details);
      }

      // Handle known error types from auth-helpers
      if (error instanceof Error) {
        if (error.name === 'UnauthorizedError') {
          return standardErrorResponse(ErrorCode.AUTHENTICATION_REQUIRED, error.message);
        }

        if (error.name === 'ForbiddenError') {
          return standardErrorResponse(ErrorCode.FORBIDDEN, error.message);
        }

        if (error.name === 'NotFoundError') {
          return standardErrorResponse(ErrorCode.NOT_FOUND, error.message);
        }
      }

      // Use handleError for unknown errors (logs and sanitizes)
      return handleError(error, 'withApiMiddleware');
    }
  };
}

/**
 * Custom error classes for API routes
 */
export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends Error {
  constructor(message = 'Bad request') {
    super(message);
    this.name = 'BadRequestError';
  }
}

/**
 * Helper: Check if user owns resource (multi-tenant check)
 */
export function assertOwnership(
  userSchoolId: string,
  resourceSchoolId: string,
  message = 'You do not have access to this resource'
): void {
  if (userSchoolId !== resourceSchoolId) {
    throw new ForbiddenError(message);
  }
}

/**
 * Helper: Check if coach has consent to view athlete data
 */
export async function assertCoachConsent(
  coachId: string,
  athleteId: string
): Promise<void> {
  // TODO: Query database for consent
  // const relation = await prisma.coachAthleteRelation.findFirst({
  //   where: { coachId, athleteId, consentGranted: true }
  // });
  //
  // if (!relation) {
  //   throw new ForbiddenError('You do not have consent to view this athlete\'s data');
  // }

  // Placeholder for now
  console.log(`Checking consent: coach=${coachId}, athlete=${athleteId}`);
}

/**
 * Helper: Create success response with standard format
 * @deprecated Use standardSuccessResponse from api-errors.ts for new code
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return standardSuccessResponse(data, { status });
}

/**
 * Helper: Create error response with standard format
 * @deprecated Use standardErrorResponse from api-errors.ts for new code
 */
export function errorResponse(
  message: string,
  status = 400,
  details?: unknown
): NextResponse {
  // Map status codes to error codes for backwards compatibility
  let code: ErrorCode;
  switch (status) {
    case 400: code = ErrorCode.INVALID_REQUEST; break;
    case 401: code = ErrorCode.AUTHENTICATION_REQUIRED; break;
    case 403: code = ErrorCode.FORBIDDEN; break;
    case 404: code = ErrorCode.NOT_FOUND; break;
    case 409: code = ErrorCode.CONFLICT; break;
    case 429: code = ErrorCode.RATE_LIMITED; break;
    case 500: code = ErrorCode.INTERNAL_ERROR; break;
    default: code = ErrorCode.INTERNAL_ERROR;
  }
  return standardErrorResponse(code, message, details);
}

// Re-export new utilities for easy access
export { ErrorCode, standardErrorResponse, standardSuccessResponse, handleError, ApiError };

/**
 * Simplified wrapper for GET requests (no body validation)
 */
export function withGetMiddleware(
  options: Omit<ApiMiddlewareOptions, 'schema'>,
  handler: ApiHandler
) {
  return withApiMiddleware(options, handler);
}

/**
 * Simplified wrapper for POST requests with validation
 */
export function withPostMiddleware<T>(
  schema: z.ZodSchema<T>,
  options: Omit<ApiMiddlewareOptions<T>, 'schema'>,
  handler: ApiHandler<T>
) {
  return withApiMiddleware({ ...options, schema }, handler);
}

/**
 * Simplified wrapper for protected routes (athletes only)
 */
export function withAthleteRoute<T>(
  schema: z.ZodSchema<T> | undefined,
  handler: ApiHandler<T>
) {
  return withApiMiddleware(
    {
      schema,
      requireRole: ['ATHLETE'],
      requireAuth: true,
      rateLimit: true,
    },
    handler
  );
}

/**
 * Simplified wrapper for coach routes
 */
export function withCoachRoute<T>(
  schema: z.ZodSchema<T> | undefined,
  handler: ApiHandler<T>
) {
  return withApiMiddleware(
    {
      schema,
      requireRole: ['COACH', 'ADMIN'],
      requireAuth: true,
      rateLimit: true,
    },
    handler
  );
}

/**
 * Simplified wrapper for admin routes
 */
export function withAdminRoute<T>(
  schema: z.ZodSchema<T> | undefined,
  handler: ApiHandler<T>
) {
  return withApiMiddleware(
    {
      schema,
      requireRole: ['ADMIN'],
      requireAuth: true,
      rateLimit: true,
    },
    handler
  );
}
