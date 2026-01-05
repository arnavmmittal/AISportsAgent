/**
 * AthleteProfileModal Component
 * Full athlete detail view with 6 tabs
 */

'use client';

import { Athlete } from '@/types/coach-portal';
import { cn } from '@/lib/utils';
import AthleteAvatar from '../ui/AthleteAvatar';
import ReadinessIndicator from '../ui/ReadinessIndicator';
import RiskBadge from '../ui/RiskBadge';
import ArchetypeBadge from '../ui/ArchetypeBadge';
import { useState } from 'react';

interface AthleteProfileModalProps {
  athlete: Athlete;
  onClose: () => void;
}

type Tab = 'overview' | 'readiness' | 'mood' | 'goals' | 'assignments' | 'notes';

export default function AthleteProfileModal({ athlete, onClose }: AthleteProfileModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'readiness', label: 'Readiness', icon: '⚡' },
    { id: 'mood', label: 'Mood Trends', icon: '😊' },
    { id: 'goals', label: 'Goals', icon: '🎯' },
    { id: 'assignments', label: 'Assignments', icon: '📝' },
    { id: 'notes', label: 'Coach Notes', icon: '📋' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <AthleteAvatar
                name={athlete.name}
                imageUrl={athlete.profileImage}
                size="lg"
                showStatus={true}
              />
              <div>
                <h2 className="text-2xl font-bold text-white">{athlete.name}</h2>
                <p className="text-slate-400 mt-1">
                  {athlete.sport} • {athlete.year}
                  {athlete.teamPosition && ` • ${athlete.teamPosition}`}
                </p>
                {athlete.archetype && (
                  <div className="mt-2">
                    <ArchetypeBadge archetype={athlete.archetype} />
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <span className="text-2xl text-slate-400">✕</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="flex-1 p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-2">Risk Level</p>
              <RiskBadge level={athlete.riskLevel} size="md" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-3 text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap',
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Athlete Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Sport</p>
                    <p className="text-white">{athlete.sport}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Year</p>
                    <p className="text-white">{athlete.year}</p>
                  </div>
                  {athlete.teamPosition && (
                    <div>
                      <p className="text-sm text-slate-400">Position</p>
                      <p className="text-white">{athlete.teamPosition}</p>
                    </div>
                  )}
                </div>
              </div>
              {!athlete.consentCoachView && (
                <div className="p-4 bg-muted-foreground/20/20 border border-muted-foreground rounded-lg">
                  <p className="text-chrome text-sm">
                    ⚠️ This athlete has not granted permission to view detailed data.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'readiness' && (
            <div className="text-center text-slate-400 py-8">
              <p>Readiness data will be displayed here</p>
              <p className="text-sm mt-2">6-dimensional radar chart + trends</p>
            </div>
          )}

          {activeTab === 'mood' && (
            <div className="text-center text-slate-400 py-8">
              <p>Mood trend charts will be displayed here</p>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="text-center text-slate-400 py-8">
              <p>Goals and progress will be displayed here</p>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="text-center text-slate-400 py-8">
              <p>Assignment submissions will be displayed here</p>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="text-center text-slate-400 py-8">
              <p>Coach notes interface will be displayed here</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-700 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-md transition-colors">
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
}
