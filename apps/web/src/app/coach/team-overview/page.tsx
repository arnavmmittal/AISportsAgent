'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Users, ClipboardList, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

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
    if (score >= 85) return 'bg-risk-green';
    if (score >= 70) return 'bg-info';
    if (score >= 50) return 'bg-risk-yellow';
    return 'bg-risk-red';
  };

  const getReadinessTextColor = (score: number) => {
    if (score >= 85) return 'text-risk-green';
    if (score >= 70) return 'text-info';
    if (score >= 50) return 'text-risk-yellow';
    return 'text-risk-red';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground">Team Overview</h1>
          <p className="mt-2 text-muted-foreground">Mental readiness analytics & performance forecasting</p>
        </div>

        {/* Critical Alert */}
        {stats.criticalAlerts > 0 && (
          <div className="mb-8 card-elevated p-6 border-risk-red/30 bg-risk-red/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-risk-red/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-risk-red" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground">
                  {stats.criticalAlerts} athlete{stats.criticalAlerts > 1 ? 's' : ''} need immediate attention
                </h3>
                <p className="text-muted-foreground mt-1">Crisis keywords detected or severe readiness decline</p>
              </div>
              <Link href="/coach/readiness?tab=alerts">
                <Button variant="destructive">Review Now</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-elevated p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Readiness</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {stats.teamAvgReadiness}
                  <span className="text-lg text-muted-foreground">/100</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">WHOOP for mental</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk</p>
                <p className={cn(
                  "text-3xl font-bold mt-1",
                  stats.highRisk > 0 ? "text-risk-red" : "text-foreground"
                )}>
                  {stats.highRisk}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Need intervention</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-risk-red/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-risk-red" />
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Declining Trends</p>
                <p className={cn(
                  "text-3xl font-bold mt-1",
                  stats.decliningTrends > 0 ? "text-risk-yellow" : "text-foreground"
                )}>
                  {stats.decliningTrends}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Watch closely</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-risk-yellow/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-risk-yellow" />
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <p className="text-sm font-medium text-muted-foreground mb-4">Quick Actions</p>
            <div className="space-y-2">
              <Link href="/coach/assignments?action=create" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
              </Link>
              <Link href="/coach/insights" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Intervention Queue */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-risk-red" />
              Intervention Queue
            </CardTitle>
            <p className="text-sm text-muted-foreground">AI-prioritized recommendations based on readiness forecasts</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interventions.map((int) => (
                <div key={int.id} className="card-interactive p-4 border-risk-red/20">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0",
                      int.priority === 1 ? "bg-risk-red" : "bg-risk-yellow"
                    )}>
                      P{int.priority}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{int.name}</h3>
                        <span className={cn("text-lg font-bold", getReadinessTextColor(int.readiness))}>
                          {int.readiness}/100
                        </span>
                      </div>
                      <div className="bg-risk-red/5 border-l-4 border-risk-red p-3 rounded mb-2">
                        <p className="text-sm text-muted-foreground">{int.reason}</p>
                      </div>
                      <div className="bg-info/5 border-l-4 border-info p-3 rounded">
                        <p className="text-sm text-muted-foreground">💡 {int.action}</p>
                      </div>
                    </div>
                    <Link href={`/coach/athletes/${int.id}`}>
                      <Button size="sm">View Profile</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 14-Day Readiness Heatmap */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                14-Day Readiness Heatmap
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Mental performance trends + 7-day forecast</p>
            </div>
            <Link href="/coach/team">
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                View All Athletes
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left pb-4 pr-6 font-semibold text-foreground">Athlete</th>
                    {[...Array(14)].map((_, i) => (
                      <th key={i} className="text-center pb-4 px-1 text-xs font-medium text-muted-foreground">
                        D{i - 13}
                      </th>
                    ))}
                    <th className="text-center pb-4 pl-4 font-semibold text-foreground">Trend</th>
                    <th className="text-center pb-4 pl-4 font-semibold text-foreground">7-Day Forecast</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {athletesReadiness.map((athlete) => (
                    <tr key={athlete.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 pr-6">
                        <div className="font-medium text-foreground">{athlete.name}</div>
                        <div className="text-sm text-muted-foreground">{athlete.sport}</div>
                      </td>
                      {athlete.scores.map((score, index) => (
                        <td key={index} className="py-4 px-1">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-md text-white font-medium text-sm flex items-center justify-center",
                              getReadinessColor(score)
                            )}
                            title={`Readiness: ${score}/100`}
                          >
                            {score}
                          </div>
                        </td>
                      ))}
                      <td className="py-4 pl-4 text-center">
                        {athlete.trend === 'improving' && (
                          <div className="flex items-center justify-center gap-1 text-risk-green font-medium">
                            <TrendingUp className="w-4 h-4" />
                            Up
                          </div>
                        )}
                        {athlete.trend === 'declining' && (
                          <div className="flex items-center justify-center gap-1 text-risk-red font-medium">
                            <TrendingDown className="w-4 h-4" />
                            Down
                          </div>
                        )}
                        {athlete.trend === 'stable' && (
                          <div className="flex items-center justify-center gap-1 text-muted-foreground font-medium">
                            →
                            Stable
                          </div>
                        )}
                      </td>
                      <td className="py-4 pl-4">
                        <div className="flex gap-1">
                          {athlete.forecast.map((score, index) => (
                            <div
                              key={index}
                              className={cn(
                                "w-7 h-7 rounded text-white font-medium text-xs flex items-center justify-center opacity-75",
                                getReadinessColor(score)
                              )}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
