/**
 * SuccessBanner Component
 * Displays success messages with auto-dismiss
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface SuccessBannerProps {
  message: string;
  autoDismiss?: boolean;
  duration?: number;  // milliseconds
  onDismiss?: () => void;
}

export function SuccessBanner({
  message,
  autoDismiss = true,
  duration = 3000,
  onDismiss,
}: SuccessBannerProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Slide in
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Auto-dismiss
    if (autoDismiss) {
      const timer = setTimeout(() => {
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onDismiss?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <Text style={styles.icon}>✅</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});
