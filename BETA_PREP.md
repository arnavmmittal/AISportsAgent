# Beta Launch Preparation

> **UW Women's Basketball Pilot** - 8-week beta with 15 athletes
> Target: Validate mental readiness → performance correlation

---

## Pre-Launch Checklist

### Security ✅ COMPLETE
- [x] RLS enabled on all 46 tables
- [x] 103 security policies created
- [x] Security audit passes
- [x] Credentials rotated (except Supabase legacy keys)
- [x] Crisis escalation endpoint working

### Infrastructure ✅ COMPLETE
- [x] Vercel Preview environment configured (21 env vars)
- [x] Supabase database running
- [x] Cron jobs defined (escalation, weekly summaries)
- [x] Cost controls enabled ($500/day circuit breaker)

### Functionality ✅ COMPLETE
- [x] Athlete chat working (LangGraph streaming)
- [x] Mood tracking functional
- [x] Goal management functional
- [x] Coach dashboard functional
- [x] Crisis detection implemented (3-layer)

### Before Pilot Start
- [ ] Create 15 athlete accounts
- [ ] Create 1 coach account
- [ ] Set up pilot-specific monitoring dashboard
- [ ] Brief coach on crisis alert workflow
- [ ] Test notification delivery (email/push)

---

## Pilot User Setup

### Creating Athlete Accounts

```bash
# Option 1: Seed script (if exists)
cd apps/web
npm run db:seed

# Option 2: Manual via Prisma Studio
npx prisma studio
# Create users with role: ATHLETE
```

### Account Information to Provide

| Athlete | Email | Temp Password |
|---------|-------|---------------|
| Player 1 | athlete1@uw.edu | TempPass2026! |
| Player 2 | athlete2@uw.edu | TempPass2026! |
| ... | ... | ... |

**Coach:**
| Role | Email | Temp Password |
|------|-------|---------------|
| Sports Psych | coach@uw.edu | CoachPass2026! |

---

## Crisis Detection Testing

### Keywords That Trigger Alerts

**Immediate Crisis (HIGH severity):**
```
- "suicid*" (any form)
- "kill myself" / "kill self"
- "end my life" / "end it all"
- "not worth living"
- "better off dead"
- "self-harm" / "cutting myself"
```

**Coded Language (MEDIUM severity):**
```
- "unalive"
- "go to sleep forever"
- "final solution"
- "can't do this anymore"
- "everyone would be better without me"
```

**Performance Distress (LOW - noteworthy):**
```
- "want to give up"
- "want to quit the team"
- "hate myself"
- "feel like a failure"
```

### Testing Before Launch

```bash
# Test escalation endpoint works
curl -X GET http://localhost:3000/api/cron/escalation \
  -H "Authorization: Bearer $CRON_SECRET"

# Expected: {"success": true, ...}
```

### Crisis Response Flow

```
1. Athlete sends concerning message
   ↓
2. Crisis detection flags it (keyword/coded/AI)
   ↓
3. CrisisAlert created in database
   ↓
4. Coach receives notification (email/push)
   ↓
5. If not reviewed in 5 min → Escalation cron triggers
   ↓
6. Higher-level notification sent
```

---

## Monitoring During Pilot

### Daily Checks

```bash
# 1. Check for unreviewed crisis alerts
SELECT * FROM "CrisisAlert"
WHERE "reviewedAt" IS NULL
ORDER BY "createdAt" DESC;

# 2. Check active users
SELECT COUNT(DISTINCT "athleteId")
FROM "ChatSession"
WHERE "createdAt" > NOW() - INTERVAL '24 hours';

# 3. Check cost usage
SELECT SUM("totalCost")
FROM "TokenUsage"
WHERE "createdAt" > NOW() - INTERVAL '24 hours';
```

### Vercel Dashboard

- Monitor deployment health
- Check function logs for errors
- Watch for 5xx error spikes

### Sentry (if configured)

