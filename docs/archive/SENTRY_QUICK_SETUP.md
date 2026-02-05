# Sentry Quick Setup for Pilot

**Purpose:** Error tracking and monitoring for UW pilot testing (50-150 athletes)
**Time:** 30 minutes
**Cost:** Free tier (5K errors/month - sufficient for pilot)

---

## Step 1: Create Sentry Account (5 min)

```bash
# 1. Go to https://sentry.io/signup/
# 2. Sign up with GitHub or email
# 3. Create organization: "Flow Sports Coach"
# 4. Create project: "Web App" (Next.js)
# 5. Copy DSN (looks like: https://abc123@o123456.ingest.sentry.io/123456)
```

---

## Step 2: Install SDK (2 min)

```bash
cd apps/web
pnpm add @sentry/nextjs
```

---

## Step 3: Run Sentry Wizard (3 min)

```bash
npx @sentry/wizard@latest -i nextjs
```

This creates:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Updates `next.config.js`

---

## Step 4: Configure Environment Variables (2 min)

**File: `.env.local`**
```bash
SENTRY_DSN=https://YOUR_DSN_HERE@o123456.ingest.sentry.io/123456
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_DSN_HERE@o123456.ingest.sentry.io/123456
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=web-app
SENTRY_AUTH_TOKEN=sntrys_YOUR_TOKEN  # For source maps
```

---

## Step 5: Update Sentry Config for Pilot (5 min)

**File: `sentry.client.config.ts`**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Sample 10% of transactions (pilot scale)
  tracesSampleRate: 0.1,

  // Don't track sessions for pilot (reduces noise)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0, // But do capture errored sessions

  // Filter out noise
  beforeSend(event) {
    // Ignore 404 errors
    if (event.exception?.values?.[0]?.value?.includes('404')) {
      return null;
    }
    return event;
  },
});
```

---

## Step 6: Test Error Capture (3 min)

**Create test route: `src/app/api/sentry-test/route.ts`**
```typescript
export async function GET() {
  throw new Error('Sentry test error - monitoring verification');
}
```

**Test:**
```bash
# Start dev server
pnpm dev

# Visit http://localhost:3000/api/sentry-test
# Should see error in Sentry dashboard within 30 seconds
```

---

## Step 7: Configure Alerts (10 min)

**In Sentry Dashboard:**

1. Go to **Alerts** → **Create Alert Rule**

2. **P0 Critical: Error Rate Spike**
   - Condition: `errors > 10 in 5 minutes`
   - Action: Email to your email
   - Frequency: Immediately

3. **P0 Critical: Crisis Detection Keywords**
   - Condition: Error message contains "crisis"
   - Action: Email immediately
   - Frequency: Every occurrence

4. **P1 High: Performance Degradation**
   - Condition: `p95 latency > 2000ms for 5 minutes`
   - Action: Email
   - Frequency: Once per hour

---

## Step 8: Set Up Uptime Monitoring (5 min)

**Option A: Betterstack (recommended)**
```bash
# 1. Sign up at https://betterstack.com/uptime
# 2. Create monitor:
#    URL: https://your-app.vercel.app/api/health
#    Frequency: Every 1 minute
#    Alert: Email when down for 2 minutes
```

**Option B: UptimeRobot (free)**
```bash
# 1. Sign up at https://uptimerobot.com
# 2. Create HTTP(S) monitor
# 3. URL: https://your-app.vercel.app
# 4. Interval: 5 minutes
# 5. Alert: Email when down
```

---

## Verification Checklist

- [ ] Sentry SDK installed
- [ ] Environment variables set
- [ ] Test error appears in Sentry dashboard
- [ ] Email alert received for test error
- [ ] Uptime monitor created
- [ ] Uptime alert email received (test by turning off server)

---

## For Pilot Launch Day

**Before first athletes onboard:**
1. Verify Sentry dashboard loads
2. Check uptime monitor shows green
3. Send test error, confirm alert received
4. Keep Sentry dashboard open in browser tab

**During pilot:**
1. Check Sentry dashboard daily
2. Review errors, fix if critical
3. Monitor uptime (should be >99%)

**If error spike occurs:**
1. Check Sentry for error details
2. Check affected users
3. Fix if critical, or monitor if minor
4. Update this guide with learnings

---

## Pilot-Specific Monitoring

**What to watch for:**
- Athletes report "chat not working" → Check Sentry for API errors
- Coaches report "can't see athletes" → Check consent + RLS errors
- Any crisis alerts missed → Check crisis detection logs

**Success Metrics:**
- < 10 errors/day (with 150 users)
- < 1% error rate
- > 99% uptime
- All crisis alerts caught (0 missed)

---

## Cost for Pilot

**Sentry Free Tier:**
- 5,000 errors/month
- 10,000 performance transactions/month
- **Should be sufficient for 150-user pilot**

**If you exceed free tier:**
- Upgrade to Team plan: $26/month
- Gets you 50K errors/month

**Betterstack/UptimeRobot:**
- Free tier: 50 monitors, 1-minute checks
- **Sufficient for pilot**

**Total Monitoring Cost: $0-50/month**

---

## Quick Reference

**View errors:** https://sentry.io/organizations/YOUR_ORG/issues/
**Test error:** Visit /api/sentry-test
**Check uptime:** Betterstack or UptimeRobot dashboard
**Docs:** https://docs.sentry.io/platforms/javascript/guides/nextjs/

---

**Status:** Ready for pilot deployment after completing this setup
