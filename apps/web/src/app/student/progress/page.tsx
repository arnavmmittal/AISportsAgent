'use client';

import { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, Heart, Brain, Moon, Activity, Target, Plus, CheckCircle2 } from 'lucide-react';

interface MoodEntry {
  date: Date;
  mood: number;
  stress: number;
  sleep: number;
  confidence: number;
}

interface Goal {
  id: string;
  title: string;
  category: string;
  progress: number;
  target: number;
  deadline: Date;
}

export default function StudentProgressPage() {
  const [activeTab, setActiveTab] = useState<'mood' | 'goals'>('mood');

  // Mock data - will be replaced with API call
  const [moodHistory] = useState<MoodEntry[]>([
    {
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      mood: 7.5,
      stress: 4.0,
      sleep: 7.5,
      confidence: 7.0,
    },
    {
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      mood: 8.0,
      stress: 3.5,
      sleep: 8.0,
      confidence: 7.5,
    },
    {
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      mood: 7.0,
      stress: 5.0,
      sleep: 6.5,
      confidence: 6.5,
    },
    {
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      mood: 8.5,
      stress: 3.0,
      sleep: 8.5,
      confidence: 8.0,
    },
    {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      mood: 7.5,
      stress: 4.5,
      sleep: 7.0,
      confidence: 7.5,
    },
    {
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      mood: 8.0,
      stress: 4.0,
      sleep: 7.5,
      confidence: 8.0,
    },
    {
      date: new Date(),
      mood: 7.8,
      stress: 4.2,
      sleep: 7.2,
      confidence: 7.8,
    },
  ]);

  const [goals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Improve free throw accuracy to 85%',
      category: 'Performance',
      progress: 78,
      target: 85,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      title: 'Practice mindfulness meditation 5x per week',
      category: 'Mental Wellness',
      progress: 12,
      target: 20,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      title: 'Maintain GPA above 3.5',
      category: 'Academic',
      progress: 3.6,
      target: 3.5,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  ]);

  const calculateAverage = (key: 'mood' | 'stress' | 'sleep' | 'confidence') => {
    if (moodHistory.length === 0) return 0;
    const sum = moodHistory.reduce((acc, entry) => acc + entry[key], 0);
    return (sum / moodHistory.length).toFixed(1);
  };

  const getTrend = (key: 'mood' | 'stress' | 'sleep' | 'confidence') => {
    if (moodHistory.length < 2) return 'neutral';
    const recent = moodHistory.slice(0, Math.ceil(moodHistory.length / 2));
    const older = moodHistory.slice(Math.ceil(moodHistory.length / 2));

    const recentAvg = recent.reduce((sum, entry) => sum + entry[key], 0) / recent.length;
    const olderAvg = older.reduce((sum, entry) => sum + entry[key], 0) / older.length;

    if (key === 'stress') {
      // For stress, lower is better
      return recentAvg < olderAvg - 0.3 ? 'improving' : recentAvg > olderAvg + 0.3 ? 'declining' : 'stable';
    } else {
      return recentAvg > olderAvg + 0.3 ? 'improving' : recentAvg < olderAvg - 0.3 ? 'declining' : 'stable';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'performance':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'mental wellness':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'academic':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">My Progress</h1>
          <p className="mt-3 text-muted-foreground dark:text-gray-400 text-lg">Track your wellness and achieve your goals</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 flex gap-3 mb-10">
          <button
            onClick={() => setActiveTab('mood')}
            className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all ${
              activeTab === 'mood'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            ❤️ Wellness Tracking
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all ${
              activeTab === 'goals'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            🎯 Goals
          </button>
        </div>

        {/* Mood Tracking Tab */}
        {activeTab === 'mood' && (
          <div className="space-y-6">
            {/* Average Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-pink-100 text-xs font-bold uppercase tracking-wider mb-2">Mood</div>
                    <div className="text-5xl font-black mb-2">
                      {calculateAverage('mood')}<span className="text-2xl opacity-75">/10</span>
                    </div>
                    <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-flex items-center gap-1 font-semibold">
                      {getTrend('mood') === 'improving' && <TrendingUp className="w-4 h-4" />}
                      {getTrend('mood') === 'declining' && <TrendingDown className="w-4 h-4" />}
                      {getTrend('mood') === 'improving' ? 'Improving' : getTrend('mood') === 'declining' ? 'Declining' : 'Stable'}
                    </div>
                  </div>
                  <div className="text-6xl opacity-20">❤️</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-2">Stress</div>
                    <div className="text-5xl font-black mb-2">
                      {calculateAverage('stress')}<span className="text-2xl opacity-75">/10</span>
                    </div>
                    <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-flex items-center gap-1 font-semibold">
                      {getTrend('stress') === 'improving' && <TrendingDown className="w-4 h-4" />}
                      {getTrend('stress') === 'declining' && <TrendingUp className="w-4 h-4" />}
                      {getTrend('stress') === 'improving' ? 'Lower' : getTrend('stress') === 'declining' ? 'Higher' : 'Stable'}
                    </div>
                  </div>
                  <div className="text-6xl opacity-20">🧠</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2">Sleep</div>
                    <div className="text-5xl font-black mb-2">
                      {calculateAverage('sleep')}<span className="text-2xl opacity-75">hrs</span>
                    </div>
                    <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-flex items-center gap-1 font-semibold">
                      {getTrend('sleep') === 'improving' && <TrendingUp className="w-4 h-4" />}
                      {getTrend('sleep') === 'declining' && <TrendingDown className="w-4 h-4" />}
                      {getTrend('sleep') === 'improving' ? 'Better' : getTrend('sleep') === 'declining' ? 'Worse' : 'Stable'}
                    </div>
                  </div>
                  <div className="text-6xl opacity-20">🌙</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2">Confidence</div>
                    <div className="text-5xl font-black mb-2">
                      {calculateAverage('confidence')}<span className="text-2xl opacity-75">/10</span>
                    </div>
                    <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-flex items-center gap-1 font-semibold">
                      {getTrend('confidence') === 'improving' && <TrendingUp className="w-4 h-4" />}
                      {getTrend('confidence') === 'declining' && <TrendingDown className="w-4 h-4" />}
                      {getTrend('confidence') === 'improving' ? 'Improving' : getTrend('confidence') === 'declining' ? 'Declining' : 'Stable'}
                    </div>
                  </div>
                  <div className="text-6xl opacity-20">💪</div>
                </div>
              </div>
            </div>

            {/* Log New Entry Button */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black">Daily Check-In</h3>
                  <p className="text-base text-blue-100 mt-2 font-semibold">Log your mood, stress, sleep, and confidence</p>
                </div>
                <button className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-bold flex items-center gap-2 shadow-lg hover:scale-105 transform">
                  <Plus className="w-5 h-5" />
                  Log Today
                </button>
              </div>
            </div>

            {/* History */}
            <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="p-8 border-b-2 border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-black text-foreground dark:text-gray-100">7-Day History</h2>
                <p className="text-base text-muted-foreground dark:text-gray-400 mt-2">Your wellness metrics over the past week</p>
              </div>
              <div className="divide-y-2 divide-gray-100">
                {moodHistory.slice().reverse().map((entry, index) => (
                  <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <span className="font-black text-foreground text-lg">
                          {entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {index === 0 && (
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-xs font-black shadow">
                            TODAY
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink-500" />
                        <span className="text-sm text-muted-foreground font-bold">Mood:</span>
                        <span className="font-black text-foreground text-lg">{entry.mood.toFixed(1)}/10</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-orange-500" />
                        <span className="text-sm text-muted-foreground font-bold">Stress:</span>
                        <span className="font-black text-foreground text-lg">{entry.stress.toFixed(1)}/10</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Moon className="w-5 h-5 text-indigo-500" />
                        <span className="text-sm text-muted-foreground font-bold">Sleep:</span>
                        <span className="font-black text-foreground text-lg">{entry.sleep.toFixed(1)}hrs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-muted-foreground font-bold">Confidence:</span>
                        <span className="font-black text-foreground text-lg">{entry.confidence.toFixed(1)}/10</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            {/* Add Goal Button */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black">Set New Goal</h3>
                  <p className="text-base text-purple-100 mt-2 font-semibold">Performance, mental wellness, or academic</p>
                </div>
                <button className="px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-all font-bold flex items-center gap-2 shadow-lg hover:scale-105 transform">
                  <Plus className="w-5 h-5" />
                  Create Goal
                </button>
              </div>
            </div>

            {/* Goals List */}
            <div className="space-y-6">
              {goals.map((goal) => {
                const progressPercent = Math.round((goal.progress / goal.target) * 100);
                const isComplete = goal.progress >= goal.target;

                return (
                  <div key={goal.id} className="bg-card rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-2xl font-black text-foreground">{goal.title}</h3>
                          {isComplete && (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          )}
                        </div>
                        <span className={`inline-block px-4 py-2 rounded-xl text-sm font-black border-2 shadow ${getCategoryColor(goal.category)}`}>
                          {goal.category}
                        </span>
                      </div>
                      <Target className="w-8 h-8 text-gray-400" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-base">
                        <span className="text-muted-foreground font-bold">Progress</span>
                        <span className="font-black text-foreground text-lg">
                          {goal.progress} / {goal.target} ({progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                        <div
                          className={`h-4 rounded-full transition-all shadow-lg ${
                            isComplete ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                          }`}
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-base text-muted-foreground font-bold">
                        <Calendar className="w-5 h-5" />
                        <span>
                          Deadline: {goal.deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all font-bold hover:scale-105 transform">
                        Update Progress
                      </button>
                      <button className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-800 rounded-xl hover:bg-gray-50 transition-all font-bold hover:scale-105 transform">
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {goals.length === 0 && (
              <div className="bg-card rounded-2xl shadow-xl border border-gray-100 p-16 text-center">
                <div className="text-8xl mb-6">🎯</div>
                <h3 className="text-3xl font-black text-foreground mb-3">No goals yet</h3>
                <p className="text-lg text-muted-foreground">Create your first goal to start tracking progress</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
