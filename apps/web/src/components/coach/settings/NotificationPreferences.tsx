/**
 * NotificationPreferences Component
 * Configure email, push, and SMS notification settings
 */

'use client';

import { useState } from 'react';
import { DashboardSection } from '../layouts/DashboardGrid';

interface NotificationSettings {
  crisisAlerts: { email: boolean; push: boolean; sms: boolean };
  dailySummary: { email: boolean; push: boolean; sms: boolean };
  weeklyReport: { email: boolean; push: boolean; sms: boolean };
  athleteDecline: { email: boolean; push: boolean; sms: boolean };
  assignmentSubmissions: { email: boolean; push: boolean; sms: boolean };
}

export default function NotificationPreferences() {
  const [settings, setSettings] = useState<NotificationSettings>({
    crisisAlerts: { email: true, push: true, sms: true },
    dailySummary: { email: true, push: false, sms: false },
    weeklyReport: { email: true, push: false, sms: false },
    athleteDecline: { email: true, push: true, sms: false },
    assignmentSubmissions: { email: false, push: true, sms: false },
  });

  const toggleSetting = (
    category: keyof NotificationSettings,
    channel: 'email' | 'push' | 'sms'
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
  };

  const notificationTypes = [
    {
      id: 'crisisAlerts' as keyof NotificationSettings,
      label: 'Crisis Alerts',
      description: 'Immediate notification when athlete shows crisis indicators',
      priority: 'critical',
    },
    {
      id: 'athleteDecline' as keyof NotificationSettings,
      label: 'Athlete Readiness Decline',
      description: 'Alert when athlete has declining readiness for 3+ days',
      priority: 'high',
    },
    {
      id: 'assignmentSubmissions' as keyof NotificationSettings,
      label: 'Assignment Submissions',
      description: 'Notify when athletes submit assignments for review',
      priority: 'medium',
    },
    {
      id: 'dailySummary' as keyof NotificationSettings,
      label: 'Daily Summary',
      description: 'Daily digest of team metrics and priority athletes',
      priority: 'low',
    },
    {
      id: 'weeklyReport' as keyof NotificationSettings,
      label: 'Weekly Report',
      description: 'Comprehensive weekly team summary with AI insights',
      priority: 'low',
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardSection title="Notification Channels">
        <div className="space-y-4">
          {/* Channel Headers */}
          <div className="grid grid-cols-4 gap-4 pb-2 border-b border-slate-700">
            <div className="col-span-1"></div>
            <div className="text-center text-xs font-semibold text-slate-400">EMAIL</div>
            <div className="text-center text-xs font-semibold text-slate-400">PUSH</div>
            <div className="text-center text-xs font-semibold text-slate-400">SMS</div>
          </div>

          {/* Notification Rows */}
          {notificationTypes.map(type => (
            <div
              key={type.id}
              className={`grid grid-cols-4 gap-4 p-4 rounded-lg border ${
                type.priority === 'critical'
                  ? 'bg-red-900/10 border-red-700'
                  : type.priority === 'high'
                  ? 'bg-amber-900/10 border-amber-700'
                  : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              <div className="col-span-1">
                <h4 className="text-sm font-semibold text-white mb-1">{type.label}</h4>
                <p className="text-xs text-slate-400">{type.description}</p>
                {type.priority === 'critical' && (
                  <span className="inline-block mt-2 text-xs font-medium px-2 py-1 rounded bg-red-900/50 text-red-300">
                    CRITICAL
                  </span>
                )}
              </div>
              {(['email', 'push', 'sms'] as const).map(channel => (
                <div key={channel} className="flex items-center justify-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[type.id][channel]}
                      onChange={() => toggleSetting(type.id, channel)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Quiet Hours */}
      <DashboardSection title="Quiet Hours">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Suppress non-critical notifications during these hours
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Start Time
              </label>
              <input
                type="time"
                defaultValue="22:00"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                End Time
              </label>
              <input
                type="time"
                defaultValue="08:00"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="weekends" className="rounded" defaultChecked />
            <label htmlFor="weekends" className="text-sm text-slate-300">
              Extend quiet hours on weekends
            </label>
          </div>
        </div>
      </DashboardSection>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors">
          Save Preferences
        </button>
      </div>
    </div>
  );
}
