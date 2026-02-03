/**
 * Voice Module
 *
 * Provides voice input/output capabilities:
 * - VoiceManager: Browser-based audio recording and playback
 * - ElevenLabs: Text-to-speech synthesis
 * - Voice Client: API client for voice services
 */

// Browser-based audio handling
export { VoiceManager } from './VoiceManager';
export type { VoiceState, VoiceConfig, AudioChunk } from './VoiceManager';

// ElevenLabs TTS utilities (for server-side use)
export {
  VOICES,
  VOICE_PRESETS,
  textToSpeech,
  streamTextToSpeech,
  getAvailableVoices as getElevenLabsVoices,
  selectVoicePreset,
} from './elevenlabs';
export type { VoiceId, VoicePreset, ElevenLabsConfig } from './elevenlabs';

// Client-side API calls
export {
  synthesizeSpeech,
  transcribeAudio,
  getVoiceStatus,
  getAvailableVoices,
  playAudioBlob,
  blobToArrayBuffer,
  speakText,
} from './voice-client';
export type {
  VoiceSynthesizeRequest,
  VoiceTranscribeResponse,
  VoiceStatusResponse,
  VoiceInfo,
  VoicePresetInfo,
} from './voice-client';
