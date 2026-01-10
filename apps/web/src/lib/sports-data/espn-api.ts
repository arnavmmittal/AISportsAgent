/**
 * ESPN Unofficial API Client
 *
 * Uses ESPN's public JSON endpoints to fetch:
 * - Game schedules and scores
 * - Team information
 * - Player statistics
 *
 * Note: These are unofficial endpoints and may change.
 * Implements caching and error handling for resilience.
 */

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';
const ESPN_CORE_URL = 'https://sports.core.api.espn.com/v2/sports';

export type ESPNSport = 'football' | 'basketball' | 'baseball' | 'soccer' | 'volleyball' | 'hockey';
export type ESPNLeague = 'college-football' | 'mens-college-basketball' | 'womens-college-basketball' | 'college-baseball' | 'nfl' | 'nba';

interface ESPNTeam {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo?: string;
  color?: string;
  alternateColor?: string;
  record?: string;
  rank?: number;
}

interface ESPNAthlete {
  id: string;
  fullName: string;
  displayName: string;
  jersey?: string;
  position?: {
    abbreviation: string;
    name: string;
  };
  team?: ESPNTeam;
}

interface ESPNGameEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  status: {
    type: {
      completed: boolean;
      description: string;
      detail: string;
      state: 'pre' | 'in' | 'post';
    };
  };
  competitions: Array<{
    id: string;
    date: string;
    attendance?: number;
    venue?: {
      fullName: string;
      city: string;
      state?: string;
    };
    competitors: Array<{
      id: string;
      team: ESPNTeam;
      score?: string;
      homeAway: 'home' | 'away';
      winner?: boolean;
      statistics?: Array<{
        name: string;
        displayValue: string;
      }>;
    }>;
    notes?: Array<{
      type: string;
      headline: string;
    }>;
  }>;
}

interface ESPNScoreboard {
  events: ESPNGameEvent[];
  leagues: Array<{
    id: string;
    name: string;
    abbreviation: string;
  }>;
}

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  cache.set(url, { data, expiry: Date.now() + CACHE_TTL });

  return data as T;
}

/**
 * Get scoreboard data for a specific sport and league
 */
export async function getScoreboard(
  sport: ESPNSport,
  league: ESPNLeague,
  options?: {
    date?: string; // YYYYMMDD format
    dates?: string; // Date range: YYYYMMDD-YYYYMMDD
    groups?: string; // Conference/division group (80 = FBS)
    limit?: number;
  }
): Promise<ESPNScoreboard> {
  const url = new URL(`${ESPN_BASE_URL}/${sport}/${league}/scoreboard`);

  if (options?.date) {
    url.searchParams.set('dates', options.date);
  }
  if (options?.dates) {
    url.searchParams.set('dates', options.dates);
  }
  if (options?.groups) {
    url.searchParams.set('groups', options.groups);
  }
  if (options?.limit) {
    url.searchParams.set('limit', String(options.limit));
  }

  return fetchWithCache<ESPNScoreboard>(url.toString());
}

/**
 * Get team information
 */
export async function getTeam(
  sport: ESPNSport,
  league: ESPNLeague,
  teamId: string
): Promise<ESPNTeam & { athletes?: ESPNAthlete[] }> {
  const url = `${ESPN_BASE_URL}/${sport}/${league}/teams/${teamId}`;
  const data = await fetchWithCache<{ team: ESPNTeam & { athletes?: ESPNAthlete[] } }>(url);
  return data.team;
}

/**
 * Search for a team by name
 */
export async function searchTeams(
  sport: ESPNSport,
  league: ESPNLeague,
  query: string
): Promise<ESPNTeam[]> {
  // ESPN doesn't have a direct search, so we fetch all teams and filter
  const url = `${ESPN_BASE_URL}/${sport}/${league}/teams?limit=500`;

  try {
    const data = await fetchWithCache<{ sports: Array<{ leagues: Array<{ teams: Array<{ team: ESPNTeam }> }> }> }>(url);

    const allTeams = data.sports?.[0]?.leagues?.[0]?.teams?.map((t) => t.team) || [];

    const queryLower = query.toLowerCase();
    return allTeams.filter(
      (team) =>
        team.displayName.toLowerCase().includes(queryLower) ||
        team.abbreviation.toLowerCase().includes(queryLower) ||
        team.shortDisplayName?.toLowerCase().includes(queryLower)
    );
  } catch (error) {
    console.error('Error searching teams:', error);
    return [];
  }
}

/**
 * Get games for a specific team
 */
export async function getTeamSchedule(
  sport: ESPNSport,
  league: ESPNLeague,
  teamId: string,
  options?: {
    season?: number; // Year
    seasonType?: 1 | 2 | 3; // 1=preseason, 2=regular, 3=postseason
  }
): Promise<ESPNGameEvent[]> {
  const season = options?.season || new Date().getFullYear();
  const url = `${ESPN_BASE_URL}/${sport}/${league}/teams/${teamId}/schedule?season=${season}`;

  try {
    const data = await fetchWithCache<{ events: ESPNGameEvent[] }>(url);
    return data.events || [];
  } catch (error) {
    console.error('Error fetching team schedule:', error);
    return [];
  }
}

