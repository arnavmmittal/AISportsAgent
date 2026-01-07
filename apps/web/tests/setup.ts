/**
 * Vitest Setup File
 * Runs before all tests to configure the testing environment
 */

import '@testing-library/jest-dom';
import { beforeAll, afterAll } from 'vitest';

// Check if running in CI environment
export const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// Load environment variables for tests
beforeAll(() => {
  // Ensure critical environment variables are set
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set - some tests may fail');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (isCI) {
      console.log('ℹ️  Running in CI - RLS tests will be skipped');
    } else {
      console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL not set - RLS tests will fail');
    }
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (isCI) {
      console.log('ℹ️  Running in CI - RLS tests will be skipped');
    } else {
      console.warn('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY not set - RLS tests will fail');
    }
  }
});

afterAll(() => {
  // Cleanup after all tests
  console.log('✅ All tests completed');
});
