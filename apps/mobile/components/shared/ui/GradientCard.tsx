import React from 'react';
import { StyleSheet, View, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';

interface GradientCardProps {
  colors?: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
  children?: React.ReactNode;
  onPress?: () => void;
}

export function GradientCard({
  colors = ['#fff', '#fafafa'] as const,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  children,
  onPress,
}: GradientCardProps) {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
          style,
        ]}
      >
        <LinearGradient
          colors={colors as any}
          start={start}
          end={end}
          style={styles.gradient}
        >
          {children}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={colors as any}
        start={start}
        end={end}
        style={styles.gradient}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  gradient: {
    padding: 16,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
