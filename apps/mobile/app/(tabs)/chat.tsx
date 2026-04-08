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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [crisisAlert, setCrisisAlert] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);
  const voiceClient = useRef<VoiceWebSocketClient | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const id = await getStoredUserId();
        if (!id) {
          setInitError('User not logged in');
          return;
        }
        setUserId(id);
      } catch (error: any) {
        setInitError(error.message || 'Failed to initialize');
      }
    }
    init();
  }, []);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !userId) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      sessionId: sessionId || '',
      role: 'user',
      content: inputValue,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const assistantId = `msg_${Date.now()}_assistant`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          sessionId: sessionId || '',
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
            } else if (parsed.type === 'done') {
              // Stream complete
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
    setMessages([]);
    setSessionId(undefined);
  };

  const initializeVoiceClient = async () => {
    if (!userId) return;

    try {
      const client = new VoiceWebSocketClient({
        wsUrl: `${config.voiceUrl}/api/voice/stream`,
        sessionId,
        athleteId: userId,
        onTranscript: (transcript) => {
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
          setIsProcessingVoice(false);
          const assistantMessage: Message = {
            id: `msg_${Date.now()}_assistant`,
            sessionId,
            role: 'assistant',
            content: response,
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        },
        onError: (error) => {
          setIsProcessingVoice(false);
        },
        onCrisisAlert: (severity, message) => {
          Alert.alert('Support Resources Available', message, [
            { text: 'OK', style: 'default' },
          ]);
        },
        onConnectionChange: (connected) => {
          setVoiceConnected(connected);
        },
      });

      await client.connect();
      voiceClient.current = client;
    } catch (error: any) {
      // Voice is optional
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      try {
        setIsRecording(false);
        setIsProcessingVoice(true);
        if (voiceClient.current) {
          await voiceClient.current.stopRecording();
        }
      } catch (error: any) {
        setIsProcessingVoice(false);
        Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
      }
    } else {
      try {
        if (!voiceClient.current || !voiceConnected) {
          await initializeVoiceClient();
        }
        if (!voiceClient.current) {
          throw new Error('Voice client not initialized');
        }
        await voiceClient.current.startRecording();
        setIsRecording(true);
      } catch (error: any) {
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
        onAction={() => {}}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CrisisResourcesModal crisis={crisisAlert} onClose={() => setCrisisAlert(null)} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.aiIcon}>
                <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Flow Coach</Text>
                <Text style={styles.headerSubtitle}>Your mental edge</Text>
              </View>
            </View>
            <TouchableOpacity onPress={startNewChat} style={styles.newChatButton}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <View style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses" size={48} color={Colors.accent} />
              <Text style={styles.emptyTitle}>Ready to talk?</Text>
              <Text style={styles.emptyMessage}>
                Share what's on your mind — let's get to work.
              </Text>
              <View style={styles.suggestionsGrid}>
                {[
                  { text: 'Pre-game anxiety tips', prompt: "I get anxious before games..." },
                  { text: 'Build confidence', prompt: "How do I believe in myself more?" },
                  { text: 'Stress management', prompt: "I'm feeling overwhelmed..." },
                  { text: 'Get in the zone', prompt: "Help me find my flow state..." },
                ].map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionCard}
                    onPress={() => setInputValue(suggestion.prompt)}
                  >
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
                  <View
                    style={[
                      styles.messageBubble,
                      item.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    {item.content ? (
                      <Text
                        style={[
                          styles.messageText,
                          item.role === 'user' && styles.userMessageText,
                        ]}
                      >
                        {item.content}
                      </Text>
                    ) : (
                      <View style={styles.typingIndicator}>
                        <Text style={styles.typingText}>...</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Input Area */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="What's on your mind..."
              placeholderTextColor={Colors.gray400}
              multiline
              maxLength={2000}
              editable={!isLoading && !isProcessingVoice}
            />

            <View style={styles.inputButtons}>
              {/* Voice button */}
              <TouchableOpacity
                style={[
                  styles.voiceButton,
                  isRecording && styles.voiceButtonRecording,
                ]}
                onPress={toggleRecording}
                disabled={isLoading || isProcessingVoice}
              >
                {isProcessingVoice ? (
                  <ActivityIndicator color={Colors.accent} size="small" />
                ) : (
                  <Ionicons
                    name={isRecording ? 'stop-circle' : 'mic'}
                    size={22}
                    color={isRecording ? Colors.error : Colors.accent}
                  />
                )}
              </TouchableOpacity>

              {/* Send button */}
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputValue.trim() && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="arrow-up" size={20} color="#fff" />
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
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  // Header
  header: {
    paddingTop: 60,
    backgroundColor: Colors.primary,
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
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    backgroundColor: Colors.gray700,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: Typography.base,
    color: '#fff',
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.gray100,
  },
  typingIndicator: {
    paddingVertical: 4,
  },
  typingText: {
    fontSize: Typography.lg,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
  },
  // Input
  inputWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xxxl + 60 : Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    fontSize: Typography.base,
    color: Colors.textPrimary,
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
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
