/**
 * Roster - Athlete Management
 * Complete athlete list with advanced filtering and detail views
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, Download, X } from 'lucide-react';
import CoachPortalLayout from '@/components/coach/layouts/CoachPortalLayout';
import { DashboardSection, DashboardContainer } from '@/components/coach/layouts/DashboardGrid';
import FilterBar from '@/components/coach/roster/FilterBar';
import AthleteGrid from '@/components/coach/roster/AthleteGrid';
import AthleteProfileModal from '@/components/coach/roster/AthleteProfileModal';
import BulkRosterPanel from '@/components/coach/roster/BulkRosterPanel';
import { SkeletonAthleteCard } from '@/components/coach/ui/Skeleton';
import { Athlete, AthleteFilters, ReadinessLevel } from '@/types/coach-portal';
import { Button } from '@/components/shared/ui/button';

function getReadinessLevel(mood: number, confidence: number, stress: number): ReadinessLevel {
  const score = Math.round(((mood + confidence + (11 - stress)) / 3) * 10);
  if (score >= 90) return ReadinessLevel.OPTIMAL;
  if (score >= 75) return ReadinessLevel.GOOD;
  if (score >= 60) return ReadinessLevel.MODERATE;
  if (score >= 45) return ReadinessLevel.LOW;
  return ReadinessLevel.POOR;
}

export default function RosterPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AthleteFilters>({});
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | undefined>();

  const loadAthletes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coach/athletes');

      if (!response.ok) {
        throw new Error('Failed to load athletes');
      }

      const json = await response.json();
      // Transform API response to Athlete type
      const athleteData: Athlete[] = (json.data || []).map((item: any) => ({
        id: item.id,
        userId: item.id,
        name: item.name,
        sport: item.sport,
        year: item.year,
        teamPosition: item.position,
        profileImageUrl: null,
        consentCoachView: item.consentGranted,
        riskLevel: item.riskLevel || 'LOW',
        readinessScore: item.lastMoodLog ? Math.round(((item.lastMoodLog.mood + item.lastMoodLog.confidence + (11 - item.lastMoodLog.stress)) / 3) * 10) : undefined,
        readinessLevel: item.lastMoodLog ? getReadinessLevel(item.lastMoodLog.mood, item.lastMoodLog.confidence, item.lastMoodLog.stress) : undefined,
        archetype: undefined, // TODO: Add archetype
      }));
      setAthletes(athleteData);
    } catch (error) {
      console.error('Error loading athletes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch invite code on mount
  useEffect(() => {
    const fetchInviteCode = async () => {
      try {
        const response = await fetch('/api/coach/invite-code');
        if (response.ok) {
          const data = await response.json();
          setInviteCode(data.data?.inviteCode);
        }
      } catch (error) {
        console.error('Error fetching invite code:', error);
      }
    };
    fetchInviteCode();
  }, []);

  useEffect(() => {
    loadAthletes();
  }, [loadAthletes]);

  useEffect(() => {
    applyFilters();
  }, [athletes, filters, searchQuery]);

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
    if (filters.sport && filters.sport.length > 0) {
      result = result.filter((athlete) => filters.sport?.includes(athlete.sport));
    }

    // Year filter
    if (filters.year && filters.year.length > 0) {
      result = result.filter((athlete) => filters.year?.includes(athlete.year));
    }

    // Risk level filter
    if (filters.riskLevel && filters.riskLevel.length > 0) {
      result = result.filter((athlete) => filters.riskLevel?.includes(athlete.riskLevel));
    }

    // Readiness zone filter
    if (filters.readinessZone && filters.readinessZone.length > 0) {
      result = result.filter((athlete) => {
        // This would use actual readiness data
        return true; // Placeholder
      });
    }

    // Archetype filter
    if (filters.archetype && filters.archetype.length > 0) {
      result = result.filter((athlete) => athlete.archetype && filters.archetype?.includes(athlete.archetype));
    }

    // Consent filter
    if (filters.consentGranted !== undefined) {
      result = result.filter((athlete) => athlete.consentCoachView === filters.consentGranted);
    }

    setFilteredAthletes(result);
  }

  const handleImportComplete = (count: number) => {
    loadAthletes(); // Refresh the list
    setShowBulkPanel(false);
  };

  return (
    <CoachPortalLayout>
      <DashboardContainer>
        <DashboardSection
          title="Roster"
          description={`${filteredAthletes.length} athletes ${searchQuery || Object.keys(filters).length > 0 ? '(filtered)' : ''}`}
          action={
            <Button
              onClick={() => setShowBulkPanel(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Bulk Operations
            </Button>
          }
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

        {/* Bulk Roster Operations Modal */}
        {showBulkPanel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Bulk Roster Operations</h2>
                  <p className="text-sm text-muted-foreground">Import, export, and manage athletes in bulk</p>
                </div>
                <button
                  onClick={() => setShowBulkPanel(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <BulkRosterPanel
                  onImportComplete={handleImportComplete}
                  inviteCode={inviteCode}
                  currentRosterSize={athletes.length}
                />
              </div>
            </div>
          </div>
        )}
      </DashboardContainer>
    </CoachPortalLayout>
  );
}
