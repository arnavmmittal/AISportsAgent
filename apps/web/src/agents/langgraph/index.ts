/**
 * LangGraph Agent System
 *
 * A sophisticated multi-agent orchestration system using LangGraph for
 * stateful, tool-enabled conversations with athletes.
 *
 * Key components:
 * - StateGraph with memory persistence
 * - 8 athlete-facing tools with Zod schemas
 * - Triple-layer crisis detection
 * - Enriched athlete context integration
 * - 5-step Discovery-First protocol
 */

// Main graph exports
export {
  getConversationGraph,
  invokeConversationGraph,
  streamConversationGraph,
  getConversationState,
} from './graph';

// State exports
export {
  ConversationStateAnnotation,
  createInitialState,
  shouldAdvancePhase,
  type ConversationState,
  type ProtocolPhase,
  type CrisisDetection,
  type CrisisSeverity,
  type KnowledgeContext,
  type KnowledgeDocument,
  type ToolResult,
  type ResponseMetadata,
} from './state';

// Tool exports
export { athleteTools, athleteToolNames } from './tools';

// Node exports (for advanced usage)
export {
  safetyCheckNode,
  routeAfterSafetyCheck,
  crisisResponseNode,
  loadContextNode,
  buildContextPromptSection,
  callModelNode,
  shouldContinueToTools,
  persistStateNode,
  extractResponseContent,
  BASE_SYSTEM_PROMPT,
} from './nodes';
