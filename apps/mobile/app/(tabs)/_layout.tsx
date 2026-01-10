import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useRef, useEffect } from 'react';

// Clean animated tab icon component
function AnimatedTabIcon({
  name,
  focusedName,
  color,
  focused,
  primary = false,
}: {
  name: string;
  focusedName: string;
  color: string;
  focused: boolean;
  primary?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.1 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  const iconSize = primary ? 28 : 26;

  return (
    <Animated.View
      style={[
        styles.iconWrapper,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Ionicons
        name={(focused ? focusedName : name) as any}
        size={iconSize}
        color={color}
      />
      {focused && <View style={styles.activeIndicator} />}
    </Animated.View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#0f172a',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.08)',
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
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: Typography.xs,
          fontWeight: '600',
          marginTop: 4,
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
              primary
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
        name="assignments"
        options={{
          title: 'Tasks',
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
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b82f6',
  },
});
