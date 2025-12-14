/**
 * Roster - Athlete Management
 * Complete athlete list with advanced filtering and detail views
 */

'use client';

import { useState, useEffect } from 'react';
import CoachPortalLayout from '@/components/coach/layouts/CoachPortalLayout';
import { DashboardSection, DashboardContainer } from '@/components/coach/layouts/DashboardGrid';
import FilterBar from '@/components/coach/roster/FilterBar';
import AthleteGrid from '@/components/coach/roster/AthleteGrid';
import AthleteProfileModal from '@/components/coach/roster/AthleteProfileModal';
import { SkeletonAthleteCard } from '@/components/coach/ui/Skeleton';
import { Athlete, AthleteFilters } from '@/types/coach-portal';

export default function RosterPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AthleteFilters>({});
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAthletes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [athletes, filters, searchQuery]);

  async function loadAthletes() {
    try {
      setLoading(true);
      const response = await fetch('/api/coach/athletes');

      if (!response.ok) {
        throw new Error('Failed to load athletes');
      }

      const data = await response.json();
      setAthletes(data.athletes || []);
    } catch (error) {
      console.error('Error loading athletes:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let result = [...athletes];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (athlete) =>
          athlete.name.toLowerCase().includes(query) ||
          athlete.sport.toLowerCase().includes(query)
      );
    }

    // Sport filter
    if (filters.sport) {
      result = result.filter((athlete) => athlete.sport === filters.sport);
    }

    // Year filter
    if (filters.year) {
      result = result.filter((athlete) => athlete.year === filters.year);
    }

    // Risk level filter
    if (filters.riskLevel) {
      result = result.filter((athlete) => athlete.riskLevel === filters.riskLevel);
    }

    // Readiness zone filter
    if (filters.readinessZone) {
      result = result.filter((athlete) => {
        // This would use actual readiness data
        return true; // Placeholder
      });
    }

    // Archetype filter
    if (filters.archetype) {
      result = result.filter((athlete) => athlete.archetype === filters.archetype);
    }

    // Consent filter
    if (filters.consentOnly !== undefined) {
      result = result.filter((athlete) => athlete.consentCoachView === filters.consentOnly);
    }

    setFilteredAthletes(result);
  }

  return (
    <CoachPortalLayout>
      <DashboardContainer>
        <DashboardSection
          title="Roster"
          description={`${filteredAthletes.length} athletes ${searchQuery || Object.keys(filters).length > 0 ? '(filtered)' : ''}`}
        >
          {/* Search and Filters */}
          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalCount={athletes.length}
            filteredCount={filteredAthletes.length}
          />

          {/* Athlete Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <SkeletonAthleteCard />
              <SkeletonAthleteCard />
              <SkeletonAthleteCard />
              <SkeletonAthleteCard />
              <SkeletonAthleteCard />
              <SkeletonAthleteCard />
            </div>
          ) : (
            <AthleteGrid
              athletes={filteredAthletes}
              onAthleteClick={setSelectedAthlete}
            />
          )}
        </DashboardSection>

        {/* Athlete Profile Modal */}
        {selectedAthlete && (
          <AthleteProfileModal
            athlete={selectedAthlete}
            onClose={() => setSelectedAthlete(null)}
          />
        )}
      </DashboardContainer>
    </CoachPortalLayout>
  );
}
