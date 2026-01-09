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
      title: session.title || 'Untitled Session',
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

    // Check if MCP server is enabled
    const useMCPServer = process.env.USE_MCP_SERVER === 'true';
    const mcpServerUrl = process.env.MCP_SERVER_URL;

    if (!useMCPServer || !mcpServerUrl) {
      // Fallback to simple response if MCP not configured
      return NextResponse.json({
        message: "Thank you for sharing. I'm here to help you work through this. Can you tell me more about what's been on your mind?",
      });
    }

    // Call MCP server with real user ID
    const mcpResponse = await fetch(`${mcpServerUrl}/api/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: `session-${user.id}-${Date.now()}`,
        message: message,
        athlete_id: user.id,
        stream: false,
      }),
    });

    if (!mcpResponse.ok) {
      const errorText = await mcpResponse.text();
      console.error('MCP server error:', errorText);
      return NextResponse.json(
        { error: 'MCP server error', details: errorText },
        { status: 500 }
      );
    }

    const data = await mcpResponse.json();

    return NextResponse.json({
      message: data.message || data.content || 'Sorry, I encountered an error processing your request.',
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
        mcpUrl: process.env.MCP_SERVER_URL
      },
      { status: 500 }
    );
  }
}
