/**
 * API route to fetch message history for a chat session.
 *
 * GET /api/chat/[sessionId]/messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Check authentication
    const { authorized, response } = await requireAuth(request);
    if (!authorized) return response;

    const { sessionId } = await params;

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

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching message history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message history' },
      { status: 500 }
    );
  }
}
