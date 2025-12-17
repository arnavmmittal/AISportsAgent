/**
 * Core types for the MCP Agent System
 */

export type AgentRole = 'athlete' | 'governance' | 'knowledge';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface AgentMessage {
  role: MessageRole;
  content: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface AgentContext {
  sessionId: string;
  athleteId: string;
  userId: string;
  sport?: string;
  conversationHistory: AgentMessage[];
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  content: string;
  metadata?: {
    protocol?: 'discovery' | 'understanding' | 'framework' | 'action' | 'followup';
    framework?: 'cbt' | 'mindfulness' | 'flow' | 'goal-setting';
    confidence?: number;
    requiresFollowup?: boolean;
    suggestedActions?: string[];
  };
}

export interface CrisisDetection {
  isCrisis: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  indicators: string[];
  message: string;
  confidence: number;
  recommendedAction: 'monitor' | 'alert' | 'escalate';
}

export interface KnowledgeContext {
  documents: Array<{
    content: string;
    source: string;
    relevanceScore: number;
    metadata?: Record<string, any>;
  }>;
  summary?: string;
}

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface AgentMetrics {
  responseTime: number;
  tokensUsed: number;
  confidenceScore?: number;
  error?: string;
}

export type AgentTool = {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
};
