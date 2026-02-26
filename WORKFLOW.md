# Enhanced Development Workflow

> **Self-improving workflow system** for Flow Sports Coach
> Integrates with `LESSONS.md` for continuous improvement

---

## Quick Reference

```bash
# Start work
./scripts/workflow.sh start

# Before commit
./scripts/workflow.sh pre-commit

# Deploy to staging
./scripts/workflow.sh deploy-staging

# Security audit
./scripts/workflow.sh security

# Add lesson learned
./scripts/workflow.sh lesson
```

---

## 1. Development Workflow

### Starting Work

```bash
# 1. Always start from staging
git checkout staging
git pull origin staging

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Verify environment
cd apps/web
cp .env.example .env.local  # if needed
pnpm install
pnpm dev
```

### During Development

| Action | Command |
|--------|---------|
| Run dev server | `pnpm dev` |
| Type check | `pnpm type-check` |
| Lint | `pnpm lint` |
| Test | `pnpm test` |
| Prisma studio | `pnpm prisma:studio` |

### Pre-Commit Checklist

Before every commit, verify:

- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes (if tests exist)
- [ ] No `.env` files with real secrets staged
- [ ] No `console.log` statements left in code
- [ ] New database tables have RLS policies

```bash
# Quick pre-commit check
pnpm type-check && pnpm lint && git diff --cached --name-only | grep -v ".env"
```

---

## 2. Security Workflow

### Before Every Deployment

```bash
cd apps/web

# Run security audit
node scripts/security-audit.js

# Expected output: "AUDIT PASSED" or "AUDIT PASSED WITH WARNINGS"
# If CRITICAL issues: DO NOT DEPLOY
```

### Security Audit Checks

| Check | Pass Criteria |
|-------|---------------|
| RLS Status | All 46 tables have RLS enabled |
| Policy Count | All critical tables have 2+ policies |
| Column References | No `userId` on `athleteId` tables |
| Wearable Security | OAuth tokens are athlete-only |
| Audit Logs | Restricted to admin/service role |

### When Adding New Tables

1. **In same migration, add RLS:**
```sql
ALTER TABLE "NewTable" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own" ON "NewTable"
  FOR ALL USING ("userId" = auth.uid()::text);

CREATE POLICY "Service role access" ON "NewTable"
  FOR ALL USING (auth.role() = 'service_role');
```

2. **Add to security audit:** Update `scripts/security-audit.js` with new table

3. **Document:** Add to `LESSONS.md` if new pattern discovered

---

## 3. Deployment Workflow

### Staging Deployment

```bash
# 1. Ensure on feature branch with changes committed
git status

# 2. Push to feature branch
git push origin feature/your-feature-name

# 3. Merge to staging
git checkout staging
git pull origin staging
git merge feature/your-feature-name

# 4. Run security audit
cd apps/web && node scripts/security-audit.js

# 5. Push to staging (triggers Vercel deploy)
git push origin staging

# 6. Verify deployment
# Check: https://staging.flowsportscoach.com or Vercel preview URL
```

### Production Deployment (CAREFUL)

```bash
# 1. MUST be on staging, fully tested
git checkout staging

# 2. Run full audit
node scripts/security-audit.js
pnpm type-check
pnpm lint
pnpm test

# 3. Verify production env vars are correct
npx vercel env ls  # Check "Production" column

# 4. Merge to main
git checkout main
git pull origin main
git merge staging

# 5. Push to production
git push origin main

# 6. Monitor for errors
# Check Sentry, Vercel logs
```

### Environment Variable Updates

```bash
cd apps/web

# List current vars
npx vercel env ls

# Update a variable (staging)
printf "new-value\nn\n" | npx vercel env add VAR_NAME preview --force

# Update a variable (production) - BE CAREFUL
printf "new-value\nn\n" | npx vercel env add VAR_NAME production --force

# Pull env to local
npx vercel env pull .env.local
```

---

## 4. Database Workflow

### Schema Changes

```bash
cd apps/web

# 1. Edit schema
code prisma/schema.prisma

# 2. Generate migration
npx prisma migrate dev --name describe_change

# 3. IMPORTANT: Add RLS to new tables
# Edit the generated migration file to add:
# ALTER TABLE "NewTable" ENABLE ROW LEVEL SECURITY;
# CREATE POLICY ...

# 4. Apply to local
npx prisma migrate dev

# 5. Verify RLS
node scripts/security-audit.js
```

### Deploying Migrations

```bash
# Staging (automatic with Prisma)
npx prisma migrate deploy

# Production (manual verification required)
# 1. Backup database first
# 2. Test migration on staging
# 3. Run: npx prisma migrate deploy
```

