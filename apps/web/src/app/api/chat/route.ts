import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET /api/chat - Get chat sessions for authenticated user
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized || !user) {
      return response;
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // Fetch recent chat sessions
    const sessions = await prisma.chatSession.findMany({
      where: {
        athleteId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        Message: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 1, // Get first message for preview
        },
      },
    });

    // Transform to expected format
    const transformedSessions = sessions.map((session) => ({
      id: session.id,
      title: session.topic || session.summary || 'Chat Session',
      preview: session.Message[0]?.content || 'No messages yet',
      createdAt: session.createdAt.toISOString(),
      messageCount: session.Message.length,
    }));

    return NextResponse.json({
      success: true,
      data: transformedSessions,
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch chat sessions',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat - Non-streaming chat (deprecated, use /api/chat/stream instead)
 *
 * This endpoint returns a simple acknowledgment response.
 * For full AI chat functionality, use the streaming endpoint at /api/chat/stream.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(request);
    if (!authorized || !user) {
      return response;
    }

    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    // Return acknowledgment - clients should use /api/chat/stream for full AI responses
    return NextResponse.json({
      message: "Thank you for sharing. I'm here to help you work through this. For the best experience, please use the streaming chat interface.",
      hint: "Use /api/chat/stream for full AI-powered responses",
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
