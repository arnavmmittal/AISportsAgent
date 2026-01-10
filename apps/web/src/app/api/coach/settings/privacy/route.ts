/**
 * Coach Privacy Settings API
 * Manages privacy preferences for coaches
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

    // Return privacy settings
    return NextResponse.json({
      settings: {
        shareChatsWithCoach: settings.shareChatsWithCoach,
        shareMoodWithCoach: settings.shareMoodWithCoach,
        shareGoalsWithCoach: settings.shareGoalsWithCoach,
        autoSuggestions: settings.autoSuggestions,
        patternDetection: settings.patternDetection,
      },
    });
  } catch (error) {
    console.error('Privacy settings fetch error:', error);
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
      shareChatsWithCoach,
      shareMoodWithCoach,
      shareGoalsWithCoach,
      autoSuggestions,
      patternDetection,
    } = body;

    // Update settings
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        ...(shareChatsWithCoach !== undefined && { shareChatsWithCoach }),
        ...(shareMoodWithCoach !== undefined && { shareMoodWithCoach }),
        ...(shareGoalsWithCoach !== undefined && { shareGoalsWithCoach }),
        ...(autoSuggestions !== undefined && { autoSuggestions }),
        ...(patternDetection !== undefined && { patternDetection }),
      },
      create: {
        userId: user.id,
        shareChatsWithCoach: shareChatsWithCoach ?? false,
        shareMoodWithCoach: shareMoodWithCoach ?? false,
        shareGoalsWithCoach: shareGoalsWithCoach ?? false,
        autoSuggestions: autoSuggestions ?? true,
        patternDetection: patternDetection ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Privacy settings updated successfully',
    });
  } catch (error) {
    console.error('Privacy settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
