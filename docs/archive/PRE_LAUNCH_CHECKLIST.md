# Pre-Launch Production Checklist

## Overview

This checklist must be completed before launching AI Sports Agent to production. Each item is marked with priority and estimated time.

**Legend:**
- 🔴 **CRITICAL** - Must be completed (blocking)
- 🟡 **HIGH** - Should be completed
- 🟢 **MEDIUM** - Nice to have

---

## 1. Security & Authentication

### 1.1 Environment Variables
- [ ] 🔴 **All secrets removed from code** (no hardcoded API keys)
  - Run: `grep -r "sk-" apps/web/src/ | grep -v ".test."`
  - Expected: No matches
  - Time: 5 minutes

- [ ] 🔴 **Demo accounts disabled in production**
  - Verify: `ENABLE_DEMO_ACCOUNTS=false` in Vercel env vars
  - Time: 2 minutes

- [ ] 🔴 **Secrets rotated in last 90 days**
  - [ ] JWT signing secret (NEXTAUTH_SECRET)
  - [ ] OpenAI API key
  - [ ] Supabase service role key (if used)
  - Time: 30 minutes

- [ ] 🔴 **Environment separation verified**
  - [ ] Dev uses `dev` database
  - [ ] Staging uses `staging` database
  - [ ] Production uses `production` database
  - [ ] Each has different API keys
  - Time: 10 minutes

### 1.2 Authentication & Authorization
- [ ] 🔴 **JWT validation on all protected routes**
  - Test: `curl -X GET https://app.aisportsagent.com/api/athletes`
  - Expected: 401 Unauthorized
  - Time: 10 minutes

- [ ] 🔴 **Session expiry configured (15 minutes)**
  - Verify: `session.maxAge = 900` in NextAuth config
  - Time: 5 minutes

- [ ] 🔴 **Refresh tokens enabled**
  - Test: Mobile app can refresh expired token
  - Time: 10 minutes

- [ ] 🟡 **Password reset flow tested**
  - Test: Request password reset, receive email, reset password
  - Time: 15 minutes

### 1.3 Multi-Tenant Security
- [ ] 🔴 **RLS policies on all 40 tables**
  - Run: `pnpm test tests/rls`
  - Expected: All tests pass
  - Time: 20 minutes

- [ ] 🔴 **Cross-tenant access blocked**
  - Test: Create 2 schools, verify no data leakage
  - Run: `pnpm test tests/rls/cross-tenant-isolation.test.ts`
  - Time: 15 minutes

- [ ] 🔴 **Coach consent enforcement**
  - Test: Coach cannot view summaries without athlete consent
  - Run: `pnpm test tests/rls/coach-consent-access.test.ts`
  - Time: 10 minutes

---

## 2. Performance & Scalability

### 2.1 Load Testing
- [ ] 🔴 **Smoke test passed (2 VUs, 1 minute)**
  - Run: `k6 run --stage 1m:2 apps/web/tests/load/k6-load-test.js`
  - Expected: 0% error rate
  - Time: 5 minutes

- [ ] 🔴 **Load test passed (50 VUs, 10 minutes)**
  - Run: `k6 run apps/web/tests/load/k6-load-test.js`
  - Expected: p95 < 2000ms, error rate < 1%
  - Time: 15 minutes

- [ ] 🟡 **Stress test completed (100 VUs)**
  - Run: `k6 run --stage 5m:100 apps/web/tests/load/k6-load-test.js`
  - Identify bottlenecks
  - Time: 15 minutes

- [ ] 🟡 **Spike test passed (200 VUs sudden spike)**
  - Run: `k6 run --stage 10s:200 --stage 1m:200 apps/web/tests/load/k6-load-test.js`
  - Expected: System recovers gracefully
  - Time: 10 minutes

### 2.2 Database Optimization
- [ ] 🔴 **Performance audit passed**
  - Run: `pnpm tsx scripts/performance-audit.ts`
  - Expected: No critical failures
  - Time: 10 minutes

- [ ] 🔴 **Critical indexes created**
  - [ ] `idx_chat_sessions_athlete_id`
  - [ ] `idx_messages_session_id`
  - [ ] `idx_mood_logs_athlete_date`
  - [ ] `idx_audit_logs_user_id_timestamp`
  - [ ] `idx_audit_logs_athlete_id_timestamp`
  - Time: 20 minutes

- [ ] 🟡 **Connection pooling enabled**
  - Verify: `DATABASE_URL` uses port `6543` (pooler)
  - Time: 5 minutes

- [ ] 🟡 **Slow query monitoring enabled**
  - Supabase Dashboard → Database → Query Performance
  - Set alert for queries > 1000ms
  - Time: 10 minutes

