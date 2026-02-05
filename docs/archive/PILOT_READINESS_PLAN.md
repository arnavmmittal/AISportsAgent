# Pilot Readiness Plan: 85% → 95%+ for UW Public Testing

**Target:** Safe public pilot with 1-2 coaches, 50-150 athletes at University of Washington
**Current Readiness:** 85%
**Target Readiness:** 95%+ (Instagram/WHOOP-level for pilot scale)
**Timeline:** Implement all blockers before pilot launch

---

## Executive Summary

**Pilot Context:**
- **Users:** 1-2 coaches, 50-150 athletes (real UW students)
- **Data:** Real mental health data (anxiety, stress, crisis situations)
- **Compliance:** FERPA-compliant, consent-based, audit-tracked
- **Risk:** Student safety depends on crisis detection working perfectly
- **Scope:** Public but controlled - can monitor closely, rollback quickly

**Key Difference from Full Production:**
- ✅ **Same security rigor** (mental health data requires 100% protection)
- ✅ **Same safety measures** (crisis detection, consent, audit logs)
- ✅ **Same data protection** (encryption, RLS, multi-tenant isolation)
- ⚠️ **Different scale** (150 users vs 10,000 users)
- ⚠️ **More manual monitoring** (can watch dashboards daily vs fully automated)
- ⚠️ **Direct support** (founder available vs on-call rotation)

---

## Gap Analysis: 85% → 95%+ Pilot Readiness

### Critical Gaps (10% total)

#### Gap 1: RLS Policies Not Deployed (5% gap) 🚨 BLOCKER

**Current State:**
- ✅ RLS SQL files created (728 lines across 5 files)
- ✅ Policies cover all 40 tables
- ❌ **NOT deployed to Supabase** (neither staging nor production)
- ❌ **NOT tested against live database**

**Risk if Not Fixed:**
- University A coach could see University B athlete data
- FERPA violation, contract termination, lawsuits
- **Cannot launch pilot without this**

**Required Actions:**
1. ✅ Deploy RLS policies to local Supabase (test queries work)
2. ✅ Deploy to staging Supabase
3. ✅ Run integration tests against staging
4. ✅ Verify cross-tenant queries fail as expected
5. ✅ Deploy to production Supabase (when pilot approved)

**Effort:** 2-3 hours
**Priority:** P0 CRITICAL BLOCKER

---

#### Gap 2: Monitoring Not Configured (3% gap) 🚨 BLOCKER

**Current State:**
- ✅ Monitoring guide created (650 lines)
- ✅ Sentry SDK code examples ready
- ❌ **Sentry NOT configured in staging**
- ❌ **No error tracking in place**
- ❌ **No alerts configured**
- ❌ **Flying blind if issues occur**

**Risk if Not Fixed:**
- Cannot detect when crisis detection fails
- Cannot detect when athletes get errors
- Cannot diagnose issues during pilot
- **Cannot responsibly launch pilot without monitoring**

**Required Actions:**
1. ✅ Sign up for Sentry (free tier OK for pilot)
2. ✅ Install @sentry/nextjs SDK
3. ✅ Configure client + server Sentry
4. ✅ Add error boundaries to critical pages
5. ✅ Configure 3 critical alerts:
   - P0: Error rate spike (>10 errors/min)
   - P0: Crisis detection failure
   - P1: API latency >2s
6. ✅ Test error capture (trigger test error)
7. ✅ Set up Betterstack uptime monitoring

**Effort:** 3-4 hours
**Priority:** P0 CRITICAL BLOCKER

---

#### Gap 3: Integration Tests Not Run (2% gap) ⚠️ HIGH

**Current State:**
- ✅ Integration tests written (20+ tests, 1,053 lines)
- ✅ Tests cover all critical security boundaries
- ❌ **NOT run against actual database**
- ❌ **Cannot verify RLS policies work**
- ❌ **Cannot verify multi-tenant isolation**

**Risk if Not Fixed:**
- Security boundaries not verified
- RLS policies might have bugs
- Multi-tenant isolation not tested
- **High risk of data leakage in pilot**

**Required Actions:**
1. ✅ Set up local test database (Supabase local)
2. ✅ Run integration tests locally
3. ✅ Fix any test failures
4. ✅ Run against staging database
5. ✅ Verify all 20+ tests pass

