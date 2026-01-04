# Production Monitoring & Alerting Guide

## Overview

This guide covers the complete monitoring and alerting setup for AI Sports Agent in production.

**Monitoring Stack:**
1. **Sentry** - Error tracking and performance monitoring ($26/month)
2. **Vercel Analytics** - Web vitals and page performance (free tier)
3. **Uptime Monitoring** - UptimeRobot or similar (free tier)
4. **Database Monitoring** - Supabase built-in metrics (included)
5. **Cost Tracking** - OpenAI usage dashboard (included)

**Total Cost:** ~$26/month for professional monitoring

---

## 1. Sentry Setup (Error Tracking)

### Create Sentry Project

1. **Sign up for Sentry**: https://sentry.io
2. **Create new project**:
   - Framework: Next.js
   - Platform: JavaScript
   - Name: "aisportsagent-web" (production)
   - Name: "aisportsagent-staging" (staging)

3. **Get DSN (Data Source Name)**:
   ```
   Settings → Projects → aisportsagent-web → Client Keys (DSN)

   Example DSN:
   https://abc123@o456789.ingest.sentry.io/1234567
   ```

### Environment Variables

Add to Vercel (or `.env.local`):

```bash
# Production
SENTRY_DSN="https://abc123@o456789.ingest.sentry.io/1234567"
NEXT_PUBLIC_SENTRY_DSN="https://abc123@o456789.ingest.sentry.io/1234567"

# Staging (different project)
SENTRY_DSN="https://xyz789@o456789.ingest.sentry.io/7654321"
NEXT_PUBLIC_SENTRY_DSN="https://xyz789@o456789.ingest.sentry.io/7654321"
```

**Security:**
- `SENTRY_DSN` - Server-only (API routes, server components)
- `NEXT_PUBLIC_SENTRY_DSN` - Public (client-side, safe to expose)

### Install Sentry

```bash
cd apps/web

# Install Sentry SDK
pnpm add @sentry/nextjs

# Initialize Sentry (creates sentry.*.config.ts files)
# Note: Files already created, skip this step
pnpm dlx @sentry/wizard@latest -i nextjs
```

### Verify Installation

```bash
# Test Sentry error capture
curl -X POST http://localhost:3000/api/test-sentry

# Expected: Error appears in Sentry dashboard within 1 minute
```

---

## 2. Alert Configuration

### Sentry Alert Rules

**Set up in Sentry Dashboard → Alerts → Create Alert Rule**

#### 1. Critical Errors (Immediate Alert)

**Trigger:** Any error with `level: fatal` or `environment: production`

**Conditions:**
- Event type: `error`
- Level: `fatal`
- Environment: `production`

**Actions:**
- Send email to: `your-email@university.edu`
- Send Slack notification to: `#alerts-critical`
- PagerDuty integration (if available)

**Frequency:** Immediately

**Examples:**
- Database connection failure
- OpenAI API key invalid
- Uncaught exception in critical endpoint

---

#### 2. Error Spike Alert

**Trigger:** More than 50 errors in 5 minutes

**Conditions:**
- Event type: `error`
- Environment: `production`
- Threshold: `50 events in 5 minutes`

**Actions:**
- Send email alert
- Send Slack notification to: `#alerts-errors`

**Frequency:** Once per 30 minutes (to avoid spam)

**Examples:**
- Deployment breaks critical flow (e.g., login broken)
- Infinite error loop
- External service outage (OpenAI, Supabase)

---

#### 3. Performance Degradation

**Trigger:** p95 latency > 2000ms for `/api/chat/stream`

**Conditions:**
- Transaction: `POST /api/chat/stream`
- Metric: `p95(transaction.duration)`
- Threshold: `> 2000ms for 10 minutes`

**Actions:**
- Send email alert
- Log to #alerts-performance

**Frequency:** Once per hour

**Examples:**
- Database slow query
- OpenAI API slow responses
- High server load

---

#### 4. Authentication Failures

**Trigger:** More than 100 login failures in 10 minutes (brute force attack)

**Conditions:**
- Custom metric: `login_failure_count`
- Threshold: `> 100 in 10 minutes`

**Actions:**
- Send critical alert
- Auto-enable rate limiting (if configured)

**Frequency:** Immediately

**Examples:**
- Brute force password attack
- Credential stuffing
- Bot traffic

---

#### 5. Cost Spike Alert

**Trigger:** OpenAI spend > $100/hour (3x normal)

