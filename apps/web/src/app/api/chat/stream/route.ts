/**
 * Chat Stream API - PRODUCTION-READY
 * Uses integrated TypeScript agent system instead of external MCP server
 * Supports both streaming and non-streaming responses
 *
 * Security:
 * - Input validation with Zod
 * - XSS prevention (HTML sanitization)
 * - Cost controls (rate limiting)
 * - Multi-tenant access control
 */

import { NextRequest } from 'next/server';
import { verifyAuthFromRequest } from '@/lib/auth-helpers';
import { checkUserCanMakeRequest } from '@/lib/cost-tracking';
import { getChatService } from '@/services/ChatService';
import {
  validateRequest,
  chatStreamRequestSchema,
  ValidationError,
  validateAthleteAccess,
} from '@/lib/validation';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    // Check for internal voice service authentication
    const voiceServiceKey = req.headers.get('x-voice-service-key');
    const isVoiceService = voiceServiceKey &&
      voiceServiceKey === (process.env.VOICE_SERVICE_KEY || 'dev-voice-service-key');

    // Verify authentication (supports both JWT, session, and internal service key)
    let user = null;
    if (!isVoiceService) {
      user = await verifyAuthFromRequest(req);
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
    }

    // Validate and sanitize input with Zod
    let validatedData;
    try {
      validatedData = await validateRequest(req, chatStreamRequestSchema);
    } catch (error) {
      if (error instanceof ValidationError) {
        return new Response(
          encoder.encode('data: ' + JSON.stringify({
            type: 'error',
            data: 'Validation failed',
            details: error.errors
          }) + '\n\n'),
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
        encoder.encode('data: ' + JSON.stringify({ type: 'error', data: 'Invalid request' }) + '\n\n'),
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
    }

    console.log(`[Chat Agent] Processing message for athlete: ${athlete_id}, session: ${session_id}`);

    // Stream response with real-time tokens from OpenAI
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Import dependencies
          const { getOrchestrator } = await import('@/agents/core/AgentOrchestrator');
          const { prisma } = await import('@/lib/prisma');

          // Get or create session
          let session = await prisma.chatSession.findUnique({
            where: { id: session_id || `session_${athlete_id}` },
            include: { Athlete: { include: { User: true } } },
          });

          if (!session) {
            session = await prisma.chatSession.create({
              data: {
                id: session_id || `session_${athlete_id}`,
                athleteId: athlete_id,
              },
              include: { Athlete: { include: { User: true } } },
            });
          }

          // Send session info first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'session',
              data: { sessionId: session.id },
            })}\n\n`)
          );

          // Get conversation history
          const history = await prisma.message.findMany({
            where: { sessionId: session.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { role: true, content: true },
          });

          // Save user message
          await prisma.message.create({
            data: {
              id: `msg_${Date.now()}`,
              sessionId: session.id,
              role: 'user',
              content: message,
            },
          });

          // Build context
          const context = {
            sessionId: session.id,
            athleteId: athlete_id,
            userId: user?.id || athlete_id, // Use athlete_id for voice service requests
            sport: session.Athlete?.sport,
            conversationHistory: history.reverse().map((msg) => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            })),
            metadata: {
              athleteName: session.Athlete?.User.name,
            },
          };

          const orchestrator = getOrchestrator();

          // Stream tokens as they arrive from OpenAI
          const result = await orchestrator.processMessageStream(
            message,
            context,
            (chunk) => {
              // Send each token
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'token',
                  data: { content: chunk },
                })}\n\n`)
              );
            }
          );

          // Save assistant message
          const assistantMessageId = `msg_${Date.now()}_assistant`;
          await prisma.message.create({
            data: {
              id: assistantMessageId,
              sessionId: session.id,
              role: 'assistant',
              content: result.response.content,
            },
          });

          // Send crisis alert if detected
          if (result.crisisDetection?.isCrisis) {
            console.warn(`[Chat Agent] CRISIS DETECTED - Severity: ${result.crisisDetection.severity}`);

            // Create crisis alert in database
            await prisma.crisisAlert.create({
              data: {
                id: `alert_${Date.now()}`,
                athleteId: athlete_id,
                sessionId: session.id,
                messageId: assistantMessageId,
                severity: result.crisisDetection.severity,
                detectedAt: new Date(),
                reviewed: false,
              },
            });

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'crisis_alert',
                data: result.crisisDetection,
              })}\n\n`)
            );
          }

          // Trigger chat analysis if session has enough messages and hasn't been analyzed recently
          try {
            const messageCount = await prisma.message.count({
              where: { sessionId: session.id },
            });

            // Check if we should analyze (session has 5+ messages)
            if (messageCount >= 5) {
              // Check if session was analyzed in last hour
              const recentInsight = await prisma.chatInsight.findFirst({
                where: {
                  sessionId: session.id,
                  createdAt: {
                    gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
                  },
                },
              });

              // Only analyze if not recently analyzed
              if (!recentInsight) {
                console.log(`[Chat Analysis] Triggering analysis for session ${session.id} (${messageCount} messages)`);

                // Import analysis function
                const { analyzeAndStore } = await import('@/lib/chat-analysis');

                // Trigger analysis asynchronously (don't wait for it)
                analyzeAndStore(session.id).catch((error) => {
                  console.error(`[Chat Analysis] Failed to analyze session ${session.id}:`, error);
                });
              }
            }
          } catch (error) {
            console.error('[Chat Analysis] Error checking if analysis needed:', error);
            // Don't fail the request if analysis check fails
          }

          // Send done event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('[Chat Stream] Error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              data: error instanceof Error ? error.message : 'Stream error',
            })}\n\n`)
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