- Set up alerts for:
  - Error rate > 1%
  - Unhandled exceptions
  - Crisis detection failures

---

## Success Metrics

### Week-by-Week Targets

| Week | Active Users | Mood Logs | Chat Sessions |
|------|--------------|-----------|---------------|
| 1 | 10+ (67%) | 30+ | 15+ |
| 2 | 12+ (80%) | 50+ | 25+ |
| 3-4 | 10+ sustained | 70+ | 30+ |
| 5-8 | 9+ (60%) | 100+ | 50+ |

### Key Hypotheses to Validate

1. **Correlation**: Mental readiness score correlates with game performance (r > 0.5)
2. **Adoption**: 60%+ weekly active users
3. **Engagement**: 50%+ mood log completion rate
4. **Value**: Coach finds insights actionable

### Data to Collect

```sql
-- Correlation analysis
SELECT
  r."score" as readiness,
  g."points" as performance,
  g."date"
FROM "ReadinessScore" r
JOIN "GameResult" g ON r."athleteId" = g."athleteId"
WHERE r."date" = g."date" - INTERVAL '1 day';

-- Engagement metrics
SELECT
  DATE_TRUNC('week', "createdAt") as week,
  COUNT(DISTINCT "athleteId") as active_users,
  COUNT(*) as total_sessions
FROM "ChatSession"
GROUP BY 1
ORDER BY 1;
```

---

## Launch Day Checklist

### T-1 Day (Day Before)

- [ ] Final security audit: `node scripts/security-audit.js`
- [ ] Test all critical flows manually
- [ ] Verify coach can see crisis alerts
- [ ] Confirm notification delivery works
- [ ] Brief support team (if any)

### Launch Day

- [ ] Monitor first logins
- [ ] Watch for errors in Vercel logs
- [ ] Be available for quick fixes
- [ ] Check first mood logs are saved
- [ ] Verify first chat sessions work

### T+1 Day (Day After)

- [ ] Review overnight error logs
- [ ] Check user engagement metrics
- [ ] Address any reported issues
- [ ] Send "how's it going?" to coach

---

## Emergency Procedures

### If Chat Goes Down

```bash
# 1. Check Vercel status
# 2. Check OpenAI status
# 3. Roll back if recent deploy broke it
npx vercel rollback
```

### If Database Goes Down

```bash
# 1. Check Supabase status page
# 2. Contact Supabase support
# 3. App will show error states gracefully
```

### If Crisis Detection Fails

```bash
# 1. Check OpenAI API status (Moderation API)
# 2. Keyword detection still works without API
# 3. Manually review recent chat sessions
SELECT * FROM "Message"
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" DESC;
```

### If Costs Spike

The circuit breaker triggers automatically at $500/day. If it triggers:
1. Check which users are consuming most
2. Look for abuse or infinite loops
3. Reset circuit breaker after fixing

---

## Post-Pilot Analysis

### Week 9: Gather Results

```sql
-- Calculate correlations (simplified)
SELECT
  CORR(r."score", g."points") as readiness_performance_correlation
FROM "ReadinessScore" r
JOIN "GameResult" g ON ...;

-- Engagement summary
SELECT
  COUNT(DISTINCT "athleteId") as total_athletes,
  AVG(weekly_sessions) as avg_sessions_per_week,
  ...
FROM ...;
```

### Pilot Report Template

1. **Executive Summary** - Key findings
2. **Engagement Metrics** - DAU, WAU, retention
3. **Correlation Analysis** - Readiness vs. performance
4. **Coach Feedback** - Qualitative insights
5. **Technical Performance** - Uptime, errors, costs
6. **Recommendations** - Go/no-go for expansion

---

## Support Contact

During pilot, athletes should contact:
- **Technical issues**: [Your email]
- **Urgent mental health**: National hotline 988, Campus counseling [number]

The AI will also display these resources when crisis is detected.

---

*Prepared for UW Women's Basketball Pilot*
*Start Date: TBD*
*Duration: 8 weeks*
