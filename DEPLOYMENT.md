# Production Deployment Guide

**Complete guide for deploying AI Sports Agent to production**

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Security Checklist](#security-checklist)
3. [Deployment Workflow](#deployment-workflow)
4. [Monitoring & Alerts](#monitoring--alerts)
5. [Incident Response](#incident-response)
6. [Backup & Recovery](#backup--recovery)

---

## Environment Setup

### Required Environments

| Environment | Purpose | Domain | Data Type |
|-------------|---------|--------|-----------|
| **Local** | Development | localhost:3000 | Synthetic |
| **Staging** | Pre-production testing | staging.aisportsagent.com | Synthetic + anonymized |
| **Production** | Live customer data | app.aisportsagent.com | Real PII |

### Environment Variables

**Production `.env.production` (Vercel/Railway):**
```bash
# CRITICAL: Never commit this file to version control

# Environment
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://app.aisportsagent.com"

# Database (Supabase)
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://xyz.supabase.co"
SUPABASE_ANON_KEY="eyJ..."           # Public (client-side)
SUPABASE_SERVICE_ROLE_KEY="eyJ..."   # NEVER expose to client

# Auth (NextAuth.js)
NEXTAUTH_SECRET="[ROTATE EVERY 90 DAYS]"
NEXTAUTH_URL="https://app.aisportsagent.com"

# AI Services
OPENAI_API_KEY="sk-proj-..."
OPENAI_MODEL="gpt-4-turbo-preview"
OPENAI_MAX_TOKENS="2000"

# MCP Server (if using)
MCP_SERVER_URL="https://mcp.aisportsagent.com"
MCP_SERVICE_TOKEN="[ROTATE EVERY 365 DAYS]"

# Monitoring
SENTRY_DSN="https://..."
SENTRY_ENV="production"

# Feature Flags (CRITICAL)
ENABLE_DEMO_ACCOUNTS="false"        # MUST be false
ENABLE_COST_LIMITS="true"           # MUST be true
COST_LIMIT_DAILY="500"              # USD per tenant
COST_LIMIT_MONTHLY="10000"          # USD total

# Security
ENABLE_RATE_LIMITING="true"
RATE_LIMIT_PER_USER="60"            # requests/minute
RATE_LIMIT_PER_TENANT="1000"        # requests/minute
```

**Startup Validation:**
```typescript
// apps/web/src/lib/env-validation.ts
import { z } from 'zod';

const productionEnvSchema = z.object({
  NODE_ENV: z.literal('production'),
  NEXTAUTH_SECRET: z.string().min(32),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  ENABLE_DEMO_ACCOUNTS: z.enum(['false']),  // MUST be false
  ENABLE_COST_LIMITS: z.enum(['true']),     // MUST be true
});

// Throws error if validation fails (prevents startup)
export const env = productionEnvSchema.parse(process.env);
```

### Secret Rotation Schedule

| Secret | Frequency | Method |
|--------|-----------|--------|
| JWT signing key (`NEXTAUTH_SECRET`) | Every 90 days | Manual rotation with dual-key period |
| OpenAI API key | Every 180 days (or immediately if exposed) | OpenAI dashboard → Revoke → Generate new |
| Service tokens (`MCP_SERVICE_TOKEN`) | Every 365 days | Manual rotation |
| Database passwords | Supabase auto-rotates | N/A |

---

## Security Checklist

### Pre-Production Launch (MANDATORY)

#### Secrets & Environment
- [ ] All secrets in Vercel/Railway env vars (not in code)
- [ ] `.env.local` and `.env` in `.gitignore`
- [ ] No `NEXT_PUBLIC_*` for sensitive data (API keys, tokens)
- [ ] Environment validation passes on startup
- [ ] Secrets rotated in last 90 days
- [ ] **CRITICAL**: `ENABLE_DEMO_ACCOUNTS=false` in production
- [ ] **CRITICAL**: `ENABLE_COST_LIMITS=true` in production

#### Authentication & Authorization
- [ ] NextAuth configured with secure settings
- [ ] JWT secret ≥32 characters (randomized)
- [ ] Session expiry: 15 minutes
- [ ] Refresh tokens enabled (30 days)
- [ ] Mobile JWT validation implemented
- [ ] Password requirements: min 8 chars, complexity enforced

#### Database Security (Row-Level Security)
- [ ] RLS enabled on **ALL** tables (no exceptions)
- [ ] RLS policies tested (try cross-tenant access → must fail)
- [ ] Service role key only used server-side
- [ ] Audit logging enabled for sensitive tables (`chat_sessions`, `mood_logs`)
- [ ] Every query includes `schoolId` filter (defense in depth)

**Test RLS:**
```sql
-- Create 2 test users from different schools
-- Try to access other school's data (should return 0 rows)
SELECT * FROM chat_sessions
WHERE school_id = 'school-2';  -- Should fail if user is from school-1
```

#### Multi-Tenancy (Critical for FERPA Compliance)
- [ ] `schoolId` filter on **ALL** database queries
- [ ] ChromaDB uses collections per tenant (`kb_{schoolId}`)
- [ ] Test: Create 2 schools, verify data isolation
- [ ] No global queries (all must filter by tenant)
- [ ] Tenant context enforced in 3 layers:
  1. Supabase RLS (database)
  2. Next.js middleware (application)
  3. MCP server (service layer)

#### LLM Safety & Cost Controls
- [ ] API keys only on server (never in client bundles)
- [ ] PII redaction before sending to LLM (emails, SSNs, phones)
- [ ] Prompt storage is opt-in only (default: off)
- [ ] Cost controls with circuit breakers:
  - [ ] $500/day per tenant limit
  - [ ] $10K/month total limit
  - [ ] Auto-blocks requests when exceeded
- [ ] Token usage tracking (every request logged)

#### Input Validation & XSS Prevention
- [ ] Zod schemas on **ALL** API routes (no exceptions)
- [ ] XSS protection: DOMPurify for markdown rendering
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] SQL injection protection (Prisma parameterized queries)
- [ ] CSRF tokens enabled (NextAuth.js default)

#### Rate Limiting
- [ ] 60 req/min per user
- [ ] 1,000 req/min per tenant
- [ ] 10,000 req/min global
- [ ] 429 responses with `Retry-After` header
- [ ] Load tested to 2x expected peak

#### Monitoring & Alerts
- [ ] Sentry error tracking configured
- [ ] Uptime monitoring (UptimeRobot or similar)
- [ ] Cost alerts ($500/day threshold)
- [ ] 5xx error rate alerts (> 1% for 5 min)
- [ ] Latency alerts (p95 > 2000ms)

#### CI/CD & Deployment
- [ ] Protected main branch (require PR reviews)
- [ ] Required checks: lint, typecheck, tests, security scan
- [ ] Secret scanning enabled (GitHub Dependabot)
- [ ] Dependency scanning (npm audit / safety check)
- [ ] Staging auto-deploys on merge to `staging`
- [ ] Production requires manual approval

#### Compliance (FERPA for Student Data)
- [ ] Privacy policy reviewed by university legal
- [ ] Terms of service finalized
- [ ] FERPA requirements documented
- [ ] User consent flows implemented (coach access to athlete data)
- [ ] Data retention policies defined (7 years for compliance)

#### Performance
- [ ] Load tested to 2x peak traffic (100 concurrent users)
- [ ] p95 latency < 500ms
- [ ] Database connection pooling configured
- [ ] CDN enabled (Vercel default)
- [ ] Image optimization enabled

---

## Deployment Workflow

### 1. Staging Deployment (Auto on Merge to `staging`)

```bash
# Create staging branch (one-time setup)
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging

# Ongoing: Merge feature to staging
git checkout staging
git merge feature/your-feature --no-ff
git push origin staging

# Vercel auto-deploys to: https://staging.aisportsagent.com
```

**Staging Environment Setup:**
1. Create Vercel staging project
2. Create Railway staging instance (for MCP server)
3. Create Supabase staging database
4. Deploy Redis for staging
5. Configure staging env vars (separate from production)

**Testing in Staging:**
- [ ] Create 2 test schools
- [ ] Create 5 test athletes per school
- [ ] Test cross-tenant isolation (should fail)
- [ ] Test chat interface (voice + text)
- [ ] Test cost circuit breaker (trigger at limit)
- [ ] Test rate limiting (exceed limits, get 429)
- [ ] Load test: 50 concurrent users
- [ ] Verify monitoring alerts work

**Staging Data:**
- Only synthetic/fake data (no real PII)
- Anonymized data samples OK
- Mark clearly: `staging_` prefix

### 2. Production Deployment (Manual Approval Required)

```bash
# STEP 1: Verify all checks pass
cd apps/web
pnpm lint
pnpm type-check
pnpm test

# STEP 2: Create PR from staging to main
git checkout main
git pull origin main
gh pr create --base main --head staging \
  --title "Production deployment: [Feature summary]" \
  --body "Tested in staging for 24+ hours. All checks pass."

# STEP 3: Get approval from reviewer
# Wait for CI checks: ✅ lint, ✅ typecheck, ✅ tests, ✅ security scan

# STEP 4: Merge to main
gh pr merge --merge  # Or via GitHub UI

# STEP 5: Vercel auto-deploys to production
# Monitor: https://vercel.com/dashboard
```

**Post-Deploy Verification (Critical):**
```bash
# 1. Health check
curl https://app.aisportsagent.com/api/health
# Expected: {"status": "ok", "timestamp": "..."}

# 2. Smoke tests
# - Login as test athlete
# - Send a chat message
# - Log a mood entry
# - View dashboard

# 3. Monitor for 4 hours
# - Check Sentry for errors
# - Check cost dashboard (no spikes)
# - Check uptime monitoring
# - p95 latency < 500ms
```

### 3. Database Migrations

**CRITICAL: Always test migrations in staging first**

```bash
# Staging migration
DATABASE_URL="postgresql://staging..." pnpm prisma migrate deploy

# Verify migration
DATABASE_URL="postgresql://staging..." pnpm prisma migrate status

# If successful, run in production (during low-traffic window)
DATABASE_URL="postgresql://prod..." pnpm prisma migrate deploy
```

**Rollback Plan:**
```bash
# If migration fails, rollback
DATABASE_URL="postgresql://prod..." pnpm prisma migrate resolve \
  --rolled-back [MIGRATION_NAME]

# Restore from backup (disaster recovery)
pg_restore -d $DATABASE_URL backup_20250104.dump
```

### 4. Rollback Procedure

**Web App (Vercel):**
```bash
# Instant rollback to previous deployment
vercel rollback app.aisportsagent.com

# Or rollback to specific deployment
vercel rollback app.aisportsagent.com --to [DEPLOYMENT_ID]
```

**MCP Server (Railway):**
```bash
# Railway rollback (via dashboard or CLI)
railway rollback

# Or redeploy previous Docker image
docker pull ghcr.io/org/mcp-server:v1.2.3
railway up --service mcp-server
```

**Target: Rollback in < 2 minutes**

---

## Monitoring & Alerts

### Monitoring Stack (Minimal but Effective)

| Tool | Purpose | Cost |
|------|---------|------|
| **Sentry** | Error tracking | $26/month |
| **Betterstack** | Logging | $20/month |
| **UptimeRobot** | Uptime monitoring | Free tier |
| **Vercel Analytics** | Performance metrics | Included |

**Total: ~$50/month**

### Alert Configuration

**Sentry (Error Tracking):**
```typescript
// apps/web/src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // 10% sampling in prod
  beforeSend(event) {
    // Redact PII from error reports
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});
```

**Critical Alerts (PagerDuty/Slack):**

1. **5xx Error Spike**
   - Condition: >50 errors in 1 minute
   - Action: Page on-call engineer

2. **Latency Degradation**
   - Condition: p95 > 2000ms for 5 minutes
   - Action: Slack alert

3. **Cost Anomaly**
   - Condition: Hourly spend > $20 (3x normal)
   - Action: Trigger circuit breaker + page on-call

4. **Database Connection Pool Exhaustion**
   - Condition: >90% connections used for 2 minutes
   - Action: Scale up + page on-call

5. **Crisis Detection Timeout**
   - Condition: Crisis detection latency > 5000ms
   - Action: Page on-call (student safety issue)

**Dashboard Metrics:**
- Request rate (req/sec)
- Error rate (%)
- p95 latency (ms)
- Token usage (per tenant)
- Cost ($ per day)
- Active users (concurrent)

---

## Incident Response

### Playbooks (5 Critical Scenarios)

#### 1. Leaked API Key

**Detection:**
- GitHub secret scanning alert
- Unusual OpenAI usage spike
- User reports unauthorized charges

**Response (< 5 minutes):**
```bash
# 1. IMMEDIATELY revoke key
# Go to: https://platform.openai.com/api-keys → Revoke

# 2. Generate new key
OPENAI_API_KEY=$(openai api keys.create --name "Production-2025-01")

# 3. Update production env
vercel env add OPENAI_API_KEY $OPENAI_API_KEY --scope production

# 4. Redeploy
vercel deploy --prod

# 5. Audit usage (download from OpenAI dashboard)
# Identify fraudulent requests
# Check if PII was accessed

# 6. Notify affected users (if PII accessed)
```

**Post-Incident:**
- Root cause analysis: How was key exposed?
- Update secret scanning rules
- Security training review

#### 2. Suspected Data Exposure (FERPA Violation)

**Detection:**
- User reports seeing other athlete's data
- Audit log anomaly (coach accessing 100+ athletes in 1 minute)
- Sentry error: "RLS policy violation"

**Response (< 15 minutes):**
```bash
# 1. CONTAIN (< 2 minutes)
# Activate kill switch
redis-cli SET disable_ai_chat "true" EX 3600  # 1 hour

# 2. INVESTIGATE (< 15 minutes)
# Query audit logs
SELECT * FROM audit_logs
WHERE action = 'READ'
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

# Identify affected users
SELECT DISTINCT user_id, resource
FROM audit_logs
WHERE user_id = 'suspected_attacker_id';

# 3. VERIFY RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'chat_sessions';

# 4. NOTIFY (< 1 hour)
# Email affected athletes
# Subject: "Security incident notification"
# Body: "We detected unusual activity. Your data was accessed by [role].
#        We've secured the issue. No further action needed."

# 5. REMEDIATE
# Fix RLS policy or application code
git checkout -b fix/data-exposure-incident
# ... make fixes ...
git push origin fix/data-exposure-incident
# Deploy to staging, test, then production

# 6. DOCUMENT
# Create incident report in wiki
# Update threat model
```

#### 3. Runaway Cost Event

**Detection:**
- Budget alert: "$500 spent in 1 hour (normal: $50/day)"
- OpenAI usage dashboard spike
- Circuit breaker triggered

**Response (< 10 minutes):**
```bash
# 1. Circuit breaker (AUTOMATIC)
# Already triggered at $500/day threshold
# All requests return 429

# 2. Identify cause
# Check token usage logs
SELECT user_id, endpoint, SUM(tokens) as total_tokens
FROM token_usage
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id, endpoint
ORDER BY total_tokens DESC;

# 3. Block abuser (if malicious)
UPDATE users SET is_locked = true WHERE id = 'abuser_id';

# 4. Analyze pattern
# Bug? (infinite loop)
# Malicious? (DoS attack)
# Legitimate? (unusual but valid usage)

# 5. Adjust limits (if legitimate)
redis-cli SET "quota_override:school_xyz" "2000" EX 86400  # 24h

# 6. Deploy fix (if bug)
# Fix infinite loop
# Deploy to production
```

#### 4. Auth Compromise (Credential Stuffing Attack)

**Detection:**
- Multiple failed login attempts (50+ in 1 minute)
- Login from unusual location/device
- User reports "I didn't log in"

**Response:**
```bash
# 1. BLOCK account (< 1 minute)
UPDATE users SET is_locked = true WHERE id = 'user_id';

# 2. Invalidate sessions
DELETE FROM sessions WHERE user_id = 'user_id';

# 3. Require password reset
UPDATE users SET password_reset_required = true WHERE id = 'user_id';

# 4. Notify user
# Email: "We detected suspicious activity. Your account is locked.
#         Reset your password: [link]"

# 5. Investigate
# Check audit logs for data accessed
# IP address geolocation
# Device fingerprint analysis

# 6. Re-enable with MFA (if available)
UPDATE users SET mfa_required = true WHERE id = 'user_id';
```

#### 5. Downtime / 5xx Errors

**Detection:**
- UptimeRobot: "Website down (5xx errors)"
- Sentry: "Error rate 100x normal"
- User reports: "Can't log in"

**Response (< 2 minutes rollback):**
```bash
# 1. Verify issue
curl -I https://app.aisportsagent.com
# → HTTP/1.1 503 Service Unavailable

# 2. Check recent deploys
vercel list app.aisportsagent.com
# Last deploy: 5 minutes ago

# 3. ROLLBACK (< 2 minutes)
vercel rollback app.aisportsagent.com

# 4. Verify recovery
curl -I https://app.aisportsagent.com
# → HTTP/1.1 200 OK

# 5. Notify users
# Twitter: "We experienced a brief outage. Service is restored."

# 6. Post-mortem
# What caused the 503? Bad deploy? DB migration? External service?
```

---

## Backup & Recovery

### Automated Backups

**Database (Supabase):**
- Automatic daily backups (Supabase Pro plan)
- Retention: 7 days (automatic)
- Manual backups: Before major migrations

**Manual Backup:**
```bash
# Backup production database
pg_dump $PROD_DATABASE_URL > backup_$(date +%Y%m%d).sql

# Upload to S3 (long-term storage)
aws s3 cp backup_$(date +%Y%m%d).sql \
  s3://backups/aisportsagent/$(date +%Y%m%d)/
```

### Recovery Testing (Monthly Drill)

**3rd Saturday of every month:**
```bash
# 1. Backup production DB to staging
pg_dump $PROD_DATABASE_URL | psql $STAGING_DATABASE_URL

# 2. Verify data integrity
psql $STAGING_DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $STAGING_DATABASE_URL -c "SELECT COUNT(*) FROM chat_sessions;"

# 3. Test restore from backup
pg_restore -d $STAGING_DATABASE_URL backups/auto_backup_20250103.dump

# 4. Verify application works
pnpm test:e2e --env staging

# 5. Document results
# Target: Restore completes in < 15 minutes
```

**Disaster Recovery Drill (Quarterly):**
- Simulate total infrastructure loss
- Rebuild from scratch in < 2 hours
- Verify all data intact

---

## Production Readiness Checklist

### Launch Blockers (Must Fix Before Production)

- [ ] **Security**
  - [ ] RLS policies on all tables (tested)
  - [ ] No demo account logic in code
  - [ ] Cost limits enabled
  - [ ] Input validation on all API routes

- [ ] **Monitoring**
  - [ ] Sentry error tracking configured
  - [ ] Uptime monitoring enabled
  - [ ] Cost alerts configured ($500/day)

- [ ] **Operations**
  - [ ] Rollback procedure tested (< 2 minutes)
  - [ ] Backup/restore drill successful
  - [ ] Incident playbooks documented

- [ ] **Compliance**
  - [ ] Privacy policy reviewed by legal
  - [ ] FERPA requirements met
  - [ ] User consent flows implemented

### Week Before Launch

- [ ] Final code freeze (only critical fixes)
- [ ] Staging → production dry run
- [ ] Database migration dry run
- [ ] DNS configuration verified
- [ ] SSL certificates verified
- [ ] Support email inbox set up
- [ ] Legal docs finalized (ToS, Privacy Policy)

### Launch Day

- [ ] Deploy to production (morning, not Friday)
- [ ] Verify health checks pass
- [ ] Send launch announcement
- [ ] Monitor dashboard for 4 hours
- [ ] Respond to first user feedback
- [ ] Celebrate if no P0 incidents 🎉

---

## Resources

- **Vercel Deployment**: https://vercel.com/docs/deployments
- **Railway Guide**: https://docs.railway.app/
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **Sentry Setup**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **OpenAI Security Best Practices**: https://platform.openai.com/docs/guides/safety-best-practices

---

**Last Updated**: 2026-01-05
**Critical Requirements**: RLS enabled, cost limits enabled, demo accounts disabled
**Target Metrics**: 99.9% uptime, p95 < 500ms, error rate < 0.1%
