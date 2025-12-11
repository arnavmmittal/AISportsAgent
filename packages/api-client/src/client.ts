import type { User, ChatSession, Message, MoodLog, Goal } from '@sports-agent/types';

export class APIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options?.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error ||response.statusText}`);
    }

    return response.json();
  }

  // ========== Auth ==========

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Use mobile-specific endpoint that returns JWT tokens
    return this.request('/api/auth/mobile/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(data: {
    email: string;
    password: string;
    name: string;
    role: 'ATHLETE' | 'COACH';
    sport?: string;
    year?: number;
  }): Promise<{ user: User }> {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ========== Chat ==========

  async getChatSessions(athleteId: string): Promise<ChatSession[]> {
    return this.request(`/api/chat/sessions?athleteId=${athleteId}`);
  }

  async sendMessage(data: {
    session_id: string;
    message: string;
    athlete_id: string;
  }): Promise<Response> {
    // Returns raw Response for SSE streaming
    return fetch(`${this.baseURL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: JSON.stringify(data),
    });
  }

  async getChatSummary(sessionId: string): Promise<any> {
    return this.request(`/api/chat/${sessionId}/summary`);
  }

  // ========== Mood Logs ==========

  async createMoodLog(data: Omit<MoodLog, 'id' | 'createdAt'>): Promise<MoodLog> {
    const response: any = await this.request('/api/mood-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Backend returns { success: true, data: moodLog }
    return response.data || response;
  }

  async getMoodLogs(athleteId: string, limit?: number): Promise<MoodLog[]> {
    const queryParams = new URLSearchParams({
      athleteId,
      ...(limit && { limit: limit.toString() }),
    });
    const response: any = await this.request(`/api/mood-logs?${queryParams}`);
    // Backend returns { success: true, data: [...] }
    return response.data || response;
  }

  async getMoodStats(athleteId: string): Promise<any> {
    return this.request(`/api/mood-logs/stats?athleteId=${athleteId}`);
  }

  // ========== Goals ==========

  async getGoals(athleteId: string): Promise<Goal[]> {
    const response: any = await this.request(`/api/goals?athleteId=${athleteId}`);
    // Backend returns { success: true, data: [...] }
    return response.data || response;
  }

  async createGoal(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const response: any = await this.request('/api/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Backend returns { success: true, data: goal }
    return response.data || response;
  }

  async updateGoal(id: string, data: Partial<Goal>): Promise<Goal> {
    return this.request(`/api/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGoal(id: string): Promise<void> {
    return this.request(`/api/goals/${id}`, {
      method: 'DELETE',
    });
  }

  // ========== Athlete Profile ==========

  async getAthleteProfile(athleteId: string): Promise<any> {
    return this.request(`/api/athlete/${athleteId}`);
  }

  async getConsentSettings(): Promise<{
    consent: {
      consentCoachView: boolean;
      consentChatSummaries: boolean;
    };
  }> {
    return this.request('/api/athlete/consent');
  }

  async updateConsentSettings(data: {
    consentCoachView?: boolean;
    consentChatSummaries?: boolean;
  }): Promise<{
    consent: {
      consentCoachView: boolean;
      consentChatSummaries: boolean;
    };
    message: string;
  }> {
    return this.request('/api/athlete/consent', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ========== Assignments ==========

  async getAssignments(): Promise<any> {
    return this.request('/api/assignments');
  }

  async getAssignment(id: string): Promise<any> {
    return this.request(`/api/assignments/${id}`);
  }

  async createAssignment(data: {
    title: string;
    description: string;
    dueDate?: string;
    targetAthleteIds?: string[];
    targetSport?: string;
  }): Promise<any> {
    return this.request('/api/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssignment(id: string, data: {
    title?: string;
    description?: string;
    dueDate?: string | null;
    targetAthleteIds?: string[] | null;
    targetSport?: string | null;
  }): Promise<any> {
    return this.request(`/api/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAssignment(id: string): Promise<void> {
    return this.request(`/api/assignments/${id}`, {
      method: 'DELETE',
    });
  }

  async submitAssignment(id: string, response: string): Promise<any> {
    return this.request(`/api/assignments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    });
  }

  async getAssignmentSubmissions(id: string): Promise<any> {
    return this.request(`/api/assignments/${id}/submissions`);
  }
}

export const createAPIClient = (baseURL: string) => new APIClient(baseURL);
