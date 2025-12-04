/**
 * API Client for communicating with Python FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ChatMessage {
  session_id: string;
  message: string;
  athlete_id: string;
  stream?: boolean;
}

export interface ChatResponse {
  session_id: string;
  message: string;
  timestamp: string;
  crisis_check?: {
    athlete_id: string;
    session_id: string;
    timestamp: string;
    final_risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    keyword_scan?: any;
    ai_analysis?: any;
  };
}

export interface TeamAnalytics {
  period_days: number;
  team_size: number;
  total_mood_logs: number;
  averages: {
    mood: number;
    confidence: number;
    stress: number;
    energy?: number;
    sleep?: number;
  };
  trends: {
    mood_trend?: 'improving' | 'declining';
    mood_change?: number;
    stress_trend?: 'decreasing' | 'increasing';
    stress_change?: number;
  };
  at_risk_athletes: Array<{
    athlete_id: string;
    name: string;
    avg_mood: number;
    avg_stress: number;
    logs_count: number;
  }>;
  engagement: {
    athletes_using_platform: number;
    engagement_rate: number;
    total_chat_sessions: number;
  };
  sport: string;
}

export interface AthleteSummary {
  athlete: {
    id: string;
    name: string;
    sport: string;
    year: string;
    position?: string;
  };
  period_days: number;
  mood_logs_count: number;
  recent_averages?: {
    mood: number;
    confidence: number;
    stress: number;
  };
  trend?: {
    direction: 'improving' | 'declining';
    mood_change: number;
  };
  engagement: {
    chat_sessions: number;
    last_session?: string;
  };
  goals: {
    active_count: number;
    goals: Array<{
      id: string;
      title: string;
      category: string;
      status: string;
    }>;
  };
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  action: string;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Send a chat message to the athlete agent
   */
  async sendChatMessage(data: ChatMessage): Promise<ChatResponse> {
    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Stream a chat message response
   */
  async streamChatMessage(
    data: ChatMessage,
    onChunk: (chunk: string) => void,
    onCrisisCheck?: (crisisCheck: any) => void
  ): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'crisis_check' && onCrisisCheck) {
              onCrisisCheck(parsed.data);
            } else if (parsed.type === 'content') {
              onChunk(parsed.data);
            }
          } catch (e) {
            // Ignore parse errors for non-JSON lines
          }
        }
      }
    }
  }

  /**
   * Get team analytics for a coach
   */
  async getTeamAnalytics(coachId: string, days: number = 30): Promise<TeamAnalytics> {
    const response = await fetch(
      `${this.baseURL}/api/coach/analytics?coach_id=${coachId}&days=${days}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get individual athlete summary
   */
  async getAthleteSummary(
    coachId: string,
    athleteId: string,
    days: number = 30
  ): Promise<AthleteSummary> {
    const response = await fetch(
      `${this.baseURL}/api/coach/athlete/${athleteId}?coach_id=${coachId}&days=${days}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get recommendations for a coach
   */
  async getRecommendations(coachId: string): Promise<Recommendation[]> {
    const response = await fetch(
      `${this.baseURL}/api/coach/recommendations?coach_id=${coachId}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get list of athletes for a coach
   */
  async getAthletes(coachId: string): Promise<Array<{
    id: string;
    name: string;
    email: string;
    sport: string;
    year: string;
    teamPosition?: string;
    avgMood?: number;
    avgStress?: number;
    riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  }>> {
    const response = await fetch(
      `${this.baseURL}/api/coach/athletes?coach_id=${coachId}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get mood logs for an athlete
   */
  async getMoodLogs(athleteId: string, days: number = 30): Promise<Array<{
    id: string;
    athleteId: string;
    mood: number;
    confidence: number;
    stress: number;
    energy?: number;
    sleep?: number;
    notes?: string;
    tags: string[];
    createdAt: string;
  }>> {
    const response = await fetch(
      `${this.baseURL}/api/mood-logs?athleteId=${athleteId}&days=${days}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get goals for an athlete
   */
  async getGoals(athleteId: string, status?: string): Promise<Array<{
    id: string;
    athleteId: string;
    title: string;
    description?: string;
    category: string;
    status: string;
    targetDate?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    const params = new URLSearchParams({ athleteId });
    if (status) params.append('status', status);

    const response = await fetch(`${this.baseURL}/api/goals?${params}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get chat sessions for an athlete
   */
  async getChatSessions(athleteId: string, limit: number = 10): Promise<Array<{
    id: string;
    athleteId: string;
    summary?: string;
    topic?: string;
    sentiment?: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    const response = await fetch(
      `${this.baseURL}/api/chat/sessions?athleteId=${athleteId}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get conversation insights for coach dashboard
   */
  async getConversationInsights(coachId: string, days: number = 30): Promise<Array<{
    id: string;
    athleteId: string;
    sessionId: string;
    themes: string[];
    sentiment: number;
    emotions?: Record<string, number>;
    discoveryPhase?: string;
    interventionUsed?: string;
    keyTopics: string[];
    actionItems: string[];
    extractedAt: string;
  }>> {
    const response = await fetch(
      `${this.baseURL}/api/coach/insights?coach_id=${coachId}&days=${days}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check backend health
   */
  async healthCheck(): Promise<{ status: string; version: string; environment: string }> {
    const response = await fetch(`${this.baseURL}/health`);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new APIClient();
