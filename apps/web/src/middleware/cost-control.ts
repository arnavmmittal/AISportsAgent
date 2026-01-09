/**
 * Cost Control Middleware
 *
 * Prevents runaway LLM costs by enforcing token budgets and circuit breakers.
 *
 * Features:
 * - Per-tenant daily budget limits ($500/day default)
 * - Token usage tracking in Redis
 * - Circuit breakers when limits exceeded
 * - Warning alerts at 80% threshold
 * - Multi-tenant isolation
 *
 * CRITICAL SECURITY: Prevents financial abuse
 */

import { NextRequest, NextResponse } from 'next/server';

// Configuration
const COST_PER_TOKEN = 0.000002; // $2 per 1M tokens (GPT-4 Turbo rough estimate)
const DAILY_LIMIT_USD = parseFloat(process.env.COST_LIMIT_DAILY || '500');
const MONTHLY_LIMIT_USD = parseFloat(process.env.COST_LIMIT_MONTHLY || '10000');
const WARNING_THRESHOLD = 0.8; // 80% of limit

// Redis client (would be initialized from environment)
// For now, using in-memory Map as fallback
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

interface TokenUsage {
  tokens: number;
  cost: number;
}

interface CostCheckResult {
  allowed: boolean;
  usage: TokenUsage;
  limit: number;
  remaining: number;
  error?: string;
}

/**
 * Get current token usage for a school on a given date
 */
async function getTokenUsage(schoolId: string, date: string): Promise<TokenUsage> {
  // In production, this would use Redis
  // For now, using in-memory store
  const key = `usage:${schoolId}:${date}`;
  const tokens = memoryStore.get(key)?.count || 0;

  return {
    tokens,
    cost: tokens * COST_PER_TOKEN,
  };
}

/**
 * Increment token usage for a school
 */
export async function incrementTokenUsage(
  schoolId: string,
  tokens: number
): Promise<void> {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const key = `usage:${schoolId}:${date}`;

  const current = memoryStore.get(key)?.count || 0;
  const expiresAt = Date.now() + 86400000 * 2; // 48 hours (keep for 2 days)

  memoryStore.set(key, {
    count: current + tokens,
    expiresAt,
  });

  // Cleanup expired entries
  for (const [k, data] of memoryStore.entries()) {
    if (data.expiresAt < Date.now()) {
      memoryStore.delete(k);
    }
  }
}

/**
 * Check if circuit breaker is open for a school
 */
async function isCircuitBreakerOpen(schoolId: string): Promise<boolean> {
  const key = `circuit_breaker:${schoolId}`;
  const breaker = memoryStore.get(key);

  if (!breaker) return false;
  if (breaker.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return false;
  }

  return true;
}

/**
 * Trigger circuit breaker for a school
 */
async function triggerCircuitBreaker(schoolId: string): Promise<void> {
  const key = `circuit_breaker:${schoolId}`;
  const expiresAt = Date.now() + 86400000; // 24 hours

  memoryStore.set(key, {
    count: 1,
    expiresAt,
  });

  console.error(`🚨 CIRCUIT BREAKER ACTIVATED for school ${schoolId}`);
}

/**
 * Check cost limit before processing request
 *
 * @param schoolId - School/tenant ID
 * @param estimatedTokens - Estimated tokens for this request (default: 2000)
 * @returns Result indicating if request is allowed
 */
export async function checkCostLimit(
  schoolId: string,
  estimatedTokens: number = 2000
): Promise<CostCheckResult> {
  // Check circuit breaker first
  if (await isCircuitBreakerOpen(schoolId)) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const usage = await getTokenUsage(schoolId, date);

    return {
      allowed: false,
      usage,
      limit: DAILY_LIMIT_USD,
      remaining: 0,
      error: `Daily budget exceeded ($${usage.cost.toFixed(2)}/$${DAILY_LIMIT_USD}). Resets at midnight UTC.`,
    };
  }

  // Get current usage
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const usage = await getTokenUsage(schoolId, date);

  // Calculate projected cost
  const projectedCost = usage.cost + (estimatedTokens * COST_PER_TOKEN);

  // Check if would exceed limit
  if (projectedCost > DAILY_LIMIT_USD) {
    // Trigger circuit breaker
    await triggerCircuitBreaker(schoolId);

    return {
      allowed: false,
      usage,
      limit: DAILY_LIMIT_USD,
      remaining: 0,
      error: `Daily budget exceeded (projected: $${projectedCost.toFixed(2)}/$${DAILY_LIMIT_USD}). Circuit breaker activated.`,
    };
  }

  // Check if approaching limit (warning)
  if (projectedCost > DAILY_LIMIT_USD * WARNING_THRESHOLD) {
    const percentage = Math.round((projectedCost / DAILY_LIMIT_USD) * 100);
    console.warn(`⚠️  School ${schoolId} at ${percentage}% of daily budget ($${projectedCost.toFixed(2)}/$${DAILY_LIMIT_USD})`);
  }

  return {
    allowed: true,
    usage,
    limit: DAILY_LIMIT_USD,
    remaining: DAILY_LIMIT_USD - projectedCost,
  };
}

/**
 * Middleware to enforce cost limits on API routes
 *
 * Apply to all routes that use LLM APIs:
 * - /api/chat/stream
 * - /api/chat/analyze
 * - /api/summaries/generate
 */
export async function costControlMiddleware(
  request: NextRequest,
  schoolId: string
): Promise<NextResponse | null> {
  // Check if cost limits are enabled
  const enabled = process.env.ENABLE_COST_LIMITS === 'true';
  if (!enabled) {
    console.warn('⚠️  Cost limits disabled (ENABLE_COST_LIMITS=false)');
    return null; // Allow request
  }

  // Check cost limit
  const result = await checkCostLimit(schoolId);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: result.error,
        usage: {
          current: result.usage.cost,
          limit: result.limit,
          remaining: result.remaining,
        },
        retryAfter: '24h', // Next day
      },
      {
        status: 429,
        headers: {
          'X-Cost-Limit': result.limit.toString(),
          'X-Cost-Used': result.usage.cost.toFixed(2),
          'X-Cost-Remaining': result.remaining.toFixed(2),
          'Retry-After': '86400', // 24 hours in seconds
        },
      }
    );
  }

  return null; // Allow request to proceed
}

/**
 * Track actual token usage after LLM response
 *
 * Call this after receiving response from OpenAI/Anthropic
 */
export async function trackTokenUsage(
  schoolId: string,
  tokensUsed: number
): Promise<void> {
  await incrementTokenUsage(schoolId, tokensUsed);

  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const usage = await getTokenUsage(schoolId, date);

  console.log(`📊 Token usage for ${schoolId}: ${usage.tokens.toLocaleString()} tokens ($${usage.cost.toFixed(2)})`);
}

/**
 * Get current usage statistics for a school
 *
 * Useful for admin dashboards and monitoring
 */
export async function getUsageStats(schoolId: string): Promise<{
  daily: TokenUsage;
  percentOfLimit: number;
  circuitBreakerActive: boolean;
}> {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const daily = await getTokenUsage(schoolId, date);
  const circuitBreakerActive = await isCircuitBreakerOpen(schoolId);

  return {
    daily,
    percentOfLimit: (daily.cost / DAILY_LIMIT_USD) * 100,
    circuitBreakerActive,
  };
}
