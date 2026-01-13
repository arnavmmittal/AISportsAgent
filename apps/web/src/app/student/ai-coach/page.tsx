'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Send,
  MessageSquare,
  Shield,
  Phone,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';
import { ChatBubble, TypingIndicator, type MessageSource } from '@/components/shared/chat';
import { VoiceButton, AudioVisualizer } from '@/components/shared/voice/VoiceButton';
import { useVoiceChat } from '@/hooks/useVoiceChat';

/**
 * Enhanced AI Coach Page
 *
 * Features:
 * - Streaming text responses with typewriter effect
 * - Voice input/output via WebSocket (Whisper + Cartesia TTS)
 * - Crisis detection and resources
 * - Quick prompts for common topics
 * - Privacy-first design with clear messaging
 * - New design system integration
 */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source: MessageSource;
  hasAudio?: boolean;
}

interface CrisisAlert {
  final_risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message?: string;
}

const quickPrompts = [
  {
    label: 'Pre-game anxiety',
    prompt: "I'm feeling stressed about an upcoming game",
    icon: '🎯',
  },
  {
    label: 'Confidence boost',
    prompt: "I'm struggling with my confidence lately",
    icon: '💪',
  },
  {
    label: 'Work-life balance',
    prompt: 'I need help balancing academics and athletics',
    icon: '⚖️',
  },
  {
    label: 'Visualization',
    prompt: 'Teach me a visualization technique for focus',
    icon: '🧠',
  },
];

export default function AICoachPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [crisisAlert, setCrisisAlert] = useState<CrisisAlert | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Voice integration
  const {
    voiceState,
    isListening,
    volume,
    transcript,
    error: voiceError,
    toggleVoice,
  } = useVoiceChat({
    sessionId,
    athleteId: session?.user?.id || '',
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        const userMessage: Message = {
          id: `msg_${Date.now()}`,
          role: 'user',
          content: text,
          timestamp: new Date(),
          source: 'voice',
        };
        setMessages((prev) => [...prev, userMessage]);
      }
    },
    onResponse: (text) => {
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: text,
        timestamp: new Date(),
        source: 'voice',
        hasAudio: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (error) => {
      console.error('Voice error:', error);
    },
  });

  // Initialize persistent session ID
  useEffect(() => {
    if (session?.user?.id) {
      setSessionId(`session_${session.user.id}`);
    }
  }, [session]);

  // Load message history
  useEffect(() => {
    if (!sessionId || !session?.user?.id) return;

    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/chat/${sessionId}/messages`);

        if (response.ok) {
          const history = await response.json();
          const loadedMessages: Message[] = history.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.createdAt),
            source: 'text' as MessageSource,
          }));
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [sessionId, session?.user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || inputValue;
    if (!text.trim() || !session?.user?.id || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
      source: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setCrisisAlert(null);

    try {
      // Create assistant message placeholder for streaming
      const assistantId = `msg_${Date.now()}_assistant`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          source: 'text',
        },
      ]);

      // Stream the response
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          athlete_id: session.user.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'crisis_alert' || parsed.type === 'crisis_check') {
                setCrisisAlert({
                  final_risk_level: parsed.data.severity || parsed.data.final_risk_level || 'HIGH',
                  message: 'We noticed your message may indicate distress. Professional support is available.',
                });
              } else if (parsed.type === 'token') {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      content: updated[lastIndex].content + parsed.data.content,
                    };
                  }
                  return updated;
                });
              } else if (parsed.type === 'content') {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      content: updated[lastIndex].content + parsed.data,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // Ignore parse errors for incomplete JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg?.role === 'assistant' && lastMsg.content === '') {
          lastMsg.content = "I'm having trouble connecting right now. Let's try again in a moment.";
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, session?.user?.id, sessionId, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleVoiceToggle = () => {
    setVoiceMode(!voiceMode);
    toggleVoice();
  };

  // Not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Please sign in to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 p-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">AI Wellness Coach</h1>
                <p className="text-xs text-muted-foreground">Private &amp; confidential</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 text-success text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Online
              </div>
            </div>
          </div>
        </header>

        {/* Crisis Alert Banner */}
        {crisisAlert && (
          <div className="flex-shrink-0 p-4 bg-risk-critical/10 border-b border-risk-critical/20 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-risk-critical flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-risk-critical">Support Available 24/7</p>
                <p className="text-sm text-muted-foreground mt-1">{crisisAlert.message}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <a href="tel:988" className="text-primary hover:underline font-medium">
                    988 Lifeline
                  </a>
                  <a href="sms:741741" className="text-primary hover:underline font-medium">
                    Text HELLO to 741741
                  </a>
                </div>
              </div>
              <button
                onClick={() => setCrisisAlert(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Hey! Ready to chat?
              </h2>
              <p className="text-muted-foreground max-w-md mb-8">
                I'm your AI mental performance coach. Whether it's pre-game nerves, confidence building, or just wanting to talk - I'm here for you.
              </p>

              {/* Quick Prompts */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt.label}
                    onClick={() => sendMessage(prompt.prompt)}
                    className="p-4 text-left rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/20 transition-all group"
                  >
                    <span className="text-xl mb-2 block">{prompt.icon}</span>
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {prompt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isLastAssistant =
                  message.role === 'assistant' &&
                  index === messages.length - 1 &&
                  isLoading;

                return (
                  <ChatBubble
                    key={message.id}
                    id={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                    isStreaming={isLastAssistant && message.content === ''}
                    source={message.source}
                    hasAudio={message.hasAudio}
                    isPlaying={playingMessageId === message.id}
                    showCopy={message.role === 'assistant' && !isLastAssistant}
                    showRetry={false}
                  />
                );
              })}

              {isLoading && messages[messages.length - 1]?.content === '' && (
                <TypingIndicator />
              )}
            </>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Voice Visualizer */}
        {isListening && (
          <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-primary/5">
            <div className="flex items-center justify-center gap-4">
              <AudioVisualizer
                volume={volume}
                isActive={isListening}
                bars={24}
                className="flex-1 max-w-xs"
              />
              {transcript && (
                <p className="text-sm text-muted-foreground italic truncate max-w-xs">
                  "{transcript}"
                </p>
              )}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-sm p-4">
          {/* Voice Error */}
          {voiceError && (
            <div className="mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {voiceError.message}
            </div>
          )}

          <div className="flex gap-3">
            {/* Voice Button */}
            <VoiceButton
              voiceState={voiceState}
              volume={volume}
              onToggle={handleVoiceToggle}
              disabled={isLoading || !sessionId}
            />

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={voiceMode ? 'Voice mode active...' : "What's on your mind?"}
                disabled={isLoading || voiceMode}
                rows={1}
                className={cn(
                  'w-full resize-none rounded-xl border border-border bg-background px-4 py-3 pr-12',
                  'text-sm placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all'
                )}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={isLoading || !inputValue.trim() || voiceMode}
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Actions (when input is focused) */}
          {messages.length > 0 && !voiceMode && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
              {quickPrompts.slice(0, 3).map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => setInputValue(prompt.prompt)}
                  className="flex-shrink-0 px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted/50 hover:border-primary/20 transition-all text-muted-foreground hover:text-foreground"
                >
                  {prompt.icon} {prompt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Privacy Footer */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Private &amp; encrypted</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="tel:988" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Phone className="w-3 h-3" />
                <span>988 Crisis Line</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
