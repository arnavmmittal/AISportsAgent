import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

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

    // Call the backend MCP API (with full agent orchestration)
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/chat/stream`, {
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

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    // Forward the streaming response from backend to frontend
    return new Response(response.body, {
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
