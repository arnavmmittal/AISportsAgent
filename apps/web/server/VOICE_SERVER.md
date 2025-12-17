# Voice WebSocket Server

Real-time voice chat server with Whisper STT + Cartesia TTS for athlete conversations.

## Features

- **Speech-to-Text**: OpenAI Whisper for accurate transcription
- **Text-to-Speech**: Cartesia for natural, low-latency voice synthesis
- **Real-time**: WebSocket-based bidirectional streaming
- **Crisis Detection**: Integrated with chat agent for safety monitoring

## Setup

### 1. Environment Variables

Add to your `.env.local`:

```bash
# OpenAI Whisper for STT
OPENAI_API_KEY=sk-...

# Cartesia for TTS
CARTESIA_API_KEY=your_cartesia_key_here

# Voice server port (optional, defaults to 8000)
VOICE_PORT=8000
```

### 2. Get Cartesia API Key

1. Sign up at https://cartesia.ai
2. Go to Dashboard → API Keys
3. Create a new API key
4. Copy to `.env.local`

## Running

### Development (Both servers)

```bash
npm run dev:all
```

This runs:
- Next.js on port 3000
- Voice server on port 8000

### Voice Server Only

```bash
npm run voice:dev
```

### Production

```bash
# Build and run Next.js
npm run build
npm run start

# Run voice server (in separate process)
tsx server/voice-server.ts
```

## Architecture

```
Client (Web/Mobile)
    ↓ WebSocket
Voice Server (port 8000)
    ↓ HTTP POST
Next.js API (port 3000)
    ↓ AgentOrchestrator
AthleteAgent + KnowledgeAgent + GovernanceAgent
```

### Flow

1. **Client** → Records audio → Sends binary chunks via WebSocket
2. **Voice Server** → Receives audio → Sends `utterance_end`
3. **Whisper** → Transcribes audio → Returns text
4. **Chat API** → Processes text → Returns response
5. **Cartesia** → Synthesizes TTS → Streams audio chunks
6. **Client** → Plays audio response

## WebSocket Protocol

### Client → Server Messages

#### Start Session
```json
{
  "type": "start",
  "sessionId": "session_123",
  "athleteId": "athlete_456"
}
```

#### Audio Chunk
Send raw binary audio data (WebM/Opus format)

#### End Utterance
```json
{
  "type": "utterance_end"
}
```

#### Stop Session
```json
{
  "type": "stop"
}
```

### Server → Client Messages

#### Session Started
```json
{
  "type": "started",
  "sessionId": "session_123"
}
```

#### Transcript
```json
{
  "type": "transcript",
  "text": "I'm feeling nervous about the game",
  "isFinal": true
}
```

#### Chat Response
```json
{
  "type": "response",
  "text": "It's natural to feel nervous..."
}
```

#### Audio Data
Binary MP3 audio chunk (play immediately)

#### Crisis Alert
```json
{
  "type": "crisis_alert",
  "severity": "HIGH",
  "message": "Athlete mentioned self-harm"
}
```

#### Error
```json
{
  "type": "error",
  "message": "Transcription failed"
}
```

## Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "ok",
  "service": "voice-websocket"
}
```

## Troubleshooting

### "OPENAI_API_KEY not set"
Add your OpenAI API key to `.env.local`

### "CARTESIA_API_KEY not set"
1. Sign up at https://cartesia.ai
2. Get API key from dashboard
3. Add to `.env.local`

### WebSocket connection fails
- Check voice server is running on port 8000
- Verify firewall allows WebSocket connections
- Check browser console for CORS errors

### No audio playback
- Ensure client has `AudioContext` initialized
- Check audio format is supported (MP3)
- Verify browser autoplay policy allows audio

### Poor transcription quality
- Increase audio recording quality
- Reduce background noise
- Speak clearly and at normal pace

## Voice Selection

Current voice: **British Lady** (ID: `694f9389-aac1-45b6-b726-9d9369183238`)
- Warm, professional tone
- Clear articulation
- Appropriate for sports psychology

To change voice, edit `voice-server.ts`:
```typescript
voice: {
  mode: 'id',
  id: 'YOUR_VOICE_ID_HERE',
}
```

Available voices: https://docs.cartesia.ai/voice-library

## Performance

- **Transcription**: ~500-1000ms (Whisper API)
- **Chat Response**: ~1-3s (depends on complexity)
- **TTS Generation**: ~200-500ms (Cartesia)
- **Total Latency**: ~2-5 seconds end-to-end

## Security

- WebSocket connections are unauthenticated (add auth in production)
- Audio data is not stored (ephemeral)
- Chat conversations are saved to database
- Crisis alerts trigger coach notifications

## Production Deployment

### Option 1: Same Server
Run voice server alongside Next.js using PM2:

```bash
pm2 start npm --name "nextjs" -- start
pm2 start tsx --name "voice" -- server/voice-server.ts
```

### Option 2: Separate Server
Deploy voice server to dedicated instance:

```bash
# On voice server instance
export OPENAI_API_KEY=...
export CARTESIA_API_KEY=...
export VOICE_PORT=8000
node server/voice-server.ts
```

Update client to point to voice server URL:
```typescript
const ws = new WebSocket('wss://voice.yourdomain.com');
```

### Option 3: Serverless WebSocket (AWS, GCP)
Use managed WebSocket services:
- AWS API Gateway WebSocket
- Google Cloud Run WebSocket
- Azure SignalR Service

## Monitoring

Add logging/monitoring:
```typescript
// In voice-server.ts
console.log('[Metrics]', {
  transcriptionTime: time,
  chatResponseTime: time,
  ttsGenerationTime: time,
  totalLatency: time,
});
```

## Future Enhancements

- [ ] Voice Activity Detection (VAD) for automatic utterance detection
- [ ] Streaming TTS (chunk-by-chunk audio)
- [ ] Multiple voice options per athlete preference
- [ ] Background noise suppression
- [ ] Real-time emotion detection
- [ ] Conversation summaries
- [ ] Voice authentication
