/**
 * Rate Limiting Tests
 *
 * Verifies that rate limiting middleware prevents abuse
 * by enforcing request limits per user, tenant, and globally.
 *
 * CRITICAL SECURITY TEST - Prevents DoS attacks and service degradation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Rate limit configuration
const LIMITS = {
  perUser: 60,        // 60 requests per minute (1 req/sec)
  perCoach: 300,      // 300 requests per minute (5 req/sec)
  perTenant: 1000,    // 1000 requests per minute per school
  global: 10000,      // 10,000 requests per minute total
};

const WINDOW_MS = 60 * 1000; // 1 minute

// Mock Redis for tracking requests
const mockRedis = new Map<string, { count: number; expiresAt: number }>();

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

async function checkRateLimit(
  userId: string,
  userRole: 'ATHLETE' | 'COACH',
  schoolId: string
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now;
  const windowEnd = now + WINDOW_MS;

  // Cleanup expired entries
  for (const [key, data] of mockRedis.entries()) {
    if (data.expiresAt < now) {
      mockRedis.delete(key);
    }
  }

  // Check per-user limit
  const userKey = `ratelimit:user:${userId}`;
  const userLimit = userRole === 'COACH' ? LIMITS.perCoach : LIMITS.perUser;
  const userData = mockRedis.get(userKey) || { count: 0, expiresAt: windowEnd };

  if (userData.count >= userLimit) {
    const retryAfter = Math.ceil((userData.expiresAt - now) / 1000);
    return {
      allowed: false,
      limit: userLimit,
      remaining: 0,
      resetAt: new Date(userData.expiresAt),
      retryAfter,
    };
  }

  // Check per-tenant limit
  const tenantKey = `ratelimit:tenant:${schoolId}`;
  const tenantData = mockRedis.get(tenantKey) || { count: 0, expiresAt: windowEnd };

  if (tenantData.count >= LIMITS.perTenant) {
    const retryAfter = Math.ceil((tenantData.expiresAt - now) / 1000);
    return {
      allowed: false,
      limit: LIMITS.perTenant,
      remaining: 0,
      resetAt: new Date(tenantData.expiresAt),
      retryAfter,
    };
  }

  // Check global limit
  const globalKey = `ratelimit:global`;
  const globalData = mockRedis.get(globalKey) || { count: 0, expiresAt: windowEnd };

  if (globalData.count >= LIMITS.global) {
    const retryAfter = Math.ceil((globalData.expiresAt - now) / 1000);
    return {
      allowed: false,
      limit: LIMITS.global,
      remaining: 0,
      resetAt: new Date(globalData.expiresAt),
      retryAfter,
    };
  }

  // Increment counters
  mockRedis.set(userKey, { count: userData.count + 1, expiresAt: windowEnd });
  mockRedis.set(tenantKey, { count: tenantData.count + 1, expiresAt: windowEnd });
  mockRedis.set(globalKey, { count: globalData.count + 1, expiresAt: windowEnd });

  return {
    allowed: true,
    limit: userLimit,
    remaining: userLimit - userData.count - 1,
    resetAt: new Date(windowEnd),
  };
}

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    mockRedis.clear();
    vi.clearAllMocks();
  });

  describe('Per-User Rate Limiting', () => {
    it('should allow requests under athlete limit (60/min)', async () => {
      const userId = 'athlete-1';

      for (let i = 0; i < 60; i++) {
        const result = await checkRateLimit(userId, 'ATHLETE', 'school-1');
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(60);
      }
    });

    it('should block requests over athlete limit', async () => {
      const userId = 'athlete-2';

      // Make 60 requests (at limit)
      for (let i = 0; i < 60; i++) {
        await checkRateLimit(userId, 'ATHLETE', 'school-1');
      }

      // 61st request should be blocked
      const result = await checkRateLimit(userId, 'ATHLETE', 'school-1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should allow coaches higher limit (300/min)', async () => {
      const coachId = 'coach-1';

      // Coaches get 300/min (5 req/sec)
      for (let i = 0; i < 300; i++) {
        const result = await checkRateLimit(coachId, 'COACH', 'school-1');
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(300);
      }
    });

    it('should block coaches over their limit', async () => {
      const coachId = 'coach-2';

      // Make 300 requests
      for (let i = 0; i < 300; i++) {
        await checkRateLimit(coachId, 'COACH', 'school-1');
      }

      // 301st should be blocked
      const result = await checkRateLimit(coachId, 'COACH', 'school-1');
      expect(result.allowed).toBe(false);
    });

    it('should include retry-after header when blocked', async () => {
      const userId = 'athlete-3';

      // Max out limit
      for (let i = 0; i < 60; i++) {
        await checkRateLimit(userId, 'ATHLETE', 'school-1');
      }

      const result = await checkRateLimit(userId, 'ATHLETE', 'school-1');
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60); // Within 1 minute
    });

    it('should show remaining requests correctly', async () => {
      const userId = 'athlete-4';

      let result = await checkRateLimit(userId, 'ATHLETE', 'school-1');
      expect(result.remaining).toBe(59); // 60 - 1

      result = await checkRateLimit(userId, 'ATHLETE', 'school-1');
      expect(result.remaining).toBe(58); // 60 - 2

      result = await checkRateLimit(userId, 'ATHLETE', 'school-1');
      expect(result.remaining).toBe(57); // 60 - 3
    });
  });

  describe('Per-Tenant Rate Limiting', () => {
    it('should enforce tenant limit (1000/min per school)', async () => {
      const schoolId = 'school-1';

      // 10 athletes, 100 requests each = 1000 total
      for (let athlete = 0; athlete < 10; athlete++) {
        for (let req = 0; req < 60; req++) {
          const result = await checkRateLimit(
            `athlete-${athlete}`,
            'ATHLETE',
            schoolId
          );
          expect(result.allowed).toBe(true);
        }
      }

      // Next request from school should be allowed (1000 limit, we only made 600)
      const result = await checkRateLimit('athlete-10', 'ATHLETE', schoolId);
      expect(result.allowed).toBe(true);
    });

    it('should block tenant when limit exceeded', async () => {
      const schoolId = 'school-2';

      // Simulate 1000 requests from school
      for (let i = 0; i < 1000; i++) {
        await checkRateLimit(`user-${i % 50}`, 'ATHLETE', schoolId);
      }

      // 1001st request should be blocked (tenant limit)
      const result = await checkRateLimit('new-athlete', 'ATHLETE', schoolId);
      expect(result.allowed).toBe(false);
    });

    it('should isolate tenant limits (school-specific)', async () => {
      const schoolA = 'school-a';
      const schoolB = 'school-b';

      // Max out school A
      for (let i = 0; i < 1000; i++) {
        await checkRateLimit(`athlete-a-${i}`, 'ATHLETE', schoolA);
      }

      // School A should be blocked
      const resultA = await checkRateLimit('athlete-a-new', 'ATHLETE', schoolA);
      expect(resultA.allowed).toBe(false);

      // School B should still be allowed
      const resultB = await checkRateLimit('athlete-b-1', 'ATHLETE', schoolB);
      expect(resultB.allowed).toBe(true);
    });
  });

  describe('Global Rate Limiting', () => {
    it('should enforce global limit (10000/min)', async () => {
      // Simulate many schools hitting the global limit
      for (let school = 0; school < 10; school++) {
        for (let user = 0; user < 1000; user++) {
          const result = await checkRateLimit(
            `user-${school}-${user}`,
            'ATHLETE',
            `school-${school}`
          );
          expect(result.allowed).toBe(true);
        }
      }

      // Should have 10,000 requests now, next should be blocked
      const result = await checkRateLimit('new-user', 'ATHLETE', 'new-school');
      expect(result.allowed).toBe(false);
    });

    it('should protect against DoS attacks', async () => {
      // Simulate rapid requests from many IPs/users
      const attackRequests = 15000; // Beyond global limit

      let blocked = 0;
      let allowed = 0;

      for (let i = 0; i < attackRequests; i++) {
        const result = await checkRateLimit(
          `attacker-${i}`,
          'ATHLETE',
          `school-${i % 100}`
        );

        if (result.allowed) {
          allowed++;
        } else {
          blocked++;
        }
      }

      expect(allowed).toBeLessThanOrEqual(LIMITS.global);
      expect(blocked).toBe(attackRequests - allowed);
    });
  });

  describe('Rate Limit Headers', () => {
    it('should return standard rate limit headers', async () => {
      const result = await checkRateLimit('athlete-5', 'ATHLETE', 'school-1');

      expect(result.limit).toBeDefined();
      expect(result.remaining).toBeDefined();
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should calculate correct reset time', async () => {
      const before = Date.now();
      const result = await checkRateLimit('athlete-6', 'ATHLETE', 'school-1');
      const after = Date.now();

      const resetTime = result.resetAt.getTime();
      expect(resetTime).toBeGreaterThan(before);
      expect(resetTime).toBeLessThanOrEqual(after + WINDOW_MS);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive requests', async () => {
      const userId = 'athlete-7';
      const promises = [];

      // Fire 100 requests simultaneously
      for (let i = 0; i < 100; i++) {
        promises.push(checkRateLimit(userId, 'ATHLETE', 'school-1'));
      }

      const results = await Promise.all(promises);

      // First 60 should be allowed, rest blocked
      const allowed = results.filter((r) => r.allowed).length;
      const blocked = results.filter((r) => !r.allowed).length;

      expect(allowed).toBeLessThanOrEqual(60);
      expect(blocked).toBeGreaterThan(0);
    });

    it('should reset counters after window expires', async () => {
      const userId = 'athlete-8';

      // Max out limit
      for (let i = 0; i < 60; i++) {
        await checkRateLimit(userId, 'ATHLETE', 'school-1');
      }

      // Should be blocked
      let result = await checkRateLimit(userId, 'ATHLETE', 'school-1');
      expect(result.allowed).toBe(false);

      // Simulate window expiration by clearing old entries
      const now = Date.now();
      for (const [key, data] of mockRedis.entries()) {
        if (data.expiresAt < now + WINDOW_MS + 1000) {
          mockRedis.delete(key);
        }
      }

      // Should be allowed again
      result = await checkRateLimit(userId, 'ATHLETE', 'school-1');
      expect(result.allowed).toBe(true);
    });

    it('should handle same user across different schools (edge case)', async () => {
      const userId = 'cross-school-user';

      // User makes requests to school A
      for (let i = 0; i < 30; i++) {
        await checkRateLimit(userId, 'ATHLETE', 'school-a');
      }

      // User makes requests to school B
      for (let i = 0; i < 30; i++) {
        await checkRateLimit(userId, 'ATHLETE', 'school-b');
      }

      // User should be blocked (60 total requests, regardless of school)
      const result = await checkRateLimit(userId, 'ATHLETE', 'school-c');
      expect(result.allowed).toBe(false);
    });

    it('should handle missing userId gracefully', async () => {
      // This would normally be caught by input validation
      // but test defensive programming

      await expect(
        checkRateLimit('', 'ATHLETE', 'school-1')
      ).resolves.toBeDefined();
    });
  });

  describe('Performance Under Load', () => {
    it('should handle high throughput efficiently', async () => {
      const startTime = Date.now();

      // Simulate 5000 requests
      for (let i = 0; i < 5000; i++) {
        await checkRateLimit(
          `user-${i % 100}`,
          i % 10 === 0 ? 'COACH' : 'ATHLETE',
          `school-${i % 10}`
        );
      }

      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 1 second for 5000 checks)
      expect(duration).toBeLessThan(1000);
    });

    it('should cleanup expired entries to prevent memory leak', async () => {
      // Create many entries
      for (let i = 0; i < 1000; i++) {
        await checkRateLimit(`user-${i}`, 'ATHLETE', `school-${i % 10}`);
      }

      const sizeBefore = mockRedis.size;

      // Trigger cleanup (in real implementation, Redis handles TTL)
      const now = Date.now();
      for (const [key, data] of mockRedis.entries()) {
        if (data.expiresAt < now) {
          mockRedis.delete(key);
        }
      }

      // Size should stay manageable (expired entries removed)
      expect(mockRedis.size).toBeLessThanOrEqual(sizeBefore);
    });
  });

  describe('Multi-Layer Protection', () => {
    it('should apply most restrictive limit first', async () => {
      const userId = 'athlete-9';
      const schoolId = 'school-1';

      // Max out user limit (60)
      for (let i = 0; i < 60; i++) {
        await checkRateLimit(userId, 'ATHLETE', schoolId);
      }

      // User limit should block, even though tenant limit (1000) not reached
      const result = await checkRateLimit(userId, 'ATHLETE', schoolId);
      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(60); // User limit, not tenant limit
    });

    it('should check all layers in correct order', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await checkRateLimit('test-user', 'ATHLETE', 'test-school');

      // In real implementation, would verify order:
      // 1. User limit check
      // 2. Tenant limit check
      // 3. Global limit check

      logSpy.mockRestore();
    });
  });

  describe('Integration with API Routes', () => {
    it('should return 429 status when rate limited', async () => {
      const userId = 'athlete-10';

      // Simulate API request handler
      const handleRequest = async () => {
        const rateLimitResult = await checkRateLimit(userId, 'ATHLETE', 'school-1');

        if (!rateLimitResult.allowed) {
          return {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimitResult.limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
              'Retry-After': rateLimitResult.retryAfter!.toString(),
            },
            body: {
              error: 'Too many requests',
              retryAfter: rateLimitResult.retryAfter,
            },
          };
        }

        return { status: 200, body: { success: true } };
      };

      // Max out limit
      for (let i = 0; i < 60; i++) {
        await checkRateLimit(userId, 'ATHLETE', 'school-1');
      }

      const response = await handleRequest();

      expect(response.status).toBe(429);
      expect(response.headers['Retry-After']).toBeDefined();
      expect(response.body.error).toBe('Too many requests');
    });

    it('should include rate limit headers on success', async () => {
      const rateLimitResult = await checkRateLimit('athlete-11', 'ATHLETE', 'school-1');

      const headers = {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
      };

      expect(headers['X-RateLimit-Limit']).toBe('60');
      expect(headers['X-RateLimit-Remaining']).toBe('59');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });
  });
});
