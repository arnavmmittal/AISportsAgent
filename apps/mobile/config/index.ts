/**
 * Mobile App Configuration
 *
 * Centralized configuration that reads from environment variables.
 * This allows easy switching between home/girlfriend's place without code changes.
 *
 * Setup:
 * 1. Copy .env.example to .env.local
 * 2. Update EXPO_PUBLIC_API_URL with your current local IP
 * 3. To find your IP on Mac: `ipconfig getifaddr en0`
 * 4. On Windows: `ipconfig` and look for IPv4 Address
 *
 * Voice: Uses HTTP endpoints at /api/voice/* (OpenAI Whisper STT + ElevenLabs TTS)
 */

// Environment variables are accessed via process.env in Expo
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Fallback to auto-detected local IP if env var not set
// This uses Expo's built-in development server IP detection
const getLocalIP = (): string => {
  // In Expo, Constants.manifest?.debuggerHost gives you the dev server IP
  // We can extract the IP from it
  if (__DEV__ && !API_URL.includes('://')) {
    // Try to auto-detect from Expo's dev server
    try {
      const Constants = require('expo-constants').default;
      const debuggerHost = Constants.manifest?.debuggerHost;
      if (debuggerHost) {
        const ip = debuggerHost.split(':')[0];
        return `http://${ip}:3000`;
      }
    } catch (e) {
      console.warn('Could not auto-detect local IP, using fallback');
    }
  }
  return API_URL;
};

export const config = {
  // API configuration - all endpoints including voice are on the same host
  apiUrl: getLocalIP(),

  // Voice API endpoints (HTTP-based, not WebSocket)
  // - POST /api/voice/transcribe - Speech-to-text (OpenAI Whisper)
  // - POST /api/voice/synthesize - Text-to-speech (ElevenLabs)
  // - GET  /api/voice/voices - Available voices
  // - GET  /api/voice/status - Voice service status

  // Supabase configuration
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  },

  // Environment info
  isDev: __DEV__,
  isProduction: !__DEV__,
};

// Validation
if (__DEV__ && !process.env.EXPO_PUBLIC_API_URL) {
  console.warn(
    '\n⚠️  EXPO_PUBLIC_API_URL not set in .env.local\n' +
    'Using auto-detected IP or localhost.\n' +
    'For better reliability:\n' +
    '1. Copy .env.example to .env.local\n' +
    '2. Set EXPO_PUBLIC_API_URL to your computer\'s IP\n' +
    '3. Find IP with: ipconfig getifaddr en0 (Mac) or ipconfig (Windows)\n'
  );
}

// Log configuration in development
if (__DEV__) {
  console.log('📱 Mobile App Configuration:');
  console.log('  API URL:', config.apiUrl);
  console.log('  Voice API: HTTP endpoints at /api/voice/*');
  console.log('  Environment:', config.isDev ? 'Development' : 'Production');
}

export default config;