**Effort:** 2-3 hours
**Priority:** P0 CRITICAL (must pass before pilot)

---

### High Priority Gaps (5% total)

#### Gap 4: Audit Logging Incomplete (2% gap) ⚠️ HIGH

**Current State:**
- ✅ AuditLog table in database schema
- ✅ Audit logging tests written
- ⏳ **Partial implementation** (consent changes logged)
- ❌ **Coach data access NOT logged** (FERPA requirement)
- ❌ **Crisis alert reviews NOT logged**
- ❌ **Data exports NOT logged**

**Risk if Not Fixed:**
- FERPA compliance questionable
- Cannot track who accessed what data
- Cannot prove consent was respected
- **Medium risk for pilot** (can add during pilot if needed)

**Required Actions:**
1. ✅ Create audit logging middleware
2. ✅ Log all coach access to athlete data
3. ✅ Log all crisis alert reviews
4. ✅ Log consent changes (already done)
5. ✅ Create audit log viewer (admin dashboard)

**Effort:** 4-5 hours
**Priority:** P1 HIGH (should have for pilot, can add early in pilot if needed)

---

#### Gap 5: Cost Controls Not Fully Tested (1.5% gap) ⚠️ MEDIUM-HIGH

**Current State:**
- ✅ Cost control middleware implemented (258 lines)
- ✅ Unit tests pass (17/17)
- ⏳ **Circuit breaker logic tested in unit tests**
- ❌ **NOT tested in production-like environment**
- ❌ **Budget alerts NOT configured** (no email/Slack)

**Risk if Not Fixed:**
- Could exceed $500/day budget during pilot
- Runaway LLM costs if bug or attack
- **Medium risk** ($500/day cap exists, but alerts important)

**Required Actions:**
1. ✅ Test circuit breaker in staging (simulate budget exceeded)
2. ✅ Configure budget alert emails
3. ✅ Set up cost monitoring dashboard
4. ✅ Document emergency cost kill switch procedure

**Effort:** 2-3 hours
**Priority:** P1 HIGH (important for pilot financial protection)

---

#### Gap 6: Crisis Detection Not Production-Hardened (1.5% gap) ⚠️ HIGH

