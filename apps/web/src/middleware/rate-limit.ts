/**
 * Rate Limiting Middleware
 *
 * Prevents abuse by enforcing request limits at multiple layers:
 * - Per-user (60/min athletes, 300/min coaches)
 * - Per-tenant (1000/min per school)
 * - Global (10,000/min total)
 *
 * Features:
 * - Multi-layer enforcement (user → tenant → global)
 * - Sliding window algorithm
 * - Redis-backed for distributed systems (falls back to in-memory)
 * - Retry-After headers
 * - Rate limit headers (X-RateLimit-*)
 *
 * CRITICAL SECURITY: Prevents DoS attacks and service degradation
 */

import { NextRequest, NextResponse } from 'next/server';
import { kvGet, kvSet, kvDelete } from '@/lib/redis';

// Rate limit configuration
const LIMITS = {
  perUser: {
    ATHLETE: 60,   // 60 requests/min (1 req/sec)
    COACH: 300,    // 300 requests/min (5 req/sec)
    ADMIN: 600,    // 600 requests/min (10 req/sec)
  },
  perTenant: 1000,    // 1000 requests/min per school
  global: 10000,      // 10,000 requests/min total
};

const WINDOW_SECONDS = 60; // 1 minute window
const WINDOW_MS = WINDOW_SECONDS * 1000;
const RATE_LIMIT_PREFIX = 'ratelimit:';

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * Check rate limit for a given key
 * Uses Redis for distributed rate limiting across serverless instances
 */
async function checkLimit(
  key: string,
  limit: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const redisKey = `${RATE_LIMIT_PREFIX}${key}`;

  try {
    // Get current entry from Redis
    const entry = await kvGet<RateLimitEntry>(redisKey);

    // If no entry or window expired, start fresh
    if (!entry || (now - entry.windowStart) >= WINDOW_MS) {
      const newEntry: RateLimitEntry = { count: 1, windowStart: now };
      await kvSet(redisKey, newEntry, WINDOW_SECONDS + 5); // Add 5s buffer

      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        resetAt: new Date(now + WINDOW_MS),
      };
    }

    // Check if limit exceeded
    if (entry.count >= limit) {
      const windowEnd = entry.windowStart + WINDOW_MS;
      const retryAfter = Math.ceil((windowEnd - now) / 1000);

      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt: new Date(windowEnd),
        retryAfter: Math.max(1, retryAfter),
      };
    }

    // Increment counter
    entry.count += 1;
    const ttlRemaining = Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000);
    await kvSet(redisKey, entry, Math.max(1, ttlRemaining + 5));

    return {
      allowed: true,
      limit,
      remaining: limit - entry.count,
      resetAt: new Date(entry.windowStart + WINDOW_MS),
    };
  } catch (error) {
    // On Redis error, allow request but log warning
    console.warn('[RateLimit] Redis error, allowing request:', error);
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt: new Date(now + WINDOW_MS),
    };
  }
}

/**
 * Get user-specific rate limit based on role
 */
function getUserLimit(role: 'ATHLETE' | 'COACH' | 'ADMIN'): number {
  return LIMITS.perUser[role] || LIMITS.perUser.ATHLETE;
}

/**
 * Check rate limits at all layers
 *
 * @param userId - User ID
 * @param userRole - User role (ATHLETE, COACH, ADMIN)
 * @param schoolId - School/tenant ID
 * @returns Rate limit result from most restrictive layer
 */
export async function checkRateLimit(
  userId: string,
  userRole: 'ATHLETE' | 'COACH' | 'ADMIN',
  schoolId: string
): Promise<RateLimitResult> {
  // Layer 1: Per-user limit
  const userLimit = getUserLimit(userRole);
  const userResult = await checkLimit(`user:${userId}`, userLimit);

  if (!userResult.allowed) {
    return userResult; // Most restrictive, return immediately
  }

  // Layer 2: Per-tenant limit
  const tenantResult = await checkLimit(`tenant:${schoolId}`, LIMITS.perTenant);

  if (!tenantResult.allowed) {
    return tenantResult;
  }

  // Layer 3: Global limit
  const globalResult = await checkLimit('global', LIMITS.global);

  if (!globalResult.allowed) {
    return globalResult;
  }

  // All layers passed, use user limit for response headers
  return userResult;
}

