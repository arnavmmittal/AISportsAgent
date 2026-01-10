'use client';

import { useState, useEffect } from 'react';
import { User, Bell, Shield, Key, AlertTriangle, Save, Copy, RefreshCw, Trash2, Moon, Sun, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/design-system/components';
import { Button } from '@/design-system/components/Button';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface ProfileData {
  name: string;
  email: string;
  teamName: string;
}

interface NotificationPreferences {
  crisisAlerts: boolean;
  dailySummary: boolean;
  athleteCheckIns: boolean;
  weeklyReports: boolean;
}

interface PrivacySettings {
  dataRetention: string;
  shareMoodLogs: boolean;
  shareGoalProgress: boolean;
  shareChatSummaries: boolean;
}

export default function CoachSettingsPage() {
  const { theme, toggleTheme, isDarkMode } = useTheme();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [inviteCode, setInviteCode] = useState<string>('');

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isLoadingPrivacy, setIsLoadingPrivacy] = useState(true);
  const [isLoadingInviteCode, setIsLoadingInviteCode] = useState(true);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Load profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/coach/profile');
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        setProfile(data.profile);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Load notification preferences from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/coach/settings/notifications');
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data.preferences);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notification preferences');
      } finally {
        setIsLoadingNotifications(false);
      }
    };
    fetchNotifications();
  }, []);

  // Load privacy settings from API
  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        const response = await fetch('/api/coach/settings/privacy');
        if (!response.ok) throw new Error('Failed to fetch privacy settings');
        const data = await response.json();
        setPrivacy(data.settings);
      } catch (error) {
        console.error('Error fetching privacy settings:', error);
        toast.error('Failed to load privacy settings');
      } finally {
        setIsLoadingPrivacy(false);
      }
    };
    fetchPrivacy();
  }, []);

  // Load invite code from API
  useEffect(() => {
    const fetchInviteCode = async () => {
      try {
        const response = await fetch('/api/coach/invite-code');
        if (!response.ok) throw new Error('Failed to fetch invite code');
        const data = await response.json();
        setInviteCode(data.data.inviteCode);
      } catch (error) {
        console.error('Error fetching invite code:', error);
        toast.error('Failed to load invite code');
      } finally {
        setIsLoadingInviteCode(false);
      }
    };
    fetchInviteCode();
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) return;

    setIsSavingProfile(true);
    try {
      const response = await fetch('/api/coach/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!notifications) return;

    setIsSavingNotifications(true);
    try {
      const response = await fetch('/api/coach/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications),
      });

      if (!response.ok) throw new Error('Failed to update notifications');

      toast.success('Notification preferences saved!');
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!privacy) return;

    setIsSavingPrivacy(true);
    try {
      const response = await fetch('/api/coach/settings/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(privacy),
      });

      if (!response.ok) throw new Error('Failed to update privacy settings');

      toast.success('Privacy settings saved!');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Invite code copied to clipboard!');
  };

  const handleGenerateNewCode = async () => {
    setIsGeneratingCode(true);
    try {
      const response = await fetch('/api/coach/invite-code/regenerate', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to generate new code');

      const data = await response.json();
      setInviteCode(data.inviteCode);
      toast.success('New invite code generated!');
    } catch (error) {
      console.error('Error generating new code:', error);
      toast.error('Failed to generate new code. Please try again.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Settings
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400 text-lg font-body">Manage your coach profile and preferences</p>
        </div>

        {/* Profile Information */}
        <Card variant="elevated" padding="none">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary-600 dark:bg-primary-500 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">Profile Information</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-body ml-15">Update your personal and team information</p>
          </div>
          <div className="p-6">
            {isLoadingProfile ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : profile ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 font-body">
                      Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Your name"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 font-body">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="your.email@university.edu"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 font-body">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={profile.teamName}
                      onChange={(e) => setProfile({ ...profile, teamName: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-body"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    variant="primary"
                    leftIcon={isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400 font-body">
                Failed to load profile data
              </div>
            )}
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card variant="elevated" padding="none">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-info-600 dark:bg-info-500 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">Notification Preferences</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-body ml-15">Choose what updates you want to receive</p>
          </div>
          <div className="p-6">
            {isLoadingNotifications ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : notifications ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 font-body">Crisis Alerts</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-body mt-1">Get notified immediately when crisis situations are detected</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.crisisAlerts}
                        onChange={(e) => setNotifications({ ...notifications, crisisAlerts: e.target.checked })}
                      />
                      <div className="w-14 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 font-body">Daily Summary</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-body mt-1">Receive daily email summaries of team activity</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.dailySummary}
                        onChange={(e) => setNotifications({ ...notifications, dailySummary: e.target.checked })}
                      />
                      <div className="w-14 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 font-body">Athlete Check-ins</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-body mt-1">Notify when athletes complete mood logs or assignments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.athleteCheckIns}
                        onChange={(e) => setNotifications({ ...notifications, athleteCheckIns: e.target.checked })}
                      />
                      <div className="w-14 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 font-body">Weekly Reports</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-body mt-1">Get comprehensive weekly performance reports</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifications.weeklyReports}
                        onChange={(e) => setNotifications({ ...notifications, weeklyReports: e.target.checked })}
                      />
                      <div className="w-14 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={isSavingNotifications}
                    variant="primary"
                    leftIcon={isSavingNotifications ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  >
                    {isSavingNotifications ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400 font-body">
                Failed to load notification preferences
              </div>
            )}
          </div>
        </Card>

        {/* Team Invite Code */}
        <Card variant="elevated" padding="none">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-success-600 dark:bg-success-500 rounded-xl flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">Team Invite Code</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-body ml-15">Share this code with athletes to join your team</p>
          </div>
          <div className="p-6">
            {isLoadingInviteCode ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : inviteCode ? (
              <div className="space-y-6">
                <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-6">
                  <div className="flex items-center gap-4">
                    <code className="flex-1 bg-white dark:bg-gray-800 px-6 py-4 rounded-lg font-mono text-2xl font-bold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
                      {inviteCode}
                    </code>
                    <Button
                      onClick={handleCopyInviteCode}
                      variant="outline"
                      leftIcon={<Copy className="w-5 h-5" />}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateNewCode}
                  disabled={isGeneratingCode}
                  variant="outline"
                  leftIcon={isGeneratingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                >
                  {isGeneratingCode ? 'Generating...' : 'Generate New Code'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400 font-body">
                Failed to load invite code
              </div>
            )}
          </div>
        </Card>

        {/* Appearance & Theme */}
        <Card variant="elevated" padding="none">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-warning-600 dark:bg-warning-500 rounded-xl flex items-center justify-center">
                {isDarkMode ? <Moon className="w-6 h-6 text-white" /> : <Sun className="w-6 h-6 text-white" />}
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">Appearance & Theme</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-body ml-15">Customize your visual experience</p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 font-body">Dark Mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-body mt-1">
                  {isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isDarkMode}
                  onChange={toggleTheme}
                />
                <div className="w-14 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card variant="elevated" padding="none" className="border-danger-200 dark:border-danger-800">
          <div className="p-6 border-b border-danger-200 dark:border-danger-800/50 bg-danger-50 dark:bg-danger-900/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-danger-600 dark:bg-danger-500 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold text-danger-700 dark:text-danger-300">Danger Zone</h2>
            </div>
            <p className="text-danger-600 dark:text-danger-400 font-body ml-15">Irreversible account actions</p>
          </div>
          <div className="p-6 space-y-4">
            <button className="w-full px-6 py-4 border-2 border-danger-300 dark:border-danger-700 text-danger-700 dark:text-danger-300 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors font-semibold text-lg flex items-center justify-center gap-2 font-body">
              <RefreshCw className="w-5 h-5" />
              Reset All Settings
            </button>
            <button className="w-full px-6 py-4 bg-danger-600 dark:bg-danger-500 text-white rounded-lg hover:bg-danger-700 dark:hover:bg-danger-600 transition-colors font-semibold text-lg flex items-center justify-center gap-2 font-body">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