**Current State:**
- ✅ Crisis detection logic implemented (regex + keyword matching)
- ✅ Crisis alerts table in database
- ⏳ **Basic detection works** (suicide keywords detected)
- ❌ **No AI-powered detection layer** (only regex)
- ❌ **No escalation timeout alerts** (if coach doesn't respond in 5 min)
- ❌ **No test for coded language** ("unalive", "not wake up")

**Risk if Not Fixed:**
- Might miss crisis situations in coded language
- Coaches might not respond quickly enough
- **HIGH RISK** (student safety critical)

**Required Actions:**
1. ✅ Add OpenAI moderation API check (in addition to regex)
2. ✅ Implement escalation timeout (alert if not reviewed in 5 min)
3. ✅ Test coded language detection ("unalive" → triggers alert)
4. ✅ Create crisis detection test suite (10+ scenarios)
5. ✅ Document crisis escalation procedures

**Effort:** 4-5 hours
**Priority:** P0 CRITICAL (student safety depends on this)

---

### Medium Priority Gaps (Not Blockers for Pilot)

#### Gap 7: Field-Level Encryption Not Implemented (covered by database encryption)

**Current State:**
- ⏳ Supabase provides database encryption at rest
- ❌ ChatSummary.summary not encrypted at field level
- ❌ Encryption library created but not integrated

**Decision for Pilot:**
- ✅ **Supabase encryption sufficient for pilot** (not a blocker)
- 🔄 **Implement field-level encryption in Phase 2** (before multi-university)

**Rationale:**
- Supabase already encrypts database at rest
- Single university pilot (no cross-tenant risk)
- Can add before scaling to multiple universities

**Priority:** P2 MEDIUM (post-pilot)

---

#### Gap 8: Automated Dependency Scanning Not Set Up

**Current State:**
- ✅ npm audit runs manually
- ❌ Dependabot not configured
- ❌ No automated security PRs

**Decision for Pilot:**
- ✅ **Run npm audit manually weekly** (acceptable for pilot)
- 🔄 **Set up Dependabot before multi-university** (Phase 2)

**Priority:** P2 MEDIUM (post-pilot)

---

#### Gap 9: E2E Tests Not Created

**Current State:**
- ✅ Unit tests: 71 tests passing
- ✅ Integration tests: 20+ tests written
- ❌ E2E tests (Playwright): Not created

**Decision for Pilot:**
- ✅ **Manual testing sufficient for pilot** (founder can test workflows)
- 🔄 **Create E2E tests before scaling** (Phase 2)

**Priority:** P2 MEDIUM (post-pilot)

---

## Pilot Readiness Score Breakdown

### Before Implementation (85%)

| Category | Score | Weight | Weighted Score |
|----------|-------|--------|----------------|
| **Authentication & Authorization** | 70% | 15% | 10.5% |
| **Data Protection (RLS)** | 60% | 20% | 12.0% ❌ |
| **Input Validation** | 100% | 10% | 10.0% |
| **Security Headers** | 100% | 5% | 5.0% |
| **Rate Limiting** | 90% | 5% | 4.5% |
| **Cost Controls** | 80% | 10% | 8.0% |
| **Monitoring & Alerts** | 0% | 15% | 0.0% ❌ |
| **Crisis Detection** | 70% | 10% | 7.0% |
| **Audit Logging** | 40% | 5% | 2.0% |
| **Testing** | 70% | 5% | 3.5% |
| **Total** | | **100%** | **62.5%** |

**Actual Weighted Score: 62.5% (worse than 85% when weighted by criticality)**

---

### After Implementation (Target: 95%+)

| Category | Score | Weight | Weighted Score |
|----------|-------|--------|----------------|
| **Authentication & Authorization** | 95% | 15% | 14.25% ✅ |
| **Data Protection (RLS)** | 100% | 20% | 20.0% ✅ |
| **Input Validation** | 100% | 10% | 10.0% ✅ |
| **Security Headers** | 100% | 5% | 5.0% ✅ |
| **Rate Limiting** | 95% | 5% | 4.75% ✅ |
| **Cost Controls** | 95% | 10% | 9.5% ✅ |
| **Monitoring & Alerts** | 90% | 15% | 13.5% ✅ |
| **Crisis Detection** | 95% | 10% | 9.5% ✅ |
| **Audit Logging** | 90% | 5% | 4.5% ✅ |
| **Testing** | 95% | 5% | 4.75% ✅ |
| **Total** | | **100%** | **95.75%** ✅ |

**Target Weighted Score: 95.75%**

---

## Implementation Plan: 85% → 95%+

### Phase 1: Critical Blockers (P0) - MUST DO BEFORE PILOT

**Estimated Time:** 12-15 hours total

#### 1.1 Deploy RLS Policies (2-3 hours)

```bash
# Step 1: Test locally
psql $LOCAL_DATABASE_URL -f 20250105_enable_rls_core_tables.sql
psql $LOCAL_DATABASE_URL -f 20250105_enable_rls_chat_tables.sql
psql $LOCAL_DATABASE_URL -f 20250105_enable_rls_wellbeing_tables.sql
psql $LOCAL_DATABASE_URL -f 20250105_enable_rls_knowledge_analytics.sql
psql $LOCAL_DATABASE_URL -f 20250105_enable_rls_audit_system.sql

# Step 2: Verify policies exist
psql $LOCAL_DATABASE_URL -c "SELECT schemaname, tablename, policyname FROM pg_policies;"

# Step 3: Test cross-tenant query (should return 0 rows)
# Create test data for School A and School B
# Try to query School B data with School A filter → should fail

# Step 4: Deploy to staging Supabase
# (via Supabase SQL Editor)

# Step 5: Run integration tests
pnpm run test:integration
```

**Acceptance Criteria:**
- ✅ All 40 tables have RLS enabled
- ✅ Policies visible in pg_policies table
- ✅ Cross-tenant queries return empty results
- ✅ Integration tests pass (20+ tests)

---

#### 1.2 Configure Monitoring (3-4 hours)

```bash
# Step 1: Sign up for Sentry
# Free tier: 5K errors/month (sufficient for pilot)

# Step 2: Install SDK
pnpm add @sentry/nextjs

# Step 3: Run wizard
npx @sentry/wizard@latest -i nextjs

# Step 4: Configure environment variables
# .env.local
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...

# Step 5: Add error boundaries (copy from MONITORING_SETUP_GUIDE.md)

# Step 6: Configure alerts in Sentry UI
# - P0: Error rate > 10/min
# - P0: Crisis detection keyword in error
# - P1: Latency > 2s

# Step 7: Test error capture
# Visit /api/test-error → verify appears in Sentry

# Step 8: Set up Betterstack uptime
# Monitor: https://app.flowsportscoach.com/api/health
```

**Acceptance Criteria:**
- ✅ Sentry captures errors in staging
- ✅ Alerts fire when test error triggered
- ✅ Email received for P0 alerts
- ✅ Uptime monitor pings /api/health every 1 min

---

#### 1.3 Harden Crisis Detection (4-5 hours)

**File:** `/src/lib/crisis-detection.ts` (create new)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Existing regex patterns
const CRISIS_KEYWORDS = [
  /suicid/i,
  /kill myself/i,
  /end (my|it all)/i,
  /not worth living/i,
  /better off dead/i,
  /self[- ]?harm/i,
];

// Coded language patterns
const CODED_PATTERNS = [
  /unalive/i,
  /not wake up/i,
  /go to sleep forever/i,
  /final solution/i,
];

export async function detectCrisis(message: string): Promise<{
  isCrisis: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  detectedBy: 'regex' | 'coded' | 'ai' | 'multiple';
  reasons: string[];
}> {
  const reasons: string[] = [];
  let detectedBy: 'regex' | 'coded' | 'ai' | 'multiple' = 'regex';

  // Layer 1: Regex detection (fastest)
  const regexMatch = CRISIS_KEYWORDS.some(pattern => pattern.test(message));
  if (regexMatch) {
    reasons.push('Crisis keyword detected');
    detectedBy = 'regex';
  }

  // Layer 2: Coded language detection
  const codedMatch = CODED_PATTERNS.some(pattern => pattern.test(message));
  if (codedMatch) {
    reasons.push('Coded crisis language detected');
    detectedBy = detectedBy === 'regex' ? 'multiple' : 'coded';
  }

  // Layer 3: OpenAI Moderation API (catches edge cases)
  try {
    const moderation = await openai.moderations.create({
      input: message,
    });

    const result = moderation.results[0];
    if (result.flagged) {
      if (result.categories['self-harm'] || result.categories['self-harm/intent']) {
        reasons.push('AI detected self-harm intent');
        detectedBy = 'multiple';
      }
      if (result.categories['violence']) {
        reasons.push('AI detected violence content');
      }
    }
  } catch (error) {
    console.error('OpenAI moderation failed:', error);
    // Don't fail - regex still works
  }

  const isCrisis = regexMatch || codedMatch || reasons.length > 0;

  // Determine severity
  let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  if (reasons.length >= 2) severity = 'HIGH';
  if (regexMatch && CRISIS_KEYWORDS.some(k => k.test(message) && /suicid/.test(k.source))) {
    severity = 'HIGH'; // Explicit suicide mention
  }

  return { isCrisis, severity, detectedBy, reasons };
}
```

**Integration into chat endpoint:**

```typescript
// src/app/api/chat/stream/route.ts
import { detectCrisis } from '@/lib/crisis-detection';

export async function POST(req: Request) {
  const { message } = await req.json();

  // Crisis detection BEFORE processing message
  const crisisCheck = await detectCrisis(message);

  if (crisisCheck.isCrisis) {
    // Create crisis alert
    await prisma.crisisAlert.create({
      data: {
        athleteId: session.user.id,
        sessionId: chatSession.id,
        severity: crisisCheck.severity,
        detectedAt: new Date(),
        reviewed: false,
        detectionMethod: crisisCheck.detectedBy,
        message: message.substring(0, 500), // First 500 chars
      },
    });

    // Send immediate notification (email + SMS if HIGH severity)
    if (crisisCheck.severity === 'HIGH') {
      await sendCrisisAlert({
        athleteId: session.user.id,
        severity: 'HIGH',
        message: crisisCheck.reasons.join(', '),
      });
    }

    // Log to Sentry
    Sentry.captureMessage('Crisis detected in chat', {
      level: 'warning',
      tags: {
        severity: crisisCheck.severity,
        detectedBy: crisisCheck.detectedBy,
      },
    });
  }

  // Continue with normal chat processing...
}
```

**Escalation Timeout (new background job):**

```typescript
// src/lib/cron/check-crisis-escalation.ts
export async function checkUnreviewedCrisisAlerts() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const unreviewedAlerts = await prisma.crisisAlert.findMany({
    where: {
      reviewed: false,
      detectedAt: {
        lt: fiveMinutesAgo, // More than 5 minutes old
      },
    },
    include: {
      Athlete: {
        include: {
          User: true,
        },
      },
    },
  });

  for (const alert of unreviewedAlerts) {
    // Send escalation notification
    await sendEscalationAlert({
      alertId: alert.id,
      athleteName: alert.Athlete.User.name,
      severity: alert.severity,
      minutesUnreviewed: Math.floor(
        (Date.now() - alert.detectedAt.getTime()) / 60000
      ),
    });

    // Log to Sentry (P0 alert)
    Sentry.captureMessage('Crisis alert not reviewed after 5 minutes', {
      level: 'error',
      tags: {
        alertId: alert.id,
        severity: alert.severity,
      },
    });
  }
}

