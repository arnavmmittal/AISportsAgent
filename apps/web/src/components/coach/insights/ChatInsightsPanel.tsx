/**
 * Chat Insights Panel
 *
 * Displays aggregated conversation analysis for coaches:
 * - Team sentiment overview with trend
 * - Top conversation themes (what athletes are discussing)
 * - Disengaged athletes (who hasn't chatted)
 * - Athletes with concerning patterns
 *
 * This enables coaches to understand team-wide psychological patterns
 * without reading individual conversations.
 */

'use client';

import { useState } from 'react';
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  UserX,
  ChevronRight,
  Hash,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ChatInsightsData {
  teamSentiment: {
    current: number;
    trend: 'improving' | 'stable' | 'declining';
    weeklyChange: number;
  };
  topThemes: {
    theme: string;
    count: number;
    athletes: string[];
    trend: 'increasing' | 'stable' | 'decreasing';
  }[];
  sentimentHistory: {
    date: string;
    avgSentiment: number;
    sessionCount: number;
  }[];
  disengagedAthletes: {
    id: string;
    name: string;
    sport: string | null;
    daysSinceChat: number;
    lastChatDate: string | null;
  }[];
  concerningAthletes: {
    id: string;
    name: string;
    sport: string | null;
    concerningTopics: string[];
    avgSentiment: number;
    recentSessions: number;
  }[];
  stats: {
    totalSessions: number;
    athletesWithChats: number;
    avgSessionsPerAthlete: number;
    chatEngagementRate: number;
  };
}

interface ChatInsightsPanelProps {
  data: ChatInsightsData;
}

