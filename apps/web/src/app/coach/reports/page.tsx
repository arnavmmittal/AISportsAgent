'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp, BarChart3, Brain, MessageSquare, X, Calendar, Users, CheckSquare } from 'lucide-react';

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

interface TopicImpact {
  topic: string;
  avgPerformanceImpact: number;
  sampleSize: number;
  correlation: number;
  pValue: number;
}

interface MindsetImpact {
  mindset: string;
  avgPerformance: number;
  comparisonToBaseline: number;
  sampleSize: number;
}

interface MultiModalAnalysis {
  conversationalMetrics: {
    sentimentCorrelation: number;
    sentimentPValue: number;
    topicImpacts: TopicImpact[];
    mindsetImpacts: MindsetImpact[];
  };
  combinedModel: {
    multipleR: number;
    rSquared: number;
    predictiveAccuracy: number;
  };
  actionableInsights: string[];
}

export default function ReportsPage() {
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
    selectedAthletes: [] as string[],
  });

  const [reports] = useState<Report[]>([
    {
      id: '1',
      title: 'Weekly Readiness Summary',
      type: 'weekly',
      dateRange: 'Dec 23-29, 2025',
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
    {
      id: '3',
      title: 'Intervention Outcomes Report',
      type: 'monthly',
      dateRange: 'December 2025',
      generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      keyInsights: [
        '12 interventions completed this month',
        '9 athletes improved readiness after intervention (75% success rate)',
        'Avg readiness improvement: +18 points post-intervention',
        'Most effective: sleep optimization coaching (+22 points avg)',
      ],
      readinessAvg: 78,
    },
  ]);

  const [multiModalAnalysis, setMultiModalAnalysis] = useState<MultiModalAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // Fetch multi-modal analysis on mount
  useEffect(() => {
    loadMultiModalAnalysis();
  }, []);

  const loadMultiModalAnalysis = async () => {
    try {
      setIsLoadingAnalysis(true);
      // Use first athlete for demo (in production, this would be team-wide or coach-selected)
      const response = await fetch('/api/analytics/multi-modal?athleteId=placeholder&days=90');

      if (response.ok) {
        const data = await response.json();
        setMultiModalAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Failed to load multi-modal analysis:', error);
      // Use mock data for demo
      setMultiModalAnalysis({
        conversationalMetrics: {
          sentimentCorrelation: 0.64,
          sentimentPValue: 0.003,
          topicImpacts: [
            {
              topic: 'fear of failure',
              avgPerformanceImpact: -18.3,
              sampleSize: 12,
              correlation: -0.68,
              pValue: 0.001,
            },
            {
              topic: 'performance-anxiety',
              avgPerformanceImpact: -14.7,
              sampleSize: 15,
              correlation: -0.59,
              pValue: 0.008,
            },
            {
              topic: 'mindset-mental',
              avgPerformanceImpact: 12.4,
              sampleSize: 18,
              correlation: 0.56,
              pValue: 0.012,
            },
            {
              topic: 'goal-setting',
              avgPerformanceImpact: 9.8,
              sampleSize: 14,
              correlation: 0.48,
              pValue: 0.024,
            },
          ],
          mindsetImpacts: [
            {
              mindset: 'anxious',
              avgPerformance: 68.4,
              comparisonToBaseline: -14.7,
              sampleSize: 8,
            },
            {
              mindset: 'focused',
              avgPerformance: 91.2,
              comparisonToBaseline: 8.1,
              sampleSize: 12,
            },
            {
              mindset: 'confident',
              avgPerformance: 88.5,
              comparisonToBaseline: 5.4,
              sampleSize: 10,
            },
          ],
        },
        combinedModel: {
          multipleR: 0.73,
          rSquared: 0.53,
          predictiveAccuracy: 78,
        },
        actionableInsights: [
          "Chat sentiment significantly predicts performance (r=0.64, p=0.003)",
          "'fear of failure' linked to 18% performance drop - intervene when detected",
          "Anxious pre-game mindset: -15% vs baseline (8 games)",
          "Combined readiness + chat model explains 53% of performance variance",
        ],
      });
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 85) return 'text-secondary dark:text-accent';
    if (score >= 70) return 'text-muted-foreground dark:text-muted-foreground';
    if (score >= 50) return 'text-muted-foreground dark:text-muted-foreground';
    return 'text-muted-foreground dark:text-muted-foreground';
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
  };

  const handleExportPDF = async (reportId: string) => {
    setIsExporting(reportId);
    try {
      // Call API to generate PDF
      const response = await fetch(`/api/reports/${reportId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleGenerateCustomReport = () => {
    setShowCustomReportModal(true);
  };

  const handleSubmitCustomReport = async () => {
    setIsGeneratingReport(true);
    try {
      // Validate form
      if (!customReportForm.startDate || !customReportForm.endDate) {
        alert('Please select both start and end dates');
        return;
      }

      // Call API to generate custom report
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customReportForm),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();

      // Close modal and show success message
      setShowCustomReportModal(false);
      alert(`Custom report "${data.title}" generated successfully! Refresh the page to see it in the reports list.`);

      // Reset form
      setCustomReportForm({
        reportType: 'weekly',
        startDate: '',
        endDate: '',
        includeMetrics: {
          readiness: true,
          mood: true,
          performance: true,
          chatInsights: true,
          interventions: true,
        },
        athleteFilter: 'all',
        selectedAthletes: [],
      });
    } catch (error) {
      console.error('Error generating custom report:', error);
      alert('Failed to generate custom report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Reports
            </h1>
            <p className="mt-2 text-muted-foreground text-base">Readiness analytics, performance correlations, and insights</p>
          </div>
          <button
            onClick={handleGenerateCustomReport}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium"
          >
            <FileText className="w-4 h-4" />
            Generate Custom Report
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Reports</p>
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Avg Readiness</p>
                <p className="text-4xl font-bold text-foreground">75<span className="text-xl text-muted-foreground">/100</span></p>
                <p className="text-sm text-muted-foreground mt-1">This month</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-risk-green/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-risk-green" />
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Correlation</p>
                <p className="text-4xl font-bold text-foreground">r=0.78</p>
                <p className="text-sm text-muted-foreground mt-1">Readiness ↔ Performance</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-info" />
              </div>
            </div>
          </div>
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
                      {report.performanceCorrelation && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                          <span className="font-medium text-primary">{report.performanceCorrelation}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`text-4xl font-bold ${getReadinessColor(report.readinessAvg)}`}>
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
                  <button
                    onClick={() => handleViewReport(report)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    View Full Report
                  </button>
                  <button
                    onClick={() => handleExportPDF(report.id)}
                    disabled={isExporting === report.id}
                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {isExporting === report.id ? 'Exporting...' : 'Export PDF'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Multi-Modal Correlation Analysis */}
        {multiModalAnalysis && (
          <div className="card-elevated overflow-hidden mt-8">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Multi-Modal Correlation Analysis</h2>
                  <p className="text-sm text-muted-foreground">How chat conversations predict performance</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Combined Model Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-info/5 rounded-lg p-4 border border-info/20">
                  <p className="text-sm font-medium text-info mb-1">Multiple R</p>
                  <p className="text-3xl font-bold text-foreground">{multiModalAnalysis.combinedModel.multipleR.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Strong correlation</p>
                </div>

                <div className="bg-accent/5 rounded-lg p-4 border border-accent/20">
                  <p className="text-sm font-medium text-accent mb-1">R² (Variance Explained)</p>
                  <p className="text-3xl font-bold text-foreground">{Math.round(multiModalAnalysis.combinedModel.rSquared * 100)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Predictive power</p>
                </div>

                <div className="bg-risk-green/5 rounded-lg p-4 border border-risk-green/20">
                  <p className="text-sm font-medium text-risk-green mb-1">Predictive Accuracy</p>
                  <p className="text-3xl font-bold text-foreground">{multiModalAnalysis.combinedModel.predictiveAccuracy}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Of game outcomes</p>
                </div>
              </div>

              {/* Topic Impact Table */}
              <div className="mb-6">
                <h3 className="text-base font-medium text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-accent" />
                  Topic Impact on Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Topic</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Performance Impact</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Sample Size</th>
                        <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Correlation</th>
                        <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Significance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {multiModalAnalysis.conversationalMetrics.topicImpacts.map((topic) => (
                        <tr key={topic.topic} className="border-b border-border hover:bg-muted/50">
                          <td className="py-2 px-3 font-medium text-foreground">
                            {topic.topic.replace(/-/g, ' ')}
                          </td>
                          <td className={`py-2 px-3 text-right font-semibold ${
                            topic.avgPerformanceImpact < 0
                              ? 'text-risk-red'
                              : 'text-risk-green'
                          }`}>
                            {topic.avgPerformanceImpact > 0 ? '+' : ''}{topic.avgPerformanceImpact.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right text-muted-foreground">
                            {topic.sampleSize} games
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-foreground">
                            r={topic.correlation.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              topic.pValue < 0.01
                                ? 'bg-risk-green/10 text-risk-green'
                                : topic.pValue < 0.05
                                ? 'bg-risk-yellow/10 text-risk-yellow'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {topic.pValue < 0.01 ? '***' : topic.pValue < 0.05 ? '**' : '*'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  *** p&lt;0.01 (highly significant) • ** p&lt;0.05 (significant) • * p&lt;0.10 (marginally significant)
                </p>
              </div>

              {/* Pre-Game Mindset Impact */}
              <div className="mb-6">
                <h3 className="text-base font-medium text-foreground mb-3">Pre-Game Mindset Impact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {multiModalAnalysis.conversationalMetrics.mindsetImpacts.map((mindset) => (
                    <div
                      key={mindset.mindset}
                      className={`rounded-lg p-4 border ${
                        mindset.comparisonToBaseline < 0
                          ? 'bg-risk-red/5 border-risk-red/20'
                          : 'bg-risk-green/5 border-risk-green/20'
                      }`}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase">
                        {mindset.mindset}
                      </p>
                      <p className={`text-2xl font-bold mb-1 ${
                        mindset.comparisonToBaseline < 0
                          ? 'text-risk-red'
                          : 'text-risk-green'
                      }`}>
                        {mindset.comparisonToBaseline > 0 ? '+' : ''}{mindset.comparisonToBaseline.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        vs baseline ({mindset.sampleSize} games)
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Insights */}
              <div className="bg-muted/50 border-l-4 border-accent p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  Actionable Insights
                </h4>
                <ul className="space-y-1.5">
                  {multiModalAnalysis.actionableInsights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Recommendation Card */}
        <div className="card-elevated p-6 mt-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-info" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Performance Correlation Insights</h3>
              <p className="text-muted-foreground mb-4">
                Strong correlation (r=0.78, p&lt;0.01) found between mental readiness scores and game performance.
                This is your competitive edge - use readiness forecasts to optimize lineups and interventions.
              </p>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-foreground">
                  <div className="flex items-center gap-2"><span className="text-risk-green">●</span> When readiness &gt;85: Avg 78 PPG</div>
                  <div className="flex items-center gap-2"><span className="text-risk-yellow">●</span> When readiness &lt;70: Avg 62 PPG (-16 PPG)</div>
                  <div className="flex items-center gap-2"><span className="text-primary">●</span> Top performer correlation: r=0.82</div>
                  <div className="flex items-center gap-2"><span className="text-info">●</span> Sleep quality strongest predictor: r=0.71</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Report Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedReport(null)}>
            <div className="bg-card rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between rounded-t-xl">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">{selectedReport.title}</h2>
                  <p className="text-muted-foreground mt-1">{selectedReport.dateRange}</p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Report Meta Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Report Type</p>
                    <p className="text-xl font-bold text-foreground uppercase">{selectedReport.type}</p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Avg Readiness</p>
                    <p className={`text-3xl font-bold ${getReadinessColor(selectedReport.readinessAvg)}`}>
                      {selectedReport.readinessAvg}
                      <span className="text-lg text-muted-foreground">/100</span>
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Generated</p>
                    <p className="text-xl font-bold text-foreground">
                      {new Date(selectedReport.generatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Performance Correlation */}
                {selectedReport.performanceCorrelation && (
                  <div className="bg-risk-green/5 border-l-4 border-risk-green p-4 rounded-lg mb-6">
                    <h3 className="font-medium text-foreground mb-1 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-risk-green" />
                      Performance Correlation
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedReport.performanceCorrelation}
                    </p>
                  </div>
                )}

                {/* Key Insights */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-accent" />
                    Key Insights
                  </h3>
                  <div className="space-y-3">
                    {selectedReport.keyInsights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="bg-muted/50 border-l-4 border-primary p-4 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg font-bold text-primary">
                            {idx + 1}
                          </span>
                          <p className="text-sm text-muted-foreground pt-0.5">
                            {insight}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Statistics Section */}
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <h3 className="text-base font-medium text-foreground mb-3">Detailed Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Report Period:</span>
                      <span className="font-medium text-foreground">{selectedReport.dateRange}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Report Type:</span>
                      <span className="font-medium text-foreground uppercase">{selectedReport.type}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Team Avg Readiness:</span>
                      <span className={`font-medium ${getReadinessColor(selectedReport.readinessAvg)}`}>
                        {selectedReport.readinessAvg}/100
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Generated Date:</span>
                      <span className="font-medium text-foreground">
                        {new Date(selectedReport.generatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleExportPDF(selectedReport.id)}
                    disabled={isExporting === selectedReport.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {isExporting === selectedReport.id ? 'Exporting...' : 'Export as PDF'}
                  </button>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2.5 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Report Modal */}
        {showCustomReportModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowCustomReportModal(false)}>
            <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
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
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Modal Body */}
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
                        onClick={() => setCustomReportForm({ ...customReportForm, reportType: type as any })}
                        className={`px-3 py-2 rounded-lg font-medium capitalize transition-colors ${
                          customReportForm.reportType === type
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customReportForm.startDate}
                      onChange={(e) => setCustomReportForm({ ...customReportForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customReportForm.endDate}
                      onChange={(e) => setCustomReportForm({ ...customReportForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Metrics to Include */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <CheckSquare className="w-4 h-4 text-muted-foreground" />
                    Metrics to Include
                  </label>
                  <div className="space-y-2">
                    {Object.entries(customReportForm.includeMetrics).map(([metric, enabled]) => (
                      <label
                        key={metric}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
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

                {/* Athlete Filter */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Athlete Filter
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCustomReportForm({ ...customReportForm, athleteFilter: 'all' })}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        customReportForm.athleteFilter === 'all'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      All Athletes
                    </button>
                    <button
                      onClick={() => setCustomReportForm({ ...customReportForm, athleteFilter: 'specific' })}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        customReportForm.athleteFilter === 'specific'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      Specific Athletes
                    </button>
                  </div>
                  {customReportForm.athleteFilter === 'specific' && (
                    <div className="mt-3 p-3 bg-info/10 border border-info/20 rounded-lg">
                      <p className="text-sm text-info">
                        Athlete selection coming soon! For now, reports will include all athletes.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSubmitCustomReport}
                    disabled={isGeneratingReport}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-4 h-4" />
                    {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                  </button>
                  <button
                    onClick={() => setShowCustomReportModal(false)}
                    disabled={isGeneratingReport}
                    className="px-4 py-2.5 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
