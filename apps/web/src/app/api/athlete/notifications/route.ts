import { NextRequest, NextResponse } from 'next/server';
// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateNotificationsSchema = z.object({
  pushEnabled: z.boolean().optional(),
  taskReminders: z.boolean().optional(),
  assignmentNotifs: z.boolean().optional(),
  chatMessages: z.boolean().optional(),
  goalMilestones: z.boolean().optional(),
});

// GET /api/athlete/notifications - Get notification settings
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized) return response;

    // Get or create UserSettings
    let settings = await prisma.userSettings.findUnique({
      where: { userId: user!.id },
      select: {
        pushEnabled: true,
        taskReminders: true,
        assignmentNotifs: true,
        chatMessages: true,
        goalMilestones: true,
      },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: user!.id,
          pushEnabled: true,
          taskReminders: true,
          assignmentNotifs: true,
          chatMessages: false,
          goalMilestones: true,
        },
        select: {
          pushEnabled: true,
          taskReminders: true,
          assignmentNotifs: true,
          chatMessages: true,
          goalMilestones: true,
        },
      });
    }

    return NextResponse.json({ notifications: settings });

  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

// PUT /api/athlete/notifications - Update notification settings
export async function PUT(request: NextRequest) {
  return handleUpdate(request);
}

// PATCH /api/athlete/notifications - Update notification settings (partial)
export async function PATCH(request: NextRequest) {
  return handleUpdate(request);
}

async function handleUpdate(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized) return response;

    const body = await request.json();
    const validationResult = updateNotificationsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Update or create settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: user!.id },
      update: data,
      create: {
        userId: user!.id,
        ...data,
      },
      select: {
        pushEnabled: true,
        taskReminders: true,
        assignmentNotifs: true,
        chatMessages: true,
        goalMilestones: true,
      },
    });

    return NextResponse.json({
      notifications: settings,
      message: 'Notification settings updated successfully',
    });

  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
