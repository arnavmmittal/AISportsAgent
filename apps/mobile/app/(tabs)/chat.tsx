import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { Message } from '@flow-sports-coach/types';
import { apiClient, getStoredUserId } from '../../lib/auth';
import { sendChatMessage } from '../../lib/apiWithFallback';
import { LoadingScreen, ErrorView } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { VoiceWebSocketClient } from '../../lib/voice';
import config from '../../config';
import { CrisisResourcesModal } from '../../components/chat/CrisisResourcesModal';

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(`session_${Date.now()}`);
  const [userId, setUserId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [crisisAlert, setCrisisAlert] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  const voiceClient = useRef<VoiceWebSocketClient | null>(null);

  // Animated values for typing dots
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function init() {
      try {
        const id = await getStoredUserId();
        if (!id) {
          setInitError('User not logged in');
          return;
        }
        setUserId(id);

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      } catch (error: any) {
        setInitError(error.message || 'Failed to initialize');
      }
    }
    init();
  }, []);

  // Animate typing dots when loading
  useEffect(() => {
    if (isLoading) {
      const createDotAnimation = (dotAnim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dotAnim, {
              toValue: -8,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dotAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animations = Animated.parallel([
        createDotAnimation(dot1Anim, 0),
        createDotAnimation(dot2Anim, 150),
        createDotAnimation(dot3Anim, 300),
      ]);

      animations.start();

      return () => {
        animations.stop();
        dot1Anim.setValue(0);
        dot2Anim.setValue(0);
        dot3Anim.setValue(0);
      };
    }
  }, [isLoading]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !userId) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      sessionId,
      role: 'user',
      content: inputValue,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const assistantId = `msg_${Date.now()}_assistant`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          sessionId,
          role: 'assistant',
          content: '',
          createdAt: new Date(),
        },
      ]);

      const response = await sendChatMessage({
        session_id: sessionId,
        message: userMessage.content,
        athlete_id: userId,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const responseText = await response.text();
      if (!responseText) {
        throw new Error('No response body');
      }

      const lines = responseText.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          if (!data) continue;

          try {
            const parsed = JSON.parse(data);

            // Handle different event types from OpenAI streaming
            if (parsed.type === 'session') {
              // Update session ID if provided by backend
              if (parsed.data?.sessionId) {
                setSessionId(parsed.data.sessionId);
              }
            } else if (parsed.type === 'token' || parsed.type === 'content') {
              // Handle both new token streaming and legacy content events
              await new Promise(resolve => setTimeout(resolve, 20));

              setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                if (updated[lastIndex]?.role === 'assistant') {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    content: updated[lastIndex].content + (parsed.data?.content || parsed.data),
                  };
                }
                return updated;
              });
            } else if (parsed.type === 'crisis_alert' || parsed.type === 'crisis_check') {
              // Crisis detected - show resources modal
              setCrisisAlert({
                final_risk_level: parsed.data.severity || parsed.data.final_risk_level || 'HIGH',
                message: parsed.data.message || 'We noticed your message may indicate distress. Professional support is available 24/7.',
              });
              // Haptic feedback for crisis alert
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } else if (parsed.type === 'done') {
              // Stream complete
              console.log('✅ Stream complete');
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          sessionId,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const startNewChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMessages([]);
    setSessionId(`session_${Date.now()}`);
  };

  const initializeVoiceClient = async () => {
    if (!userId) return;

    try {
      const client = new VoiceWebSocketClient({
        wsUrl: `${config.voiceUrl}/api/voice/stream`,
        sessionId,
        athleteId: userId,
        onTranscript: (transcript) => {
          console.log('📝 Transcript received:', transcript);
          // Add user message with transcript
          const userMessage: Message = {
            id: `msg_${Date.now()}`,
            sessionId,
            role: 'user',
            content: transcript,
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, userMessage]);
        },
        onResponse: (response) => {
          console.log('💬 Response received:', response);
          setIsProcessingVoice(false); // Clear loading state when response arrives
          // Add assistant message with response
          const assistantMessage: Message = {
            id: `msg_${Date.now()}_assistant`,
            sessionId,
            role: 'assistant',
            content: response,
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        onError: (error) => {
          console.log('Voice not available:', error);
          setIsProcessingVoice(false); // Clear loading state on error
          setVoiceError(error);
          // Don't show alert for connection errors - voice is optional
        },
        onCrisisAlert: (severity, message) => {
          console.warn('⚠️ Crisis alert:', severity, message);
          Alert.alert('Support Resources Available', message, [
            { text: 'OK', style: 'default' },
          ]);
        },
        onConnectionChange: (connected) => {
          setVoiceConnected(connected);
          console.log(`🔌 Voice connection: ${connected ? 'Connected' : 'Disconnected'}`);
        },
      });

      await client.connect();
      voiceClient.current = client;
      console.log('✅ Voice client initialized and connected');
    } catch (error: any) {
      console.log('Voice client initialization skipped (optional feature):', error);
      setVoiceError(error.message || 'Voice service unavailable');
      // Don't alert - voice is optional and will be handled when user tries to use it
    }
  };

  const toggleRecording = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (isRecording) {
      // Stop recording
      try {
        console.log('🛑 Stopping voice recording...');
        setIsRecording(false);
        setIsProcessingVoice(true); // Start processing state
        Animated.timing(micPulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();

        if (voiceClient.current) {
          await voiceClient.current.stopRecording();
          console.log('✅ Voice recording stopped and sent');
        }
      } catch (error: any) {
        console.error('Error stopping recording:', error);
        setIsProcessingVoice(false); // Clear processing state on error
        Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
      }
    } else {
      // Start recording
      try {
        console.log('🎤 Starting voice recording...');

        // Initialize voice client if not connected
        if (!voiceClient.current || !voiceConnected) {
          await initializeVoiceClient();
        }

        if (!voiceClient.current) {
          throw new Error('Voice client not initialized');
        }

        await voiceClient.current.startRecording();
        setIsRecording(true);

        // Pulsing animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(micPulseAnim, {
              toValue: 1.3,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(micPulseAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ).start();

        console.log('✅ Voice recording started');
      } catch (error: any) {
        console.log('Voice recording not available:', error);
        setIsRecording(false);
        Alert.alert('Voice Not Available', 'Voice input is currently unavailable. Please use text input instead.');
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceClient.current) {
        voiceClient.current.disconnect();
      }
    };
  }, []);

  if (!userId && !initError) {
    return <LoadingScreen message="Initializing chat..." />;
  }

  if (initError) {
    return (
      <ErrorView
        title="Initialization Error"
        message={initError}
        actionLabel="Try Again"
        onAction={() => window.location.reload()}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Crisis Resources Modal */}
      <CrisisResourcesModal crisis={crisisAlert} onClose={() => setCrisisAlert(null)} />

      {/* Dark gradient background */}
      <LinearGradient
        colors={[Colors.background, Colors.card, Colors.cardElevated]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary, Colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.aiIconContainer}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                    style={styles.aiIconGradient}
                  >
                    <Ionicons name="chatbubbles" size={24} color="#fff" />
                  </LinearGradient>
                </View>
                <View>
                  <Text style={styles.headerTitle}>AI Coach</Text>
                  <Text style={styles.headerSubtitle}>Always here to help</Text>
                </View>
              </View>
              <TouchableOpacity onPress={startNewChat} style={styles.newChatButton}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.newChatGradient}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Messages */}
        <Animated.View style={[styles.messagesContainer, { opacity: fadeAnim }]}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIconContainer}
              >
                <Ionicons name="chatbubbles" size={56} color="#fff" />
              </LinearGradient>

              <Text style={styles.emptyTitle}>Ready to talk? 💬</Text>

              <Text style={styles.emptyMessage}>
                I'm your AI mental performance coach. Share what's on your mind, and let's work through it together.
              </Text>

              <View style={styles.suggestionsGrid}>
                {[
                  { emoji: '🎯', text: 'Pre-game anxiety tips', prompt: "I get anxious before games..." },
                  { emoji: '💪', text: 'Build confidence', prompt: "How do I believe in myself more?" },
                  { emoji: '🧘', text: 'Stress management', prompt: "I'm feeling overwhelmed..." },
                  { emoji: '⚡', text: 'Get in the zone', prompt: "Help me find my flow state..." },
                ].map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionCard}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setInputValue(suggestion.prompt);
                    }}
                  >
                    <Text style={styles.suggestionEmoji}>{suggestion.emoji}</Text>
                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.messageRow,
                    item.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant,
                  ]}
                >
                  {item.role === 'assistant' && (
                    <LinearGradient
                      colors={[Colors.primary, Colors.secondary]}
                      style={styles.avatar}
                    >
                      <Ionicons name="chatbubbles" size={20} color="#fff" />
                    </LinearGradient>
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      item.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    {item.content ? (
                      <Text style={[
                        styles.messageText,
                        item.role === 'user' && styles.userMessageText
                      ]}>
                        {item.content}
                      </Text>
                    ) : (
                      <View style={styles.typingIndicator}>
                        <Animated.View
                          style={[
                            styles.typingDot,
                            { backgroundColor: '#a78bfa', transform: [{ translateY: dot1Anim }] }
                          ]}
                        />
                        <Animated.View
                          style={[
                            styles.typingDot,
                            { backgroundColor: '#c4b5fd', transform: [{ translateY: dot2Anim }] }
                          ]}
                        />
                        <Animated.View
                          style={[
                            styles.typingDot,
                            { backgroundColor: '#ddd6fe', transform: [{ translateY: dot3Anim }] }
                          ]}
                        />
                      </View>
                    )}
                  </View>

                  {item.role === 'user' && (
                    <LinearGradient
                      colors={['#3b82f6', '#60a5fa']}
                      style={styles.avatar}
                    >
                      <Ionicons name="person" size={20} color="#fff" />
                    </LinearGradient>
                  )}
                </View>
              )}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>

        {/* Input Area - ChatGPT Style */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Message AI Coach..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
              maxLength={2000}
              editable={!isLoading && !isProcessingVoice}
            />

            <View style={styles.inputButtons}>
              {/* Voice/Mic button */}
              <Animated.View
                style={[
                  styles.voiceButtonWrapper,
                  { transform: [{ scale: micPulseAnim }] }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.voiceButton,
                    isRecording && styles.voiceButtonRecording
                  ]}
                  onPress={toggleRecording}
                  disabled={isLoading || isProcessingVoice}
                >
                  {isProcessingVoice ? (
                    <ActivityIndicator color="#8b5cf6" size="small" />
                  ) : (
                    <Ionicons
                      name={isRecording ? "stop-circle" : "mic"}
                      size={22}
                      color={isRecording ? '#ec4899' : ((isLoading || isProcessingVoice) ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)')}
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Send button */}
              <TouchableOpacity
                style={[styles.sendButton, !inputValue.trim() && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <LinearGradient
                    colors={
                      !inputValue.trim()
                        ? ['rgba(139, 92, 246, 0.3)', 'rgba(217, 70, 239, 0.3)']
                        : ['#8b5cf6', '#d946ef']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sendButtonGradient}
                  >
                    <Ionicons name="arrow-up" size={20} color="#fff" />
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  // Header
  header: {
    paddingTop: 60,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aiIconContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  aiIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  newChatButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  newChatGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xxxl,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    width: '100%',
  },
  suggestionCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  suggestionEmoji: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  suggestionText: {
    fontSize: Typography.sm,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
  },
  messageRowAssistant: {
    flexDirection: 'row',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    backgroundColor: 'transparent',
  },
  assistantBubble: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  messageText: {
    fontSize: Typography.base,
    color: '#fff',
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Input - ChatGPT Style
  inputWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xxxl + 60 : Spacing.lg, // Extra padding for tab bar
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    fontSize: Typography.base,
    color: '#fff',
    paddingTop: 10,
    paddingBottom: 10,
  },
  inputButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  voiceButtonWrapper: {
    // Wrapper for animation
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonRecording: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)', // Pink glow when recording
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.4)',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
