'use client';

import { useState } from 'react';
import { User, Bell, Shield, Key, AlertTriangle, Save, Copy, RefreshCw, Trash2, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

export default function CoachSettingsPage() {
  const { theme, toggleTheme, isDarkMode } = useTheme();

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    sport: 'Basketball',
    teamName: 'Demo University Basketball',
  });

  const [notifications, setNotifications] = useState({
    crisisAlerts: true,
    dailySummary: true,
    athleteCheckIns: false,
    weeklyReports: true,
  });

  const [privacy, setPrivacy] = useState({
    dataRetention: '90 days',
    shareMoodLogs: true,
    shareGoalProgress: true,
    shareChatSummaries: false,
  });

  const [inviteCode] = useState('DEMO-COACH-2024');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
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
      toast.success('Notification preferences saved!');
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Failed to save preferences. Please try again.');
    }
  };

  const handleSavePrivacy = async () => {
    try {
      toast.success('Privacy settings saved!');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Failed to save settings. Please try again.');
    }
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Invite code copied to clipboard!');
  };

  const handleGenerateNewCode = () => {
    toast.success('New invite code generated!');
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="mt-3 text-muted-foreground text-lg">Manage your coach profile and preferences</p>
        </div>

        {/* Profile Information */}
        <div className="bg-card rounded-2xl shadow-xl border border-gray-100">
          <div className="p-8 border-b-2 border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-foreground">Profile Information</h2>
            </div>
            <p className="text-base text-muted-foreground font-semibold ml-15">Update your personal and team information</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-muted-foreground">
                  Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="your.email@university.edu"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-muted-foreground">
                  Sport
                </label>
                <select
                  value={profile.sport}
                  onChange={(e) => setProfile({ ...profile, sport: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                >
                  <option>Basketball</option>
                  <option>Football</option>
                  <option>Soccer</option>
                  <option>Baseball</option>
                  <option>Volleyball</option>
                  <option>Track & Field</option>
                  <option>Swimming</option>
                  <option>Tennis</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-muted-foreground">
                  Team Name
                </label>
                <input
                  type="text"
                  value={profile.teamName}
                  onChange={(e) => setProfile({ ...profile, teamName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
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
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-base font-black text-foreground">Crisis Alerts</p>
                  <p className="text-sm text-muted-foreground font-semibold mt-1">Get notified immediately when crisis situations are detected</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.crisisAlerts}
                    onChange={(e) => setNotifications({ ...notifications, crisisAlerts: e.target.checked })}
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-blue-700 shadow-inner"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-base font-black text-foreground">Daily Summary</p>
                  <p className="text-sm text-muted-foreground font-semibold mt-1">Receive daily email summaries of team activity</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.dailySummary}
                    onChange={(e) => setNotifications({ ...notifications, dailySummary: e.target.checked })}
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-blue-700 shadow-inner"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-base font-black text-foreground">Athlete Check-ins</p>
                  <p className="text-sm text-muted-foreground font-semibold mt-1">Notify when athletes complete mood logs or assignments</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.athleteCheckIns}
                    onChange={(e) => setNotifications({ ...notifications, athleteCheckIns: e.target.checked })}
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-blue-700 shadow-inner"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-base font-black text-foreground">Weekly Reports</p>
                  <p className="text-sm text-muted-foreground font-semibold mt-1">Get comprehensive weekly performance reports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notifications.weeklyReports}
                    onChange={(e) => setNotifications({ ...notifications, weeklyReports: e.target.checked })}
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-blue-700 shadow-inner"></div>
                </label>
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

        {/* Privacy & Data Access */}
        <div className="bg-card rounded-2xl shadow-xl border border-gray-100">
          <div className="p-8 border-b-2 border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-foreground">Privacy & Data Access</h2>
            </div>
            <p className="text-base text-muted-foreground font-semibold ml-15">Control data retention and sharing settings</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-foreground mb-2">Data Retention</h3>
                <p className="text-sm text-muted-foreground font-semibold mb-3">
                  How long to retain athlete data after they leave your team
                </p>
                <select
                  value={privacy.dataRetention}
                  onChange={(e) => setPrivacy({ ...privacy, dataRetention: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium"
                >
                  <option>30 days</option>
                  <option>90 days</option>
                  <option>1 year</option>
                  <option>Forever (with consent)</option>
                </select>
              </div>

              <div>
                <h3 className="text-lg font-black text-foreground mb-2">Default Data Sharing</h3>
                <p className="text-sm text-muted-foreground font-semibold mb-3">
                  Data visible to other staff members in your organization
                </p>
                <div className="space-y-3">
                  <label className="flex items-center p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={privacy.shareMoodLogs}
                      onChange={(e) => setPrivacy({ ...privacy, shareMoodLogs: e.target.checked })}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
                    />
                    <span className="text-base font-bold">Mood logs summary</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={privacy.shareGoalProgress}
                      onChange={(e) => setPrivacy({ ...privacy, shareGoalProgress: e.target.checked })}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
                    />
                    <span className="text-base font-bold">Goal progress</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={privacy.shareChatSummaries}
                      onChange={(e) => setPrivacy({ ...privacy, shareChatSummaries: e.target.checked })}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 mr-3"
                    />
                    <span className="text-base font-bold">Chat session summaries</span>
                  </label>
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

        {/* Team Invite Code */}
        <div className="bg-card rounded-2xl shadow-xl border border-gray-100">
          <div className="p-8 border-b-2 border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Key className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-foreground">Team Invite Code</h2>
            </div>
            <p className="text-base text-muted-foreground font-semibold ml-15">Share this code with athletes to join your team</p>
          </div>
          <div className="p-8">
            <div className="bg-gradient-to-r from-amber-100 to-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-6 shadow">
              <div className="flex items-center gap-4">
                <code className="flex-1 bg-white px-6 py-4 rounded-xl font-mono text-2xl font-black text-amber-600 border-2 border-amber-300 shadow-inner">
                  {inviteCode}
                </code>
                <button
                  onClick={handleCopyInviteCode}
                  className="px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:shadow-2xl transition-all font-bold hover:scale-105 transform flex items-center gap-2"
                >
                  <Copy className="w-5 h-5" />
                  Copy
                </button>
              </div>
            </div>
            <button
              onClick={handleGenerateNewCode}
              className="px-6 py-3 border-2 border-gray-300 text-gray-800 rounded-xl hover:bg-gray-50 transition-all font-bold hover:scale-105 transform flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Generate New Code
            </button>
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

        {/* Danger Zone */}
        <div className="bg-card rounded-2xl shadow-xl border-2 border-red-200">
          <div className="p-8 border-b-2 border-red-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-red-700">Danger Zone</h2>
            </div>
            <p className="text-base text-red-600 font-semibold ml-15">Irreversible account actions</p>
          </div>
          <div className="p-8 space-y-4">
            <button className="w-full px-6 py-4 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-all font-bold text-lg hover:scale-105 transform flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Reset All Settings
            </button>
            <button className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-2xl transition-all font-bold text-lg hover:scale-105 transform flex items-center justify-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
