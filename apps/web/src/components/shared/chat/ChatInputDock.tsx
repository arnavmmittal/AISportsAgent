'use client';

import { Send } from 'lucide-react';
import { ChatInput } from '@/components/ui/chat-input';
import { Button } from '@/components/ui/button';
import { VoiceButton, AudioVisualizer } from '@/components/shared/voice/VoiceButton';
import type { VoiceState } from '@/lib/voice/VoiceManager';

interface ChatInputDockProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  voiceMode: boolean;
  voiceState: VoiceState;
  volume: number;
  isListening: boolean;
  transcript: string;
  voiceError: Error | null;
  onToggleVoice: () => void;
  voiceDisabled: boolean;
}

export function ChatInputDock({
  inputValue,
  onInputChange,
  onSend,
  onKeyDown,
  isLoading,
  voiceMode,
  voiceState,
  volume,
  isListening,
  transcript,
  voiceError,
  onToggleVoice,
  voiceDisabled,
}: ChatInputDockProps) {
  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-sm p-3 md:p-4">
      <div className="max-w-3xl mx-auto">
        {/* Audio visualizer when listening */}
        {isListening && (
          <div className="mb-3 flex justify-center">
            <AudioVisualizer
              volume={volume}
              isActive={isListening}
              bars={12}
              className="w-full max-w-sm"
            />
          </div>
        )}

        {/* Live transcript display */}
        {transcript && voiceMode && (
          <div className="mb-3 p-3 bg-accent-muted border border-accent/30 rounded-lg">
            <p className="text-sm text-foreground">
              <span className="font-medium text-accent">Listening:</span> {transcript}
            </p>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <ChatInput
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={voiceMode ? 'Voice mode active - tap mic to speak' : "What's on your mind?"}
            disabled={isLoading || voiceMode}
            className="min-h-[44px]"
          />

          <VoiceButton
            voiceState={voiceState}
            volume={volume}
            onToggle={onToggleVoice}
            disabled={voiceDisabled}
          />

          <Button
            onClick={onSend}
            disabled={isLoading || !inputValue.trim() || voiceMode}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-lg"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Voice error display */}
        {voiceError && (
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
            <span className="font-medium">Voice error:</span> {voiceError.message}
          </div>
        )}
      </div>
    </div>
  );
}
