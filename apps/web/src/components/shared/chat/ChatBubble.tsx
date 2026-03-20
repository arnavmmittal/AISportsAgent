'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Bot, User, Copy, Check, RotateCcw, Volume2, VolumeX, Mic } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';

/**
 * ChatBubble - Message container for AI chat interface
 *
 * Features:
 * - User and AI message variants
 * - Streaming text with typewriter cursor
 * - Copy to clipboard
 * - Retry action for AI messages
 * - Voice playback for AI responses
 * - Voice input indicator for user messages
 * - Timestamp display
 * - Accessible markup
 *
 * @example
 * <ChatBubble
 *   role="assistant"
 *   content="How are you feeling today?"
 *   isStreaming={false}
 *   timestamp={new Date()}
 *   hasAudio={true}
 *   onPlayAudio={() => playTTS(messageId)}
 * />
 */

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageSource = 'text' | 'voice';

export interface ChatBubbleProps {
  /** Message role */
  role: MessageRole;
  /** Message content */
  content: string;
  /** Is message currently streaming */
  isStreaming?: boolean;
  /** Message timestamp */
  timestamp?: Date;
  /** Show copy button */
  showCopy?: boolean;
  /** Show retry button (AI messages only) */
  showRetry?: boolean;
  /** Retry handler */
  onRetry?: () => void;
  /** Avatar URL override */
  avatarUrl?: string;
  /** User's name (for user messages) */
  userName?: string;
  /** Additional CSS classes */
  className?: string;
  /** Message ID for accessibility */
  id?: string;
  /** Whether this message has audio (for AI playback) */
  hasAudio?: boolean;
  /** Is audio currently playing */
  isPlaying?: boolean;
  /** Play audio handler */
  onPlayAudio?: () => void;
  /** Stop audio handler */
  onStopAudio?: () => void;
  /** How the message was input (text or voice) */
  source?: MessageSource;
}

export function ChatBubble({
  role,
  content,
  isStreaming = false,
  timestamp,
  showCopy = true,
  showRetry = false,
  onRetry,
  avatarUrl,
  userName,
  className,
  id,
  hasAudio = false,
  isPlaying = false,
  onPlayAudio,
  onStopAudio,
  source = 'text',
}: ChatBubbleProps) {
  const [copied, setCopied] = React.useState(false);
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';
  const isVoiceMessage = source === 'voice';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // Don't render system messages
  if (role === 'system') return null;

  return (
    <div
      id={id}
      className={cn(
        'group flex gap-3 animate-slide-up',
        isUser && 'flex-row-reverse',
        className
      )}
      role="article"
      aria-label={`${isUser ? 'Your message' : 'AI Coach'}: ${content.slice(0, 50)}...`}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={isUser ? userName || 'You' : 'AI Coach'}
            className="w-full h-full rounded-full object-cover"
          />
        ) : isUser ? (
          <User size={16} aria-hidden="true" />
        ) : (
          <Bot size={16} aria-hidden="true" />
        )}
      </div>

      {/* Message container */}
      <div
        className={cn(
          'flex flex-col max-w-[80%] sm:max-w-[70%]',
          isUser && 'items-end'
        )}
      >
        {/* Message bubble */}
        <div
          className={cn(
            'relative px-4 py-3 rounded-2xl',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-card border border-border rounded-bl-md'
          )}
        >
          {/* Message content */}
          <div
            className={cn(
              'text-sm leading-relaxed whitespace-pre-wrap break-words',
              isAssistant && 'prose prose-sm dark:prose-invert max-w-none'
            )}
          >
            {content}
            {isStreaming && (
              <span className="typing-cursor" aria-hidden="true" />
            )}
          </div>

          {/* Streaming indicator */}
          {isStreaming && (
            <span className="sr-only">AI is typing...</span>
          )}
        </div>

        {/* Actions and timestamp - visible on mobile, hover on desktop */}
        <div
          className={cn(
            'flex items-center gap-2 mt-1 px-1',
            isUser ? 'flex-row-reverse' : 'flex-row',
            // Mobile: always visible (slightly dimmed), Desktop: show on hover
            'opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200'
          )}
        >
          {/* Voice input indicator */}
          {isVoiceMessage && isUser && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mic size={10} aria-hidden="true" />
              <span>voice</span>
            </span>
          )}

          {/* Timestamp */}
          {timestamp && (
            <time
              dateTime={timestamp.toISOString()}
              className="text-xs text-muted-foreground"
            >
              {formatTime(timestamp)}
            </time>
          )}

          {/* Action buttons */}
          {!isStreaming && (
            <div className="flex gap-1">
              {/* Voice playback for AI messages */}
              {hasAudio && isAssistant && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={isPlaying ? onStopAudio : onPlayAudio}
                  className={cn(
                    'h-8 w-8 md:h-6 md:w-6', // Larger on mobile for touch
                    isPlaying && 'text-primary bg-primary/10'
                  )}
                  aria-label={isPlaying ? 'Stop playback' : 'Play audio'}
                >
                  {isPlaying ? (
                    <VolumeX size={14} className="md:w-3 md:h-3" />
                  ) : (
                    <Volume2 size={14} className="md:w-3 md:h-3" />
                  )}
                </Button>
              )}

              {showCopy && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCopy}
                  className="h-8 w-8 md:h-6 md:w-6" // Larger on mobile for touch
                  aria-label={copied ? 'Copied!' : 'Copy message'}
                >
                  {copied ? (
                    <Check size={14} className="md:w-3 md:h-3 text-success" />
                  ) : (
                    <Copy size={14} className="md:w-3 md:h-3" />
                  )}
                </Button>
              )}

              {showRetry && isAssistant && onRetry && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onRetry}
                  className="h-8 w-8 md:h-6 md:w-6" // Larger on mobile for touch
                  aria-label="Retry this response"
                >
                  <RotateCcw size={14} className="md:w-3 md:h-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ChatBubbleSkeleton - Loading state for messages
 */
export function ChatBubbleSkeleton({ role = 'assistant' }: { role?: MessageRole }) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div className="w-8 h-8 rounded-full skeleton" />
      <div className={cn('flex flex-col gap-2', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl skeleton',
            isUser ? 'rounded-br-md w-48 h-12' : 'rounded-bl-md w-64 h-20'
          )}
        />
      </div>
    </div>
  );
}

/**
 * TypingIndicator - Shows when AI is processing
 */
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-3', className)}>
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <Bot size={16} className="text-muted-foreground" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1" role="status" aria-label="AI is typing">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

/**
 * StreamingText - Component that reveals text character by character
 *
 * @example
 * <StreamingText text={fullText} speed={30} onComplete={() => {}} />
 */
export interface StreamingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export function StreamingText({
  text,
  speed = 20,
  onComplete,
  className,
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = React.useState('');
  const [isComplete, setIsComplete] = React.useState(false);

  React.useEffect(() => {
    if (!text) return;

    let index = 0;
    setDisplayedText('');
    setIsComplete(false);

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && <span className="typing-cursor" aria-hidden="true" />}
    </span>
  );
}

export default ChatBubble;
