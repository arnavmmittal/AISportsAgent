/**
 * LangGraph Checkpointer with Graceful Fallback
 *
 * Attempts PostgreSQL persistence for production, falls back to in-memory for development.
 *
 * Production (PostgresSaver):
 * - Conversations persist across server restarts
 * - Horizontal scaling (multiple pods share state)
 * - Resume conversations days/weeks later
 * - Full conversation history for debugging
 *
 * Development Fallback (MemorySaver):
 * - Works without database connection
 * - Conversations lost on restart
 * - Good for local testing
 *
 * IMPORTANT: Supabase PgBouncer Compatibility
 * - Port 6543 (transaction mode) breaks prepared statements
 * - Port 5432 (session mode) works with prepared statements
 * - DIRECT_DATABASE_URL bypasses pooler entirely (recommended for production)
 */

import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { MemorySaver } from '@langchain/langgraph';
import type { BaseCheckpointSaver } from '@langchain/langgraph';

// Singleton instance (can be either PostgresSaver or MemorySaver)
let checkpointerInstance: BaseCheckpointSaver | null = null;
let initPromise: Promise<BaseCheckpointSaver> | null = null;
let checkpointerType: 'postgres' | 'memory' | null = null;

/**
 * Get the checkpointer instance
 *
 * Uses singleton pattern with lazy initialization.
 * Attempts PostgresSaver first, falls back to MemorySaver on connection failure.
 */
export async function getCheckpointer(): Promise<BaseCheckpointSaver> {
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

/**
 * Get a database URL compatible with PostgresSaver
 *
 * PgBouncer in transaction mode (port 6543) breaks prepared statements.
 * We need either:
 * 1. A direct connection (DIRECT_DATABASE_URL)
 * 2. Session mode pooler (port 5432)
 * 3. Transaction mode with prepare=false (fallback)
 */
function getCompatibleDatabaseUrl(): string {
  // Prefer direct connection if available
  const directUrl = process.env.DIRECT_DATABASE_URL;
  if (directUrl) {
    return directUrl;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is required for LangGraph checkpointer'
    );
  }

  // Check if using PgBouncer transaction mode (port 6543)
  if (databaseUrl.includes(':6543')) {
    // Option 1: Switch to session mode (port 5432) - supports prepared statements
    const sessionModeUrl = databaseUrl.replace(':6543', ':5432');

    if (process.env.NODE_ENV === 'development') {
      console.log('[LANGGRAPH:CHECKPOINTER] Switching to session mode pooler (port 5432)');
    }

    return sessionModeUrl;
  }

  return databaseUrl;
}

async function initializeCheckpointer(): Promise<BaseCheckpointSaver> {
  // First, try PostgresSaver for persistent storage
  try {
    const connectionUrl = getCompatibleDatabaseUrl();

    // Create the checkpointer from connection string
    const checkpointer = PostgresSaver.fromConnString(connectionUrl);

    // Setup creates the required tables if they don't exist:
    // - checkpoints: Stores graph state snapshots
    // - checkpoint_writes: Stores pending writes
    // - checkpoint_blobs: Stores large state objects
    await checkpointer.setup();

    checkpointerInstance = checkpointer;
    checkpointerType = 'postgres';

    console.log('[LANGGRAPH:CHECKPOINTER] PostgreSQL checkpointer initialized (persistent storage)');

    return checkpointer;
  } catch (postgresError) {
    // PostgresSaver failed - fall back to MemorySaver
    console.warn('[LANGGRAPH:CHECKPOINTER] PostgreSQL connection failed, falling back to MemorySaver');
    console.warn('[LANGGRAPH:CHECKPOINTER] Reason:', postgresError instanceof Error ? postgresError.message : String(postgresError));

    // Show helpful hints based on error type
    if (postgresError instanceof Error) {
      if (postgresError.message.includes('ETIMEDOUT')) {
        console.warn('[LANGGRAPH:CHECKPOINTER] 💡 Hint: Database connection timed out.');
        console.warn('   - Set DIRECT_DATABASE_URL for direct connection (bypasses pooler)');
        console.warn('   - Or check if Supabase session mode (port 5432) is accessible');
      } else if (postgresError.message.includes('ECONNREFUSED')) {
        console.warn('[LANGGRAPH:CHECKPOINTER] 💡 Hint: Database connection refused.');
        console.warn('   - Check if DATABASE_URL is correct');
        console.warn('   - Ensure database is running');
      }
    }

    // Create MemorySaver as fallback
    const memorySaver = new MemorySaver();
    checkpointerInstance = memorySaver;
    checkpointerType = 'memory';

    console.log('[LANGGRAPH:CHECKPOINTER] MemorySaver initialized (in-memory, non-persistent)');
    console.log('[LANGGRAPH:CHECKPOINTER] ⚠️  Conversations will NOT persist across restarts');

    return memorySaver;
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
    checkpointerType = null;

    console.log('[LANGGRAPH:CHECKPOINTER] Checkpointer connection closed');
  }
}

/**
 * Check if checkpointer is initialized
 */
export function isCheckpointerReady(): boolean {
  return checkpointerInstance !== null;
}

/**
 * Get the type of checkpointer currently in use
 * @returns 'postgres' for persistent storage, 'memory' for in-memory, null if not initialized
 */
export function getCheckpointerType(): 'postgres' | 'memory' | null {
  return checkpointerType;
}

/**
 * Check if using persistent storage (PostgresSaver)
 */
export function isPersistentStorage(): boolean {
  return checkpointerType === 'postgres';
}
