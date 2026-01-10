# Monitoring & Observability Setup Guide

**Status:** Documentation for production monitoring infrastructure
**Target:** Instagram/WHOOP-level operational maturity
**Last Updated:** January 5, 2026

---

## Overview

This guide documents the complete monitoring setup for production deployment. The monitoring stack provides real-time error tracking, performance monitoring, uptime alerts, and cost tracking.

**Goals:**
- **Mean Time to Detect (MTTD):** < 5 minutes for P0 incidents
- **Mean Time to Resolve (MTTR):** < 15 minutes for P0 incidents
- **Uptime:** 99.9% SLA (8.76 hours downtime per year maximum)
- **Error Rate:** < 0.1% of all requests

---

## Monitoring Stack

### Production Monitoring Tools

| Tool | Purpose | Cost | Priority |
|------|---------|------|----------|
| **Sentry** | Error tracking, performance monitoring | $26/month (Team plan) | P0 CRITICAL |
| **Betterstack** | Log aggregation, uptime monitoring | $20/month | P1 HIGH |
| **Vercel Analytics** | Web vitals, edge metrics | Included | P2 MEDIUM |
| **Custom Dashboard** | Cost tracking, LLM usage | $0 (self-hosted) | P1 HIGH |

**Total Monthly Cost:** ~$50/month for production-grade observability

---

## 1. Sentry Error Tracking

### Purpose
- Capture and group errors from Next.js application
- Track performance metrics (Web Vitals, API response times)
- Monitor release health
- Alert on error spikes

### Setup Instructions

#### Step 1: Create Sentry Project

```bash
# 1. Sign up at sentry.io
# 2. Create new project (Next.js)
# 3. Copy DSN (looks like https://abc123@o123456.ingest.sentry.io/123456)
```

#### Step 2: Install Sentry SDK

```bash
cd apps/web
pnpm add @sentry/nextjs
```

#### Step 3: Initialize Sentry

```bash
# Run Sentry wizard
npx @sentry/wizard@latest -i nextjs
```

This creates:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Updates `next.config.js`

#### Step 4: Configure Environment Variables

```bash
# .env.production
SENTRY_DSN="https://YOUR_DSN_HERE@o123456.ingest.sentry.io/123456"
NEXT_PUBLIC_SENTRY_DSN="https://YOUR_DSN_HERE@o123456.ingest.sentry.io/123456"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="aisportsagent"
SENTRY_AUTH_TOKEN="sntrys_YOUR_AUTH_TOKEN" # For source maps

# Optional: Environment tag
SENTRY_ENVIRONMENT="production" # or "staging", "development"
```

#### Step 5: Customize Sentry Configuration

**File: `sentry.client.config.ts`**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.SENTRY_ENVIRONMENT || 'production',

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions (reduces cost)

  // Session Replay (for debugging user sessions)
  replaysSessionSampleRate: 0.01, // 1% of sessions
  replaysOnErrorSampleRate: 1.0,   // 100% of errored sessions

  // Integrations
  integrations: [
    new Sentry.Replay({
      maskAllText: true,  // Privacy: mask all text
      blockAllMedia: true, // Privacy: block images/video
    }),
  ],

  // Filter out non-critical errors
  beforeSend(event, hint) {
    // Don't send 404 errors
    if (event.exception?.values?.[0]?.value?.includes('404')) {
      return null;
    }

    // Don't send ad blocker errors
    if (event.exception?.values?.[0]?.value?.includes('AdBlock')) {
      return null;
    }

    return event;
  },

  // Add user context (but protect PII)
  beforeSendTransaction(event) {
    // Strip PII from transaction names
    if (event.transaction) {
      event.transaction = event.transaction.replace(
        /\/athlete\/[a-z0-9-]+/g,
        '/athlete/[id]'
      );
    }
    return event;
  },
});
```

**File: `sentry.server.config.ts`**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'production',

  // Server-side sampling (higher rate for API errors)
  tracesSampleRate: 0.2, // 20% of API requests

  // Capture unhandled rejections
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],

  // Tag errors with server context
  beforeSend(event) {
    // Add server-specific tags
    event.tags = {
      ...event.tags,
      server: 'nextjs',
    };
    return event;
  },
});
```

#### Step 6: Add Error Boundaries

**File: `src/components/ErrorBoundary.tsx`**
```typescript
'use client';

import * as Sentry from '@sentry/nextjs';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Send to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              We've been notified and are working to fix the issue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage in layout:**
```typescript
// src/app/layout.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

#### Step 7: Manual Error Capture

