'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Download, AlertCircle, CheckCircle2, FileText, RefreshCw, Zap } from 'lucide-react';

export default function ImportPerformancePage() {
  const [file, setFile] = useState<File | null>(null);
  const [sport, setSport] = useState('Basketball');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    imported?: number;
    errors?: number;
    errorDetails?: Array<{ row: number; error: string }>;
    message?: string;
  } | null>(null);

  // ESPN sync state
  const [espnSyncing, setEspnSyncing] = useState(false);
  const [espnDaysBack, setEspnDaysBack] = useState(30);
  const [espnSport, setEspnSport] = useState<string>('');
  const [availableSports, setAvailableSports] = useState<string[]>([]);
  const [espnResult, setEspnResult] = useState<{
    success: boolean;
    summary?: {
      imported: number;
      skipped: number;
      errors: number;
      games: Array<{
        athleteName: string;
        opponent: string;
        date: string;
        gameResult: string;
        alreadyExists: boolean;
      }>;
    };
    error?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available sports on mount
  useEffect(() => {
    async function fetchSports() {
      try {
        const response = await fetch('/api/coach/import-games');
        if (response.ok) {
          const data = await response.json();
          setAvailableSports(data.sports || []);
          if (data.sports?.length > 0) {
            setEspnSport(data.sports[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching sports:', error);
      }
    }
    fetchSports();
  }, []);

  // ESPN sync handler
  const handleEspnSync = async () => {
    setEspnSyncing(true);
    setEspnResult(null);

    try {
      const response = await fetch('/api/coach/import-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'espn',
          daysBack: espnDaysBack,
          sport: espnSport || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ESPN sync failed');
      }

      setEspnResult({
        success: true,
        summary: data.summary,
      });
    } catch (error) {
      console.error('ESPN sync error:', error);
      setEspnResult({
        success: false,
        error: error instanceof Error ? error.message : 'ESPN sync failed',
      });
    } finally {
      setEspnSyncing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null); // Clear previous results
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sport', sport);

      const response = await fetch('/api/performance/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult(data);

      // Clear file input on success
      if (data.success && data.errors === 0) {
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templates = {
      Basketball: `Name,Date,Opponent,Points,Assists,Rebounds,Turnovers,Minutes,Outcome
Sarah Johnson,2024-12-15,UCLA,22,5,8,2,34,WIN
Sarah Johnson,2024-12-18,USC,18,4,6,3,32,WIN
Sarah Johnson,2024-12-22,Oregon,9,2,4,5,24,LOSS`,
      Soccer: `Name,Date,Opponent,Goals,Assists,Shots,Minutes,Outcome
Sarah Johnson,2024-12-15,UCLA,2,1,6,90,WIN
Sarah Johnson,2024-12-18,USC,0,2,4,85,DRAW`,
      Volleyball: `Name,Date,Opponent,Kills,Blocks,Digs,Aces,Outcome
Sarah Johnson,2024-12-15,UCLA,18,3,12,2,WIN
Sarah Johnson,2024-12-18,USC,15,2,10,1,LOSS`,
      'Track & Field': `Name,Date,Event,Time,Distance,Place,Outcome
Sarah Johnson,2024-12-15,100m Sprint,11.52,,1,WIN
Sarah Johnson,2024-12-18,Long Jump,,6.85,2,LOSS`,
    };

    const template = templates[sport as keyof typeof templates] || templates.Basketball;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sport.toLowerCase()}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Import Game Performance Stats
          </h1>
          <p className="text-muted-foreground">
            Upload CSV files with game statistics to enable performance correlation analysis
          </p>
        </div>

        {/* Instructions Card */}
        <div className="card-elevated p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            How to Import Stats
          </h2>

          <ol className="space-y-3 text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <span>
                <strong className="text-foreground">Download template:</strong> Click "Download Template" below to get a CSV file with the correct format
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <span>
                <strong className="text-foreground">Fill in your data:</strong> Open the CSV in Excel/Google Sheets and add your athletes' game stats
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </span>
              <span>
                <strong className="text-foreground">Upload:</strong> Select your sport, choose the file, and click "Upload Stats"
              </span>
            </li>
          </ol>

          <div className="mt-4 p-4 bg-info/10 border border-info/20 rounded-lg">
            <p className="text-sm text-info">
              <strong>💡 Tip:</strong> Make sure athlete names exactly match the names in your system. The import will
              automatically link game stats with mood logs from the same date to calculate correlations.
            </p>
          </div>
        </div>

        {/* ESPN Auto-Sync Section */}
        <div className="card-elevated p-6 mb-6 border-2 border-primary/20">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Auto-Import from ESPN
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Recommended
            </span>
          </h2>

          <p className="text-sm text-muted-foreground mb-4">
            Automatically fetch game results and player stats from ESPN for your athletes. Works best for major college sports
            (Football, Basketball, Baseball).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Sport Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sport
              </label>
              <select
                value={espnSport}
                onChange={(e) => setEspnSport(e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Sports</option>
                {availableSports.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                {/* Common ESPN sports if not in list */}
                {!availableSports.includes('Basketball') && (
                  <option value="Basketball">Basketball</option>
                )}
                {!availableSports.includes('Football') && (
                  <option value="Football">Football</option>
                )}
                {!availableSports.includes('Baseball') && (
                  <option value="Baseball">Baseball</option>
                )}
              </select>
            </div>

            {/* Days Back */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Import games from last
              </label>
              <select
                value={espnDaysBack}
                onChange={(e) => setEspnDaysBack(Number(e.target.value))}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>Season (90 days)</option>
              </select>
            </div>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleEspnSync}
            disabled={espnSyncing}
            className={`w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
              espnSyncing
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${espnSyncing ? 'animate-spin' : ''}`} />
            {espnSyncing ? 'Syncing from ESPN...' : 'Sync Games from ESPN'}
          </button>

          {/* ESPN Results */}
          {espnResult && (
            <div className={`mt-4 rounded-lg p-4 border ${
              espnResult.success
                ? 'bg-risk-green/5 border-risk-green/20'
                : 'bg-risk-red/5 border-risk-red/20'
            }`}>
              <div className="flex items-start gap-3">
                {espnResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-risk-green flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-risk-red flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  {espnResult.success && espnResult.summary ? (
                    <>
                      <h4 className="font-semibold text-risk-green mb-2">ESPN Sync Complete</h4>
                      <div className="text-sm space-y-1">
                        <p className="text-risk-green">✓ {espnResult.summary.imported} new games imported</p>
                        {espnResult.summary.skipped > 0 && (
                          <p className="text-muted-foreground">↳ {espnResult.summary.skipped} games already existed</p>
                        )}
                        {espnResult.summary.errors > 0 && (
                          <p className="text-warning">⚠ {espnResult.summary.errors} errors</p>
                        )}
                      </div>
                      {espnResult.summary.games.length > 0 && (
                        <div className="mt-3 max-h-32 overflow-y-auto">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Recent imports:</p>
                          {espnResult.summary.games.slice(0, 5).filter(g => !g.alreadyExists).map((game, idx) => (
                            <div key={idx} className="text-xs text-muted-foreground">
                              {game.athleteName} vs {game.opponent} - {game.gameResult}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <h4 className="font-semibold text-risk-red mb-1">ESPN Sync Failed</h4>
                      <p className="text-sm text-risk-red/80">{espnResult.error}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>How it works:</strong> ESPN sync searches for your school's games, fetches box scores, and attempts to match
              player names to your athletes. Pre-game mood logs (within 24h) are automatically linked for correlation analysis.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-4 text-muted-foreground">or import manually via CSV</span>
          </div>
        </div>

        {/* Upload Form */}
        <div className="card-elevated p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Upload CSV File</h2>

          {/* Sport Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Sport
            </label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="Basketball">Basketball</option>
              <option value="Soccer">Soccer</option>
              <option value="Volleyball">Volleyball</option>
              <option value="Track & Field">Track & Field</option>
              <option value="Football">Football</option>
              <option value="Swimming">Swimming</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Download Template Button */}
          <button
            onClick={downloadTemplate}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download {sport} Template
          </button>

          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              CSV File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {file && (
              <p className="mt-2 text-sm text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{file.name}</span>
              </p>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
              !file || uploading
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            <Upload className="w-5 h-5" />
            {uploading ? 'Uploading...' : 'Upload Stats'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div
            className={`rounded-lg p-6 border ${
              result.success
                ? 'bg-risk-green/5 border-risk-green/20'
                : 'bg-risk-red/5 border-risk-red/20'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle2 className="w-6 h-6 text-risk-green flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-risk-red flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-semibold mb-2 ${
                    result.success ? 'text-risk-green' : 'text-risk-red'
                  }`}
                >
                  {result.success ? 'Import Successful!' : 'Import Failed'}
                </h3>
                <p
                  className={`text-sm mb-2 ${
                    result.success ? 'text-risk-green/80' : 'text-risk-red/80'
                  }`}
                >
                  {result.message}
                </p>

                {result.success && result.imported !== undefined && (
                  <div className="mt-3 text-sm text-risk-green">
                    <p>✓ {result.imported} records imported successfully</p>
                    {result.errors && result.errors > 0 && (
                      <p className="text-warning mt-1">
                        ⚠ {result.errors} rows had errors (see details below)
                      </p>
                    )}
                  </div>
                )}

                {result.errorDetails && result.errorDetails.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-sm text-foreground mb-2">Error Details:</p>
                    <div className="max-h-48 overflow-y-auto bg-card rounded-lg p-3 space-y-1 border border-border">
                      {result.errorDetails.map((error, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Row {error.row}:</span> {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CSV Format Reference */}
        <div className="mt-8 card-elevated p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">CSV Format Reference</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-foreground mb-2">Required Columns:</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><code className="bg-muted px-2 py-0.5 rounded text-foreground">Name</code> - Athlete full name (must match system)</li>
                <li><code className="bg-muted px-2 py-0.5 rounded text-foreground">Date</code> - Game date (YYYY-MM-DD format)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-foreground mb-2">Optional Columns:</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><code className="bg-muted px-2 py-0.5 rounded text-foreground">Opponent</code> - Opponent team name</li>
                <li><code className="bg-muted px-2 py-0.5 rounded text-foreground">Outcome</code> - WIN/LOSS/DRAW</li>
                <li>Sport-specific stats (Points, Assists, Goals, etc.)</li>
              </ul>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-mono text-muted-foreground">
                Example: Sarah Johnson,2024-12-15,UCLA,22,5,8,2,34,WIN
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
