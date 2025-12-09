export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  embedding?: number[];
}

export interface ChatSession {
  id: string;
  athleteId: string;
  topic: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

export interface ChatSummary {
  id: string;
  sessionId: string;
  summary: string;
  keyThemes: string[];
  emotionalState: 'positive' | 'neutral' | 'negative' | 'mixed';
  actionItems?: string[];
  viewedByCoach: boolean;
  viewedAt?: Date;
  createdAt: Date;
}
