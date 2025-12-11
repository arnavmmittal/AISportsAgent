import { Audio } from 'expo-av';
import { VoiceRecorder } from './voiceRecorder';

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
          } else if (event.data instanceof Blob) {
            // Binary audio data (TTS response)
            console.log('🔊 Received audio chunk');
            const arrayBuffer = await event.data.arrayBuffer();
            const audioData = new Uint8Array(arrayBuffer);
            this.audioQueue.push(audioData);
            this.playAudioQueue();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
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

      // Send audio data to server
      console.log(`📤 Sending audio data: ${audioData.byteLength} bytes`);
      this.ws?.send(audioData.buffer);

      // Send utterance_end signal
      const utteranceEnd: VoiceMessage = {
        type: 'utterance_end',
      };
      console.log('📤 Sending utterance_end signal');
      this.ws?.send(JSON.stringify(utteranceEnd));

      // Clean up recording file
      await this.recorder.deleteRecording(uri);

      console.log('✅ Audio sent successfully');
    } catch (error) {
      console.error('Failed to stop recording and send audio:', error);
      throw error;
    }
  }

  private async playAudioQueue(): Promise<void> {
    if (this.isPlayingAudio || this.audioQueue.length === 0) {
      return;
    }

    this.isPlayingAudio = true;

    try {
      // Switch audio mode to playback
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

        // Create a blob from audio data
        const blob = new Blob([audioData], { type: 'audio/mpeg' });

        // For mobile, we need to convert blob to base64 and play using expo-av
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to convert to base64'));
            }
          };
          reader.onerror = reject;
        });

        reader.readAsDataURL(blob);
        const base64Audio = await base64Promise;

        // Play audio using expo-av
        const { sound } = await Audio.Sound.createAsync(
          { uri: base64Audio },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
            }
          }
        );

        this.sound = sound;

        // Wait for audio to finish
        await new Promise<void>((resolve) => {
          const checkStatus = async () => {
            const status = await sound.getStatusAsync();
            if (status.isLoaded && status.didJustFinish) {
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
      console.error('Error playing audio:', error);
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
        console.error('Failed to restore audio mode:', e);
      }
    } finally {
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
