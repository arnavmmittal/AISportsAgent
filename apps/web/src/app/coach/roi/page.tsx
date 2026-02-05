'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  Trophy,
  Shield,
  Clock,
  BarChart3,
  Download,
  Loader2,
  ArrowUp,
  ArrowDown,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';

interface ROIData {
  engagement: {
    totalAthletes: number;
    activeAthletes: number;
    engagementRate: number;
    avgSessionsPerAthlete: number;
    totalChatSessions: number;
    totalCheckIns: number;
    weeklyActiveUsers: number;
    engagementTrend: 'up' | 'down' | 'stable';
    engagementChange: number;
  };
  mentalHealth: {
    avgMoodScore: number;
    avgMoodChange: number;
    avgStressReduction: number;
    avgConfidenceGain: number;
    athletesImproved: number;
    athletesStable: number;
    athletesDeclined: number;
    improvementRate: number;
  };
  performance: {
    moodPerformanceCorrelation: number;
    gamesWithHighMood: number;
    winRateHighMood: number;
    winRateLowMood: number;
    performanceGain: number;
  };
  riskMitigation: {
    crisisAlertsDetected: number;
    crisisAlertsResolved: number;
    earlyInterventions: number;
    athletesAtRisk: number;
    athletesRecovered: number;
    preventedEscalations: number;
  };
  efficiency: {
    estimatedHoursSaved: number;
    chatSessionsReplacing11: number;
    automatedAlerts: number;
    avgResponseTime: string;
  };
  periodComparison: {
    currentPeriod: string;
    previousPeriod: string;
    engagementChange: number;
    moodChange: number;
    performanceChange: number;
  };
  highlights: {
    title: string;
    value: string;
    change?: number;
    changeLabel?: string;
    positive: boolean;
  }[];
}

