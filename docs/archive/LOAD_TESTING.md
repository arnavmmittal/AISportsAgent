# Load Testing & Performance Optimization Guide

## Overview

This guide covers load testing procedures and performance optimization strategies for AI Sports Agent in production.

**Testing Tools:**
1. **k6** - Modern load testing tool (recommended)
2. **Artillery** - Alternative Node.js-based tool
3. **Vercel Analytics** - Real user monitoring
4. **Supabase Metrics** - Database performance

---

## 1. Load Testing Setup

### Install k6 (Recommended)

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Docker
docker pull grafana/k6
```

### Install Artillery (Alternative)

```bash
npm install -g artillery
```

---

## 2. Running Load Tests

### Test Stages

**1. Smoke Test (Pre-deployment)**
- **Purpose**: Verify basic functionality before full load test
- **Load**: 1-2 VUs for 1 minute
- **Run**:
  ```bash
  k6 run --stage 1m:2 apps/web/tests/load/k6-load-test.js
  ```
- **Expected**: 0% error rate, all endpoints respond

**2. Load Test (Normal Production Load)**
- **Purpose**: Verify system handles expected production traffic
- **Load**: Ramp to 50 VUs over 10 minutes
- **Run**:
  ```bash
  k6 run apps/web/tests/load/k6-load-test.js
  ```
- **Expected**:
  - p95 latency < 2000ms
  - Error rate < 1%
  - No database connection errors

**3. Stress Test (Find Breaking Point)**
- **Purpose**: Find system limits
- **Load**: Ramp to 100-200 VUs
- **Run**:
  ```bash
  k6 run --stage 5m:100 --stage 5m:200 apps/web/tests/load/k6-load-test.js
  ```
- **Expected**: Identify bottlenecks (database, OpenAI rate limits, memory)

**4. Spike Test (Sudden Traffic Surge)**
- **Purpose**: Test autoscaling and recovery
- **Load**: Sudden spike to 200 VUs for 1 minute
- **Run**:
  ```bash
  k6 run --stage 10s:200 --stage 1m:200 --stage 10s:0 apps/web/tests/load/k6-load-test.js
  ```
- **Expected**: System recovers gracefully, no cascading failures

---

## 3. Performance Benchmarks

### Target Metrics (Production)

| Metric | Target | Critical |
|--------|--------|----------|
| **p50 Latency** | < 500ms | < 1000ms |
| **p95 Latency** | < 2000ms | < 5000ms |
| **p99 Latency** | < 5000ms | < 10000ms |
| **Error Rate** | < 0.1% | < 1% |
| **Uptime** | > 99.9% | > 99% |
| **Database Query** | < 100ms avg | < 500ms avg |
| **Chat Stream Start** | < 1000ms | < 3000ms |
| **OpenAI Response** | < 3000ms | < 8000ms |

### Current Performance (Baseline)

Run baseline test to establish current performance:

```bash
# Run load test against staging
BASE_URL=https://staging.aisportsagent.com k6 run apps/web/tests/load/k6-load-test.js

# Save results
k6 run apps/web/tests/load/k6-load-test.js --out json=baseline.json
```

**Analyze results:**
```bash
# View summary
cat baseline.json | jq '.metrics | to_entries[] | select(.key | contains("http_req_duration")) | .value.values'
```

---

## 4. Identifying Bottlenecks

### Common Bottlenecks

**1. Database (Most Common)**
- **Symptom**: High p95 latency (> 2000ms) under load
- **Diagnosis**:
  ```bash
  # Check Supabase dashboard → Database → Metrics
  # Look for: CPU usage > 80%, connection pool > 90%
  ```
- **Fix**: See Database Optimization section below

**2. OpenAI API Rate Limits**
- **Symptom**: Sudden spike in 429 errors
- **Diagnosis**: Check OpenAI usage dashboard
- **Fix**: Implement request queuing, increase rate limits, or add fallback providers

**3. Memory Leaks**
- **Symptom**: Gradual performance degradation over time
- **Diagnosis**:
  ```bash
  # Monitor Vercel metrics → Functions → Memory Usage
  ```
- **Fix**: Profile with Node.js memory profiler, fix leaks

**4. Cold Starts (Serverless)**
- **Symptom**: First request in session is slow (> 3s)
- **Diagnosis**: Check Vercel function logs
- **Fix**: Keep functions warm with health check pings

**5. Inefficient Queries**
- **Symptom**: Specific endpoints consistently slow
- **Diagnosis**:
  ```bash
  # Supabase → Database → Query Performance
  # Identify queries > 1000ms
  ```
- **Fix**: Add indexes, optimize joins, paginate results

---

## 5. Database Optimization

### Add Indexes

Identify missing indexes:

```sql
-- Connect to Supabase
psql $DATABASE_URL

