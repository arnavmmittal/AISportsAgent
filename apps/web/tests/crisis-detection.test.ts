/**
 * Crisis Detection Tests
 *
 * Tests the keyword and coded language detection layers.
 * OpenAI moderation layer is mocked since it requires API access.
 *
 * These tests validate that the safety-critical crisis detection system
 * correctly identifies self-harm language, coded euphemisms, and
 * performance distress — required for university compliance.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock OpenAI before importing the module
vi.mock('openai', () => {
  const MockOpenAI = function () {
    return {
      moderations: {
        create: vi.fn().mockResolvedValue({
          results: [{ flagged: false, categories: {} }],
        }),
      },
    };
  };
  return { default: MockOpenAI };
});

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import { detectCrisis, type CrisisDetectionResult } from '@/lib/crisis-detection';

describe('Crisis Detection', () => {
  describe('Layer 1: Explicit keyword detection', () => {
    it('detects explicit suicide mention', async () => {
      const result = await detectCrisis('I have been thinking about suicide');
      expect(result.isCrisis).toBe(true);
      expect(result.severity).toBe('HIGH');
      expect(result.shouldAlert).toBe(true);
      expect(result.shouldEscalate).toBe(true);
    });

    it('detects "kill myself"', async () => {
      const result = await detectCrisis('I want to kill myself');
      expect(result.isCrisis).toBe(true);
      expect(result.shouldAlert).toBe(true);
    });

    it('detects "end my life"', async () => {
      const result = await detectCrisis('I want to end my life');
      expect(result.isCrisis).toBe(true);
      expect(result.shouldAlert).toBe(true);
    });

    it('detects "end it all"', async () => {
      const result = await detectCrisis("I just want to end it all");
      expect(result.isCrisis).toBe(true);
    });

    it('detects "not worth living"', async () => {
      const result = await detectCrisis('Life is not worth living anymore');
      expect(result.isCrisis).toBe(true);
    });

    it('detects "better off dead"', async () => {
      const result = await detectCrisis('Everyone would be better off dead without me');
      expect(result.isCrisis).toBe(true);
    });

    it('detects self-harm mentions', async () => {
      const result = await detectCrisis('I have been self-harming');
      expect(result.isCrisis).toBe(true);
      expect(result.shouldAlert).toBe(true);
    });

    it('detects "cutting myself"', async () => {
      const result = await detectCrisis('I started cutting myself again');
      expect(result.isCrisis).toBe(true);
    });
  });

  describe('Layer 2: Coded language detection', () => {
    it('detects "unalive"', async () => {
      const result = await detectCrisis('I want to unalive myself');
      expect(result.isCrisis).toBe(true);
      expect(result.detectedBy).toBe('coded');
    });

    it('detects "not going to wake up"', async () => {
      const result = await detectCrisis("I'm not going to wake up tomorrow");
      expect(result.isCrisis).toBe(true);
    });

    it('detects "can\'t do this anymore"', async () => {
      const result = await detectCrisis("I can't do this anymore");
      expect(result.isCrisis).toBe(true);
    });

    it('detects "can\'t take this anymore"', async () => {
      const result = await detectCrisis("I can't take this anymore");
      expect(result.isCrisis).toBe(true);
    });

    it('detects "everyone would be better without me"', async () => {
      const result = await detectCrisis("Everyone would be better without me");
      expect(result.isCrisis).toBe(true);
    });

    it('detects "go to sleep forever"', async () => {
      const result = await detectCrisis('I just want to go to sleep forever');
      expect(result.isCrisis).toBe(true);
    });
  });

  describe('Layer 3: Performance distress (non-crisis)', () => {
    it('detects "give up"', async () => {
      const result = await detectCrisis('I want to give up on everything');
      expect(result.isPerformanceDistress).toBe(true);
      expect(result.isCrisis).toBe(false);
      expect(result.severity).toBe('LOW');
    });

    it('detects "quit the team"', async () => {
      const result = await detectCrisis('I want to quit the team');
      expect(result.isPerformanceDistress).toBe(true);
      expect(result.isCrisis).toBe(false);
    });

    it('detects "feel like a failure"', async () => {
      const result = await detectCrisis('I feel like a failure after that game');
      expect(result.isPerformanceDistress).toBe(true);
      expect(result.isCrisis).toBe(false);
    });

    it('detects "hate myself"', async () => {
      const result = await detectCrisis('I hate myself for missing that shot');
      expect(result.isPerformanceDistress).toBe(true);
    });
  });

  describe('Safe messages (no detection)', () => {
    it('normal performance discussion is safe', async () => {
      const result = await detectCrisis('I had a great game today and scored 20 points');
      expect(result.isCrisis).toBe(false);
      expect(result.isPerformanceDistress).toBe(false);
      expect(result.severity).toBe('NONE');
      expect(result.shouldAlert).toBe(false);
      expect(result.shouldEscalate).toBe(false);
    });

    it('normal stress discussion is safe', async () => {
      const result = await detectCrisis("I'm stressed about the upcoming finals");
      expect(result.isCrisis).toBe(false);
      expect(result.isPerformanceDistress).toBe(false);
    });

    it('positive mental health discussion is safe', async () => {
      const result = await detectCrisis('I feel confident and ready for the game');
      expect(result.isCrisis).toBe(false);
    });

    it('academic discussion is safe', async () => {
      const result = await detectCrisis('I need to study for my exam tomorrow');
      expect(result.isCrisis).toBe(false);
    });

    it('injury discussion is safe', async () => {
      const result = await detectCrisis('My knee hurts after practice');
      expect(result.isCrisis).toBe(false);
    });
  });

  describe('Severity classification', () => {
    it('explicit suicide = HIGH severity', async () => {
      const result = await detectCrisis('suicidal thoughts');
      expect(result.severity).toBe('HIGH');
      expect(result.shouldEscalate).toBe(true);
    });

    it('coded language = MEDIUM severity', async () => {
      const result = await detectCrisis('I want to unalive');
      expect(result.severity).toBe('MEDIUM');
      expect(result.shouldEscalate).toBe(false);
      expect(result.shouldAlert).toBe(true);
    });

    it('performance distress only = LOW severity', async () => {
      const result = await detectCrisis('I want to give up');
      expect(result.severity).toBe('LOW');
      expect(result.shouldAlert).toBe(false);
    });

    it('multiple detections = HIGH severity', async () => {
      // This triggers both keyword ("kill myself") and coded ("can't do this anymore")
      const result = await detectCrisis("I want to kill myself, I can't do this anymore");
      expect(result.severity).toBe('HIGH');
      expect(result.detectedBy).toBe('multiple');
      expect(result.shouldEscalate).toBe(true);
    });
  });

  describe('Result structure', () => {
    it('returns complete CrisisDetectionResult', async () => {
      const result = await detectCrisis('test message');
      expect(result).toHaveProperty('isCrisis');
      expect(result).toHaveProperty('isPerformanceDistress');
      expect(result).toHaveProperty('severity');
      expect(result).toHaveProperty('detectedBy');
      expect(result).toHaveProperty('reasons');
      expect(result).toHaveProperty('shouldAlert');
      expect(result).toHaveProperty('shouldEscalate');
      expect(Array.isArray(result.reasons)).toBe(true);
    });
  });
});