**Conditions:**
- Custom metric: `openai_cost_usd`
- Threshold: `> 100 per hour`

**Actions:**
- Send critical alert
- Trigger circuit breaker (if enabled)

**Frequency:** Immediately

**Examples:**
- Runaway LLM loop
- DoS attack via chat
- Misconfigured token limits

---

### Custom Metrics in Sentry

Add custom metrics to Sentry for business-specific alerts:

```typescript
// apps/web/src/lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

/**
 * Track custom metric
 */
export function trackMetric(
  metricName: string,
  value: number,
  tags?: Record<string, string>
) {
  Sentry.metrics.distribution(metricName, value, {
    tags,
  });
}

/**
 * Track login failure
 */
export function trackLoginFailure(email: string, reason: string) {
  Sentry.metrics.increment('login_failure_count', {
    tags: {
      reason,
    },
  });
}

/**
 * Track OpenAI cost
 */
export function trackOpenAICost(costUSD: number, schoolId: string) {
  Sentry.metrics.distribution('openai_cost_usd', costUSD, {
    tags: {
      school_id: schoolId,
    },
  });
}

/**
 * Track crisis detection
 */
export function trackCrisisDetection(
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  athleteId: string
) {
  Sentry.metrics.increment('crisis_detection_count', {
    tags: {
      severity,
    },
  });

  // If CRITICAL, send immediate alert
  if (severity === 'CRITICAL') {
    Sentry.captureMessage('Critical crisis detected', {
      level: 'fatal',
      extra: {
        athleteId,
        severity,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
```

**Integrate into endpoints:**

```typescript
// apps/web/src/app/api/auth/mobile/login/route.ts
import { trackLoginFailure } from '@/lib/monitoring';

// In login failure block:
if (!isValid) {
  trackLoginFailure(email, 'invalid_password');
  // ... rest of code
}
```

---

## 3. Uptime Monitoring

### UptimeRobot Setup (Free Tier)

1. **Sign up**: https://uptimerobot.com
2. **Create monitors**:

**Monitor 1: Main Application**
- Type: HTTP(s)
- URL: `https://app.aisportsagent.com`
- Monitoring Interval: 5 minutes
- Alert Contacts: `your-email@university.edu`

**Monitor 2: API Health Check**
- Type: HTTP(s)
- URL: `https://app.aisportsagent.com/api/health`
- Expected Status Code: `200`
- Monitoring Interval: 5 minutes

**Monitor 3: Database Connectivity**
- Type: HTTP(s)
- URL: `https://app.aisportsagent.com/api/health/db`
- Expected Response: `{"status":"healthy"}`
- Monitoring Interval: 5 minutes

**Alert Settings:**
- Alert When: Down for 2 minutes (after 2 failed checks)
- Send Notification To: Email, SMS (if needed)

---

## 4. Vercel Analytics

Vercel Analytics is automatically enabled for all Vercel deployments.

**View in Vercel Dashboard:**
- Analytics → Web Vitals
- View metrics: LCP, FID, CLS, TTFB
- Set up alerts for degraded performance

**Custom Event Tracking:**

```typescript
// apps/web/src/app/chat/page.tsx
import { track } from '@vercel/analytics';

export default function ChatPage() {
  const handleSendMessage = async () => {
    // Track custom event
    track('chat_message_sent', {
      athlete_id: user.id,
      session_id: sessionId,
    });
  };
}
```

---

## 5. Supabase Database Monitoring

**Built-in Metrics (Supabase Dashboard):**

1. **Database Health**:
   - Supabase Dashboard → Database → Metrics
   - Monitor: CPU usage, memory, connections

2. **Slow Queries**:
   - Supabase Dashboard → Database → Query Performance
   - Identify queries > 1000ms

3. **Connection Pool**:
   - Monitor active connections
   - Alert if > 90% pool saturation

**Set Alerts:**
- Supabase → Project Settings → Notifications
- Alert on: High CPU, connection pool exhaustion, disk full

---

## 6. Cost Monitoring (OpenAI)

**OpenAI Usage Dashboard:**
1. Login to OpenAI: https://platform.openai.com
2. Go to: Usage → Dashboard
3. View daily spend by model

**Set Budget Alerts:**
- Settings → Billing → Usage Limits
- Set soft limit: $500/month
- Set hard limit: $1000/month (stops API calls)

**Custom Cost Tracking:**

```typescript
// apps/web/src/lib/cost-tracking.ts
// Already implemented in Week 1

// Query current usage:
const usage = await getTenantUsage(schoolId);
console.log(`School ${schoolId} spent $${usage.costUSD} today`);
```

