/**
 * Coach Settings Screen
 * Profile management and app preferences for coaches
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function CoachSettingsScreen() {
  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(['authToken', 'userId']);
            router.replace('/(auth)/login');
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
      },
    ]);
  };

  const SettingItem = ({
    icon,
    iconColor = 'rgba(255,255,255,0.7)',
    title,
    subtitle,
    onPress,
    showChevron = true,
    destructive = false,
    rightComponent,
  }: {
    icon: any;
    iconColor?: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showChevron?: boolean;
    destructive?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={destructive ? '#ef4444' : iconColor} />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, destructive && styles.settingTitleDestructive]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent}
      {showChevron && !rightComponent && (
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <View style={styles.container}>
      {/* Dark gradient background */}
      <LinearGradient
        colors={[Colors.background, Colors.card, Colors.cardElevated]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header with gradient */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#3b82f6', '#2563eb', '#1e40af']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.iconGradient}
                >
                  <Ionicons name="person-circle" size={28} color="#fff" />
                </LinearGradient>
              </View>
              <View>
                <Text style={styles.headerTitle}>Settings</Text>
                <Text style={styles.headerSubtitle}>Coach preferences</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <SectionHeader title="Profile" />
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.cardGradient}
          >
            <SettingItem
              icon="person-outline"
              iconColor="#60a5fa"
              title="Edit Profile"
              subtitle="Update your information"
              onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon')}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="school-outline"
              iconColor="#34d399"
              title="Team & Sport"
              subtitle="Update sports and team info"
              onPress={() => Alert.alert('Coming Soon', 'Team settings will be available soon')}
            />
          </LinearGradient>
        </View>

        {/* Coach Tools */}
        <SectionHeader title="Coach Tools" />
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.cardGradient}
          >
            <SettingItem
              icon="notifications-outline"
              iconColor="#f59e0b"
              title="Crisis Alerts"
              subtitle="Manage alert notifications"
              onPress={() =>
                Alert.alert('Coming Soon', 'Crisis alert settings will be available soon')
              }
            />
            <View style={styles.separator} />
            <SettingItem
              icon="bar-chart-outline"
              iconColor="#8b5cf6"
              title="Reports"
              subtitle="Configure team reports"
              onPress={() => Alert.alert('Coming Soon', 'Report settings will be available soon')}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="people-circle-outline"
              iconColor="#ec4899"
              title="Athlete Consent"
              subtitle="View consent status"
              onPress={() =>
                Alert.alert('Coming Soon', 'Consent management will be available soon')
              }
            />
          </LinearGradient>
        </View>

        {/* App Settings */}
        <SectionHeader title="App Settings" />
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.cardGradient}
          >
            <SettingItem
              icon="notifications-outline"
              iconColor="#60a5fa"
              title="Notifications"
              subtitle="Manage push notifications"
              onPress={() =>
                Alert.alert('Coming Soon', 'Notification settings will be available soon')
              }
            />
            <View style={styles.separator} />
            <SettingItem
              icon="language-outline"
              iconColor="#a78bfa"
              title="Language"
              subtitle="English"
              onPress={() => Alert.alert('Coming Soon', 'Language settings will be available soon')}
            />
          </LinearGradient>
        </View>

        {/* Support */}
        <SectionHeader title="Support" />
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.cardGradient}
          >
            <SettingItem
              icon="help-circle-outline"
              iconColor="#34d399"
              title="Help Center"
              subtitle="Get help and support"
              onPress={() =>
                Alert.alert('Help Center', 'Contact support@aisportsagent.com for assistance')
              }
            />
            <View style={styles.separator} />
            <SettingItem
              icon="information-circle-outline"
              iconColor="#60a5fa"
              title="About"
              subtitle="Version 1.0.0"
              onPress={() =>
                Alert.alert(
                  'AI Sports Agent',
                  'Version 1.0.0\n\nCoach Dashboard\n\nMonitor and support your athletes with AI-powered insights.'
                )
              }
            />
            <View style={styles.separator} />
            <SettingItem
              icon="shield-outline"
              iconColor="#a78bfa"
              title="Privacy Policy"
              onPress={() => Alert.alert('Coming Soon', 'Privacy policy will be available soon')}
            />
          </LinearGradient>
        </View>

        {/* Logout */}
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.1)']}
            style={styles.cardGradient}
          >
            <SettingItem
              icon="log-out-outline"
              title="Log Out"
              onPress={handleLogout}
              showChevron={false}
              destructive
            />
          </LinearGradient>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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
    borderRadius: 28,
    overflow: 'hidden',
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  sectionHeader: {
    fontSize: Typography.xs,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  cardGradient: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.xl,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  settingTitleDestructive: {
    color: '#ef4444',
  },
  settingSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: Spacing.lg + 24 + Spacing.md,
  },
  bottomPadding: {
    height: 40,
  },
});