// Run every minute (via Vercel Cron or external cron service)
```

**Crisis Detection Test Suite:**

```typescript
// tests/crisis-detection.test.ts
import { describe, it, expect } from 'vitest';
import { detectCrisis } from '@/lib/crisis-detection';

describe('Crisis Detection', () => {
  it('should detect explicit suicide keywords', async () => {
    const result = await detectCrisis('I want to kill myself');
    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('HIGH');
  });

  it('should detect coded language ("unalive")', async () => {
    const result = await detectCrisis('I just want to unalive myself');
    expect(result.isCrisis).toBe(true);
    expect(result.detectedBy).toContain('coded');
  });

  it('should detect "not wake up" as coded crisis', async () => {
    const result = await detectCrisis('Sometimes I wish I wouldn\'t wake up');
    expect(result.isCrisis).toBe(true);
  });

  it('should NOT flag normal anxiety', async () => {
    const result = await detectCrisis('I feel anxious about the game tomorrow');
    expect(result.isCrisis).toBe(false);
  });

  it('should use AI for edge cases', async () => {
    const result = await detectCrisis('Everything is pointless and I can\'t do this anymore');
    // AI should catch this even if regex doesn't
    expect(result.isCrisis).toBe(true);
  });
});
```

**Acceptance Criteria:**
- ✅ Detects explicit keywords ("suicide", "kill myself")
- ✅ Detects coded language ("unalive", "not wake up")
- ✅ Uses OpenAI moderation API as backup layer
- ✅ Creates crisis alert in database
- ✅ Sends email notification for HIGH severity
- ✅ Logs to Sentry for monitoring
- ✅ Escalation timeout alerts if not reviewed in 5 min
- ✅ All crisis detection tests pass (10+ scenarios)

---

#### 1.4 Run Integration Tests (2-3 hours)

```bash
# Step 1: Set up test database
# Create .env.test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/test_db"

