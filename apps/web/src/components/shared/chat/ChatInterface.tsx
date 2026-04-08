'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useChatPersistence, useAthleteActivity } from '@/hooks/useChatPersistence';
import { MobileVoiceWidget } from '@/components/shared/voice/MobileVoiceWidget';
import { ActionPlanWidget } from '@/components/shared/chat/ActionPlanWidget';
import { MetricTrackerWidget } from '@/components/shared/chat/MetricTrackerWidget';
import { PracticeDrillCard } from '@/components/shared/chat/PracticeDrillCard';
import { RoutineBuilderWidget } from '@/components/shared/chat/RoutineBuilderWidget';
import { CrisisResourcesModal } from '@/components/shared/chat/CrisisResourcesModal';
import { ChatBubble } from '@/components/shared/chat/ChatBubble';
import { ChatEmptyState } from '@/components/shared/chat/ChatEmptyState';
import { ChatInputDock } from '@/components/shared/chat/ChatInputDock';
import { ChatMessageList } from '@/components/ui/chat-message-list';
import { Skeleton } from '@/components/ui/skeleton';

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

  // Chat state persistence
  const {
    state: persistedState,
    isHydrated,
    setSessionId: persistSessionId,
    setDraftMessage,
    recordActivity,
  } = useChatPersistence(user?.id);

  // Track activity for coach visibility
  useAthleteActivity(user?.id, sessionId, messages.length > 0 && !isLoading);

  // Auth
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

  // Voice integration
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
      if (!isFinal) setInputValue(text);
    },
    onAudioComplete: async (transcribedText) => {
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

  // Initialize session ID
  useEffect(() => {
    if (!user?.id || !isHydrated) return;

    const initializeSession = async () => {
      try {
        if (persistedState.sessionId) {
          setSessionId(persistedState.sessionId);
          return;
        }
        const response = await fetch('/api/chat?limit=1');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.length > 0) {
            const recentSessionId = data.data[0].id;
            setSessionId(recentSessionId);
            persistSessionId(recentSessionId);
            return;
          }
        }
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);
        persistSessionId(newSessionId);
      } catch (error) {
        console.error('Failed to initialize session:', error);
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);
        persistSessionId(newSessionId);
      }
    };
    initializeSession();
  }, [user?.id, isHydrated, persistedState.sessionId, persistSessionId]);

  // Restore draft message
  useEffect(() => {
    if (isHydrated && persistedState.draftMessage && !inputValue) {
      setInputValue(persistedState.draftMessage);
    }
  }, [isHydrated, persistedState.draftMessage]);

  // Save draft message
  useEffect(() => {
    if (isHydrated && inputValue !== persistedState.draftMessage) {
      setDraftMessage(inputValue);
    }
  }, [inputValue, isHydrated]);

  // Load message history
  useEffect(() => {
    if (!sessionId || !user?.id) return;

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
  }, [sessionId, user?.id]);

  // --- SSE stream handler for text messages ---
  const processSSELine = (line: string) => {
    if (!line.startsWith('data: ')) return;
    const data = line.slice(6).trim();
    if (data === '[DONE]' || !data) return;

    try {
      const parsed = JSON.parse(data);

      if (parsed.type === 'crisis_alert' || parsed.type === 'crisis_check') {
        setCrisisAlert({
          final_risk_level: parsed.data.severity || parsed.data.final_risk_level || 'HIGH',
          message: 'We noticed your message may indicate distress. Professional support is available 24/7 at the National Suicide Prevention Lifeline: 988',
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
      } else if (parsed.type === 'metadata') {
        setCurrentMetadata(parsed.data as StructuredMetadata);
      } else if (parsed.type === 'widget') {
        const widgetType = parsed.data?.widgetType;
        const widgetPayload = parsed.data?.payload;
        if (widgetType && widgetPayload) {
          setCurrentMetadata((prev) => {
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
            if (widgetType === 'action_plan') updated.action_plan = widgetPayload;
            else if (widgetType === 'practice_drill') updated.practice_drill = widgetPayload;
            else if (widgetType === 'routine') updated.pre_performance_routine = widgetPayload;
            return updated;
          });
        }
      }
    } catch {}
  };

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
    setDraftMessage('');
    setIsLoading(true);
    setCrisisAlert(null);
    recordActivity();

    try {
      const assistantId = `msg_${Date.now()}_assistant`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
      ]);

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: userInput,
          athlete_id: user.id,
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
          processSSELine(line);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content === '') {
          lastMsg.content = "Oops! Something went wrong on my end. Let's try that again - I'm here and ready to help!";
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // --- Loading / Auth states ---
  if (authLoading) {
    return (
      <div className="flex flex-col h-full gap-4 p-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-12 w-1/2 self-end" />
        <Skeleton className="h-16 w-3/4" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please sign in to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <CrisisResourcesModal
        crisis={crisisAlert}
        onClose={() => setCrisisAlert(null)}
      />

      {/* Crisis Alert Banner */}
      {crisisAlert && (
        <div className={`border-b px-4 py-3 ${crisisAlert.final_risk_level === 'CRITICAL' ? 'bg-destructive/10 border-destructive/30' : 'bg-warning/10 border-warning/30'} animate-fade-in`}>
          <div className="flex items-start gap-3 max-w-3xl mx-auto">
            <div className="flex-shrink-0 mt-0.5">
              <svg className={`w-5 h-5 ${crisisAlert.final_risk_level === 'CRITICAL' ? 'text-destructive' : 'text-warning'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground">Support Available 24/7</p>
              <p className="text-sm text-muted-foreground mt-1">{crisisAlert.message}</p>
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

      {/* Messages Area — ChatMessageList handles auto-scroll + scroll-to-bottom button */}
      {messages.length === 0 ? (
        <div className="flex-1">
          <ChatEmptyState />
        </div>
      ) : (
        <ChatMessageList smooth className="flex-1">
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            const isStreaming = isLoading && index === messages.length - 1 && !isUser;

            return (
              <ChatBubble
                key={message.id}
                role={message.role}
                content={message.content}
                isStreaming={isStreaming}
                timestamp={message.timestamp}
                showCopy={!isUser && !isStreaming}
              />
            );
          })}

          {/* Structured Response Widgets */}
          {currentMetadata && (
            <div className="space-y-4 px-0 md:px-4">
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

              {currentMetadata.tracking.metrics.length > 0 && (
                <MetricTrackerWidget
                  metrics={currentMetadata.tracking.metrics}
                  adherence_check={currentMetadata.tracking.adherence_check}
                  one_word_debrief={currentMetadata.tracking.one_word_debrief}
                  onLogMetric={async (metricName, value) => {
                    console.log(`Metric logged: ${metricName} = ${value}`);
                  }}
                />
              )}

              {currentMetadata.practice_drill && (
                <PracticeDrillCard
                  drill={currentMetadata.practice_drill}
                  onStartDrill={() => {
                    console.log('Drill started:', currentMetadata.practice_drill?.name);
                  }}
                  onTrackProgress={(week, notes) => {
                    console.log(`Week ${week} progress:`, notes);
                  }}
                />
              )}

              {currentMetadata.pre_performance_routine && (
                <RoutineBuilderWidget
                  routine={currentMetadata.pre_performance_routine}
                  onComplete={() => console.log('Routine completed!')}
                  onSaveCustomization={(customizedRoutine) => {
                    console.log('Customized routine (not persisted):', customizedRoutine);
                  }}
                />
              )}
            </div>
          )}
        </ChatMessageList>
      )}

      {/* Input Dock */}
      <ChatInputDock
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={sendMessage}
        onKeyDown={handleKeyDown}
        isLoading={isLoading}
        voiceMode={voiceMode}
        voiceState={voiceState}
        volume={volume}
        isListening={isListening}
        transcript={transcript}
        voiceError={voiceError}
        onToggleVoice={() => {
          setVoiceMode(!voiceMode);
          toggleVoice();
        }}
        voiceDisabled={isLoading || !sessionId || !user?.id}
      />

      {/* Mobile Voice Widget */}
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
