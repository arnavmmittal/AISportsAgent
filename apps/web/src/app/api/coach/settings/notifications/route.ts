/**
 * Coach Notification Settings API
 * Manages notification preferences for coaches
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    // Get or create user settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Return notification settings
    return NextResponse.json({
      settings: {
        pushEnabled: settings.pushEnabled,
        taskReminders: settings.taskReminders,
        goalMilestones: settings.goalMilestones,
        assignmentNotifs: settings.assignmentNotifs,
        chatMessages: settings.chatMessages,
        weeklyEmail: settings.weeklyEmail,
        weeklyEmailDay: settings.weeklyEmailDay,
        weeklyEmailTime: settings.weeklyEmailTime,
      },
    });
  } catch (error) {
    console.error('Notification settings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    const body = await request.json();
    const {
      pushEnabled,
      taskReminders,
      goalMilestones,
      assignmentNotifs,
      chatMessages,
      weeklyEmail,
      weeklyEmailDay,
      weeklyEmailTime,
    } = body;

    // Update settings
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        ...(pushEnabled !== undefined && { pushEnabled }),
        ...(taskReminders !== undefined && { taskReminders }),
        ...(goalMilestones !== undefined && { goalMilestones }),
        ...(assignmentNotifs !== undefined && { assignmentNotifs }),
        ...(chatMessages !== undefined && { chatMessages }),
        ...(weeklyEmail !== undefined && { weeklyEmail }),
        ...(weeklyEmailDay && { weeklyEmailDay }),
        ...(weeklyEmailTime && { weeklyEmailTime }),
      },
      create: {
        userId: user.id,
        pushEnabled: pushEnabled ?? true,
        taskReminders: taskReminders ?? true,
        goalMilestones: goalMilestones ?? true,
        assignmentNotifs: assignmentNotifs ?? true,
        chatMessages: chatMessages ?? false,
        weeklyEmail: weeklyEmail ?? true,
        weeklyEmailDay: weeklyEmailDay ?? 'Sunday',
        weeklyEmailTime: weeklyEmailTime ?? '18:00',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully',
    });
  } catch (error) {
    console.error('Notification settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
