'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface AthleteReadiness {
  id: string;
  name: string;
  sport: string;
  scores: number[]; // Last 14 days readiness (0-100)
  trend: 'improving' | 'declining' | 'stable';
  forecast: number[]; // Next 7 days
  currentScore: number;
}

export default function TeamOverviewPage() {
  const [stats, setStats] = useState({
    totalAthletes: 25,
    teamAvgReadiness: 72,
    readinessChange: -0.6,
    highRisk: 3,
    criticalAlerts: 1,
    decliningTrends: 5,
  });

  const [athletesReadiness] = useState<AthleteReadiness[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      sport: 'Basketball',
      scores: [85, 87, 82, 88, 90, 89, 91, 88, 85, 82, 78, 75, 72, 70],
      trend: 'declining',
      forecast: [68, 65, 63, 62, 60, 58, 56],
      currentScore: 70,
    },
    {
      id: '2',
      name: 'Marcus Davis',
      sport: 'Football',
      scores: [72, 75, 78, 80, 82, 83, 85, 86, 87, 88, 89, 90, 91, 92],
      trend: 'improving',
      forecast: [93, 94, 95, 95, 96, 96, 97],
      currentScore: 92,
    },
    {
      id: '3',
      name: 'Alex Martinez',
      sport: 'Soccer',
      scores: [65, 64, 62, 60, 58, 55, 53, 50, 48, 45, 42, 40, 38, 35],
      trend: 'declining',
      forecast: [32, 30, 28, 25, 23, 20, 18],
      currentScore: 35,
    },
  ]);

  const interventions = [
    {
      id: '3',
      name: 'Alex Martinez',
      priority: 1,
      readiness: 35,
      reason: 'Readiness dropped 46% over 14 days (65→35). Forecast: continued decline to 18.',
      action: 'Immediate 1:1 check-in. Sleep avg 4.2hrs (need 7-9). Stress 9/10 for 7 days.',
    },
    {
      id: '1',
      name: 'Sarah Johnson',
      priority: 1,
      readiness: 70,
      reason: 'Star performer declining (-23% in 7 days). Historic correlation: r=0.82 between readiness & PPG.',
      action: 'Proactive intervention before performance drops. Check workload & finals stress.',
    },
  ];

  const getReadinessColor = (score: number) => {
    if (score >= 85) return 'from-green-500 to-green-600';
    if (score >= 70) return 'from-yellow-500 to-yellow-600';
    if (score >= 50) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Team Overview
          </h1>
          <p className="mt-3 text-muted-foreground dark:text-gray-400 text-lg">Mental readiness analytics & performance forecasting</p>
        </div>

        {/* Critical Alert */}
        {stats.criticalAlerts > 0 && (
          <div className="mb-8 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-2xl p-8 text-white animate-pulse">
            <div className="flex items-start gap-4">
              <div className="text-5xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-2xl font-black mb-2">
                  {stats.criticalAlerts} athlete{stats.criticalAlerts > 1 ? 's' : ''} need immediate attention
                </h3>
                <p className="text-red-100 text-lg font-semibold">Crisis keywords detected or severe readiness decline</p>
              </div>
              <Link
                href="/coach/alerts"
                className="px-8 py-4 bg-white text-red-600 rounded-xl hover:shadow-2xl transition-all font-black text-lg hover:scale-105 transform whitespace-nowrap"
              >
                Review Now
              </Link>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-2">Team Readiness</div>
                <div className="text-5xl font-black mb-2">{stats.teamAvgReadiness}<span className="text-2xl opacity-75">/100</span></div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">WHOOP for mental</div>
              </div>
              <div className="text-6xl opacity-20">🎯</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-red-100 text-xs font-bold uppercase tracking-wider mb-2">High Risk</div>
                <div className="text-5xl font-black mb-2">{stats.highRisk}</div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Need intervention</div>
              </div>
              <div className="text-6xl opacity-20">⚠️</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-2">Declining Trends</div>
                <div className="text-5xl font-black mb-2">{stats.decliningTrends}</div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Watch closely</div>
              </div>
              <div className="text-6xl opacity-20">📉</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all">
            <div className="text-sm font-bold uppercase tracking-wider opacity-90 mb-4">Quick Actions</div>
            <div className="space-y-3">
              <Link
                href="/coach/assignments?action=create"
                className="block w-full px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all text-center backdrop-blur-sm hover:scale-105 transform"
              >
                📝 Create Assignment
              </Link>
              <Link
                href="/coach/reports"
                className="block w-full px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all text-center backdrop-blur-sm hover:scale-105 transform"
              >
                📊 View Reports
              </Link>
            </div>
          </div>
        </div>

        {/* Intervention Queue */}
        <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 mb-8">
          <div className="p-8 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-black text-foreground dark:text-gray-100 flex items-center gap-3">
              <span className="text-3xl">🚨</span>
              Intervention Queue
            </h2>
            <p className="text-muted-foreground dark:text-gray-400 mt-2 text-lg">AI-prioritized recommendations based on readiness forecasts</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {interventions.map((int) => (
              <div key={int.id} className="p-6 hover:bg-background dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl w-16 h-16 flex items-center justify-center text-white text-2xl font-black shadow-lg flex-shrink-0">
                    P{int.priority}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-black text-foreground dark:text-gray-100">{int.name}</h3>
                      <span className={`text-2xl font-black bg-gradient-to-r ${getReadinessColor(int.readiness)} bg-clip-text text-transparent`}>
                        {int.readiness}/100
                      </span>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg mb-3">
                      <p className="text-red-900 dark:text-red-200 font-semibold text-sm">{int.reason}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-lg">
                      <p className="text-blue-900 dark:text-blue-200 font-semibold text-sm">💡 {int.action}</p>
                    </div>
                  </div>
                  <Link
                    href={`/coach/athletes/${int.id}`}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold hover:scale-105 transform whitespace-nowrap"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 14-Day Readiness Heatmap */}
        <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground dark:text-gray-100 flex items-center gap-3">
                <span className="text-3xl">🔥</span>
                14-Day Readiness Heatmap
              </h2>
              <p className="text-muted-foreground dark:text-gray-400 mt-2 text-lg">Mental performance trends + 7-day forecast</p>
            </div>
            <Link
              href="/coach/athletes"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold hover:scale-105 transform"
            >
              View All Athletes →
            </Link>
          </div>
          <div className="p-8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left pb-4 pr-6 font-black text-foreground dark:text-gray-100">Athlete</th>
                  {[...Array(14)].map((_, i) => (
                    <th key={i} className="text-center pb-4 px-1 text-xs font-bold text-muted-foreground dark:text-gray-400">
                      D{i - 13}
                    </th>
                  ))}
                  <th className="text-center pb-4 pl-6 font-black text-foreground dark:text-gray-100">Trend</th>
                  <th className="text-center pb-4 pl-6 font-black text-foreground dark:text-gray-100">7-Day Forecast</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {athletesReadiness.map((athlete) => (
                  <tr key={athlete.id} className="hover:bg-background dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-4 pr-6">
                      <div className="font-black text-foreground dark:text-gray-100">{athlete.name}</div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400">{athlete.sport}</div>
                    </td>
                    {athlete.scores.map((score, index) => (
                      <td key={index} className="py-4 px-1">
                        <div
                          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getReadinessColor(score)} text-white font-black text-sm flex items-center justify-center shadow-lg hover:scale-110 transform transition-all cursor-pointer`}
                          title={`Readiness: ${score}/100`}
                        >
                          {score}
                        </div>
                      </td>
                    ))}
                    <td className="py-4 pl-6 text-center">
                      {athlete.trend === 'improving' && (
                        <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
                          <TrendingUp className="w-5 h-5" />
                          Up
                        </div>
                      )}
                      {athlete.trend === 'declining' && (
                        <div className="flex items-center justify-center gap-2 text-red-600 font-bold">
                          <TrendingDown className="w-5 h-5" />
                          Down
                        </div>
                      )}
                      {athlete.trend === 'stable' && (
                        <div className="flex items-center justify-center gap-2 text-gray-600 font-bold">
                          →
                          Stable
                        </div>
                      )}
                    </td>
                    <td className="py-4 pl-6">
                      <div className="flex gap-1">
                        {athlete.forecast.map((score, index) => (
                          <div
                            key={index}
                            className={`w-8 h-8 rounded bg-gradient-to-br ${getReadinessColor(score)} text-white font-bold text-xs flex items-center justify-center shadow opacity-75`}
                            title={`Day +${index + 1}: ${score}/100`}
                          >
                            {score}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
