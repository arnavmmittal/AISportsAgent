# CI/CD Testing Infrastructure Guide

**Status:** Documentation for automated testing pipeline
**Target:** Instagram/WHOOP-level continuous integration
**Last Updated:** January 5, 2026

---

## Overview

This guide documents the complete CI/CD testing infrastructure that ensures code quality, security, and production readiness before any deployment.

**Goals:**
- **Test Coverage:** > 80% for critical paths
- **Build Time:** < 5 minutes for typical PR
- **Deploy Time:** < 2 minutes to production
- **Zero Downtime:** Blue-green deployments
- **Auto-Rollback:** < 30 seconds if health checks fail

---

## CI/CD Pipeline Architecture

```
┌─────────────────┐
│   Developer     │
│  Commits Code   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  GitHub PR      │
│   (Feature)     │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────────────┐
│       GitHub Actions CI Pipeline            │
│                                             │
│  1. Lint (ESLint, Prettier)                │
│  2. Type Check (TypeScript)                │
│  3. Unit Tests (Vitest)                    │
│  4. Integration Tests (Prisma + DB)        │
│  5. Security Scan (npm audit, Snyk)        │
│  6. Build (Next.js production)             │
│  7. E2E Tests (Playwright - optional)      │
│                                             │
│  All must pass ✅ before merge             │
└────────┬────────────────────────────────────┘
         │
         ↓
┌─────────────────┐
│  Merge to Main  │
│  (Protected)    │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────────────┐
│       Vercel Deploy Pipeline                │
│                                             │
│  1. Build production bundle                │
│  2. Deploy to staging (auto)               │
│  3. Run smoke tests                        │
│  4. Manual approval required               │
│  5. Deploy to production                   │
│  6. Health check verification              │
│  7. Auto-rollback if checks fail           │
└─────────────────────────────────────────────┘
```

---

## 1. GitHub Actions Workflow

### File Structure

```
.github/
└── workflows/
    ├── ci.yml              # Main CI pipeline
    ├── security.yml        # Security scanning
    ├── integration.yml     # Integration tests
    └── deploy-staging.yml  # Auto-deploy staging
```

### Main CI Workflow

**File: `.github/workflows/ci.yml`**

```yaml
name: CI Pipeline

on:
  pull_request:
    branches: [main, staging]
  push:
    branches: [main, staging]

# Prevent concurrent runs on same PR
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # Job 1: Lint and Format Check
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm run lint

      - name: Check formatting (Prettier)
        run: pnpm exec prettier --check "**/*.{ts,tsx,js,jsx,json,css,md}"

  # Job 2: Type Check
  typecheck:
    name: TypeScript Type Check
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run type check
        run: pnpm run type-check

  # Job 3: Unit Tests
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm run test:unit

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

  # Job 4: Integration Tests (with Postgres)
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15

    # Postgres service for integration tests
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup test database
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        run: |
          pnpm prisma generate
          pnpm prisma db push

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          NEXTAUTH_SECRET: test-secret-for-ci
          NEXTAUTH_URL: http://localhost:3000
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY_TEST }}
        run: pnpm run test:integration

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: test-results/

  # Job 5: Security Scan
  security:
    name: Security Audit
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run npm audit
        run: pnpm audit --audit-level=high
        continue-on-error: true # Don't fail on low/medium vulnerabilities

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Check for secrets in code
        run: |
          if grep -r "sk-" apps/web/src/ 2>/dev/null | grep -v ".test." | grep -v ".spec."; then
            echo "ERROR: API keys found in source code!"
            exit 1
          fi
          echo "✓ No secrets in code"

      - name: Verify environment validation
        run: |
          if grep -r "ENABLE_DEMO_ACCOUNTS.*true" apps/web/.env.production 2>/dev/null; then
            echo "ERROR: Demo accounts enabled in production!"
            exit 1
          fi
          echo "✓ Demo accounts disabled in production"

  # Job 6: Build
  build:
    name: Production Build
    runs-on: ubuntu-latest
    timeout-minutes: 10
    needs: [lint, typecheck, unit-tests] # Run after basic checks pass

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Next.js app
        run: pnpm run build
        env:
          NODE_ENV: production
          # Use dummy env vars for build
          DATABASE_URL: postgresql://dummy:dummy@localhost:5432/dummy
          NEXTAUTH_SECRET: dummy-secret-for-build
          NEXTAUTH_URL: https://app.flowsportscoach.com
          OPENAI_API_KEY: sk-dummy

      - name: Check build output size
        run: |
          BUILD_SIZE=$(du -sh apps/web/.next | cut -f1)
          echo "Build size: $BUILD_SIZE"

      - name: Upload build artifacts (for debugging)
        uses: actions/upload-artifact@v3
        with:
          name: build-output
          path: apps/web/.next/
          retention-days: 7

  # Job 7: Status Check (required for PR merge)
  status-check:
    name: All Checks Passed
    runs-on: ubuntu-latest
    needs: [lint, typecheck, unit-tests, integration-tests, security, build]
    if: always()

    steps:
      - name: Check if all jobs passed
        run: |
          if [[ "${{ needs.lint.result }}" != "success" ]] || \
             [[ "${{ needs.typecheck.result }}" != "success" ]] || \
             [[ "${{ needs.unit-tests.result }}" != "success" ]] || \
             [[ "${{ needs.integration-tests.result }}" != "success" ]] || \
             [[ "${{ needs.security.result }}" != "success" ]] || \
             [[ "${{ needs.build.result }}" != "success" ]]; then
            echo "❌ Some checks failed"
            exit 1
          fi
          echo "✅ All checks passed!"
```