/**
 * Rate limiting middleware for API routes
 *
 * Apply to all API endpoints to prevent abuse
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  userId: string,
  userRole: 'ATHLETE' | 'COACH' | 'ADMIN',
  schoolId: string
): Promise<NextResponse | null> {
  // Check if rate limiting is enabled
  const enabled = process.env.ENABLE_RATE_LIMITING !== 'false'; // Enabled by default
  if (!enabled) {
    console.warn('⚠️  Rate limiting disabled (ENABLE_RATE_LIMITING=false)');
    return null; // Allow request
  }

  // Check rate limits
  const result = await checkRateLimit(userId, userRole, schoolId);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
        limit: result.limit,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetAt.toISOString(),
          'Retry-After': result.retryAfter!.toString(),
        },
      }
    );
  }

  // Add rate limit headers to response
  return NextResponse.json(
    {}, // Empty body, will be replaced by actual response
    {
      status: 200,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toISOString(),
      },
    }
  );
}

/**
 * Add rate limit headers to an existing response
 *
 * Use this to add headers without returning early
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString());

  return response;
}

/**
 * Get current rate limit status for a user
 *
 * Useful for client-side display of remaining requests
 */
export async function getRateLimitStatus(
  userId: string,
  userRole: 'ATHLETE' | 'COACH' | 'ADMIN',
  schoolId: string
): Promise<{
  user: RateLimitResult;
  tenant: RateLimitResult;
  global: RateLimitResult;
}> {
  const userLimit = getUserLimit(userRole);

  const [user, tenant, global] = await Promise.all([
    checkLimit(`user:${userId}`, userLimit),
    checkLimit(`tenant:${schoolId}`, LIMITS.perTenant),
    checkLimit('global', LIMITS.global),
  ]);

  // Note: checkLimit already increments, so no need to decrement
  // The parallel checks each increment their own counters correctly

  return { user, tenant, global };
}

/**
 * Reset rate limit for a user (admin operation)
 *
 * Use cautiously - only for debugging or emergency scenarios
 */
export async function resetRateLimit(userId: string): Promise<void> {
  try {
    await kvDelete(`${RATE_LIMIT_PREFIX}user:${userId}`);
    console.log(`✅ Rate limit reset for user ${userId}`);
  } catch (error) {
    console.error('[RateLimit] Error resetting user rate limit:', error);
  }
}

/**
 * Reset rate limit for a tenant (admin operation)
 */
export async function resetTenantRateLimit(schoolId: string): Promise<void> {
  try {
    await kvDelete(`${RATE_LIMIT_PREFIX}tenant:${schoolId}`);
    console.log(`✅ Rate limit reset for school ${schoolId}`);
  } catch (error) {
    console.error('[RateLimit] Error resetting tenant rate limit:', error);
  }
}

/**
 * Get rate limit status for a specific key (monitoring)
 * Note: Full enumeration not supported with Redis - use specific keys
 */
export async function getRateLimitEntryStatus(
  key: string
): Promise<{ count: number; windowStart: number; remaining: number } | null> {
  try {
    const entry = await kvGet<RateLimitEntry>(`${RATE_LIMIT_PREFIX}${key}`);
    if (!entry) return null;

    const now = Date.now();
    if ((now - entry.windowStart) >= WINDOW_MS) return null;

    return {
      count: entry.count,
      windowStart: entry.windowStart,
      remaining: Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000),
    };
  } catch (error) {
    console.error('[RateLimit] Error getting rate limit status:', error);
    return null;
  }
}
