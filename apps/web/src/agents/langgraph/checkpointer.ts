/**
 * PostgreSQL Checkpointer for LangGraph
 *
 * Replaces in-memory MemorySaver with persistent PostgreSQL storage.
 *
 * Benefits:
 * - Conversations persist across server restarts
 * - Horizontal scaling (multiple pods share state)
 * - Resume conversations days/weeks later
 * - Full conversation history for debugging
 *
 * The checkpointer automatically creates required tables on first use.
 */

import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

// Singleton instance
let checkpointerInstance: PostgresSaver | null = null;
let initPromise: Promise<PostgresSaver> | null = null;

/**
 * Get the PostgreSQL checkpointer instance
 *
 * Uses singleton pattern with lazy initialization.
 * The checkpointer will create tables if they don't exist.
 */
export async function getCheckpointer(): Promise<PostgresSaver> {
  // Return existing instance if available
  if (checkpointerInstance) {
    return checkpointerInstance;
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = initializeCheckpointer();
  return initPromise;
}

async function initializeCheckpointer(): Promise<PostgresSaver> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is required for LangGraph checkpointer'
    );
  }

  try {
    // Create the checkpointer from connection string
    // PostgresSaver handles connection pooling internally
    const checkpointer = PostgresSaver.fromConnString(databaseUrl);

    // Setup creates the required tables if they don't exist:
    // - checkpoints: Stores graph state snapshots
    // - checkpoint_writes: Stores pending writes
    // - checkpoint_blobs: Stores large state objects
    await checkpointer.setup();

    checkpointerInstance = checkpointer;

    if (process.env.NODE_ENV === 'development') {
      console.log('[LANGGRAPH:CHECKPOINTER] PostgreSQL checkpointer initialized');
    }

    return checkpointer;
  } catch (error) {
    // Reset promise so next call can retry
    initPromise = null;

    console.error('[LANGGRAPH:CHECKPOINTER] Failed to initialize:', error);
    throw error;
  }
}

/**
 * Gracefully close the checkpointer connection
 * Call this during server shutdown
 */
export async function closeCheckpointer(): Promise<void> {
  if (checkpointerInstance) {
    // PostgresSaver doesn't have an explicit close method,
    // but we clear the reference for cleanup
    checkpointerInstance = null;
    initPromise = null;

    if (process.env.NODE_ENV === 'development') {
      console.log('[LANGGRAPH:CHECKPOINTER] Checkpointer connection closed');
    }
  }
}

/**
 * Check if checkpointer is initialized
 */
export function isCheckpointerReady(): boolean {
  return checkpointerInstance !== null;
}