```typescript
// Capture exceptions
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'chat',
      operation: 'send_message',
    },
    extra: {
      athleteId: session.user.id,
      messageLength: message.length,
    },
  });
  throw error;
}

// Capture messages (non-errors)
Sentry.captureMessage('Cost limit approaching', {
  level: 'warning',
  tags: {
    schoolId: user.schoolId,
    costUsed: usage.tokens * 0.000002,
  },
});

// Add breadcrumbs (for debugging context)
Sentry.addBreadcrumb({
  category: 'chat',
  message: 'User sent message',
  level: 'info',
  data: {
    messageLength: message.length,
  },
});
```

---

## 2. Alert Configuration

### Sentry Alert Rules

#### P0 Critical Alerts (Page Immediately)

**1. Error Rate Spike**
```yaml
Alert Name: "Error Rate Spike - P0"
Condition: Error count > 50 in 1 minute
Environment: production
Action:
  - Send email to: team@aisportsagent.com
  - Send SMS to: on-call engineer
  - Create PagerDuty incident
```

**2. 5xx Error Spike**
```yaml
Alert Name: "5xx Server Errors - P0"
Condition: 5xx responses > 10 in 1 minute
Environment: production
Action:
  - Page on-call engineer
  - Auto-create GitHub issue
```

**3. Crisis Detection Failure**
```yaml
Alert Name: "Crisis Detection Down - P0"
Condition: Zero crisis checks in 15 minutes (if chat is active)
Environment: production
Action:
  - Immediate page
  - Escalate to founder
```

#### P1 High Priority Alerts (Slack Notification)

**4. High Latency**
```yaml
Alert Name: "API Latency Degradation - P1"
Condition: p95 latency > 2000ms for 5 minutes
Environment: production
Action:
  - Send Slack notification
  - Monitor for auto-recovery
```

**5. Cost Budget Warning**
```yaml
Alert Name: "LLM Cost Budget Warning - P1"
Condition: Daily spend > $400 (80% of $500 limit)
Environment: production
Action:
  - Send Slack notification
  - Email billing team
```

**6. Auth Failure Spike**
```yaml
Alert Name: "Authentication Failures - P1"
Condition: Auth errors > 100 in 5 minutes
Environment: production
Action:
  - Send Slack notification
  - Log for security review
```

#### P2 Medium Priority Alerts (Email Only)

**7. New Release Issues**
```yaml
Alert Name: "New Release Health Check - P2"
Condition: Error rate 2x higher than previous release
Environment: production
Action:
  - Send email summary
  - Auto-create rollback ticket if errors persist > 15 min
```

### Alert Configuration in Sentry UI

```
1. Go to Sentry → Alerts → Create Alert Rule
2. Select "Issues"
3. Configure:
   - Environment: production
   - Conditions: (see above)
   - Actions:
     - Email: team@aisportsagent.com
     - Slack: #alerts channel
     - PagerDuty: engineering-oncall
4. Save
```

---

## 3. Uptime Monitoring

### Betterstack (UptimeRobot Alternative)

#### Setup

```bash
# 1. Sign up at betterstack.com
# 2. Create monitors for critical endpoints
```

#### Monitors to Create

**1. Homepage**
```yaml
URL: https://app.aisportsagent.com
Frequency: Every 1 minute
Alert if:
  - 5xx status code
  - Timeout > 10 seconds
  - 3 consecutive failures
```

**2. API Health Check**
```yaml
URL: https://app.aisportsagent.com/api/health
Frequency: Every 1 minute
Expected Response: {"status": "healthy"}
Alert if: Status not "healthy"
```

**3. Authentication**
```yaml
URL: https://app.aisportsagent.com/api/auth/session
Frequency: Every 5 minutes
Alert if: 5xx errors or timeouts
```

**4. Database Connectivity**
```yaml
URL: https://app.aisportsagent.com/api/health/db
Frequency: Every 2 minutes
Expected Response: {"database": "connected"}
Alert if: Not connected
```

#### Alert Channels

```yaml
Email: team@aisportsagent.com
SMS: +1-XXX-XXX-XXXX (on-call phone)
Slack: #uptime-alerts
PagerDuty: engineering-oncall (for P0 only)
```

---

## 4. Custom Cost Monitoring Dashboard

### Purpose
Track LLM token usage and costs in real-time to prevent budget overruns.

### Implementation

**File: `src/app/api/admin/cost-dashboard/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession();

  // Admin only
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Get cost metrics for last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const metrics = await prisma.tokenUsage.groupBy({
    by: ['schoolId'],
    where: {
      createdAt: {
        gte: yesterday,
      },
    },
    _sum: {
      inputTokens: true,
      outputTokens: true,
    },
  });

  const costData = metrics.map(m => ({
    schoolId: m.schoolId,
    totalTokens: (m._sum.inputTokens || 0) + (m._sum.outputTokens || 0),
    estimatedCost: ((m._sum.inputTokens || 0) + (m._sum.outputTokens || 0)) * 0.000002, // $2 per 1M tokens
  }));

  const totalCost = costData.reduce((sum, item) => sum + item.estimatedCost, 0);

  return NextResponse.json({
    period: '24h',
    totalCost: totalCost.toFixed(2),
    bySchool: costData,
    budgetLimit: 500,
    budgetUsed: ((totalCost / 500) * 100).toFixed(1),
  });
}
```

