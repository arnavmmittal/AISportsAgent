/**
 * Game Data Importer Service
 *
 * Handles importing game/performance data from multiple sources:
 * - ESPN API (automatic fetch for college sports)
 * - Manual entry
 * - CSV upload
 *
 * Correlates imported data with athlete mental state data
 */

import { prisma } from '@/lib/prisma';
import {
  getSchoolRecentGames,
  getGameBoxScore,
  mapSportToESPN,
  type ESPNGameEvent,
  type ESPNAthlete,
} from './espn-api';
import type { OutcomeType, GameResultType, HomeAway, StakesLevel } from '@prisma/client';

interface ImportedGameResult {
  athleteId: string;
  athleteName: string;
  date: Date;
  opponent: string;
  homeAway: HomeAway;
  gameResult: GameResultType;
  sportMetrics: Record<string, any>;
  overallRating?: number;
  alreadyExists: boolean;
}

interface ImportSummary {
  imported: number;
  skipped: number;
  errors: number;
  games: ImportedGameResult[];
}

/**
 * Import games from ESPN for all athletes in a school
 */
export async function importGamesFromESPN(
  schoolId: string,
  options?: {
    daysBack?: number;
    sport?: string;
    athleteIds?: string[]; // Optional filter to specific athletes
  }
): Promise<ImportSummary> {
  const daysBack = options?.daysBack || 30;

  // Get school info
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    throw new Error('School not found');
  }

  // Get athletes to import for
  const athleteQuery: any = {
    User: { schoolId },
  };

  if (options?.athleteIds?.length) {
    athleteQuery.userId = { in: options.athleteIds };
  }

  if (options?.sport) {
    athleteQuery.sport = options.sport;
  }

  const athletes = await prisma.athlete.findMany({
    where: athleteQuery,
    include: {
      User: { select: { name: true, email: true } },
    },
  });

  if (athletes.length === 0) {
    return { imported: 0, skipped: 0, errors: 0, games: [] };
  }

  // Group athletes by sport
  const athletesBySport = new Map<string, typeof athletes>();
  for (const athlete of athletes) {
    const sportAthletes = athletesBySport.get(athlete.sport) || [];
    sportAthletes.push(athlete);
    athletesBySport.set(athlete.sport, sportAthletes);
  }

  const summary: ImportSummary = {
    imported: 0,
    skipped: 0,
    errors: 0,
    games: [],
  };

  // Process each sport
  for (const [sport, sportAthletes] of athletesBySport) {
    try {
      // Fetch games from ESPN
      const games = await getSchoolRecentGames(school.name, sport, daysBack);

      if (games.length === 0) {
        console.log(`No ESPN games found for ${school.name} ${sport}`);
        continue;
      }

      // Process each game
      for (const game of games) {
        const espnMapping = mapSportToESPN(sport);
        if (!espnMapping) continue;

        // Get box score for player-level stats
        const boxScore = await getGameBoxScore(espnMapping.sport, espnMapping.league, game.id);

        // Determine which team is ours
        const competition = game.competitions[0];
        const ourTeam = competition.competitors.find((c) =>
          c.team.displayName.toLowerCase().includes(school.name.toLowerCase()) ||
          school.name.toLowerCase().includes(c.team.displayName.toLowerCase())
        );

        if (!ourTeam) {
          console.log(`Could not match team for ${school.name} in game ${game.id}`);
          continue;
        }

        const opponent = competition.competitors.find((c) => c.id !== ourTeam.id);
        const isHome = ourTeam.homeAway === 'home';
        const won = ourTeam.winner === true;

        // For each athlete, try to match to box score
        for (const athlete of sportAthletes) {
          try {
            const result = await importAthleteGameResult(
              athlete,
              game,
              boxScore,
              {
                opponent: opponent?.team.displayName || 'Unknown',
                isHome,
                won,
              }
            );

            if (result) {
              summary.games.push(result);
              if (result.alreadyExists) {
                summary.skipped++;
              } else {
                summary.imported++;
              }
            }
          } catch (error) {
            console.error(`Error importing game for athlete ${athlete.userId}:`, error);
            summary.errors++;
          }
        }
      }
    } catch (error) {
      console.error(`Error processing sport ${sport}:`, error);
      summary.errors++;
    }
  }

  return summary;
}

