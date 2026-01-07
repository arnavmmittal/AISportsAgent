/**
 * Vitest Test Setup
 *
 * This file runs before all tests to configure the testing environment.
 */

import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Check if running in CI environment
export const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
// Use CI database if available, otherwise use local test database
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_db';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-minimum-32-characters-long';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Cleanup after each test case (unmount React trees)
afterEach(() => {
  cleanup();
});

// Setup before all tests
beforeAll(() => {
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
