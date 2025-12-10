/**
 * Voice Activity Detector (VAD)
 * Detects silence to determine when user has stopped speaking
 */

import { AudioLevel } from './AudioRecorder';

export interface VADConfig {
  silenceThreshold: number; // 0-1, normalized RMS threshold
  silenceDuration: number; // milliseconds of silence before triggering
  updateInterval: number; // milliseconds between checks
  minSpeechDuration: number; // minimum speech duration to consider valid
}

export interface VADResult {
  isSpeaking: boolean;
  isSilence: boolean;
  silenceDuration: number;
  speechDuration: number;
  currentLevel: number;
  shouldEndUtterance: boolean;
}

export class VoiceActivityDetector {
  private config: VADConfig;
  private silenceStartTime: number | null = null;
  private speechStartTime: number | null = null;
  private lastCheckTime: number = 0;
  private isSpeaking: boolean = false;
  private onUtteranceEndCallback: (() => void) | null = null;

  constructor(config?: Partial<VADConfig>) {
    this.config = {
      silenceThreshold: config?.silenceThreshold ?? 0.5, // 50% normalized RMS
      silenceDuration: config?.silenceDuration ?? 1500, // 1.5 seconds
      updateInterval: config?.updateInterval ?? 100, // 100ms
      minSpeechDuration: config?.minSpeechDuration ?? 300, // 300ms minimum speech
    };
  }

  /**
   * Analyze audio levels to detect voice activity
   * @param audioLevels - Array of recent audio level samples
   * @returns VAD result with current state
   */
  analyze(audioLevels: AudioLevel[]): VADResult {
    const now = Date.now();

    // Throttle analysis to update interval
    if (now - this.lastCheckTime < this.config.updateInterval) {
      return this.getCurrentResult();
    }

    this.lastCheckTime = now;

    // Need at least a few samples
    if (audioLevels.length < 3) {
      return this.getCurrentResult();
    }

    // Calculate average level from recent samples (last 500ms)
    const recentSamples = audioLevels.filter(
      (level) => now - level.timestamp < 500
    );

    if (recentSamples.length === 0) {
      return this.getCurrentResult();
    }

    const avgLevel =
      recentSamples.reduce((sum, level) => sum + level.level, 0) /
      recentSamples.length;

    const currentLevel = recentSamples[recentSamples.length - 1].level;
    const isSilent = avgLevel < this.config.silenceThreshold;

    // State transitions
    if (isSilent) {
      // Silence detected
      if (!this.silenceStartTime) {
        this.silenceStartTime = now;
      }

      // If was speaking, check if silence duration threshold met
      if (this.isSpeaking) {
        const silenceDuration = now - this.silenceStartTime;

        // Check if speech was long enough and silence threshold met
        if (silenceDuration >= this.config.silenceDuration) {
          const speechDuration = this.speechStartTime
            ? this.silenceStartTime - this.speechStartTime
            : 0;

          if (speechDuration >= this.config.minSpeechDuration) {
            // Valid utterance detected, should end
            this.isSpeaking = false;
            console.log(
              `VAD: Utterance end detected (speech: ${speechDuration}ms, silence: ${silenceDuration}ms)`
            );

            // Trigger callback
            if (this.onUtteranceEndCallback) {
              this.onUtteranceEndCallback();
            }

            return {
              isSpeaking: false,
              isSilence: true,
              silenceDuration,
              speechDuration,
              currentLevel,
              shouldEndUtterance: true,
            };
          }
        }
      }
    } else {
      // Voice detected
      if (!this.isSpeaking) {
        // Started speaking
        this.isSpeaking = true;
        this.speechStartTime = now;
        this.silenceStartTime = null;
        console.log('VAD: Speech started');
      } else {
        // Continue speaking, reset silence timer
        this.silenceStartTime = null;
      }
    }

    return this.getCurrentResult(currentLevel);
  }

  /**
   * Get current VAD state
   */
  private getCurrentResult(currentLevel?: number): VADResult {
    const now = Date.now();

    const silenceDuration = this.silenceStartTime
      ? now - this.silenceStartTime
      : 0;

    const speechDuration =
      this.isSpeaking && this.speechStartTime
        ? now - this.speechStartTime
        : 0;

    return {
      isSpeaking: this.isSpeaking,
      isSilence: !this.isSpeaking,
      silenceDuration,
      speechDuration,
      currentLevel: currentLevel ?? 0,
      shouldEndUtterance: false,
    };
  }

  /**
   * Register callback for utterance end events
   */
  onUtteranceEnd(callback: () => void): void {
    this.onUtteranceEndCallback = callback;
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Get current silence duration
   */
  getSilenceDuration(): number {
    if (!this.silenceStartTime) {
      return 0;
    }
    return Date.now() - this.silenceStartTime;
  }

  /**
   * Get current speech duration
   */
  getSpeechDuration(): number {
    if (!this.isSpeaking || !this.speechStartTime) {
      return 0;
    }
    return Date.now() - this.speechStartTime;
  }

  /**
   * Reset VAD state
   */
  reset(): void {
    this.isSpeaking = false;
    this.silenceStartTime = null;
    this.speechStartTime = null;
    this.lastCheckTime = 0;
    console.log('VAD: Reset');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VADConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('VAD: Config updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): VADConfig {
    return { ...this.config };
  }
}

/**
 * Create VAD instance with default or custom config
 */
export function createVAD(config?: Partial<VADConfig>): VoiceActivityDetector {
  return new VoiceActivityDetector(config);
}
