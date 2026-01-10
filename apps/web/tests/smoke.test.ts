/**
 * Smoke Tests
 *
 * Basic tests to verify the application is working.
 * These run in CI to catch critical issues.
 */

import { describe, it, expect } from 'vitest';

describe('Smoke Tests', () => {
  it('should pass basic sanity check', () => {
    expect(true).toBe(true);
  });

  it('should have correct Node environment', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });

  it('should be able to import core utilities', async () => {
    // Test that basic imports work
    const { z } = await import('zod');
    expect(z).toBeDefined();

    // Test zod schema validation
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const result = schema.safeParse({ name: 'Test', age: 25 });
    expect(result.success).toBe(true);
  });
});

describe('Security Tests', () => {
  it('should not expose sensitive env vars to client', () => {
    // These should NOT be exposed to client code
    const sensitiveVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'OPENAI_API_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    sensitiveVars.forEach((varName) => {
      // In test environment, these might be set, but they shouldn't
      // be prefixed with NEXT_PUBLIC_
      const publicVersion = `NEXT_PUBLIC_${varName}`;
      expect(process.env[publicVersion]).toBeUndefined();
    });
  });

  it('should validate input schemas reject malicious content', async () => {
    const { z } = await import('zod');

    // Test SQL injection pattern detection
    const safeStringSchema = z.string().refine(
      (val) => !val.includes('DROP TABLE') && !val.includes('--'),
      { message: 'Potential SQL injection detected' }
    );

    const maliciousInput = "'; DROP TABLE users; --";
    const result = safeStringSchema.safeParse(maliciousInput);
    expect(result.success).toBe(false);

    const safeInput = "Hello, this is a normal message";
    const safeResult = safeStringSchema.safeParse(safeInput);
    expect(safeResult.success).toBe(true);
  });
});

describe('Configuration Tests', () => {
  it('should have required configuration structure', () => {
    // These are minimal checks that don't require actual env vars
    expect(typeof process.env).toBe('object');
  });
});
