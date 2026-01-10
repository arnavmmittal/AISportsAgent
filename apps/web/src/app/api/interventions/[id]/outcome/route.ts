/**
 * Intervention Outcome API
 * Record the outcome/effectiveness of an intervention
 *
 * POST - Record an outcome for an intervention
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, verifyOwnership } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema
const recordOutcomeSchema = z.object({
  performanceOutcomeId: z.string().cuid().optional(),
  moodChange: z.number().min(-10).max(10).optional(),
  confidenceChange: z.number().min(-10).max(10).optional(),
  stressChange: z.number().min(-10).max(10).optional(),
  focusChange: z.number().min(-10).max(10).optional(),
  performanceChange: z.number().optional(),
  measuredAt: z.string().datetime(),
  hoursAfterIntervention: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized || !user) return response;

    const { id: interventionId } = await params;

    // Get the intervention
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
    });

    if (!intervention) {
      return NextResponse.json({ error: 'Intervention not found' }, { status: 404 });
    }

    // Verify ownership (athletes can only record outcomes for their own interventions)
    if (user.role === 'ATHLETE' && !verifyOwnership(user, intervention.athleteId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = recordOutcomeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Calculate hours after intervention if not provided
    const measuredAt = new Date(data.measuredAt);
    const hoursAfter =
      data.hoursAfterIntervention ??
      (measuredAt.getTime() - intervention.performedAt.getTime()) / (1000 * 60 * 60);

    // Create the outcome
    const outcome = await prisma.interventionOutcome.create({
      data: {
        interventionId,
        performanceOutcomeId: data.performanceOutcomeId,
        moodChange: data.moodChange,
        confidenceChange: data.confidenceChange,
        stressChange: data.stressChange,
        focusChange: data.focusChange,
        performanceChange: data.performanceChange,
        measuredAt,
        hoursAfterIntervention: hoursAfter,
        notes: data.notes,
      },
    });

    // Update intervention effectiveness score based on outcomes
    const allOutcomes = await prisma.interventionOutcome.findMany({
      where: { interventionId },
    });

    // Calculate average effectiveness across all measured dimensions
    let totalImpact = 0;
    let measurementCount = 0;

    for (const o of allOutcomes) {
      // Positive mood change is good
      if (o.moodChange !== null) {
        totalImpact += o.moodChange;
        measurementCount++;
      }
      // Positive confidence change is good
      if (o.confidenceChange !== null) {
        totalImpact += o.confidenceChange;
        measurementCount++;
      }
      // Negative stress change is good (stress reduction)
      if (o.stressChange !== null) {
        totalImpact -= o.stressChange;
        measurementCount++;
      }
      // Positive focus change is good
      if (o.focusChange !== null) {
        totalImpact += o.focusChange;
        measurementCount++;
      }
      // Positive performance change is good
      if (o.performanceChange !== null) {
        totalImpact += o.performanceChange * 10; // Weight performance higher
        measurementCount++;
      }
    }

    const effectivenessScore = measurementCount > 0 ? totalImpact / measurementCount : null;

    // Update intervention with new effectiveness score
    await prisma.intervention.update({
      where: { id: interventionId },
      data: {
        effectivenessScore,
        completed: true,
      },
    });

    return NextResponse.json({ outcome, effectivenessScore }, { status: 201 });
  } catch (error) {
    console.error('Intervention outcome recording error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
