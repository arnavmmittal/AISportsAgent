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
import type { Message } from '@sports-agent/types';
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

            if (parsed.type === 'session') {
              if (parsed.data?.sessionId) {
                setSessionId(parsed.data.sessionId);
              }
            } else if (parsed.type === 'token' || parsed.type === 'content') {
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
              setCrisisAlert({
                final_risk_level: parsed.data.severity || parsed.data.final_risk_level || 'HIGH',
                message: parsed.data.message || 'We noticed your message may indicate distress. Professional support is available 24/7.',
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } else if (parsed.type === 'done') {
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
          setIsProcessingVoice(false);
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
          setIsProcessingVoice(false);
          setVoiceError(error);
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
    }
  };

  const toggleRecording = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (isRecording) {
      try {
        console.log('🛑 Stopping voice recording...');
        setIsRecording(false);
        setIsProcessingVoice(true);
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
        setIsProcessingVoice(false);
        Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
      }
    } else {
      try {
        console.log('🎤 Starting voice recording...');

        if (!voiceClient.current || !voiceConnected) {
          await initializeVoiceClient();
        }

        if (!voiceClient.current) {
          throw new Error('Voice client not initialized');
        }

        await voiceClient.current.startRecording();
        setIsRecording(true);

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
      <CrisisResourcesModal crisis={crisisAlert} onClose={() => setCrisisAlert(null)} />

      {/* Clean background */}
      <View style={styles.background} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Professional Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#2563eb', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="fitness" size={24} color="#fff" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Performance Coach</Text>
                  <Text style={styles.headerSubtitle}>Mental Performance Support</Text>
                </View>
              </View>
              <TouchableOpacity onPress={startNewChat} style={styles.newChatButton}>
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Messages */}
        <Animated.View style={[styles.messagesContainer, { opacity: fadeAnim }]}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="chatbubbles" size={48} color="#3b82f6" />
              </View>

              <Text style={styles.emptyTitle}>Your Mental Performance Coach</Text>

              <Text style={styles.emptyMessage}>
                Get immediate support for pre-game anxiety, confidence building, stress management, and peak performance.
              </Text>

              <View style={styles.suggestionsContainer}>
                {[
                  { icon: 'fitness-outline', text: 'Pre-game preparation', prompt: "I have a big game coming up and feeling anxious..." },
                  { icon: 'trophy-outline', text: 'Build confidence', prompt: "How can I build more confidence in my abilities?" },
                  { icon: 'pulse-outline', text: 'Manage stress', prompt: "I'm feeling overwhelmed with pressure..." },
                  { icon: 'chatbubble-ellipses-outline', text: 'Find flow state', prompt: "Help me get into the zone during competition..." },
                ].map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionCard}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setInputValue(suggestion.prompt);
                    }}
                  >
                    <Ionicons name={suggestion.icon as any} size={24} color="#3b82f6" />
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
                    <View style={styles.avatarContainer}>
                      <Ionicons name="fitness" size={18} color="#3b82f6" />
                    </View>
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
                            { transform: [{ translateY: dot1Anim }] }
                          ]}
                        />
                        <Animated.View
                          style={[
                            styles.typingDot,
                            { transform: [{ translateY: dot2Anim }] }
                          ]}
                        />
                        <Animated.View
                          style={[
                            styles.typingDot,
                            { transform: [{ translateY: dot3Anim }] }
                          ]}
                        />
                      </View>
                    )}
                  </View>

                  {item.role === 'user' && (
                    <View style={[styles.avatarContainer, styles.userAvatar]}>
                      <Ionicons name="person" size={18} color="#fff" />
                    </View>
                  )}
                </View>
              )}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>

        {/* Input Area */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Message your coach..."
              placeholderTextColor="rgba(148, 163, 184, 0.6)"
              multiline
              maxLength={2000}
              editable={!isLoading && !isProcessingVoice}
            />

            <View style={styles.inputButtons}>
              {/* Voice button */}
              <Animated.View
                style={{ transform: [{ scale: micPulseAnim }] }}
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
                    <ActivityIndicator color="#3b82f6" size="small" />
                  ) : (
                    <Ionicons
                      name={isRecording ? "stop-circle" : "mic"}
                      size={22}
                      color={isRecording ? '#ef4444' : '#64748b'}
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
                        ? ['#94a3b8', '#94a3b8']
                        : ['#2563eb', '#3b82f6']
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
    backgroundColor: '#0f172a',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
  },
  // Header
  header: {
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: Typography.base,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxxl,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    width: '100%',
  },
  suggestionCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  suggestionText: {
    fontSize: Typography.sm,
    color: '#cbd5e1',
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
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: Typography.base,
    color: '#e2e8f0',
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
    backgroundColor: '#64748b',
  },
  // Input
  inputWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xxxl + 60 : Spacing.lg,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    fontSize: Typography.base,
    color: '#f1f5f9',
    paddingTop: 10,
    paddingBottom: 10,
  },
  inputButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  voiceButtonRecording: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
