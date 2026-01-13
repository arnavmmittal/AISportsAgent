'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Users, Target, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

/**
 * Readiness Page - Updated with Design System v2.0
 *
 * Features:
 * - Team readiness metrics
 * - Intervention queue
 * - 14-day readiness heatmap with 7-day forecast
 */

interface ReadinessScore {
  athleteId: string;
  athleteName: string;
  sport: string;
  scores: number[];
  trend: 'improving' | 'declining' | 'stable';
  forecast: number[];
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
    if (score >= 85) return { bg: 'bg-risk-green', text: 'text-risk-green', border: 'border-risk-green' };
    if (score >= 70) return { bg: 'bg-risk-yellow', text: 'text-risk-yellow', border: 'border-risk-yellow' };
    if (score >= 50) return { bg: 'bg-warning', text: 'text-warning', border: 'border-warning' };
    return { bg: 'bg-risk-red', text: 'text-risk-red', border: 'border-risk-red' };
  };

  const teamAvg = Math.round(athletes.reduce((sum, a) => sum + a.scores[13], 0) / athletes.length);
  const highRisk = athletes.filter(a => a.scores[13] < 70).length;
  const declining = athletes.filter(a => a.trend === 'declining').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <header className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-7 h-7 text-primary" />
            Team Readiness
          </h1>
          <p className="text-muted-foreground mt-1">Mental performance forecasting & intervention prioritization</p>
        </header>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
          <div className="card-elevated p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Avg</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {teamAvg}<span className="text-lg text-muted-foreground">/100</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">WHOOP for mental</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>

          <div className="card-elevated p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className={cn(
                  "text-3xl font-bold mt-1",
                  highRisk > 0 ? "text-risk-red" : "text-foreground"
                )}>
                  {highRisk}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Need intervention</p>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                highRisk > 0 ? "bg-risk-red/10" : "bg-muted"
              )}>
                <AlertTriangle className={cn(
                  "w-5 h-5",
                  highRisk > 0 ? "text-risk-red" : "text-muted-foreground"
                )} />
              </div>
            </div>
          </div>

          <div className="card-elevated p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Declining</p>
                <p className={cn(
                  "text-3xl font-bold mt-1",
                  declining > 0 ? "text-risk-yellow" : "text-foreground"
                )}>
                  {declining}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Watch closely</p>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                declining > 0 ? "bg-risk-yellow/10" : "bg-muted"
              )}>
                <TrendingDown className={cn(
                  "w-5 h-5",
                  declining > 0 ? "text-risk-yellow" : "text-muted-foreground"
                )} />
              </div>
            </div>
          </div>
        </div>

        {/* Intervention Queue */}
        <div className="card-elevated overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-risk-red/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-risk-red" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Intervention Queue</h2>
              <p className="text-sm text-muted-foreground">AI-prioritized based on forecasts</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {interventions.map((int, i) => {
              const colors = getReadinessColor(int.readiness);
              return (
                <div key={i} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold",
                      int.priority === 1 ? "bg-risk-red" : "bg-risk-yellow"
                    )}>
                      P{int.priority}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{int.athleteName}</h3>
                        <span className={cn("font-bold", colors.text)}>
                          {int.readiness}/100
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-risk-red/5 border-l-4 border-risk-red mb-2">
                        <p className="text-sm text-risk-red font-medium">{int.reason}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-info/5 border-l-4 border-info">
                        <p className="text-sm text-info font-medium">{int.recommendation}</p>
                      </div>
                    </div>
                    <Link href={`/coach/athletes/${int.athleteId}`}>
                      <Button size="sm">
                        View
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Heatmap */}
        <div className="card-elevated overflow-hidden animate-slide-up">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">14-Day Readiness Heatmap</h2>
              <p className="text-sm text-muted-foreground">Mental performance trends + 7-day forecast</p>
            </div>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-3 pr-4 font-semibold text-foreground">Athlete</th>
                  {[...Array(14)].map((_, i) => (
                    <th key={i} className="text-center pb-3 px-1 text-xs font-medium text-muted-foreground">D{i-13}</th>
                  ))}
                  <th className="text-center pb-3 pl-4 font-semibold text-foreground">Trend</th>
                  <th className="text-center pb-3 pl-4 font-semibold text-foreground">7-Day Forecast</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {athletes.map((athlete) => (
                  <tr key={athlete.athleteId} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-foreground">{athlete.athleteName}</div>
                      <div className="text-xs text-muted-foreground">{athlete.sport}</div>
                    </td>
                    {athlete.scores.map((score, idx) => {
                      const colors = getReadinessColor(score);
                      return (
                        <td key={idx} className="py-3 px-1">
                          <div className={cn(
                            "w-10 h-10 rounded-lg text-white font-medium text-xs flex items-center justify-center",
                            colors.bg
                          )}>
                            {score}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-3 pl-4 text-center">
                      {athlete.trend === 'improving' && (
                        <div className="flex items-center justify-center gap-1 text-risk-green font-medium text-sm">
                          <TrendingUp className="w-4 h-4" />Up
                        </div>
                      )}
                      {athlete.trend === 'declining' && (
                        <div className="flex items-center justify-center gap-1 text-risk-red font-medium text-sm">
                          <TrendingDown className="w-4 h-4" />Down
                        </div>
                      )}
                    </td>
                    <td className="py-3 pl-4">
                      <div className="flex gap-1 justify-center">
                        {athlete.forecast.map((score, idx) => {
                          const colors = getReadinessColor(score);
                          return (
                            <div
                              key={idx}
                              className={cn(
                                "w-7 h-7 rounded text-white font-medium text-xs flex items-center justify-center opacity-75",
                                colors.bg
                              )}
                            >
                              {score}
                            </div>
                          );
                        })}
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
