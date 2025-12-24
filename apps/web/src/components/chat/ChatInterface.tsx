'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { VoiceButton, AudioVisualizer } from '@/components/voice/VoiceButton';
import { ActionPlanWidget } from '@/components/chat/ActionPlanWidget';
import { MetricTrackerWidget } from '@/components/chat/MetricTrackerWidget';
import { PracticeDrillCard } from '@/components/chat/PracticeDrillCard';
import { RoutineBuilderWidget } from '@/components/chat/RoutineBuilderWidget';
import { CrisisResourcesModal } from '@/components/chat/CrisisResourcesModal';

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
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [crisisAlert, setCrisisAlert] = useState<CrisisAlert | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [currentMetadata, setCurrentMetadata] = useState<StructuredMetadata | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      if (isFinal) {
        // Voice transcript is final - add as user message
        const userMessage: Message = {
          id: `msg_${Date.now()}`,
          role: 'user',
          content: text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
      }
    },
    onResponse: (text) => {
      // AI response from voice - add as assistant message
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (error) => {
      console.error('Voice error:', error);
    },
  });

  // Initialize session ID (persistent per user)
  useEffect(() => {
    if (session?.user?.id) {
      // Use persistent session ID based on user ID only (no timestamp)
      // This allows session history to persist across page refreshes
      setSessionId(`session_${session.user.id}`);
    }
  }, [session]);

  // Load message history when session ID is set
  useEffect(() => {
    if (!sessionId || !session?.user?.id) return;

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
  }, [sessionId, session?.user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !session?.user?.id || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    const userInput = inputValue;
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
          athlete_id: session.user.id,
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

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please sign in to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl shadow-2xl overflow-hidden">
      {/* Crisis Resources Modal */}
      <CrisisResourcesModal
        crisis={crisisAlert}
        onClose={() => setCrisisAlert(null)}
      />

      {/* Crisis Alert Banner */}
      {crisisAlert && (
        <div className="bg-gradient-to-r from-red-500 to-pink-500 border-b-4 border-red-600 p-5 animate-in fade-in duration-300 shadow-lg">
          <div className="flex items-start gap-4 max-w-4xl mx-auto">
            <div className="flex-shrink-0 bg-card rounded-full p-2">
              <svg className="w-7 h-7 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-white mb-2">Support Available 24/7</p>
              <p className="text-base text-white/95">{crisisAlert.message}</p>
            </div>
            <button onClick={() => setCrisisAlert(null)} className="text-white/80 hover:text-white transition-colors bg-card/20 rounded-full p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-8 shadow-2xl animate-pulse">
              <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-5">
              Hey there! Ready to level up? 💪
            </h3>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-10 leading-relaxed">
              I'm your 24/7 mental performance coach. Whether you're battling pre-game jitters, need a confidence boost, or just want to chat about what's on your mind - I've got your back. Let's unlock your full potential together!
            </p>
            <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto text-left">
              <div className="bg-card rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all transform hover:-translate-y-1">
                <p className="text-2xl mb-2">🎯</p>
                <p className="text-lg font-bold text-gray-900 mb-2">Crush Pre-Game Nerves</p>
                <p className="text-sm text-gray-600">"I get so anxious before games..."</p>
              </div>
              <div className="bg-card rounded-2xl p-6 border-2 border-purple-200 hover:border-purple-400 hover:shadow-xl transition-all transform hover:-translate-y-1">
                <p className="text-2xl mb-2">💪</p>
                <p className="text-lg font-bold text-gray-900 mb-2">Boost Your Confidence</p>
                <p className="text-sm text-gray-600">"How do I believe in myself more?"</p>
              </div>
              <div className="bg-card rounded-2xl p-6 border-2 border-pink-200 hover:border-pink-400 hover:shadow-xl transition-all transform hover:-translate-y-1">
                <p className="text-2xl mb-2">🧘</p>
                <p className="text-lg font-bold text-gray-900 mb-2">Balance Life & Sport</p>
                <p className="text-sm text-gray-600">"I'm overwhelmed juggling everything..."</p>
              </div>
              <div className="bg-card rounded-2xl p-6 border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-xl transition-all transform hover:-translate-y-1">
                <p className="text-2xl mb-2">⚡</p>
                <p className="text-lg font-bold text-gray-900 mb-2">Find Your Flow State</p>
                <p className="text-sm text-gray-600">"Help me get in the zone..."</p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex gap-4 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${message.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-purple-400 to-purple-600'}`}>
                  {message.role === 'user' ? (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                  )}
                </div>
                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-3xl px-6 py-4 shadow-xl ${message.role === 'user' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-md' : 'bg-card text-gray-900 border-2 border-purple-200 rounded-tl-md'}`}>
                    {message.content ? (
                      <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="flex space-x-2">
                        <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    )}
                  </div>
                  <p className={`text-sm mt-2 px-2 font-medium ${message.role === 'user' ? 'text-blue-600' : 'text-purple-600'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-4" />

        {/* Structured Response Widgets */}
        {currentMetadata && (
          <div className="px-4">
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
                onLogMetric={(metricName, value) => {
                  console.log(`Logged ${metricName}: ${value}`);
                  // TODO: Save to database
                }}
              />
            )}

            {/* Practice Drill Card (Phase 5.1) */}
            {currentMetadata.practice_drill && (
              <PracticeDrillCard
                drill={currentMetadata.practice_drill}
                onStartDrill={() => {
                  console.log('Starting drill:', currentMetadata.practice_drill?.name);
                  // TODO: Navigate to drill timer/tracker
                }}
                onTrackProgress={(week, notes) => {
                  console.log(`Week ${week} progress:`, notes);
                  // TODO: Save progress to database
                }}
              />
            )}

            {/* Pre-Performance Routine Widget (Phase 5.1) */}
            {currentMetadata.pre_performance_routine && (
              <RoutineBuilderWidget
                routine={currentMetadata.pre_performance_routine}
                onComplete={() => {
                  console.log('Routine completed!');
                  // TODO: Log completion, ask for feedback
                }}
                onSaveCustomization={(customizedRoutine) => {
                  console.log('Saving customized routine:', customizedRoutine);
                  // TODO: Save to athlete memory
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t-2 border-purple-200 bg-card/90 backdrop-blur-sm p-6 shadow-2xl">
        <div className="max-w-5xl mx-auto">
          {/* Audio visualizer when listening */}
          {isListening && (
            <div className="mb-5 flex justify-center">
              <AudioVisualizer
                volume={volume}
                isActive={isListening}
                bars={16}
                className="w-full max-w-md"
              />
            </div>
          )}

          {/* Live transcript display */}
          {transcript && voiceMode && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-2xl shadow-md">
              <p className="text-base text-blue-900">
                <span className="font-bold">You said:</span> {transcript}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={voiceMode ? "🎤 Voice mode active - click mic to speak" : "What's on your mind? I'm here to help..."}
              className="flex-1 resize-none border-3 border-purple-300 rounded-3xl px-6 py-4 text-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all disabled:bg-muted shadow-lg placeholder:text-muted-foreground"
              rows={2}
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
              disabled={isLoading || !sessionId || !session?.user?.id}
            />

            <button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim() || voiceMode}
              className="px-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 disabled:shadow-none disabled:scale-100 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>

          {/* Voice error display */}
          {voiceError && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-base text-red-700 shadow-md">
              <span className="font-bold">Voice error:</span> {voiceError.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
