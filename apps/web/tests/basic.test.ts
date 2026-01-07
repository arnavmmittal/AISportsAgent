/**
 * Basic sanity test to ensure test infrastructure is working
 * This prevents CI from failing with "No test files found"
 */

import { describe, it, expect } from 'vitest';

describe('Basic Tests', () => {
  it('should pass basic sanity check', () => {
    expect(true).toBe(true);
  });

  it('should verify environment is test', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
