import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { Message } from '@sports-agent/types';
import { apiClient, getStoredUserId } from '../../lib/auth';
import { sendChatMessage, getBackendStatus } from '../../lib/apiWithFallback';
import { VoiceButton } from '../../components/chat/VoiceButton';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import { EmptyState, LoadingScreen, ErrorView } from '../../components/ui';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

type ChatMode = 'text' | 'voice';

export default function ChatScreen() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(`session_${Date.now()}`);
  const [chatMode, setChatMode] = useState<ChatMode>('text');
  const [userId, setUserId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const modeToggleAnim = useRef(new Animated.Value(0)).current;

  // Initialize user ID and check backend status
  useEffect(() => {
    async function init() {
      try {
        const id = await getStoredUserId();
        if (!id) {
          setInitError('User not logged in');
          return;
        }
        setUserId(id);

        // Check backend status
        const status = getBackendStatus();
        setIsBackendAvailable(status.available);
      } catch (error: any) {
        setInitError(error.message || 'Failed to initialize');
      }
    }
    init();

    // Check backend status periodically
    const interval = setInterval(() => {
      const status = getBackendStatus();
      setIsBackendAvailable(status.available);

      // If backend becomes unavailable while in voice mode, switch to text
      if (!status.available && chatMode === 'voice') {
        setChatMode('text');
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [chatMode]);

  // Voice chat hook (only initialize if userId is available)
  const voice = useVoiceChat({
    sessionId,
    athleteId: userId || '',
    wsUrl: `ws://10.0.0.127:8000/api/voice/ws`, // MCP server WebSocket endpoint
  });

  // Animate mode toggle
  useEffect(() => {
    Animated.spring(modeToggleAnim, {
      toValue: chatMode === 'voice' ? 1 : 0,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [chatMode]);

  // Add voice transcript to messages
  useEffect(() => {
    if (voice.transcript && chatMode === 'voice') {
      // Update or add user's transcript message
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === 'user' && lastMessage.id.startsWith('voice_')) {
          // Update existing transcript
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: voice.transcript },
          ];
        } else {
          // Add new transcript message
          return [
            ...prev,
            {
              id: `voice_${Date.now()}`,
              sessionId,
              role: 'user',
              content: voice.transcript,
              createdAt: new Date(),
            },
          ];
        }
      });
    }
  }, [voice.transcript, chatMode]);

  // Add AI response to messages
  useEffect(() => {
    if (voice.aiResponse && chatMode === 'voice') {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === 'assistant' && lastMessage.id.startsWith('voice_ai_')) {
          // Update existing AI message
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: voice.aiResponse },
          ];
        } else {
          // Add new AI message
          return [
            ...prev,
            {
              id: `voice_ai_${Date.now()}`,
              sessionId,
              role: 'assistant',
              content: voice.aiResponse,
              createdAt: new Date(),
            },
          ];
        }
      });
    }
  }, [voice.aiResponse, chatMode]);

  // Handle voice errors
  useEffect(() => {
    if (voice.error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          sessionId,
          role: 'assistant',
          content: `Voice error: ${voice.error.message}. Please try again or switch to text mode.`,
          createdAt: new Date(),
        },
      ]);
    }
  }, [voice.error]);

  // Send text message
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

    try {
      // Create assistant message placeholder
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

      // Stream response
      const response = await sendChatMessage({
        session_id: sessionId,
        message: userMessage.content,
        athlete_id: userId,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // React Native: Use .text() instead of getReader()
      const responseText = await response.text();

      if (!responseText) {
        throw new Error('No response body');
      }

      // Parse SSE format
      const lines = responseText.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          if (!data) continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content') {
              // Small delay for smooth streaming effect
              await new Promise(resolve => setTimeout(resolve, 20));

              setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                if (updated[lastIndex]?.role === 'assistant') {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    content: updated[lastIndex].content + parsed.data,
                  };
                }
                return updated;
              });
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Toggle chat mode
  const toggleChatMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMode = chatMode === 'text' ? 'voice' : 'text';
    setChatMode(newMode);

    // Stop voice if switching to text mode
    if (newMode === 'text' && voice.voiceState !== 'idle') {
      voice.stopVoice();
    }
  };

  // Start new chat
  const startNewChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMessages([]);
    setSessionId(`session_${Date.now()}`);
    if (voice.voiceState !== 'idle') {
      voice.stopVoice();
    }
  };

  // Show loading screen while initializing
  if (!userId && !initError) {
    return <LoadingScreen message="Initializing chat..." />;
  }

  // Show error if initialization failed
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

  // Mode toggle indicator position
  const toggleIndicatorTranslate = modeToggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60], // Width of each mode button
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#eff6ff', '#f3e8ff', '#fce7f3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>AI Coach</Text>
          <TouchableOpacity onPress={startNewChat} style={styles.newChatButton}>
            <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeToggleContainer}>
          <View style={styles.modeToggle}>
            <Animated.View
              style={[
                styles.modeToggleIndicator,
                {
                  transform: [{ translateX: toggleIndicatorTranslate }],
                },
              ]}
            />
            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => setChatMode('text')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={chatMode === 'text' ? Colors.primary : Colors.gray500}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  chatMode === 'text' && styles.modeButtonTextActive,
                ]}
              >
                Text
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => {
                if (isBackendAvailable) {
                  setChatMode('voice');
                }
              }}
              activeOpacity={isBackendAvailable ? 0.7 : 1}
            >
              <Ionicons
                name="mic-outline"
                size={20}
                color={
                  !isBackendAvailable
                    ? Colors.gray300
                    : chatMode === 'voice'
                    ? Colors.primary
                    : Colors.gray500
                }
              />
              <Text
                style={[
                  styles.modeButtonText,
                  chatMode === 'voice' && styles.modeButtonTextActive,
                  !isBackendAvailable && styles.modeButtonTextDisabled,
                ]}
              >
                Voice
              </Text>
            </TouchableOpacity>
          </View>

          {/* Demo mode notice */}
          {!isBackendAvailable && (
            <View style={styles.demoModeNotice}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.warning} />
              <Text style={styles.demoModeText}>
                Voice mode requires backend connection • Using demo mode for text chat
              </Text>
            </View>
          )}

          {/* Voice connection status */}
          {chatMode === 'voice' && isBackendAvailable && (
            <View style={styles.voiceStatus}>
              <View
                style={[
                  styles.voiceStatusDot,
                  voice.isConnected ? styles.voiceStatusConnected : styles.voiceStatusDisconnected,
                ]}
              />
              <Text style={styles.voiceStatusText}>
                {voice.isConnected ? 'Connected' : 'Connecting...'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.emptyStateContainer}>
          <LinearGradient
            colors={['#3b82f6', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyIconCircle}
          >
            <Ionicons name="chatbubbles" size={64} color="#fff" />
          </LinearGradient>

          <Text style={styles.emptyTitle}>Hey there! Ready to level up? 💪</Text>

          <Text style={styles.emptyMessage}>
            I'm your 24/7 mental performance coach. Whether you're battling pre-game jitters, need a confidence boost, or just want to chat about what's on your mind - I've got your back. Let's unlock your full potential together!
          </Text>

          <View style={styles.suggestionGrid}>
            <TouchableOpacity
              style={[styles.suggestionCard, { borderColor: '#93c5fd' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setInputValue("I get so anxious before games...");
                setChatMode('text');
              }}
            >
              <Text style={styles.suggestionEmoji}>🎯</Text>
              <Text style={styles.suggestionTitle}>Crush Pre-Game Nerves</Text>
              <Text style={styles.suggestionSubtitle}>"I get so anxious before games..."</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.suggestionCard, { borderColor: '#c4b5fd' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setInputValue("How do I believe in myself more?");
                setChatMode('text');
              }}
            >
              <Text style={styles.suggestionEmoji}>💪</Text>
              <Text style={styles.suggestionTitle}>Boost Your Confidence</Text>
              <Text style={styles.suggestionSubtitle}>"How do I believe in myself more?"</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.suggestionCard, { borderColor: '#fbcfe8' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setInputValue("I'm overwhelmed juggling everything...");
                setChatMode('text');
              }}
            >
              <Text style={styles.suggestionEmoji}>🧘</Text>
              <Text style={styles.suggestionTitle}>Balance Life & Sport</Text>
              <Text style={styles.suggestionSubtitle}>"I'm overwhelmed juggling everything..."</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.suggestionCard, { borderColor: '#a5b4fc' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setInputValue("Help me get in the zone...");
                setChatMode('text');
              }}
            >
              <Text style={styles.suggestionEmoji}>⚡</Text>
              <Text style={styles.suggestionTitle}>Find Your Flow State</Text>
              <Text style={styles.suggestionSubtitle}>"Help me get in the zone..."</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
              {/* Avatar */}
              <LinearGradient
                colors={item.role === 'user' ? ['#3b82f6', '#1e40af'] : ['#a855f7', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Ionicons
                  name={item.role === 'user' ? 'person' : 'chatbubbles'}
                  size={24}
                  color="#fff"
                />
              </LinearGradient>

              {/* Message Content */}
              <View style={styles.messageContent}>
                {item.role === 'user' ? (
                  <LinearGradient
                    colors={['#3b82f6', '#2563eb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.messageBubble, styles.userBubble]}
                  >
                    {item.content ? (
                      <Text style={styles.userMessageText}>{item.content}</Text>
                    ) : (
                      <View style={styles.typingIndicator}>
                        <View style={[styles.typingDot, { backgroundColor: '#93c5fd' }]} />
                        <View style={[styles.typingDot, { backgroundColor: '#60a5fa' }]} />
                        <View style={[styles.typingDot, { backgroundColor: '#3b82f6' }]} />
                      </View>
                    )}
                  </LinearGradient>
                ) : (
                  <View style={[styles.messageBubble, styles.assistantBubble]}>
                    {item.content ? (
                      <Text style={styles.messageText}>{item.content}</Text>
                    ) : (
                      <View style={styles.typingIndicator}>
                        <View style={[styles.typingDot, { backgroundColor: '#c4b5fd' }]} />
                        <View style={[styles.typingDot, { backgroundColor: '#a78bfa' }]} />
                        <View style={[styles.typingDot, { backgroundColor: '#8b5cf6' }]} />
                      </View>
                    )}
                  </View>
                )}

                {/* Timestamp */}
                <Text
                  style={[
                    styles.timestamp,
                    item.role === 'user' ? styles.timestampUser : styles.timestampAssistant,
                  ]}
                >
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.messagesListContainer}
        />
      )}

      {/* Voice state indicator */}
      {chatMode === 'voice' && voice.voiceState !== 'idle' && (
        <View style={styles.voiceStateIndicator}>
          <Text style={styles.voiceStateText}>
            {voice.voiceState === 'listening' && '🎙️ Listening...'}
            {voice.voiceState === 'processing' && '⏳ Processing...'}
            {voice.voiceState === 'speaking' && '🔊 Speaking...'}
            {voice.voiceState === 'error' && '❌ Error'}
          </Text>
        </View>
      )}

      {/* Input Area */}
      {chatMode === 'text' ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="What's on your mind?"
            placeholderTextColor={Colors.gray400}
            multiline
            maxLength={2000}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.sendButtonContainer}
            onPress={() => {
              if (inputValue.trim() && !isLoading) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                sendMessage();
              }
            }}
            disabled={!inputValue.trim() || isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                !inputValue.trim() || isLoading
                  ? [Colors.gray300, Colors.gray400]
                  : ['#2563eb', '#3b82f6']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButton}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.voiceInputContainer}>
          <VoiceButton
            voiceState={voice.voiceState}
            volume={voice.volume}
            onPress={voice.toggleVoice}
            disabled={!voice.isConnected}
          />
          <Text style={styles.voiceHint}>
            {voice.voiceState === 'idle'
              ? 'Tap to start speaking'
              : voice.voiceState === 'listening'
              ? 'Listening... (auto-stops after silence)'
              : voice.voiceState === 'processing'
              ? 'Processing your message...'
              : voice.voiceState === 'speaking'
              ? 'AI is responding...'
              : 'Tap to try again'}
          </Text>
        </View>
      )}
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    ...Shadows.small,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  newChatButton: {
    padding: Spacing.xs,
  },
  modeToggleContainer: {
    paddingHorizontal: Spacing.lg,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    padding: 4,
    position: 'relative',
  },
  modeToggleIndicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    width: 60,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    zIndex: 1,
  },
  modeButtonText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.gray500,
  },
  modeButtonTextActive: {
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  modeButtonTextDisabled: {
    color: Colors.gray300,
  },
  demoModeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: '#fff3cd',
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  demoModeText: {
    fontSize: Typography.xs,
    color: '#856404',
    flex: 1,
  },
  voiceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  voiceStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  voiceStatusConnected: {
    backgroundColor: Colors.success,
  },
  voiceStatusDisconnected: {
    backgroundColor: Colors.warning,
  },
  voiceStatusText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  messagesContainer: {
    flex: 1,
  },
  emptyStateContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.large,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyMessage: {
    fontSize: Typography.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.md,
  },
  suggestionGrid: {
    width: '100%',
    gap: Spacing.md,
  },
  suggestionCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    marginBottom: Spacing.sm,
    ...Shadows.medium,
  },
  suggestionEmoji: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  suggestionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  suggestionSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  messagesListContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  messageRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
  },
  messageRowAssistant: {
    flexDirection: 'row',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  messageContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  messageBubble: {
    padding: Spacing.lg,
    borderRadius: 24,
    ...Shadows.medium,
  },
  userBubble: {
    borderTopRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e9d5ff',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  userMessageText: {
    color: '#fff',
    fontSize: Typography.base,
    lineHeight: 24,
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  typingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    // Animation will be added via Animated.View
  },
  timestamp: {
    fontSize: Typography.xs,
    fontWeight: '600',
    paddingHorizontal: Spacing.sm,
  },
  timestampUser: {
    color: '#2563eb',
    textAlign: 'right',
  },
  timestampAssistant: {
    color: '#7c3aed',
    textAlign: 'left',
  },
  voiceStateIndicator: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  voiceStateText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: Typography.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gray100,
    borderRadius: 22,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  sendButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    ...Shadows.small,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  voiceInputContainer: {
    padding: Spacing.xl,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  voiceHint: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
