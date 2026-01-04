# Security Checklist - AI Sports Agent

## Pre-Production Launch

### Secrets & Environment
- [ ] All secrets stored in Vercel/Railway (not in code)
- [ ] `.env.local` and `.env` in `.gitignore`
- [ ] No `NEXT_PUBLIC_*` for sensitive data
- [ ] Environment validation passes on startup
- [ ] Secrets rotated in last 90 days

### Authentication & Authorization
- [ ] NextAuth configured with secure settings
- [ ] JWT secret is 32+ characters (randomized)
- [ ] Session expiry set to 15 minutes
- [ ] Refresh tokens enabled (30 days)
- [ ] Mobile JWT validation implemented

### Database Security
- [ ] RLS enabled on all 40 tables
- [ ] RLS policies tested (try cross-tenant access)
- [ ] Service role key only used server-side
- [ ] Connection strings not exposed to client
- [ ] Audit logging enabled for sensitive tables

### Multi-Tenancy
- [ ] `schoolId` filter on all queries
- [ ] ChromaDB uses collections per tenant
- [ ] Test: Create 2 schools, verify isolation
- [ ] No global queries (must filter by tenant)

### LLM Safety
- [ ] API keys only on server (never client)
- [ ] PII redaction before sending to LLM
- [ ] Tool allowlists enforced
- [ ] Prompt storage is opt-in only
- [ ] Cost controls with circuit breakers

### Input Validation
- [ ] Zod schemas on ALL API routes
- [ ] XSS protection (DOMPurify for markdown)
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] SQL injection protection (Prisma parameterization)
- [ ] CSRF tokens enabled (NextAuth default)

### Rate Limiting
- [ ] 60 req/min per user
- [ ] 1000 req/min per tenant
- [ ] 10000 req/min global
- [ ] 429 responses with Retry-After header
- [ ] Test with load testing tool

### Monitoring & Alerts
- [ ] Sentry error tracking configured
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Cost alerts ($500/day threshold)
- [ ] 5xx error alerts
- [ ] Latency alerts (p95 > 2000ms)

### Incident Response
- [ ] Playbooks documented (5 scenarios)
- [ ] PagerDuty or equivalent set up
- [ ] Rollback tested (< 2 minutes)
- [ ] Backup/restore drill successful
- [ ] Contact list for emergencies

### CI/CD
- [ ] Protected main branch
- [ ] Required checks: lint, typecheck, tests, security
- [ ] Secret scanning enabled (GitHub)
- [ ] Dependency scanning (Dependabot)
- [ ] Staging auto-deploys, prod requires approval

### Compliance
- [ ] Privacy policy reviewed by legal
- [ ] Terms of service finalized
- [ ] FERPA requirements documented
- [ ] User consent flows implemented
- [ ] Data retention policies defined

### Performance
- [ ] Load tested to 2x peak traffic
- [ ] p95 latency < 500ms
- [ ] Database connection pooling configured
- [ ] CDN enabled (Vercel default)
- [ ] Image optimization enabled

---

## Staging Environment Checklist

### Infrastructure Setup
- [ ] Staging branch created (`staging`)
- [ ] Vercel staging project configured
- [ ] Railway staging instance deployed
- [ ] Staging database created (Supabase)
- [ ] Redis instance for staging

### Environment Variables (Staging)
- [ ] `NODE_ENV=staging`
- [ ] `DATABASE_URL` (staging Supabase)
- [ ] `NEXTAUTH_SECRET` (staging-specific)
- [ ] `OPENAI_API_KEY` (separate staging key)
- [ ] `MCP_SERVER_URL` (staging Railway URL)
- [ ] `ENABLE_DEMO_ACCOUNTS=false`
- [ ] `ENABLE_COST_LIMITS=true`
- [ ] `COST_LIMIT_DAILY=$100`

### Testing in Staging
- [ ] Create 2 test schools
- [ ] Create 5 test athletes per school
- [ ] Test cross-tenant isolation (should fail)
- [ ] Test chat interface (voice + text)
- [ ] Test cost circuit breaker (trigger at limit)
- [ ] Test rate limiting (exceed limits)
- [ ] Test RLS policies (unauthorized access fails)
- [ ] Load test: 50 concurrent users
- [ ] Verify monitoring alerts work

### Data in Staging
- [ ] Only synthetic/fake data
- [ ] No real athlete information
- [ ] Anonymized data samples OK
- [ ] Mark staging DB clearly (`staging_` prefix)

