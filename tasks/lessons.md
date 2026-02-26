# Flow Sports Coach - Quick Lessons Reference

> **Pointer file** - Full lessons are in `/LESSONS.md` at project root.
> This file provides quick navigation and recent highlights.

---

## Recent Critical Issues

| Date | Issue | Status |
|------|-------|--------|
| 2026-02-17 | Credentials exposed in git | ✅ Fixed, rotated |
| 2026-02-17 | RLS disabled on all tables | ✅ Fixed, 96 policies |
| 2026-02-17 | Supabase keys need rotation | ⏳ Pending (manual) |

---

## Quick Reference

### Security Commands
```bash
# Run security audit
cd apps/web && node scripts/security-audit.js

# Check for secrets in staged files
git diff --cached --name-only | xargs grep -l "sk-proj-\|sk_\|eyJhbGci"

# List files that might contain secrets
git ls-files | xargs grep -l "sk-\|eyJ" 2>/dev/null
```

### Deployment Commands
```bash
# Pre-commit checks
./scripts/workflow.sh pre-commit

# Deploy to staging
./scripts/workflow.sh deploy-staging

# Check project status
./scripts/workflow.sh status
```

---

## Key Patterns Learned

1. **RLS First**: Add RLS in same migration that creates table
2. **Service Role Bypass**: All policies need service role access
3. **Consent-Based Access**: Coaches need athlete consent
4. **Connection Pooler**: Use port 6543, not 5432

---

## Full Documentation

- **Detailed Lessons**: `/LESSONS.md`
- **Workflow Guide**: `/WORKFLOW.md`
- **Architecture**: `/ARCHITECTURE.md`
- **Security Audit**: `/apps/web/scripts/security-audit.js`

---

*See `/LESSONS.md` for complete lessons with full context.*
