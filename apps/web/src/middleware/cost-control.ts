/**
 * Cost Control Middleware
 *
 * Prevents runaway LLM costs by enforcing token budgets and circuit breakers.
 *
 * Features:
 * - Per-tenant daily budget limits ($500/day default)
 * - Token usage tracking in Redis (shared across instances)
 * - Circuit breakers when limits exceeded
 * - Warning alerts at 80% threshold
 * - Multi-tenant isolation
 *
 * CRITICAL SECURITY: Prevents financial abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import { kvGet, kvSet, kvDelete } from '@/lib/redis';

// Configuration
const COST_PER_TOKEN = 0.000002; // $2 per 1M tokens (GPT-4 Turbo rough estimate)
const DAILY_LIMIT_USD = parseFloat(process.env.COST_LIMIT_DAILY || '500');
const MONTHLY_LIMIT_USD = parseFloat(process.env.COST_LIMIT_MONTHLY || '10000');
const WARNING_THRESHOLD = 0.8; // 80% of limit

// Cache prefixes
const USAGE_PREFIX = 'cost:usage:';
const CIRCUIT_BREAKER_PREFIX = 'cost:breaker:';

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
 * Uses Redis for shared state across serverless instances
 */
async function getTokenUsage(schoolId: string, date: string): Promise<TokenUsage> {
  const key = `${USAGE_PREFIX}${schoolId}:${date}`;

  try {
    const data = await kvGet<{ count: number }>(key);
    const tokens = data?.count || 0;
    return {
      tokens,
      cost: tokens * COST_PER_TOKEN,
    };
  } catch (error) {
    console.error('[CostControl] Error getting token usage:', error);
    return { tokens: 0, cost: 0 };
  }
}

/**
 * Increment token usage for a school
 * Uses Redis for shared state across serverless instances
 */
export async function incrementTokenUsage(
  schoolId: string,
  tokens: number
): Promise<void> {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const key = `${USAGE_PREFIX}${schoolId}:${date}`;

  try {
    const current = await kvGet<{ count: number }>(key);
    const newCount = (current?.count || 0) + tokens;
    // Set with 48-hour TTL (auto-cleanup)
    await kvSet(key, { count: newCount }, 172800);
  } catch (error) {
    console.error('[CostControl] Error incrementing token usage:', error);
  }
}

/**
 * Check if circuit breaker is open for a school
 * Uses Redis for shared state across serverless instances
 */
async function isCircuitBreakerOpen(schoolId: string): Promise<boolean> {
  const key = `${CIRCUIT_BREAKER_PREFIX}${schoolId}`;

  try {
    const breaker = await kvGet<{ active: boolean }>(key);
    return breaker?.active === true;
  } catch (error) {
    console.error('[CostControl] Error checking circuit breaker:', error);
    return false;
  }
}

/**
 * Trigger circuit breaker for a school
 * Uses Redis for shared state across serverless instances
 */
async function triggerCircuitBreaker(schoolId: string): Promise<void> {
  const key = `${CIRCUIT_BREAKER_PREFIX}${schoolId}`;

  try {
    // Set circuit breaker with 24-hour TTL
    await kvSet(key, { active: true, triggeredAt: Date.now() }, 86400);
    console.error(`🚨 CIRCUIT BREAKER ACTIVATED for school ${schoolId}`);
  } catch (error) {
    console.error('[CostControl] Error triggering circuit breaker:', error);
  }
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
