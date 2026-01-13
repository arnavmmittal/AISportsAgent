'use client';

/**
 * Coach Insights Page (v2.1 - Consolidated Analytics + Reports)
 *
 * Combines three previously separate pages:
 * - Analytics: Performance trends, sport breakdown, mental health metrics
 * - Reports: Report generation, export, multi-modal analysis
 * - Team Insights: Crisis alerts, engagement trends
 *
 * Uses tab navigation to preserve all features in one location.
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

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<InsightsTab>('analytics');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showCustomReportModal, setShowCustomReportModal] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

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

  const [reports] = useState<Report[]>([
    {
      id: '1',
      title: 'Weekly Readiness Summary',
      type: 'weekly',
      dateRange: 'Jan 6-12, 2026',
      generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      keyInsights: [
        'Team avg readiness: 72/100 (↓6 points from last week)',
        '3 athletes in high-risk category (readiness <50)',
        'Finals week pattern detected - stress up 45%, sleep down 2.1hrs',
        'Sarah Johnson forecast: decline to 56/100 by game day (7 days)',
      ],
      readinessAvg: 72,
      performanceCorrelation: 'r=0.78 between readiness & points scored',
    },
    {
      id: '2',
      title: 'Monthly Performance Correlation',
      type: 'monthly',
      dateRange: 'December 2025',
      generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      keyInsights: [
        'When readiness >85: Team scores avg 78 PPG',
        'When readiness <70: Team scores avg 62 PPG (-16 PPG)',
        'Sarah Johnson: r=0.82 correlation between readiness & individual PPG',
        'Sleep quality strongest predictor of next-day performance (r=0.71)',
      ],
      readinessAvg: 75,
      performanceCorrelation: 'Strong correlation found (r=0.78, p<0.01)',
    },
  ]);

  const handleExportPDF = async (reportId: string) => {
    setIsExporting(reportId);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      alert('PDF exported successfully!');
    } catch (error) {
      alert('Failed to export PDF');
    } finally {
      setIsExporting(null);
    }
  };

  const handleSubmitCustomReport = async () => {
    setIsGeneratingReport(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setShowCustomReportModal(false);
      alert('Custom report generated!');
    } catch (error) {
      alert('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

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
                      <span className="font-semibold text-risk-green">+12%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Trend:</span>
                      <span className="font-semibold text-risk-green">Improving</span>
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
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Basketball</span>
                        <span className="font-semibold">12 athletes</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Soccer</span>
                        <span className="font-semibold">8 athletes</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-risk-green h-2 rounded-full" style={{ width: '40%' }} />
                      </div>
                    </div>
                  </div>
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
                      <span className="font-semibold">7.2/10</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Confidence:</span>
                      <span className="font-semibold">7.8/10</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Stress:</span>
                      <span className="font-semibold text-risk-yellow">4.3/10</span>
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
                      <span className="font-semibold">18 athletes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">This Week:</span>
                      <span className="font-semibold">24 athletes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Engagement Rate:</span>
                      <span className="font-semibold text-risk-green">92%</span>
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
                      <span className="font-semibold">45</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="font-semibold text-risk-green">37</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate:</span>
                      <span className="font-semibold text-risk-green">82%</span>
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
                      <span className="font-semibold text-risk-yellow">3</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Crisis Alerts:</span>
                      <span className="font-semibold text-risk-red">2</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Resolved This Week:</span>
                      <span className="font-semibold text-risk-green">5</span>
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
                    <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
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
                      75<span className="text-xl text-muted-foreground">/100</span>
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
                    <p className="text-4xl font-bold text-foreground">r=0.78</p>
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

            {/* Correlation Card */}
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
                      Strong correlation (r=0.78, p&lt;0.01) found between mental readiness scores and
                      game performance.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-risk-green">●</span> When readiness &gt;85: Avg 78 PPG
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-risk-yellow">●</span> When readiness &lt;70: Avg 62 PPG
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
