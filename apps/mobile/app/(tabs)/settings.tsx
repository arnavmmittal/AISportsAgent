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
  const { theme, toggleTheme, isDarkMode, colors } = useTheme();
  const [consentChatSummaries, setConsentChatSummaries] = useState(true);
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
      const response = await apiClient.getConsentSettings();
      const consent = response?.consent;
      if (consent) {
        setConsentChatSummaries(consent.consentChatSummaries ?? true);
      }
    } catch (error) {
      console.error('Failed to load consent settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConsent = async (field: 'consentChatSummaries', value: boolean) => {
    try {
      const response = await apiClient.updateConsentSettings({
        [field]: value,
      });

      setConsentChatSummaries(response.consent.consentChatSummaries);

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

  // Theme-aware card gradient
  const cardGradientColors: [string, string] = isDarkMode
    ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
    : ['rgba(0,0,0,0.03)', 'rgba(0,0,0,0.01)'];

  const SettingItem = ({
    icon,
    iconColor = colors.textSecondary,
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
        <Ionicons name={icon} size={24} color={destructive ? colors.error : iconColor} />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary }, destructive && { color: colors.error }]}>
            {title}
          </Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent}
      {showChevron && !rightComponent && (
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: colors.textTertiary }]}>{title}</Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardElevated }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(212,115,46,0.12)' : 'rgba(201,93,18,0.08)' }]}>
                  <Ionicons name="person-circle" size={28} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Manage your preferences</Text>
              </View>
            </View>
          </View>
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
            {/* Always Shared */}
            <View style={styles.card}>
              <LinearGradient
                colors={[`${colors.primary}20`, `${colors.primary}10`]}
                style={[styles.cardGradient, { borderColor: colors.border }]}
              >
                <View style={styles.alwaysSharedHeader}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.accent} />
                  <Text style={[styles.alwaysSharedTitle, { color: colors.textPrimary }]}>Always Shared with Coach</Text>
                </View>
                <View style={styles.alwaysSharedItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                  <Text style={[styles.alwaysSharedText, { color: colors.textSecondary }]}>Readiness scores & mood trends</Text>
                </View>
                <View style={styles.alwaysSharedItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                  <Text style={[styles.alwaysSharedText, { color: colors.textSecondary }]}>Goal progress & check-in data</Text>
                </View>
                <View style={styles.alwaysSharedItem}>
                  <Ionicons name="warning" size={16} color={colors.warning} />
                  <Text style={[styles.alwaysSharedText, { color: colors.textSecondary }]}>Crisis alerts (for your safety)</Text>
                </View>
              </LinearGradient>
            </View>
            {/* Optional: Chat Summaries */}
            <View style={styles.card}>
              <LinearGradient
                colors={[`${colors.textPrimary}15`, `${colors.textPrimary}08`]}
                style={[styles.cardGradient, { borderColor: colors.border }]}
              >
                <SettingItem
                  icon="eye-outline"
                  iconColor={colors.accent}
                  title="Share Chat Summaries"
                  subtitle={
                    consentChatSummaries
                      ? 'Coach sees weekly topic summaries (not messages)'
                      : 'Chat topics are private'
                  }
                  rightComponent={
                    <Switch
                      value={consentChatSummaries}
                      onValueChange={handleChatSummaryToggle}
                      trackColor={{ false: `${colors.textPrimary}33`, true: colors.accent }}
                      thumbColor={consentChatSummaries ? '#fff' : '#f4f3f4'}
                      ios_backgroundColor={`${colors.textPrimary}33`}
                    />
                  }
                />
              </LinearGradient>
            </View>
            {/* Never Shared */}
            <View style={styles.card}>
              <LinearGradient
                colors={[`${colors.error}15`, `${colors.error}08`]}
                style={[styles.cardGradient, { borderColor: colors.border }]}
              >
                <View style={styles.alwaysSharedHeader}>
                  <Ionicons name="lock-closed" size={18} color={colors.error} />
                  <Text style={[styles.alwaysSharedTitle, { color: colors.textPrimary }]}>Never Shared</Text>
                </View>
                <View style={styles.alwaysSharedItem}>
                  <Ionicons name="lock-closed" size={16} color={colors.error} />
                  <Text style={[styles.alwaysSharedText, { color: colors.textSecondary }]}>Your chat messages are private & encrypted</Text>
                </View>
              </LinearGradient>
            </View>
          </>
        )}

        {/* Profile */}
        <SectionHeader title="Profile" />
        <View style={styles.card}>
          <LinearGradient
            colors={cardGradientColors}
            style={[styles.cardGradient, { borderColor: colors.border }]}
          >
            <SettingItem
              icon="person-outline"
              iconColor={colors.accent}
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
            colors={cardGradientColors}
            style={[styles.cardGradient, { borderColor: colors.border }]}
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
                  trackColor={{ false: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', true: '#60a5fa' }}
                  thumbColor={notifications.pushEnabled ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor={isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                />
              }
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <SettingItem
              icon="checkmark-circle-outline"
              iconColor="#10b981"
              title="Assignment Reminders"
              subtitle={notifications.assignmentNotifs ? 'Get notified about assignments' : 'No reminders'}
              rightComponent={
                <Switch
                  value={notifications.assignmentNotifs}
                  onValueChange={(value) => updateNotification('assignmentNotifs', value)}
                  trackColor={{ false: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', true: '#10b981' }}
                  thumbColor={notifications.assignmentNotifs ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor={isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                />
              }
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <SettingItem
              icon="trophy-outline"
              iconColor="#f59e0b"
              title="Goal Milestones"
              subtitle={notifications.goalMilestones ? 'Celebrate your progress' : 'No milestone alerts'}
              rightComponent={
                <Switch
                  value={notifications.goalMilestones}
                  onValueChange={(value) => updateNotification('goalMilestones', value)}
                  trackColor={{ false: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', true: '#f59e0b' }}
                  thumbColor={notifications.goalMilestones ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor={isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                />
              }
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <SettingItem
              icon="chatbubble-outline"
              iconColor={colors.accent}
              title="Chat Messages"
              subtitle={notifications.chatMessages ? 'Get notified about messages' : 'No chat notifications'}
              rightComponent={
                <Switch
                  value={notifications.chatMessages}
                  onValueChange={(value) => updateNotification('chatMessages', value)}
                  trackColor={{ false: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', true: colors.accent }}
                  thumbColor={notifications.chatMessages ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor={isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                />
              }
            />
          </LinearGradient>
        </View>

        {/* App Settings */}
        <SectionHeader title="App Settings" />
        <View style={styles.card}>
          <LinearGradient
            colors={cardGradientColors}
            style={[styles.cardGradient, { borderColor: colors.border }]}
          >
            <SettingItem
              icon={isDarkMode ? "moon" : "sunny"}
              iconColor={isDarkMode ? colors.accent : "#f59e0b"}
              title="Dark Mode"
              subtitle={isDarkMode ? 'Reduce eye strain in low light' : 'Switch to dark theme'}
              rightComponent={
                <Switch
                  value={isDarkMode}
                  onValueChange={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    toggleTheme();
                  }}
                  trackColor={{ false: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', true: colors.accent }}
                  thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor={isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                />
              }
            />
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
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
            colors={cardGradientColors}
            style={[styles.cardGradient, { borderColor: colors.border }]}
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
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
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
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <SettingItem
              icon="shield-outline"
              iconColor={colors.accent}
              title="Privacy Policy"
              onPress={() => Alert.alert('Coming Soon', 'Privacy policy will be available soon')}
            />
          </LinearGradient>
        </View>

        {/* Logout */}
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.1)']}
            style={[styles.cardGradient, { borderColor: colors.border }]}
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
          <View
            style={[styles.modalGradient, { backgroundColor: colors.background }]}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => setShowProfileModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
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
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Name</Text>
                <TextInput
                  style={[styles.formInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)' }]}
                  value={editedProfile.name || ''}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
                  placeholder="Your name"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              {/* Sport */}
              {userRole === 'ATHLETE' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Sport</Text>
                    <TextInput
                      style={[styles.formInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)' }]}
                      value={editedProfile.sport || ''}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, sport: text })}
                      placeholder="Your sport"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>

                  {/* Year */}
                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Year</Text>
                    <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)' }]}>
                      <Picker
                        selectedValue={editedProfile.year || 'FRESHMAN'}
                        onValueChange={(value) => setEditedProfile({ ...editedProfile, year: value })}
                        style={[styles.picker, { color: colors.textPrimary }]}
                        dropdownIconColor={colors.textPrimary}
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
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Position / Role</Text>
                    <TextInput
                      style={[styles.formInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)' }]}
                      value={editedProfile.teamPosition || ''}
                      onChangeText={(text) => setEditedProfile({ ...editedProfile, teamPosition: text })}
                      placeholder="Your position or role"
                      placeholderTextColor={colors.textTertiary}
                    />
                  </View>
                </>
              )}
            </ScrollView>
          </View>
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
    backgroundColor: Colors.primary,
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
    borderColor: Colors.border,
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
    backgroundColor: Colors.accent,
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
  alwaysSharedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  alwaysSharedTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  alwaysSharedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  alwaysSharedText: {
    fontSize: Typography.sm,
    flex: 1,
  },
});
