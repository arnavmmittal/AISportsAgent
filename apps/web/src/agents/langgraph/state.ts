/**
 * LangGraph State Definitions
 *
 * Defines the state schema for the conversation graph using LangGraph annotations.
 * This state flows through all nodes and persists across conversation turns.
 */

import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import type { EnrichedAthleteContext } from '@/services/AthleteContextService';
import type { ChatAnalysisResult } from '@/lib/chat-analysis';

// Protocol phases from the 5-step Discovery-First approach
export type ProtocolPhase =
  | 'discovery'     // Ask open-ended questions, listen
  | 'understanding' // Reflect back, validate experience
  | 'framework'     // Introduce evidence-based techniques
  | 'action'        // Provide specific, actionable advice
  | 'followup';     // Check for understanding, offer next steps

// Crisis severity levels
export type CrisisSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Crisis detection result
export interface CrisisDetection {
  isCrisis: boolean;
  severity: CrisisSeverity;
  indicators: string[];
  message: string;
  confidence: number;
  recommendedAction: 'monitor' | 'alert' | 'escalate';
}

// Knowledge document from RAG
export interface KnowledgeDocument {
  content: string;
  source: string;
  relevanceScore: number;
  metadata?: Record<string, unknown>;
}

// Knowledge context from RAG retrieval
export interface KnowledgeContext {
  documents: KnowledgeDocument[];
  summary?: string;
}

// Tool execution result
export interface ToolResult {
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  success: boolean;
  error?: string;
  executedAt: Date;
}

// Response metadata for structured outputs
export interface ResponseMetadata {
  protocol?: ProtocolPhase;
  framework?: 'cbt' | 'mindfulness' | 'flow' | 'goal-setting';
  confidence?: number;
  requiresFollowup?: boolean;
  suggestedActions?: string[];
  isCrisisResponse?: boolean;
  crisisSeverity?: CrisisSeverity;
  toolsUsed?: string[];
}

/**
 * Main conversation state annotation for LangGraph
 *
 * This state schema is used by StateGraph to manage conversation flow.
 * Each field uses an Annotation with optional reducers for merging updates.
 */
export const ConversationStateAnnotation = Annotation.Root({
  // Message history - LangGraph manages this with built-in reducer
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // Session identification
  sessionId: Annotation<string>({
    reducer: (_, y) => y,  // Always take latest
  }),
  athleteId: Annotation<string>({
    reducer: (_, y) => y,
  }),
  userId: Annotation<string>({
    reducer: (_, y) => y,
  }),

  // Athlete context
  sport: Annotation<string | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),

  // Crisis detection (populated by safety node)
  crisisDetection: Annotation<CrisisDetection | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),
  crisisHandled: Annotation<boolean>({
    reducer: (_, y) => y,
    default: () => false,
  }),

  // Protocol phase tracking
  protocolPhase: Annotation<ProtocolPhase>({
    reducer: (_, y) => y,
    default: () => 'discovery',
  }),
  turnCountInPhase: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),

  // Enriched context from AthleteContextService
  enrichedContext: Annotation<EnrichedAthleteContext | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),

  // Knowledge context from RAG
  knowledgeContext: Annotation<KnowledgeContext | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),

  // Tool execution results (accumulates across turns)
  toolResults: Annotation<ToolResult[]>({
    reducer: (x, y) => [...(x || []), ...(y || [])],
    default: () => [],
  }),

  // Response metadata for structured outputs
  responseMetadata: Annotation<ResponseMetadata | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),

  // Session analysis from chat-analysis (for feedback loop)
  // Stores analysis from current session for same-turn reference
  sessionAnalysis: Annotation<ChatAnalysisResult | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),

  // Conversation state flags
  isComplete: Annotation<boolean>({
    reducer: (_, y) => y,
    default: () => false,
  }),
  error: Annotation<string | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),
});

// Export the state type for use in nodes
export type ConversationState = typeof ConversationStateAnnotation.State;

// Helper to create initial state
export function createInitialState(
  sessionId: string,
  athleteId: string,
  userId: string,
  sport?: string | null
): Partial<ConversationState> {
  return {
    sessionId,
    athleteId,
    userId,
    sport: sport || null,
    messages: [],
    crisisDetection: null,
    crisisHandled: false,
    protocolPhase: 'discovery',
    turnCountInPhase: 0,
    enrichedContext: null,
    knowledgeContext: null,
    toolResults: [],
    responseMetadata: null,
    sessionAnalysis: null,
    isComplete: false,
    error: null,
  };
}

// Helper to determine if we should advance protocol phase
export function shouldAdvancePhase(
  currentPhase: ProtocolPhase,
  turnCount: number,
  hasFrameworkApplied: boolean = false
): ProtocolPhase {
  switch (currentPhase) {
    case 'discovery':
      // Move to understanding after 3+ discovery questions
      if (turnCount >= 3) return 'understanding';
      break;
    case 'understanding':
      // Move to framework after 2+ understanding turns
      if (turnCount >= 2) return 'framework';
      break;
    case 'framework':
      // Move to action once framework is applied
      if (hasFrameworkApplied) return 'action';
      break;
    case 'action':
      // Move to followup after concrete steps given
      if (turnCount >= 2) return 'followup';
      break;
    case 'followup':
      // Stay in followup or cycle back based on athlete needs
      break;
  }
  return currentPhase;
}
