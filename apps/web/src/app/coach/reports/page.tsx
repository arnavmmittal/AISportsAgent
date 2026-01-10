'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp, BarChart3, Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { Card } from '@/design-system/components';
import { Button } from '@/design-system/components/Button';

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

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/coach/reports');
        if (!response.ok) throw new Error('Failed to fetch reports');

        const data = await response.json();
        setReports(data.reports || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleExport = async (reportId: string) => {
    setIsExporting(reportId);
    try {
      const response = await fetch(`/api/coach/reports/${reportId}/export`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to export report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setIsExporting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-body">Loading reports...</p>
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
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Reports & Analytics
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400 text-lg font-body">
            Performance insights and team summaries
          </p>
        </div>

        {/* Reports Grid */}
        {reports.length === 0 ? (
          <Card variant="elevated" padding="lg" className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Reports Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 font-body">
              Reports will be generated automatically based on team activity
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reports.map((report) => (
              <Card
                key={report.id}
                variant="elevated"
                padding="lg"
                hover
                className="cursor-pointer"
                onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      report.type === 'weekly'
                        ? 'bg-primary-600 dark:bg-primary-500'
                        : 'bg-info-600 dark:bg-info-500'
                    }`}>
                      {report.type === 'weekly' ? (
                        <Calendar className="w-6 h-6 text-white" />
                      ) : (
                        <BarChart3 className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100">
                        {report.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-body">
                        {report.dateRange}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={isExporting === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(report.id);
                    }}
                    disabled={isExporting === report.id}
                  >
                    Export
                  </Button>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 font-body">
                      Avg Readiness
                    </p>
                    <p className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100">
                      {report.readinessAvg}
                      <span className="text-lg text-gray-600 dark:text-gray-400">/100</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 font-body">
                      Generated
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-body">
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Expanded View */}
                {selectedReport?.id === report.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <h4 className="font-display font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Key Insights
                    </h4>
                    <ul className="space-y-2">
                      {report.keyInsights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-body">
                            {insight}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {report.performanceCorrelation && (
                      <div className="mt-4 p-3 bg-info-50 dark:bg-info-900/20 rounded-lg border border-info-200 dark:border-info-800">
                        <p className="text-sm text-info-700 dark:text-info-300 font-medium font-body">
                          {report.performanceCorrelation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