---

## 7. Incident Response Workflow

### When Alert Fires

**1. Error Spike Alert:**
```bash
# 1. Check Sentry dashboard
# URL: https://sentry.io/organizations/your-org/issues/

# 2. Identify error pattern
# Look for: Common stack trace, affected endpoint, user count

# 3. Check recent deploys
vercel list app.aisportsagent.com

# 4. Rollback if needed
vercel rollback app.aisportsagent.com
```

**2. Performance Degradation:**
```bash
# 1. Check Vercel metrics
# URL: https://vercel.com/dashboard → Analytics

# 2. Check Supabase database metrics
# URL: Supabase Dashboard → Database → Metrics

# 3. Check for slow queries
# Supabase Dashboard → Database → Query Performance

# 4. Optimize query or scale database
```

**3. Downtime Alert (UptimeRobot):**
```bash
# 1. Verify downtime
curl -I https://app.aisportsagent.com
# Expected: HTTP/2 200

# 2. Check Vercel deployment status
# URL: https://vercel.com/dashboard → Deployments

# 3. Check Supabase status
# URL: https://status.supabase.com

# 4. If down, rollback or redeploy
```

---

## 8. Dashboard & Reporting

### Weekly Health Report

Run weekly to check system health:

```bash
# apps/web/scripts/weekly-health-report.ts
pnpm tsx scripts/weekly-health-report.ts
```

**Report includes:**
- Error count by severity
- Top 10 errors (by frequency)
- Average response time (p50, p95, p99)
- Uptime percentage
- OpenAI cost (total, by school)
- Database query performance
- Crisis detections (count by severity)

### Monthly Compliance Report

For FERPA/HIPAA compliance:

```bash
# Generate audit log report
curl -X POST https://app.aisportsagent.com/api/admin/audit-logs \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }'
```

**Report includes:**
- Total data access events
- Breakdown by action type
- Unique athletes accessed
- Unique coaches accessing data
- Unauthorized access attempts

---

## 9. Testing Alerts

### Test Sentry Error Capture

```bash
# Create test error endpoint
# apps/web/src/app/api/test-sentry/route.ts

export async function GET() {
  throw new Error('Test error - triggered manually');
}
```

```bash
# Trigger test error
curl https://app.aisportsagent.com/api/test-sentry

# Expected: Error appears in Sentry dashboard within 1 minute
# Expected: Alert email sent (if configured)
```

### Test Uptime Alert

```bash
# Temporarily break health check
# apps/web/src/app/api/health/route.ts

export async function GET() {
  return new Response('DOWN', { status: 503 });
}

# Expected: UptimeRobot sends alert after 2 failed checks (2 minutes)

# Revert after test
```

### Test Cost Alert

```bash
# Manually trigger cost spike (in staging only!)
# Make 1000 chat requests in 1 minute

for i in {1..1000}; do
  curl -X POST https://staging.aisportsagent.com/api/chat/stream \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -d '{"message": "test"}'
done

# Expected: Circuit breaker triggers at $500 threshold
# Expected: Cost spike alert sent
```

---

## 10. Production Checklist

Before going live:

- [ ] Sentry project created and DSN configured
- [ ] Sentry alert rules configured (5+ rules)
- [ ] UptimeRobot monitors created (3+ monitors)
- [ ] Vercel Analytics enabled
- [ ] Supabase alerts configured
- [ ] OpenAI budget limits set ($500 soft, $1000 hard)
- [ ] Incident response playbook documented
- [ ] Test alerts triggered and verified
- [ ] On-call rotation established (or solo founder has pager)

---

## 11. Cost Optimization

**Sentry:**
- Free tier: 5K errors/month
- Paid tier: $26/month for 50K errors/month
- Tip: Reduce sample rate in production (10% vs 100%)

**UptimeRobot:**
- Free tier: 50 monitors, 5-minute intervals
- Paid tier: Not needed for MVP

**Vercel Analytics:**
- Included in all Vercel plans

**Total:** ~$26/month for professional monitoring

---

## 12. Next Steps

After monitoring is set up:

1. **Week 1**: Monitor all alerts daily
2. **Week 2**: Tune alert thresholds (reduce false positives)
3. **Week 3**: Set up automated responses (e.g., auto-rollback on critical errors)
4. **Week 4**: Create runbooks for common incidents

---

**Last Updated:** 2025-01-04
**Version:** 1.0.0