# Step 2: Run migrations on test DB
pnpm prisma db push

# Step 3: Run integration tests
pnpm run test:integration

# Step 4: Review results
# All 20+ tests should pass

# Step 5: If any fail, fix issues and re-run
```

**Acceptance Criteria:**
- ✅ All integration tests pass (20+ tests)
- ✅ Multi-tenant isolation verified
- ✅ Consent flow verified
- ✅ Crisis detection verified
- ✅ Performance benchmarks met

---

### Phase 2: High Priority (P1) - SHOULD DO BEFORE PILOT

**Estimated Time:** 6-8 hours total

#### 2.1 Implement Audit Logging (4-5 hours)

**File:** `/src/middleware/audit-logging.ts` (create new)

```typescript
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export interface AuditLogData {
  userId: string;
  action: 'READ' | 'WRITE' | 'UPDATE' | 'DELETE';
  resource: string;
  resourceId: string;
  metadata?: any;
  schoolId: string;
}

export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        metadata: data.metadata || {},
        schoolId: data.schoolId,
      },
    });
  } catch (error) {
    // Don't fail request if audit log fails
    console.error('Audit log failed:', error);
    // But DO alert on this (critical for compliance)
    Sentry.captureException(error, {
      tags: { critical: 'audit_log_failure' },
    });
  }
}

