# ElevenLabs Voice Setup

This guide explains how to set up and customize ElevenLabs for high-quality text-to-speech in the voice chat feature.

---

## Why ElevenLabs?

**ElevenLabs provides the highest quality, most natural-sounding AI voices available:**

- ✅ **Superior clarity** - Crystal clear pronunciation, perfect for important mental health conversations
- ✅ **Natural emotion** - Voices sound genuinely human with appropriate emotional expression
- ✅ **Consistent quality** - Reliable, production-grade speech synthesis
- ✅ **Speaker boost** - Enhanced clarity feature for better comprehension
- ✅ **Multilingual support** - Great for international athletes

Perfect for mental performance coaching where tone, warmth, and clarity matter.

---

## Setup Instructions

### 1. Get Your API Key

1. Go to https://elevenlabs.io
2. Sign up for an account (Free tier: 10,000 characters/month)
3. Navigate to **Profile → API Key**
4. Copy your API key
5. Add to `apps/web/.env.local`:

```bash
ELEVENLABS_API_KEY=your_api_key_here
```

### 2. Choose a Voice

The voice server currently uses **Rachel** - a warm, clear, professional female voice ideal for coaching.

**To change voices**, update the voice ID in `apps/web/server/voice-server.ts`:

```typescript
const audioStream = await elevenlabs.textToSpeech.convert(
  'EXAVITQu4vr4xnSDxMaL', // <- Change this voice ID
  {
    // ... settings
  }
);
```

---

## Recommended Voices for Sports Psychology Coaching

### Female Voices

| Voice | ID | Description | Best For |
|-------|-----|-------------|----------|
| **Rachel** (Current) | `EXAVITQu4vr4xnSDxMaL` | Warm, clear, professional | General coaching, supportive conversations |
| **Domi** | `AZnzlk1XvdvUeBnXmlld` | Energetic, confident | Motivation, performance discussions |
| **Bella** | `EXAVITQu4vr4xnSDxMaL` | Soft, empathetic | Anxiety, stress management |
| **Elli** | `MF3mGyEYCl7XYWbV9V6O` | Calm, soothing | Mindfulness, relaxation exercises |

### Male Voices

| Voice | ID | Description | Best For |
|-------|-----|-------------|----------|
| **Adam** | `pNInz6obpgDQGcFmaJgB` | Deep, authoritative | Leadership, confidence building |
| **Antoni** | `ErXwobaYiN019PkySvjV` | Warm, encouraging | General coaching, team dynamics |
| **Josh** | `TxGEqnHWrfWFTfGW9XjX` | Energetic, motivational | Pre-game prep, performance talks |
| **Arnold** | `VR6AewLTigWG4xSOukaG` | Strong, confident | Mental toughness, resilience |

### How to Find More Voices

1. Visit https://elevenlabs.io/voice-library
2. Preview voices
3. Click on a voice to see its **Voice ID**
4. Copy the ID and update the code

---

## Voice Settings Explained

The current configuration in `voice-server.ts`:

```typescript
voice_settings: {
  stability: 0.5,              // Balance consistency vs expressiveness
  similarity_boost: 0.75,      // How much to match the original voice
  style: 0.5,                  // Speaking style intensity
  use_speaker_boost: true,     // Enhance clarity (RECOMMENDED)
}
```

### Tuning Parameters

#### Stability (0.0 - 1.0)
- **Low (0.2-0.4)**: More expressive, emotional, varied intonation
  - *Good for*: Motivational talks, empathetic responses
- **Medium (0.5)**: Balanced (CURRENT SETTING)
  - *Good for*: General coaching
- **High (0.7-0.9)**: Very consistent, stable, predictable
  - *Good for*: Factual information, instructions

#### Similarity Boost (0.0 - 1.0)
- **Low (0.3-0.5)**: More generic, less like original voice
- **Medium (0.75)**: Close to original (CURRENT SETTING)
- **High (0.9-1.0)**: Very close to original voice
  - *Recommended*: 0.75 for best balance

#### Style (0.0 - 1.0)
- **Low (0.0-0.3)**: Neutral, less expressive
- **Medium (0.5)**: Moderate expression (CURRENT SETTING)
- **High (0.7-1.0)**: Very expressive, dramatic
  - *Good for*: Storytelling, emotional support

#### Speaker Boost
- **true**: Enhances clarity and audio quality (RECOMMENDED)
- **false**: Standard quality

### Example Configurations

