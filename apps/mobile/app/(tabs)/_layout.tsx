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
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.9)).current;
  const bubbleAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.1 : 0.9,
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
            colors={['#2563eb', '#3b82f6', '#60a5fa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBubble}
          >
            <Ionicons
              name={focused ? focusedName : name}
              size={26}
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

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingTop: Spacing.sm,
          paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
          paddingHorizontal: Spacing.xs,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: Typography.xs,
          fontWeight: Typography.bold,
          marginTop: 4,
          letterSpacing: 0.3,
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
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="home-outline"
              focusedName="home"
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
        name="mood"
        options={{
          title: 'Mood',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="happy-outline"
              focusedName="happy"
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
        name="chat"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="chatbubbles-outline"
              focusedName="chatbubbles"
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
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="trophy-outline"
              focusedName="trophy"
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
          title: 'You',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              name="person-circle-outline"
              focusedName="person-circle"
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
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  bubbleActive: {
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
});