/**
 * Get detailed game statistics
 */
export async function getGameDetails(
  sport: ESPNSport,
  league: ESPNLeague,
  eventId: string
): Promise<ESPNGameEvent | null> {
  const url = `${ESPN_BASE_URL}/${sport}/${league}/summary?event=${eventId}`;

  try {
    const data = await fetchWithCache<{ header: { competitions: ESPNGameEvent['competitions'] } }>(url);

    // Reconstruct event from summary data
    return {
      id: eventId,
      date: data.header.competitions[0]?.date || '',
      name: '',
      shortName: '',
      status: {
        type: {
          completed: true,
          description: 'Final',
          detail: 'Final',
          state: 'post',
        },
      },
      competitions: data.header.competitions,
    };
  } catch (error) {
    console.error('Error fetching game details:', error);
    return null;
  }
}

/**
 * Get athlete statistics for a specific game
 */
export async function getGameBoxScore(
  sport: ESPNSport,
  league: ESPNLeague,
  eventId: string
): Promise<{
  homeTeam: { team: ESPNTeam; players: Array<{ athlete: ESPNAthlete; stats: Record<string, string> }> };
  awayTeam: { team: ESPNTeam; players: Array<{ athlete: ESPNAthlete; stats: Record<string, string> }> };
} | null> {
  const url = `${ESPN_BASE_URL}/${sport}/${league}/summary?event=${eventId}`;

  try {
    const data = await fetchWithCache<{
      boxscore?: {
        players?: Array<{
          team: ESPNTeam;
          statistics: Array<{
            type: string;
            athletes: Array<{
              athlete: ESPNAthlete;
              stats: string[];
            }>;
            labels: string[];
          }>;
        }>;
      };
    }>(url);

    if (!data.boxscore?.players || data.boxscore.players.length < 2) {
      return null;
    }

    const processTeam = (teamData: typeof data.boxscore.players[0]) => {
      const allPlayers: Array<{ athlete: ESPNAthlete; stats: Record<string, string> }> = [];

      for (const statGroup of teamData.statistics || []) {
        for (const athlete of statGroup.athletes || []) {
          const statsMap: Record<string, string> = {};
          statGroup.labels.forEach((label, i) => {
            statsMap[label] = athlete.stats[i] || '0';
          });

          const existing = allPlayers.find((p) => p.athlete.id === athlete.athlete.id);
          if (existing) {
            Object.assign(existing.stats, statsMap);
          } else {
            allPlayers.push({
              athlete: athlete.athlete,
              stats: statsMap,
            });
          }
        }
      }

      return {
        team: teamData.team,
        players: allPlayers,
      };
    };

    // First team is usually away, second is home
    const awayTeam = processTeam(data.boxscore.players[0]);
    const homeTeam = processTeam(data.boxscore.players[1]);

    return { homeTeam, awayTeam };
  } catch (error) {
    console.error('Error fetching box score:', error);
    return null;
  }
}

/**
 * Map sport name to ESPN sport/league
 */
export function mapSportToESPN(sport: string): { sport: ESPNSport; league: ESPNLeague } | null {
  const sportLower = sport.toLowerCase();

  const mappings: Record<string, { sport: ESPNSport; league: ESPNLeague }> = {
    'football': { sport: 'football', league: 'college-football' },
    'college football': { sport: 'football', league: 'college-football' },
    'basketball': { sport: 'basketball', league: 'mens-college-basketball' },
    'mens basketball': { sport: 'basketball', league: 'mens-college-basketball' },
    "men's basketball": { sport: 'basketball', league: 'mens-college-basketball' },
    'womens basketball': { sport: 'basketball', league: 'womens-college-basketball' },
    "women's basketball": { sport: 'basketball', league: 'womens-college-basketball' },
    'baseball': { sport: 'baseball', league: 'college-baseball' },
    'college baseball': { sport: 'baseball', league: 'college-baseball' },
    'soccer': { sport: 'soccer', league: 'college-football' as ESPNLeague }, // ESPN doesn't have good college soccer
    'volleyball': { sport: 'volleyball', league: 'college-football' as ESPNLeague }, // Placeholder
  };

  return mappings[sportLower] || null;
}

/**
 * Get recent games for a school by name
 */
export async function getSchoolRecentGames(
  schoolName: string,
  sport: string,
  daysBack: number = 30
): Promise<ESPNGameEvent[]> {
  const espnMapping = mapSportToESPN(sport);
  if (!espnMapping) {
    console.warn(`No ESPN mapping for sport: ${sport}`);
    return [];
  }

  // Search for the team
  const teams = await searchTeams(espnMapping.sport, espnMapping.league, schoolName);

  if (teams.length === 0) {
    console.warn(`No team found for: ${schoolName}`);
    return [];
  }

  // Use the first matching team
  const team = teams[0];

  // Get team schedule
  const schedule = await getTeamSchedule(espnMapping.sport, espnMapping.league, team.id);

  // Filter to completed games in the date range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  return schedule.filter((event) => {
    const eventDate = new Date(event.date);
    return event.status.type.completed && eventDate >= cutoffDate;
  });
}

export type {
  ESPNTeam,
  ESPNAthlete,
  ESPNGameEvent,
  ESPNScoreboard,
};