**Dashboard Component:**
```typescript
// src/components/admin/CostDashboard.tsx
'use client';

import { useEffect, useState } from 'react';

export function CostDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/admin/cost-dashboard');
      const json = await res.json();
      setData(json);
    }

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  if (!data) return <div>Loading...</div>;

  const budgetPercentage = parseFloat(data.budgetUsed);
  const isWarning = budgetPercentage > 80;
  const isCritical = budgetPercentage > 95;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">LLM Cost Dashboard</h2>

      {/* Budget Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Daily Budget</span>
          <span className="text-sm font-medium">${data.totalCost} / $500</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full ${
              isCritical ? 'bg-red-600' :
              isWarning ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-1">{data.budgetUsed}% used</p>
      </div>

      {/* Alerts */}
      {isCritical && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          🚨 CRITICAL: Budget limit approaching! Circuit breaker will trigger at $500.
        </div>
      )}

      {isWarning && !isCritical && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          ⚠️ WARNING: 80% of daily budget used.
        </div>
      )}

      {/* Per-School Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Cost by School</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">School</th>
              <th className="text-right py-2">Tokens</th>
              <th className="text-right py-2">Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.bySchool.map((school: any) => (
              <tr key={school.schoolId} className="border-b">
                <td className="py-2">{school.schoolId}</td>
                <td className="text-right">{school.totalTokens.toLocaleString()}</td>
                <td className="text-right">${school.estimatedCost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 5. Performance Monitoring

### Web Vitals Tracking

**File: `src/lib/analytics.ts`**
```typescript
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';
import * as Sentry from '@sentry/nextjs';

export function reportWebVitals() {
  onCLS((metric) => {
    Sentry.setMeasurement('CLS', metric.value, 'ratio');
  });

  onFID((metric) => {
    Sentry.setMeasurement('FID', metric.value, 'millisecond');
  });

  onFCP((metric) => {
    Sentry.setMeasurement('FCP', metric.value, 'millisecond');
  });

  onLCP((metric) => {
    Sentry.setMeasurement('LCP', metric.value, 'millisecond');
  });

  onTTFB((metric) => {
    Sentry.setMeasurement('TTFB', metric.value, 'millisecond');
  });
}
```

**Usage in `_app.tsx`:**
```typescript
import { reportWebVitals } from '@/lib/analytics';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    reportWebVitals();
  }, []);

  return <Component {...pageProps} />;
}
```

### API Performance Tracking

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function middleware(request: NextRequest) {
  const start = Date.now();

  const response = await NextResponse.next();

  const duration = Date.now() - start;

  // Track slow API calls
  if (duration > 1000) { // > 1 second
    Sentry.captureMessage('Slow API response', {
      level: 'warning',
      tags: {
        endpoint: request.nextUrl.pathname,
        method: request.method,
      },
      extra: {
        duration,
      },
    });
  }

  return response;
}
```

---

## 6. Incident Response Procedures

### When Alert Fires

#### P0 Critical Alert (< 5 minute response)

```
1. ACKNOWLEDGE alert in PagerDuty (stops re-paging)
2. CHECK monitoring dashboards:
   - Sentry: Error spike details
   - Betterstack: Uptime status
   - Vercel: Deployment status
3. TRIAGE severity:
   - Is service down completely? → Immediate rollback
   - Is service degraded? → Investigate root cause
   - Is it a false alarm? → Adjust alert threshold
4. MITIGATE:
   - Rollback if recent deployment
   - Enable kill switch if specific feature failing
   - Scale up if infrastructure overload
5. COMMUNICATE:
   - Post status update to status page
   - Notify affected users if needed
6. RESOLVE and document incident
```

#### P1 High Alert (< 15 minute response)

```
1. REVIEW alert details in Sentry
2. CHECK if auto-recovery happening
3. INVESTIGATE root cause
4. FIX if simple (< 5 minutes), otherwise create ticket
5. MONITOR for recurrence
```

#### P2 Medium Alert (< 1 hour response)

```
1. CREATE GitHub issue with alert details
2. TRIAGE for next sprint
3. MONITOR trends
```

### Post-Incident Review (Within 24 hours)

