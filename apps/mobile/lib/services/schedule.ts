/**
 * Schedule & Pre-Game Session API Services
 * Handles game schedule management and pre-game mental preparation
 */

import { apiClient, getStoredToken } from '../auth';
import config from '../../config';

export interface GameSchedule {
  id: string;
  opponent: string;
  gameDate: string;
  location?: string;
  homeAway: 'HOME' | 'AWAY';
  stakes: 'LOW' | 'MEDIUM' | 'HIGH' | 'CHAMPIONSHIP';
  notes?: string;
  PreGameSession?: PreGameSessionData | null;
}

export interface PreGameSessionData {
  id: string;
  moodScore?: number;
  confidenceScore?: number;
  anxietyScore?: number;
  focusScore?: number;
  energyLevel?: number;
  sleepQuality?: number;
  athleteGoal?: string;
  focusCue?: string;
  recommendations?: string[];
  completedAt?: string | null;
}

export interface ScheduleResponse {
  games: GameSchedule[];
  nextGame?: GameSchedule;
}

// Demo data for offline mode
const DEMO_NEXT_GAME: GameSchedule = {
  id: 'demo-game-1',
  opponent: 'State University',
  gameDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  location: 'Home Stadium',
  homeAway: 'HOME',
  stakes: 'HIGH',
  PreGameSession: null,
};

const DEMO_GAMES: GameSchedule[] = [
  DEMO_NEXT_GAME,
  {
    id: 'demo-game-2',
    opponent: 'Tech College',
    gameDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Away Arena',
    homeAway: 'AWAY',
    stakes: 'MEDIUM',
    PreGameSession: null,
  },
  {
    id: 'demo-game-3',
    opponent: 'City University',
    gameDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Home Stadium',
    homeAway: 'HOME',
    stakes: 'CHAMPIONSHIP',
    PreGameSession: null,
  },
];

/**
 * Fetch game schedule
 */
export async function getSchedule(limit?: number): Promise<ScheduleResponse> {
  try {
    const token = await getStoredToken();
    if (!token) {
      console.log('No token, using demo schedule');
      return { games: DEMO_GAMES, nextGame: DEMO_NEXT_GAME };
    }

    const url = `${config.apiUrl}/api/athlete/schedule${limit ? `?limit=${limit}` : ''}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Schedule fetch failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log('Schedule API error, using demo data:', error);
    return { games: DEMO_GAMES, nextGame: DEMO_NEXT_GAME };
  }
}

/**
 * Add a game to schedule
 */
export async function addGame(game: Omit<GameSchedule, 'id' | 'PreGameSession'>): Promise<GameSchedule | null> {
  try {
    const token = await getStoredToken();
    if (!token) {
      console.log('No token, creating demo game');
      return { ...game, id: `demo-${Date.now()}`, PreGameSession: null };
    }

    const response = await fetch(`${config.apiUrl}/api/athlete/schedule`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(game),
    });

    if (!response.ok) {
      throw new Error(`Add game failed: ${response.status}`);
    }

    const data = await response.json();
    return data.game;
  } catch (error) {
    console.error('Add game error:', error);
    return null;
  }
}

/**
 * Delete a game from schedule
 */
export async function deleteGame(gameId: string): Promise<boolean> {
  try {
    const token = await getStoredToken();
    if (!token) return false;

    const response = await fetch(`${config.apiUrl}/api/athlete/schedule?id=${gameId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Delete game error:', error);
    return false;
  }
}

/**
 * Start a pre-game session
 */
export async function startPreGameSession(gameScheduleId?: string): Promise<PreGameSessionData | null> {
  try {
    const token = await getStoredToken();
    if (!token) {
      // Demo mode
      return {
        id: `demo-session-${Date.now()}`,
        completedAt: null,
      };
    }

    const response = await fetch(`${config.apiUrl}/api/athlete/pre-game`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameScheduleId,
        sessionType: 'QUICK_CHECKIN',
      }),
    });

    if (!response.ok) {
      throw new Error(`Start session failed: ${response.status}`);
    }

    const data = await response.json();
    return data.session;
  } catch (error) {
    console.error('Start pre-game session error:', error);
    // Return demo session for offline use
    return {
      id: `demo-session-${Date.now()}`,
      completedAt: null,
    };
  }
}

/**
 * Complete a pre-game session with data
 */
export async function completePreGameSession(
  sessionId: string,
  data: {
    moodScore: number;
    confidenceScore: number;
    anxietyScore: number;
    focusScore: number;
    energyLevel: number;
    sleepQuality: number;
    athleteGoal: string;
    focusCue: string;
  }
): Promise<{ session: PreGameSessionData; recommendations: string[] }> {
  try {
    const token = await getStoredToken();
    if (!token) {
      // Demo recommendations based on scores
      const recommendations = generateDemoRecommendations(data);
      return {
        session: { ...data, id: sessionId, completedAt: new Date().toISOString() },
        recommendations,
      };
    }

    const response = await fetch(`${config.apiUrl}/api/athlete/pre-game`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        ...data,
      }),
    });

    if (!response.ok) {
      throw new Error(`Complete session failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Complete pre-game session error:', error);
    // Return demo recommendations
    const recommendations = generateDemoRecommendations(data);
    return {
      session: { ...data, id: sessionId, completedAt: new Date().toISOString() },
      recommendations,
    };
  }
}

/**
 * Generate recommendations based on mental state scores
 */
function generateDemoRecommendations(data: {
  moodScore: number;
  confidenceScore: number;
  anxietyScore: number;
  energyLevel: number;
  sleepQuality: number;
}): string[] {
  const recommendations: string[] = [];

  if (data.anxietyScore >= 7) {
    recommendations.push('Try 4-7-8 breathing: inhale 4 counts, hold 7, exhale 8');
    recommendations.push('Remember: nerves mean you care. Channel that energy into focus');
  }

  if (data.confidenceScore <= 4) {
    recommendations.push('Visualize your best past performances for 30 seconds');
    recommendations.push('Repeat your power word before the game starts');
  }

  if (data.energyLevel <= 4) {
    recommendations.push('Do some light dynamic stretching to activate your body');
    recommendations.push('Focus on proper breathing to increase oxygen flow');
  }

  if (data.sleepQuality <= 4) {
    recommendations.push('Stay hydrated - dehydration amplifies fatigue');
    recommendations.push('Trust your training - one night won\'t undo your preparation');
  }

  if (data.moodScore >= 7 && data.confidenceScore >= 7) {
    recommendations.push('You\'re in a great mental state - stay present and trust yourself');
  }

  // Always add at least one recommendation
  if (recommendations.length === 0) {
    recommendations.push('Focus on your breathing and stay in the moment');
    recommendations.push('Trust your preparation and enjoy the competition');
  }

  return recommendations.slice(0, 4); // Max 4 recommendations
}
