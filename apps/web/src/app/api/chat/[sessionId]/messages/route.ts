/**

 * API route to fetch message history for a chat session.
 *
 * GET /api/chat/[sessionId]/messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { logChatMessagesView } from '@/lib/audit';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Check authentication
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized) return response;

    const { sessionId } = await params;

    // Get session to verify ownership and get athlete ID
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { athleteId: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Fetch messages for this session
    const messages = await prisma.message.findMany({
      where: {
        sessionId: sessionId,
      },
      orderBy: {
        createdAt: 'asc', // Chronological order
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    // Audit log: User viewed chat messages
    await logChatMessagesView(
      user!.id,
      sessionId,
      messages.length,
      session.athleteId
    ).catch(err => {
      console.error('[Audit] Failed to log messages view:', err);
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching message history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message history' },
      { status: 500 }
    );
  }
}
