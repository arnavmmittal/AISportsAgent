/**
 * LangGraph State Graph
 *
 * Main conversation graph that orchestrates:
 * 1. Safety check (crisis detection)
 * 2. Context loading (enriched athlete data)
 * 3. Model invocation with tools
 * 4. Tool execution (when needed)
 * 5. State persistence
 *
 * Flow:
 * START → safety_check → [crisis_response | load_context] → call_model → [tools | persist] → END
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { HumanMessage } from '@langchain/core/messages';

import { ConversationStateAnnotation, createInitialState, type ConversationState } from './state';
import { allTools } from './tools';
import {
  safetyCheckNode,
  routeAfterSafetyCheck,
  crisisResponseNode,
  loadContextNode,
  callModelNode,
  shouldContinueToTools,
  persistStateNode,
} from './nodes';

// Create the tool node with all tools (athlete + analytics)
// Total: 14 tools (8 athlete + 6 analytics)
const toolNode = new ToolNode(allTools);

/**
 * Build the conversation graph
 *
 * Graph structure:
 *
 *                    START
 *                      │
 *                      ▼
 *               ┌─────────────┐
 *               │ safety_check│
 *               └─────────────┘
 *                      │
 *         ┌────────────┴────────────┐
 *         │                         │
 *         ▼                         ▼
 *  ┌──────────────┐        ┌─────────────┐
 *  │crisis_response│        │ load_context│
 *  └──────────────┘        └─────────────┘
 *         │                         │
 *         │                         ▼
 *         │                 ┌─────────────┐
 *         │                 │ call_model  │
 *         │                 └─────────────┘
 *         │                         │
 *         │            ┌────────────┴────────────┐
 *         │            │                         │
 *         │            ▼                         ▼
 *         │     ┌─────────────┐          ┌─────────────┐
 *         │     │   tools     │          │   persist   │
 *         │     └─────────────┘          └─────────────┘
 *         │            │                         │
 *         │            └──────────┐              │
 *         │                       │              │
 *         │                       ▼              │
 *         │               ┌─────────────┐        │
 *         │               │ call_model  │        │
 *         │               └─────────────┘        │
 *         │                       │              │
 *         └───────────────────────┴──────────────┘
 *                                 │
 *                                 ▼
 *                               END
 */
function buildConversationGraph() {
  const workflow = new StateGraph(ConversationStateAnnotation)
    // Add all nodes
    .addNode('safety_check', safetyCheckNode)
    .addNode('crisis_response', crisisResponseNode)
    .addNode('load_context', loadContextNode)
    .addNode('call_model', callModelNode)
    .addNode('tools', toolNode)
    .addNode('persist', persistStateNode)

    // Define edges
    // START → safety_check
    .addEdge(START, 'safety_check')

    // safety_check → crisis_response OR load_context
    .addConditionalEdges('safety_check', routeAfterSafetyCheck, {
      crisis_response: 'crisis_response',
      load_context: 'load_context',
    })

    // crisis_response → persist (then END)
    .addEdge('crisis_response', 'persist')

    // load_context → call_model
    .addEdge('load_context', 'call_model')

    // call_model → tools OR persist
    .addConditionalEdges('call_model', shouldContinueToTools, {
      tools: 'tools',
      persist: 'persist',
    })

    // tools → call_model (loop back to continue conversation)
    .addEdge('tools', 'call_model')

    // persist → END
    .addEdge('persist', END);

  return workflow;
}

// Create checkpointer for memory persistence
const checkpointer = new MemorySaver();

// Compiled graph (singleton)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let compiledGraph: any = null;

/**
 * Get the compiled conversation graph
 * Uses singleton pattern to avoid recreating the graph
 */
export function getConversationGraph() {
  if (!compiledGraph) {
    const workflow = buildConversationGraph();
    compiledGraph = workflow.compile({ checkpointer });
  }
  return compiledGraph;
}

/**
 * Invoke the conversation graph with a new message
 *
 * @param message - User's message
 * @param sessionId - Chat session ID (used as thread_id for persistence)
 * @param athleteId - Athlete user ID
 * @param userId - User ID (usually same as athleteId)
 * @param sport - Optional sport for context
 * @returns Final state after graph execution
 */
export async function invokeConversationGraph(
  message: string,
  sessionId: string,
  athleteId: string,
  userId: string,
  sport?: string | null
): Promise<ConversationState> {
  const graph = getConversationGraph();

  // Create initial state with the new message
  const initialState = {
    ...createInitialState(sessionId, athleteId, userId, sport),
    messages: [new HumanMessage({ content: message })],
  };

  // Configuration for this invocation
  const config = {
    configurable: {
      thread_id: sessionId, // Use session ID as thread for persistence
    },
  };

  // Invoke the graph
  const result = await graph.invoke(initialState, config);

  return result;
}

/**
 * Stream the conversation graph execution
 *
 * Yields events as the graph executes, allowing real-time streaming of:
 * - Token generation
 * - Tool calls
 * - Crisis detection
 *
 * @param message - User's message
 * @param sessionId - Chat session ID
 * @param athleteId - Athlete user ID
 * @param userId - User ID
 * @param sport - Optional sport for context
 * @yields Graph events
 */
export async function* streamConversationGraph(
  message: string,
  sessionId: string,
  athleteId: string,
  userId: string,
  sport?: string | null
) {
  const graph = getConversationGraph();

  // Create initial state
  const initialState = {
    ...createInitialState(sessionId, athleteId, userId, sport),
    messages: [new HumanMessage({ content: message })],
  };

  // Configuration
  const config = {
    configurable: {
      thread_id: sessionId,
    },
  };

  // Stream events
  const stream = graph.streamEvents(initialState, {
    ...config,
    version: 'v2',
  });

  for await (const event of stream) {
    // Yield different event types
    if (event.event === 'on_llm_stream') {
      // Token streaming from the model
      const chunk = event.data?.chunk;
      if (chunk?.content) {
        yield {
          type: 'token',
          data: { content: chunk.content },
        };
      }
    } else if (event.event === 'on_tool_start') {
      // Tool execution started
      yield {
        type: 'tool_start',
        data: {
          tool: event.name,
          input: event.data?.input,
        },
      };
    } else if (event.event === 'on_tool_end') {
      // Tool execution completed
      yield {
        type: 'tool_result',
        data: {
          tool: event.name,
          output: event.data?.output,
        },
      };
    } else if (event.event === 'on_chain_end' && event.name === 'safety_check') {
      // Safety check completed
      const output = event.data?.output;
      if (output?.crisisDetection?.isCrisis) {
        yield {
          type: 'crisis_alert',
          data: output.crisisDetection,
        };
      }
    }
  }

  // Get final state
  const finalState = await graph.getState(config);

  yield {
    type: 'done',
    data: {
      sessionId,
      protocolPhase: finalState.values?.protocolPhase,
      hasCrisis: finalState.values?.crisisDetection?.isCrisis || false,
    },
  };
}

/**
 * Get the current state of a conversation
 *
 * @param sessionId - Chat session ID
 * @returns Current conversation state or null
 */
export async function getConversationState(sessionId: string) {
  const graph = getConversationGraph();

  const config = {
    configurable: {
      thread_id: sessionId,
    },
  };

  const state = await graph.getState(config);
  return state.values || null;
}

// Export types
export type { ConversationState };
