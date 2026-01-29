/**
 * Data Hub Page
 *
 * Consolidated data management for coaches:
 * - Import: ESPN auto-sync + CSV upload
 * - Outcomes: Game/practice results with mood correlation
 * - Reports: Generate and export custom reports
 *
 * Purpose: "Manage all my DATA"
 */

'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Database,
  Upload,
  Download,
  FileSpreadsheet,
  Trophy,
  FileText,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Minus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Zap,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/shared/ui/card';
import { cn } from '@/lib/utils';

type DataTab = 'import' | 'outcomes' | 'reports';

interface PerformanceOutcome {
  id: string;
  date: string;
  athleteId: string;
  athleteName: string;
  outcomeType: string;
  opponent: string | null;
  homeAway: string | null;
  gameResult: string | null;
  overallRating: number | null;
  preEventMood: number | null;
}

interface Report {
  id: string;
  title: string;
  type: 'weekly' | 'monthly';
  dateRange: string;
  generatedAt: Date;
  keyInsights: string[];
  readinessAvg: number;
}

function DataHubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DataTab>(
    (searchParams.get('tab') as DataTab) || 'import'
  );

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);
  const [availableSports, setAvailableSports] = useState<string[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [daysBack, setDaysBack] = useState(30);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Outcomes state
  const [outcomes, setOutcomes] = useState<PerformanceOutcome[]>([]);
  const [outcomesLoading, setOutcomesLoading] = useState(false);
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeStats, setOutcomeStats] = useState({ total: 0, wins: 0, losses: 0, avgRating: 0 });

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');

  // Tab change with URL sync
  const handleTabChange = (tab: DataTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/coach/data?${params.toString()}`);
  };

  // Load import info
  useEffect(() => {
    const loadImportInfo = async () => {
      try {
        const response = await fetch('/api/coach/import-games');
        if (response.ok) {
          const data = await response.json();
          setAvailableSports(data.sports || []);
        }
      } catch (error) {
        console.error('Error loading import info:', error);
      }
    };
    loadImportInfo();
  }, []);

  // Load outcomes
  const loadOutcomes = useCallback(async () => {
    try {
      setOutcomesLoading(true);
      const params = new URLSearchParams();
      if (outcomeFilter !== 'all') params.set('outcomeType', outcomeFilter);

      const response = await fetch(`/api/performance-outcomes?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load outcomes');

      const data = await response.json();
      const transformedOutcomes = (data.outcomes || []).map((o: any) => ({
        ...o,
        athleteName: o.Athlete?.User?.name || 'Unknown',
      }));

      setOutcomes(transformedOutcomes);

      // Calculate stats
      const total = transformedOutcomes.length;
      const wins = transformedOutcomes.filter((o: PerformanceOutcome) => o.gameResult === 'WIN').length;
      const losses = transformedOutcomes.filter((o: PerformanceOutcome) => o.gameResult === 'LOSS').length;
      const ratings = transformedOutcomes
        .map((o: PerformanceOutcome) => o.overallRating)
        .filter((r: number | null): r is number => r !== null);
      const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;

      setOutcomeStats({ total, wins, losses, avgRating });
    } catch (error) {
      console.error('Error loading outcomes:', error);
    } finally {
      setOutcomesLoading(false);
    }
  }, [outcomeFilter]);

  useEffect(() => {
    if (activeTab === 'outcomes') {
      loadOutcomes();
    }
  }, [activeTab, loadOutcomes]);

  // ESPN Import
  const handleESPNImport = async () => {
    try {
      setIsImporting(true);
      setImportResult(null);

      const response = await fetch('/api/coach/import-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'espn',
          daysBack,
          sport: selectedSport || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import failed');

      setImportResult(data.summary || { imported: data.imported || 0, skipped: 0, errors: 0 });
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({ imported: 0, skipped: 0, errors: 1 });
    } finally {
      setIsImporting(false);
    }
  };

  // CSV Upload
  const handleCSVUpload = async () => {
    if (!csvFile) return;

    try {
      setIsImporting(true);
      setImportResult(null);

      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await fetch('/api/coach/import-games', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');

      setImportResult(data.summary || { imported: data.imported || 0, skipped: 0, errors: 0 });
      setCsvFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      setImportResult({ imported: 0, skipped: 0, errors: 1 });
    } finally {
      setIsImporting(false);
    }
  };

  // Generate Report
  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      const response = await fetch('/api/coach/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType }),
      });

      if (response.ok) {
        const newReport = await response.json();
        setReports((prev) => [newReport, ...prev]);
      }
    } catch (error) {
      console.error('Report generation error:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Filter outcomes by search
  const filteredOutcomes = outcomes.filter((o) =>
    o.athleteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.opponent?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Data Hub</h1>
              <p className="text-sm text-muted-foreground">
                Import, export, and manage your team's performance data
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            {[
              { key: 'import', label: 'Import Data', icon: Upload },
              { key: 'outcomes', label: 'Outcomes', icon: Trophy },
              { key: 'reports', label: 'Reports', icon: FileText },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key as DataTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeTab === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* IMPORT TAB */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            {/* Import Options Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* ESPN Auto-Sync */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    ESPN Auto-Sync
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Automatically import game results and player stats from ESPN.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Sport</label>
                      <select
                        value={selectedSport}
                        onChange={(e) => setSelectedSport(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border bg-background"
                      >
                        <option value="">All Sports</option>
                        {availableSports.map((sport) => (
                          <option key={sport} value={sport}>{sport}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Days Back</label>
                      <select
                        value={daysBack}
                        onChange={(e) => setDaysBack(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border bg-background"
                      >
                        <option value={7}>Last 7 days</option>
                        <option value={14}>Last 14 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={60}>Last 60 days</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    onClick={handleESPNImport}
                    disabled={isImporting}
                    className="w-full"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Sync from ESPN
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* CSV Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-green-500" />
                    CSV Upload
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload performance data from a CSV file for bulk import.
                  </p>

                  <div
                    className={cn(
                      'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
                      csvFile ? 'border-green-500 bg-green-500/5' : 'border-border hover:border-primary/50'
                    )}
                  >
                    {csvFile ? (
                      <div className="space-y-2">
                        <FileSpreadsheet className="w-8 h-8 mx-auto text-green-500" />
                        <p className="font-medium">{csvFile.name}</p>
                        <button
                          onClick={() => setCsvFile(null)}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
                        <input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>

                  <Button
                    onClick={handleCSVUpload}
                    disabled={!csvFile || isImporting}
                    className="w-full"
                    variant={csvFile ? 'default' : 'outline'}
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload CSV
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Import Result */}
            {importResult && (
              <Card className={cn(
                'border-2',
                importResult.errors > 0 ? 'border-red-500/50' : 'border-green-500/50'
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    {importResult.errors > 0 ? (
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    ) : (
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    )}
                    <div>
                      <h3 className="font-semibold">Import Complete</h3>
                      <p className="text-sm text-muted-foreground">
                        {importResult.imported} imported, {importResult.skipped} skipped, {importResult.errors} errors
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* What Gets Imported */}
            <Card>
              <CardHeader>
                <CardTitle>What Gets Imported</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Trophy className="w-5 h-5 text-amber-500 mb-2" />
                    <h4 className="font-medium">Game Results</h4>
                    <p className="text-muted-foreground">Win/loss, scores, opponent</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-500 mb-2" />
                    <h4 className="font-medium">Player Stats</h4>
                    <p className="text-muted-foreground">Points, assists, rebounds, etc.</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
                    <h4 className="font-medium">Auto-Correlation</h4>
                    <p className="text-muted-foreground">Links with mood logs for insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* OUTCOMES TAB */}
        {activeTab === 'outcomes' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Total Outcomes</p>
                  <p className="text-2xl font-bold">{outcomeStats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Wins</p>
                  <p className="text-2xl font-bold text-green-500">{outcomeStats.wins}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Losses</p>
                  <p className="text-2xl font-bold text-red-500">{outcomeStats.losses}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Avg Rating</p>
                  <p className="text-2xl font-bold">{outcomeStats.avgRating.toFixed(1)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by athlete or opponent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background"
                />
              </div>
              <select
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border bg-background"
              >
                <option value="all">All Types</option>
                <option value="GAME">Games</option>
                <option value="PRACTICE">Practices</option>
                <option value="SCRIMMAGE">Scrimmages</option>
              </select>
            </div>

            {/* Outcomes List */}
            {outcomesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredOutcomes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Outcomes Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Import game data to see performance outcomes here.
                  </p>
                  <Button onClick={() => handleTabChange('import')}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredOutcomes.map((outcome) => (
                  <Card key={outcome.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            outcome.gameResult === 'WIN' ? 'bg-green-500/20' :
                            outcome.gameResult === 'LOSS' ? 'bg-red-500/20' : 'bg-muted'
                          )}>
                            {outcome.gameResult === 'WIN' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : outcome.gameResult === 'LOSS' ? (
                              <XCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <Minus className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{outcome.athleteName}</p>
                            <p className="text-sm text-muted-foreground">
                              {outcome.opponent ? `vs ${outcome.opponent}` : outcome.outcomeType}
                              {outcome.homeAway && ` (${outcome.homeAway})`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {new Date(outcome.date).toLocaleDateString()}
                          </p>
                          {outcome.overallRating && (
                            <p className="font-semibold">{outcome.overallRating}/100</p>
                          )}
                          {outcome.preEventMood && (
                            <p className="text-xs text-muted-foreground">
                              Pre-game mood: {outcome.preEventMood}/10
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Generate Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Generate Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Report Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as 'weekly' | 'monthly')}
                      className="w-full px-3 py-2 rounded-lg border bg-background"
                    >
                      <option value="weekly">Weekly Summary</option>
                      <option value="monthly">Monthly Report</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleGenerateReport} disabled={isGeneratingReport}>
                      {isGeneratingReport ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            {reports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Reports Yet</h3>
                  <p className="text-muted-foreground">
                    Generate your first report to see it here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{report.title}</h3>
                          <p className="text-sm text-muted-foreground">{report.dateRange}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{report.readinessAvg}</span>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                      {report.keyInsights.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Key Insights:</p>
                          <ul className="text-sm space-y-1">
                            {report.keyInsights.slice(0, 2).map((insight, i) => (
                              <li key={i} className="text-muted-foreground">• {insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DataHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <DataHubContent />
    </Suspense>
  );
}
