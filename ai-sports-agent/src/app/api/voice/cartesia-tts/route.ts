import { NextRequest, NextResponse } from 'next/server';
import { CartesiaTTS } from '@/lib/cartesia-tts';
import { OpenAI } from 'openai';

/**
 * Cartesia Text-to-Speech API Endpoint
 * POST /api/voice/cartesia-tts
 *
 * Synthesizes text to speech using Cartesia TTS with fallback to OpenAI TTS
 */
export async function POST(request: NextRequest) {
  try {
    const { text, voiceId } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Try Cartesia first
    try {
      const cartesiaTTS = new CartesiaTTS();
      await cartesiaTTS.initialize();

      // Synthesize audio
      const audioBuffer = await cartesiaTTS.synthesize(text, voiceId);

      // Convert PCM to WAV
      const wavBuffer = cartesiaTTS.convertToWav(audioBuffer);

      // Cleanup
      cartesiaTTS.close();

      return new NextResponse(wavBuffer, {
        headers: {
          'Content-Type': 'audio/wav',
          'Content-Length': wavBuffer.byteLength.toString(),
          'X-Provider': 'cartesia',
          'X-Voice-Id': voiceId || 'default',
        },
      });
    } catch (cartesiaError) {
      console.warn('Cartesia TTS failed, falling back to OpenAI TTS:', cartesiaError);

      // Fallback to OpenAI TTS
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY!,
        });

        const mp3 = await openai.audio.speech.create({
          model: 'tts-1',
          voice: 'nova', // Warm, friendly voice similar to coach
          input: text,
          speed: 1.0,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': buffer.length.toString(),
            'X-Provider': 'openai-tts-fallback',
          },
        });
      } catch (openaiError) {
        console.error('OpenAI TTS fallback also failed:', openaiError);
        throw new Error('Both Cartesia and OpenAI TTS failed');
      }
    }
  } catch (error) {
    console.error('Voice synthesis error:', error);
    return NextResponse.json(
      {
        error: 'Synthesis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/voice/cartesia-tts/stream
 * Streaming TTS endpoint for real-time playback
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get('text');
  const voiceId = searchParams.get('voiceId') || undefined;

  if (!text) {
    return NextResponse.json(
      { error: 'No text provided' },
      { status: 400 }
    );
  }

  try {
    const cartesiaTTS = new CartesiaTTS();
    await cartesiaTTS.initialize();

    // Create readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream audio chunks
          for await (const chunk of cartesiaTTS.synthesizeStream(text, voiceId)) {
            controller.enqueue(chunk);
          }

          cartesiaTTS.close();
          controller.close();
        } catch (error) {
          console.error('Streaming synthesis error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'audio/wav',
        'Transfer-Encoding': 'chunked',
        'X-Provider': 'cartesia-stream',
      },
    });
  } catch (error) {
    console.error('Streaming setup error:', error);
    return NextResponse.json(
      {
        error: 'Streaming failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
