import { prisma } from '@/lib/prisma';

/**
 * Cost Controls Configuration
 *
 * These limits prevent runaway OpenAI costs and ensure sustainable usage.
 *
 * PRODUCTION REQUIREMENTS:
 * - Per-tenant (school) daily limits: $500/day
 * - Circuit breaker triggers at limit
 * - Monthly budget: $10,000 total across all schools
 */
const DAILY_MESSAGE_LIMIT_PER_USER = parseInt(process.env.COST_LIMIT_DAILY_PER_USER || '20');
const MONTHLY_TOKEN_LIMIT_TOTAL = parseInt(process.env.COST_LIMIT_MONTHLY_TOTAL || '2000');

// Production cost limits (USD)
const COST_LIMIT_DAILY_PER_SCHOOL = parseFloat(process.env.COST_LIMIT_DAILY_PER_SCHOOL || '500'); // $500/day per school
const COST_LIMIT_MONTHLY_TOTAL = parseFloat(process.env.COST_LIMIT_MONTHLY_TOTAL || '10000'); // $10K/month total
const CIRCUIT_BREAKER_THRESHOLD = parseFloat(process.env.CIRCUIT_BREAKER_THRESHOLD || '500'); // $500 triggers circuit breaker

// Cost controls must be enabled in production
const ENABLE_COST_LIMITS = process.env.ENABLE_COST_LIMITS !== 'false';

// OpenAI pricing (as of Dec 2024) - GPT-4 Turbo
// https://openai.com/pricing
const COST_PER_1K_PROMPT_TOKENS = 0.01; // $0.01 per 1K prompt tokens
const COST_PER_1K_COMPLETION_TOKENS = 0.03; // $0.03 per 1K completion tokens

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: {
    dailyMessages: number;
    monthlyTokens: number;
    monthlyBudget: number; // USD
  };
}

export interface TokenUsageData {
  userId: string;
  sessionId?: string;
  promptTokens: number;
  completionTokens: number;
  model?: string;
  endpoint: string;
}

/**
 * Check if user can make a new AI request
 *
 * Checks:
 * 1. Daily message limit (20 messages/day per user)
 * 2. Monthly token budget (total across all users)
 *
 * @param userId - User ID to check limits for
 * @returns UsageCheckResult indicating if request is allowed
 */
export async function checkUserCanMakeRequest(userId: string): Promise<UsageCheckResult> {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Check daily message limit
    const dailyCount = await prisma.tokenUsage.count({
      where: {
        userId,
        createdAt: {
          gte: todayStart,
        },
      },
    });

    if (dailyCount >= DAILY_MESSAGE_LIMIT_PER_USER) {
      return {
        allowed: false,
        reason: `Daily message limit reached (${DAILY_MESSAGE_LIMIT_PER_USER} messages/day). Try again tomorrow.`,
        currentUsage: {
          dailyMessages: dailyCount,
          monthlyTokens: 0,
          monthlyBudget: 0,
        },
      };
    }

    // Check monthly token budget
    const monthlyUsage = await prisma.tokenUsage.aggregate({
      where: {
        createdAt: {
          gte: monthStart,
        },
      },
      _sum: {
        totalTokens: true,
        cost: true,
      },
    });

    const monthlyTokens = monthlyUsage?._sum?.totalTokens || 0;
    const monthlyBudget = monthlyUsage?._sum?.cost || 0;

    if (monthlyTokens >= MONTHLY_TOKEN_LIMIT_TOTAL) {
      return {
        allowed: false,
        reason: 'Monthly token budget exceeded. Please contact administrator.',
        currentUsage: {
          dailyMessages: dailyCount,
          monthlyTokens,
          monthlyBudget,
        },
      };
    }

    // Check if approaching limit (80% threshold)
    const budgetPercentage = (monthlyTokens / MONTHLY_TOKEN_LIMIT_TOTAL) * 100;
    if (budgetPercentage >= 80) {
      console.warn(`[Cost Control] WARNING: Monthly budget at ${budgetPercentage.toFixed(1)}% (${monthlyTokens}/${MONTHLY_TOKEN_LIMIT_TOTAL} tokens, $${monthlyBudget.toFixed(2)})`);
    }

    return {
      allowed: true,
      currentUsage: {
        dailyMessages: dailyCount,
        monthlyTokens,
        monthlyBudget,
      },
    };
  } catch (error) {
    console.error('Error checking user request limits:', error);
    // Allow request on error to avoid blocking users
    return {
      allowed: true,
      currentUsage: {
        dailyMessages: 0,
        monthlyTokens: 0,
        monthlyBudget: 0,
      },
    };
  }
}