---

## 2. Test Scripts

### Package.json Scripts

**File: `apps/web/package.json`**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:watch": "vitest watch",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,css,md}\""
  }
}
```

### Vitest Config for Integration Tests

**File: `vitest.integration.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup-integration.ts'],
    testTimeout: 30000, // 30 seconds for database operations
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**File: `tests/setup-integration.ts`**

```typescript
import { beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';

beforeAll(async () => {
  // Ensure test database is ready
  console.log('Setting up test database...');

  try {
    // Run migrations
    execSync('pnpm prisma generate', { stdio: 'inherit' });
    execSync('pnpm prisma db push', { stdio: 'inherit' });
    console.log('✓ Test database ready');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
});

afterAll(async () => {
  console.log('Cleaning up test database...');
  // Cleanup is handled in individual test files
});
```

---

## 3. Protected Branch Rules

### GitHub Branch Protection (Main Branch)

```yaml
Branch: main

Require pull request reviews before merging:
  ✅ Required approving reviews: 1
  ✅ Dismiss stale reviews when new commits are pushed
  ✅ Require review from Code Owners (if CODEOWNERS file exists)

Require status checks to pass before merging:
  ✅ Require branches to be up to date before merging

  Required status checks:
    - Lint & Format
    - TypeScript Type Check
    - Unit Tests
    - Integration Tests
    - Security Audit
    - Production Build
    - All Checks Passed

Require conversation resolution before merging:
  ✅ All conversations must be resolved

Require signed commits:
  ⬜ Optional (recommended for high security)

Require linear history:
  ⬜ Optional (prevents merge commits, forces rebase)

Do not allow bypassing the above settings:
  ✅ Enabled (even admins must pass checks)

Allow force pushes:
  ❌ Disabled

Allow deletions:
  ❌ Disabled
```

---

## 4. Pre-Commit Hooks (Optional but Recommended)

### Setup Husky

```bash
pnpm add -D husky lint-staged
npx husky init
```

**File: `.husky/pre-commit`**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm exec lint-staged
```

**File: `.lintstagedrc.js`**

```javascript
module.exports = {
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  '**/*.{json,css,md}': [
    'prettier --write',
  ],
  '**/*.ts?(x)': () => 'tsc --noEmit', // Type check all files
};
```

**Benefits:**
- Catches errors before pushing to GitHub
- Auto-formats code on commit
- Prevents committing broken code
- Faster feedback loop

---

## 5. Deployment Pipeline (Vercel)

### Vercel Configuration

**File: `vercel.json`**

```json
{
  "buildCommand": "pnpm run build",
  "devCommand": "pnpm run dev",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### Auto-Deploy Staging

**File: `.github/workflows/deploy-staging.yml`**

```yaml
name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  deploy:
    name: Deploy to Vercel Staging
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        id: deploy
        run: |
          url=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
          echo "url=$url" >> $GITHUB_OUTPUT

      - name: Run smoke tests
        run: |
          # Wait for deployment to be ready
          sleep 10

          # Test homepage
          STATUS=$(curl -o /dev/null -s -w "%{http_code}" ${{ steps.deploy.outputs.url }})
          if [ $STATUS -ne 200 ]; then
            echo "Staging deployment health check failed (status: $STATUS)"
            exit 1
          fi

          echo "✓ Staging deployment successful: ${{ steps.deploy.outputs.url }}"

      - name: Comment on PR (if exists)
        uses: actions/github-script@v6
        if: github.event_name == 'pull_request'
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Deployed to staging: ${{ steps.deploy.outputs.url }}`
            })
```

### Manual Production Deploy

```yaml
# Production deployments require manual approval
# Configure in Vercel dashboard:
# 1. Settings → Git → Production Branch: main
# 2. Deploy Hooks → Create Deploy Hook (for rollback)
# 3. Protection: Require approval from team before production deploy
```

---

## 6. Rollback Procedures

### Vercel Rollback

**Via Vercel Dashboard:**
```
1. Go to project → Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"
4. Confirm (takes < 30 seconds)
```

**Via Vercel CLI:**
```bash
# List recent deployments
vercel list

# Rollback to specific deployment
vercel rollback [deployment-url]

# Or use deploy hook for instant rollback
curl -X POST https://api.vercel.com/v1/integrations/deploy/[hook-id]
```

### Database Migration Rollback

```bash
# If migration caused issues
pnpm prisma migrate resolve --rolled-back [migration-name]

