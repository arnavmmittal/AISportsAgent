/**
 * FilterBar Component
 * Advanced filtering for athlete roster
 */

'use client';

import { AthleteFilters, RiskLevel, AthleteYear, AthleteArchetype } from '@/types/coach-portal';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  filters: AthleteFilters;
  onFiltersChange: (filters: AthleteFilters) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
  filteredCount: number;
}

export default function FilterBar({
  filters,
  onFiltersChange,
  searchQuery,
  onSearchChange,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  const updateFilter = (key: keyof AthleteFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
    onSearchChange('');
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.length > 0;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search athletes by name or sport..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <span>Clear Filters</span>
            <span>✕</span>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-3">
        {/* Sport Filter */}
        <select
          value={filters.sport || ''}
          onChange={(e) => updateFilter('sport', e.target.value || undefined)}
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sports</option>
          <option value="Football">Football</option>
          <option value="Basketball">Basketball</option>
          <option value="Soccer">Soccer</option>
          <option value="Baseball">Baseball</option>
          <option value="Softball">Softball</option>
          <option value="Track & Field">Track & Field</option>
          <option value="Swimming">Swimming</option>
          <option value="Volleyball">Volleyball</option>
        </select>

        {/* Year Filter */}
        <select
          value={filters.year || ''}
          onChange={(e) => updateFilter('year', e.target.value || undefined)}
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Years</option>
          <option value="FRESHMAN">Freshman</option>
          <option value="SOPHOMORE">Sophomore</option>
          <option value="JUNIOR">Junior</option>
          <option value="SENIOR">Senior</option>
          <option value="GRADUATE">Graduate</option>
        </select>

        {/* Risk Level Filter */}
        <select
          value={filters.riskLevel || ''}
          onChange={(e) => updateFilter('riskLevel', e.target.value || undefined)}
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Risk Levels</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MODERATE">Moderate</option>
          <option value="LOW">Low</option>
        </select>

        {/* Readiness Zone Filter */}
        <select
          value={filters.readinessZone || ''}
          onChange={(e) => updateFilter('readinessZone', e.target.value || undefined)}
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Readiness</option>
          <option value="OPTIMAL">Optimal (90+)</option>
          <option value="GOOD">Good (75-89)</option>
          <option value="MODERATE">Moderate (60-74)</option>
          <option value="LOW">Low (45-59)</option>
          <option value="POOR">Poor (&lt;45)</option>
        </select>

        {/* Archetype Filter */}
        <select
          value={filters.archetype || ''}
          onChange={(e) => updateFilter('archetype', e.target.value || undefined)}
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Archetypes</option>
          <option value="OVERTHINKER">🤔 Overthinker</option>
          <option value="BURNOUT_RISK">🔥 Burnout Risk</option>
          <option value="MOMENTUM_BUILDER">📈 Momentum Builder</option>
          <option value="INCONSISTENT_PERFORMER">📊 Inconsistent</option>
          <option value="PRESSURE_AVOIDER">😰 Pressure Avoider</option>
          <option value="RESILIENT_WARRIOR">💪 Resilient Warrior</option>
          <option value="LOST_ATHLETE">🧭 Lost Athlete</option>
          <option value="PERFECTIONIST">🎯 Perfectionist</option>
        </select>

        {/* Consent Filter */}
        <select
          value={filters.consentGranted === undefined ? '' : filters.consentGranted.toString()}
          onChange={(e) => updateFilter('consentGranted', e.target.value === '' ? undefined : e.target.value === 'true')}
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Athletes</option>
          <option value="true">With Consent Only</option>
          <option value="false">No Consent</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-400">
          Showing <span className="text-white font-semibold">{filteredCount}</span> of{' '}
          <span className="text-white font-semibold">{totalCount}</span> athletes
        </p>
      </div>
    </div>
  );
}
