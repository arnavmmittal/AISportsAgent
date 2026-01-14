/**
 * API Middleware Utilities
 *
 * Reusable middleware for API routes:
 * - Request validation
 * - Authentication checks
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
      }

      // 2. ROLE-BASED ACCESS CONTROL
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

      // 3. RATE LIMITING
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

      // 4. COST CONTROL (for LLM endpoints)
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

      // 5. REQUEST VALIDATION
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

      // 6. EXECUTE HANDLER
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

      // 7. AUDIT LOGGING (if enabled)
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

      return response;
    } catch (error) {
      // GLOBAL ERROR HANDLER
      console.error('API Error:', error);

      // Don't expose internal errors to client
      if (error instanceof Error) {
        // Known error types
        if (error.name === 'UnauthorizedError') {
          return NextResponse.json(
            { error: 'Unauthorized', message: error.message },
            { status: 401 }
          );
        }

        if (error.name === 'ForbiddenError') {
          return NextResponse.json(
            { error: 'Forbidden', message: error.message },
            { status: 403 }
          );
        }

        if (error.name === 'NotFoundError') {
          return NextResponse.json(
            { error: 'Not found', message: error.message },
            { status: 404 }
          );
        }
      }

      // Generic internal server error
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'An unexpected error occurred',
        },
        { status: 500 }
      );
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
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Helper: Create error response with standard format
 */
export function errorResponse(
  message: string,
  status = 400,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

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
