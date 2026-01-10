'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Activity, Target, Brain, Zap } from 'lucide-react';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { VoiceButton, AudioVisualizer } from '@/components/shared/voice/VoiceButton';
import { ActionPlanWidget } from '@/components/shared/chat/ActionPlanWidget';
import { MetricTrackerWidget } from '@/components/shared/chat/MetricTrackerWidget';
import { PracticeDrillCard } from '@/components/shared/chat/PracticeDrillCard';
import { RoutineBuilderWidget } from '@/components/shared/chat/RoutineBuilderWidget';
import { CrisisResourcesModal } from '@/components/shared/chat/CrisisResourcesModal';
import { Button } from '@/design-system/components/Button';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { cn } from '@/lib/utils';

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

  // Initialize session ID
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

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
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
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      content: updated[lastIndex].content + parsed.data.content
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
                      content: updated[lastIndex].content + parsed.data
                    };
                  }
                  return updated;
                });
              } else if (parsed.type === 'metadata') {
                setCurrentMetadata(parsed.data as StructuredMetadata);
              }
            } catch (e) {
              // Ignore parse errors
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
          lastMsg.content = "I apologize - there was a technical issue. Please try again, and I'll be here to help.";
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
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-950">
        <Card variant="elevated" className="max-w-md text-center">
          <div className="p-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Authentication Required</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please sign in to access your mental performance coach.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Crisis Resources Modal */}
      <CrisisResourcesModal
        crisis={crisisAlert}
        onClose={() => setCrisisAlert(null)}
      />

      {/* Crisis Alert Banner */}
      <AnimatePresence>
        {crisisAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-danger-50 dark:bg-danger-900/20 border-b border-danger-200 dark:border-danger-800 p-4"
          >
            <div className="flex items-start gap-3 max-w-4xl mx-auto">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-danger-100 dark:bg-danger-900/40 flex items-center justify-center">
                <Activity className="w-5 h-5 text-danger-600 dark:text-danger-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-sm text-danger-900 dark:text-danger-100 mb-1">
                  Support Available 24/7
                </p>
                <p className="text-sm text-danger-700 dark:text-danger-300">
                  {crisisAlert.message}
                </p>
              </div>
              <button
                onClick={() => setCrisisAlert(null)}
                className="text-danger-600 dark:text-danger-400 hover:text-danger-800 dark:hover:text-danger-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="py-12"
            >
              {/* Empty State - Professional, No Emojis */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 mb-6">
                  <Brain className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="font-display font-semibold text-2xl md:text-3xl text-gray-900 dark:text-gray-100 mb-3">
                  Your Mental Performance Coach
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
                  Available 24/7 to help you build confidence, manage pressure, and perform at your peak.
                </p>
              </div>

              {/* Starter Prompts - Clean Cards */}
              <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => setInputValue("I'm feeling anxious before my next competition")}
                  className="group"
                >
                  <Card
                    variant="default"
                    interactive
                    padding="md"
                    className="text-left h-full hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                        <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-display font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                          Manage Pre-Competition Anxiety
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Build confidence and calm nerves
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setInputValue("How can I improve my focus during practice?")}
                  className="group"
                >
                  <Card
                    variant="default"
                    interactive
                    padding="md"
                    className="text-left h-full hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary-50 dark:bg-secondary-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary-100 dark:group-hover:bg-secondary-900/30 transition-colors">
                        <Zap className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                      </div>
                      <div>
                        <p className="font-display font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                          Enhance Focus & Concentration
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Enter flow state consistently
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setInputValue("I'm struggling to bounce back from mistakes")}
                  className="group"
                >
                  <Card
                    variant="default"
                    interactive
                    padding="md"
                    className="text-left h-full hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success-50 dark:bg-success-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-success-100 dark:group-hover:bg-success-900/30 transition-colors">
                        <Activity className="w-5 h-5 text-success-600 dark:text-success-400" />
                      </div>
                      <div>
                        <p className="font-display font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                          Build Mental Resilience
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Recover quickly from setbacks
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setInputValue("Help me balance academics and athletics")}
                  className="group"
                >
                  <Card
                    variant="default"
                    interactive
                    padding="md"
                    className="text-left h-full hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-info-50 dark:bg-info-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-info-100 dark:group-hover:bg-info-900/30 transition-colors">
                        <Brain className="w-5 h-5 text-info-600 dark:text-info-400" />
                      </div>
                      <div>
                        <p className="font-display font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                          Balance Life & Performance
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Manage stress and priorities
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: 'easeOut'
                  }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {/* AI Avatar - Left side */}
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}

                  {/* Message Content */}
                  <div className={cn(
                    'flex flex-col gap-1 max-w-[75%] md:max-w-[65%]',
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}>
                    <div className={cn(
                      'rounded-2xl px-4 py-3 font-body text-sm leading-relaxed',
                      message.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-700'
                    )}>
                      {message.content ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400 px-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* User Avatar - Right side */}
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />

          {/* Structured Response Widgets */}
          {currentMetadata && (
            <div className="space-y-4 mt-4">
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
                  onLogMetric={(metricName, value) => {
                    console.log(`Logged ${metricName}: ${value}`);
                  }}
                />
              )}

              {currentMetadata.practice_drill && (
                <PracticeDrillCard
                  drill={currentMetadata.practice_drill}
                  onStartDrill={() => {
                    console.log('Starting drill:', currentMetadata.practice_drill?.name);
                  }}
                  onTrackProgress={(week, notes) => {
                    console.log(`Week ${week} progress:`, notes);
                  }}
                />
              )}

              {currentMetadata.pre_performance_routine && (
                <RoutineBuilderWidget
                  routine={currentMetadata.pre_performance_routine}
                  onComplete={() => {
                    console.log('Routine completed!');
                  }}
                  onSaveCustomization={(customizedRoutine) => {
                    console.log('Saving customized routine:', customizedRoutine);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Audio visualizer */}
          {isListening && (
            <div className="mb-4 flex justify-center">
              <AudioVisualizer
                volume={volume}
                isActive={isListening}
                bars={16}
                className="w-full max-w-md"
              />
            </div>
          )}

          {/* Live transcript */}
          {transcript && voiceMode && (
            <div className="mb-3 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
              <p className="text-sm text-primary-900 dark:text-primary-100">
                <span className="font-semibold">Listening:</span> {transcript}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={voiceMode ? "Voice mode active - tap mic to speak" : "Type your message..."}
              className={cn(
                "flex-1 resize-none rounded-lg px-4 py-3 text-sm",
                "border border-gray-300 dark:border-gray-700",
                "bg-white dark:bg-gray-800",
                "text-gray-900 dark:text-gray-100",
                "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed",
                "transition-all"
              )}
              rows={2}
              disabled={isLoading || voiceMode}
            />

            <VoiceButton
              voiceState={voiceState}
              volume={volume}
              onToggle={() => {
                setVoiceMode(!voiceMode);
                toggleVoice();
              }}
              disabled={isLoading || !sessionId || !session?.user?.id}
            />

            <Button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim() || voiceMode}
              size="lg"
              variant="primary"
              rightIcon={<Send className="w-4 h-4" />}
              className="px-6"
            >
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>

          {/* Voice error */}
          {voiceError && (
            <div className="mt-3 p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
              <p className="text-sm text-danger-700 dark:text-danger-300">
                <span className="font-semibold">Voice error:</span> {voiceError.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
