'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, AlertTriangle, Activity, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/design-system/components';
import { AnimatedCounter } from '@/design-system/components';
import { Button } from '@/design-system/components/Button';

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
  const [athletes, setAthletes] = useState<ReadinessScore[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReadinessData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/coach/readiness');
        if (!response.ok) throw new Error('Failed to fetch readiness data');

        const data = await response.json();
        setAthletes(data.athletes || []);
        setInterventions(data.interventions || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching readiness data:', err);
        setError('Failed to load readiness data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadinessData();
  }, []);

  const getReadinessColor = (score: number) => {
    if (score >= 85) return 'bg-success-600 dark:bg-success-500';
    if (score >= 70) return 'bg-warning-600 dark:bg-warning-500';
    if (score >= 50) return 'bg-warning-700 dark:bg-warning-600';
    return 'bg-danger-600 dark:bg-danger-500';
  };

  const getReadinessTextColor = (score: number) => {
    if (score >= 85) return 'text-success-700 dark:text-success-300';
    if (score >= 70) return 'text-warning-700 dark:text-warning-300';
    if (score >= 50) return 'text-warning-800 dark:text-warning-400';
    return 'text-danger-700 dark:text-danger-300';
  };

  const teamAvg = athletes.length > 0
    ? Math.round(athletes.reduce((sum, a) => sum + a.scores[13], 0) / athletes.length)
    : 0;
  const highRisk = athletes.filter(a => a.scores[13] < 70).length;
  const declining = athletes.filter(a => a.trend === 'declining').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-body">Loading readiness data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Card variant="elevated" padding="lg" className="max-w-md text-center border-danger-200 dark:border-danger-800">
          <AlertTriangle className="w-16 h-16 text-danger-600 dark:text-danger-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-danger-700 dark:text-danger-300 mb-2">{error}</h2>
          <p className="text-gray-600 dark:text-gray-400 font-body mb-6">Please try again later</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Team Readiness
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400 text-lg font-body">Mental performance forecasting & intervention prioritization</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card variant="elevated" padding="lg" hover>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-primary-600 dark:text-primary-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Team Avg</div>
                <div className="text-5xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
                  <AnimatedCounter value={teamAvg} decimals={0} />
                  <span className="text-2xl text-gray-600 dark:text-gray-400">/100</span>
                </div>
                <div className="text-sm text-primary-600 dark:text-primary-400 font-medium font-body">Mental readiness score</div>
              </div>
              <Target className="w-16 h-16 text-primary-600 dark:text-primary-400 opacity-80" />
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hover className="border-danger-200 dark:border-danger-800/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-danger-600 dark:text-danger-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">High Risk</div>
                <div className="text-5xl font-display font-bold text-danger-700 dark:text-danger-300 mb-2">
                  <AnimatedCounter value={highRisk} decimals={0} />
                </div>
                <div className="text-sm text-danger-600 dark:text-danger-400 font-medium font-body">Need intervention</div>
              </div>
              <AlertTriangle className="w-16 h-16 text-danger-600 dark:text-danger-400 opacity-80" />
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hover className="border-warning-200 dark:border-warning-800/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-warning-600 dark:text-warning-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Declining</div>
                <div className="text-5xl font-display font-bold text-warning-700 dark:text-warning-300 mb-2">
                  <AnimatedCounter value={declining} decimals={0} />
                </div>
                <div className="text-sm text-warning-600 dark:text-warning-400 font-medium font-body">Watch closely</div>
              </div>
              <Activity className="w-16 h-16 text-warning-600 dark:text-warning-400 opacity-80" />
            </div>
          </Card>
        </div>

        {/* Intervention Queue */}
        {interventions.length > 0 && (
          <Card variant="elevated" padding="none" className="mb-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-danger-600 dark:bg-danger-500 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">Intervention Queue</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-body ml-15">AI-prioritized based on forecasts</p>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {interventions.map((int, i) => (
                <div key={i} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`${int.priority === 1 ? 'bg-danger-600 dark:bg-danger-500' : 'bg-warning-600 dark:bg-warning-500'} rounded-xl w-16 h-16 flex items-center justify-center text-white text-2xl font-display font-bold`}>
                      P{int.priority}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100">{int.athleteName}</h3>
                        <span className={`text-xl font-display font-bold ${getReadinessTextColor(int.readiness)}`}>
                          {int.readiness}/100
                        </span>
                      </div>
                      <div className="bg-danger-50 dark:bg-danger-900/20 border-l-4 border-danger-600 dark:border-danger-500 p-4 rounded-lg mb-3">
                        <p className="text-danger-700 dark:text-danger-300 font-medium text-sm font-body">{int.reason}</p>
                      </div>
                      <div className="bg-info-50 dark:bg-info-900/20 border-l-4 border-info-600 dark:border-info-500 p-4 rounded-lg">
                        <p className="text-info-700 dark:text-info-300 font-medium text-sm font-body">{int.recommendation}</p>
                      </div>
                    </div>
                    <Link href={`/coach/athletes/${int.athleteId}`}>
                      <Button variant="primary">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Readiness Heatmap */}
        <Card variant="elevated" padding="none">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-warning-600 dark:bg-warning-500 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">14-Day Readiness Heatmap</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-body ml-15">Mental performance trends + 7-day forecast</p>
          </div>
          <div className="p-6 overflow-x-auto">
            {athletes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 font-body">No readiness data available</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-800">
                    <th className="text-left pb-4 pr-6 font-display font-bold text-gray-900 dark:text-gray-100">Athlete</th>
                    {[...Array(14)].map((_, i) => (
                      <th key={i} className="text-center pb-4 px-1 text-xs font-semibold text-gray-600 dark:text-gray-400 font-body">
                        D{i-13}
                      </th>
                    ))}
                    <th className="text-center pb-4 pl-6 font-display font-bold text-gray-900 dark:text-gray-100">Trend</th>
                    <th className="text-center pb-4 pl-6 font-display font-bold text-gray-900 dark:text-gray-100">7-Day Forecast</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {athletes.map((athlete) => (
                    <tr key={athlete.athleteId} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      <td className="py-4 pr-6">
                        <div className="font-display font-bold text-gray-900 dark:text-gray-100">{athlete.athleteName}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 font-body">{athlete.sport}</div>
                      </td>
                      {athlete.scores.map((score, idx) => (
                        <td key={idx} className="py-4 px-1">
                          <div className={`w-12 h-12 rounded-lg ${getReadinessColor(score)} text-white font-bold text-sm flex items-center justify-center font-mono`}>
                            {score}
                          </div>
                        </td>
                      ))}
                      <td className="py-4 pl-6 text-center">
                        {athlete.trend === 'improving' && (
                          <div className="flex items-center justify-center gap-2 text-success-600 dark:text-success-400 font-semibold font-body">
                            <TrendingUp className="w-5 h-5" />
                            Up
                          </div>
                        )}
                        {athlete.trend === 'declining' && (
                          <div className="flex items-center justify-center gap-2 text-danger-600 dark:text-danger-400 font-semibold font-body">
                            <TrendingDown className="w-5 h-5" />
                            Down
                          </div>
                        )}
                        {athlete.trend === 'stable' && (
                          <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 font-semibold font-body">
                            Stable
                          </div>
                        )}
                      </td>
                      <td className="py-4 pl-6">
                        <div className="flex gap-1">
                          {athlete.forecast.map((score, idx) => (
                            <div key={idx} className={`w-8 h-8 rounded ${getReadinessColor(score)} text-white font-bold text-xs flex items-center justify-center opacity-75 font-mono`}>
                              {score}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
