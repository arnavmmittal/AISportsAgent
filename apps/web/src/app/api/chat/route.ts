import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get session for authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Call MCP server
    const mcpResponse = await fetch(`${mcpServerUrl}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MCP_SERVICE_TOKEN}`,
      },
      body: JSON.stringify({
        session_id: `session-${session.user.id}-${Date.now()}`,
        message: message,
        athlete_id: session.user.id,
        stream: false,
      }),
    });

    if (!mcpResponse.ok) {
      console.error('MCP server error:', await mcpResponse.text());
      throw new Error('MCP server request failed');
    }

    const data = await mcpResponse.json();

    return NextResponse.json({
      message: data.message || data.content || 'Sorry, I encountered an error processing your request.',
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
