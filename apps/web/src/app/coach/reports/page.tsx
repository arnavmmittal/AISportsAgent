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
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
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
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reports
            </h1>
            <p className="mt-3 text-muted-foreground dark:text-gray-400 text-lg">Readiness analytics, performance correlations, and insights</p>
          </div>
          <button
            onClick={handleGenerateCustomReport}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold hover:scale-105 transform"
          >
            <FileText className="w-5 h-5" />
            Generate Custom Report
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-2">Total Reports</div>
                <div className="text-5xl font-black mb-2">{reports.length}</div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Last 30 days</div>
              </div>
              <div className="text-6xl opacity-20">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-2">Avg Readiness</div>
                <div className="text-5xl font-black mb-2">75<span className="text-2xl opacity-75">/100</span></div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">This month</div>
              </div>
              <div className="text-6xl opacity-20">🎯</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2">Correlation</div>
                <div className="text-5xl font-black mb-2">r=0.78</div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Readiness ↔ Performance</div>
              </div>
              <div className="text-6xl opacity-20">📈</div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all">
              <div className="p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-black text-foreground dark:text-gray-100">{report.title}</h3>
                      <span className="px-3 py-1 rounded-xl text-xs font-black uppercase bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {report.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
                      <span>📅 {report.dateRange}</span>
                      <span>•</span>
                      <span>Generated {new Date(report.generatedAt).toLocaleDateString()}</span>
                      {report.performanceCorrelation && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{report.performanceCorrelation}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`text-5xl font-black ${getReadinessColor(report.readinessAvg)}`}>
                    {report.readinessAvg}
                    <span className="text-xl opacity-75">/100</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
                  <h4 className="font-black text-foreground dark:text-gray-100 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Key Insights
                  </h4>
                  <ul className="space-y-2">
                    {report.keyInsights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-foreground dark:text-gray-200 font-semibold flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleViewReport(report)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all font-bold hover:scale-105 transform"
                  >
                    <FileText className="w-4 h-4" />
                    View Full Report
                  </button>
                  <button
                    onClick={() => handleExportPDF(report.id)}
                    disabled={isExporting === report.id}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-xl hover:shadow-lg transition-all font-bold hover:scale-105 transform hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
          <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden mt-10">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Multi-Modal Correlation Analysis</h2>
                  <p className="text-purple-100 font-semibold">How chat conversations predict performance</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Combined Model Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">Multiple R</div>
                  <div className="text-4xl font-black text-blue-900 dark:text-blue-200">{multiModalAnalysis.combinedModel.multipleR.toFixed(2)}</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">Strong correlation</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
                  <div className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-2">R² (Variance Explained)</div>
                  <div className="text-4xl font-black text-purple-900 dark:text-purple-200">{Math.round(multiModalAnalysis.combinedModel.rSquared * 100)}%</div>
                  <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">Predictive power</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                  <div className="text-sm font-bold text-green-600 dark:text-green-400 mb-2">Predictive Accuracy</div>
                  <div className="text-4xl font-black text-green-900 dark:text-green-200">{multiModalAnalysis.combinedModel.predictiveAccuracy}%</div>
                  <div className="text-xs text-green-700 dark:text-green-300 mt-1">Of game outcomes</div>
                </div>
              </div>

              {/* Topic Impact Table */}
              <div className="mb-8">
                <h3 className="text-xl font-black text-foreground dark:text-gray-100 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Topic Impact on Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-black text-gray-700 dark:text-gray-300">Topic</th>
                        <th className="text-right py-3 px-4 text-sm font-black text-gray-700 dark:text-gray-300">Performance Impact</th>
                        <th className="text-right py-3 px-4 text-sm font-black text-gray-700 dark:text-gray-300">Sample Size</th>
                        <th className="text-right py-3 px-4 text-sm font-black text-gray-700 dark:text-gray-300">Correlation</th>
                        <th className="text-center py-3 px-4 text-sm font-black text-gray-700 dark:text-gray-300">Significance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {multiModalAnalysis.conversationalMetrics.topicImpacts.map((topic) => (
                        <tr key={topic.topic} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4 font-semibold text-foreground dark:text-gray-200">
                            {topic.topic.replace(/-/g, ' ')}
                          </td>
                          <td className={`py-3 px-4 text-right font-black ${
                            topic.avgPerformanceImpact < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {topic.avgPerformanceImpact > 0 ? '+' : ''}{topic.avgPerformanceImpact.toFixed(1)}%
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                            {topic.sampleSize} games
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                            r={topic.correlation.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-xs font-black px-2 py-1 rounded ${
                              topic.pValue < 0.01
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : topic.pValue < 0.05
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              {topic.pValue < 0.01 ? '***' : topic.pValue < 0.05 ? '**' : '*'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  *** p&lt;0.01 (highly significant) • ** p&lt;0.05 (significant) • * p&lt;0.10 (marginally significant)
                </div>
              </div>

              {/* Pre-Game Mindset Impact */}
              <div className="mb-8">
                <h3 className="text-xl font-black text-foreground dark:text-gray-100 mb-4">Pre-Game Mindset Impact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {multiModalAnalysis.conversationalMetrics.mindsetImpacts.map((mindset) => (
                    <div
                      key={mindset.mindset}
                      className={`rounded-xl p-5 border-2 ${
                        mindset.comparisonToBaseline < 0
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      }`}
                    >
                      <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase">
                        {mindset.mindset}
                      </div>
                      <div className={`text-3xl font-black mb-1 ${
                        mindset.comparisonToBaseline < 0
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-green-700 dark:text-green-300'
                      }`}>
                        {mindset.comparisonToBaseline > 0 ? '+' : ''}{mindset.comparisonToBaseline.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        vs baseline ({mindset.sampleSize} games)
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Insights */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-l-4 border-purple-500 p-6 rounded-lg">
                <h4 className="font-black text-foreground dark:text-gray-100 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Actionable Insights
                </h4>
                <ul className="space-y-2">
                  {multiModalAnalysis.actionableInsights.map((insight, idx) => (
                    <li key={idx} className="text-sm text-foreground dark:text-gray-200 font-semibold flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Recommendation Card */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl shadow-xl p-8 border-2 border-purple-200 dark:border-purple-800 mt-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-purple-900 dark:text-purple-200 mb-2">Performance Correlation Insights</h3>
              <p className="text-purple-800 dark:text-purple-300 font-semibold mb-4">
                Strong correlation (r=0.78, p&lt;0.01) found between mental readiness scores and game performance.
                This is your competitive edge - use readiness forecasts to optimize lineups and interventions.
              </p>
              <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border-2 border-purple-300 dark:border-purple-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-bold text-purple-900 dark:text-purple-200">
                  <div>✅ When readiness &gt;85: Avg 78 PPG</div>
                  <div>⚠️ When readiness &lt;70: Avg 62 PPG (-16 PPG)</div>
                  <div>🎯 Top performer correlation: r=0.82</div>
                  <div>😴 Sleep quality strongest predictor: r=0.71</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Report Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedReport(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h2 className="text-3xl font-black text-white">{selectedReport.title}</h2>
                  <p className="text-blue-100 font-semibold mt-1">{selectedReport.dateRange}</p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8">
                {/* Report Meta Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">Report Type</div>
                    <div className="text-2xl font-black text-blue-900 dark:text-blue-200 uppercase">{selectedReport.type}</div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
                    <div className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-2">Avg Readiness</div>
                    <div className={`text-4xl font-black ${getReadinessColor(selectedReport.readinessAvg)}`}>
                      {selectedReport.readinessAvg}
                      <span className="text-xl opacity-75">/100</span>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                    <div className="text-sm font-bold text-green-600 dark:text-green-400 mb-2">Generated</div>
                    <div className="text-xl font-black text-green-900 dark:text-green-200">
                      {new Date(selectedReport.generatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {/* Performance Correlation */}
                {selectedReport.performanceCorrelation && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 p-6 rounded-lg mb-8">
                    <h3 className="font-black text-green-900 dark:text-green-200 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Performance Correlation
                    </h3>
                    <p className="text-lg text-green-800 dark:text-green-300 font-semibold">
                      {selectedReport.performanceCorrelation}
                    </p>
                  </div>
                )}

                {/* Key Insights */}
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-foreground dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    Key Insights
                  </h3>
                  <div className="space-y-4">
                    {selectedReport.keyInsights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-l-4 border-blue-500 p-5 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                            {idx + 1}
                          </span>
                          <p className="text-base text-foreground dark:text-gray-200 font-semibold pt-1">
                            {insight}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Statistics Section */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-black text-foreground dark:text-gray-100 mb-4">Detailed Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400 font-semibold">Report Period:</span>
                      <span className="font-black text-foreground dark:text-gray-100">{selectedReport.dateRange}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400 font-semibold">Report Type:</span>
                      <span className="font-black text-foreground dark:text-gray-100 uppercase">{selectedReport.type}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400 font-semibold">Team Avg Readiness:</span>
                      <span className={`font-black ${getReadinessColor(selectedReport.readinessAvg)}`}>
                        {selectedReport.readinessAvg}/100
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400 font-semibold">Generated Date:</span>
                      <span className="font-black text-foreground dark:text-gray-100">
                        {new Date(selectedReport.generatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => handleExportPDF(selectedReport.id)}
                    disabled={isExporting === selectedReport.id}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all font-bold hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Download className="w-5 h-5" />
                    {isExporting === selectedReport.id ? 'Exporting...' : 'Export as PDF'}
                  </button>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:shadow-lg transition-all font-bold hover:scale-105 transform"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowCustomReportModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-white" />
                  <div>
                    <h2 className="text-2xl font-black text-white">Generate Custom Report</h2>
                    <p className="text-blue-100 font-semibold">Configure your custom analytics report</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomReportModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-6">
                {/* Report Type */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-foreground dark:text-gray-100 mb-3">
                    <Calendar className="w-4 h-4" />
                    Report Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['weekly', 'monthly', 'custom'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setCustomReportForm({ ...customReportForm, reportType: type as any })}
                        className={`px-4 py-3 rounded-xl font-bold capitalize transition-all ${
                          customReportForm.reportType === type
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                    <label className="block text-sm font-bold text-foreground dark:text-gray-100 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customReportForm.startDate}
                      onChange={(e) => setCustomReportForm({ ...customReportForm, startDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-foreground dark:text-gray-100 font-semibold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-foreground dark:text-gray-100 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customReportForm.endDate}
                      onChange={(e) => setCustomReportForm({ ...customReportForm, endDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-foreground dark:text-gray-100 font-semibold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Metrics to Include */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-foreground dark:text-gray-100 mb-3">
                    <CheckSquare className="w-4 h-4" />
                    Metrics to Include
                  </label>
                  <div className="space-y-2">
                    {Object.entries(customReportForm.includeMetrics).map(([metric, enabled]) => (
                      <label
                        key={metric}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all"
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
                          className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-foreground dark:text-gray-200 capitalize">
                          {metric.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Athlete Filter */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-foreground dark:text-gray-100 mb-3">
                    <Users className="w-4 h-4" />
                    Athlete Filter
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setCustomReportForm({ ...customReportForm, athleteFilter: 'all' })}
                      className={`px-4 py-3 rounded-xl font-bold transition-all ${
                        customReportForm.athleteFilter === 'all'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      All Athletes
                    </button>
                    <button
                      onClick={() => setCustomReportForm({ ...customReportForm, athleteFilter: 'specific' })}
                      className={`px-4 py-3 rounded-xl font-bold transition-all ${
                        customReportForm.athleteFilter === 'specific'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Specific Athletes
                    </button>
                  </div>
                  {customReportForm.athleteFilter === 'specific' && (
                    <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                      <p className="text-sm text-blue-900 dark:text-blue-200 font-semibold">
                        Athlete selection coming soon! For now, reports will include all athletes.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmitCustomReport}
                    disabled={isGeneratingReport}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all font-bold hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <FileText className="w-5 h-5" />
                    {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                  </button>
                  <button
                    onClick={() => setShowCustomReportModal(false)}
                    disabled={isGeneratingReport}
                    className="px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:shadow-lg transition-all font-bold hover:scale-105 transform disabled:opacity-50"
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
