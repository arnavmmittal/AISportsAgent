'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Upload,
  Download,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Users,
  CheckCircle2,
  XCircle,
  Minus,
  RefreshCw,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';

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
  preEventConfidence: number | null;
  preEventStress: number | null;
  sportMetrics: Record<string, any> | null;
}

interface ImportSummary {
  imported: number;
  skipped: number;
  errors: number;
}

export default function PerformanceOutcomesPage() {
  const router = useRouter();
  const [outcomes, setOutcomes] = useState<PerformanceOutcome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableSports, setAvailableSports] = useState<string[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [stats, setStats] = useState({ total: 0, wins: 0, losses: 0, avgRating: 0 });

  const loadOutcomes = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (outcomeFilter !== 'all') params.set('outcomeType', outcomeFilter);

      const response = await fetch(`/api/performance-outcomes?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load outcomes');

      const data = await response.json();

      // Transform data to include athlete names
      const transformedOutcomes = data.outcomes.map((o: any) => ({
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

      setStats({ total, wins, losses, avgRating });
    } catch (error) {
      console.error('Error loading outcomes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [outcomeFilter]);

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

  useEffect(() => {
    loadOutcomes();
    loadImportInfo();
  }, [loadOutcomes]);

  const handleESPNImport = async () => {
    try {
      setIsImporting(true);
      setImportResult(null);

      const response = await fetch('/api/coach/import-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'espn',
          daysBack: 30,
          sport: selectedSport || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setImportResult(data.summary);
      loadOutcomes();
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({ imported: 0, skipped: 0, errors: 1 });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportResult(null);

      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        throw new Error('CSV must have headers and at least one data row');
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const data = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const row: Record<string, any> = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });

      const response = await fetch('/api/coach/import-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'csv',
          data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setImportResult(result.summary);
      loadOutcomes();
    } catch (error) {
      console.error('CSV import error:', error);
      setImportResult({ imported: 0, skipped: 0, errors: 1 });
    } finally {
      setIsImporting(false);
    }
  };

  const filteredOutcomes = outcomes.filter((outcome) => {
    const matchesSearch =
      outcome.athleteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outcome.opponent?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getResultIcon = (result: string | null) => {
    switch (result) {
      case 'WIN':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'LOSS':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'DRAW':
        return <Minus className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getRatingColor = (rating: number | null) => {
    if (rating === null) return 'text-gray-400';
    if (rating >= 8) return 'text-green-500';
    if (rating >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Performance Outcomes
            </h1>
            <p className="mt-3 text-muted-foreground text-lg">
              Track game and practice results to build prediction models
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold hover:scale-105 transform flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Import Games
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold hover:scale-105 transform flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Log Result
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-10 h-10 opacity-80" />
            </div>
            <p className="text-sm font-bold text-blue-100 uppercase tracking-wider">Total Games</p>
            <p className="text-4xl font-black mt-2">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-10 h-10 opacity-80" />
            </div>
            <p className="text-sm font-bold text-green-100 uppercase tracking-wider">Wins</p>
            <p className="text-4xl font-black mt-2">{stats.wins}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between mb-4">
              <TrendingDown className="w-10 h-10 opacity-80" />
            </div>
            <p className="text-sm font-bold text-red-100 uppercase tracking-wider">Losses</p>
            <p className="text-4xl font-black mt-2">{stats.losses}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-10 h-10 opacity-80" />
            </div>
            <p className="text-sm font-bold text-purple-100 uppercase tracking-wider">Avg Rating</p>
            <p className="text-4xl font-black mt-2">{stats.avgRating.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search by athlete or opponent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-background border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                className="px-4 py-3 bg-background border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="GAME">Games</option>
                <option value="PRACTICE">Practice</option>
                <option value="SCRIMMAGE">Scrimmage</option>
                <option value="TOURNAMENT">Tournament</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Outcomes List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
              <p className="mt-4 text-muted-foreground">Loading outcomes...</p>
            </div>
          ) : filteredOutcomes.length === 0 ? (
            <div className="p-8 text-center">
              <Trophy className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">No outcomes recorded</h3>
              <p className="mt-2 text-muted-foreground">
                Import games from ESPN or log results manually to start tracking performance
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Athlete
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Opponent
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Pre-Game Mood
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredOutcomes.map((outcome) => (
                    <tr
                      key={outcome.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => router.push(`/coach/athletes/${outcome.athleteId}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{new Date(outcome.date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {outcome.athleteName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {outcome.outcomeType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {outcome.homeAway === 'HOME' ? 'vs' : '@'} {outcome.opponent || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          {getResultIcon(outcome.gameResult)}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-center font-bold ${getRatingColor(outcome.overallRating)}`}>
                        {outcome.overallRating?.toFixed(1) || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {outcome.preEventMood ? (
                          <div className="flex items-center justify-center gap-1">
                            <Activity className="w-4 h-4 text-muted-foreground" />
                            <span>{outcome.preEventMood}/10</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <h2 className="text-2xl font-black mb-6">Import Games</h2>

            {/* ESPN Import */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Download className="w-5 h-5 text-green-500" />
                Import from ESPN
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Automatically fetch recent game results from ESPN for your school's teams
              </p>

              {availableSports.length > 0 && (
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="w-full mb-4 px-4 py-3 bg-background border border-gray-200 dark:border-gray-600 rounded-xl"
                >
                  <option value="">All Sports</option>
                  {availableSports.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={handleESPNImport}
                disabled={isImporting}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Import from ESPN
                  </>
                )}
              </button>
            </div>

            {/* CSV Import */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                Upload CSV
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file with columns: athleteEmail, date, outcomeType, opponent, homeAway, gameResult, overallRating
              </p>

              <label className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all font-bold cursor-pointer flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" />
                Choose CSV File
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className="mb-6 p-4 rounded-xl bg-gray-100 dark:bg-gray-700">
                <h4 className="font-bold mb-2">Import Result</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-black text-green-500">{importResult.imported}</p>
                    <p className="text-xs text-muted-foreground">Imported</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-yellow-500">{importResult.skipped}</p>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-red-500">{importResult.errors}</p>
                    <p className="text-xs text-muted-foreground">Errors</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowImportModal(false);
                setImportResult(null);
              }}
              className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-600 text-foreground rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Outcome Modal */}
      {showAddModal && (
        <AddOutcomeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadOutcomes();
          }}
        />
      )}
    </div>
  );
}

// Add Outcome Modal Component
function AddOutcomeModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [athletes, setAthletes] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    outcomeType: 'GAME',
    opponent: '',
    homeAway: 'HOME',
    gameResult: 'WIN',
    overallRating: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load coach's athletes
    fetch('/api/coach/athletes')
      .then((res) => res.json())
      .then((data) => {
        if (data.athletes) {
          setAthletes(
            data.athletes.map((a: any) => ({
              id: a.userId,
              name: a.User?.name || a.User?.email || 'Unknown',
            }))
          );
        }
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete) return;

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/performance-outcomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: selectedAthlete,
          date: new Date(formData.date).toISOString(),
          outcomeType: formData.outcomeType,
          opponent: formData.opponent || undefined,
          homeAway: formData.homeAway,
          gameResult: formData.gameResult,
          overallRating: formData.overallRating ? parseFloat(formData.overallRating) : undefined,
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create outcome');
      }

      onSuccess();
    } catch (error) {
      console.error('Submit error:', error);
      alert(error instanceof Error ? error.message : 'Failed to create outcome');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-black mb-6">Log Performance Result</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">
              Athlete *
            </label>
            <select
              value={selectedAthlete}
              onChange={(e) => setSelectedAthlete(e.target.value)}
              required
              className="w-full px-4 py-3 bg-background border border-gray-200 dark:border-gray-600 rounded-xl"
            >
              <option value="">Select athlete...</option>
              {athletes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full px-4 py-3 bg-background border border-gray-200 dark:border-gray-600 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">
                Type *
              </label>
              <select
                value={formData.outcomeType}
                onChange={(e) => setFormData({ ...formData, outcomeType: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-gray-200 dark:border-gray-600 rounded-xl"
              >
                <option value="GAME">Game</option>
                <option value="PRACTICE">Practice</option>
                <option value="SCRIMMAGE">Scrimmage</option>
                <option value="TOURNAMENT">Tournament</option>
                <option value="COMPETITION">Competition</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">
              Opponent
            </label>
            <input
              type="text"
              value={formData.opponent}
              onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
              placeholder="e.g., Stanford"
              className="w-full px-4 py-3 bg-background border border-gray-200 dark:border-gray-600 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">
                Home/Away
              </label>
              <select
                value={formData.homeAway}
                onChange={(e) => setFormData({ ...formData, homeAway: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-gray-200 dark:border-gray-600 rounded-xl"
              >
                <option value="HOME">Home</option>
                <option value="AWAY">Away</option>
                <option value="NEUTRAL">Neutral</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">
                Result
              </label>
              <select
                value={formData.gameResult}
                onChange={(e) => setFormData({ ...formData, gameResult: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-gray-200 dark:border-gray-600 rounded-xl"
              >
                <option value="WIN">Win</option>
                <option value="LOSS">Loss</option>
                <option value="DRAW">Draw</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">
              Overall Rating (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              step="0.1"
              value={formData.overallRating}
              onChange={(e) => setFormData({ ...formData, overallRating: e.target.value })}
              placeholder="7.5"
              className="w-full px-4 py-3 bg-background border border-gray-200 dark:border-gray-600 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any additional observations..."
              className="w-full px-4 py-3 bg-background border border-gray-200 dark:border-gray-600 rounded-xl resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-600 text-foreground rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedAthlete}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all font-bold disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
