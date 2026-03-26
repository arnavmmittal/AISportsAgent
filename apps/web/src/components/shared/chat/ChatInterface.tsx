'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useChatPersistence, useAthleteActivity } from '@/hooks/useChatPersistence';
import { VoiceButton, AudioVisualizer } from '@/components/shared/voice/VoiceButton';
import { MobileVoiceWidget } from '@/components/shared/voice/MobileVoiceWidget';
import { ActionPlanWidget } from '@/components/shared/chat/ActionPlanWidget';
import { MetricTrackerWidget } from '@/components/shared/chat/MetricTrackerWidget';
import { PracticeDrillCard } from '@/components/shared/chat/PracticeDrillCard';
import { RoutineBuilderWidget } from '@/components/shared/chat/RoutineBuilderWidget';
import { CrisisResourcesModal } from '@/components/shared/chat/CrisisResourcesModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CrisisAlert {
  final_risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message?: string;
}

interface StructuredMetadata {
  session_stage: string;
  detected_issue_tags: string[];
  sport_context: {
    sport: string;
    position?: string;
    setting: string;
    timeline?: string;
    recent_event?: string;
  };
  key_hypotheses: string[];
  selected_protocol?: {
    name: string;
    framework: string;
    why_chosen: string;
    confidence: number;
  };
  in_chat_exercise?: {
    name: string;
    steps: string[];
    duration_seconds: number;
    cue_word?: string;
    sport_context: string;
  };
  action_plan: {
    today: string[];
    this_week: string[];
    next_competition: string[];
  };
  tracking: {
    metrics: Array<{
      name: string;
      scale: string;
      target?: number;
      when_to_log: string;
    }>;
    adherence_check: string;
    one_word_debrief: string;
  };
  next_prompt: string;
  kb_citations: string[];
  // Phase 5.1: Practice Integration
  practice_drill?: {
    name: string;
    mental_skill: string;
    setup: string;
    mental_component: string;
    physical_component: string;
    progression: string[];
    success_metrics: string[];
    duration_minutes: number;
    coaching_notes: string;
  };
  // Phase 5.1: Routine Builder
  pre_performance_routine?: {
    name: string;
    sport: string;
    phase: string;
    total_duration_seconds: number;
    cues: Array<{
      type: string;
      description: string;
      duration_seconds: number;
      why_included?: string;
    }>;
    customization_notes: string;
    effectiveness_tracking: string[];
  };
  human_response: string;
}

