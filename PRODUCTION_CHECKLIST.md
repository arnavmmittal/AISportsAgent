# Production Readiness Checklist

> **Flow Sports Coach** - Final checklist before university deployment
> **Created**: 2026-02-26
> **Status**: IN PROGRESS

---

## Critical Understanding

Flow Sports Coach is a **mental performance analytics platform** - not a mental health app. The core purpose is:

1. **Predictive analytics**: Correlate mental readiness with game performance
2. **Scalable support**: Replace impossible 1:150 sports psychologist ratio with 24/7 AI coaching
3. **Competitive edge**: Data-driven lineup decisions and intervention prioritization

**Safety guardrails** (crisis detection, escalation) exist for liability protection, but are not the primary focus.

**Before production, verify:**
1. Data privacy (FERPA compliance for student athletes)
2. Cost controls (prevent runaway OpenAI spending)
3. Crisis escalation works (legal/safety requirement)

---

## Phase 1: Security Verification (BLOCKING)

### 1.1 ChatSummary Table Policies
**Status**: ⏳ PENDING
**Issue**: Security audit reports 0 policies on ChatSummary table
**Action**:
```sql
-- Check if table exists
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ChatSummary');

-- If exists, add policies:
ALTER TABLE "ChatSummary" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view own summaries" ON "ChatSummary"
  FOR SELECT USING ("athleteId" = auth.uid()::text);

CREATE POLICY "Coaches can view with consent" ON "ChatSummary"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "CoachAthleteRelation"
      WHERE "coachId" = auth.uid()::text
        AND "athleteId" = "ChatSummary"."athleteId"
        AND "consentChatSummaries" = true
    )
  );

CREATE POLICY "Service role access" ON "ChatSummary"
  FOR ALL USING (auth.role() = 'service_role');
```

### 1.2 RLS Verification Test
**Status**: ⏳ PENDING
**Action**: Create test to verify Athlete A cannot access Athlete B's data
```bash
# Run RLS verification tests
cd apps/web && npm run test:rls
```

### 1.3 Supabase Service Role Key Rotation
**Status**: ⏳ PENDING (Manual)
**Action**:
1. Go to Supabase Dashboard → Settings → API
2. Regenerate service_role key
3. Update in Vercel: `vercel env add SUPABASE_SERVICE_ROLE_KEY preview --force`
4. Update local .env.local

---

## Phase 2: Crisis Safety Verification (BLOCKING)

### 2.1 Crisis Detection Test
**Status**: ⏳ PENDING
**Action**: Verify all crisis patterns are detected
```typescript
// Test cases that MUST trigger alerts:
- "I want to kill myself"
- "thinking about ending it all"
- "I've been cutting"
- "unalive" (coded language)
- "coach touched me inappropriately" (abuse)
```

### 2.2 Escalation Pipeline Test
**Status**: ⏳ PENDING
**Action**:
1. Create test crisis alert in staging DB
2. Run escalation cron: `curl -H "Authorization: Bearer $CRON_SECRET" https://staging.../api/cron/escalation`
3. Verify coach receives email notification
4. Verify alert is marked as escalated

### 2.3 Emergency Resources Display
**Status**: ⏳ PENDING
**Action**: Verify crisis responses include:
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- School-specific counseling center number

---

## Phase 3: Data Privacy Verification (BLOCKING)

### 3.1 Cross-Tenant Isolation
**Status**: ⏳ PENDING
**Action**: Verify School A cannot access School B's data
- Test with two different school accounts
- Attempt to query other school's athletes
- Must return empty/403

### 3.2 Coach-Athlete Consent
**Status**: ⏳ PENDING
**Action**: Verify coaches can only see athlete data when consent is granted
- Create athlete with `consentCoachView: false`
- Attempt to view from coach account
- Must be blocked

### 3.3 Audit Logging
**Status**: ⏳ PENDING
**Action**: Verify all data access is logged
- Check AuditLog table after chat session
- Verify entries include: userId, action, resourceId, timestamp

---

## Phase 4: Operational Readiness (IMPORTANT)

### 4.1 Cost Circuit Breaker Test
**Status**: ⏳ PENDING
**Action**: Verify circuit breaker activates at $500/day
```typescript
// In test environment, set COST_LIMIT_DAILY_PER_SCHOOL = 1
// Make requests until limit hit
// Verify 429 response: "Cost limit exceeded"
```

### 4.2 Error Monitoring
**Status**: ⏳ PENDING
**Action**:
- [ ] Verify Sentry DSN is configured
- [ ] Test error reporting with intentional error
- [ ] Set up Slack/email alerts for errors

### 4.3 Database Backup
**Status**: ⏳ PENDING
**Action**: Verify Supabase daily backups are enabled
- Dashboard → Database → Backups
- Point-in-time recovery enabled

---

## Phase 5: Warning Fixes (NON-BLOCKING)

### 5.1 Tables with Single Policies
**Issue**: 5 tables have only 1 policy
**Tables**: Coach, ConversationInsight, InterventionOutcome, AthleteModel, CoachNote
**Action**: Add user access policies (service role only isn't enough)
**Priority**: LOW - these are coach/admin tables, not athlete-facing

---

## Sign-Off Criteria

Before deploying to production with real university athletes:

- [ ] **Security Lead**: All Phase 1 items complete
- [ ] **Product Owner**: All Phase 2 items complete
- [ ] **Legal/Compliance**: All Phase 3 items complete
- [ ] **Operations**: All Phase 4 items complete

---

## Quick Commands

```bash
# Run full security audit
cd apps/web && node scripts/security-audit.js

# Run RLS tests
cd apps/web && npm run test:rls

# Check deployment status
./scripts/workflow.sh status

# View recent crisis alerts (staging)
npx prisma studio
```

---

## Post-Launch Monitoring

After production launch, monitor:

1. **Crisis Alerts/Day** - Should be < 1% of active users
2. **Cost/School/Day** - Should be < $50 average
3. **Error Rate** - Should be < 0.1%
4. **Response Latency** - P95 should be < 3s

---

*This checklist must be 100% complete before production launch.*
*Last updated: 2026-02-26*