-- Check slow queries
SELECT
  query,
  calls,
  total_time / calls AS avg_time_ms,
  total_time
FROM pg_stat_statements
WHERE total_time / calls > 100  -- Queries averaging > 100ms
ORDER BY total_time DESC
LIMIT 20;

-- Example: Add index for chat sessions by athlete
CREATE INDEX CONCURRENTLY idx_chat_sessions_athlete_id
ON "ChatSession"(athlete_id);

-- Add index for messages by session
CREATE INDEX CONCURRENTLY idx_messages_session_id
ON "Message"(session_id);

-- Add composite index for mood logs (athlete + date)
CREATE INDEX CONCURRENTLY idx_mood_logs_athlete_date
ON "MoodLog"(athlete_id, created_at DESC);
```

### Connection Pooling

Optimize Prisma connection pool:

```typescript
// apps/web/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Optimize connection pool for production
if (process.env.NODE_ENV === 'production') {
  prisma.$connect();
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Supabase Connection Pooling:**
```bash
# Use connection pooler (6543 port instead of 5432)
DATABASE_URL="postgresql://user:password@host:6543/database?pgbouncer=true"
```

### Query Optimization

**Before (N+1 query problem):**
```typescript
// ❌ BAD: N+1 queries
const sessions = await prisma.chatSession.findMany({
  where: { athleteId: user.id },
});

for (const session of sessions) {
  const messages = await prisma.message.count({
    where: { sessionId: session.id },
  });
  session.messageCount = messages;
}
```

**After (Single query with aggregation):**
```typescript
// ✅ GOOD: Single query with _count
const sessions = await prisma.chatSession.findMany({
  where: { athleteId: user.id },
  include: {
    _count: {
      select: { Message: true },
    },
  },
});
```

---

## 6. API Optimization

### Caching Strategy

**1. Response Caching (Vercel)**
```typescript
// apps/web/src/app/api/athletes/route.ts
export const revalidate = 60; // Cache for 60 seconds

export async function GET(request: NextRequest) {
  // Response will be cached by Vercel Edge Network
  const athletes = await prisma.athlete.findMany();
  return NextResponse.json(athletes);
}
```

**2. In-Memory Caching (Redis)**
```typescript
// apps/web/src/lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch and cache
  const data = await fetcher();
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
}

// Usage:
const athletes = await getCachedOrFetch(
  `athletes:${schoolId}`,
  () => prisma.athlete.findMany({ where: { schoolId } }),
  300 // 5 minutes
);
```

### Streaming Optimization

**Reduce Time to First Byte (TTFB):**

```typescript
// apps/web/src/app/api/chat/stream/route.ts

// ❌ BAD: Wait for full history before streaming
const history = await prisma.message.findMany({ take: 100 });
const stream = await openai.chat.completions.create({ messages: history });

// ✅ GOOD: Start streaming immediately, fetch history in parallel
const stream = new ReadableStream({
  async start(controller) {
    // Send immediate acknowledgment
    controller.enqueue(encoder.encode('data: {"type":"session","data":{"sessionId":"..."}}\n\n'));

    // Fetch history in background
    const historyPromise = prisma.message.findMany({ take: 10 }); // Limit to 10

    // Start OpenAI stream immediately (with minimal context)
    const openaiStream = await openai.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      stream: true,
    });

    // Stream tokens as they arrive
    for await (const chunk of openaiStream) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
    }
  }
});
```

---

## 7. OpenAI Cost & Performance Optimization

### Token Optimization

**1. Reduce Context Size**
```typescript
// ❌ BAD: Send full history (expensive, slow)
const history = await prisma.message.findMany({
  where: { sessionId },
  orderBy: { createdAt: 'desc' },
});

// ✅ GOOD: Limit to recent messages
const history = await prisma.message.findMany({
  where: { sessionId },
  orderBy: { createdAt: 'desc' },
  take: 10, // Last 10 messages only
});

// ✅ BETTER: Summarize old messages
if (messageCount > 20) {
  const oldMessages = history.slice(10);
  const summary = await summarizeMessages(oldMessages);
  history = [{ role: 'system', content: `Previous context: ${summary}` }, ...history.slice(0, 10)];
}
```

**2. Use Cheaper Models for Simple Tasks**
```typescript
// Crisis detection: Use gpt-3.5-turbo (10x cheaper)
const crisisCheck = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'system', content: 'Detect crisis indicators...' }],
});

// Full conversation: Use gpt-4-turbo only when needed
const response = await openai.chat.completions.create({
  model: needsAdvancedReasoning ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo',
  messages: history,
});
```

**3. Implement Request Batching**
```typescript
// Batch multiple requests into one
const batchedRequests = [
  { task: 'crisis_detection', message: msg1 },
  { task: 'crisis_detection', message: msg2 },
  { task: 'crisis_detection', message: msg3 },
];

const results = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    {
      role: 'system',
      content: 'Process these messages and return JSON array with crisis detection results',
    },
    {
      role: 'user',
      content: JSON.stringify(batchedRequests),
    },
  ],
  response_format: { type: 'json_object' },
});
```

---

## 8. Pre-Launch Performance Checklist

Run this checklist before production deployment:

### Step 1: Baseline Performance Test

```bash
# Test against staging with realistic load
BASE_URL=https://staging.aisportsagent.com k6 run apps/web/tests/load/k6-load-test.js

# Verify results:
# - p95 latency < 2000ms ✓
# - Error rate < 1% ✓
# - No database errors ✓
```

### Step 2: Database Health Check

```sql
-- Connect to staging database
psql $STAGING_DATABASE_URL

-- Check connection pool usage
SELECT count(*) AS active_connections,
       (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_connections,
       (count(*) * 100.0 / (SELECT setting::int FROM pg_settings WHERE name = 'max_connections'))::numeric(5,2) AS percent_used
FROM pg_stat_activity
WHERE state = 'active';

-- Expected: < 50% used under load

-- Check for slow queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Expected: All queries < 100ms average
```

### Step 3: OpenAI Rate Limit Test

```bash
# Send 100 concurrent requests
for i in {1..100}; do
  curl -X POST https://staging.aisportsagent.com/api/chat/stream \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -d '{"message":"test"}' &
done

# Monitor OpenAI dashboard for rate limit errors
# Expected: No 429 errors
```

### Step 4: Memory Leak Check

```bash
# Run sustained load for 30 minutes
k6 run --stage 30m:50 apps/web/tests/load/k6-load-test.js

# Monitor Vercel → Functions → Memory Usage
# Expected: Memory stays constant (no gradual increase)
```

### Step 5: Autoscaling Test

```bash
# Spike test (sudden 10x traffic increase)
k6 run --stage 10s:200 --stage 2m:200 apps/web/tests/load/k6-load-test.js

# Verify:
# - Vercel scales up functions automatically ✓
# - No cascading failures ✓
# - Recovery within 2 minutes ✓
```

---

## 9. Continuous Performance Monitoring

### Daily Checks

```bash
# Check p95 latency (should be stable)
vercel logs --filter "duration > 2000ms" --since 24h

# Check error rate (should be < 0.1%)
sentry-cli releases deploys RELEASE_ID --finalize

# Check database performance
# Supabase Dashboard → Database → Metrics
```

### Weekly Performance Report

```bash
# Generate report
pnpm tsx scripts/weekly-performance-report.ts

# Output:
# - Average response time (p50, p95, p99)
# - Error rate by endpoint
# - Top 10 slowest queries
# - OpenAI cost breakdown
# - Database connection pool usage
```

### Performance Regression Tests

Run before each deployment:

```bash
# Run baseline test
k6 run apps/web/tests/load/k6-load-test.js --out json=current.json

# Compare to previous baseline
node scripts/compare-performance.js baseline.json current.json

# Output:
# ✓ p95 latency: 1234ms (↓ 5% from 1300ms)
# ✓ Error rate: 0.05% (stable)
# ✗ Database queries: 156ms (↑ 12% from 139ms) ⚠️

# If regression detected, investigate before deploying
```

---

## 10. Emergency Performance Fixes

### If p95 Latency Spikes in Production

**1. Check Recent Deploys**
```bash
vercel list --limit 5
# If recent deploy caused issue, rollback:
vercel rollback
```

**2. Check Database**
```sql
-- Check for long-running queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;

-- Kill slow queries if necessary
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <PID>;
```

**3. Check OpenAI**
```bash
# Check OpenAI status
curl https://status.openai.com/api/v2/status.json

# If OpenAI slow, enable fallback
# Set circuit breaker in Redis:
redis-cli SET "openai_slow" "true" EX 600  # 10 minutes
```

**4. Scale Up Database (If Needed)**
```bash
# Supabase Dashboard → Database → Compute
# Upgrade to larger instance (can downgrade later)
```

---

## 11. Load Test Results Template

After each load test, document results:

```markdown
## Load Test Results - 2025-01-04

### Test Configuration
- Tool: k6
- Duration: 20 minutes
- Max VUs: 100
- Target: https://staging.aisportsagent.com

### Results Summary

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Total Requests | 125,432 | - | - |
| Error Rate | 0.03% | < 1% | ✅ PASS |
| p50 Latency | 234ms | < 500ms | ✅ PASS |
| p95 Latency | 1,456ms | < 2000ms | ✅ PASS |
| p99 Latency | 3,123ms | < 5000ms | ✅ PASS |
| Max Response Time | 4,567ms | < 10000ms | ✅ PASS |

### Bottlenecks Identified
1. Database query for mood logs taking 300ms avg (needs index)
2. OpenAI responses occasionally > 5s (acceptable for complex queries)

### Action Items
- [ ] Add index: `CREATE INDEX idx_mood_logs_athlete_date ON "MoodLog"(athlete_id, created_at DESC)`
- [ ] Monitor OpenAI response times (set alert for p99 > 8s)

### Overall Assessment
✅ READY FOR PRODUCTION
System handles 2x expected peak load with acceptable performance.
```

---

## 12. Performance Budget

Set performance budgets for each endpoint:

| Endpoint | p95 Budget | Rationale |
|----------|-----------|-----------|
| `GET /api/health` | 50ms | Simple healthcheck, no DB |
| `POST /api/auth/login` | 500ms | User tolerance for login |
| `POST /api/chat/stream` | 1000ms | Time to first token (TTFB) |
| `GET /api/chat/[id]/messages` | 300ms | Frequent operation, should be fast |
| `POST /api/mood-logs` | 200ms | Simple insert operation |
| `GET /api/coach/summaries` | 2000ms | Complex aggregation, less frequent |

**Enforce in CI/CD:**
```yaml
# .github/workflows/performance-check.yml
- name: Performance Check
  run: |
    k6 run apps/web/tests/load/k6-load-test.js
    # Fail build if thresholds exceeded
```

---

**Last Updated:** 2025-01-04
**Version:** 1.0.0
