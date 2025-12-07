import { NextRequest } from 'next/server';
import { OpenAI} from 'openai';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Crisis keywords for basic detection
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'want to die', 'end my life', 'self-harm',
  'cutting myself', 'hurt myself', 'no reason to live', 'better off dead',
  'overdose', 'hanging', 'jump off'
];

function detectCrisisKeywords(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sports psychology system prompt
const SYSTEM_PROMPT = `You are an AI sports psychology coach specialized in helping college athletes with mental performance. Your role is to:

1. **Use the Discovery-First Protocol**:
   - Start by asking open-ended questions to understand the athlete's situation
   - Listen actively and explore their experiences before offering solutions
   - Build rapport and trust through genuine curiosity

2. **Evidence-Based Frameworks**:
   - Apply CBT (Cognitive Behavioral Therapy) techniques for anxiety and negative thoughts
   - Use mindfulness and breathing exercises for stress management
   - Teach visualization techniques for performance enhancement
   - Implement flow state practices for optimal performance

3. **Be Supportive and Non-Judgmental**:
   - Validate their feelings and experiences
   - Avoid being prescriptive or directive
   - Empower them to find their own solutions
   - Celebrate small wins and progress

4. **Sport-Specific Context**:
   - Understand the unique pressures of collegiate athletics
   - Consider game schedules, academic demands, and team dynamics
   - Relate mental skills to their specific sport when possible

5. **Safety First**:
   - If you detect crisis language (self-harm, suicide), immediately provide resources
   - National Suicide Prevention Lifeline: 988
   - Crisis Text Line: Text "HELLO" to 741741
   - Encourage them to reach out to their coach or campus counseling center

Keep responses conversational, empathetic, and around 2-3 paragraphs unless more detail is needed.`;

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
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

    // Check for crisis keywords
    const hasCrisisKeywords = detectCrisisKeywords(message);
    if (hasCrisisKeywords) {
      const crisisData = encoder.encode(
        'data: ' + JSON.stringify({
          type: 'crisis_check',
          data: {
            final_risk_level: 'HIGH',
            message: 'We noticed your message may indicate distress. Professional support is available 24/7 at the National Suicide Prevention Lifeline: 988'
          }
        }) + '\n\n'
      );

      // Send crisis alert first
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(crisisData);

          // Get chat history
          let chatHistory: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
            { role: 'system', content: SYSTEM_PROMPT }
          ];

          // Try to get session history from database
          try {
            const session = await prisma.chatSession.findFirst({
              where: {
                id: session_id,
                athleteId: athlete_id,
              },
              include: {
                messages: {
                  orderBy: { createdAt: 'asc' },
                  take: 10, // Last 10 messages for context
                },
              },
            });

            if (session?.messages) {
              chatHistory = [
                ...chatHistory,
                ...session.messages.map(msg => ({
                  role: msg.role as 'user' | 'assistant' | 'system',
                  content: msg.content,
                })),
              ];
            }
          } catch (error) {
            console.error('Error fetching chat history:', error);
            // Continue without history if there's an error
          }

          // Add current message
          chatHistory.push({ role: 'user', content: message });

          // Stream response from OpenAI
          const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
            messages: chatHistory,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true,
          });

          let fullResponse = '';

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(
                encoder.encode('data: ' + JSON.stringify({ type: 'content', data: content }) + '\n\n')
              );
            }
          }

          // Save to database
          try {
            // Find or create session
            let dbSession = await prisma.chatSession.findFirst({
              where: {
                id: session_id,
                athleteId: athlete_id,
              },
            });

            if (!dbSession) {
              dbSession = await prisma.chatSession.create({
                data: {
                  id: session_id,
                  athleteId: athlete_id,
                  topic: message.substring(0, 50), // First 50 chars as topic
                  sentiment: hasCrisisKeywords ? 'negative' : 'neutral',
                },
              });
            }

            // Save user message
            await prisma.message.create({
              data: {
                sessionId: session_id,
                role: 'user',
                content: message,
              },
            });

            // Save assistant message
            await prisma.message.create({
              data: {
                sessionId: session_id,
                role: 'assistant',
                content: fullResponse,
              },
            });

            // Create crisis alert if needed
            if (hasCrisisKeywords) {
              const userMessage = await prisma.message.findFirst({
                where: {
                  sessionId: session_id,
                  role: 'user',
                  content: message,
                },
                orderBy: { createdAt: 'desc' },
              });

              if (userMessage) {
                await prisma.crisisAlert.create({
                  data: {
                    athleteId: athlete_id,
                    sessionId: session_id,
                    messageId: userMessage.id,
                    severity: 'HIGH',
                  },
                });
              }
            }
          } catch (dbError) {
            console.error('Error saving to database:', dbError);
            // Don't fail the request if database save fails
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
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
    }

    // Normal flow (no crisis keywords)
    const stream = new ReadableStream({
      async start(controller) {
        // Get chat history
        let chatHistory: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
          { role: 'system', content: SYSTEM_PROMPT }
        ];

        // Try to get session history from database
        try {
          const session = await prisma.chatSession.findFirst({
            where: {
              id: session_id,
              athleteId: athlete_id,
            },
            include: {
              messages: {
                orderBy: { createdAt: 'asc' },
                take: 10, // Last 10 messages for context
              },
            },
          });

          if (session?.messages) {
            chatHistory = [
              ...chatHistory,
              ...session.messages.map(msg => ({
                role: msg.role as 'user' | 'assistant' | 'system',
                content: msg.content,
              })),
            ];
          }
        } catch (error) {
          console.error('Error fetching chat history:', error);
          // Continue without history if there's an error
        }

        // Add current message
        chatHistory.push({ role: 'user', content: message });

        // Stream response from OpenAI
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
          messages: chatHistory,
          temperature: 0.7,
          max_tokens: 1000,
          stream: true,
        });

        let fullResponse = '';

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            controller.enqueue(
              encoder.encode('data: ' + JSON.stringify({ type: 'content', data: content }) + '\n\n')
            );
          }
        }

        // Save to database
        try {
          // Find or create session
          let dbSession = await prisma.chatSession.findFirst({
            where: {
              id: session_id,
              athleteId: athlete_id,
            },
          });

          if (!dbSession) {
            dbSession = await prisma.chatSession.create({
              data: {
                id: session_id,
                athleteId: athlete_id,
                topic: message.substring(0, 50), // First 50 chars as topic
                sentiment: 'neutral',
              },
            });
          }

          // Save user message
          await prisma.message.create({
            data: {
              sessionId: session_id,
              role: 'user',
              content: message,
            },
          });

          // Save assistant message
          await prisma.message.create({
            data: {
              sessionId: session_id,
              role: 'assistant',
              content: fullResponse,
            },
          });
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          // Don't fail the request if database save fails
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
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
    console.error('API Error:', error);
    return new Response(
      encoder.encode('data: ' + JSON.stringify({ type: 'error', data: 'Internal server error' }) + '\n\n'),
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