/**
 * Import a single game result for an athlete
 */
async function importAthleteGameResult(
  athlete: {
    userId: string;
    sport: string;
    User: { name: string | null; email: string };
  },
  game: ESPNGameEvent,
  boxScore: Awaited<ReturnType<typeof getGameBoxScore>> | null,
  context: {
    opponent: string;
    isHome: boolean;
    won: boolean;
  }
): Promise<ImportedGameResult | null> {
  const gameDate = new Date(game.date);

  // Check if we already have this game
  const existingOutcome = await prisma.performanceOutcome.findFirst({
    where: {
      athleteId: athlete.userId,
      date: {
        gte: new Date(gameDate.getTime() - 12 * 60 * 60 * 1000), // Within 12 hours
        lte: new Date(gameDate.getTime() + 12 * 60 * 60 * 1000),
      },
      opponent: context.opponent,
    },
  });

  if (existingOutcome) {
    return {
      athleteId: athlete.userId,
      athleteName: athlete.User.name || athlete.User.email,
      date: gameDate,
      opponent: context.opponent,
      homeAway: context.isHome ? 'HOME' : 'AWAY',
      gameResult: context.won ? 'WIN' : 'LOSS',
      sportMetrics: existingOutcome.sportMetrics as Record<string, any> || {},
      alreadyExists: true,
    };
  }

  // Try to find athlete in box score
  let playerStats: Record<string, string> = {};

  if (boxScore) {
    const teamData = context.isHome ? boxScore.homeTeam : boxScore.awayTeam;
    const athleteName = (athlete.User.name || '').toLowerCase();

    // Try to match by name
    const matchedPlayer = teamData?.players.find((p) => {
      const espnName = p.athlete.displayName.toLowerCase();
      return (
        espnName === athleteName ||
        espnName.includes(athleteName) ||
        athleteName.includes(espnName.split(' ').pop() || '')
      );
    });

    if (matchedPlayer) {
      playerStats = matchedPlayer.stats;
    }
  }

  // Get athlete's mental state around game time
  const preGameMoodLog = await prisma.moodLog.findFirst({
    where: {
      athleteId: athlete.userId,
      createdAt: {
        gte: new Date(gameDate.getTime() - 24 * 60 * 60 * 1000), // 24 hours before
        lte: gameDate,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get wearable data if available
  const wearableData = await prisma.wearableDataPoint.findFirst({
    where: {
      athleteId: athlete.userId,
      recordedAt: {
        gte: new Date(gameDate.getTime() - 24 * 60 * 60 * 1000),
        lte: gameDate,
      },
    },
    orderBy: { recordedAt: 'desc' },
  });

  // Calculate overall rating based on stats (sport-specific)
  const overallRating = calculateOverallRating(athlete.sport, playerStats);

  // Create performance outcome
  await prisma.performanceOutcome.create({
    data: {
      athleteId: athlete.userId,
      date: gameDate,
      outcomeType: 'GAME',
      opponent: context.opponent,
      homeAway: context.isHome ? 'HOME' : 'AWAY',
      gameResult: context.won ? 'WIN' : 'LOSS',
      stakes: determineStakes(game),
      sportMetrics: playerStats,
      overallRating,

      // Pre-event mental state (if available)
      preEventMood: preGameMoodLog?.mood,
      preEventConfidence: preGameMoodLog?.confidence,
      preEventStress: preGameMoodLog?.stress,
      preEventSleep: preGameMoodLog?.sleep,

      // Wearable data (if available)
      preEventHRV: wearableData?.hrv,
      preEventRecovery: wearableData?.recoveryScore,
    },
  });

  return {
    athleteId: athlete.userId,
    athleteName: athlete.User.name || athlete.User.email,
    date: gameDate,
    opponent: context.opponent,
    homeAway: context.isHome ? 'HOME' : 'AWAY',
    gameResult: context.won ? 'WIN' : 'LOSS',
    sportMetrics: playerStats,
    overallRating,
    alreadyExists: false,
  };
}

/**
 * Calculate overall rating from sport-specific stats
 */
function calculateOverallRating(sport: string, stats: Record<string, string>): number | undefined {
  const sportLower = sport.toLowerCase();

  if (!stats || Object.keys(stats).length === 0) {
    return undefined;
  }

  try {
    // Basketball
    if (sportLower.includes('basketball')) {
      const pts = parseFloat(stats['PTS'] || stats['Points'] || '0');
      const reb = parseFloat(stats['REB'] || stats['Rebounds'] || '0');
      const ast = parseFloat(stats['AST'] || stats['Assists'] || '0');
      const stl = parseFloat(stats['STL'] || stats['Steals'] || '0');
      const blk = parseFloat(stats['BLK'] || stats['Blocks'] || '0');
      const to = parseFloat(stats['TO'] || stats['Turnovers'] || '0');

      // Simple game score formula (simplified NBA efficiency)
      const gameScore = pts + 0.4 * reb + 0.7 * ast + stl + 0.7 * blk - 0.7 * to;

      // Normalize to 1-10 scale (assuming avg game score around 10, max around 40)
      return Math.min(10, Math.max(1, Math.round(gameScore / 4)));
    }

    // Football
    if (sportLower.includes('football')) {
      const passYds = parseFloat(stats['YDS'] || stats['Passing Yards'] || '0');
      const rushYds = parseFloat(stats['RUSH'] || stats['Rushing Yards'] || '0');
      const recYds = parseFloat(stats['REC YDS'] || stats['Receiving Yards'] || '0');
      const td = parseFloat(stats['TD'] || stats['Touchdowns'] || '0');

      // Combined yardage + TD bonus
      const totalYds = passYds + rushYds + recYds;
      const score = totalYds / 50 + td * 2;

      return Math.min(10, Math.max(1, Math.round(score)));
    }

    // Soccer
    if (sportLower.includes('soccer')) {
      const goals = parseFloat(stats['G'] || stats['Goals'] || '0');
      const assists = parseFloat(stats['A'] || stats['Assists'] || '0');
      const shots = parseFloat(stats['SH'] || stats['Shots'] || '0');

      const score = goals * 3 + assists * 2 + shots * 0.5;
      return Math.min(10, Math.max(1, Math.round(score + 5))); // Base of 5
    }

    // Volleyball
    if (sportLower.includes('volleyball')) {
      const kills = parseFloat(stats['K'] || stats['Kills'] || '0');
      const aces = parseFloat(stats['SA'] || stats['Aces'] || '0');
      const blocks = parseFloat(stats['BS'] || stats['Blocks'] || '0');
      const digs = parseFloat(stats['DIG'] || stats['Digs'] || '0');

      const score = kills * 0.5 + aces * 2 + blocks * 1.5 + digs * 0.3;
      return Math.min(10, Math.max(1, Math.round(score / 2 + 5)));
    }

    // Baseball/Softball
    if (sportLower.includes('baseball') || sportLower.includes('softball')) {
      const hits = parseFloat(stats['H'] || stats['Hits'] || '0');
      const rbi = parseFloat(stats['RBI'] || '0');
      const runs = parseFloat(stats['R'] || stats['Runs'] || '0');
      const hr = parseFloat(stats['HR'] || stats['Home Runs'] || '0');

      const score = hits + rbi + runs + hr * 2;
      return Math.min(10, Math.max(1, Math.round(score / 2 + 4)));
    }

    return undefined;
  } catch (error) {
    console.error('Error calculating rating:', error);
    return undefined;
  }
}

/**
 * Determine stakes level from game context
 */
function determineStakes(game: ESPNGameEvent): StakesLevel {
  const notes = game.competitions[0]?.notes || [];

  for (const note of notes) {
    const headline = note.headline?.toLowerCase() || '';

    if (
      headline.includes('championship') ||
      headline.includes('final') ||
      headline.includes('playoff')
    ) {
      return 'CRITICAL';
    }

    if (
      headline.includes('tournament') ||
      headline.includes('semifinal') ||
      headline.includes('quarterfinal')
    ) {
      return 'HIGH';
    }

    if (headline.includes('rivalry') || headline.includes('ranked')) {
      return 'HIGH';
    }
  }

  return 'MEDIUM';
}

/**
 * Import performance outcomes from CSV data
 */
export async function importFromCSV(
  coachId: string,
  csvData: Array<{
    athleteEmail: string;
    date: string;
    outcomeType?: string;
    opponent?: string;
    homeAway?: string;
    gameResult?: string;
    overallRating?: number;
    [key: string]: any; // Additional sport-specific metrics
  }>
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    imported: 0,
    skipped: 0,
    errors: 0,
    games: [],
  };

  // Get coach's athletes
  const coachRelations = await prisma.coachAthleteRelation.findMany({
    where: { coachId },
    select: { athleteId: true },
  });

  const athleteIds = new Set(coachRelations.map((r) => r.athleteId));

  // Get all athletes by email
  const athletes = await prisma.user.findMany({
    where: {
      email: { in: csvData.map((row) => row.athleteEmail) },
      role: 'ATHLETE',
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  const athleteMap = new Map(athletes.map((a) => [a.email.toLowerCase(), a]));

  for (const row of csvData) {
    try {
      const athlete = athleteMap.get(row.athleteEmail.toLowerCase());

      if (!athlete) {
        console.warn(`Athlete not found: ${row.athleteEmail}`);
        summary.errors++;
        continue;
      }

      // Verify coach has access to this athlete
      if (!athleteIds.has(athlete.id)) {
        console.warn(`Coach does not have access to athlete: ${row.athleteEmail}`);
        summary.errors++;
        continue;
      }

      // Parse date
      const date = new Date(row.date);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date: ${row.date}`);
        summary.errors++;
        continue;
      }

      // Extract sport metrics (any keys not in standard fields)
      const standardFields = [
        'athleteEmail',
        'date',
        'outcomeType',
        'opponent',
        'homeAway',
        'gameResult',
        'overallRating',
      ];
      const sportMetrics: Record<string, any> = {};

      for (const [key, value] of Object.entries(row)) {
        if (!standardFields.includes(key) && value !== undefined && value !== null) {
          sportMetrics[key] = value;
        }
      }

      // Check for duplicates
      const existing = await prisma.performanceOutcome.findFirst({
        where: {
          athleteId: athlete.id,
          date: {
            gte: new Date(date.getTime() - 12 * 60 * 60 * 1000),
            lte: new Date(date.getTime() + 12 * 60 * 60 * 1000),
          },
          opponent: row.opponent,
        },
      });

      if (existing) {
        summary.skipped++;
        summary.games.push({
          athleteId: athlete.id,
          athleteName: athlete.name || athlete.email,
          date,
          opponent: row.opponent || 'Unknown',
          homeAway: (row.homeAway?.toUpperCase() as HomeAway) || 'HOME',
          gameResult: (row.gameResult?.toUpperCase() as GameResultType) || 'WIN',
          sportMetrics,
          overallRating: row.overallRating,
          alreadyExists: true,
        });
        continue;
      }

      // Create outcome
      await prisma.performanceOutcome.create({
        data: {
          athleteId: athlete.id,
          date,
          outcomeType: (row.outcomeType?.toUpperCase() as OutcomeType) || 'GAME',
          opponent: row.opponent,
          homeAway: (row.homeAway?.toUpperCase() as HomeAway) || undefined,
          gameResult: (row.gameResult?.toUpperCase() as GameResultType) || undefined,
          overallRating: row.overallRating,
          sportMetrics,
          recordedBy: coachId,
        },
      });

      summary.imported++;
      summary.games.push({
        athleteId: athlete.id,
        athleteName: athlete.name || athlete.email,
        date,
        opponent: row.opponent || 'Unknown',
        homeAway: (row.homeAway?.toUpperCase() as HomeAway) || 'HOME',
        gameResult: (row.gameResult?.toUpperCase() as GameResultType) || 'WIN',
        sportMetrics,
        overallRating: row.overallRating,
        alreadyExists: false,
      });
    } catch (error) {
      console.error(`Error processing CSV row:`, error);
      summary.errors++;
    }
  }

  return summary;
}

export type { ImportedGameResult, ImportSummary };
