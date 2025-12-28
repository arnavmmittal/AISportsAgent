/**
 * Admin Cost Usage Dashboard API
 * Provides system-wide cost statistics and usage analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthFromRequest } from '@/lib/auth-helpers';
import { getSystemCostStats, getUserUsageStats } from '@/lib/cost-tracking';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/cost-usage
 *
 * Returns system-wide cost statistics and per-user usage data
 * Admin-only endpoint
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuthFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Once User model has role field, verify admin role
    // For now, allow all authenticated users to access (development only)
    // const userWithRole = await prisma.user.findUnique({
    //   where: { id: user.id },
    //   select: { role: true },
    // });
    // if (userWithRole?.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Forbidden - Admin access required' },
    //     { status: 403 }
    //   );
    // }

    // Get system-wide statistics
    const systemStats = await getSystemCostStats();

    // Get top users by usage
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const topUsers = await prisma.tokenUsage.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: monthStart,
        },
      },
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          totalTokens: 'desc',
        },
      },
      take: 10,
    });

    // Enrich with user names
    const topUsersWithNames = await Promise.all(
      topUsers.map(async (userUsage) => {
        const user = await prisma.user.findUnique({
          where: { id: userUsage.userId },
          select: { name: true, email: true },
        });

        return {
          userId: userUsage.userId,
          userName: user?.name || 'Unknown',
          userEmail: user?.email || 'unknown@example.com',
          requests: userUsage._count.id,
          tokens: userUsage._sum.totalTokens || 0,
          cost: userUsage._sum.cost || 0,
        };
      })
    );

    // Get daily usage breakdown for the month
    const dailyUsage = await prisma.tokenUsage.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: monthStart,
        },
      },
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _count: {
        id: true,
      },
    });

    // Group by date (ignoring time)
    const dailyUsageByDate = dailyUsage.reduce((acc, record) => {
      const date = record.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          requests: 0,
          tokens: 0,
          cost: 0,
        };
      }
      acc[date].requests += record._count.id;
      acc[date].tokens += record._sum.totalTokens || 0;
      acc[date].cost += record._sum.cost || 0;
      return acc;
    }, {} as Record<string, { date: string; requests: number; tokens: number; cost: number }>);

    const dailyBreakdown = Object.values(dailyUsageByDate).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Get endpoint breakdown
    const endpointUsage = await prisma.tokenUsage.groupBy({
      by: ['endpoint'],
      where: {
        createdAt: {
          gte: monthStart,
        },
      },
      _sum: {
        totalTokens: true,
        cost: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          totalTokens: 'desc',
        },
      },
    });

    const endpointBreakdown = endpointUsage.map((ep) => ({
      endpoint: ep.endpoint,
      requests: ep._count.id,
      tokens: ep._sum.totalTokens || 0,
      cost: ep._sum.cost || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        systemStats,
        topUsers: topUsersWithNames,
        dailyBreakdown,
        endpointBreakdown,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Admin Cost Usage] Error fetching usage data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get detailed usage stats for a specific user
 * Not exported as a route handler - used internally or via query params
 */
async function getUserDetails(userId: string) {
  try {
    const userStats = await getUserUsageStats(userId);

    // Get recent usage history
    const recentUsage = await prisma.tokenUsage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        endpoint: true,
        totalTokens: true,
        cost: true,
        model: true,
      },
    });

    return {
      userId,
      stats: userStats,
      recentUsage,
    };
  } catch (error) {
    console.error(`[Admin Cost Usage] Error fetching user ${userId} details:`, error);
    throw error;
  }
}
