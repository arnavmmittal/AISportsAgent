/**
 * Individual Alert Rule API
 *
 * GET    /api/coach/alert-rules/[id] - Get a specific rule
 * PATCH  /api/coach/alert-rules/[id] - Update a rule
 * DELETE /api/coach/alert-rules/[id] - Delete a rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { AlertTriggerType, NotificationChannel } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for updating a rule
const UpdateRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  threshold: z.number().optional(),
  thresholdString: z.string().optional(),
  comparisonOp: z.enum(['lt', 'gt', 'eq', 'lte', 'gte', 'contains']).optional(),
  timeWindowDays: z.number().min(1).max(90).optional(),
  minOccurrences: z.number().min(1).max(100).optional(),
  channels: z.array(z.enum(['IN_APP', 'EMAIL', 'SMS'])).min(1).optional(),
  isEnabled: z.boolean().optional(),
});

// GET - Get a specific rule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, response } = await requireCoach(request);
    const { id } = await params;

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rule = await prisma.alertRule.findFirst({
      where: {
        id,
        coachId: user.id,
      },
    });

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ rule });

  } catch (error) {
    console.error('Error fetching alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert rule' },
      { status: 500 }
    );
  }
}

// PATCH - Update a rule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, response } = await requireCoach(request);
    const { id } = await params;

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existingRule = await prisma.alertRule.findFirst({
      where: {
        id,
        coachId: user.id,
      },
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = UpdateRuleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const rule = await prisma.alertRule.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.threshold !== undefined && { threshold: data.threshold }),
        ...(data.thresholdString !== undefined && { thresholdString: data.thresholdString }),
        ...(data.comparisonOp !== undefined && { comparisonOp: data.comparisonOp }),
        ...(data.timeWindowDays !== undefined && { timeWindowDays: data.timeWindowDays }),
        ...(data.minOccurrences !== undefined && { minOccurrences: data.minOccurrences }),
        ...(data.channels && { channels: data.channels as NotificationChannel[] }),
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
      },
    });

    return NextResponse.json({ rule });

  } catch (error) {
    console.error('Error updating alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to update alert rule' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, response } = await requireCoach(request);
    const { id } = await params;

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existingRule = await prisma.alertRule.findFirst({
      where: {
        id,
        coachId: user.id,
      },
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    await prisma.alertRule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert rule' },
      { status: 500 }
    );
  }
}
