/**
 * Vitest Test Setup
 *
 * This file runs before all tests to configure the testing environment.
 */

import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case (unmount React trees)
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/test_db';
process.env.NEXTAUTH_SECRET = 'test-secret-minimum-32-characters-long';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
