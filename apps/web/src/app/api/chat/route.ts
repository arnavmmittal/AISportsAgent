import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
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

    // Call MCP server (using test athlete ID for now)
    const mcpResponse = await fetch(`${mcpServerUrl}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MCP_SERVICE_TOKEN}`,
      },
      body: JSON.stringify({
        session_id: `session-test-${Date.now()}`,
        message: message,
        athlete_id: 'test-athlete-1',
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