### 2.3 API Performance
- [ ] 🔴 **Response caching configured**
  - Verify: Static endpoints have `revalidate` set
  - Time: 10 minutes

- [ ] 🟡 **Chat streaming optimized (TTFB < 1s)**
  - Test: Measure time to first token
  - Expected: < 1000ms
  - Time: 10 minutes

---

## 3. Monitoring & Alerting

### 3.1 Sentry Setup
- [ ] 🔴 **Sentry project created**
  - URL: https://sentry.io/organizations/your-org/projects/
  - Time: 10 minutes

- [ ] 🔴 **Sentry DSN configured in Vercel**
  - [ ] `SENTRY_DSN` (server-side)
  - [ ] `NEXT_PUBLIC_SENTRY_DSN` (client-side)
  - Time: 5 minutes

- [ ] 🔴 **5 critical alert rules configured**
  - [ ] Critical Errors (immediate alert)
  - [ ] Error Spike (> 50 errors in 5 min)
  - [ ] Performance Degradation (p95 > 2000ms for 10 min)
  - [ ] Authentication Failures (> 100 in 10 min)
  - [ ] Cost Spike (> $100/hour)
  - Time: 30 minutes

- [ ] 🟡 **Test error sent to Sentry**
  - Test: `curl https://app.aisportsagent.com/api/test-sentry`
  - Expected: Error appears in Sentry dashboard
  - Time: 5 minutes