// Middleware wrapper for routes that need audit logging
export function withAuditLog(handler: Function, resourceType: string) {
  return async (req: NextRequest, context: any) => {
    const session = await getServerSession();
    const startTime = Date.now();

    try {
      const response = await handler(req, context);

      // Log successful access
      await logAudit({
        userId: session!.user.id,
        action: req.method === 'GET' ? 'READ' : 'WRITE',
        resource: resourceType,
        resourceId: context.params?.id || 'multiple',
        metadata: {
          endpoint: req.nextUrl.pathname,
          method: req.method,
          duration: Date.now() - startTime,
        },
        schoolId: session!.user.schoolId,
      });

      return response;
    } catch (error) {
      // Log failed access attempt
      await logAudit({
        userId: session!.user.id,
        action: 'READ',
        resource: resourceType,
        resourceId: 'error',
        metadata: {
          endpoint: req.nextUrl.pathname,
          error: error.message,
        },
        schoolId: session!.user.schoolId,
      });

      throw error;
    }
  };
}
```

**Usage in coach routes:**

```typescript
// src/app/api/coach/athletes/[id]/sessions/route.ts
import { withAuditLog } from '@/middleware/audit-logging';

async function handler(req: NextRequest, { params }: { params: { id: string } }) {
  const athleteId = params.id;

  // Verify consent
  const hasConsent = await checkConsent(session.user.id, athleteId);
  if (!hasConsent) {
    return NextResponse.json({ error: 'No consent' }, { status: 403 });
  }

  // Fetch athlete sessions
  const sessions = await prisma.chatSession.findMany({
    where: { athleteId },
  });

  return NextResponse.json(sessions);
}