---

## 5. Incident Response

### When Something Breaks

```bash
# 1. Check error logs
npx vercel logs --follow

# 2. If credential issue, rotate immediately
# See: apps/web/scripts/fix-remaining-rls.js for pattern

# 3. Document in LESSONS.md
```

### Rollback Procedure

```bash
# Vercel rollback (instant)
npx vercel rollback

# Git rollback
git checkout main
git revert HEAD
git push origin main
```

---

## 6. Continuous Improvement

### Adding a Lesson

When you discover something important:

```bash
# Option 1: Manual
code LESSONS.md
# Add entry under appropriate section

# Option 2: Quick add (append to file)
cat >> LESSONS.md << 'EOF'

### $(date +%Y-%m-%d): Title
**Severity:** MEDIUM
**Discovery:** What happened
**Fix:** What was done
**Prevention:** How to prevent

EOF
```

### Lesson Categories

| Category | What to Document |
|----------|-----------------|
| **Security** | Vulnerabilities, fixes, hardening |
| **Database** | Schema issues, migration gotchas |
| **Deployment** | CI/CD problems, env var issues |
| **Code Patterns** | Useful patterns discovered |
| **Architecture** | Design decisions and rationale |
| **Performance** | Optimizations, bottlenecks |
| **Testing** | Test strategies, coverage gaps |
| **Operational** | Monitoring, costs, alerts |

### Weekly Review

Every week:

1. Review `LESSONS.md` for patterns
2. Update checklists if new prevention steps needed
3. Add automation for repeated manual checks
4. Archive resolved incidents

---

## 7. Automation Scripts

### `scripts/workflow.sh`

```bash
#!/bin/bash
# Enhanced workflow automation

case "$1" in
  start)
    git checkout staging && git pull origin staging
    echo "✓ Ready to create feature branch"
    ;;

  pre-commit)
    cd apps/web
    pnpm type-check && pnpm lint && node scripts/security-audit.js
    ;;

  deploy-staging)
    cd apps/web
    node scripts/security-audit.js && \
    git push origin staging
    ;;

  security)
    cd apps/web && node scripts/security-audit.js
    ;;

  lesson)
    echo "Opening LESSONS.md..."
    code LESSONS.md
    ;;

  *)
    echo "Usage: ./scripts/workflow.sh {start|pre-commit|deploy-staging|security|lesson}"
    ;;
esac
```

---

## 8. Checklists

### New Feature Checklist

- [ ] Created feature branch from staging
- [ ] Implemented feature
- [ ] Added/updated types in `packages/types`
- [ ] Added API route with proper auth middleware
- [ ] Added RLS policies for any new tables
- [ ] Type check passes
- [ ] Lint passes
- [ ] Security audit passes
- [ ] Tested locally
- [ ] Committed with descriptive message
- [ ] Merged to staging
- [ ] Verified on staging environment

### Production Release Checklist

- [ ] All features tested on staging for 24+ hours
- [ ] Security audit passes
- [ ] No CRITICAL issues in `LESSONS.md` unresolved
- [ ] Env vars verified for production
- [ ] Database migrations tested
- [ ] Rollback plan ready
- [ ] Team notified
- [ ] Merged to main
- [ ] Monitoring dashboards open
- [ ] Post-deploy verification complete

### Security Audit Checklist

- [ ] `node scripts/security-audit.js` passes
- [ ] No credentials in git: `git ls-files | xargs grep -l "sk-\|eyJ" 2>/dev/null`
- [ ] RLS enabled on all tables
- [ ] Demo accounts disabled for production
- [ ] Cost limits enabled
- [ ] Rate limiting enabled
- [ ] HTTPS enforced

---

## 9. File Locations

| Purpose | File |
|---------|------|
| Lessons learned | `LESSONS.md` |
| This workflow | `WORKFLOW.md` |
| Architecture | `ARCHITECTURE.md` |
| Component status | `COMPONENT_STATUS.md` |
| AI context | `CLAUDE.md` |
| Setup guide | `SETUP.md` |
| Security audit | `apps/web/scripts/security-audit.js` |
| RLS migration | `apps/web/supabase/migrations/` |
| Env templates | `config/environments/` |

---

## 10. Emergency Contacts

| Issue | Action |
|-------|--------|
| Security breach | Rotate all credentials, check audit logs |
| Database down | Check Supabase status, connection pooler |
| Vercel down | Check status.vercel.com, use rollback |
| Cost spike | Check TokenUsage table, enable circuit breaker |
| Crisis alert | Escalate to configured emergency email |

---

*This workflow is self-improving. Update it when you learn something new.*
*Last updated: 2026-02-17*
