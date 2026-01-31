/**
 * Chat Stream API v2 - LangGraph Edition
 *
 * Uses LangGraph StateGraph for sophisticated agent orchestration:
 * - Proper tool calling with Zod schemas
 * - State persistence via MemorySaver
 * - Triple-layer crisis detection
 * - Enriched athlete context
 *
 * Security:
 * - Input validation with Zod
 * - Cost controls (rate limiting)
 * - Multi-tenant access control
 */

import { NextRequest } from 'next/server';
import { verifyAuthFromRequest } from '@/lib/auth-helpers';
import { checkUserCanMakeRequest, checkSchoolCostLimit } from '@/lib/cost-tracking';
import { prisma } from '@/lib/prisma';
import {
  validateRequest,
  chatStreamRequestSchema,
  ValidationError,
} from '@/lib/validation';
import { logChatMessageCreation } from '@/lib/audit';
import { sendCrisisAlertToCoaches } from '@/lib/push-notifications';
import { streamConversationGraph } from '@/agents/langgraph';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

// Check if LangGraph is enabled via feature flag
const LANGGRAPH_ENABLED = process.env.ENABLE_LANGGRAPH === 'true';

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  // Helper to create SSE response
  const createSSEResponse = (data: string, status = 200) =>
    new Response(encoder.encode(data), {
      status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  // Helper to format SSE message
  const formatSSE = (type: string, data: unknown) =>
    `data: ${JSON.stringify({ type, data })}\n\n`;

  try {
    // Check feature flag
    if (!LANGGRAPH_ENABLED) {
      return createSSEResponse(
        formatSSE('error', 'LangGraph is not enabled. Set ENABLE_LANGGRAPH=true'),
        400
      );
    }

    // Check for internal voice service authentication
    const voiceServiceKey = req.headers.get('x-voice-service-key');
    const isVoiceService =
      voiceServiceKey &&
      voiceServiceKey === (process.env.VOICE_SERVICE_KEY || 'dev-voice-service-key');

    // Verify authentication
    let user = null;
    if (!isVoiceService) {
      user = await verifyAuthFromRequest(req);
      if (!user) {
        return createSSEResponse(formatSSE('error', 'Unauthorized'), 401);
      }
    }

    // Validate and sanitize input
    let validatedData;
    try {
      validatedData = await validateRequest(req, chatStreamRequestSchema);
    } catch (error) {
      if (error instanceof ValidationError) {
        return createSSEResponse(
          formatSSE('error', { message: 'Validation failed', details: error.errors }),
          400
        );
      }
      return createSSEResponse(formatSSE('error', 'Invalid request'), 400);
    }

    const { message, athlete_id } = validatedData;
    // Generate session_id if not provided (matches v1 behavior)
    const session_id = validatedData.session_id || crypto.randomUUID();

    // Only check cost limits and permissions for regular user requests
    if (!isVoiceService && user) {
      // Check per-user cost limits
      const usageCheck = await checkUserCanMakeRequest(user.id);
      if (!usageCheck.allowed) {
        console.warn(`[Cost Control] Request blocked for user ${user.id}: ${usageCheck.reason}`);
        return createSSEResponse(
          formatSSE('error', { message: usageCheck.reason, usage: usageCheck.currentUsage }),
          429
        );
      }

      // Check per-school cost limits
      const schoolCheck = await checkSchoolCostLimit(user.schoolId);
      if (!schoolCheck.allowed) {
        console.error(`[CIRCUIT BREAKER] Request blocked for school ${user.schoolId}`);
        return createSSEResponse(
          formatSSE('error', { message: schoolCheck.reason, usage: schoolCheck.currentUsage }),
          429
        );
      }

      // Verify user can chat as this athlete
      if (user.id !== athlete_id && user.role !== 'ADMIN') {
        return createSSEResponse(formatSSE('error', 'Forbidden'), 403);
      }
    }

    // Get or create session
    let session = await prisma.chatSession.findUnique({
      where: { id: session_id },
      include: {
        Athlete: {
          include: { User: true },
        },
      },
    });

    if (!session) {
      // Create new session
      session = await prisma.chatSession.create({
        data: {
          id: session_id,
          athleteId: athlete_id,
        },
        include: {
          Athlete: {
            include: { User: true },
          },
        },
      });
    }

    // Save user message to database
    // Note: Message requires explicit id (not auto-generated in schema)
    const userMessage = await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        sessionId: session_id,
        role: 'user',
        content: message,
      },
    });

    // Log message creation for audit
    logChatMessageCreation(athlete_id, session_id, userMessage.id);

    // Get athlete's sport for context
    const sport = session.Athlete?.sport || null;

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send session info
          controller.enqueue(
            encoder.encode(
              formatSSE('session', {
                sessionId: session_id,
                athleteId: athlete_id,
                messageId: userMessage.id,
                version: 'langgraph-v2',
              })
            )
          );

          // Stream LangGraph execution
          const graphStream = streamConversationGraph(
            message,
            session_id,
            athlete_id,
            user?.id || athlete_id,
            sport
          );

          let fullResponse = '';
          let crisisData = null;

          for await (const event of graphStream) {
            // Forward events to client
            controller.enqueue(encoder.encode(formatSSE(event.type, event.data)));

            // Accumulate response content
            if (event.type === 'token' && event.data?.content) {
              fullResponse += event.data.content;
            }

            // Capture crisis data
            if (event.type === 'crisis_alert') {
              crisisData = event.data;
            }
          }

          // Handle crisis alert notifications
          if (crisisData && (crisisData.severity === 'CRITICAL' || crisisData.severity === 'HIGH')) {
            try {
              const athleteName = session?.Athlete?.User?.name || 'Unknown Athlete';
              // Note: alertId is session_id since actual alert is created in persist node
              await sendCrisisAlertToCoaches(
                athleteName,
                crisisData.severity,
                session_id
              );
            } catch (notifError) {
              console.error('[CRISIS_NOTIFICATION] Failed to send:', notifError);
            }
          }

          // Send completion signal
          controller.enqueue(encoder.encode(formatSSE('done', { sessionId: session_id })));
          controller.close();
        } catch (error) {
          console.error('[LANGGRAPH_STREAM] Error:', error);
          controller.enqueue(
            encoder.encode(
              formatSSE('error', {
                message: 'An error occurred while processing your message.',
                details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
              })
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error('[LANGGRAPH_STREAM] Unhandled error:', error);
    return createSSEResponse(
      formatSSE('error', 'Internal server error'),
      500
    );
  }
}