export const GET = withAuditLog(handler, 'ChatSession');
```

**Audit Log Viewer (Admin Dashboard):**

```typescript
// src/app/admin/audit-logs/page.tsx
export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    include: {
      User: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  return (
    <div>
      <h1>Audit Logs (Last 24 Hours)</h1>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Resource</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{log.createdAt.toLocaleString()}</td>
              <td>{log.User.name} ({log.User.role})</td>
              <td>{log.action}</td>
              <td>{log.resource}:{log.resourceId}</td>
              <td>{JSON.stringify(log.metadata)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Acceptance Criteria:**
- ✅ All coach access to athlete data logged
- ✅ All crisis alert reviews logged
- ✅ All consent changes logged
- ✅ Audit log viewer accessible to admins
- ✅ Can query logs for compliance review

---

#### 2.2 Test Cost Controls (2-3 hours)

```bash
# Step 1: Deploy to staging

# Step 2: Simulate budget exceeded
# Create test script that makes 1000 chat requests
# Should hit circuit breaker at ~250 requests (if each uses ~2000 tokens)

# Step 3: Verify circuit breaker triggers
# - Check Redis for circuit breaker flag
# - Verify 429 responses after limit

# Step 4: Configure budget alert emails
# - Set up Sentry email for cost warnings
# - Test email delivery

# Step 5: Create cost monitoring dashboard
# - Deploy dashboard to /admin/costs
# - Verify shows real-time token usage

# Step 6: Document kill switch
# - Add to incident response runbook
# - Test manual kill switch (disable AI chat)
```

**Acceptance Criteria:**
- ✅ Circuit breaker triggers at $500/day
- ✅ Email sent at 80% budget ($400)
- ✅ Cost dashboard shows real-time usage
- ✅ Kill switch documented and tested

---

## Pilot Deployment Checklist

### Pre-Deployment (Staging)

- [ ] **Database**
  - [ ] RLS policies deployed to staging Supabase
  - [ ] Test cross-tenant queries (should fail)
  - [ ] Run integration tests (all pass)

- [ ] **Monitoring**
  - [ ] Sentry configured in staging
  - [ ] Error boundaries added
  - [ ] Test error capture works
  - [ ] Alerts configured (P0, P1)
  - [ ] Uptime monitoring active

- [ ] **Security**
  - [ ] Environment validation passes
  - [ ] Security headers verified
  - [ ] Crisis detection tested (10+ scenarios)
  - [ ] Audit logging functional

- [ ] **Testing**
  - [ ] All unit tests pass (71 tests)
  - [ ] All integration tests pass (20+ tests)
  - [ ] Manual testing: coach signup → view athletes
  - [ ] Manual testing: athlete chat → crisis detection

### Pilot Launch Day

- [ ] **Morning of Launch**
  - [ ] Deploy RLS policies to production Supabase
  - [ ] Configure Sentry for production
  - [ ] Set budget limits ($500/day)
  - [ ] Enable uptime monitoring
  - [ ] Verify health checks pass

- [ ] **User Onboarding**
  - [ ] 1-2 coaches sign up
  - [ ] Coaches invite 5-10 athletes (test batch)
  - [ ] Athletes complete onboarding
  - [ ] Test chat works for all athletes

- [ ] **Monitoring (Hour 1)**
  - [ ] Check Sentry dashboard (any errors?)
  - [ ] Check cost dashboard (usage normal?)
  - [ ] Check uptime (all green?)
  - [ ] Manually test crisis detection

- [ ] **Monitoring (Day 1)**
  - [ ] Review audit logs (any anomalies?)
  - [ ] Check all alerts functional
  - [ ] Interview 2-3 athletes (UX feedback)
  - [ ] Interview coaches (any issues?)

### Ongoing Pilot Monitoring

- [ ] **Daily** (15 min)
  - [ ] Sentry errors (any new issues?)
  - [ ] Cost dashboard (within budget?)
  - [ ] Uptime (all services green?)
  - [ ] Crisis alerts (any unreviewed?)

- [ ] **Weekly** (1 hour)
  - [ ] Review all audit logs
  - [ ] Check security metrics
  - [ ] Review athlete feedback
  - [ ] Update documentation

- [ ] **End of Week 1** (2 hours)
  - [ ] Retrospective with coaches
  - [ ] Analyze usage metrics
  - [ ] Fix any issues discovered
  - [ ] Decide: expand to 50 athletes or iterate

### Pilot Success Criteria

✅ **Safety Metrics:**
- Zero crisis alerts missed (100% detection rate)
- All crisis alerts reviewed within 5 minutes
- Zero data leakage incidents (RLS working)
- Zero security breaches

✅ **Performance Metrics:**
- < 1% error rate
- < 500ms p95 latency
- > 95% uptime
- < $50/day LLM costs (for 50 athletes)

✅ **User Metrics:**
- > 80% of athletes use chat weekly
- > 4/5 average rating from athletes
- Coaches report valuable insights
- Zero FERPA compliance issues

✅ **Technical Metrics:**
- All integration tests passing
- All monitoring alerts functional
- Audit logs complete
- Can rollback in < 2 minutes if needed

---

## Estimated Timeline

### Immediate (This Week)
**Day 1-2 (6-8 hours):**
- Deploy RLS policies (local → staging)
- Run integration tests
- Fix any test failures

**Day 3-4 (6-8 hours):**
- Configure Sentry monitoring
- Set up uptime monitoring
- Test error capture and alerts

**Day 5 (4-5 hours):**
- Harden crisis detection (AI layer + escalation)
- Test crisis scenarios
- Document procedures

**Day 6-7 (4-6 hours):**
- Implement audit logging
- Test cost controls
- Create admin dashboards

**Total: 20-27 hours** (can be split across 1-2 weeks)

### Pilot Launch (After Implementation Complete)
**Week 1:** 5-10 athletes (test batch)
**Week 2:** 20-30 athletes (if Week 1 successful)
**Week 3-4:** 50-150 athletes (full pilot)

---

## Decision: What's Required for 95%+?

**MUST HAVE (P0 - Cannot pilot without):**
1. ✅ RLS policies deployed and tested
2. ✅ Monitoring configured (Sentry + uptime)
3. ✅ Crisis detection hardened (AI layer + escalation)
4. ✅ Integration tests passing

**SHOULD HAVE (P1 - Important for pilot):**
5. ✅ Audit logging implemented
6. ✅ Cost controls tested

**NICE TO HAVE (P2 - Can add during pilot):**
7. ⏸️ Field-level encryption (Supabase encryption sufficient for now)
8. ⏸️ Automated dependency scanning (manual acceptable)
9. ⏸️ E2E tests (manual testing acceptable)

**Pilot Readiness After P0+P1:** **95%+** ✅

---

**Ready to proceed with implementation?** I can start with the highest priority items (RLS deployment + monitoring) and work through the checklist systematically.