/**
 * Check school (tenant) cost limit and circuit breaker status
 *
 * CRITICAL FOR PRODUCTION:
 * - Prevents runaway costs per school ($500/day limit)
 * - Circuit breaker auto-triggers at threshold
 * - Blocks ALL requests for school when limit exceeded
 *
 * @param schoolId - School ID to check limits for
 * @returns UsageCheckResult indicating if request is allowed
 */
export async function checkSchoolCostLimit(schoolId: string): Promise<UsageCheckResult> {
  try {
    // Cost limits can be disabled for development
    if (!ENABLE_COST_LIMITS) {
      return { allowed: true };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get user IDs for this school
    const users = await prisma.user.findMany({
      where: { schoolId },
      select: { id: true },
    });
    const userIds = users.map(u => u.id);

    // Get today's cost for this school
    const dailyUsage = await prisma.tokenUsage.aggregate({
      where: {
        userId: {
          in: userIds,
        },
        createdAt: {
          gte: todayStart,
        },
      },
      _sum: {
        cost: true,
        totalTokens: true,
      },
      _count: true,
    });

    const dailyCost = dailyUsage?._sum?.cost || 0;
    const dailyTokens = dailyUsage?._sum?.totalTokens || 0;
    const dailyRequests = dailyUsage?._count || 0;

    // Circuit breaker: Block if daily cost exceeds threshold
    if (dailyCost >= CIRCUIT_BREAKER_THRESHOLD) {
      console.error(
        `[CIRCUIT BREAKER] School ${schoolId} BLOCKED - Daily cost: $${dailyCost.toFixed(2)} >= $${CIRCUIT_BREAKER_THRESHOLD}`
      );

      return {
        allowed: false,
        reason: `Daily budget exceeded ($${CIRCUIT_BREAKER_THRESHOLD}/day). Service will resume at midnight UTC.`,
        currentUsage: {
          dailyMessages: dailyRequests,
          monthlyTokens: dailyTokens,
          monthlyBudget: dailyCost,
        },
      };
    }

    // Warning at 80% of daily limit
    const costPercentage = (dailyCost / COST_LIMIT_DAILY_PER_SCHOOL) * 100;
    if (costPercentage >= 80) {
      console.warn(
        `[Cost Control] WARNING: School ${schoolId} at ${costPercentage.toFixed(1)}% of daily budget ($${dailyCost.toFixed(2)}/$${COST_LIMIT_DAILY_PER_SCHOOL})`
      );
    }

    // Check monthly global limit
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyUsage = await prisma.tokenUsage.aggregate({
      where: {
        createdAt: {
          gte: monthStart,
        },
      },
      _sum: {
        cost: true,
      },
    });

    const monthlyCost = monthlyUsage?._sum?.cost || 0;
    if (monthlyCost >= COST_LIMIT_MONTHLY_TOTAL) {
      console.error(
        `[CIRCUIT BREAKER] GLOBAL LIMIT - Monthly cost: $${monthlyCost.toFixed(2)} >= $${COST_LIMIT_MONTHLY_TOTAL}`
      );

      return {
        allowed: false,
        reason: 'Monthly system budget exceeded. Please contact administrator.',
        currentUsage: {
          dailyMessages: dailyRequests,
          monthlyTokens: dailyTokens,
          monthlyBudget: monthlyCost,
        },
      };
    }

    return {
      allowed: true,
      currentUsage: {
        dailyMessages: dailyRequests,
        monthlyTokens: dailyTokens,
        monthlyBudget: dailyCost,
      },
    };
  } catch (error) {
    console.error('[Cost Control] Error checking school cost limit:', error);

    // CRITICAL: In production, BLOCK on error (fail-safe)
    // In development, ALLOW on error (fail-open for testing)
    const allowOnError = process.env.NODE_ENV !== 'production';

    return {
      allowed: allowOnError,
      reason: allowOnError ? undefined : 'Cost tracking error - request blocked for safety',
      currentUsage: {
        dailyMessages: 0,
        monthlyTokens: 0,
        monthlyBudget: 0,
      },
    };
  }
}

/**
 * Log token usage to database
 *
 * Calculates cost based on OpenAI pricing and stores usage data.
 * This data is used for:
 * - Daily/monthly limit enforcement
 * - Cost monitoring and alerts
 * - Usage analytics
 *
 * @param usage - Token usage data from AI response
 */
export async function logTokenUsage(usage: TokenUsageData): Promise<void> {
  const { userId, sessionId, promptTokens, completionTokens, model, endpoint } = usage;

  const totalTokens = promptTokens + completionTokens;

  // Calculate cost in USD
  const promptCost = (promptTokens / 1000) * COST_PER_1K_PROMPT_TOKENS;
  const completionCost = (completionTokens / 1000) * COST_PER_1K_COMPLETION_TOKENS;
  const totalCost = promptCost + completionCost;

  await prisma.tokenUsage.create({
    data: {
      userId,
      sessionId,
      promptTokens,
      completionTokens,
      totalTokens,
      cost: totalCost,
      model: model || 'gpt-4-turbo',
      endpoint,
    },
  });

  console.log(`[Cost Tracking] User ${userId}: ${totalTokens} tokens, $${totalCost.toFixed(4)}`);
}

/**
 * Get user's current usage stats
 *
 * @param userId - User ID to get stats for
 * @returns Usage statistics for today and this month
 */
export async function getUserUsageStats(userId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dailyStats, monthlyStats] = await Promise.all([
    prisma.tokenUsage.aggregate({
      where: {
        userId,
        createdAt: {
          gte: todayStart,
        },
      },
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _count: true,
    }),
    prisma.tokenUsage.aggregate({
      where: {
        userId,
        createdAt: {
          gte: monthStart,
        },
      },
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _count: true,
    }),
  ]);

  return {
    today: {
      messages: dailyStats._count,
      tokens: dailyStats._sum.totalTokens || 0,
      cost: dailyStats._sum.cost || 0,
      remaining: DAILY_MESSAGE_LIMIT_PER_USER - dailyStats._count,
    },
    thisMonth: {
      messages: monthlyStats._count,
      tokens: monthlyStats._sum.totalTokens || 0,
      cost: monthlyStats._sum.cost || 0,
    },
    limits: {
      dailyMessages: DAILY_MESSAGE_LIMIT_PER_USER,
      monthlyTokens: MONTHLY_TOKEN_LIMIT_TOTAL,
    },
  };
}

