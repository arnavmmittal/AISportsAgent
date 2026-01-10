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

// Athlete Dashboard Types
export interface MoodLogRequest {
  mood: number; // 1-5
  confidence?: number; // 1-5
  stress?: number; // 1-5
  energy?: number; // 1-5
  sleep?: number; // hours
  notes?: string;
}

export interface MoodLogResponse {
  id: string;
  athlete_id: string;
  mood: number;
  confidence?: number;
  stress?: number;
  energy?: number;
  sleep?: number;
  notes?: string;
  logged_at: string;
  streak: number;
}

export interface MoodTrend {
  days: number;
  mood_values: number[];
  dates: string[];
  average: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: 'performance' | 'mental' | 'academic' | 'personal';
  status: 'active' | 'completed' | 'paused';
  progress: number; // 0-100
  target_date?: string;
  created_at: string;
}

export interface GoalsProgress {
  active_goals: number;
  completed_goals: number;
  overall_progress: number; // 0-100
  goals: Goal[];
}

export interface SessionSummary {
  id: string;
  date: string;
  topic: string;
  duration: string;
  message_count: number;
}

export interface AthleteDashboard {
  athlete_id: string;
  streak: number;
  mood_trend: MoodTrend;
  goals_progress: GoalsProgress;
  recent_sessions: SessionSummary[];
}

export interface StreakData {
  athlete_id: string;
  current_streak: number;
  longest_streak: number;
  last_log_date: string;
}

// ML Prediction Types
export interface RiskPrediction {
  athlete_id: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: Array<{
    feature: string;
    contribution: number;
    direction: string;
  }>;
  recommendations: string[];
  timestamp: string;
}

export interface SlumpDetection {
  athlete_id: string;
  in_slump: boolean;
  patterns: Array<{
    type: string;
    description: string;
    severity: string;
    metrics_affected: string[];
  }>;
  recommendations: string[];
}

export interface CorrelationInsight {
  metric_pair: string;
  correlation: number;
  p_value: number;
  significance: string;
  interpretation: string;
}

export interface Intervention {
  intervention_id: string;
  name: string;
  description: string;
  evidence_level: string;
  priority: number;
  estimated_duration: string;
  protocol?: Record<string, unknown>;
}

// Knowledge Types
export interface KnowledgeResult {
  query: string;
  context: string;
  sources: Array<{
    id: string;
    title: string;
    content: string;
    score: number;
  }>;
}

export interface Framework {
  id: string;
  name: string;
  description: string;
  applications: string[];
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
   * Check backend health
   */
  async healthCheck(): Promise<{ status: string; version: string; environment: string }> {
    const response = await fetch(`${this.baseURL}/health`);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get athlete dashboard data
   */
  async getAthleteDashboard(athleteId: string, days: number = 7): Promise<AthleteDashboard> {
    const response = await fetch(
      `${this.baseURL}/api/athlete/${athleteId}/dashboard?days=${days}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Log mood entry for athlete
   */
  async logMood(athleteId: string, data: MoodLogRequest): Promise<MoodLogResponse> {
    const response = await fetch(
      `${this.baseURL}/api/athlete/${athleteId}/mood`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get mood trend for athlete
   */
  async getMoodTrend(athleteId: string, days: number = 7): Promise<MoodTrend> {
    const response = await fetch(
      `${this.baseURL}/api/athlete/${athleteId}/mood-trend?days=${days}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get goals and progress for athlete
   */
  async getGoals(athleteId: string): Promise<GoalsProgress> {
    const response = await fetch(
      `${this.baseURL}/api/athlete/${athleteId}/goals`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get recent chat sessions for athlete
   */
  async getSessions(athleteId: string, limit: number = 10): Promise<SessionSummary[]> {
    const response = await fetch(
      `${this.baseURL}/api/athlete/${athleteId}/sessions?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get mood logging streak for athlete
   */
  async getStreak(athleteId: string): Promise<StreakData> {
    const response = await fetch(
      `${this.baseURL}/api/athlete/${athleteId}/streak`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // ==========================================
  // ML Predictions
  // ==========================================

  /**
   * Get performance risk prediction
   */
  async getRiskPrediction(
    athleteId: string,
    features?: Record<string, number>
  ): Promise<RiskPrediction> {
    const response = await fetch(`${this.baseURL}/api/predictions/risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athlete_id: athleteId, features }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Detect slump patterns
   */
  async detectSlump(
    athleteId: string,
    metrics: Record<string, number[]>
  ): Promise<SlumpDetection> {
    const response = await fetch(`${this.baseURL}/api/predictions/slump`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athlete_id: athleteId, metrics }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get metric correlations and insights
   */
  async getCorrelations(
    athleteId: string,
    metrics: Record<string, number[]>
  ): Promise<{ correlations: CorrelationInsight[]; insights: string[] }> {
    const response = await fetch(`${this.baseURL}/api/predictions/correlations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athlete_id: athleteId, metrics }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get intervention recommendations
   */
  async getInterventions(
    athleteId: string,
    riskFactors: string[],
    emotionalState?: string
  ): Promise<{ recommendations: Intervention[] }> {
    const response = await fetch(`${this.baseURL}/api/predictions/interventions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        athlete_id: athleteId,
        risk_factors: riskFactors,
        emotional_state: emotionalState,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // ==========================================
  // Knowledge Base
  // ==========================================

  /**
   * Query the sports psychology knowledge base
   */
  async queryKnowledge(
    query: string,
    options?: {
      top_k?: number;
      filter_sport?: string;
      filter_framework?: string;
    }
  ): Promise<KnowledgeResult> {
    const response = await fetch(`${this.baseURL}/api/knowledge/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ...options }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get available sports psychology frameworks
   */
  async getFrameworks(): Promise<{ frameworks: Framework[] }> {
    const response = await fetch(`${this.baseURL}/api/knowledge/frameworks`);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // ==========================================
  // Voice
  // ==========================================

  /**
   * Synthesize text to speech
   */
  async synthesizeSpeech(
    text: string,
    options?: {
      voice_id?: string;
      emotional_context?: 'supportive' | 'calm' | 'encouraging' | 'professional';
    }
  ): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/api/voice/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, ...options }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Transcribe audio to text
   */
  async transcribeAudio(
    audio: Blob,
    detectEmotion: boolean = true
  ): Promise<{ text: string; emotion?: { detected: string; confidence: number } }> {
    const formData = new FormData();
    formData.append('file', audio, 'audio.webm');
    formData.append('detect_emotion', String(detectEmotion));

    const response = await fetch(`${this.baseURL}/api/voice/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get voice service status
   */
  async getVoiceStatus(): Promise<{
    status: string;
    tts_provider: string;
    stt_provider: string;
  }> {
    const response = await fetch(`${this.baseURL}/api/voice/status`);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new APIClient();
