/**
 * Admin Dashboard API
 * System-wide statistics and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    // Only admins can access
    if (user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get system-wide statistics
    const [
      totalUsers,
      totalAthletes,
      totalCoaches,
      totalSchools,
      totalGoals,
      totalMoodLogs,
      activeCrisisAlerts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.athlete.count(),
      prisma.coach.count(),
      prisma.school.count(),
      prisma.goal.count(),
      prisma.moodLog.count(),
      prisma.crisisAlert.count({ where: { resolved: false } }),
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [newUsers, newGoals, newMoodLogs] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.goal.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.moodLog.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    // Get schools with athlete counts
    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: {
            users: {
              where: { role: 'ATHLETE' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Get recent crisis alerts
    const recentCrisisAlerts = await prisma.crisisAlert.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        athlete: {
          select: {
            id: true,
            name: true,
            school: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // User growth by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
    });

    // Top sports by athlete count
    const topSports = await prisma.athlete.groupBy({
      by: ['sport'],
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalAthletes,
          totalCoaches,
          totalSchools,
          totalGoals,
          totalMoodLogs,
          activeCrisisAlerts,
        },
        recentActivity: {
          newUsers,
          newGoals,
          newMoodLogs,
          timeRange: 30,
        },
        schools: schools.map((s) => ({
          id: s.id,
          name: s.name,
          division: s.division,
          athleteCount: s._count.users,
        })),
        usersByRole,
        topSports,
        recentCrisisAlerts,
      },
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
