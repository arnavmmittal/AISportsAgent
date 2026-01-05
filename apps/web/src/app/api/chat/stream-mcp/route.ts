/**
 * Chat Stream API - MCP SERVER VERSION
 *
 * Proxies chat requests to the Python MCP Server for AI agent orchestration.
 * This version uses the FastAPI backend with Python agents for better scalability.
 *
 * Security:
 * - Input validation with Zod
 * - XSS prevention (HTML sanitization)
 * - Cost controls (rate limiting)
 * - Multi-tenant access control
 * - Service-to-service authentication with MCP server
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthFromRequest } from '@/lib/auth-helpers';
import { checkUserCanMakeRequest, checkSchoolCostLimit } from '@/lib/cost-tracking';
import {
  validateRequest,
  chatStreamRequestSchema,
  ValidationError,
} from '@/lib/validation';
import { logChatMessageCreation } from '@/lib/audit';
import { streamChatMessage, parseSSEStream, checkMCPHealth } from '@/lib/mcp-client';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    // Check for internal voice service authentication
    const voiceServiceKey = req.headers.get('x-voice-service-key');
    const isVoiceService =
      voiceServiceKey &&
      voiceServiceKey === (process.env.VOICE_SERVICE_KEY || 'dev-voice-service-key');

    // Verify authentication (supports both JWT, session, and internal service key)
    let user = null;
    if (!isVoiceService) {
      user = await verifyAuthFromRequest(req);
      if (!user) {
        return new Response(
          encoder.encode(
            'data: ' + JSON.stringify({ type: 'error', data: 'Unauthorized' }) + '\n\n'
          ),
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
    }

    // Validate and sanitize input with Zod
    let validatedData;
    try {
      validatedData = await validateRequest(req, chatStreamRequestSchema);
    } catch (error) {
      if (error instanceof ValidationError) {
        return new Response(
          encoder.encode(
            'data: ' +
              JSON.stringify({
                type: 'error',
                data: 'Validation failed',
                details: error.errors,
              }) +
              '\n\n'
          ),
          {
            status: 400,
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          }
        );
      }
      return new Response(
        encoder.encode(
          'data: ' + JSON.stringify({ type: 'error', data: 'Invalid request' }) + '\n\n'
        ),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      );
    }

    const { session_id, message, athlete_id } = validatedData;

    // Only check cost limits and permissions for regular user requests (not voice service)
    if (!isVoiceService && user) {
      // Check per-user cost limits
      const usageCheck = await checkUserCanMakeRequest(user.id);
      if (!usageCheck.allowed) {
        console.warn(`[Cost Control] Request blocked for user ${user.id}: ${usageCheck.reason}`);
        return new Response(
          encoder.encode(
            'data: ' +
              JSON.stringify({
                type: 'error',
                data: usageCheck.reason,
                usage: usageCheck.currentUsage,
              }) +
              '\n\n'
          ),
          {
            status: 429,
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Retry-After': '86400',
            },
          }
        );
      }

      // Check per-school (tenant) cost limits and circuit breaker
      const schoolCheck = await checkSchoolCostLimit(user.schoolId);
      if (!schoolCheck.allowed) {
        console.error(
          `[CIRCUIT BREAKER] Request blocked for school ${user.schoolId}: ${schoolCheck.reason}`
        );
        return new Response(
          encoder.encode(
            'data: ' +
              JSON.stringify({
                type: 'error',
                data: schoolCheck.reason,
                usage: schoolCheck.currentUsage,
              }) +
              '\n\n'
          ),
          {
            status: 429,
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Retry-After': '86400',
            },
          }
        );
      }

      // Verify user can chat as this athlete
      if (user.id !== athlete_id && user.role !== 'ADMIN') {
        return new Response(
          encoder.encode(
            'data: ' + JSON.stringify({ type: 'error', data: 'Forbidden' }) + '\n\n'
          ),
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
    }

    console.log(`[MCP Chat] Processing message for athlete: ${athlete_id}, session: ${session_id}`);

    // Ensure we have a valid session_id (create if not provided)
    let validSessionId = session_id;
    if (!validSessionId) {
      // Create a new session
      const newSession = await prisma.chatSession.create({
        data: {
          id: `session_${Date.now()}`,
          athleteId: athlete_id,
        },
      });
      validSessionId = newSession.id;
      console.log(`[MCP Chat] Created new session: ${validSessionId}`);
    }

    // Check MCP server health before proceeding
    const isHealthy = await checkMCPHealth();
    if (!isHealthy) {
      console.error('[MCP Chat] MCP server health check failed');
      return new Response(
        encoder.encode(
          'data: ' +
            JSON.stringify({
              type: 'error',
              data: 'AI service temporarily unavailable. Please try again.',
            }) +
            '\n\n'
        ),
        {
          status: 503,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Retry-After': '60',
          },
        }
      );
    }

    // Save user message to database first (for audit trail)
    const userMessageId = `msg_${Date.now()}`;
    await prisma.message.create({
      data: {
        id: userMessageId,
        sessionId: validSessionId,
        role: 'user',
        content: message,
      },
    });

    // Audit log: User created a chat message
    await logChatMessageCreation(athlete_id, validSessionId, userMessageId).catch((err) => {
      console.error('[Audit] Failed to log message creation:', err);
    });

    // Stream response from MCP server
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Call MCP server
          const mcpResponse = await streamChatMessage({
            session_id: validSessionId,
            message,
            athlete_id,
            stream: true,
          });

          // Send session info first
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'session',
                data: { sessionId: validSessionId },
              })}\n\n`
            )
          );

          let fullResponse = '';
          let crisisDetection: any = null;

          // Parse and forward SSE stream from MCP server
          for await (const event of parseSSEStream(mcpResponse)) {
            if (event.type === 'content' || event.type === 'token') {
              // Forward content chunks
              const content = event.data.content || event.data;
              fullResponse += content;

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'token',
                    data: { content },
                  })}\n\n`
                )
              );
            } else if (event.type === 'crisis_check') {
              // Capture crisis detection for database
              crisisDetection = event.data;

              // Forward crisis alert
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'crisis_alert',
                    data: event.data,
                  })}\n\n`
                )
              );
            } else if (event.type === 'metadata') {
              // Forward metadata
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'metadata',
                    data: event.data,
                  })}\n\n`
                )
              );
            }
          }

          // Save assistant message to database
          const assistantMessageId = `msg_${Date.now()}_assistant`;
          await prisma.message.create({
            data: {
              id: assistantMessageId,
              sessionId: validSessionId,
              role: 'assistant',
              content: fullResponse,
            },
          });

          // Audit log: Assistant message created
          await logChatMessageCreation('system', validSessionId, assistantMessageId).catch((err) => {
            console.error('[Audit] Failed to log assistant message:', err);
          });

          // Save crisis alert if detected
          if (crisisDetection && crisisDetection.final_risk_level !== 'LOW') {
            await prisma.crisisAlert.create({
              data: {
                id: `alert_${Date.now()}`,
                athleteId: athlete_id,
                sessionId: validSessionId,
                messageId: assistantMessageId,
                severity: crisisDetection.severity || crisisDetection.final_risk_level,
                detectedAt: new Date(),
                reviewed: false,
              },
            });
          }

          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('[MCP Chat] Streaming error:', error);

          controller.enqueue(
            encoder.encode(
              'data: ' +
                JSON.stringify({
                  type: 'error',
                  data: error instanceof Error ? error.message : 'Streaming failed',
                }) +
                '\n\n'
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('[MCP Chat] Request error:', error);

    return new Response(
      encoder.encode(
        'data: ' +
          JSON.stringify({
            type: 'error',
            data: error instanceof Error ? error.message : 'Request failed',
          }) +
          '\n\n'
      ),
      {
        status: 500,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }
}
