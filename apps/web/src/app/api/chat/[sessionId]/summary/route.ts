import { NextRequest, NextResponse } from 'next/server';
// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { generateChatSummary } from '@/lib/generate-summary';
import {
  decryptFieldSafe,
  decryptArray,
  encryptFieldSafe,
  encryptArray,
} from '@/lib/encryption';

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

// POST /api/chat/[sessionId]/summary - Generate summary for a chat session
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized) return response;

    const { sessionId } = await context.params;

    // Fetch chat session with messages
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        Message: {
          orderBy: { createdAt: 'asc' },
        },
        Athlete: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Verify user owns this session or is a coach
    const fullUser = await prisma.user.findUnique({
      where: { id: user!.id },
      include: { Coach: true },
    });

    const isOwner = chatSession.athleteId === user!.id;
    const isCoach = fullUser?.role === 'COACH';
    const isAdmin = fullUser?.role === 'ADMIN';

    if (!isOwner && !isCoach && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this session' },
        { status: 403 }
      );
    }

    // Check if summary already exists
    const existingSummary = await prisma.chatSummary.findFirst({
      where: { sessionId },
    });

    if (existingSummary) {
      // Decrypt before returning
      const decrypted = {
        ...existingSummary,
        summary: decryptFieldSafe(existingSummary.summary) || existingSummary.summary,
        adherenceNotes: decryptFieldSafe(existingSummary.adherenceNotes as string | null),
        keyThemes: Array.isArray(existingSummary.keyThemes)
          ? decryptArray(existingSummary.keyThemes as string[])
          : existingSummary.keyThemes,
        recommendedActions: existingSummary.recommendedActions && Array.isArray(existingSummary.recommendedActions)
          ? decryptArray(existingSummary.recommendedActions as string[])
          : existingSummary.recommendedActions,
      };

      return NextResponse.json({
        summary: decrypted,
        message: 'Summary already exists',
      });
    }

    // Generate summary using GPT-4
    const messages = chatSession.Message.map(m => ({
      role: m.role,
      content: m.content,
    }));

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'Cannot generate summary for empty conversation' },
        { status: 400 }
      );
    }

    const summaryResult = await generateChatSummary(messages);

    // Encrypt sensitive fields before storing (FIELD-LEVEL ENCRYPTION)
    const encryptedSummary = encryptFieldSafe(summaryResult.summary);
    const encryptedKeyThemes = encryptArray(summaryResult.keyThemes);
    const encryptedActionItems = encryptArray(summaryResult.actionItems);

    // Create ChatSummary record with encrypted fields
    const chatSummary = await prisma.chatSummary.create({
      data: {
        sessionId: chatSession.id,
        athleteId: chatSession.athleteId,
        summary: encryptedSummary!,
        keyThemes: encryptedKeyThemes,
        emotionalState: summaryResult.emotionalState,
        actionItems: encryptedActionItems,
        messageCount: messages.length,
      },
    });

    // Decrypt before returning (newly created summary)
    const decrypted = {
      ...chatSummary,
      summary: decryptFieldSafe(chatSummary.summary) || chatSummary.summary,
      adherenceNotes: decryptFieldSafe(chatSummary.adherenceNotes as string | null),
      keyThemes: Array.isArray(chatSummary.keyThemes)
        ? decryptArray(chatSummary.keyThemes as string[])
        : chatSummary.keyThemes,
      recommendedActions: chatSummary.recommendedActions && Array.isArray(chatSummary.recommendedActions)
        ? decryptArray(chatSummary.recommendedActions as string[])
        : chatSummary.recommendedActions,
    };

    return NextResponse.json({
      summary: decrypted,
      message: 'Summary generated successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating chat summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

// GET /api/chat/[sessionId]/summary - Get existing summary
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized) return response;

    const { sessionId } = await context.params;

    // Fetch chat session
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        athleteId: true,
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Verify user owns this session or is a coach with consent
    const fullUser = await prisma.user.findUnique({
      where: { id: user!.id },
      include: { Coach: true, Athlete: true },
    });

    const isOwner = chatSession.athleteId === user!.id;
    const isCoach = fullUser?.role === 'COACH';

    if (!isOwner && !isCoach) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this session' },
        { status: 403 }
      );
    }

    // If user is a coach, check athlete consent
    if (isCoach) {
      const athlete = await prisma.athlete.findUnique({
        where: { userId: chatSession.athleteId },
        select: { consentChatSummaries: true },
      });

      if (!athlete?.consentChatSummaries) {
        return NextResponse.json(
          { error: 'Athlete has not consented to share chat summaries' },
          { status: 403 }
        );
      }
    }

    // Fetch summary
    const summary = await prisma.chatSummary.findFirst({
      where: { sessionId },
    });

    if (!summary) {
      return NextResponse.json(
        { error: 'Summary not found' },
        { status: 404 }
      );
    }

    // Update viewedByCoach if coach is viewing for first time
    if (isCoach && !summary.viewedByCoach) {
      await prisma.chatSummary.update({
        where: { id: summary.id },
        data: {
          viewedByCoach: true,
          viewedAt: new Date(),
          coachId: user!.id,
        },
      });
    }

    // Decrypt sensitive fields before returning (TRANSPARENT DECRYPTION)
    const decryptedSummary = {
      ...summary,
      summary: decryptFieldSafe(summary.summary) || summary.summary,
      adherenceNotes: decryptFieldSafe(summary.adherenceNotes as string | null),
      keyThemes: Array.isArray(summary.keyThemes)
        ? decryptArray(summary.keyThemes as string[])
        : summary.keyThemes,
      recommendedActions: summary.recommendedActions && Array.isArray(summary.recommendedActions)
        ? decryptArray(summary.recommendedActions as string[])
        : summary.recommendedActions,
    };

    return NextResponse.json({ summary: decryptedSummary });

  } catch (error) {
    console.error('Error fetching chat summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    );
  }
}
