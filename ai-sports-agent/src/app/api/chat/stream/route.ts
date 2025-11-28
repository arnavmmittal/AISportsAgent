import { NextRequest, NextResponse } from 'next/server';
import { openai, SPORTS_PSYCH_SYSTEM_PROMPT } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

export const runtime = 'edge';

// Crisis keywords for basic detection
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'want to die', 'end my life', 'self-harm',
  'cutting myself', 'hurt myself', 'no reason to live', 'better off dead'
];

function detectCrisisKeywords(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, message, athlete_id } = body;

    if (!message || !athlete_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Crisis detection
    const hasCrisisKeywords = detectCrisisKeywords(message);
    let crisisCheck = null;

    if (hasCrisisKeywords) {
      crisisCheck = {
        final_risk_level: 'HIGH',
        detected: true,
        message: 'Crisis language detected - support resources will be provided'
      };
    }

    // Create chat session if it doesn't exist
    let chatSession;
    try {
      chatSession = await prisma.chatSession.findUnique({
        where: { id: session_id },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } }
      });

      if (!chatSession) {
        chatSession = await prisma.chatSession.create({
          data: {
            id: session_id,
            athleteId: athlete_id,
          },
          include: { messages: true }
        });
      }
    } catch (error) {
      console.log('Database not available, continuing without persistence');
    }

    // Build conversation history
    const conversationHistory = chatSession?.messages.map((msg) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: msg.content,
    })) || [];

    // Add current user message
    conversationHistory.push({
      role: 'user',
      content: message,
    });

    // Save user message to database
    try {
      await prisma.message.create({
        data: {
          sessionId: session_id,
          role: 'user',
          content: message,
        },
      });
    } catch (error) {
      console.log('Could not save user message to database');
    }

    // Create OpenAI streaming response
    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SPORTS_PSYCH_SYSTEM_PROMPT },
        ...conversationHistory,
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    // Create a custom stream that sends Server-Sent Events
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        // Send crisis check first if detected
        if (crisisCheck) {
          const crisisData = `data: ${JSON.stringify({
            type: 'crisis_check',
            data: crisisCheck,
          })}\n\n`;
          controller.enqueue(encoder.encode(crisisData));
        }

        let fullResponse = '';

        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              const data = `data: ${JSON.stringify({
                type: 'content',
                data: content,
              })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }

          // Save assistant message to database
          try {
            await prisma.message.create({
              data: {
                sessionId: session_id,
                role: 'assistant',
                content: fullResponse,
              },
            });
          } catch (error) {
            console.log('Could not save assistant message to database');
          }

          // Send done signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Streaming error:', error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
