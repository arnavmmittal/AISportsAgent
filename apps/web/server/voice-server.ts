#!/usr/bin/env node
/**
 * Voice WebSocket Server
 * Standalone server for real-time voice chat with Whisper STT + Cartesia TTS
 *
 * Run: node server/voice-server.ts
 * Port: 8000 (configurable via VOICE_PORT env var)
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { CartesiaClient } from '@cartesia/cartesia-js';
import { createServer } from 'http';

const PORT = process.env.VOICE_PORT || 8000;

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({
  server,
  path: '/api/voice/stream' // Match mobile client's expected path
});

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const cartesia = new CartesiaClient({
  apiKey: process.env.CARTESIA_API_KEY!,
});

interface VoiceMessage {
  type: 'start' | 'audio' | 'utterance_end' | 'stop';
  sessionId?: string;
  athleteId?: string;
}

interface VoiceResponse {
  type: 'started' | 'transcript' | 'response' | 'error' | 'crisis_alert';
  sessionId?: string;
  text?: string;
  isFinal?: boolean;
  message?: string;
  severity?: string;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'voice-websocket' });
});

// WebSocket connection handler
wss.on('connection', (ws: WebSocket) => {
  console.log('[Voice WS] Client connected');

  let sessionId: string | null = null;
  let athleteId: string | null = null;
  let audioChunks: Buffer[] = [];

  ws.on('message', async (data: Buffer) => {
    try {
      // Try to parse as JSON (control messages)
      const text = data.toString('utf-8');

      try {
        const message: VoiceMessage = JSON.parse(text);

        switch (message.type) {
          case 'start':
            sessionId = message.sessionId || `session_${Date.now()}`;
            athleteId = message.athleteId!;

            console.log('[Voice WS] Session started:', { sessionId, athleteId });

            const startResponse: VoiceResponse = {
              type: 'started',
              sessionId,
            };
            ws.send(JSON.stringify(startResponse));
            break;

          case 'utterance_end':
            // User stopped speaking - process accumulated audio
            if (audioChunks.length === 0) {
              console.log('[Voice WS] No audio chunks to process');
              break;
            }

            console.log('[Voice WS] Processing utterance with', audioChunks.length, 'chunks');

            // Combine audio chunks
            const fullAudio = Buffer.concat(audioChunks);
            audioChunks = []; // Reset

            // Transcribe with Whisper
            const transcript = await transcribeAudio(fullAudio);

            if (!transcript) {
              console.log('[Voice WS] Empty transcript');
              break;
            }

            console.log('[Voice WS] Transcript:', transcript);

            // Send transcript to client
            const transcriptResponse: VoiceResponse = {
              type: 'transcript',
              text: transcript,
              isFinal: true,
            };
            ws.send(JSON.stringify(transcriptResponse));

            // Get chat response
            const chatResponse = await getChatResponse(
              transcript,
              sessionId!,
              athleteId!
            );

            console.log('[Voice WS] Chat response:', chatResponse.text.substring(0, 50) + '...');

            // Send text response
            const textResponse: VoiceResponse = {
              type: 'response',
              text: chatResponse.text,
            };
            ws.send(JSON.stringify(textResponse));

            // Check for crisis
            if (chatResponse.crisisDetected) {
              const crisisResponse: VoiceResponse = {
                type: 'crisis_alert',
                severity: chatResponse.crisisSeverity,
                message: chatResponse.crisisMessage,
              };
              ws.send(JSON.stringify(crisisResponse));
            }

            // Generate TTS with Cartesia and stream to client
            await streamTTS(chatResponse.text, ws);

            console.log('[Voice WS] Response cycle complete');
            break;

          case 'stop':
            console.log('[Voice WS] Session stopped');
            ws.close();
            break;
        }
      } catch (jsonError) {
        // Not JSON - binary audio data
        audioChunks.push(data);
      }
    } catch (error) {
      console.error('[Voice WS] Error processing message:', error);
      const errorResponse: VoiceResponse = {
        type: 'error',
        message: error instanceof Error ? error.message : 'Processing error',
      };
      ws.send(JSON.stringify(errorResponse));
    }
  });

  ws.on('close', () => {
    console.log('[Voice WS] Client disconnected');
    audioChunks = [];
  });

  ws.on('error', (error) => {
    console.error('[Voice WS] WebSocket error:', error);
  });
});

/**
 * Transcribe audio using OpenAI Whisper
 */
