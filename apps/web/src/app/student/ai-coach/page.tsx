'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Send,
  MessageSquare,
  Shield,
  Phone,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  X,
  History,
  Clock,
  Bot,
  Search,
  ChevronLeft,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';
import { ChatBubble, TypingIndicator, type MessageSource } from '@/components/shared/chat';
import { VoiceButton, AudioVisualizer } from '@/components/shared/voice/VoiceButton';
import { useVoiceChat } from '@/hooks/useVoiceChat';

/**
 * Enhanced AI Coach Page (v2.1 - With Integrated History)
 *
 * Features:
 * - Streaming text responses with typewriter effect
 * - Voice input/output via WebSocket (Whisper + Cartesia TTS)
 * - Crisis detection and resources
 * - Quick prompts for common topics
 * - Privacy-first design with clear messaging
 * - Integrated chat history drawer (consolidated from /student/chat)
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

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  createdAt: Date;
  messageCount: number;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [crisisAlert, setCrisisAlert] = useState<CrisisAlert | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // History drawer state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

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

  // Load chat sessions for history drawer
  const loadChatSessions = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoadingSessions(true);
      const profileResponse = await fetch('/api/athlete/profile');
      const profileData = await profileResponse.json();

      if (!profileData.success || !profileData.data?.userId) {
        setChatSessions([]);
        return;
      }

      const userId = profileData.data.userId;
      const response = await fetch(`/api/chat/sessions?userId=${userId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const transformedSessions: ChatSession[] = data.data.map((s: any) => ({
            id: s.id,
            title: s.title || 'Chat Session',
            lastMessage: s.lastMessage || 'No messages yet',
            createdAt: new Date(s.createdAt),
            messageCount: s.messageCount || 0,
          }));
          setChatSessions(transformedSessions);
        }
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [session?.user?.id]);

  // Load sessions when history drawer opens
  useEffect(() => {
    if (historyOpen) {
      loadChatSessions();
    }
  }, [historyOpen, loadChatSessions]);

  // Handle session switch from URL param or click
  const switchToSession = useCallback((newSessionId: string) => {
    setSessionId(newSessionId);
    setMessages([]);
    setHistoryOpen(false);
    router.push(`/student/ai-coach?sessionId=${newSessionId}`, { scroll: false });
  }, [router]);

  // Check for sessionId in URL params
  useEffect(() => {
    const urlSessionId = searchParams.get('sessionId');
    if (urlSessionId && session?.user?.id) {
      setSessionId(urlSessionId);
    }
  }, [searchParams, session?.user?.id]);

  // Start a new chat session
  const startNewSession = useCallback(() => {
    if (session?.user?.id) {
      const newId = `session_${session.user.id}_${Date.now()}`;
      setSessionId(newId);
      setMessages([]);
      setHistoryOpen(false);
      router.push('/student/ai-coach', { scroll: false });
    }
  }, [session?.user?.id, router]);

  // Format date for history items
  const formatSessionDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Filter sessions by search query
  const filteredSessions = chatSessions.filter(s =>
    s.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
    s.lastMessage.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

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
    <div className="min-h-screen bg-background relative">
      {/* History Drawer Overlay */}
      {historyOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setHistoryOpen(false)}
        />
      )}

      {/* History Drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-80 bg-card border-r border-border z-50 transition-transform duration-300 ease-in-out',
          historyOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Chat History
            </h2>
            <button
              onClick={() => setHistoryOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-3 border-b border-border">
            <Button
              onClick={startNewSession}
              className="w-full"
              variant="default"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
          </div>

          {/* Search */}
          {chatSessions.length > 0 && (
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : chatSessions.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No past conversations</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-6 text-center">
                <Search className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No matches found</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredSessions.map((chatSession) => (
                  <button
                    key={chatSession.id}
                    onClick={() => switchToSession(chatSession.id)}
                    className={cn(
                      'w-full p-3 text-left rounded-lg transition-colors hover:bg-muted',
                      sessionId === chatSession.id && 'bg-primary/10 border border-primary/20'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {chatSession.title}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatSessionDate(chatSession.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {chatSession.lastMessage}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              {chatSessions.length} conversation{chatSessions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </aside>

      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 p-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* History Toggle Button */}
              <button
                onClick={() => setHistoryOpen(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Open chat history"
              >
                <History className="w-5 h-5 text-muted-foreground" />
              </button>
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
