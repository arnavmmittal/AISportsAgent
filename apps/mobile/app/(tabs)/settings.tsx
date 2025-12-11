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
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

export default function SettingsScreen() {
  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
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
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showChevron = true,
    destructive = false,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showChevron?: boolean;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, destructive && styles.iconCircleDestructive]}>
        <Ionicons
          name={icon}
          size={22}
          color={destructive ? Colors.error : Colors.primary}
        />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingTitle, destructive && styles.settingTitleDestructive]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.gray400}
        />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#2563eb', '#3b82f6', '#60a5fa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <SectionHeader title="PROFILE" />
          <View style={styles.card}>
            <SettingItem
              icon="person-outline"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon')}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="school-outline"
              title="Sport & Team"
              subtitle="Update your sport and position"
              onPress={() => Alert.alert('Coming Soon', 'Sport settings will be available soon')}
            />
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <SectionHeader title="APP SETTINGS" />
          <View style={styles.card}>
            <SettingItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Manage push notifications"
              onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available soon')}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Coming soon"
              onPress={() => Alert.alert('Coming Soon', 'Dark mode will be available soon')}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="language-outline"
              title="Language"
              subtitle="English"
              onPress={() => Alert.alert('Coming Soon', 'Language settings will be available soon')}
            />
          </View>
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <SectionHeader title="PRIVACY & SECURITY" />
          <View style={styles.card}>
            <SettingItem
              icon="lock-closed-outline"
              title="Privacy"
              subtitle="Control your data and privacy"
              onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon')}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Security"
              subtitle="Password and authentication"
              onPress={() => Alert.alert('Coming Soon', 'Security settings will be available soon')}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <SectionHeader title="SUPPORT" />
          <View style={styles.card}>
            <SettingItem
              icon="help-circle-outline"
              title="Help Center"
              subtitle="Get help and support"
              onPress={() => Alert.alert('Help Center', 'Contact support@aisportsagent.com')}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="information-circle-outline"
              title="About"
              subtitle="Version 1.0.0"
              onPress={() => Alert.alert('AI Sports Agent', 'Version 1.0.0\n\nYour mental performance coach')}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="document-text-outline"
              title="Terms of Service"
              onPress={() => Alert.alert('Coming Soon', 'Terms of service will be available soon')}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="shield-outline"
              title="Privacy Policy"
              onPress={() => Alert.alert('Coming Soon', 'Privacy policy will be available soon')}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <View style={styles.card}>
            <SettingItem
              icon="log-out-outline"
              title="Log Out"
              onPress={handleLogout}
              showChevron={false}
              destructive
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.bold,
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.gray500,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.lg,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    ...Shadows.small,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconCircleDestructive: {
    backgroundColor: `${Colors.error}15`,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  settingTitleDestructive: {
    color: Colors.error,
  },
  settingSubtitle: {
    fontSize: Typography.sm,
    color: Colors.gray500,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.gray200,
    marginLeft: 68,
  },
});
