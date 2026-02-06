/**
 * Tests for LangGraph State Definitions
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  shouldAdvancePhase,
  type ProtocolPhase,
} from '../state';

describe('createInitialState', () => {
  it('creates state with required fields', () => {
    const state = createInitialState('session-1', 'athlete-1', 'user-1');

    expect(state.sessionId).toBe('session-1');
    expect(state.athleteId).toBe('athlete-1');
    expect(state.userId).toBe('user-1');
    expect(state.sport).toBeNull();
    expect(state.messages).toEqual([]);
    expect(state.crisisDetection).toBeNull();
    expect(state.crisisHandled).toBe(false);
    expect(state.protocolPhase).toBe('discovery');
    expect(state.turnCountInPhase).toBe(0);
    expect(state.enrichedContext).toBeNull();
    expect(state.knowledgeContext).toBeNull();
    expect(state.toolResults).toEqual([]);
    expect(state.responseMetadata).toBeNull();
    expect(state.isComplete).toBe(false);
    expect(state.error).toBeNull();
  });

  it('includes sport when provided', () => {
    const state = createInitialState('session-1', 'athlete-1', 'user-1', 'basketball');

    expect(state.sport).toBe('basketball');
  });

  it('handles null sport', () => {
    const state = createInitialState('session-1', 'athlete-1', 'user-1', null);

    expect(state.sport).toBeNull();
  });
});

describe('shouldAdvancePhase', () => {
  describe('discovery phase', () => {
    it('stays in discovery with few turns', () => {
      const newPhase = shouldAdvancePhase('discovery', 1);
      expect(newPhase).toBe('discovery');
    });

    it('advances to understanding after 3+ turns', () => {
      const newPhase = shouldAdvancePhase('discovery', 3);
      expect(newPhase).toBe('understanding');
    });

    it('advances to understanding after 5 turns', () => {
      const newPhase = shouldAdvancePhase('discovery', 5);
      expect(newPhase).toBe('understanding');
    });
  });

  describe('understanding phase', () => {
    it('stays in understanding with 1 turn', () => {
      const newPhase = shouldAdvancePhase('understanding', 1);
      expect(newPhase).toBe('understanding');
    });

    it('advances to framework after 2+ turns', () => {
      const newPhase = shouldAdvancePhase('understanding', 2);
      expect(newPhase).toBe('framework');
    });
  });

  describe('framework phase', () => {
    it('stays in framework without framework applied', () => {
      const newPhase = shouldAdvancePhase('framework', 3, false);
      expect(newPhase).toBe('framework');
    });

    it('advances to action when framework applied', () => {
      const newPhase = shouldAdvancePhase('framework', 1, true);
      expect(newPhase).toBe('action');
    });
  });

  describe('action phase', () => {
    it('stays in action with 1 turn', () => {
      const newPhase = shouldAdvancePhase('action', 1);
      expect(newPhase).toBe('action');
    });

    it('advances to followup after 2+ turns', () => {
      const newPhase = shouldAdvancePhase('action', 2);
      expect(newPhase).toBe('followup');
    });
  });

  describe('followup phase', () => {
    it('stays in followup', () => {
      const newPhase = shouldAdvancePhase('followup', 5);
      expect(newPhase).toBe('followup');
    });
  });
});
