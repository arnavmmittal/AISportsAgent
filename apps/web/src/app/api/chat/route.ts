import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

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