---

## Week 1 Security Implementation

### Day 1-2: Input Validation
- [ ] Install Zod: `npm install zod`
- [ ] Create `/apps/web/src/lib/validation.ts`
- [ ] Add Zod schemas for all API routes
- [ ] Test with malformed inputs (should return 400)
- [ ] Document validation errors

### Day 3-4: Cost Controls
- [ ] Create `/apps/web/src/lib/cost-control.ts`
- [ ] Implement token tracking middleware
- [ ] Add Redis for usage tracking
- [ ] Set daily limit: $500/tenant
- [ ] Test circuit breaker triggers
- [ ] Add cost dashboard

### Day 5: Remove Demo Accounts
- [ ] Search codebase: `grep -r "demo-" .`
- [ ] Remove all demo account logic
- [ ] Update seed script (no demo data)
- [ ] Verify: `ENABLE_DEMO_ACCOUNTS=false`
- [ ] Test: Demo login fails

### Day 6-7: JWT Validation (Mobile)
- [ ] Add JWT middleware to all API routes
- [ ] Implement refresh token endpoint
- [ ] Test expired token rejection
- [ ] Test token refresh flow
- [ ] Mobile app integration test

---

## Post-Launch Checklist (30 Days)

### Security
- [ ] No security incidents reported
- [ ] Audit logs reviewed (no anomalies)
- [ ] Penetration test scheduled
- [ ] Security training completed

### Operations
- [ ] Monitoring dashboards checked daily
- [ ] No cost overruns
- [ ] Backup verification successful
- [ ] Incident response plan tested

### Compliance
- [ ] Privacy policy compliance verified
- [ ] User consent flows working
- [ ] Data retention followed
- [ ] University legal approval maintained

### Performance
- [ ] p95 latency < 500ms maintained
- [ ] Uptime > 99.9%
- [ ] Error rate < 0.1%
- [ ] User satisfaction survey (NPS > 8)

---

## Emergency Procedures

### If Cost Spike Detected ($500/day exceeded)
1. Check OpenAI dashboard immediately
2. Identify which tenant/user
3. Circuit breaker should auto-trigger
4. If not, manually disable via: `redis-cli SET circuit_breaker:{schoolId} "open"`
5. Investigate root cause
6. Fix and re-enable

### If Data Exposure Suspected
1. **IMMEDIATELY** activate kill switch: `redis-cli SET disable_ai_chat "true"`
2. Check audit logs: `SELECT * FROM audit_logs WHERE created_at > NOW() - INTERVAL '1 hour'`
3. Identify affected users
4. Notify affected athletes (FERPA requirement)
5. Fix RLS policy or application code
6. Re-deploy
7. Document incident

### If Leaked API Key
1. **IMMEDIATELY** revoke key (OpenAI dashboard → API Keys → Revoke)
2. Generate new key
3. Update Vercel env: `vercel env add OPENAI_API_KEY {new_key} --scope production`
4. Redeploy: `vercel deploy --prod`
5. Audit OpenAI usage for unauthorized requests
6. Document how key was exposed
7. Update secret scanning rules

---

## Staging Deployment Workflow

```bash
# 1. Create staging branch
git checkout main
git pull origin main
git checkout -b staging

# 2. Push to remote
git push -u origin staging

# 3. Deploy to Vercel staging (auto-deploys)
# Visit: https://vercel.com/dashboard

# 4. Deploy MCP server to Railway staging
# Visit: https://railway.app/dashboard

# 5. Run migrations on staging DB
cd apps/web
npx prisma migrate deploy

# 6. Seed staging data
npm run prisma:seed

# 7. Test staging
# Visit: https://staging.aisportsagent.com
```

---

## Production Deployment Workflow (When Ready)

```bash
# 1. Verify all staging tests pass
npm run test
npm run type-check
npm run lint

# 2. Create PR: staging → main
gh pr create --base main --head staging --title "Production deployment"

# 3. Get approval
# Wait for PR approval + CI checks to pass

# 4. Merge to main
gh pr merge --merge

# 5. Vercel auto-deploys to production
# Monitor: https://vercel.com/dashboard

# 6. Verify production health
curl https://app.aisportsagent.com/api/health

# 7. Monitor for 4 hours
# Check Sentry, cost dashboard, uptime monitoring
```

---

**Last Updated**: 2025-01-04
**Version**: 1.0.0
