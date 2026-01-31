#!/usr/bin/env npx ts-node
/**
 * Production Features Test Script
 *
 * Tests all production features in development mode.
 * Run with: npx ts-node scripts/test-production-features.ts
 *
 * Or from the web directory:
 * pnpm test:features
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      message: 'OK',
      duration: Date.now() - start,
    });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start,
    });
    console.log(`❌ ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function testPasswordResetRequest(): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/auth/password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com' }),
  });

  // Should return 200 even for non-existent emails (prevents enumeration)
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }

  const data = await response.json();
  if (!data.message) {
    throw new Error('Missing success message');
  }
}

async function testSignupValidation(): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'invalid-email', // Invalid
      password: '123', // Too short
      name: '',  // Empty
    }),
  });

  // Should return 400 for validation errors
  if (response.status !== 400) {
    throw new Error(`Expected 400 for invalid input, got ${response.status}`);
  }
}

async function testCronEscalationEndpoint(): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/cron/escalation`, {
    method: 'GET',
  });

  // In development, should work without secret
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }

  const data = await response.json();
  if (typeof data.summary?.totalChecked !== 'number') {
    throw new Error('Missing escalation summary');
  }
}

async function testNotificationEndpointAuth(): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/notifications/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'test',
      title: 'Test',
      body: 'Test notification',
    }),
  });

  // Should return 401 without auth
  if (response.status !== 401) {
    throw new Error(`Expected 401 without auth, got ${response.status}`);
  }
}

async function testChatStreamAuth(): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Hello',
      athlete_id: 'test',
    }),
  });

  // Should return 401 without auth
  if (response.status !== 401) {
    throw new Error(`Expected 401 without auth, got ${response.status}`);
  }
}

async function testHealthEndpoints(): Promise<void> {
  // Test that basic pages load
  const pages = ['/', '/auth/signin', '/auth/forgot-password'];

  for (const page of pages) {
    const response = await fetch(`${BASE_URL}${page}`);
    if (response.status !== 200) {
      throw new Error(`Page ${page} returned ${response.status}`);
    }
  }
}

async function testErrorBoundary(): Promise<void> {
  // The error boundary components exist (we can't easily trigger them in tests)
  // Just verify the endpoints don't crash
  const response = await fetch(`${BASE_URL}/api/health`);
  // 404 is fine if health endpoint doesn't exist
  if (response.status >= 500) {
    throw new Error(`Server error: ${response.status}`);
  }
}

async function main(): Promise<void> {
  console.log('\n🧪 Testing Production Features\n');
  console.log(`Base URL: ${BASE_URL}\n`);
  console.log('─'.repeat(50));

  // Run all tests
  await runTest('Password Reset Request', testPasswordResetRequest);
  await runTest('Signup Validation', testSignupValidation);
  await runTest('Cron Escalation Endpoint', testCronEscalationEndpoint);
  await runTest('Notification Auth Guard', testNotificationEndpointAuth);
  await runTest('Chat Stream Auth Guard', testChatStreamAuth);
  await runTest('Health/Page Endpoints', testHealthEndpoints);
  await runTest('Error Handling', testErrorBoundary);

  // Summary
  console.log('\n' + '─'.repeat(50));
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    console.log('Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
    process.exit(1);
  }

  console.log('✨ All tests passed!\n');
}

// Run if called directly
main().catch(console.error);
