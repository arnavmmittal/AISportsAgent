import { Audio } from 'expo-av';
import { Paths, File } from 'expo-file-system';
import { VoiceRecorder } from './voiceRecorder';
import { transcribeAudio, WHISPER_PRESETS } from '../services/whisper';
import { textToSpeech, VOICE_PRESETS } from '../services/elevenlabs';

export interface VoiceMessage {
  type: 'start' | 'utterance_end' | 'stop' | 'transcript' | 'response' | 'error' | 'started' | 'crisis_alert';
  sessionId?: string;
  athleteId?: string;
  text?: string;
  isFinal?: boolean;
  message?: string;
  severity?: string;
}

export interface VoiceWebSocketConfig {
  wsUrl: string;
  sessionId: string;
  athleteId: string;
  onTranscript?: (transcript: string) => void;
  onResponse?: (response: string) => void;
  onError?: (error: string) => void;
  onCrisisAlert?: (severity: string, message: string) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export class VoiceWebSocketClient {
  private ws: WebSocket | null = null;
  private config: VoiceWebSocketConfig;
  private recorder: VoiceRecorder;
  private sound: Audio.Sound | null = null;
  private isConnected = false;
  private audioQueue: Uint8Array[] = [];
  private isPlayingAudio = false;

  constructor(config: VoiceWebSocketConfig) {
    this.config = config;
    this.recorder = new VoiceRecorder();
  }

  async connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(`🔌 Connecting to WebSocket: ${this.config.wsUrl}`);

        // Initialize audio recorder (this sets allowsRecordingIOS: true)
        await this.recorder.initialize();

        this.ws = new WebSocket(this.config.wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');

          // Send handshake
          const handshake: VoiceMessage = {
            type: 'start',
            sessionId: this.config.sessionId,
            athleteId: this.config.athleteId,
          };

          console.log('📤 Sending handshake:', handshake);
          this.ws?.send(JSON.stringify(handshake));
        };

        this.ws.onmessage = async (event) => {
          if (typeof event.data === 'string') {
            // JSON message (transcript, response, error, etc.)
            try {
              const message: VoiceMessage = JSON.parse(event.data);
              console.log('📥 Received message:', message.type);

              switch (message.type) {
                case 'started':
                  console.log('✅ Voice session started');
                  this.isConnected = true;
                  this.config.onConnectionChange?.(true);
                  resolve();
                  break;

                case 'transcript':
                  if (message.text && message.isFinal) {
                    console.log('📝 Transcript:', message.text);
                    this.config.onTranscript?.(message.text);
                  }
                  break;

                case 'response':
                  if (message.text) {
                    console.log('💬 Response:', message.text);
                    this.config.onResponse?.(message.text);

                    // Generate TTS audio using ElevenLabs
                    try {
                      console.log('🔊 Generating TTS audio...');
                      const audioData = await textToSpeech(message.text, VOICE_PRESETS.default);
                      console.log(`✅ TTS audio generated: ${audioData.byteLength} bytes`);

                      // Add to audio queue for playback
                      this.audioQueue.push(new Uint8Array(audioData));
                      this.playAudioQueue();
                    } catch (error) {
                      console.error('Failed to generate TTS audio:', error);
                      // Continue without audio if TTS fails
                    }
                  }
                  break;

                case 'crisis_alert':
                  console.warn('⚠️ Crisis alert:', message.severity);
                  this.config.onCrisisAlert?.(message.severity || 'unknown', message.message || '');
                  break;

                case 'error':
                  console.error('❌ Server error:', message.message);
                  this.config.onError?.(message.message || 'Unknown error');
                  break;
              }
            } catch (error) {
              console.error('Failed to parse message:', error);
            }
          } else {
            // Binary audio data (TTS response)
            // In React Native, binary data comes as various types
            console.log('🔊 Received audio data, type:', typeof event.data, 'constructor:', event.data?.constructor?.name);

            let audioData: Uint8Array;

            if (event.data instanceof Blob) {
              console.log('📦 Audio is Blob, size:', event.data.size);
              const arrayBuffer = await event.data.arrayBuffer();
              audioData = new Uint8Array(arrayBuffer);
            } else if (event.data instanceof ArrayBuffer) {
              console.log('📦 Audio is ArrayBuffer, size:', event.data.byteLength);
              audioData = new Uint8Array(event.data);
            } else if (typeof event.data === 'object' && event.data !== null) {
              console.log('📦 Audio is object, attempting to convert');
              // Try to handle as array-like object
              audioData = new Uint8Array(event.data);
            } else {
              console.error('❌ Unknown binary data type:', typeof event.data);
              return;
            }

            console.log(`✅ Audio data processed: ${audioData.byteLength} bytes`);
            this.audioQueue.push(audioData);
            this.playAudioQueue();
          }
        };

        this.ws.onerror = (error) => {
          // Silent error logging - voice is optional
          this.config.onError?.('WebSocket connection error');
          this.isConnected = false;
          this.config.onConnectionChange?.(false);
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket closed');
          this.isConnected = false;
          this.config.onConnectionChange?.(false);
        };

        // Timeout for connection
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      } catch (error) {
        console.error('Failed to connect:', error);
        reject(error);
      }
    });
  }

  async startRecording(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    console.log('🎤 Starting voice recording...');
    await this.recorder.startRecording();
  }

  async stopRecording(): Promise<void> {
    if (!this.recorder.getIsRecording()) {
      console.warn('Not currently recording');
      return;
    }

    try {
      console.log('🛑 Stopping voice recording...');

      // Stop recording and get audio file
      const { uri } = await this.recorder.stopRecording();

      // Read recording data
      const audioData = await this.recorder.getRecordingData(uri);

      console.log(`🎤 Transcribing audio: ${audioData.byteLength} bytes`);

      // Transcribe audio using Whisper STT
      const transcript = await transcribeAudio(audioData, WHISPER_PRESETS.highAccuracy);

      console.log(`📝 Transcription result: "${transcript}"`);

      // Send transcript to server instead of raw audio
      const transcriptMessage: VoiceMessage = {
        type: 'transcript',
        text: transcript,
        isFinal: true,
      };
      console.log('📤 Sending transcript to server');
      this.ws?.send(JSON.stringify(transcriptMessage));

      // Clean up recording file
      await this.recorder.deleteRecording(uri);

      console.log('✅ Transcription sent successfully');

      // Notify transcript callback
      this.config.onTranscript?.(transcript);
    } catch (error) {
      console.error('Failed to stop recording and transcribe audio:', error);
      throw error;
    }
  }

  private async playAudioQueue(): Promise<void> {
    if (this.isPlayingAudio || this.audioQueue.length === 0) {
      console.log(`🔇 Skipping playback: isPlaying=${this.isPlayingAudio}, queueLength=${this.audioQueue.length}`);
      return;
    }

    console.log('🎵 Starting audio playback...');
    this.isPlayingAudio = true;

    try {
      // Switch audio mode to playback
      console.log('🔊 Setting audio mode to playback');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      while (this.audioQueue.length > 0) {
        const audioData = this.audioQueue.shift();
        if (!audioData) continue;

        console.log(`🎶 Processing audio chunk: ${audioData.byteLength} bytes`);

        // Convert ArrayBuffer to base64
        let base64String = '';
        const bytes = new Uint8Array(audioData);
        const chunkSize = 0x8000; // Process in chunks to avoid stack overflow

        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
          base64String += String.fromCharCode.apply(null, Array.from(chunk));
        }

        console.log('✅ Converted audio chunks, creating audio file...');

        // Write to temporary file using new File API
        // ElevenLabs returns MP3 format
        const file = new File(Paths.cache, `voice_response_${Date.now()}.mp3`);
        console.log('📝 Writing audio to file:', file.uri);

        // Create file and write audio data
        await file.create();
        const uint8Array = new Uint8Array(audioData);
        await file.write(uint8Array);

        console.log('🎧 Creating audio sound from file...');
        // Play audio using expo-av
        const { sound } = await Audio.Sound.createAsync(
          { uri: file.uri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded && status.didJustFinish) {
              console.log('✅ Audio finished playing');
              sound.unloadAsync();
              // Clean up temp file
              try {
                file.delete();
              } catch (err: any) {
                console.warn('Failed to delete temp audio file:', err);
              }
            }
          }
        );

        console.log('▶️ Audio sound created, playing...');
        this.sound = sound;

        // Wait for audio to finish
        await new Promise<void>((resolve) => {
          const checkStatus = async () => {
            const status = await sound.getStatusAsync();
            if (status.isLoaded && status.didJustFinish) {
              console.log('🎵 Audio playback complete');
              resolve();
            } else {
              setTimeout(checkStatus, 100);
            }
          };
          checkStatus();
        });
      }

      // Switch back to recording mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('❌ Error playing audio:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Try to restore recording mode even on error
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.error('❌ Failed to restore audio mode:', e);
      }
    } finally {
      console.log('🎵 Audio playback finished, resetting flag');
      this.isPlayingAudio = false;
    }
  }

  disconnect(): void {
    console.log('🔌 Disconnecting WebSocket...');

    if (this.ws) {
      const stopMessage: VoiceMessage = {
        type: 'stop',
      };
      this.ws.send(JSON.stringify(stopMessage));
      this.ws.close();
      this.ws = null;
    }

    if (this.sound) {
      this.sound.unloadAsync();
      this.sound = null;
    }

    this.recorder.cleanup();
    this.isConnected = false;
    this.audioQueue = [];
    this.config.onConnectionChange?.(false);
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getIsRecording(): boolean {
    return this.recorder.getIsRecording();
  }
}
