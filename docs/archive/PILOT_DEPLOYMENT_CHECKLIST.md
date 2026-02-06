# Pilot Deployment Checklist: UW Testing (50-150 Athletes)

**Target Readiness:** 95%+ for safe public pilot with real athletes
**Current Status:** Implementation complete, ready for deployment
**Timeline:** 2-4 hours to complete all tasks

---

## ✅ What's Already Done (Implementation Complete)

### Security & Data Protection
- ✅ RLS policy SQL files created (5 files, 728 lines)
- ✅ RLS deployment script (`scripts/deploy-rls.sh`)
- ✅ RLS verification script (`scripts/verify-rls.ts`)
- ✅ Environment validation (`src/lib/env-validation.ts`)
- ✅ Security headers in middleware
- ✅ Input validation schemas (Zod)
- ✅ Cost control middleware
- ✅ Rate limiting middleware

### Crisis Detection (Safety Net)
- ✅ Crisis detection module (`src/lib/crisis-detection.ts`)
- ✅ Multi-layer detection (keywords + coded language + AI)
- ✅ Test suite for crisis scenarios
- ✅ Crisis resources for athletes

### Monitoring & Logging
- ✅ Audit logging middleware (`src/middleware/audit-logging.ts`)
- ✅ Sentry quick setup guide (`docs/SENTRY_QUICK_SETUP.md`)
- ✅ Cost monitoring dashboard component
- ✅ Integration test suite (20+ tests)

### Documentation
- ✅ Pilot readiness plan (PILOT_READINESS_PLAN.md)
- ✅ Monitoring setup guide (MONITORING_SETUP_GUIDE.md)
- ✅ CI/CD testing guide (CI_CD_TESTING_GUIDE.md)
- ✅ Production security checklist

---

## 🔧 Tasks to Complete Before Pilot (2-4 hours)

### Phase 1: Database Security (30-45 min)

#### Task 1.1: Deploy RLS Policies to Local Database
```bash
cd apps/web

# Set up local Supabase (if not already)
# Follow: https://supabase.com/docs/guides/getting-started/local-development

# Deploy RLS policies locally
./scripts/deploy-rls.sh local

# Expected output:
# ✓ Database connection successful
# ✓ Backup saved
# ✓ All migrations applied
# ✓ All tables have RLS enabled
# ✓ Total policies: 80+
```

**Acceptance Criteria:**
- [ ] Script completes without errors
- [ ] All 5 migration files applied
- [ ] Policy count >= 80
- [ ] No tables without RLS

#### Task 1.2: Verify RLS Policies Work
```bash
# Run verification script
pnpm tsx scripts/verify-rls.ts

# Expected output:
# ✅ RLS Enabled on All Tables
# ✅ Policy Count: 80+ policies deployed
# ✅ Cross-Tenant Isolation
# ✅ Role-Based Access
# ✅ Consent Enforcement
# Results: 5/5 tests passed
```

**Acceptance Criteria:**
- [ ] All 5 tests pass
- [ ] Cross-tenant queries return empty
- [ ] Consent enforcement works

#### Task 1.3: Run Integration Tests
```bash
# Run full integration test suite
pnpm run test:integration

# Expected: 20+ tests pass
```

**Acceptance Criteria:**
- [ ] All integration tests pass
- [ ] No database errors
- [ ] Performance benchmarks met

---

### Phase 2: Monitoring Setup (30-40 min)

#### Task 2.1: Set Up Sentry
**Follow:** `docs/SENTRY_QUICK_SETUP.md`

```bash
# 1. Create Sentry account (free tier)
# 2. Install SDK
pnpm add @sentry/nextjs

# 3. Run wizard
npx @sentry/wizard@latest -i nextjs

# 4. Add environment variables to .env.local
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...

# 5. Test error capture
# Visit: http://localhost:3000/api/sentry-test
# Check Sentry dashboard for error
```

**Acceptance Criteria:**
- [ ] Sentry SDK installed
- [ ] Test error appears in Sentry dashboard
- [ ] Email alert received
- [ ] 3 alert rules configured (P0, P0, P1)

#### Task 2.2: Set Up Uptime Monitoring
```bash
# Option A: Betterstack (recommended)
# 1. Sign up at https://betterstack.com/uptime
# 2. Create monitor for: https://your-app.vercel.app/api/health
# 3. Set frequency: Every 1 minute
# 4. Set alert: Email when down for 2 minutes

# Option B: UptimeRobot (free alternative)
# Same setup at https://uptimerobot.com
```

