/**
 * Alert Rules API
 *
 * CRUD operations for coach-defined alert rules.
 * Rules are evaluated by a scheduled job or on-demand to generate alerts.
 *
 * GET  /api/coach/alert-rules - List all rules for the coach
 * POST /api/coach/alert-rules - Create a new rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { AlertTriggerType, NotificationChannel } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema for creating a rule
const CreateRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  triggerType: z.enum([
    'READINESS_DROP',
    'READINESS_DECLINE',
    'INACTIVITY',
    'CHAT_INACTIVITY',
    'SENTIMENT_DECLINE',
    'THEME_MENTION',
    'MULTIPLE_ATHLETES',
    'FORECAST_DECLINE',
    'MISSED_CHECKINS',
  ]),
  threshold: z.number().optional(),
  thresholdString: z.string().optional(),
  comparisonOp: z.enum(['lt', 'gt', 'eq', 'lte', 'gte', 'contains']).optional(),
  timeWindowDays: z.number().min(1).max(90).optional(),
  minOccurrences: z.number().min(1).max(100).optional(),
  channels: z.array(z.enum(['IN_APP', 'EMAIL', 'SMS'])).min(1),
  isEnabled: z.boolean().optional().default(true),
});

// GET - List all alert rules for the coach
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rules = await prisma.alertRule.findMany({
      where: { coachId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Get recent trigger counts
    const rulesWithStats = rules.map(rule => ({
      ...rule,
      channels: rule.channels as NotificationChannel[],
    }));

    return NextResponse.json({ rules: rulesWithStats });

  } catch (error) {
    console.error('Error fetching alert rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert rules' },
      { status: 500 }
    );
  }
}

// POST - Create a new alert rule
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = CreateRuleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate trigger-specific requirements
    if (data.triggerType === 'THEME_MENTION' && !data.thresholdString) {
      return NextResponse.json(
        { error: 'Theme mention rule requires a topic name (thresholdString)' },
        { status: 400 }
      );
    }

    if (['READINESS_DROP', 'SENTIMENT_DECLINE'].includes(data.triggerType) && data.threshold === undefined) {
      return NextResponse.json(
        { error: 'This rule type requires a threshold value' },
        { status: 400 }
      );
    }

    // Count existing rules (limit to prevent abuse)
    const existingCount = await prisma.alertRule.count({
      where: { coachId: user.id },
    });

    if (existingCount >= 20) {
      return NextResponse.json(
        { error: 'Maximum of 20 alert rules allowed' },
        { status: 400 }
      );
    }

    // Create the rule
    const rule = await prisma.alertRule.create({
      data: {
        coachId: user.id,
        name: data.name,
        description: data.description,
        triggerType: data.triggerType as AlertTriggerType,
        threshold: data.threshold,
        thresholdString: data.thresholdString,
        comparisonOp: data.comparisonOp,
        timeWindowDays: data.timeWindowDays,
        minOccurrences: data.minOccurrences,
        channels: data.channels as NotificationChannel[],
        isEnabled: data.isEnabled,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });

  } catch (error) {
    console.error('Error creating alert rule:', error);
    return NextResponse.json(
      { error: 'Failed to create alert rule' },
      { status: 500 }
    );
  }
}
