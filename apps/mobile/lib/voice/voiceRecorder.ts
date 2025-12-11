import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

export interface VoiceRecordingConfig {
  sampleRate: number;
  numberOfChannels: number;
  bitRate: number;
  extension: string;
}

export const DEFAULT_RECORDING_CONFIG: VoiceRecordingConfig = {
  sampleRate: 16000, // Whisper prefers 16kHz
  numberOfChannels: 1, // Mono
  bitRate: 128000,
  extension: '.wav',
};

export class VoiceRecorder {
  private recording: Audio.Recording | null = null;
  private isRecording = false;
  private recordingUri: string | null = null;

  async initialize(): Promise<void> {
    // Request audio recording permissions
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Audio recording permission not granted');
    }

    // Configure audio mode for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }

  async startRecording(config: VoiceRecordingConfig = DEFAULT_RECORDING_CONFIG): Promise<void> {
    if (this.isRecording) {
      console.warn('Already recording');
      return;
    }

    try {
      console.log('🎤 Starting audio recording...');

      // Create new recording
      this.recording = new Audio.Recording();

      await this.recording.prepareToRecordAsync({
        android: {
          extension: config.extension,
          sampleRate: config.sampleRate,
          numberOfChannels: config.numberOfChannels,
          bitRate: config.bitRate,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        },
        ios: {
          extension: config.extension,
          sampleRate: config.sampleRate,
          numberOfChannels: config.numberOfChannels,
          bitRate: config.bitRate,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: config.bitRate,
        },
      });

      await this.recording.startAsync();
      this.isRecording = true;
      console.log('🎤 Recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.recording = null;
      throw error;
    }
  }

  async stopRecording(): Promise<{ uri: string; durationMs: number }> {
    if (!this.isRecording || !this.recording) {
      throw new Error('Not currently recording');
    }

    try {
      console.log('🎤 Stopping recording...');
      const status = await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      this.isRecording = false;
      this.recordingUri = uri;
      this.recording = null;

      if (!uri) {
        throw new Error('Recording URI is null');
      }

      console.log(`🎤 Recording stopped. URI: ${uri}, Duration: ${status.durationMillis}ms`);

      return {
        uri,
        durationMs: status.durationMillis,
      };
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  async getRecordingData(uri: string): Promise<Uint8Array> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error(`Recording file does not exist: ${uri}`);
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to Uint8Array
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return bytes;
    } catch (error) {
      console.error('Failed to read recording data:', error);
      throw error;
    }
  }

  async deleteRecording(uri: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      console.log(`🗑️ Deleted recording: ${uri}`);
    } catch (error) {
      console.error('Failed to delete recording:', error);
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  async cleanup(): Promise<void> {
    if (this.isRecording && this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }

    this.recording = null;
    this.isRecording = false;

    if (this.recordingUri) {
      await this.deleteRecording(this.recordingUri);
      this.recordingUri = null;
    }
  }
}
