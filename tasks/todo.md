# Flow Sports Coach - Todo

> **Active task list** for current sprint.
> Check `LESSONS.md` in project root for lessons learned.
> See `PRODUCTION_CHECKLIST.md` for full deployment checklist.

---

## Production Readiness (BLOCKING)

### Security - Must Complete
- [ ] Apply ChatSummary RLS policies (migration created: 20260226_fix_chatsummary_policies.sql)
- [ ] Apply missing policies for 5 tables (migration created: 20260226_add_missing_policies.sql)
- [ ] Run security audit - must show "AUDIT PASSED"
- [ ] Rotate Supabase service role key (requires Supabase dashboard)
- [ ] Test athlete data isolation (Athlete A cannot see Athlete B's data)

### Safety - Must Complete
- [ ] Test crisis detection with all keywords
- [ ] Test escalation cron job end-to-end
- [ ] Verify emergency resources appear in crisis responses

### Verification
- [ ] Run `npm run test:rls` - all tests must pass
- [ ] Manual test: coach with consent can see athlete data
- [ ] Manual test: coach without consent CANNOT see athlete data

---

## Current Sprint (After Production Blockers)

### High Priority
- [ ] Add pre-commit hook for secrets detection
- [ ] Set up CI/CD pipeline with security audit
- [ ] Add comprehensive API route tests

### Medium Priority
- [ ] Add monitoring/alerting for cost spikes
- [ ] Document API endpoints in OpenAPI format
- [ ] Configure Sentry alerts

### Low Priority
- [ ] Add performance benchmarks
- [ ] Optimize database queries with indexes

---

## Backlog

### MVP Features
- [ ] Voice chat integration
- [ ] Enhanced coach dashboard
- [ ] Email notifications for crisis alerts (beyond escalation)

### Security Hardening
- [ ] Add rate limiting to all API routes
- [ ] Implement session timeout
- [ ] HIPAA compliance review

### Performance
- [ ] Add Redis caching layer
- [ ] Connection pooling verification

---

## Completed

### 2026-02-26
- [x] Run comprehensive production readiness assessment
- [x] Create PRODUCTION_CHECKLIST.md
- [x] Create ChatSummary RLS policy fix migration
- [x] Create missing policies migration for warning tables
- [x] Verify cron jobs are fully implemented (escalation, weekly summaries)
- [x] Verify credentials are NOT in git (only templates)
- [x] Update global workflow system

### 2026-02-17
- [x] Create comprehensive ARCHITECTURE.md
- [x] Remove exposed credentials from git
- [x] Enable RLS on all 46 tables
- [x] Create 96 security policies
- [x] Rotate OpenAI API key
- [x] Rotate ElevenLabs API key
- [x] Rotate NEXTAUTH_SECRET
- [x] Rotate CRON_SECRET
- [x] Rotate SUMMARY_ENCRYPTION_KEY
- [x] Create security audit script
- [x] Update Vercel preview environment variables
- [x] Create LESSONS.md self-improving knowledge base
- [x] Create WORKFLOW.md development workflow
- [x] Create workflow.sh automation script

---

*Updated: 2026-02-26*