/**
 * Get system-wide cost statistics
 *
 * Admin-only function to monitor total costs across all users.
 *
 * @returns System-wide usage statistics
 */
export async function getSystemCostStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyStats = await prisma.tokenUsage.aggregate({
    where: {
      createdAt: {
        gte: monthStart,
      },
    },
    _sum: {
      totalTokens: true,
      cost: true,
    },
    _count: true,
  });

  const totalTokens = monthlyStats._sum.totalTokens || 0;
  const totalCost = monthlyStats._sum.cost || 0;
  const budgetPercentage = (totalTokens / MONTHLY_TOKEN_LIMIT_TOTAL) * 100;

  return {
    thisMonth: {
      requests: monthlyStats._count,
      tokens: totalTokens,
      cost: totalCost,
      budgetUsed: budgetPercentage,
    },
    limits: {
      monthlyTokens: MONTHLY_TOKEN_LIMIT_TOTAL,
      estimatedMonthlyCost: (MONTHLY_TOKEN_LIMIT_TOTAL / 1000) * (COST_PER_1K_PROMPT_TOKENS + COST_PER_1K_COMPLETION_TOKENS) / 2,
    },
    alerts: {
      approachingLimit: budgetPercentage >= 80,
      exceeded: budgetPercentage >= 100,
    },
  };
}
