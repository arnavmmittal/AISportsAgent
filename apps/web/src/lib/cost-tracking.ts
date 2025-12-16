import prisma from '@/lib/prisma-client';

/**
 * Cost Controls Configuration
 *
 * These limits prevent runaway OpenAI costs and ensure sustainable usage.
 */
const DAILY_MESSAGE_LIMIT_PER_USER = parseInt(process.env.COST_LIMIT_DAILY_PER_USER || '20');
const MONTHLY_TOKEN_LIMIT_TOTAL = parseInt(process.env.COST_LIMIT_MONTHLY_TOTAL || '2000');

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

  const monthlyTokens = monthlyUsage._sum.totalTokens || 0;
  const monthlyBudget = monthlyUsage._sum.cost || 0;

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
