/**
 * useChatPersistence Hook
 *
 * Persists chat widget state to localStorage so athletes can resume
 * their chat sessions across page refreshes and navigation.
 *
 * Persisted state:
 * - Active session ID
 * - Widget position (if floating widget)
 * - Widget minimized state
 * - Last activity timestamp
 * - Draft message
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'aisportsagent_chat_state';
const ACTIVITY_KEY = 'aisportsagent_chat_activity';

interface ChatPersistenceState {
  sessionId: string | null;
  isMinimized: boolean;
  position: { x: number; y: number } | null;
  draftMessage: string;
  lastActivityAt: string | null;
}

interface ChatActivityState {
  athleteId: string;
  sessionId: string;
  isActive: boolean;
  lastHeartbeat: string;
}

const defaultState: ChatPersistenceState = {
  sessionId: null,
  isMinimized: false,
  position: null,
  draftMessage: '',
  lastActivityAt: null,
};

export function useChatPersistence(athleteId?: string) {
  const [state, setState] = useState<ChatPersistenceState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(parsed);
      }
    } catch (error) {
      console.error('Failed to load chat state:', error);
    }
    setIsHydrated(true);
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save chat state:', error);
    }
  }, [state, isHydrated]);

  // Update session ID
  const setSessionId = useCallback((sessionId: string | null) => {
    setState((prev) => ({
      ...prev,
      sessionId,
      lastActivityAt: new Date().toISOString(),
    }));
  }, []);

  // Update minimized state
  const setMinimized = useCallback((isMinimized: boolean) => {
    setState((prev) => ({ ...prev, isMinimized }));
  }, []);

  // Update position
  const setPosition = useCallback((position: { x: number; y: number } | null) => {
    setState((prev) => ({ ...prev, position }));
  }, []);

  // Update draft message
  const setDraftMessage = useCallback((draftMessage: string) => {
    setState((prev) => ({ ...prev, draftMessage }));
  }, []);

  // Record activity (call when user interacts with chat)
  const recordActivity = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastActivityAt: new Date().toISOString(),
    }));
  }, []);

  // Clear all state (e.g., on logout)
  const clearState = useCallback(() => {
    setState(defaultState);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVITY_KEY);
    }
  }, []);

  // Start a new session (clears draft, updates session ID)
  const startNewSession = useCallback((newSessionId: string) => {
    setState({
      sessionId: newSessionId,
      isMinimized: false,
      position: null,
      draftMessage: '',
      lastActivityAt: new Date().toISOString(),
    });
  }, []);

  return {
    state,
    isHydrated,
    setSessionId,
    setMinimized,
    setPosition,
    setDraftMessage,
    recordActivity,
    clearState,
    startNewSession,
  };
}

/**
 * useAthleteActivity Hook
 *
 * Tracks and reports athlete chat activity status for coach visibility.
 * Sends heartbeats to the server while athlete is active in chat.
 */

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export function useAthleteActivity(
  athleteId: string | undefined,
  sessionId: string | undefined,
  isActive: boolean
) {
  // Send heartbeat to server when active
  useEffect(() => {
    if (!athleteId || !sessionId || !isActive) return;

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/athlete/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            athleteId,
            sessionId,
            status: 'active',
          }),
        });
      } catch (error) {
        // Silently fail - this is just for visibility
        console.debug('Failed to send activity heartbeat');
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval for periodic heartbeats
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Clean up: send inactive status on unmount
    return () => {
      clearInterval(interval);
      // Fire and forget - don't await
      fetch('/api/athlete/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId,
          sessionId,
          status: 'inactive',
        }),
      }).catch(() => {});
    };
  }, [athleteId, sessionId, isActive]);
}

/**
 * Get time since last activity
 */
export function getTimeSinceActivity(lastActivityAt: string | null): string {
  if (!lastActivityAt) return 'No recent activity';

  const now = new Date();
  const last = new Date(lastActivityAt);
  const diffMs = now.getTime() - last.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
}
