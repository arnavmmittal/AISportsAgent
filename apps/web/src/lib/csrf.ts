/**
 * CSRF Protection Utilities
 *
 * Protects against Cross-Site Request Forgery attacks by:
 * 1. Validating Origin/Referer headers against allowed origins
 * 2. Requiring custom headers that can't be sent cross-origin
 * 3. Using SameSite cookies (handled by Supabase)
 *
 * Usage:
 *   import { validateOrigin, requireCustomHeader } from '@/lib/csrf';
 *
 * For JSON APIs with JWT auth, CSRF protection is largely automatic due to:
 * - Same-origin policy preventing cross-origin requests from reading responses
 * - Custom Content-Type header requirement (application/json)
 * - Authorization header with JWT (not sent automatically like cookies)
 *
 * For cookie-based auth (Supabase sessions), Origin validation provides protection.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Get allowed origins from environment or use defaults
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;

  if (envOrigins) {
    return envOrigins.split(',').map((o) => o.trim());
  }

  // Default allowed origins
  const defaults = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  // Add Vercel URLs if available
  if (process.env.VERCEL_URL) {
    defaults.push(`https://${process.env.VERCEL_URL}`);
  }

  // Add production URLs
  if (process.env.NEXT_PUBLIC_APP_URL) {
    defaults.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  return defaults;
}

/**
 * Validate request origin against allowed origins
 *
 * @param request - Next.js request object
 * @returns Object with isValid boolean and origin string
 */
export function validateOrigin(request: NextRequest): {
  isValid: boolean;
  origin: string | null;
  reason?: string;
} {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // For same-origin requests, origin might be null
  // In this case, check if referer matches
  if (!origin) {
    // No origin header - could be same-origin or server-to-server
    // Allow if referer matches or is absent (API calls without browser)
    if (!referer) {
      return { isValid: true, origin: null };
    }

    try {
      const refererUrl = new URL(referer);
      const allowedOrigins = getAllowedOrigins();

      if (allowedOrigins.some((allowed) => refererUrl.origin === allowed)) {
        return { isValid: true, origin: refererUrl.origin };
      }

      return {
        isValid: false,
        origin: refererUrl.origin,
        reason: 'Referer origin not in allowed list',
      };
    } catch {
      return { isValid: true, origin: null }; // Invalid referer, but allow
    }
  }

  // Validate origin against allowed list
  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.includes(origin)) {
    return { isValid: true, origin };
  }

  // Check for Vercel preview deployments (*.vercel.app)
  if (origin.endsWith('.vercel.app') && process.env.VERCEL === '1') {
    return { isValid: true, origin };
  }

  return {
    isValid: false,
    origin,
    reason: 'Origin not in allowed list',
  };
}

/**
 * CSRF validation middleware
 *
 * Use this to protect mutation endpoints (POST, PUT, DELETE)
 * from cross-origin attacks.
 *
 * @param request - Next.js request object
 * @returns NextResponse if invalid, null if valid
 */
export function csrfProtection(request: NextRequest): NextResponse | null {
  // Only check mutation methods
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null; // Safe methods don't need CSRF protection
  }

  // Skip CSRF for internal service calls
  const serviceKey = request.headers.get('x-service-key');
  if (serviceKey === process.env.INTERNAL_SERVICE_KEY) {
    return null;
  }

  // Skip CSRF for JWT-only auth (Authorization header)
  const authHeader = request.headers.get('authorization');
  const hasOnlyJWT = authHeader?.startsWith('Bearer ') && !request.cookies.has('sb-');
  if (hasOnlyJWT) {
    return null; // JWT auth doesn't need CSRF protection
  }

  // Validate origin
  const { isValid, origin, reason } = validateOrigin(request);

  if (!isValid) {
    console.warn('[CSRF] Blocked request from invalid origin:', origin, reason);

    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'Invalid request origin',
        code: 'CSRF_INVALID_ORIGIN',
      },
      { status: 403 }
    );
  }

  return null; // Valid, continue processing
}

/**
 * Require custom header for additional CSRF protection
 *
 * Use for sensitive operations like password changes, account deletion
 *
 * @param request - Next.js request object
 * @param headerName - Name of required header (default: X-Requested-With)
 * @returns NextResponse if missing, null if present
 */
export function requireCustomHeader(
  request: NextRequest,
  headerName: string = 'X-Requested-With'
): NextResponse | null {
  const hasHeader = request.headers.has(headerName);

  if (!hasHeader) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: `Missing required header: ${headerName}`,
        code: 'CSRF_MISSING_HEADER',
      },
      { status: 400 }
    );
  }

  return null;
}

/**
 * Combined CSRF protection for sensitive endpoints
 *
 * Validates both origin AND requires custom header
 *
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const csrfResult = strictCsrfProtection(request);
 *   if (csrfResult) return csrfResult;
 *
 *   // Continue with handler...
 * }
 * ```
 */
export function strictCsrfProtection(request: NextRequest): NextResponse | null {
  const originResult = csrfProtection(request);
  if (originResult) return originResult;

  const headerResult = requireCustomHeader(request);
  if (headerResult) return headerResult;

  return null;
}

/**
 * Middleware wrapper that adds CSRF protection to handlers
 *
 * Usage:
 * ```typescript
 * export const POST = withCsrfProtection(async (request) => {
 *   // Handler logic
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withCsrfProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const csrfResult = csrfProtection(request);
    if (csrfResult) return csrfResult;

    return handler(request);
  };
}

/**
 * Add CORS headers for cross-origin requests
 *
 * Use with validateOrigin for consistent handling
 */
export function addCorsHeaders(
  response: NextResponse,
  origin: string | null
): NextResponse {
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
  }

  return response;
}
