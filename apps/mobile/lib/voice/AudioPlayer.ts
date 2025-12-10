/**
 * Audio Player using expo-av
 * Handles queued playback of TTS audio chunks from WebSocket
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface AudioChunk {
  id: string;
  data: ArrayBuffer;
  timestamp: number;
}

export interface PlaybackStatus {
  isPlaying: boolean;
  isBuffering: boolean;
  currentChunkId: string | null;
  queueLength: number;
  position: number;
  duration: number;
}

export class AudioPlayer {
  private queue: AudioChunk[] = [];
  private currentSound: Audio.Sound | null = null;
  private isPlaying = false;
  private isProcessing = false;
  private currentChunkId: string | null = null;
  private playbackListeners: Array<(status: PlaybackStatus) => void> = [];

  constructor() {
    this.initAudioMode();
  }

  /**
   * Initialize audio mode for playback
   */
  private async initAudioMode(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Failed to set audio mode:', error);
    }
  }

  /**
   * Add audio chunk to playback queue
   */
  enqueue(data: ArrayBuffer, id?: string): void {
    const chunk: AudioChunk = {
      id: id || `chunk-${Date.now()}-${Math.random()}`,
      data,
      timestamp: Date.now(),
    };

    this.queue.push(chunk);
    this.notifyListeners();

    // Auto-start playback if not already playing
    if (!this.isPlaying && !this.isProcessing) {
      this.playNext();
    }
  }

  /**
   * Play next chunk in queue
   */
  private async playNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const chunk = this.queue.shift();
      if (!chunk) {
        this.isProcessing = false;
        return;
      }

      this.currentChunkId = chunk.id;
      this.notifyListeners();

      // Convert ArrayBuffer to base64
      const uint8Array = new Uint8Array(chunk.data);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);

      // Write to temporary file
      const fileUri = `${FileSystem.cacheDirectory}audio-chunk-${chunk.id}.mp3`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create and play sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true, volume: 1.0 },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.currentSound = sound;
      this.isPlaying = true;
      this.notifyListeners();

      console.log('Playing audio chunk:', chunk.id);
    } catch (error) {
      console.error('Error playing audio chunk:', error);
      this.isProcessing = false;
      this.currentChunkId = null;

      // Try to play next chunk despite error
      if (this.queue.length > 0) {
        this.playNext();
      } else {
        this.isPlaying = false;
        this.notifyListeners();
      }
    }
  }

  /**
   * Playback status update callback
   */
  private async onPlaybackStatusUpdate(status: AVPlaybackStatus): Promise<void> {
    if (!status.isLoaded) {
      return;
    }

    // When current chunk finishes, play next
    if (status.didJustFinish) {
      await this.cleanupCurrentSound();
      this.isProcessing = false;

      if (this.queue.length > 0) {
        // Play next chunk
        this.playNext();
      } else {
        // Queue is empty, stop playback
        this.isPlaying = false;
        this.currentChunkId = null;
        this.notifyListeners();
        console.log('Playback finished, queue empty');
      }
    }

    this.notifyListeners();
  }

  /**
   * Stop playback and clear queue
   */
  async stop(): Promise<void> {
    try {
      this.queue = [];
      await this.cleanupCurrentSound();
      this.isPlaying = false;
      this.isProcessing = false;
      this.currentChunkId = null;
      this.notifyListeners();
      console.log('Playback stopped');
    } catch (error) {
      console.error('Error stopping playback:', error);
    }
  }

  /**
   * Pause current playback
   */
  async pause(): Promise<void> {
    try {
      if (this.currentSound) {
        await this.currentSound.pauseAsync();
        this.isPlaying = false;
        this.notifyListeners();
        console.log('Playback paused');
      }
    } catch (error) {
      console.error('Error pausing playback:', error);
    }
  }

  /**
   * Resume paused playback
   */
  async resume(): Promise<void> {
    try {
      if (this.currentSound) {
        await this.currentSound.playAsync();
        this.isPlaying = true;
        this.notifyListeners();
        console.log('Playback resumed');
      }
    } catch (error) {
      console.error('Error resuming playback:', error);
    }
  }

  /**
   * Get current playback status
   */
  async getPlaybackStatus(): Promise<PlaybackStatus> {
    let position = 0;
    let duration = 0;
    let isBuffering = false;

    if (this.currentSound) {
      try {
        const status = await this.currentSound.getStatusAsync();
        if (status.isLoaded) {
          position = status.positionMillis;
          duration = status.durationMillis || 0;
          isBuffering = status.isBuffering;
        }
      } catch (error) {
        console.error('Error getting playback status:', error);
      }
    }

    return {
      isPlaying: this.isPlaying,
      isBuffering,
      currentChunkId: this.currentChunkId,
      queueLength: this.queue.length,
      position,
      duration,
    };
  }

  /**
   * Check if currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Add playback status listener
   */
  addListener(callback: (status: PlaybackStatus) => void): void {
    this.playbackListeners.push(callback);
  }

  /**
   * Remove playback status listener
   */
  removeListener(callback: (status: PlaybackStatus) => void): void {
    this.playbackListeners = this.playbackListeners.filter(
      (listener) => listener !== callback
    );
  }

  /**
   * Notify all listeners of status change
   */
  private async notifyListeners(): Promise<void> {
    const status = await this.getPlaybackStatus();
    this.playbackListeners.forEach((listener) => listener(status));
  }

  /**
   * Clean up current sound resources
   */
  private async cleanupCurrentSound(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.unloadAsync();

        // Delete temporary audio file
        if (this.currentChunkId) {
          const fileUri = `${FileSystem.cacheDirectory}audio-chunk-${this.currentChunkId}.mp3`;
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        }

        this.currentSound = null;
      } catch (error) {
        console.error('Error cleaning up sound:', error);
      }
    }
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.stop();
      this.playbackListeners = [];

      // Clean up cache directory
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const files = await FileSystem.readDirectoryAsync(cacheDir);
        const audioChunks = files.filter((f) => f.startsWith('audio-chunk-'));

        for (const file of audioChunks) {
          try {
            await FileSystem.deleteAsync(`${cacheDir}${file}`, {
              idempotent: true,
            });
          } catch (error) {
            console.error(`Error deleting ${file}:`, error);
          }
        }
      }

      console.log('AudioPlayer cleanup complete');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Singleton instance
let playerInstance: AudioPlayer | null = null;

/**
 * Get singleton AudioPlayer instance
 */
export function getAudioPlayer(): AudioPlayer {
  if (!playerInstance) {
    playerInstance = new AudioPlayer();
  }
  return playerInstance;
}
