/**

 * Chat Analysis API Endpoint
 *
 * POST /api/chat/analyze
 * Analyzes a completed chat session and stores psychological insights
 *
 * Called when:
 * - Chat session ends (athlete closes session)
 * - Session is inactive for 30+ minutes
 * - Manually triggered by coach for review
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeAndStore } from '@/lib/chat-analysis';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Analyze the session and store insights
    const analysis = await analyzeAndStore(sessionId);

    return NextResponse.json({
      success: true,
      sessionId,
      analysis: {
        sentiment: analysis.overallSentiment,
        emotionalTone: analysis.emotionalTone,
        confidence: analysis.confidenceLevel,
        topicsCount: analysis.topics.length,
        dominantTheme: analysis.dominantTheme,
        hasStressIndicators: analysis.stressIndicators.length > 0,
        isPreGame: analysis.isPreGame,
        daysUntilGame: analysis.daysUntilGame
      }
    });
  } catch (error: any) {
    console.error('Chat analysis failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze chat session',
        details: error.message
      },
      { status: 500 }
    );
  }
}
