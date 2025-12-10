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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    wsUrl: `ws://10.0.0.127:3000/api/voice`, // TODO: Make this configurable
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
              if (parsed.type === 'content') {
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
    const newMode = chatMode === 'text' ? 'voice' : 'text';
    setChatMode(newMode);

    // Stop voice if switching to text mode
    if (newMode === 'text' && voice.voiceState !== 'idle') {
      voice.stopVoice();
    }
  };

  // Start new chat
  const startNewChat = () => {
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
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
        <EmptyState
          icon="chatbubbles-outline"
          title="Start a conversation"
          message="I'm here to help with your mental performance, training, and well-being."
          actionButtons={[
            {
              label: "Pre-game anxiety",
              onPress: () => {
                setInputValue("I'm feeling anxious about my upcoming game");
                setChatMode('text');
              },
            },
            {
              label: "Motivation tips",
              onPress: () => {
                setInputValue("I need help staying motivated");
                setChatMode('text');
              },
            },
            {
              label: "Focus strategies",
              onPress: () => {
                setInputValue("How can I improve my focus?");
                setChatMode('text');
              },
            },
          ]}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  item.role === 'user' && styles.userMessageText,
                ]}
              >
                {item.content || '...'}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.messagesContainer}
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
            style={[
              styles.sendButton,
              (!inputValue.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: '#fff',
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
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
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
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    ...Shadows.small,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray300,
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