export default function ROIDashboardPage() {
  const [data, setData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchROIData();
  }, []);

  const fetchROIData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coach/roi');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load ROI data');
      }
    } catch (err) {
      setError('Failed to load ROI data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;

    const reportContent = `
Flow Sports Coach - ROI Report
Generated: ${new Date().toLocaleDateString()}
Period: ${data.periodComparison.currentPeriod}

=== EXECUTIVE SUMMARY ===

Athlete Engagement: ${data.engagement.engagementRate}% (${data.engagement.engagementChange > 0 ? '+' : ''}${data.engagement.engagementChange}% vs last month)
Mental Health Improvement: ${data.mentalHealth.improvementRate}% of athletes improved
Performance Correlation: Athletes with good mood have ${data.performance.performanceGain}% higher win rate
Hours Saved: ${data.efficiency.estimatedHoursSaved} hours from AI chat sessions

=== ENGAGEMENT METRICS ===

Total Athletes: ${data.engagement.totalAthletes}
Active Athletes (30 days): ${data.engagement.activeAthletes}
Engagement Rate: ${data.engagement.engagementRate}%
Total Chat Sessions: ${data.engagement.totalChatSessions}
Total Wellness Check-Ins: ${data.engagement.totalCheckIns}
Avg Sessions per Athlete: ${data.engagement.avgSessionsPerAthlete}
Weekly Active Users: ${data.engagement.weeklyActiveUsers}

=== MENTAL HEALTH OUTCOMES ===

Average Mood Score: ${data.mentalHealth.avgMoodScore}/10
Mood Change vs Previous: ${data.mentalHealth.avgMoodChange > 0 ? '+' : ''}${data.mentalHealth.avgMoodChange}
Stress Reduction: ${data.mentalHealth.avgStressReduction > 0 ? '+' : ''}${data.mentalHealth.avgStressReduction}
Confidence Gain: ${data.mentalHealth.avgConfidenceGain > 0 ? '+' : ''}${data.mentalHealth.avgConfidenceGain}
Athletes Improved: ${data.mentalHealth.athletesImproved}
Athletes Stable: ${data.mentalHealth.athletesStable}
Athletes Declined: ${data.mentalHealth.athletesDeclined}

=== PERFORMANCE CORRELATION ===

Win Rate (High Mood): ${data.performance.winRateHighMood}%
Win Rate (Low Mood): ${data.performance.winRateLowMood}%
Performance Gain: +${data.performance.performanceGain}%
Games with High Mood: ${data.performance.gamesWithHighMood}

=== RISK MITIGATION ===

Crisis Alerts Detected: ${data.riskMitigation.crisisAlertsDetected}
Crisis Alerts Resolved: ${data.riskMitigation.crisisAlertsResolved}
Early Interventions: ${data.riskMitigation.earlyInterventions}
Athletes Currently At Risk: ${data.riskMitigation.athletesAtRisk}

=== EFFICIENCY GAINS ===

Estimated Hours Saved: ${data.efficiency.estimatedHoursSaved}
Chat Sessions (Replacing 1:1s): ${data.efficiency.chatSessionsReplacing11}
Automated Alerts Sent: ${data.efficiency.automatedAlerts}
Average Response Time: ${data.efficiency.avgResponseTime}

---
Report generated by Flow Sports Coach
Contact: support@flowsportscoach.com
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roi-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading ROI metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">{error || 'Failed to load data'}</p>
          <Button onClick={fetchROIData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-primary" />
              ROI Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Demonstrating value to Athletic Directors • {data.periodComparison.currentPeriod}
            </p>
          </div>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Key Highlights */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {data.highlights.map((highlight, index) => (
            <div
              key={index}
              className="card-elevated p-5 flex flex-col items-center text-center"
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center mb-3',
                  highlight.positive ? 'bg-success/10' : 'bg-destructive/10'
                )}
              >
                {index === 0 && <Users className={cn('w-6 h-6', highlight.positive ? 'text-success' : 'text-destructive')} />}
                {index === 1 && <Heart className={cn('w-6 h-6', highlight.positive ? 'text-success' : 'text-destructive')} />}
                {index === 2 && <Trophy className={cn('w-6 h-6', highlight.positive ? 'text-success' : 'text-destructive')} />}
                {index === 3 && <Clock className={cn('w-6 h-6', highlight.positive ? 'text-success' : 'text-destructive')} />}
                {index === 4 && <Shield className={cn('w-6 h-6', highlight.positive ? 'text-success' : 'text-destructive')} />}
              </div>
              <div className="text-3xl font-bold text-foreground">{highlight.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{highlight.title}</div>
              {highlight.changeLabel && (
                <div className="flex items-center gap-1 mt-2 text-xs">
                  {highlight.change !== undefined && (
                    <>
                      {highlight.change > 0 ? (
                        <ArrowUp className="w-3 h-3 text-success" />
                      ) : highlight.change < 0 ? (
                        <ArrowDown className="w-3 h-3 text-destructive" />
                      ) : null}
                      <span className={highlight.change >= 0 ? 'text-success' : 'text-destructive'}>
                        {highlight.change > 0 ? '+' : ''}{highlight.change}%
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground">{highlight.changeLabel}</span>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement */}
          <section className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Athlete Engagement</h2>
                <p className="text-sm text-muted-foreground">Platform adoption & usage</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                label="Total Athletes"
                value={data.engagement.totalAthletes}
                icon={<Users className="w-4 h-4" />}
              />
              <MetricCard
                label="Active (30d)"
                value={data.engagement.activeAthletes}
                change={data.engagement.engagementChange}
              />
              <MetricCard
                label="Chat Sessions"
                value={data.engagement.totalChatSessions}
                icon={<Brain className="w-4 h-4" />}
              />
              <MetricCard
                label="Check-Ins"
                value={data.engagement.totalCheckIns}
                icon={<CheckCircle2 className="w-4 h-4" />}
              />
              <MetricCard
                label="Engagement Rate"
                value={`${data.engagement.engagementRate}%`}
                trend={data.engagement.engagementTrend}
              />
              <MetricCard
                label="Avg Sessions/Athlete"
                value={data.engagement.avgSessionsPerAthlete}
              />
            </div>
          </section>

          {/* Mental Health */}
          <section className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Mental Health Outcomes</h2>
                <p className="text-sm text-muted-foreground">Wellness improvements over time</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                label="Avg Mood Score"
                value={`${data.mentalHealth.avgMoodScore}/10`}
                change={data.mentalHealth.avgMoodChange * 10}
              />
              <MetricCard
                label="Improvement Rate"
                value={`${data.mentalHealth.improvementRate}%`}
                icon={<TrendingUp className="w-4 h-4" />}
              />
              <MetricCard
                label="Stress Reduction"
                value={data.mentalHealth.avgStressReduction > 0 ? `+${data.mentalHealth.avgStressReduction}` : `${data.mentalHealth.avgStressReduction}`}
                positive={data.mentalHealth.avgStressReduction > 0}
              />
              <MetricCard
                label="Confidence Gain"
                value={data.mentalHealth.avgConfidenceGain > 0 ? `+${data.mentalHealth.avgConfidenceGain}` : `${data.mentalHealth.avgConfidenceGain}`}
                positive={data.mentalHealth.avgConfidenceGain > 0}
              />
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Athletes improved</span>
                <span className="text-success font-medium">{data.mentalHealth.athletesImproved}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Athletes stable</span>
                <span className="text-foreground font-medium">{data.mentalHealth.athletesStable}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Need attention</span>
                <span className="text-warning font-medium">{data.mentalHealth.athletesDeclined}</span>
              </div>
            </div>
          </section>

          {/* Performance Correlation */}
          <section className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Performance Correlation</h2>
                <p className="text-sm text-muted-foreground">Mental state → Game outcomes</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-success/5 to-success/10 rounded-xl p-6 mb-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-success">+{data.performance.performanceGain}%</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Higher win rate when athletes have good mood
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-success/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-success">{data.performance.winRateHighMood}%</div>
                <div className="text-xs text-muted-foreground">Win Rate (High Mood)</div>
              </div>
              <div className="bg-destructive/5 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-destructive">{data.performance.winRateLowMood}%</div>
                <div className="text-xs text-muted-foreground">Win Rate (Low Mood)</div>
              </div>
            </div>
          </section>

          {/* Risk & Efficiency */}
          <section className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Risk Mitigation & Efficiency</h2>
                <p className="text-sm text-muted-foreground">Early detection & time savings</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                label="Crisis Alerts Caught"
                value={data.riskMitigation.crisisAlertsDetected}
                icon={<AlertTriangle className="w-4 h-4" />}
              />
              <MetricCard
                label="Resolved"
                value={data.riskMitigation.crisisAlertsResolved}
                icon={<CheckCircle2 className="w-4 h-4" />}
              />
              <MetricCard
                label="Hours Saved"
                value={`${data.efficiency.estimatedHoursSaved}h`}
                icon={<Clock className="w-4 h-4" />}
              />
              <MetricCard
                label="Response Time"
                value={data.efficiency.avgResponseTime}
                icon={<Sparkles className="w-4 h-4" />}
              />
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{data.efficiency.chatSessionsReplacing11}</span> AI chat sessions have replaced traditional 1:1 meetings, saving an estimated{' '}
                <span className="font-medium text-success">{data.efficiency.estimatedHoursSaved} hours</span> of coaching time.
              </p>
            </div>
          </section>
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-muted-foreground pt-8 pb-4">
          <p className="flex items-center justify-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            Data is aggregated from {data.engagement.totalAthletes} athletes over the last 30 days
          </p>
          <p className="mt-1">
            Report generated on {new Date().toLocaleDateString()} • Flow Sports Coach
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  change,
  trend,
  icon,
  positive,
}: {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className={cn(
          "text-xl font-bold",
          positive === true && "text-success",
          positive === false && "text-destructive"
        )}>
          {value}
        </span>
        {change !== undefined && (
          <span
            className={cn(
              'text-xs flex items-center gap-0.5',
              change > 0 ? 'text-success' : change < 0 ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {change > 0 ? <ArrowUp className="w-3 h-3" /> : change < 0 ? <ArrowDown className="w-3 h-3" /> : null}
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
        {trend && (
          <span className="text-xs">
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-success" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-destructive" />}
          </span>
        )}
      </div>
    </div>
  );
}
