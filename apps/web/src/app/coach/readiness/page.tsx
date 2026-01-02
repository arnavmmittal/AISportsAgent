'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface ReadinessScore {
  athleteId: string;
  athleteName: string;
  sport: string;
  scores: number[]; // Last 14 days, 0-100
  trend: 'improving' | 'declining' | 'stable';
  forecast: number[]; // Next 7 days prediction
}

interface Intervention {
  athleteId: string;
  athleteName: string;
  priority: 1 | 2 | 3;
  readiness: number;
  reason: string;
  recommendation: string;
}

export default function ReadinessPage() {
  const [athletes] = useState<ReadinessScore[]>([
    {
      athleteId: '1',
      athleteName: 'Sarah Johnson',
      sport: 'Basketball',
      scores: [85, 87, 82, 88, 90, 89, 91, 88, 85, 82, 78, 75, 72, 70],
      trend: 'declining',
      forecast: [68, 65, 63, 62, 60, 58, 56],
    },
    {
      athleteId: '2',
      athleteName: 'Marcus Davis',
      sport: 'Football',
      scores: [72, 75, 78, 80, 82, 83, 85, 86, 87, 88, 89, 90, 91, 92],
      trend: 'improving',
      forecast: [93, 94, 95, 95, 96, 96, 97],
    },
    {
      athleteId: '3',
      athleteName: 'Alex Martinez',
      sport: 'Soccer',
      scores: [65, 64, 62, 60, 58, 55, 53, 50, 48, 45, 42, 40, 38, 35],
      trend: 'declining',
      forecast: [32, 30, 28, 25, 23, 20, 18],
    },
  ]);

  const [interventions] = useState<Intervention[]>([
    {
      athleteId: '3',
      athleteName: 'Alex Martinez',
      priority: 1,
      readiness: 35,
      reason: 'Readiness dropped 46% over 14 days (65→35). Forecast shows continued decline to 18.',
      recommendation: 'Immediate 1:1 check-in. Sleep avg 4.2hrs. Stress 9/10 for 7 days.',
    },
    {
      athleteId: '1',
      athleteName: 'Sarah Johnson',
      priority: 1,
      readiness: 70,
      reason: 'Star performer declining (-23% in 7 days). Historic r=0.82 correlation with PPG.',
      recommendation: 'Proactive intervention before performance drops. Check workload & finals stress.',
    },
  ]);

  const getReadinessColor = (score: number) => {
    if (score >= 85) return 'from-green-500 to-green-600';
    if (score >= 70) return 'from-yellow-500 to-yellow-600';
    if (score >= 50) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const teamAvg = Math.round(athletes.reduce((sum, a) => sum + a.scores[13], 0) / athletes.length);
  const highRisk = athletes.filter(a => a.scores[13] < 70).length;
  const declining = athletes.filter(a => a.trend === 'declining').length;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Team Readiness
          </h1>
          <p className="mt-3 text-muted-foreground text-lg">Mental performance forecasting & intervention prioritization</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-2">Team Avg</div>
                <div className="text-5xl font-black mb-2">{teamAvg}<span className="text-2xl opacity-75">/100</span></div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">WHOOP for mental</div>
              </div>
              <div className="text-6xl opacity-20">🎯</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-red-100 text-xs font-bold uppercase tracking-wider mb-2">High Risk</div>
                <div className="text-5xl font-black mb-2">{highRisk}</div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Need intervention</div>
              </div>
              <div className="text-6xl opacity-20">⚠️</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-2">Declining</div>
                <div className="text-5xl font-black mb-2">{declining}</div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Watch closely</div>
              </div>
              <div className="text-6xl opacity-20">📉</div>
            </div>
          </div>
        </div>

        {/* Intervention Queue */}
        <div className="bg-card rounded-2xl shadow-xl border border-gray-100 mb-8">
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
              <span className="text-3xl">🚨</span>
              Intervention Queue
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">AI-prioritized based on forecasts</p>
          </div>
          <div className="divide-y divide-gray-100">
            {interventions.map((int, i) => (
              <div key={i} className="p-6 hover:bg-background transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`bg-gradient-to-r ${int.priority === 1 ? 'from-red-500 to-red-600' : 'from-orange-500 to-orange-600'} rounded-xl w-16 h-16 flex items-center justify-center text-white text-2xl font-black shadow-lg`}>
                    P{int.priority}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-black">{int.athleteName}</h3>
                      <span className={`text-2xl font-black bg-gradient-to-r ${getReadinessColor(int.readiness)} bg-clip-text text-transparent`}>
                        {int.readiness}/100
                      </span>
                    </div>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-3">
                      <p className="text-red-900 font-semibold text-sm">{int.reason}</p>
                    </div>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                      <p className="text-blue-900 font-semibold text-sm">💡 {int.recommendation}</p>
                    </div>
                  </div>
                  <Link
                    href={`/coach/athletes/${int.athleteId}`}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold hover:scale-105 transform whitespace-nowrap"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-card rounded-2xl shadow-xl border border-gray-100">
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              14-Day Readiness Heatmap
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">Mental performance trends + 7-day forecast</p>
          </div>
          <div className="p-8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left pb-4 pr-6 font-black">Athlete</th>
                  {[...Array(14)].map((_, i) => (
                    <th key={i} className="text-center pb-4 px-1 text-xs font-bold text-muted-foreground">D{i-13}</th>
                  ))}
                  <th className="text-center pb-4 pl-6 font-black">Trend</th>
                  <th className="text-center pb-4 pl-6 font-black">7-Day Forecast</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {athletes.map((athlete) => (
                  <tr key={athlete.athleteId} className="hover:bg-background transition-colors">
                    <td className="py-4 pr-6">
                      <div className="font-black">{athlete.athleteName}</div>
                      <div className="text-sm text-muted-foreground">{athlete.sport}</div>
                    </td>
                    {athlete.scores.map((score, idx) => (
                      <td key={idx} className="py-4 px-1">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getReadinessColor(score)} text-white font-black text-sm flex items-center justify-center shadow-lg hover:scale-110 transform transition-all`}>
                          {score}
                        </div>
                      </td>
                    ))}
                    <td className="py-4 pl-6 text-center">
                      {athlete.trend === 'improving' && (
                        <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
                          <TrendingUp className="w-5 h-5" />Up
                        </div>
                      )}
                      {athlete.trend === 'declining' && (
                        <div className="flex items-center justify-center gap-2 text-red-600 font-bold">
                          <TrendingDown className="w-5 h-5" />Down
                        </div>
                      )}
                    </td>
                    <td className="py-4 pl-6">
                      <div className="flex gap-1">
                        {athlete.forecast.map((score, idx) => (
                          <div key={idx} className={`w-8 h-8 rounded bg-gradient-to-br ${getReadinessColor(score)} text-white font-bold text-xs flex items-center justify-center shadow opacity-75`}>
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
