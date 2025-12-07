import { NextRequest, NextResponse } from 'next/server';
import { CartesiaSTT } from '@/lib/cartesia-stt';
import { OpenAI } from 'openai';

/**
 * Cartesia Speech-to-Text API Endpoint
 * POST /api/voice/cartesia-stt
 *
 * Transcribes audio using Cartesia Sonic API with fallback to OpenAI Whisper
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type || 'audio/webm',
    });

    // Try Cartesia first
    try {
      const cartesiaSTT = new CartesiaSTT();
      const transcription = await cartesiaSTT.transcribe(audioBlob);

      return NextResponse.json({
        text: transcription,
        provider: 'cartesia',
        timestamp: new Date().toISOString(),
      });
    } catch (cartesiaError) {
      console.warn('Cartesia STT failed, falling back to OpenAI Whisper:', cartesiaError);

      // Fallback to OpenAI Whisper
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY!,
        });

        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          language: 'en',
        });

        return NextResponse.json({
          text: transcription.text,
          provider: 'openai-whisper-fallback',
          timestamp: new Date().toISOString(),
        });
      } catch (whisperError) {
        console.error('OpenAI Whisper fallback also failed:', whisperError);
        throw new Error('Both Cartesia and OpenAI Whisper failed');
      }
    }
  } catch (error) {
    console.error('Voice transcription error:', error);
    return NextResponse.json(
      {
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/voice/cartesia-stt/health
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const cartesiaSTT = new CartesiaSTT();
    const isHealthy = await cartesiaSTT.healthCheck();

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      provider: 'cartesia',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