// Format theme name for display
function formatThemeName(theme: string): string {
  return theme
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Get sentiment color
function getSentimentColor(sentiment: number): string {
  if (sentiment >= 0.3) return 'text-green-400';
  if (sentiment >= 0) return 'text-blue-400';
  if (sentiment >= -0.3) return 'text-amber-400';
  return 'text-red-400';
}

// Get sentiment label
function getSentimentLabel(sentiment: number): string {
  if (sentiment >= 0.3) return 'Positive';
  if (sentiment >= 0) return 'Neutral-Positive';
  if (sentiment >= -0.3) return 'Neutral-Negative';
  return 'Negative';
}

// Team Sentiment Card
function TeamSentimentCard({ data }: { data: ChatInsightsData }) {
  const trendIcon = data.teamSentiment.trend === 'improving'
    ? <TrendingUp className="w-5 h-5 text-green-400" />
    : data.teamSentiment.trend === 'declining'
    ? <TrendingDown className="w-5 h-5 text-red-400" />
    : <Minus className="w-5 h-5 text-slate-400" />;

  const trendColor = data.teamSentiment.trend === 'improving'
    ? 'text-green-400'
    : data.teamSentiment.trend === 'declining'
    ? 'text-red-400'
    : 'text-slate-400';

  // Simple sparkline using CSS
  const maxSentiment = Math.max(...data.sentimentHistory.map(d => Math.abs(d.avgSentiment)), 0.5);
  const sparklineHeight = 40;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Team Conversation Sentiment</h3>
          <div className="flex items-baseline gap-2">
            <span className={cn('text-3xl font-bold', getSentimentColor(data.teamSentiment.current))}>
              {data.teamSentiment.current > 0 ? '+' : ''}{(data.teamSentiment.current * 100).toFixed(0)}
            </span>
            <span className="text-slate-400 text-sm">/ 100</span>
          </div>
        </div>
        <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-sm',
          data.teamSentiment.trend === 'improving' ? 'bg-green-500/20' :
          data.teamSentiment.trend === 'declining' ? 'bg-red-500/20' : 'bg-slate-700'
        )}>
          {trendIcon}
          <span className={trendColor}>
            {data.teamSentiment.trend === 'improving' ? 'Improving' :
             data.teamSentiment.trend === 'declining' ? 'Declining' : 'Stable'}
          </span>
        </div>
      </div>

      {/* Mini sparkline */}
      <div className="flex items-end gap-0.5 h-10 mt-4">
        {data.sentimentHistory.slice(-14).map((day, idx) => {
          const normalizedHeight = ((day.avgSentiment + 1) / 2) * sparklineHeight;
          const isPositive = day.avgSentiment >= 0;
          return (
            <div
              key={idx}
              className={cn(
                'flex-1 rounded-sm transition-all',
                isPositive ? 'bg-green-500/60' : 'bg-red-500/60'
              )}
              style={{ height: `${Math.max(4, normalizedHeight)}px` }}
              title={`${day.date}: ${(day.avgSentiment * 100).toFixed(0)}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>14 days ago</span>
        <span>Today</span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700">
        <div>
          <div className="text-lg font-semibold text-white">{data.stats.totalSessions}</div>
          <div className="text-xs text-slate-400">Chat Sessions</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-white">{data.stats.athletesWithChats}</div>
          <div className="text-xs text-slate-400">Active Chatters</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-white">{data.stats.chatEngagementRate}%</div>
          <div className="text-xs text-slate-400">Engagement</div>
        </div>
      </div>
    </div>
  );
}

// Top Themes Card
function TopThemesCard({ themes }: { themes: ChatInsightsData['topThemes'] }) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Hash className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-medium text-white">What Athletes Are Discussing</h3>
      </div>

      <div className="space-y-3">
        {themes.slice(0, 6).map((theme, idx) => (
          <div key={theme.theme} className="flex items-center gap-3">
            <span className="text-slate-500 text-sm w-5">{idx + 1}.</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">
                  {formatThemeName(theme.theme)}
                </span>
                {theme.trend === 'increasing' && (
                  <ArrowUpRight className="w-3 h-3 text-amber-400" />
                )}
                {theme.trend === 'decreasing' && (
                  <ArrowDownRight className="w-3 h-3 text-green-400" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-400">{theme.count} mentions</span>
                <span className="text-xs text-slate-500">
                  by {theme.athletes.length} athlete{theme.athletes.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  theme.theme.includes('anxiety') || theme.theme.includes('stress') || theme.theme.includes('conflict')
                    ? 'bg-amber-500'
                    : 'bg-primary'
                )}
                style={{ width: `${Math.min(100, (theme.count / themes[0].count) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Concerning Athletes Card
function ConcerningAthletesCard({ athletes }: { athletes: ChatInsightsData['concerningAthletes'] }) {
  if (athletes.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-green-400" />
          <h3 className="text-sm font-medium text-white">Athletes Needing Attention</h3>
        </div>
        <div className="text-center py-6">
          <div className="text-green-400 text-sm">No concerning patterns detected</div>
          <div className="text-slate-500 text-xs mt-1">Team conversations look healthy</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-medium text-white">Athletes Needing Attention</h3>
        <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
          {athletes.length} flagged
        </span>
      </div>

      <div className="space-y-3">
        {athletes.map((athlete) => (
          <Link
            key={athlete.id}
            href={`/coach/athletes/${athlete.id}`}
            className="block p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm">{athlete.name}</span>
                  {athlete.sport && (
                    <span className="text-xs text-slate-400">{athlete.sport}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {athlete.concerningTopics.slice(0, 3).map((topic) => (
                    <span
                      key={topic}
                      className="text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded"
                    >
                      {formatThemeName(topic)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn('text-sm font-medium', getSentimentColor(athlete.avgSentiment))}>
                  {athlete.avgSentiment > 0 ? '+' : ''}{(athlete.avgSentiment * 100).toFixed(0)}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Disengaged Athletes Card
function DisengagedAthletesCard({ athletes }: { athletes: ChatInsightsData['disengagedAthletes'] }) {
  if (athletes.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserX className="w-5 h-5 text-green-400" />
          <h3 className="text-sm font-medium text-white">Disengaged Athletes</h3>
        </div>
        <div className="text-center py-6">
          <div className="text-green-400 text-sm">All athletes engaged recently</div>
          <div className="text-slate-500 text-xs mt-1">Everyone has chatted within the last 7 days</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <UserX className="w-5 h-5 text-slate-400" />
        <h3 className="text-sm font-medium text-white">Disengaged Athletes</h3>
        <span className="ml-auto text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
          {athletes.length} inactive
        </span>
      </div>

      <div className="space-y-2">
        {athletes.map((athlete) => (
          <Link
            key={athlete.id}
            href={`/coach/athletes/${athlete.id}`}
            className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                {athlete.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="text-sm text-white">{athlete.name}</div>
                {athlete.sport && (
                  <div className="text-xs text-slate-500">{athlete.sport}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                'text-xs px-2 py-0.5 rounded',
                athlete.daysSinceChat >= 14 ? 'bg-red-500/20 text-red-400' :
                athlete.daysSinceChat >= 10 ? 'bg-amber-500/20 text-amber-400' :
                'bg-slate-700 text-slate-400'
              )}>
                {athlete.daysSinceChat}d ago
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700">
        <p className="text-xs text-slate-500">
          Consider reaching out to re-engage these athletes with the AI coach.
        </p>
      </div>
    </div>
  );
}

// Main Panel Component
export function ChatInsightsPanel({ data }: ChatInsightsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/20">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Conversation Insights</h2>
          <p className="text-sm text-slate-400">
            What your athletes are discussing with the AI coach
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <TeamSentimentCard data={data} />
          <TopThemesCard themes={data.topThemes} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ConcerningAthletesCard athletes={data.concerningAthletes} />
          <DisengagedAthletesCard athletes={data.disengagedAthletes} />
        </div>
      </div>
    </div>
  );
}

export default ChatInsightsPanel;
