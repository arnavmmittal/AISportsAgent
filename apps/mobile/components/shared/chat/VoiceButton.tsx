/**
 * Voice Button Component
 * Animated microphone button for voice chat with visual state feedback
 */

import { TouchableOpacity, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/theme';
import type { VoiceState } from '../../hooks/useVoiceChat';

interface VoiceButtonProps {
  voiceState: VoiceState;
  volume: number; // 0-1
  onPress: () => void;
  disabled?: boolean;
}

export function VoiceButton({
  voiceState,
  volume,
  onPress,
  disabled = false,
}: VoiceButtonProps) {
  // Animated values
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Handle press with haptic feedback
  const handlePress = () => {
    if (disabled) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Press animation
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 150 })
    );

    onPress();
  };

  // Listening state: pulsing animation
  useEffect(() => {
    if (voiceState === 'listening') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite repeat
        false
      );
    } else {
      pulseScale.value = withSpring(1);
    }
  }, [voiceState]);

  // Volume-based scale when speaking
  useEffect(() => {
    if (voiceState === 'speaking') {
      const volumeScale = 1 + volume * 0.3;
      scale.value = withSpring(volumeScale, {
        damping: 10,
        stiffness: 100,
      });
    } else if (voiceState === 'idle') {
      scale.value = withSpring(1);
    }
  }, [volume, voiceState]);

  // Error state: shake animation
  useEffect(() => {
    if (voiceState === 'error') {
      rotation.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [voiceState]);

  // Animated styles
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: voiceState === 'listening' ? 0.3 : 0,
  }));

  // Get button color based on state
  const getButtonColor = (): string => {
    switch (voiceState) {
      case 'listening':
        return Colors.error; // Red when recording
      case 'processing':
        return Colors.warning; // Orange when processing
      case 'speaking':
        return Colors.success; // Green when speaking
      case 'error':
        return Colors.error;
      default:
        return Colors.primary; // Blue when idle
    }
  };

  // Get icon based on state
  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (voiceState) {
      case 'listening':
        return 'mic';
      case 'processing':
        return 'hourglass';
      case 'speaking':
        return 'volume-high';
      case 'error':
        return 'alert-circle';
      default:
        return 'mic-outline';
    }
  };

  const buttonColor = getButtonColor();

  return (
    <View style={styles.container}>
      {/* Pulse ring for listening state */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            backgroundColor: buttonColor,
          },
          animatedPulseStyle,
        ]}
      />

      {/* Main button */}
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || voiceState === 'processing'}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.button,
            {
              backgroundColor: buttonColor,
            },
            animatedButtonStyle,
          ]}
        >
          {voiceState === 'processing' ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <Ionicons name={getIcon()} size={32} color="#fff" />

              {/* Recording indicator dot */}
              {voiceState === 'listening' && (
                <View style={styles.recordingDot} />
              )}
            </>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Volume bars for speaking state */}
      {voiceState === 'speaking' && (
        <View style={styles.volumeBars}>
          <View style={[styles.volumeBar, { height: volume * 20 + 4 }]} />
          <View style={[styles.volumeBar, { height: volume * 25 + 4 }]} />
          <View style={[styles.volumeBar, { height: volume * 20 + 4 }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  recordingDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  volumeBars: {
    position: 'absolute',
    bottom: -30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  volumeBar: {
    width: 6,
    backgroundColor: Colors.success,
    borderRadius: 3,
    minHeight: 4,
  },
});
