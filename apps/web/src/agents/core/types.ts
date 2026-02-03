/**
 * Core types for the LangGraph Agent System
 */

import type { EnrichedAthleteContext } from '@/services/AthleteContextService';

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
  // Enriched context from AthleteContextService
  enrichedContext?: EnrichedAthleteContext;
}

export interface AgentResponse {
  content: string;
  metadata?: {
    protocol?: 'discovery' | 'understanding' | 'framework' | 'action' | 'followup';
    framework?: 'cbt' | 'mindfulness' | 'flow' | 'goal-setting';
    confidence?: number;
    requiresFollowup?: boolean;
    suggestedActions?: string[];
    isCrisisResponse?: boolean;
    crisisSeverity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    crisisDetection?: CrisisDetection;
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
