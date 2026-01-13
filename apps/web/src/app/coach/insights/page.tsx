'use client';

/**
 * Coach Insights Page (v2.2 - API-driven Analytics + Reports)
 *
 * Combines three previously separate pages:
 * - Analytics: Performance trends, sport breakdown, mental health metrics
 * - Reports: Report generation, export, multi-modal analysis
 * - Team Insights: Crisis alerts, engagement trends
 *
 * Uses tab navigation to preserve all features in one location.
 * All data is fetched from APIs - no mock data.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageCircle,
  Target,
  AlertTriangle,
  ChevronLeft,
  Rocket,
  FileText,
  Download,
  Brain,
  X,
  Calendar,
  CheckSquare,
  Activity,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

type InsightsTab = 'analytics' | 'reports';

interface Report {
  id: string;
  title: string;
  type: 'weekly' | 'monthly';
  dateRange: string;
  generatedAt: Date;
  keyInsights: string[];
  readinessAvg: number;
  performanceCorrelation?: string;
}

interface DashboardStats {
  totalAthletes: number;
  activeToday: number;
  atRiskCount: number;
  avgReadiness: number;
  crisisAlerts: number;
}

interface AnalyticsData {
  performanceTrend: string;
  monthlyTrend: string;
  sportBreakdown: { sport: string; count: number }[];
  moodAvg: number;
  confidenceAvg: number;
  stressAvg: number;
  engagementRate: number;
  activeGoals: number;
  completedGoals: number;
  resolvedThisWeek: number;
}

interface CorrelationData {
  correlationStrength: number;
  pValue: number;
  highReadinessPerformance: number;
  lowReadinessPerformance: number;
}

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<InsightsTab>('analytics');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showCustomReportModal, setShowCustomReportModal] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  // Custom report form state
  const [customReportForm, setCustomReportForm] = useState({
    reportType: 'weekly' as 'weekly' | 'monthly' | 'custom',
    startDate: '',
    endDate: '',
    includeMetrics: {
      readiness: true,
      mood: true,
      performance: true,
      chatInsights: true,
      interventions: true,
    },
    athleteFilter: 'all' as 'all' | 'specific',
  });

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch dashboard stats
        const dashboardRes = await fetch('/api/coach/dashboard');
        if (dashboardRes.ok) {
          const dashboardJson = await dashboardRes.json();
          setDashboardStats({
            totalAthletes: dashboardJson.totalAthletes || 0,
            activeToday: dashboardJson.activeToday || 0,
            atRiskCount: dashboardJson.atRiskCount || 0,
            avgReadiness: dashboardJson.avgReadiness || 0,
            crisisAlerts: dashboardJson.crisisAlerts?.length || 0,
          });
        }

        // Fetch performance correlation data
        const correlationRes = await fetch('/api/coach/analytics/performance-correlation');
        if (correlationRes.ok) {
          const correlationJson = await correlationRes.json();
          if (correlationJson.correlations && correlationJson.correlations.length > 0) {
            const firstCorrelation = correlationJson.correlations[0];
            setCorrelationData({
              correlationStrength: firstCorrelation.correlationStrength || 0,
              pValue: firstCorrelation.pValue || 1,
              highReadinessPerformance: 0,
              lowReadinessPerformance: 0,
            });
          }
        }

        // Fetch reports if there's an API for it
        const reportsRes = await fetch('/api/coach/reports');
        if (reportsRes.ok) {
          const reportsJson = await reportsRes.json();
          if (reportsJson.reports) {
            setReports(reportsJson.reports);
          }
        }

        // Try to get more analytics from different endpoints
        const analyticsRes = await fetch('/api/coach/analytics/team-summary');
        if (analyticsRes.ok) {
          const analyticsJson = await analyticsRes.json();
          setAnalyticsData({
            performanceTrend: analyticsJson.performanceTrend || '-',
            monthlyTrend: analyticsJson.monthlyTrend || '-',
            sportBreakdown: analyticsJson.sportBreakdown || [],
            moodAvg: analyticsJson.moodAvg || 0,
            confidenceAvg: analyticsJson.confidenceAvg || 0,
            stressAvg: analyticsJson.stressAvg || 0,
            engagementRate: analyticsJson.engagementRate || 0,
            activeGoals: analyticsJson.activeGoals || 0,
            completedGoals: analyticsJson.completedGoals || 0,
            resolvedThisWeek: analyticsJson.resolvedThisWeek || 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch insights data:', err);
        setError('Failed to load insights data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExportPDF = async (reportId: string) => {
    setIsExporting(reportId);
    try {
      const res = await fetch(`/api/coach/reports/${reportId}/export`, {
        method: 'POST',
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to export PDF');
      }
    } catch (error) {
      alert('Failed to export PDF');
    } finally {
      setIsExporting(null);
    }
  };

  const handleSubmitCustomReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch('/api/coach/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customReportForm),
      });
      if (res.ok) {
        const newReport = await res.json();
        setReports((prev) => [newReport, ...prev]);
        setShowCustomReportModal(false);
      } else {
        alert('Failed to generate report');
      }
    } catch (error) {
      alert('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-risk-yellow mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Failed to Load</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-primary" />
                Insights
              </h1>
              <p className="mt-1 text-muted-foreground">
                Analytics, reports, and performance correlations
              </p>
            </div>
            <Link href="/coach/dashboard">
              <Button variant="outline" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Dashboard
              </Button>
            </Link>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-6 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('analytics')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
                activeTab === 'analytics'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <TrendingUp className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
                activeTab === 'reports'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <FileText className="w-4 h-4" />
              Reports
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Performance Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track athlete performance over time with detailed metrics.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Weekly Average:</span>
                      <span className="font-semibold text-foreground">
                        {analyticsData?.performanceTrend || 'No data'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Trend:</span>
                      <span className="font-semibold text-foreground">
                        {analyticsData?.monthlyTrend || 'No data'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sport Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 text-info" />
                    Sport Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Analytics segmented by sport category.
                  </p>
                  {analyticsData?.sportBreakdown && analyticsData.sportBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {analyticsData.sportBreakdown.slice(0, 3).map((sport, idx) => (
                        <div key={sport.sport}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{sport.sport}</span>
                            <span className="font-semibold">{sport.count} athletes</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={cn(
                                'h-2 rounded-full',
                                idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-risk-green' : 'bg-info'
                              )}
                              style={{
                                width: `${Math.min((sport.count / (dashboardStats?.totalAthletes || 1)) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No sport data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Mental Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-risk-green" />
                    Mental Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Team-wide mental wellness indicators.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Mood Score:</span>
                      <span className="font-semibold">
                        {analyticsData?.moodAvg ? `${analyticsData.moodAvg.toFixed(1)}/10` : 'No data'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Confidence:</span>
                      <span className="font-semibold">
                        {analyticsData?.confidenceAvg ? `${analyticsData.confidenceAvg.toFixed(1)}/10` : 'No data'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Stress:</span>
                      <span
                        className={cn(
                          'font-semibold',
                          analyticsData?.stressAvg && analyticsData.stressAvg > 5
                            ? 'text-risk-yellow'
                            : 'text-foreground'
                        )}
                      >
                        {analyticsData?.stressAvg ? `${analyticsData.stressAvg.toFixed(1)}/10` : 'No data'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Engagement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Chat and interaction statistics.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Active Today:</span>
                      <span className="font-semibold">
                        {dashboardStats?.activeToday ?? 'No data'} athletes
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Athletes:</span>
                      <span className="font-semibold">
                        {dashboardStats?.totalAthletes ?? 'No data'} athletes
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Engagement Rate:</span>
                      <span
                        className={cn(
                          'font-semibold',
                          analyticsData?.engagementRate && analyticsData.engagementRate > 80
                            ? 'text-risk-green'
                            : 'text-foreground'
                        )}
                      >
                        {analyticsData?.engagementRate ? `${analyticsData.engagementRate}%` : 'No data'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Goal Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-warning" />
                    Goal Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Team goal completion metrics.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Active Goals:</span>
                      <span className="font-semibold">
                        {analyticsData?.activeGoals ?? 'No data'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="font-semibold text-risk-green">
                        {analyticsData?.completedGoals ?? 'No data'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate:</span>
                      <span className="font-semibold">
                        {analyticsData?.activeGoals && analyticsData.completedGoals
                          ? `${Math.round((analyticsData.completedGoals / (analyticsData.activeGoals + analyticsData.completedGoals)) * 100)}%`
                          : 'No data'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="w-5 h-5 text-risk-red" />
                    Risk Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Identified patterns requiring attention.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">At-Risk Athletes:</span>
                      <span
                        className={cn(
                          'font-semibold',
                          (dashboardStats?.atRiskCount ?? 0) > 0 ? 'text-risk-yellow' : 'text-foreground'
                        )}
                      >
                        {dashboardStats?.atRiskCount ?? 'No data'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Crisis Alerts:</span>
                      <span
                        className={cn(
                          'font-semibold',
                          (dashboardStats?.crisisAlerts ?? 0) > 0 ? 'text-risk-red' : 'text-foreground'
                        )}
                      >
                        {dashboardStats?.crisisAlerts ?? 'No data'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Resolved This Week:</span>
                      <span className="font-semibold text-risk-green">
                        {analyticsData?.resolvedThisWeek ?? 'No data'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coming Soon */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-primary" />
                  Coming Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <h3 className="font-semibold text-foreground mb-2">Custom Reports</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate custom analytics reports for specific time periods.
                    </p>
                  </div>
                  <div className="p-4 bg-risk-green/5 rounded-lg border border-risk-green/10">
                    <h3 className="font-semibold text-foreground mb-2">AI Predictions</h3>
                    <p className="text-sm text-muted-foreground">
                      ML-powered predictions for athlete performance and risk levels.
                    </p>
                  </div>
                  <div className="p-4 bg-info/5 rounded-lg border border-info/10">
                    <h3 className="font-semibold text-foreground mb-2">Comparative Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Compare athletes or teams against benchmarks.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Total Reports
                    </p>
                    <p className="text-4xl font-bold text-foreground">{reports.length}</p>
                    <p className="text-sm text-muted-foreground mt-1">Generated</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Avg Readiness
                    </p>
                    <p className="text-4xl font-bold text-foreground">
                      {dashboardStats?.avgReadiness ?? '-'}
                      <span className="text-xl text-muted-foreground">/100</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">This month</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-risk-green/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-risk-green" />
                  </div>
                </div>
              </div>

              <div className="card-elevated p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      Correlation
                    </p>
                    <p className="text-4xl font-bold text-foreground">
                      {correlationData?.correlationStrength
                        ? `r=${correlationData.correlationStrength.toFixed(2)}`
                        : '-'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Readiness ↔ Performance</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-info" />
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Report Button */}
            <div className="flex justify-end">
              <Button onClick={() => setShowCustomReportModal(true)}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Custom Report
              </Button>
            </div>

            {/* Reports List */}
            {reports.length > 0 ? (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="card-elevated overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-foreground">{report.title}</h3>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium uppercase bg-muted text-muted-foreground">
                              {report.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{report.dateRange}</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            <span>Generated {new Date(report.generatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-4xl font-bold text-foreground">
                          {report.readinessAvg}
                          <span className="text-lg text-muted-foreground">/100</span>
                        </div>
                      </div>

                      <div className="bg-muted/50 border-l-4 border-primary p-4 rounded-lg mb-4">
                        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          Key Insights
                        </h4>
                        <ul className="space-y-1.5">
                          {report.keyInsights.map((insight, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex gap-3">
                        <Button onClick={() => setSelectedReport(report)}>
                          <FileText className="w-4 h-4 mr-2" />
                          View Full Report
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleExportPDF(report.id)}
                          disabled={isExporting === report.id}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {isExporting === report.id ? 'Exporting...' : 'Export PDF'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Reports Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate your first custom report to see insights here.
                    </p>
                    <Button onClick={() => setShowCustomReportModal(true)}>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Correlation Card */}
            {correlationData && correlationData.correlationStrength > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-6 h-6 text-info" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Performance Correlation Insights
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {correlationData.pValue < 0.05
                          ? `Strong correlation (r=${correlationData.correlationStrength.toFixed(2)}, p<0.05) found between mental readiness scores and game performance.`
                          : `Correlation (r=${correlationData.correlationStrength.toFixed(2)}) found between mental readiness and performance.`}
                      </p>
                      {correlationData.highReadinessPerformance > 0 && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-risk-green">●</span> When readiness &gt;85: Avg{' '}
                              {correlationData.highReadinessPerformance} PPG
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-risk-yellow">●</span> When readiness &lt;70: Avg{' '}
                              {correlationData.lowReadinessPerformance} PPG
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* View Report Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-card rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between rounded-t-xl">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{selectedReport.title}</h2>
                <p className="text-muted-foreground mt-1">{selectedReport.dateRange}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Report Type</p>
                  <p className="text-xl font-bold text-foreground uppercase">{selectedReport.type}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avg Readiness</p>
                  <p className="text-3xl font-bold text-foreground">
                    {selectedReport.readinessAvg}
                    <span className="text-lg text-muted-foreground">/100</span>
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Generated</p>
                  <p className="text-xl font-bold text-foreground">
                    {new Date(selectedReport.generatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedReport.performanceCorrelation && (
                <div className="bg-risk-green/5 border-l-4 border-risk-green p-4 rounded-lg">
                  <h3 className="font-medium text-foreground mb-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-risk-green" />
                    Performance Correlation
                  </h3>
                  <p className="text-muted-foreground">{selectedReport.performanceCorrelation}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Key Insights
                </h3>
                <div className="space-y-3">
                  {selectedReport.keyInsights.map((insight, idx) => (
                    <div key={idx} className="bg-muted/50 border-l-4 border-primary p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="text-lg font-bold text-primary">{idx + 1}</span>
                        <p className="text-sm text-muted-foreground pt-0.5">{insight}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => handleExportPDF(selectedReport.id)}
                  disabled={isExporting === selectedReport.id}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting === selectedReport.id ? 'Exporting...' : 'Export as PDF'}
                </Button>
                <Button variant="outline" onClick={() => setSelectedReport(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Report Modal */}
      {showCustomReportModal && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowCustomReportModal(false)}
        >
          <div
            className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Generate Custom Report</h2>
                  <p className="text-sm text-muted-foreground">Configure your custom analytics report</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomReportModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Report Type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Report Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['weekly', 'monthly', 'custom'].map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        setCustomReportForm({ ...customReportForm, reportType: type as any })
                      }
                      className={cn(
                        'px-3 py-2 rounded-lg font-medium capitalize transition-colors',
                        customReportForm.reportType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
                  <input
                    type="date"
                    value={customReportForm.startDate}
                    onChange={(e) =>
                      setCustomReportForm({ ...customReportForm, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
                  <input
                    type="date"
                    value={customReportForm.endDate}
                    onChange={(e) =>
                      setCustomReportForm({ ...customReportForm, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Metrics */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <CheckSquare className="w-4 h-4 text-muted-foreground" />
                  Metrics to Include
                </label>
                <div className="space-y-2">
                  {Object.entries(customReportForm.includeMetrics).map(([metric, enabled]) => (
                    <label
                      key={metric}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) =>
                          setCustomReportForm({
                            ...customReportForm,
                            includeMetrics: {
                              ...customReportForm.includeMetrics,
                              [metric]: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                      />
                      <span className="font-medium text-foreground capitalize">
                        {metric.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  onClick={handleSubmitCustomReport}
                  disabled={isGeneratingReport}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </Button>
                <Button variant="outline" onClick={() => setShowCustomReportModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