**Acceptance Criteria:**
- [ ] Uptime monitor created
- [ ] Monitor shows "UP" status
- [ ] Test alert received (stop server, get email)

---

### Phase 3: Deploy to Staging (30-45 min)

#### Task 3.1: Create Staging Environment
```bash
# 1. Create staging Supabase project
# Go to: https://supabase.com/dashboard
# Create project: "flowsportscoach-staging"

# 2. Run Prisma migrations
DATABASE_URL="postgresql://staging..." pnpm prisma db push

# 3. Deploy RLS policies to staging
./scripts/deploy-rls.sh staging

# 4. Verify RLS
DATABASE_URL="postgresql://staging..." pnpm tsx scripts/verify-rls.ts
```

**Acceptance Criteria:**
- [ ] Staging Supabase project created
- [ ] Schema deployed
- [ ] RLS policies deployed
- [ ] Verification tests pass

#### Task 3.2: Deploy App to Staging (Vercel)
```bash
# 1. Connect GitHub repo to Vercel
# 2. Create staging deployment
# 3. Set environment variables in Vercel:

STAGING ENVIRONMENT VARIABLES:
- DATABASE_URL=postgresql://staging...
- NEXT_PUBLIC_SUPABASE_URL=https://staging...
- SUPABASE_ANON_KEY=eyJ...
- NEXTAUTH_SECRET=(generate new: openssl rand -base64 32)
- NEXTAUTH_URL=https://your-app-staging.vercel.app
- OPENAI_API_KEY=sk-...
- SENTRY_DSN=https://...
- NEXT_PUBLIC_SENTRY_DSN=https://...

# 4. Deploy
git push origin staging

# 5. Verify deployment
# Visit: https://your-app-staging.vercel.app
```

**Acceptance Criteria:**
- [ ] Staging app deployed
- [ ] Can create account
- [ ] Can send chat message
- [ ] No errors in Sentry

---

### Phase 4: Final Testing (30-40 min)

#### Task 4.1: Manual Testing Workflow
```
Test Flow 1: Athlete Journey
1. Sign up as athlete
2. Complete onboarding (sport, year)
3. Send chat message
4. Check: No errors in Sentry
5. Check: Message saved to database

Test Flow 2: Coach Journey
1. Sign up as coach
2. View team roster (should be empty)
3. Invite athlete (if athlete exists)
4. Check: Consent request sent

Test Flow 3: Crisis Detection
1. As athlete, send message: "I want to unalive myself"
2. Check: Crisis alert created in database
3. Check: Alert visible to coach
4. Check: Sentry logged the detection
5. As coach, mark alert as reviewed
6. Check: Audit log entry created

Test Flow 4: Cross-Tenant Isolation
1. Create 2 schools in database
2. Create athlete in each school
3. As coach from School A, try to query School B athlete
4. Expect: Empty results or 403 error
```

**Acceptance Criteria:**
- [ ] All 4 test flows work correctly
- [ ] No errors in Sentry
- [ ] Crisis detection triggers
- [ ] Cross-tenant isolation enforced

#### Task 4.2: Performance Testing
```bash
# Simple load test (optional)
# Install: pnpm add -D autocannon

npx autocannon -c 10 -d 30 https://your-app-staging.vercel.app/api/health

# Expected:
# - Average latency: < 200ms
# - 99th percentile: < 500ms
# - No errors
```

**Acceptance Criteria:**
- [ ] API responds within 500ms (p95)
- [ ] No timeout errors
- [ ] Handles concurrent requests

---

### Phase 5: Production Deployment (15-20 min)

#### Task 5.1: Deploy RLS to Production Supabase
```bash
# ONLY after staging testing successful
./scripts/deploy-rls.sh production

# Will ask: "Have you tested in staging first?"
# Answer: yes
```

**Acceptance Criteria:**
- [ ] Production RLS policies deployed
- [ ] Verification tests pass
- [ ] Backup created

#### Task 5.2: Deploy App to Production
```bash
# 1. Merge staging → main
git checkout main
git merge staging
git push origin main

# 2. Vercel auto-deploys to production

# 3. Verify deployment
# Visit: https://your-app.vercel.app

# 4. Final smoke test
# - Sign up works
# - Chat works
# - No Sentry errors
```

**Acceptance Criteria:**
- [ ] Production app deployed
- [ ] Health check passes
- [ ] No critical errors
- [ ] Monitoring shows "UP"

---

## 📊 Pilot Launch Day Checklist

### Morning of Launch (Before Onboarding Athletes)