# Or restore from backup
pg_restore -d $DATABASE_URL backup_file.dump
```

### Feature Flag Rollback

```typescript
// Kill switch via Redis (fastest rollback)
redis-cli SET disable_feature_x "true" EX 3600

// Or via PostHog feature flag (toggle in UI)
```

---

## 7. Testing Checklist

### Before Every PR

- [ ] All unit tests pass locally (`pnpm run test:unit`)
- [ ] All integration tests pass locally (`pnpm run test:integration`)
- [ ] Type check passes (`pnpm run type-check`)
- [ ] Linting passes (`pnpm run lint`)
- [ ] Build succeeds (`pnpm run build`)
- [ ] Manual testing of feature in dev environment
- [ ] No console errors in browser

### Before Every Merge to Main

- [ ] All CI checks passed ✅
- [ ] Code reviewed by at least 1 teammate
- [ ] No merge conflicts
- [ ] Changelog updated (if significant change)
- [ ] Documentation updated (if API changed)

### Before Production Deploy

- [ ] Staging deployment tested thoroughly
- [ ] No critical Sentry errors in staging
- [ ] Performance metrics acceptable (< 500ms p95)
- [ ] Database migrations tested in staging
- [ ] Rollback plan documented
- [ ] On-call engineer notified

---

## 8. CI/CD Best Practices

### Speed Optimization

```yaml
# Cache dependencies
- uses: actions/cache@v3
  with:
    path: ~/.pnpm-store
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}

# Run jobs in parallel
jobs:
  lint:
    runs-on: ubuntu-latest
  typecheck:
    runs-on: ubuntu-latest
  test:
    runs-on: ubuntu-latest
  # These all run simultaneously

# Use matrix strategy for multi-environment testing
strategy:
  matrix:
    node-version: [18, 20]
    os: [ubuntu-latest, windows-latest]
```

### Cost Optimization

```yaml
# Use timeout to prevent runaway builds
timeout-minutes: 10

# Cancel previous runs on new commits
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

# Use self-hosted runners for heavy workloads (optional)
runs-on: self-hosted
```

### Security Best Practices

```yaml
# Use GitHub Secrets for sensitive data
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}

# Scan for secrets in code
- name: TruffleHog Secret Scan
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: ${{ github.event.repository.default_branch }}
    head: HEAD

# Use Dependabot for dependency updates
# (configure in .github/dependabot.yml)
```

---

## 9. Monitoring CI/CD Health

### Metrics to Track

- **Build Success Rate:** % of builds that pass (target: > 95%)
- **Average Build Time:** Time from commit to deploy (target: < 10 min)
- **Flaky Test Rate:** % of tests that randomly fail (target: < 1%)
- **Time to Deploy:** Commit to production (target: < 1 hour)
- **Rollback Frequency:** # of rollbacks per month (target: < 2)

### GitHub Actions Dashboard

```
Repository → Actions → View Workflow Runs

Monitor:
- Success/failure trends
- Build duration trends
- Flaky tests (re-run frequency)
- Resource usage (runner minutes)
```

---

## 10. Troubleshooting Common CI Issues

### Issue: Tests Fail in CI but Pass Locally

**Cause:** Environment differences (Node version, dependencies, timezone)

**Fix:**
```yaml
# Match CI environment exactly
- uses: actions/setup-node@v4
  with:
    node-version: '20' # Use exact version

# Set timezone
env:
  TZ: 'UTC'

# Use frozen lockfile
run: pnpm install --frozen-lockfile
```

### Issue: Slow Build Times

**Cause:** Rebuilding dependencies every time

**Fix:**
```yaml
# Add caching
- uses: actions/cache@v3
  with:
    path: |
      ~/.pnpm-store
      ${{ github.workspace }}/.next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### Issue: Intermittent Test Failures

**Cause:** Async race conditions, shared state, database conflicts

**Fix:**
```typescript
// Use isolated test data
beforeEach(async () => {
  const uniqueId = `test-${Date.now()}-${Math.random()}`;
  // Create unique test resources
});

// Increase timeouts for flaky tests
test('slow operation', { timeout: 10000 }, async () => {
  // ...
});
```

### Issue: Out of Memory in Build

**Cause:** Next.js build requires more memory

**Fix:**
```yaml
- name: Build
  run: NODE_OPTIONS='--max-old-space-size=4096' pnpm run build
```

---

## Next Steps

1. **Create GitHub workflows** (copy YAML files above to `.github/workflows/`)
2. **Configure branch protection** (Settings → Branches → Add rule)
3. **Set up secrets** (Settings → Secrets and variables → Actions)
4. **Test CI pipeline** (create a test PR, verify all checks run)
5. **Configure Vercel** (connect GitHub repo, set environment variables)
6. **Test deployment flow** (merge to staging, verify auto-deploy)
7. **Document rollback procedures** (add to incident response runbook)

---

**CRITICAL:** Do NOT enable auto-deploy to production until:
1. All CI checks validated in staging
2. Manual testing procedures documented
3. Rollback tested successfully
4. On-call rotation established

**Status:** Ready for CI/CD pipeline implementation
