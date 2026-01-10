'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  LogOut,
  Loader2,
  Moon,
  Sun,
  AlertTriangle,
} from 'lucide-react';
import { Card, Button, Badge } from '@/design-system/components';
import { fadeInUp, staggerContainer } from '@/design-system/motion';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { signOut } from 'next-auth/react';

export const dynamic = 'force-dynamic';

interface ProfileSettings {
  name: string;
  email: string;
  phone: string;
  sport: string;
  team: string;
  year: string;
  position: string;
}

interface NotificationSettings {
  assignmentReminders: boolean;
  goalMilestones: boolean;
  coachMessages: boolean;
  weeklyReports: boolean;
  emailDigest: boolean;
}

interface PrivacySettings {
  shareWithCoach: boolean;
  anonymousData: boolean;
}

export default function StudentSettingsPage() {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy'>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState<ProfileSettings>({
    name: '',
    email: '',
    phone: '',
    sport: '',
    team: '',
    year: '',
    position: '',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    assignmentReminders: true,
    goalMilestones: true,
    coachMessages: true,
    weeklyReports: false,
    emailDigest: true,
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    shareWithCoach: true,
    anonymousData: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/athlete/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.data.profile || profile);
          setNotifications(data.data.notifications || notifications);
          setPrivacy(data.data.privacy || privacy);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/athlete/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'profile', data: profile }),
      });
      if (response.ok) {
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      const response = await fetch('/api/athlete/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'notifications', data: notifications }),
      });
      if (response.ok) {
        toast.success('Notification preferences saved');
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Failed to save preferences');
    }
  };

  const handleSavePrivacy = async () => {
    try {
      const response = await fetch('/api/athlete/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'privacy', data: privacy }),
      });
      if (response.ok) {
        toast.success('Privacy settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 dark:text-primary-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400 font-body">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-8">
        {/* Header */}
        <motion.div variants={fadeInUp}>
          <h1 className="text-5xl font-display font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-body">
            Manage your account preferences
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={fadeInUp}>
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 font-body font-semibold transition-all border-b-2 ${
                activeTab === 'profile'
                  ? 'border-primary-600 dark:border-primary-400 text-primary-700 dark:text-primary-300'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </div>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 font-body font-semibold transition-all border-b-2 ${
                activeTab === 'notifications'
                  ? 'border-primary-600 dark:border-primary-400 text-primary-700 dark:text-primary-300'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </div>
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-6 py-3 font-body font-semibold transition-all border-b-2 ${
                activeTab === 'privacy'
                  ? 'border-primary-600 dark:border-primary-400 text-primary-700 dark:text-primary-300'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy
              </div>
            </button>
          </div>
        </motion.div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div variants={fadeInUp} className="space-y-6">
            <Card variant="elevated" padding="lg">
              <div className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Profile Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-body font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-body focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-body font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-body focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-body font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Sport
                    </label>
                    <input
                      type="text"
                      value={profile.sport}
                      onChange={(e) => setProfile({ ...profile, sport: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-body focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-body font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      value={profile.position}
                      onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-body focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  variant="primary"
                  size="lg"
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Card>

            {/* Theme */}
            <Card variant="elevated" padding="lg">
              <div className="space-y-4">
                <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white">Appearance</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body font-semibold text-gray-900 dark:text-white">Dark Mode</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-body">Toggle dark mode theme</p>
                  </div>
                  <Button onClick={toggleTheme} variant="secondary" size="md" className="flex items-center gap-2">
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    {isDarkMode ? 'Light' : 'Dark'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Logout */}
            <Card variant="elevated" padding="lg" className="border-l-4 border-danger-600 dark:border-danger-400">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">Sign Out</h3>
                  <p className="text-base text-gray-600 dark:text-gray-400 font-body">
                    Sign out of your account
                  </p>
                </div>
                <Button onClick={handleLogout} variant="danger" size="lg" className="flex items-center gap-2">
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div variants={fadeInUp}>
            <Card variant="elevated" padding="lg">
              <div className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                  Notification Preferences
                </h2>

                <div className="space-y-4">
                  {Object.entries({
                    assignmentReminders: 'Assignment Reminders',
                    goalMilestones: 'Goal Milestones',
                    coachMessages: 'Coach Messages',
                    weeklyReports: 'Weekly Reports',
                    emailDigest: 'Email Digest',
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                      <span className="font-body font-semibold text-gray-900 dark:text-white">{label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[key as keyof NotificationSettings]}
                          onChange={(e) =>
                            setNotifications({ ...notifications, [key]: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <Button onClick={handleSaveNotifications} variant="primary" size="lg">
                  Save Preferences
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <motion.div variants={fadeInUp}>
            <Card variant="elevated" padding="lg">
              <div className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                  Privacy Settings
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="font-body font-semibold text-gray-900 dark:text-white">Share Data with Coach</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-body">
                        Allow your coach to view your progress
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.shareWithCoach}
                        onChange={(e) => setPrivacy({ ...privacy, shareWithCoach: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-body font-semibold text-gray-900 dark:text-white">Anonymous Data Collection</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-body">
                        Help improve the platform with anonymous usage data
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.anonymousData}
                        onChange={(e) => setPrivacy({ ...privacy, anonymousData: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>

                <Button onClick={handleSavePrivacy} variant="primary" size="lg">
                  Save Settings
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