### 3.2 Uptime Monitoring
- [ ] 🔴 **UptimeRobot monitors created**
  - [ ] Main application (https://app.aisportsagent.com)
  - [ ] API health (https://app.aisportsagent.com/api/health)
  - [ ] Database health (https://app.aisportsagent.com/api/health/db)
  - Time: 15 minutes

- [ ] 🟡 **Test downtime alert**
  - Temporarily break health check
  - Expected: Alert received within 2 minutes
  - Time: 10 minutes

### 3.3 Cost Monitoring
- [ ] 🔴 **Cost limits enabled**
  - Verify: `ENABLE_COST_LIMITS=true` in Vercel
  - Time: 2 minutes

- [ ] 🔴 **OpenAI budget limits set**
  - [ ] Soft limit: $500/month
  - [ ] Hard limit: $1000/month
  - OpenAI Dashboard → Billing → Usage Limits
  - Time: 10 minutes

- [ ] 🟡 **Cost tracking implemented**
  - Verify: Token usage logged per request
  - Check: Redis has daily usage counters
  - Time: 10 minutes

---

## 4. Data & Compliance

### 4.1 Audit Logging
- [ ] 🔴 **Audit logging enabled on all sensitive endpoints**
  - [ ] Chat message view/creation
  - [ ] Mood log access
  - [ ] Login attempts
  - [ ] Crisis alert access
  - [ ] Data exports
  - Time: 15 minutes

- [ ] 🔴 **Audit log query API working**
  - Test: `GET /api/admin/audit-logs?limit=10`
  - Expected: Returns audit logs (admin only)
  - Time: 5 minutes

- [ ] 🟡 **Compliance report generated**
  - Test: `POST /api/admin/audit-logs` (summary endpoint)
  - Expected: 30-day compliance report
  - Time: 10 minutes

### 4.2 Data Privacy
- [ ] 🔴 **Field-level encryption enabled for chat summaries**
  - Verify: `summary` field encrypted in database
  - Test: View raw database record, should be encrypted
  - Time: 10 minutes

- [ ] 🔴 **PII redaction in Sentry**
  - Verify: `sanitizePII()` function removes emails, phones, SSNs
  - Test: Trigger error with PII, check Sentry dashboard
  - Time: 10 minutes

- [ ] 🟡 **Data retention policies documented**
  - Document: How long chat history, mood logs, audit logs kept
  - Time: 15 minutes

### 4.3 Backup & Recovery
- [ ] 🔴 **Database backups enabled**
  - Verify: Supabase auto-backups enabled (daily)
  - Time: 5 minutes

- [ ] 🔴 **Backup restore tested**
  - Test: Restore from yesterday's backup to staging
  - Expected: Restore completes in < 15 minutes
  - Time: 30 minutes

- [ ] 🟡 **Disaster recovery drill completed**
  - Simulate total infrastructure loss
  - Rebuild from backups
  - Expected: Full recovery in < 2 hours
  - Time: 2 hours (optional, can do post-launch)

---

## 5. Crisis Detection & Safety

### 5.1 Crisis Detection System
- [ ] 🔴 **Triple-layer crisis detection enabled**
  - [ ] Layer 1: Regex patterns (coded language)
  - [ ] Layer 2: OpenAI Moderation API
  - [ ] Layer 3: GPT-4 nuanced analysis
  - Time: 10 minutes

- [ ] 🔴 **Crisis detection tested**
  - Test messages: "I want to kill myself", "unalive", "sewerslide"
  - Expected: All detected as CRITICAL
  - Time: 15 minutes

- [ ] 🔴 **Crisis alerts stored in database**
  - Test: Send crisis message, verify `CrisisAlert` record created
  - Time: 5 minutes

- [ ] 🟡 **Crisis escalation workflow tested**
  - Verify: Alert sent to designated contact
  - Time: 15 minutes

### 5.2 Emergency Contacts
- [ ] 🔴 **Emergency contact list configured**
  - [ ] Primary: Sports psychology team email
  - [ ] Secondary: On-call phone number
  - [ ] Escalation: University counseling services
  - Time: 10 minutes

---

## 6. Knowledge Base

### 6.1 Knowledge Base Ingestion
- [ ] 🔴 **Initial knowledge base ingested**
  - Run: `pnpm tsx scripts/ingest-knowledge-base.ts`
  - Expected: 127+ chunks ingested
  - Time: 15 minutes

- [ ] 🔴 **Embeddings generated**
  - Verify: All chunks have `embedding` field populated
  - Time: 10 minutes (included in ingestion)

- [ ] 🟡 **RAG retrieval tested**
  - Test: Chat query about "anxiety before games"
  - Expected: Relevant knowledge retrieved
  - Time: 10 minutes

### 6.2 Knowledge Base Management
- [ ] 🟡 **Admin ingestion API tested**
  - Test: `POST /api/admin/knowledge/ingest` with new chunk
  - Expected: Successfully stored
  - Time: 10 minutes

- [ ] 🟡 **Knowledge base stats API working**
  - Test: `GET /api/admin/knowledge/ingest`
  - Expected: Returns total chunks, category breakdown
  - Time: 5 minutes

---

## 7. Deployment & Infrastructure

### 7.1 Vercel Deployment
- [ ] 🔴 **Production domain configured**
  - Domain: `app.aisportsagent.com`
  - SSL certificate: Auto-provisioned by Vercel
  - Time: 15 minutes

- [ ] 🔴 **Staging deployment working**
  - URL: `staging.aisportsagent.com`
  - Auto-deploys on push to `staging` branch
  - Time: 10 minutes

- [ ] 🔴 **Environment variables set in Vercel**
  - Verify: All required env vars present
  - Verify: Production uses different values than staging
  - Time: 15 minutes

### 7.2 CI/CD Pipeline
- [ ] 🔴 **GitHub Actions passing**
  - [ ] Web App CI (lint, typecheck, tests)
  - [ ] MCP Server CI (if deployed)
  - [ ] Secret scanning
  - Time: 10 minutes

- [ ] 🔴 **Branch protection rules enabled**
  - [ ] `main` branch requires PR review
  - [ ] `main` branch requires passing checks
  - [ ] No force pushes to `main`
  - Time: 10 minutes

- [ ] 🟡 **Deployment notifications configured**
  - Slack/email notification on production deploy
  - Time: 10 minutes

### 7.3 Rollback Plan
- [ ] 🔴 **Rollback tested in staging**
  - Test: `vercel rollback staging.aisportsagent.com`
  - Expected: Reverts to previous deployment
  - Time: 10 minutes

- [ ] 🔴 **Rollback time < 2 minutes**
  - Test: Measure time from "issue detected" to "rollback complete"
  - Time: 15 minutes

---

## 8. Legal & Compliance

### 8.1 Legal Documents
- [ ] 🔴 **Privacy Policy reviewed by legal**
  - URL: `/privacy`
  - Last updated: [Date]
  - Time: Varies (coordinate with legal team)

- [ ] 🔴 **Terms of Service finalized**
  - URL: `/terms`
  - Last updated: [Date]
  - Time: Varies

- [ ] 🟡 **FERPA compliance documented**
  - Document: How app complies with FERPA requirements
  - Time: 1 hour

- [ ] 🟡 **HIPAA considerations documented**
  - Document: Why app is/isn't HIPAA-covered
  - Time: 1 hour

### 8.2 University Approval
- [ ] 🔴 **University IT approval obtained**
  - Security review completed
  - Data handling approved
  - Time: Varies (weeks)

- [ ] 🔴 **Sports psychology department approval**
  - Coaches trained on tool
  - Workflow integrated
  - Time: Varies

- [ ] 🟡 **Student consent forms prepared**
  - Athletes consent to data sharing with coaches
  - Time: 30 minutes

---

## 9. User Testing

### 9.1 Functional Testing
- [ ] 🔴 **Athlete flow tested end-to-end**
  - [ ] Sign up
  - [ ] Chat with AI
  - [ ] Log mood
  - [ ] Set goals
  - [ ] View history
  - Time: 30 minutes

- [ ] 🔴 **Coach flow tested end-to-end**
  - [ ] Sign up
  - [ ] View athlete roster
  - [ ] View weekly summaries (with consent)
  - [ ] View crisis alerts
  - Time: 30 minutes

- [ ] 🟡 **Mobile app tested**
  - [ ] iOS app works
  - [ ] Android app works
  - [ ] Push notifications work
  - Time: 1 hour

### 9.2 Usability Testing
- [ ] 🟡 **5 athletes tested app**
  - Collect feedback
  - Fix critical usability issues
  - Time: 2-4 hours

- [ ] 🟡 **3 coaches tested dashboard**
  - Collect feedback
  - Fix critical usability issues
  - Time: 1-2 hours

---

## 10. Documentation

### 10.1 User Documentation
- [ ] 🟡 **Athlete onboarding guide**
  - How to use chat, log moods, set goals
  - Time: 1 hour

- [ ] 🟡 **Coach onboarding guide**
  - How to view summaries, handle alerts
  - Time: 1 hour

### 10.2 Technical Documentation
- [ ] 🔴 **README.md updated**
  - Accurate setup instructions
  - Deployment guide
  - Time: 30 minutes

- [ ] 🟡 **API documentation**
  - OpenAPI/Swagger spec
  - Time: 2 hours (optional for MVP)

- [ ] 🟡 **Runbooks documented**
  - Incident response procedures (5 scenarios)
  - Time: 1 hour

---

## 11. Final Verification

### 11.1 Pre-Launch Checklist Review
- [ ] 🔴 **All CRITICAL items completed**
  - Count: [X] / [Total Critical]
  - Time: 5 minutes

- [ ] 🔴 **All HIGH priority items completed**
  - Count: [X] / [Total High]
  - Time: 5 minutes

- [ ] 🔴 **Performance audit passed**
  - Run: `pnpm tsx scripts/performance-audit.ts`
  - Expected: No critical failures
  - Time: 10 minutes

- [ ] 🔴 **Load test passed**
  - Run: `k6 run apps/web/tests/load/k6-load-test.js`
  - Expected: p95 < 2000ms, error rate < 1%
  - Time: 15 minutes

### 11.2 Launch Day Prep
- [ ] 🔴 **On-call person identified**
  - Name: [Your name or team member]
  - Contact: [Phone number]
  - Backup: [Backup person]
  - Time: 5 minutes

- [ ] 🔴 **Launch announcement drafted**
  - Email to coaches and athletes
  - Social media posts (if applicable)
  - Time: 30 minutes

- [ ] 🟡 **Post-launch monitoring plan**
  - Monitor Sentry for 4 hours after launch
  - Check UptimeRobot alerts
  - Review first user feedback
  - Time: 4 hours (day of launch)

---

## Summary

### Time Estimates

| Category | Critical Items | High Items | Medium Items | Total Time |
|----------|----------------|------------|--------------|------------|
| Security | 12 | 1 | 0 | ~3 hours |
| Performance | 5 | 6 | 0 | ~2.5 hours |
| Monitoring | 8 | 3 | 0 | ~2 hours |
| Data & Compliance | 6 | 3 | 0 | ~2 hours |
| Crisis Detection | 4 | 1 | 0 | ~1 hour |
| Knowledge Base | 2 | 3 | 0 | ~1 hour |
| Deployment | 9 | 1 | 0 | ~2 hours |
| Legal | 4 | 4 | 0 | Varies |
| Testing | 4 | 4 | 0 | ~3 hours |
| Documentation | 1 | 4 | 0 | ~2 hours |
| Final Verification | 5 | 0 | 1 | ~1 hour |

**Total Estimated Time:**
- Critical: ~15 hours
- High: ~4 hours
- Medium: ~2 hours
- **Total: ~21 hours**

### Ready for Production?

- [ ] All **CRITICAL** items completed ✅
- [ ] All **HIGH** priority items completed ✅
- [ ] Load test passed with p95 < 2000ms ✅
- [ ] No security vulnerabilities (CVE score < 7.0) ✅
- [ ] University approval obtained ✅
- [ ] On-call person ready ✅

**If all checked: READY TO LAUNCH 🚀**

---

**Last Updated:** 2025-01-04
**Version:** 1.0.0
