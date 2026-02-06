import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { apiClient, getStoredUserRole } from '../../lib/auth';
import { useTheme } from '../../contexts/ThemeContext';

export default function SettingsScreen() {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [consentChatSummaries, setConsentChatSummaries] = useState(false);
  const [consentCoachView, setConsentCoachView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'ATHLETE' | 'COACH' | 'ADMIN' | null>(null);

  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editedProfile, setEditedProfile] = useState<any>({});

  // Notification settings state
  const [notifications, setNotifications] = useState({
    pushEnabled: true,
    taskReminders: true,
    assignmentNotifs: true,
    chatMessages: false,
    goalMilestones: true,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const role = await getStoredUserRole();
      setUserRole(role);

      // Load profile and notification settings for all users
      await Promise.all([
        loadProfile(),
        loadNotificationSettings(),
      ]);

      // Only load consent settings for athletes
      if (role === 'ATHLETE') {
        await loadConsentSettings();
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      setIsLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await apiClient.getProfile();
      setProfile(response.profile);
      setEditedProfile(response.profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const response = await apiClient.getNotificationSettings();
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const loadConsentSettings = async () => {
    try {
      // Fetch athlete consent settings from API
      const response = await apiClient.getConsentSettings();
      setConsentChatSummaries(response.consent.consentChatSummaries);
      setConsentCoachView(response.consent.consentCoachView);
    } catch (error) {
      console.error('Failed to load consent settings:', error);
      // Don't show alert - just log the error
    } finally {
      setIsLoading(false);
    }
  };

  const updateConsent = async (field: 'consentChatSummaries' | 'consentCoachView', value: boolean) => {
    try {
      const response = await apiClient.updateConsentSettings({
        [field]: value,
      });

      // Update local state with response
      setConsentChatSummaries(response.consent.consentChatSummaries);
      setConsentCoachView(response.consent.consentCoachView);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to update consent:', error);
      Alert.alert('Error', 'Failed to update privacy settings. Please try again.');
    }
  };

  const handleChatSummaryToggle = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (value) {
      // Turning ON - show explanation
      Alert.alert(
        'Share Chat Summaries',
        'This allows your coach to view weekly summaries of your chat sessions. Individual messages remain private - only high-level summaries (themes, emotional state) are shared.\n\nYou can turn this off anytime.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Allow',
            onPress: () => updateConsent('consentChatSummaries', true),
          },
        ]
      );
    } else {
      // Turning OFF - confirm
      Alert.alert(
        'Stop Sharing Summaries',
        'Your coach will no longer see weekly summaries of your chat sessions.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop Sharing',
            style: 'destructive',
            onPress: () => updateConsent('consentChatSummaries', false),
          },
        ]
      );
    }
  };

  const handleCoachViewToggle = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (value) {
      Alert.alert(
        'Allow Coach Analytics',
        'This allows your coach to view your mood trends, goal progress, and performance metrics in their dashboard. Chat content remains private.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Allow',
            onPress: () => updateConsent('consentCoachView', true),
          },
        ]
      );
    } else {
      Alert.alert(
        'Hide Analytics from Coach',
        'Your coach will no longer see your personal metrics and trends.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Hide',
            style: 'destructive',
            onPress: () => updateConsent('consentCoachView', false),
          },
        ]
      );
    }
  };

  const updateNotification = async (field: keyof typeof notifications, value: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Optimistic update
      setNotifications(prev => ({ ...prev, [field]: value }));

      const response = await apiClient.updateNotificationSettings({
        [field]: value,
      });

      // Update with server response
      setNotifications(response.notifications);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to update notification:', error);
      // Revert on error
      setNotifications(prev => ({ ...prev, [field]: !value }));
      Alert.alert('Error', 'Failed to update notification setting. Please try again.');
    }
  };

  const handleProfileEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditedProfile(profile);
    setShowProfileModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const updates: any = {};
      if (editedProfile.name !== profile.name) updates.name = editedProfile.name;
      if (editedProfile.sport !== profile.sport) updates.sport = editedProfile.sport;
      if (editedProfile.year !== profile.year) updates.year = editedProfile.year;
      if (editedProfile.teamPosition !== profile.teamPosition) updates.teamPosition = editedProfile.teamPosition;

      if (Object.keys(updates).length === 0) {
        setShowProfileModal(false);
        return;
      }

      const response = await apiClient.updateProfile(updates);
      setProfile(response.profile);
      setShowProfileModal(false);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated successfully');

      // Update stored user data
      await AsyncStorage.setItem('user_data', JSON.stringify({
        ...JSON.parse(await AsyncStorage.getItem('user_data') || '{}'),
        name: response.profile.name,
      }));
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

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
          colors={[Colors.primary, Colors.secondary, Colors.accent]}
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
                <Text style={styles.headerSubtitle}>Manage your preferences</Text>
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
        {/* Privacy & Coach Consent - Only show for athletes */}
        {userRole === 'ATHLETE' && (
          <>
            <SectionHeader title="Privacy & Coach Access" />
            <View style={styles.card}>
              <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                style={styles.cardGradient}
              >
                <SettingItem
                  icon="eye-outline"
                  iconColor="#a78bfa"
                  title="Share Chat Summaries"
                  subtitle={
                    consentChatSummaries
                      ? 'Coach can view weekly summaries'
                      : 'Coach cannot view summaries (recommended)'
                  }
                  rightComponent={
                    <Switch
                      value={consentChatSummaries}
                      onValueChange={handleChatSummaryToggle}
                      trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#8b5cf6' }}
                      thumbColor={consentChatSummaries ? '#fff' : '#f4f3f4'}
                      ios_backgroundColor="rgba(255,255,255,0.2)"
                    />
                  }
                />
                <View style={styles.separator} />
                <SettingItem
                  icon="analytics-outline"
                  iconColor="#34d399"
                  title="Share Analytics"
                  subtitle={
                    consentCoachView
                      ? 'Coach can view mood & goal trends'
                      : 'Analytics are private'
                  }
                  rightComponent={
                    <Switch
                      value={consentCoachView}
                      onValueChange={handleCoachViewToggle}
                      trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#10b981' }}
                      thumbColor={consentCoachView ? '#fff' : '#f4f3f4'}
                      ios_backgroundColor="rgba(255,255,255,0.2)"
                    />
                  }
                />
              </LinearGradient>
            </View>
          </>
        )}

        {/* Profile */}
        <SectionHeader title="Profile" />
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.cardGradient}
          >
            <SettingItem
              icon="person-outline"
              iconColor="#f472b6"
              title="Edit Profile"
              subtitle={profile ? `${profile.name} • ${profile.sport || 'No sport'}` : 'Update your information'}
              onPress={handleProfileEdit}
            />
          </LinearGradient>
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.cardGradient}
          >
            <SettingItem
              icon="notifications-outline"
              iconColor="#60a5fa"
              title="Push Notifications"
              subtitle={notifications.pushEnabled ? 'Enabled' : 'Disabled'}
              rightComponent={
                <Switch
                  value={notifications.pushEnabled}
                  onValueChange={(value) => updateNotification('pushEnabled', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#60a5fa' }}
                  thumbColor={notifications.pushEnabled ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor="rgba(255,255,255,0.2)"
                />
              }
            />
            <View style={styles.separator} />
            <SettingItem
              icon="checkmark-circle-outline"
              iconColor="#10b981"
              title="Assignment Reminders"
              subtitle={notifications.assignmentNotifs ? 'Get notified about assignments' : 'No reminders'}
              rightComponent={
                <Switch
                  value={notifications.assignmentNotifs}
                  onValueChange={(value) => updateNotification('assignmentNotifs', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#10b981' }}
                  thumbColor={notifications.assignmentNotifs ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor="rgba(255,255,255,0.2)"
                />
              }
            />
            <View style={styles.separator} />
            <SettingItem
              icon="trophy-outline"
              iconColor="#f59e0b"
              title="Goal Milestones"
              subtitle={notifications.goalMilestones ? 'Celebrate your progress' : 'No milestone alerts'}
              rightComponent={
                <Switch
                  value={notifications.goalMilestones}
                  onValueChange={(value) => updateNotification('goalMilestones', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#f59e0b' }}
                  thumbColor={notifications.goalMilestones ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor="rgba(255,255,255,0.2)"
                />
              }
            />
            <View style={styles.separator} />
            <SettingItem
              icon="chatbubble-outline"
              iconColor="#ec4899"
              title="Chat Messages"
              subtitle={notifications.chatMessages ? 'Get notified about messages' : 'No chat notifications'}
              rightComponent={
                <Switch
                  value={notifications.chatMessages}
                  onValueChange={(value) => updateNotification('chatMessages', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#ec4899' }}
                  thumbColor={notifications.chatMessages ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor="rgba(255,255,255,0.2)"
                />
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
              icon={isDarkMode ? "moon" : "sunny"}
              iconColor={isDarkMode ? "#a78bfa" : "#f59e0b"}
              title="Dark Mode"
              subtitle={isDarkMode ? 'Reduce eye strain in low light' : 'Switch to dark theme'}
              rightComponent={
                <Switch
                  value={isDarkMode}
                  onValueChange={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    toggleTheme();
                  }}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#a78bfa' }}
                  thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor="rgba(255,255,255,0.2)"
                />
              }
            />
            <View style={styles.separator} />
            <SettingItem
              icon="language-outline"
              iconColor="#60a5fa"
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
                Alert.alert('Help Center', 'Contact support@flowsportscoach.com for assistance')
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
                  'Flow Sports Coach',
                  'Version 1.0.0\n\nYour 24/7 mental performance coach powered by AI.\n\nBuilt with evidence-based sports psychology.'
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

      {/* Profile Edit Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <LinearGradient
            colors={[Colors.background, Colors.card, Colors.cardElevated]}
            style={styles.modalGradient}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowProfileModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={handleSaveProfile}
                style={styles.modalSaveButton}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={editedProfile.name || ''}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
                  placeholder="Your name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
              </View>

              {/* Sport */}
              {userRole === 'ATHLETE' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Sport</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editedProfile.sport || ''}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, sport: text })}
                      placeholder="Your sport"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                    />
                  </View>

                  {/* Year */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Year</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={editedProfile.year || 'FRESHMAN'}
                        onValueChange={(value) => setEditedProfile({ ...editedProfile, year: value })}
                        style={styles.picker}
                        dropdownIconColor="#fff"
                      >
                        <Picker.Item label="Freshman" value="FRESHMAN" />
                        <Picker.Item label="Sophomore" value="SOPHOMORE" />
                        <Picker.Item label="Junior" value="JUNIOR" />
                        <Picker.Item label="Senior" value="SENIOR" />
                        <Picker.Item label="Graduate" value="GRADUATE" />
                      </Picker>
                    </View>
                  </View>

                  {/* Team Position */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Position / Role</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editedProfile.teamPosition || ''}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, teamPosition: text })}
                      placeholder="Your position or role"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                    />
                  </View>
                </>
              )}
            </ScrollView>
          </LinearGradient>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    shadowColor: '#8b5cf6',
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
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalGradient: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: '#fff',
  },
  modalSaveButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: '#8b5cf6',
    borderRadius: BorderRadius.lg,
  },
  modalSaveText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.xl,
  },
  formLabel: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: Typography.base,
    color: '#fff',
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    backgroundColor: 'transparent',
  },
});