export function ChatInterface() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [crisisAlert, setCrisisAlert] = useState<CrisisAlert | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [currentMetadata, setCurrentMetadata] = useState<StructuredMetadata | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat state persistence - remembers session across page refreshes
  const {
    state: persistedState,
    isHydrated,
    setSessionId: persistSessionId,
    setDraftMessage,
    recordActivity,
  } = useChatPersistence(user?.id);

  // Track activity for coach visibility (privacy-respecting: only status, no content)
  useAthleteActivity(user?.id, sessionId, messages.length > 0 && !isLoading);

  // Get user on mount and subscribe to auth changes
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Voice integration - uses /api/voice/* endpoints
  const {
    voiceState,
    isListening,
    volume,
    transcript,
    error: voiceError,
    toggleVoice,
    speakResponse,
  } = useVoiceChat({
    sessionId,
    athleteId: user?.id || '',
    onTranscript: (text, isFinal) => {
      // Show transcript in input while speaking
      if (!isFinal) {
        setInputValue(text);
      }
    },
    onAudioComplete: async (transcribedText) => {
      // Voice transcript is complete - send to chat API
      if (!transcribedText.trim() || !user?.id) return;

      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: transcribedText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsLoading(true);
      recordActivity();

      try {
        // Send to chat API and collect full response for TTS
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            message: transcribedText,
            athlete_id: user.id,
          }),
        });

        if (!response.ok) throw new Error('Failed to get response');

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error('No response body');

        // Add placeholder for assistant message
        const assistantId = `msg_${Date.now()}_assistant`;
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
        ]);

        let fullResponse = '';
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
                if (parsed.type === 'token') {
                  // Token content is in parsed.data.content
                  fullResponse += parsed.data.content || '';
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                      updated[lastIndex] = { ...updated[lastIndex], content: fullResponse };
                    }
                    return updated;
                  });
                } else if (parsed.type === 'crisis_alert' || parsed.type === 'crisis_check') {
                  setCrisisAlert({
                    final_risk_level: parsed.data.severity || parsed.data.final_risk_level || 'HIGH',
                    message: 'Professional support is available 24/7 at 988',
                  });
                }
              } catch {}
            }
          }
        }

        // Speak the full response using TTS
        if (fullResponse.trim()) {
          await speakResponse(fullResponse);
        }
      } catch (error) {
        console.error('Voice chat error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Voice error:', error);
    },
  });

  // Initialize session ID - use persisted session, load most recent, or create new UUID
  useEffect(() => {
    if (!user?.id || !isHydrated) return;

    const initializeSession = async () => {
      try {
        // First, check if we have a persisted session ID
        if (persistedState.sessionId) {
          setSessionId(persistedState.sessionId);
          return;
        }

        // Try to load the most recent chat session
        const response = await fetch('/api/chat?limit=1');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.length > 0) {
            // Use the most recent session
            const recentSessionId = data.data[0].id;
            setSessionId(recentSessionId);
            persistSessionId(recentSessionId);
            return;
          }
        }

        // No existing session - generate a new UUID
        // The session will be created when the user sends their first message
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);
        persistSessionId(newSessionId);
      } catch (error) {
        console.error('Failed to initialize session:', error);
        // Fallback to new UUID
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);
        persistSessionId(newSessionId);
      }
    };

    initializeSession();
  }, [user?.id, isHydrated, persistedState.sessionId, persistSessionId]);

  // Restore draft message from persistence
  useEffect(() => {
    if (isHydrated && persistedState.draftMessage && !inputValue) {
      setInputValue(persistedState.draftMessage);
    }
  }, [isHydrated, persistedState.draftMessage]);

  // Save draft message on change (debounced via state)
  useEffect(() => {
    if (isHydrated && inputValue !== persistedState.draftMessage) {
      setDraftMessage(inputValue);
    }
  }, [inputValue, isHydrated]);

  // Load message history when session ID is set
  useEffect(() => {
    if (!sessionId || !user?.id) return;

    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/chat/${sessionId}/messages`);

        if (response.ok) {
          const history = await response.json();
          // Convert to Message format
          const loadedMessages: Message[] = history.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          }));
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        // Don't show error to user - just start with empty chat
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [sessionId, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !user?.id || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    const userInput = inputValue;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setDraftMessage(''); // Clear persisted draft
    setIsLoading(true);
    setCrisisAlert(null);
    recordActivity(); // Track for coach visibility

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
        },
      ]);

      // Stream the response from our API
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: userInput,
          athlete_id: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Use stream: true to handle partial UTF-8 sequences correctly
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              break;
            }

            if (!data) continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'crisis_alert' || parsed.type === 'crisis_check') {
                setCrisisAlert({
                  final_risk_level: parsed.data.severity || parsed.data.final_risk_level || 'HIGH',
                  message: 'We noticed your message may indicate distress. Professional support is available 24/7 at the National Suicide Prevention Lifeline: 988'
                });
              } else if (parsed.type === 'token') {
                // Real-time token streaming from OpenAI
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                    // Append each token as it arrives
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      content: updated[lastIndex].content + parsed.data.content
                    };
                  }
                  return updated;
                });
              } else if (parsed.type === 'content') {
                // Fallback for complete messages
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      content: updated[lastIndex].content + parsed.data
                    };
                  }
                  return updated;
                });
              } else if (parsed.type === 'metadata') {
                // Store structured metadata for widgets
                setCurrentMetadata(parsed.data as StructuredMetadata);
                console.log('Received structured metadata:', parsed.data);
              } else if (parsed.type === 'widget') {
                // Handle widget events from LangGraph structured output tools
                const widgetType = parsed.data?.widgetType;
                const widgetPayload = parsed.data?.payload;

                if (widgetType && widgetPayload) {
                  setCurrentMetadata((prev) => {
                    // Create minimal default metadata if none exists (LangGraph widgets may arrive independently)
                    const base: StructuredMetadata = prev || {
                      session_stage: 'action',
                      detected_issue_tags: [],
                      sport_context: { sport: '', setting: '' },
                      key_hypotheses: [],
                      action_plan: { today: [], this_week: [], next_competition: [] },
                      tracking: { metrics: [], adherence_check: '', one_word_debrief: '' },
                      next_prompt: '',
                      kb_citations: [],
                      human_response: '',
                    };
                    const updated = { ...base };
                    if (widgetType === 'action_plan') {
                      updated.action_plan = widgetPayload;
                    } else if (widgetType === 'practice_drill') {
                      updated.practice_drill = widgetPayload;
                    } else if (widgetType === 'routine') {
                      updated.pre_performance_routine = widgetPayload;
                    }
                    return updated;
                  });
                  console.log('Received widget:', widgetType, widgetPayload);
                }
              } else if (parsed.type === 'done') {
                // Streaming complete
                console.log('Streaming completed');
              }
            } catch (e) {
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
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content === '') {
          lastMsg.content = "Oops! Something went wrong on my end. Let's try that again - I'm here and ready to help! 💪";
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please sign in to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Crisis Resources Modal */}
      <CrisisResourcesModal
        crisis={crisisAlert}
        onClose={() => setCrisisAlert(null)}
      />

      {/* Crisis Alert Banner - Calm but serious */}
      {crisisAlert && (
        <div className={`crisis-banner ${crisisAlert.final_risk_level === 'CRITICAL' ? 'critical' : ''} animate-fade-in`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className={`w-5 h-5 ${crisisAlert.final_risk_level === 'CRITICAL' ? 'text-destructive' : 'text-warning'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground">Support Available 24/7</p>
              <p className="text-sm text-muted-foreground mt-1">{crisisAlert.message}</p>
              <button className="text-sm font-medium text-accent mt-2 hover:underline">
                View resources
              </button>
            </div>
            <button
              onClick={() => setCrisisAlert(null)}
              className="flex-shrink-0 w-8 h-8 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            {/* Coach Avatar - Animated */}
            <div className="coach-avatar-large mb-6">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Ready when you are
            </h2>
            <p className="text-base text-muted-foreground max-w-xs">
              What's on your mind heading into your next competition?
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              const showAvatar = !isUser && (index === 0 || messages[index - 1]?.role === 'user');

              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-message-in`}
                >
                  <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Coach Avatar - Only show for first message in AI group */}
                    {!isUser && (
                      <div className={`flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
                        <div className="coach-avatar">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`message-bubble ${isUser ? 'message-user' : 'message-ai'}`}>
                      {message.content ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        /* Streaming indicator - pulsing line instead of bouncing dots */
                        <div className="py-2">
                          <div className="streaming-indicator" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} className="h-6" />

        {/* Structured Response Widgets */}
        {currentMetadata && (
          <div className="space-y-4 px-0 md:px-4">
            {/* Action Plan Widget */}
            {(currentMetadata.action_plan.today.length > 0 ||
              currentMetadata.action_plan.this_week.length > 0 ||
              currentMetadata.action_plan.next_competition.length > 0) && (
              <ActionPlanWidget
                plan={currentMetadata.action_plan}
                onCheckItem={(timeframe, index, checked) => {
                  console.log(`${timeframe}[${index}] checked: ${checked}`);
                }}
              />
            )}

            {/* Metric Tracker Widget */}
            {currentMetadata.tracking.metrics.length > 0 && (
              <MetricTrackerWidget
                metrics={currentMetadata.tracking.metrics}
                adherence_check={currentMetadata.tracking.adherence_check}
                one_word_debrief={currentMetadata.tracking.one_word_debrief}
                onLogMetric={async (metricName, value) => {
                  // Note: Custom metrics tracking API not yet implemented.
                  // For MVP, metrics are stored in chat context only.
                  // TODO: Create /api/athlete/metrics endpoint for persistence
                  console.log(`Metric logged: ${metricName} = ${value}`);
                }}
              />
            )}

            {/* Practice Drill Card (Phase 5.1) */}
            {currentMetadata.practice_drill && (
              <PracticeDrillCard
                drill={currentMetadata.practice_drill}
                onStartDrill={() => {
                  // Note: Drill timer/tracker feature not yet implemented.
                  // For now, drills are instruction-only from chat.
                  // TODO: Create drill timer component and /api/athlete/drills endpoint
                  console.log('Drill started:', currentMetadata.practice_drill?.name);
                }}
                onTrackProgress={(week, notes) => {
                  // Note: Drill progress tracking API not yet implemented.
                  // Progress is stored in chat context only for MVP.
                  // TODO: Create /api/athlete/drill-progress endpoint
                  console.log(`Week ${week} progress:`, notes);
                }}
              />
            )}

            {/* Pre-Performance Routine Widget (Phase 5.1) */}
            {currentMetadata.pre_performance_routine && (
              <RoutineBuilderWidget
                routine={currentMetadata.pre_performance_routine}
                onComplete={() => {
                  // Note: Routine completion tracking not yet implemented.
                  // For MVP, routines are suggested but not persisted.
                  // TODO: Create /api/athlete/routines endpoint for persistence
                  console.log('Routine completed!');
                }}
                onSaveCustomization={(customizedRoutine) => {
                  // Note: Custom routine persistence not yet implemented.
                  // Customizations are session-only for MVP.
                  // TODO: Save customized routines to athlete profile
                  console.log('Customized routine (not persisted):', customizedRoutine);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Input Dock */}
      <div className="input-dock">
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

          <div className="flex gap-3 items-end">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={voiceMode ? "Voice mode active - tap mic to speak" : "What's on your mind?"}
              className="input-field"
              rows={1}
              disabled={isLoading || voiceMode}
            />

            {/* Voice Button */}
            <VoiceButton
              voiceState={voiceState}
              volume={volume}
              onToggle={() => {
                setVoiceMode(!voiceMode);
                toggleVoice();
              }}
              disabled={isLoading || !sessionId || !user?.id}
            />

            <button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim() || voiceMode}
              className="input-button input-button-send"
              aria-label="Send message"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* Voice error display */}
          {voiceError && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
              <span className="font-medium">Voice error:</span> {voiceError.message}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Voice Widget - Floating FAB and full-screen voice UI for mobile */}
      <MobileVoiceWidget
        voiceState={voiceState}
        volume={volume}
        transcript={transcript}
        isListening={isListening}
        onToggle={() => {
          setVoiceMode(!voiceMode);
          toggleVoice();
        }}
        disabled={isLoading || !sessionId || !user?.id}
      />
    </div>
  );
}
