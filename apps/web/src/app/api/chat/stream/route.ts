import { NextRequest } from 'next/server';
import { verifyAuthFromRequest } from '@/lib/auth-helpers';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    // Verify authentication (supports both JWT and session)
    const user = await verifyAuthFromRequest(req);
    if (!user) {
      return new Response(
        encoder.encode('data: ' + JSON.stringify({ type: 'error', data: 'Unauthorized' }) + '\n\n'),
        {
          status: 401,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    const body = await req.json();
    const { session_id, message, athlete_id } = body;

    if (!message || !athlete_id) {
      return new Response(
        encoder.encode('data: ' + JSON.stringify({ type: 'error', data: 'Missing required fields' }) + '\n\n'),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    // Verify user can chat as this athlete
    if (user.id !== athlete_id && user.role !== 'ADMIN') {
      return new Response(
        encoder.encode('data: ' + JSON.stringify({ type: 'error', data: 'Forbidden' }) + '\n\n'),
        {
          status: 403,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    // Forward request to MCP server
    console.log(`[Chat Proxy] Forwarding to MCP server: ${MCP_SERVER_URL}/api/chat/stream`);
    console.log(`[Chat Proxy] Athlete: ${athlete_id}, Session: ${session_id}`);

    const mcpResponse = await fetch(`${MCP_SERVER_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id,
        message,
        athlete_id,
        stream: true,
      }),
    });

    if (!mcpResponse.ok) {
      const errorText = await mcpResponse.text();
      console.error(`[Chat Proxy] MCP server error: ${mcpResponse.status} ${mcpResponse.statusText}`);
      console.error(`[Chat Proxy] Error details: ${errorText}`);

      return new Response(
        encoder.encode('data: ' + JSON.stringify({
          type: 'error',
          data: `MCP server error: ${mcpResponse.statusText}`
        }) + '\n\n'),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    // Check if response has a body
    if (!mcpResponse.body) {
      console.error('[Chat Proxy] No response body from MCP server');
      return new Response(
        encoder.encode('data: ' + JSON.stringify({
          type: 'error',
          data: 'No response from MCP server'
        }) + '\n\n'),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    console.log('[Chat Proxy] Streaming response from MCP server');

    // Stream the response from MCP server to client
    // The MCP server already formats responses as SSE with proper JSON structure
    return new Response(mcpResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[Chat Proxy] Unexpected error:', error);
    return new Response(
      encoder.encode('data: ' + JSON.stringify({
        type: 'error',
        data: error instanceof Error ? error.message : 'Internal server error'
      }) + '\n\n'),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }
}
