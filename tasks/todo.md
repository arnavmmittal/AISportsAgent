# Flow Sports Coach - Todo

> **Active task list** for current sprint.
> Check `LESSONS.md` in project root for lessons learned.

---

## Current Sprint

### High Priority
- [ ] Verify Supabase RLS policies are working correctly
- [ ] Rotate Supabase service role key (requires Supabase dashboard)
- [ ] Test athlete data isolation between users
- [ ] Implement cost tracking circuit breaker

### Medium Priority
- [ ] Add pre-commit hook for secrets detection
- [ ] Set up CI/CD pipeline with security audit
- [ ] Complete ChatSummary table migration
- [ ] Add comprehensive API route tests

### Low Priority
- [ ] Add monitoring/alerting for cost spikes
- [ ] Document API endpoints in OpenAPI format
- [ ] Add performance benchmarks

---

## Backlog

### MVP Features
- [ ] Voice chat integration
- [ ] Coach dashboard with aggregated insights
- [ ] Weekly report generation
- [ ] Email notifications for crisis alerts

### Security Hardening
- [ ] Add rate limiting to all API routes
- [ ] Implement session timeout
- [ ] Add audit logging for data access
- [ ] HIPAA compliance review

### Performance
- [ ] Optimize database queries with indexes
- [ ] Add Redis caching layer
- [ ] Implement connection pooling verification

---

## Completed

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

*Updated: 2026-02-17*