async function transcribeAudio(audioBuffer: Buffer): Promise<string | null> {
  try {
    console.log('[Whisper] Transcribing', audioBuffer.length, 'bytes');

    // Create File object for OpenAI
    const file = new File([audioBuffer], 'audio.webm', {
      type: 'audio/webm',
    });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
    });

    return transcription.text.trim();
  } catch (error) {
    console.error('[Whisper] Transcription error:', error);
    return null;
  }
}

/**
 * Get chat response from the backend
 */
async function getChatResponse(
  message: string,
  sessionId: string,
  athleteId: string
): Promise<{
  text: string;
  crisisDetected: boolean;
  crisisSeverity?: string;
  crisisMessage?: string;
}> {
  try {
    // Call the chat API endpoint with service role auth
    const response = await fetch('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use internal service key for voice server authentication
        'x-voice-service-key': process.env.VOICE_SERVICE_KEY || 'dev-voice-service-key',
      },
      body: JSON.stringify({
        session_id: sessionId,
        athlete_id: athleteId,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.statusText}`);
    }

    // Parse SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    let fullText = '';
    let crisisDetected = false;
    let crisisSeverity: string | undefined;
    let crisisMessage: string | undefined;

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'token') {
              fullText += data.data.content;
            } else if (data.type === 'content') {
              fullText = data.data.content;
            } else if (data.type === 'crisis_alert') {
              crisisDetected = true;
              crisisSeverity = data.data.severity;
              crisisMessage = data.data.message;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    return {
      text: fullText || "I'm here to support you. What's on your mind?",
      crisisDetected,
      crisisSeverity,
      crisisMessage,
    };
  } catch (error) {
    console.error('[Chat] Error getting response:', error);
    return {
      text: "I'm having trouble processing that right now. Could you try again?",
      crisisDetected: false,
    };
  }
}

/**
 * Generate and stream TTS audio with Cartesia
 */
async function streamTTS(text: string, ws: WebSocket): Promise<void> {
  try {
    console.log('[Cartesia] Generating TTS...');

    const response = await cartesia.tts.bytes({
      modelId: 'sonic-english',
      transcript: text,
      voice: {
        mode: 'id',
        id: '694f9389-aac1-45b6-b726-9d9369183238', // British Lady - warm, professional
      },
      outputFormat: {
        container: 'wav',
        encoding: 'pcm_s16le',
        sampleRate: 22050,
      },
    });

    console.log('[Cartesia] Streaming audio to client...');

    // Cartesia returns a Readable stream - collect chunks
    const chunks: Buffer[] = [];

    for await (const chunk of response) {
      chunks.push(Buffer.from(chunk));
    }

    const audioData = Buffer.concat(chunks);

    // Send audio as binary
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(audioData);
      console.log('[Cartesia] Audio sent:', audioData.byteLength, 'bytes');
    }
  } catch (error) {
    console.error('[Cartesia] TTS error:', error);
    // Send error to client
    const errorResponse: VoiceResponse = {
      type: 'error',
      message: 'Failed to generate voice response',
    };
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`\n🎙️  Voice WebSocket Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   WebSocket: ws://localhost:${PORT}/api/voice/stream\n`);

  // Check API keys
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not set');
  }
  if (!process.env.CARTESIA_API_KEY) {
    console.warn('⚠️  WARNING: CARTESIA_API_KEY not set');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down voice server...');
  server.close(() => {
    console.log('✅ Voice server stopped');
    process.exit(0);
  });
});
