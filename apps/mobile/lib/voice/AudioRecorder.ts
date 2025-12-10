/**
 * Audio Recorder using expo-av
 * Handles audio recording with proper configuration for Whisper API
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface RecordingConfig {
  android: {
    extension: string;
    outputFormat: number;
    audioEncoder: number;
    sampleRate: number;
    numberOfChannels: number;
    bitRate: number;
  };
  ios: {
    extension: string;
    outputFormat: number;
    audioQuality: number;
    sampleRate: number;
    numberOfChannels: number;
    bitRate: number;
    linearPCMBitDepth?: number;
    linearPCMIsBigEndian?: boolean;
    linearPCMIsFloat?: boolean;
  };
}

export interface AudioLevel {
  timestamp: number;
  level: number; // 0-1, normalized RMS value
}

export class AudioRecorder {
  private recording: Audio.Recording | null = null;
  private isRecording = false;
  private audioLevels: AudioLevel[] = [];
  private meteringInterval: NodeJS.Timeout | null = null;

  // Recording configuration optimized for Whisper API (16kHz, mono, AAC)
  private readonly recordingConfig: RecordingConfig = {
    android: {
      extension: '.m4a',
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 16000, // 16kHz for Whisper
      numberOfChannels: 1, // Mono
      bitRate: 128000,
    },
    ios: {
      extension: '.m4a',
      outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 16000, // 16kHz for Whisper
      numberOfChannels: 1, // Mono
      bitRate: 128000,
    },
  };

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting microphone permissions:', error);
      return false;
    }
  }

  /**
   * Check if microphone permissions are granted
   */
  async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking microphone permissions:', error);
      return false;
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    try {
      // Check permissions first
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Microphone permission not granted');
        }
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create new recording
      const { recording } = await Audio.Recording.createAsync(
        Platform.OS === 'ios'
          ? this.recordingConfig.ios
          : this.recordingConfig.android,
        this.onRecordingStatusUpdate.bind(this),
        100 // Update interval in ms
      );

      this.recording = recording;
      this.isRecording = true;
      this.audioLevels = [];

      // Start monitoring audio levels for VAD
      this.startMetering();

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and return audio data
   */
  async stopRecording(): Promise<{
    uri: string;
    data: ArrayBuffer;
    duration: number;
  }> {
    try {
      if (!this.recording || !this.isRecording) {
        throw new Error('No active recording');
      }

      // Stop metering
      this.stopMetering();

      // Stop recording
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();

      this.isRecording = false;

      if (!uri) {
        throw new Error('Recording URI is null');
      }

      // Read file as base64 and convert to ArrayBuffer
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;

      // Clean up
      this.recording = null;

      console.log('Recording stopped, duration:', status.durationMillis);

      return {
        uri,
        data: arrayBuffer,
        duration: status.durationMillis || 0,
      };
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.isRecording = false;
      this.recording = null;
      throw error;
    }
  }

  /**
   * Cancel recording without saving
   */
  async cancelRecording(): Promise<void> {
    try {
      if (this.recording) {
        this.stopMetering();
        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();

        // Delete the recording file
        if (uri) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }

        this.recording = null;
        this.isRecording = false;
        console.log('Recording cancelled');
      }
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  }

  /**
   * Get current audio level (0-1)
   */
  getCurrentLevel(): number {
    if (this.audioLevels.length === 0) {
      return 0;
    }
    return this.audioLevels[this.audioLevels.length - 1].level;
  }

  /**
   * Get audio levels history
   */
  getAudioLevels(): AudioLevel[] {
    return [...this.audioLevels];
  }

  /**
   * Check if currently recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Recording status update callback
   */
  private onRecordingStatusUpdate(status: Audio.RecordingStatus): void {
    if (status.isRecording && status.metering !== undefined) {
      // Normalize metering value (-160 to 0 dB) to 0-1 range
      // -60 dB is considered silence, 0 dB is max volume
      const dbValue = status.metering;
      const normalizedLevel = Math.max(0, Math.min(1, (dbValue + 60) / 60));

      this.audioLevels.push({
        timestamp: Date.now(),
        level: normalizedLevel,
      });

      // Keep only last 50 samples (5 seconds at 100ms intervals)
      if (this.audioLevels.length > 50) {
        this.audioLevels.shift();
      }
    }
  }

  /**
   * Start monitoring audio levels
   */
  private startMetering(): void {
    // Metering is handled by expo-av via onRecordingStatusUpdate
    // This method is kept for consistency and future enhancements
  }

  /**
   * Stop monitoring audio levels
   */
  private stopMetering(): void {
    if (this.meteringInterval) {
      clearInterval(this.meteringInterval);
      this.meteringInterval = null;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.cancelRecording();
      }
      this.audioLevels = [];
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Singleton instance
let recorderInstance: AudioRecorder | null = null;

/**
 * Get singleton AudioRecorder instance
 */
export function getAudioRecorder(): AudioRecorder {
  if (!recorderInstance) {
    recorderInstance = new AudioRecorder();
  }
  return recorderInstance;
}