**For Anxiety/Crisis Support** (Calm, empathetic):
```typescript
voice_settings: {
  stability: 0.7,              // Very stable, reassuring
  similarity_boost: 0.75,
  style: 0.3,                  // Less dramatic, more neutral
  use_speaker_boost: true,
}
```

**For Motivation/Performance** (Energetic, inspiring):
```typescript
voice_settings: {
  stability: 0.3,              // More expressive
  similarity_boost: 0.75,
  style: 0.8,                  // Very expressive
  use_speaker_boost: true,
}
```

**For Instructions/Techniques** (Clear, factual):
```typescript
voice_settings: {
  stability: 0.8,              // Very consistent
  similarity_boost: 0.75,
  style: 0.2,                  // Neutral tone
  use_speaker_boost: true,
}
```

---

## Pricing

### Free Tier
- **10,000 characters/month**
- ~30-50 voice responses
- Good for testing

### Starter ($5/month)
- **30,000 characters/month**
- ~90-150 responses
- Good for MVP/small user base

### Creator ($22/month)
- **100,000 characters/month**
- ~300-500 responses
- Good for moderate usage

### Pro ($99/month)
- **500,000 characters/month**
- ~1,500-2,500 responses
- Good for production

**Estimate**: Average response is ~200 characters. For 100 athletes with 5 voice sessions/month = ~100,000 chars = Creator tier.

---

## Advanced: Voice Cloning

ElevenLabs allows you to **clone specific voices**:

1. Upload 1-5 minutes of audio samples
2. Train a custom voice
3. Use the custom voice ID in your app

**Use case**: Clone your actual sports psychologist's voice for brand consistency.

---

## Testing Your Voice Setup

1. **Update API key** in `.env.local`
2. **Restart voice server**:
   ```bash
   pnpm voice:dev
   ```
3. **Test from mobile app** - Send a voice message
4. **Listen to response** - Should hear ElevenLabs voice
5. **Check logs** for:
   ```
   [ElevenLabs] Generating TTS...
   [ElevenLabs] Audio sent: XXXXX bytes
   ```

---

## Troubleshooting

### "ELEVENLABS_API_KEY not set"
- Add key to `apps/web/.env.local`
- Restart voice server

### "401 Unauthorized"
- Check API key is correct
- Verify account is active on elevenlabs.io

### "403 Quota Exceeded"
- Upgrade your ElevenLabs plan
- Check usage at elevenlabs.io/usage

### Audio not playing
- Mobile app expects MP3 format (already configured)
- Check mobile logs for audio playback errors

### Poor voice quality
- Try different voice IDs
- Adjust voice settings (stability, style)
- Enable speaker_boost if not already

---

## Migration from Cartesia

The voice server has been fully migrated from Cartesia to ElevenLabs:

| Feature | Cartesia | ElevenLabs |
|---------|----------|------------|
| Voice Quality | Good | Excellent ✅ |
| Naturalness | Moderate | Very High ✅ |
| Clarity | Good | Excellent ✅ |
| Latency | ~300ms | ~500-800ms |
| Cost | ~$0.05/1K chars | ~$0.30/1K chars |
| Format | WAV/MP3 | MP3 ✅ |

**Result**: Better voice quality for athletes, worth the slight cost increase.

---

## Further Customization

To make dynamic voice selection based on conversation type:

```typescript
// In voice-server.ts
function selectVoice(messageType: string): string {
  switch (messageType) {
    case 'crisis':
      return 'EXAVITQu4vr4xnSDxMaL'; // Rachel - calm, supportive
    case 'motivation':
      return 'pNInz6obpgDQGcFmaJgB'; // Adam - confident, energizing
    case 'relaxation':
      return 'MF3mGyEYCl7XYWbV9V6O'; // Elli - soothing, calm
    default:
      return 'EXAVITQu4vr4xnSDxMaL'; // Rachel - default
  }
}

// Use in streamTTS
const voiceId = selectVoice(conversationContext.type);
const audioStream = await elevenlabs.textToSpeech.convert(voiceId, { ... });
```

---

## Resources

- **ElevenLabs Docs**: https://docs.elevenlabs.io/
- **Voice Library**: https://elevenlabs.io/voice-library
- **API Reference**: https://docs.elevenlabs.io/api-reference/text-to-speech
- **Pricing**: https://elevenlabs.io/pricing
- **Support**: support@elevenlabs.io

---

**Last Updated**: 2025-12-19
