/**
 * Chat Stream API - PRODUCTION-READY
 * Uses integrated TypeScript agent system instead of external MCP server
 * Supports both streaming and non-streaming responses
 */

import { NextRequest } from 'next/server';
import { verifyAuthFromRequest } from '@/lib/auth-helpers';
import { checkUserCanMakeRequest } from '@/lib/cost-tracking';
import { getChatService } from '@/services/ChatService';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

    // Check cost limits before allowing request
    const usageCheck = await checkUserCanMakeRequest(user.id);
    if (!usageCheck.allowed) {
      console.warn(`[Cost Control] Request blocked for user ${user.id}: ${usageCheck.reason}`);
      return new Response(
        encoder.encode('data: ' + JSON.stringify({
          type: 'error',
          data: usageCheck.reason,
          usage: usageCheck.currentUsage,
        }) + '\n\n'),
        {
          status: 429, // Too Many Requests
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Retry-After': '86400', // 24 hours (for daily limit)
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

    console.log(`[Chat Agent] Processing message for athlete: ${athlete_id}, session: ${session_id}`);

    // Process message with integrated agent system
    const chatService = getChatService();
    const response = await chatService.processMessage(
      athlete_id,
      user.id,
      message,
      session_id
    );

    console.log(`[Chat Agent] Response generated, session: ${response.sessionId}`);

    // Stream response in SSE format
    // Send complete message (agents don't stream yet, but format allows future streaming)
    const stream = new ReadableStream({
      start(controller) {
        // Send the complete response
        const data = {
          type: 'message',
          data: {
            content: response.message.content,
            role: response.message.role,
            timestamp: response.message.timestamp,
          },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        // Send session info
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'session',
            data: { sessionId: response.sessionId },
          })}\n\n`)
        );

        // Send crisis alert if detected
        if (response.crisisDetected) {
          console.warn(`[Chat Agent] CRISIS DETECTED - Severity: ${response.crisisDetected.severity}`);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'crisis_alert',
              data: response.crisisDetected,
            })}\n\n`)
          );
        }

        // Send done event
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[Chat Agent] Unexpected error:', error);
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