```markdown
## Incident Report Template

**Date:** YYYY-MM-DD
**Duration:** X minutes
**Severity:** P0/P1/P2
**Impact:** X users affected

**Timeline:**
- HH:MM - Alert fired
- HH:MM - Acknowledged
- HH:MM - Root cause identified
- HH:MM - Mitigation deployed
- HH:MM - Resolved

**Root Cause:**
(What happened and why)

**Resolution:**
(How it was fixed)

**Action Items:**
- [ ] Update monitoring threshold
- [ ] Add integration test
- [ ] Improve documentation
- [ ] Schedule architectural fix

**Lessons Learned:**
(What we'll do differently next time)
```

---

## 7. Monitoring Checklist

### Pre-Production

- [ ] Sentry SDK installed and configured
- [ ] Environment variables set (SENTRY_DSN)
- [ ] Error boundaries added to all routes
- [ ] Alert rules configured in Sentry
- [ ] Uptime monitors created (Betterstack)
- [ ] Cost dashboard deployed
- [ ] Test error capture (manually trigger error)
- [ ] Test alert delivery (send test alert)
- [ ] Document on-call rotation
- [ ] Create incident response runbook

### Daily Operations

- [ ] Check Sentry dashboard for new errors
- [ ] Review cost dashboard (budget status)
- [ ] Verify uptime monitors passing
- [ ] Check for security alerts (Dependabot)

### Weekly Operations

- [ ] Review error trends (are new errors appearing?)
- [ ] Check performance metrics (p95 latency trends)
- [ ] Review audit logs for anomalies
- [ ] Update alert thresholds based on actual usage

### Monthly Operations

- [ ] Review all alert rules (any false positives?)
- [ ] Conduct incident response drill
- [ ] Review and update on-call rotation
- [ ] Cost optimization review

---

## 8. Testing Monitoring Setup

### Test Error Capture

```typescript
// Create test route: src/app/api/test-error/route.ts
export async function GET() {
  throw new Error('Test error - monitoring verification');
}

// Visit: https://app.aisportsagent.com/api/test-error
// Check: Sentry dashboard should show error within 30 seconds
```

### Test Alert Delivery

```bash
# 1. In Sentry, go to Alert Rule
# 2. Click "Send Test Notification"
# 3. Verify email/Slack/PagerDuty receives alert
```

### Test Uptime Monitoring

```bash
# Temporarily break health check
# Monitor should detect failure and send alert within 2 minutes
```

---

## 9. Monitoring Metrics to Track

### Error Metrics

- **Error Rate:** Errors per 1000 requests (target: < 1)
- **5xx Rate:** Server errors per 1000 requests (target: < 0.5)
- **Error Types:** Top 10 most frequent errors
- **Affected Users:** % of users experiencing errors (target: < 1%)

### Performance Metrics

- **API Latency p50:** Median response time (target: < 100ms)
- **API Latency p95:** 95th percentile (target: < 500ms)
- **API Latency p99:** 99th percentile (target: < 1000ms)
- **LCP (Largest Contentful Paint):** Page load speed (target: < 2.5s)
- **CLS (Cumulative Layout Shift):** Visual stability (target: < 0.1)

### Business Metrics

- **Active Users:** Daily/weekly/monthly active users
- **Chat Messages:** Total messages sent per day
- **Crisis Alerts:** Number of crisis alerts triggered
- **Token Usage:** LLM tokens consumed (for cost tracking)
- **Coach Engagement:** % of coaches logging in weekly

### Cost Metrics

- **Daily LLM Cost:** Total OpenAI spend per day
- **Cost Per User:** LLM cost divided by active users
- **Cost Per Message:** LLM cost divided by messages sent
- **Budget Utilization:** % of daily budget used

---

## 10. Next Steps After Setup

1. **Deploy Sentry to staging first**
   - Verify error capture works
   - Test alert delivery
   - Validate source maps uploaded correctly

2. **Configure production alerts**
   - Start with conservative thresholds
   - Adjust based on actual traffic patterns
   - Avoid alert fatigue (too many false positives)

3. **Create status page** (optional)
   - Use statuspage.io or similar
   - Display uptime metrics publicly
   - Automated incident updates

4. **Document runbooks**
   - One runbook per alert type
   - Step-by-step resolution procedures
   - Include rollback commands

5. **Establish on-call rotation**
   - Who responds to P0 alerts?
   - Backup on-call engineer
   - Escalation procedures

---

## Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Betterstack Uptime Docs](https://betterstack.com/docs/uptime/)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Incident Response Best Practices](https://www.atlassian.com/incident-management/incident-response)

---

**CRITICAL:** Do NOT enable monitoring in production until:
1. All configuration tested in staging
2. Alert thresholds validated
3. On-call rotation established
4. Incident response procedures documented

**Status:** Ready for staging deployment and testing