#### Pre-Flight Checks (15 min)
- [ ] Open Sentry dashboard in browser tab
- [ ] Open uptime monitor in browser tab
- [ ] Open cost dashboard: `/admin/costs`
- [ ] Verify all services "UP"
- [ ] Test: Send chat message as test user
- [ ] Test: Trigger test crisis alert
- [ ] Verify: Both tests work, no errors

#### User Onboarding (First 1-2 Hours)
- [ ] 1-2 coaches sign up and complete profile
- [ ] Coaches invite 5-10 athletes (test batch)
- [ ] Verify: All invites sent successfully
- [ ] Athletes sign up and complete onboarding
- [ ] Athletes send first chat messages
- [ ] Monitor: Sentry dashboard (any errors?)
- [ ] Monitor: Cost dashboard (usage normal?)

### First 24 Hours

#### Monitoring Routine (Every 4 Hours)
- [ ] Check Sentry: Any new errors?
- [ ] Check cost dashboard: Within budget?
- [ ] Check uptime: All services green?
- [ ] Review audit logs: Any anomalies?
- [ ] Quick user check-in: Any issues reported?

#### Success Criteria - Day 1
- [ ] 5-10 athletes onboarded successfully
- [ ] All athletes sent ≥ 1 chat message
- [ ] Zero critical errors in Sentry
- [ ] Cost < $10 for day (well under $500 limit)
- [ ] Uptime > 99%
- [ ] Crisis detection tested (if appropriate)

---

## 📈 Pilot Expansion Plan

### Week 1: 5-10 Athletes
**Goal:** Validate core functionality works
- [ ] All features functional
- [ ] No critical bugs
- [ ] Positive initial feedback
- **Decision Point:** Proceed to Week 2 or iterate?

### Week 2: 20-30 Athletes
**Goal:** Validate scale and performance
- [ ] Performance stays fast (< 500ms p95)
- [ ] Cost stays under $50/week
- [ ] Athletes using product weekly
- **Decision Point:** Proceed to Week 3 or iterate?

### Week 3-4: 50-150 Athletes
**Goal:** Full pilot, gather insights
- [ ] Correlate mental readiness → performance
- [ ] Gather coach feedback on insights
- [ ] Measure: % athletes using weekly
- [ ] Measure: Athlete satisfaction (survey)
- **Decision Point:** Expand to more teams or iterate?

---

## 🚨 Emergency Procedures

### If Critical Error Occurs
1. **Check Sentry** for error details
2. **Assess impact:** How many users affected?
3. **Mitigate:**
   - Minor bug: Monitor, fix in next deploy
   - Critical bug: Rollback via Vercel dashboard
   - Data issue: Disable feature with kill switch
4. **Communicate:** Email affected athletes/coaches
5. **Fix:** Deploy fix to staging, test, then production
6. **Document:** Update this checklist with learnings

### If Cost Spike Occurs
1. **Check cost dashboard:** Which school?
2. **Check Sentry:** Any infinite loops?
3. **Mitigate:**
   - Circuit breaker should auto-trigger at $500
   - Manual kill switch: `/api/admin/kill-switch`
4. **Investigate:** What caused the spike?
5. **Fix:** Add rate limiting, fix bug, or adjust quotas

### If Crisis Alert Missed
1. **IMMEDIATE:** Review athlete's recent messages
2. **Contact coach:** Notify immediately
3. **Escalate:** If severe, contact campus counseling
4. **Investigate:** Why wasn't it caught?
5. **Fix:** Update detection patterns
6. **Test:** Verify fix with test cases

---

## ✅ Final Pre-Launch Sign-Off

**Before inviting first real athletes, verify:**

- [ ] RLS policies deployed and tested (production)
- [ ] Sentry monitoring active with alerts configured
- [ ] Uptime monitoring active
- [ ] Crisis detection tested with 10+ scenarios
- [ ] Integration tests passing (20+ tests)
- [ ] Manual testing completed (4 test flows)
- [ ] Cost dashboard accessible
- [ ] Emergency procedures documented
- [ ] Can rollback in < 2 minutes if needed

**Estimated Readiness After Completion:** **95%+** ✅

---

## 📞 Support Contacts

**Technical Issues:**
- Email: [your email]
- Phone: [your phone]

**Crisis Escalation:**
- UW Counseling: [phone number]
- National Crisis Hotline: 988

**Vercel Support:**
- https://vercel.com/support

**Supabase Support:**
- https://supabase.com/dashboard/support

---

**Last Updated:** January 5, 2026
**Version:** 1.0 (Pilot Launch)
