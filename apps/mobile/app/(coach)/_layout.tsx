import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useRef, useEffect } from 'react';

// Animated Tab Icon Component with Bubble Effect
function AnimatedTabIcon({
  name,
  focusedName,
  color,
  focused,
  gradient = false,
}: {
  name: string;
  focusedName: string;
  color: string;
  focused: boolean;
  gradient?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.1 : 1)).current;
  const bubbleAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.1 : 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(bubbleAnim, {
        toValue: focused ? 1 : 0,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  const bubbleScale = bubbleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const bubbleOpacity = bubbleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (gradient && focused) {
    return (
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.bubbleContainer,
            {
              transform: [{ scale: bubbleScale }],
              opacity: bubbleOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={['#3b82f6', '#2563eb', '#1e40af']} // Blue gradient for coach
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBubble}
          >
            <View style={styles.glowEffect} />
            <Ionicons
              name={focused ? focusedName : name}
              size={28}
              color="#fff"
            />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.iconWrapper,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {focused && (
        <Animated.View
          style={[
            styles.bubbleContainer,
            {
              transform: [{ scale: bubbleScale }],
              opacity: bubbleOpacity,
            },
          ]}
        >
          <View style={[styles.bubble, focused && styles.bubbleActive]}>
            <Ionicons
              name={focused ? focusedName : name}
              size={26}
              color={focused ? Colors.primary : color}
            />
          </View>
        </Animated.View>
      )}
      {!focused && (
        <Ionicons
          name={focused ? focusedName : name}
          size={26}
          color={color}
        />
      )}
    </Animated.View>
  );
}

export default function CoachLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.1)',
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingTop: Spacing.sm,
          paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
          paddingHorizontal: Spacing.xs,
          shadowColor: '#3b82f6',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 24,
        },
        tabBarLabelStyle: {
          fontSize: Typography.xs,
          fontWeight: '700',
          marginTop: 4,
          letterSpacing: 0.5,
        },
        tabBarItemStyle: {
          paddingVertical: Spacing.xs,
        },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="analytics-outline"
              focusedName="analytics"
              color={color}
              focused={focused}
              gradient
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        }}
      />

      <Tabs.Screen
        name="athletes"
        options={{
          title: 'Athletes',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="people-outline"
              focusedName="people"
              color={color}
              focused={focused}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
      />

      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Assignments',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="clipboard-outline"
              focusedName="clipboard"
              color={color}
              focused={focused}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="settings-outline"
              focusedName="settings"
              color={color}
              focused={focused}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 40,
  },
  bubbleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blue glass for coach
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  bubbleActive: {
    shadowColor: '#3b82f6', // Blue glow
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  gradientBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#3b82f6', // Blue glow for gradient bubble
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 16,
  },
  glowEffect: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
