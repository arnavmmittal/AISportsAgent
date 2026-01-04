/**
 * k6 Load Testing Script
 *
 * Install k6: https://k6.io/docs/get-started/installation/
 * Run: k6 run apps/web/tests/load/k6-load-test.js
 *
 * Test scenarios:
 * - Smoke test: 1-2 VUs for 1 minute
 * - Load test: Ramp up to 50 VUs over 10 minutes
 * - Stress test: Ramp up to 100 VUs to find breaking point
 * - Spike test: Sudden spike to 200 VUs
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    // Smoke test
    { duration: '1m', target: 2 },  // Warmup: 2 VUs for 1 min

    // Load test
    { duration: '2m', target: 10 }, // Ramp up to 10 VUs
    { duration: '5m', target: 50 }, // Ramp to 50 VUs (normal load)
    { duration: '3m', target: 50 }, // Sustain 50 VUs

    // Stress test
    { duration: '2m', target: 100 }, // Stress: 100 VUs
    { duration: '3m', target: 100 }, // Sustain stress

    // Spike test
    { duration: '30s', target: 200 }, // Spike to 200 VUs
    { duration: '1m', target: 200 },  // Hold spike

    // Cool down
    { duration: '2m', target: 0 },   // Ramp down
  ],

  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests < 2s
    http_req_failed: ['rate<0.01'],     // Error rate < 1%
    errors: ['rate<0.01'],              // Custom error rate < 1%
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = `athlete${Math.floor(Math.random() * 1000)}@test.edu`;
const TEST_PASSWORD = 'TestPassword123!';

// Shared auth token (set during setup)
let authToken = null;

/**
 * Setup function (runs once per VU at start)
 */
export function setup() {
  // Login to get auth token
  const loginRes = http.post(`${BASE_URL}/api/auth/mobile/login`, JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    return { token: body.token };
  }

  console.error('Setup failed: Could not login');
  return { token: null };
}

/**
 * Main test function (runs repeatedly for each VU)
 */
export default function (data) {
  const token = data.token;

  if (!token) {
    console.error('No auth token available');
    errorRate.add(1);
    return;
  }

  // Test 1: Health check (10% of requests)
  if (Math.random() < 0.1) {
    const healthRes = http.get(`${BASE_URL}/api/health`);

    check(healthRes, {
      'health check status is 200': (r) => r.status === 200,
      'health check has status field': (r) => {
        const body = JSON.parse(r.body);
        return body.status === 'healthy';
      },
    }) || errorRate.add(1);

    sleep(1);
    return;
  }

  // Test 2: Chat stream (60% of requests)
  if (Math.random() < 0.6) {
    const chatRes = http.post(`${BASE_URL}/api/chat/stream`, JSON.stringify({
      session_id: `test-session-${__VU}`,
      athlete_id: `test-athlete-${__VU}`,
      message: 'I need help managing pre-game anxiety',
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      timeout: '30s',
    });

    check(chatRes, {
      'chat stream status is 200': (r) => r.status === 200,
      'chat stream is SSE': (r) => r.headers['Content-Type']?.includes('text/event-stream'),
      'chat response time < 5s': (r) => r.timings.duration < 5000,
    }) || errorRate.add(1);

    sleep(5); // Simulate user reading response
    return;
  }

  // Test 3: Get chat messages (20% of requests)
  if (Math.random() < 0.2) {
    const messagesRes = http.get(
      `${BASE_URL}/api/chat/test-session-${__VU}/messages`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    check(messagesRes, {
      'messages status is 200': (r) => r.status === 200,
      'messages is array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        } catch {
          return false;
        }
      },
    }) || errorRate.add(1);

    sleep(2);
    return;
  }

  // Test 4: Mood logs (10% of requests)
  const moodRes = http.post(`${BASE_URL}/api/mood-logs`, JSON.stringify({
    athleteId: `test-athlete-${__VU}`,
    mood: Math.floor(Math.random() * 10) + 1,
    confidence: Math.floor(Math.random() * 10) + 1,
    stress: Math.floor(Math.random() * 10) + 1,
    energy: Math.floor(Math.random() * 10) + 1,
    sleep: Math.floor(Math.random() * 10) + 1,
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  check(moodRes, {
    'mood log status is 201': (r) => r.status === 201,
  }) || errorRate.add(1);

  sleep(3);
}

/**
 * Teardown function (runs once per VU at end)
 */
export function teardown(data) {
  console.log('Load test completed');
}

/**
 * Handle summary (custom report)
 */
export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, opts) {
  const { indent = '', enableColors = false } = opts || {};

  let summary = `\n${indent}Load Test Results:\n`;
  summary += `${indent}==================\n\n`;

  // Request stats
  summary += `${indent}Requests:\n`;
  summary += `${indent}  Total: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  Failed: ${data.metrics.http_req_failed.values.passes} (${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%)\n\n`;

  // Response time
  summary += `${indent}Response Time:\n`;
  summary += `${indent}  Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  p50: ${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms\n`;
  summary += `${indent}  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;

  // VUs
  summary += `${indent}Virtual Users:\n`;
  summary += `${indent}  Max: ${data.metrics.vus_max.values.max}\n\n`;

  // Thresholds
  const thresholdsOk = Object.values(data.metrics)
    .filter(m => m.thresholds)
    .every(m => Object.values(m.thresholds).every(t => t.ok));

  summary += `${indent}Thresholds: ${thresholdsOk ? '✓ PASSED' : '✗ FAILED'}\n`;

  return summary;
}
