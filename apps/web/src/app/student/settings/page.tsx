'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  User,
  Bell,
  Shield,
  LogOut,
  Save,
  Mail,
  Phone,
  Trophy,
  Calendar,
  Moon,
  Sun,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

export default function StudentSettingsPage() {
  const { theme, toggleTheme, isDarkMode } = useTheme();

  // Profile settings
  const [profile, setProfile] = useState({
    name: 'Alex Johnson',
    email: 'alex.johnson@university.edu',
    phone: '(555) 123-4567',
    sport: 'Basketball',
    team: 'Varsity',
    year: 'Junior',
    position: 'Point Guard',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    assignmentReminders: true,
    goalMilestones: true,
    coachMessages: true,
    weeklyReports: false,
    emailDigest: true,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    shareWithCoach: true,
    anonymousData: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // TODO: Replace with actual API call
      // await apiClient.updateProfile(profile);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      // TODO: Replace with actual API call
      // await apiClient.updateNotificationPreferences(notifications);

      toast.success('Notification preferences saved!');
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Failed to save preferences. Please try again.');
    }
  };

  const handleSavePrivacy = async () => {
    try {
      // TODO: Replace with actual API call
      // await apiClient.updatePrivacySettings(privacy);

      toast.success('Privacy settings saved!');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Failed to save settings. Please try again.');
    }
  };

  const handleLogout = () => {
    // TODO: Implement logout
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="mt-3 text-muted-foreground text-lg">Manage your profile and preferences</p>
        </div>

        {/* Profile Information */}
        <div className="bg-card rounded-2xl shadow-xl border border-gray-100">
          <div className="p-8 border-b-2 border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-foreground">Profile Information</h2>
            </div>
            <p className="text-base text-muted-foreground font-semibold ml-15">Update your personal and athletic information</p>
          </div>
          <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, phone: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Academic Year</Label>
              <Input
                id="year"
                value={profile.year}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, year: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport">Sport</Label>
              <div className="relative">
                <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="sport"
                  value={profile.sport}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, sport: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Input
                id="team"
                value={profile.team}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, team: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={profile.position}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, position: e.target.value })}
              />
            </div>
          </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-card rounded-2xl shadow-xl border border-gray-100">
          <div className="p-8 border-b-2 border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-foreground">Notification Preferences</h2>
            </div>
            <p className="text-base text-muted-foreground font-semibold ml-15">Choose what updates you want to receive</p>
          </div>
          <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="assignment-reminders" className="text-base font-medium">
                  Assignment Reminders
                </Label>
                <p className="text-sm text-gray-500">
                  Get notified about upcoming assignment due dates
                </p>
              </div>
              <Switch
                id="assignment-reminders"
                checked={notifications.assignmentReminders}
                onCheckedChange={(checked: boolean) =>
                  setNotifications({ ...notifications, assignmentReminders: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="goal-milestones" className="text-base font-medium">
                  Goal Milestones
                </Label>
                <p className="text-sm text-gray-500">
                  Celebrate when you reach goal progress milestones
                </p>
              </div>
              <Switch
                id="goal-milestones"
                checked={notifications.goalMilestones}
                onCheckedChange={(checked: boolean) =>
                  setNotifications({ ...notifications, goalMilestones: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="coach-messages" className="text-base font-medium">
                  Coach Messages
                </Label>
                <p className="text-sm text-gray-500">
                  Receive notifications for messages from your coach
                </p>
              </div>
              <Switch
                id="coach-messages"
                checked={notifications.coachMessages}
                onCheckedChange={(checked: boolean) =>
                  setNotifications({ ...notifications, coachMessages: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-reports" className="text-base font-medium">
                  Weekly Progress Reports
                </Label>
                <p className="text-sm text-gray-500">
                  Get a summary of your weekly mood and goal progress
                </p>
              </div>
              <Switch
                id="weekly-reports"
                checked={notifications.weeklyReports}
                onCheckedChange={(checked: boolean) =>
                  setNotifications({ ...notifications, weeklyReports: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-digest" className="text-base font-medium">
                  Email Digest
                </Label>
                <p className="text-sm text-gray-500">
                  Receive daily email summaries of your activity
                </p>
              </div>
              <Switch
                id="email-digest"
                checked={notifications.emailDigest}
                onCheckedChange={(checked: boolean) =>
                  setNotifications({ ...notifications, emailDigest: checked })
                }
              />
            </div>
          </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={handleSaveNotifications}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-2xl transition-all font-bold hover:scale-105 transform flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Preferences
              </button>
            </div>
          </div>
        </div>

        {/* Privacy & Data Sharing */}
        <div className="bg-card rounded-2xl shadow-xl border border-gray-100">
          <div className="p-8 border-b-2 border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-foreground">Privacy & Data Sharing</h2>
            </div>
            <p className="text-base text-muted-foreground font-semibold ml-15">Control how your data is used and shared</p>
          </div>
          <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-coach" className="text-base font-medium">
                  Share Data with Coach
                </Label>
                <p className="text-sm text-gray-500">
                  Allow your coach to view your mood logs, goals, and progress
                </p>
              </div>
              <Switch
                id="share-coach"
                checked={privacy.shareWithCoach}
                onCheckedChange={(checked: boolean) =>
                  setPrivacy({ ...privacy, shareWithCoach: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="anonymous-data" className="text-base font-medium">
                  Anonymous Research Data
                </Label>
                <p className="text-sm text-gray-500">
                  Contribute anonymized data for sports psychology research
                </p>
              </div>
              <Switch
                id="anonymous-data"
                checked={privacy.anonymousData}
                onCheckedChange={(checked: boolean) =>
                  setPrivacy({ ...privacy, anonymousData: checked })
                }
              />
            </div>
          </div>

            <div className="bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-200 rounded-2xl p-6 shadow">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-blue-900">Your Data is Protected</h4>
                  <p className="text-sm text-blue-800 font-semibold">
                    All data is encrypted and stored securely. Your coach only sees aggregated trends
                    unless you explicitly share specific information. You can revoke access at any
                    time.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                onClick={handleSavePrivacy}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-2xl transition-all font-bold hover:scale-105 transform flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* Appearance & Theme */}
        <div className="bg-card rounded-2xl shadow-xl border border-gray-100">
          <div className="p-8 border-b-2 border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                {isDarkMode ? <Moon className="w-6 h-6 text-white" /> : <Sun className="w-6 h-6 text-white" />}
              </div>
              <h2 className="text-2xl font-black text-foreground">Appearance & Theme</h2>
            </div>
            <p className="text-base text-muted-foreground font-semibold ml-15">Customize your visual experience</p>
          </div>
          <div className="p-8">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <p className="text-base font-black text-foreground">Dark Mode</p>
                <p className="text-sm text-muted-foreground font-semibold mt-1">
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
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-indigo-700 shadow-inner"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-card rounded-2xl shadow-xl border-2 border-muted-foreground">
          <div className="p-8 border-b-2 border-muted-foreground/20">
            <h2 className="text-2xl font-black text-muted-foreground">Account Actions</h2>
            <p className="text-base text-muted-foreground font-semibold mt-2">Manage your account</p>
          </div>
          <div className="p-8">
            <button
              onClick={handleLogout}
              className="w-full px-6 py-4 border-2 border-muted-foreground text-muted-foreground rounded-xl hover:bg-muted-foreground/10 transition-all font-bold text-lg hover:scale-105 transform flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
