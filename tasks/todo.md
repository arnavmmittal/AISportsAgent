# Flow Sports Coach - Todo

> **Active task list** for current sprint.
> Check `LESSONS.md` in project root for lessons learned.
> See `PRODUCTION_CHECKLIST.md` for full deployment checklist.

---

## Production Readiness - Current Status

### ✅ COMPLETED (this session)
- [x] Run comprehensive security audit
- [x] Fix ChatSummary → chat_summaries table name mismatch
- [x] Enable RLS on chat_summaries table
- [x] Add 2 policies to chat_summaries
- [x] Add policies to 5 warning tables (Coach, ConversationInsight, etc.)
- [x] Security audit now shows: **PASSED** (46/46 tables, 103 policies)
- [x] Correct product positioning in documentation
- [x] Update global lessons with product understanding

### ⏳ NEEDS MANUAL TESTING
- [ ] Test crisis escalation cron end-to-end (requires running server)
- [ ] Test crisis detection with all keywords
- [ ] Verify emergency resources appear in crisis responses
- [ ] Manual test: athlete data isolation
- [ ] Manual test: coach consent flows

### ⏳ NEEDS MANUAL ACTION (Supabase Dashboard)
- [ ] Rotate Supabase service role key
  - Go to: Supabase Dashboard → Settings → API → Regenerate
  - Update Vercel: `vercel env add SUPABASE_SERVICE_ROLE_KEY preview --force`

---

## Next Sprint

### High Priority
- [ ] Add pre-commit hook for secrets detection
- [ ] Set up CI/CD pipeline with security audit
- [ ] Add comprehensive API route tests

### Medium Priority
- [ ] Configure Sentry alerts for production
- [ ] Document API endpoints in OpenAPI format

### Low Priority
- [ ] Add performance benchmarks
- [ ] Optimize database queries with indexes

---

## Backlog

### MVP Features
- [ ] Voice chat integration enhancements
- [ ] Enhanced coach dashboard analytics
- [ ] Email notifications for crisis alerts

### Security Hardening
- [ ] Add rate limiting to all API routes
- [ ] Implement session timeout
- [ ] FERPA compliance review

---

## Completed

### 2026-02-26
- [x] Run comprehensive production readiness assessment
- [x] Create PRODUCTION_CHECKLIST.md
- [x] Enable RLS on chat_summaries table (was missing)
- [x] Add policies to chat_summaries (2 policies)
- [x] Add policies to Coach, ConversationInsight, InterventionOutcome, AthleteModel, CoachNote
- [x] Fix security audit script (ChatSummary → chat_summaries)
- [x] Security audit: **46/46 tables RLS enabled, 103 policies**
- [x] Verify cron jobs are fully implemented
- [x] Correct product positioning (mental PERFORMANCE, not mental health)
- [x] Update LESSONS.md with product positioning lesson
- [x] Update global workflow system

### 2026-02-17
- [x] Create comprehensive ARCHITECTURE.md
- [x] Remove exposed credentials from git
- [x] Enable RLS on all 46 tables
- [x] Create 96 security policies (now 103)
- [x] Rotate OpenAI, ElevenLabs, NEXTAUTH_SECRET, CRON_SECRET, SUMMARY_ENCRYPTION_KEY
- [x] Create security audit script
- [x] Update Vercel preview environment variables
- [x] Create LESSONS.md, WORKFLOW.md, workflow.sh

---

*Updated: 2026-02-26*
