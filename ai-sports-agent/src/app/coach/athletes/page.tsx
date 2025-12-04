'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

interface Athlete {
  id: string;
  name: string;
  email: string;
  sport: string;
  year: string;
  teamPosition?: string;
  avgMood?: number;
  avgStress?: number;
  riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export default function CoachAthletesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'mood' | 'stress'>('name');

  useEffect(() => {
    const fetchAthletes = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getAthletes(session.user.id);
        setAthletes(data);
        setFilteredAthletes(data);
      } catch (err) {
        console.error('Error fetching athletes:', err);
        setError('Failed to load athletes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAthletes();
  }, [session]);

  useEffect(() => {
    let filtered = [...athletes];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((athlete) =>
        athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.sport.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply risk filter
    if (riskFilter !== 'ALL') {
      filtered = filtered.filter((athlete) => athlete.riskLevel === riskFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'mood') {
        return (a.avgMood || 0) - (b.avgMood || 0);
      } else if (sortBy === 'stress') {
        return (b.avgStress || 0) - (a.avgStress || 0);
      }
      return 0;
    });

    setFilteredAthletes(filtered);
  }, [athletes, searchTerm, riskFilter, sortBy]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading athletes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Athletes</h1>
          <p className="text-gray-600 mt-1">
            View and manage individual athlete profiles
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Athletes
              </label>
              <input
                type="text"
                placeholder="Search by name, email, or sport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Level
              </label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Athletes</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Name (A-Z)</option>
                <option value="mood">Mood (Low to High)</option>
                <option value="stress">Stress (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Athletes Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredAthletes.length} of {athletes.length} athletes
        </div>

        {/* Athletes Grid */}
        {filteredAthletes.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600">No athletes found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAthletes.map((athlete) => (
              <AthleteCard
                key={athlete.id}
                athlete={athlete}
                onClick={() => router.push(`/coach/athletes/${athlete.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function AthleteCard({
  athlete,
  onClick
}: {
  athlete: Athlete;
  onClick: () => void;
}) {
  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 border-green-300 text-green-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getMoodColor = (mood?: number) => {
    if (!mood) return 'text-gray-500';
    if (mood >= 7) return 'text-green-600';
    if (mood >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStressColor = (stress?: number) => {
    if (!stress) return 'text-gray-500';
    if (stress >= 7) return 'text-red-600';
    if (stress >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{athlete.name}</h3>
          <p className="text-sm text-gray-500">{athlete.email}</p>
        </div>
        {athlete.riskLevel && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${getRiskColor(
              athlete.riskLevel
            )}`}
          >
            {athlete.riskLevel}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Sport:</span>
          <span className="font-medium text-gray-900">{athlete.sport}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Year:</span>
          <span className="font-medium text-gray-900">{athlete.year}</span>
        </div>
        {athlete.teamPosition && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Position:</span>
            <span className="font-medium text-gray-900">{athlete.teamPosition}</span>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Avg Mood:</span>
          <span className={`font-semibold ${getMoodColor(athlete.avgMood)}`}>
            {athlete.avgMood ? `${athlete.avgMood.toFixed(1)}/10` : 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Avg Stress:</span>
          <span className={`font-semibold ${getStressColor(athlete.avgStress)}`}>
            {athlete.avgStress ? `${athlete.avgStress.toFixed(1)}/10` : 'N/A'}
          </span>
        </div>
      </div>
    </button>
  );
}
