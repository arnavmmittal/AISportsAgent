# 🏗️ ELITE COACH PORTAL - IMPLEMENTATION PLAN

## Git Workflow & Branch Strategy

### Branch Naming Convention

```bash
# Feature branches
feature/coach-command-center      # Command Center dashboard
feature/coach-roster-view         # Athlete list + profiles
feature/coach-analytics-hub       # Analytics & insights
feature/coach-readiness-system    # Readiness command
feature/coach-assignments         # Assignment management
feature/coach-ai-insights         # AI insights tab
feature/coach-settings            # Settings & admin

# Component branches (sub-features)
feature/readiness-radar-chart     # 6-dimension radar visualization
feature/network-graph-viz         # Team chemistry network
feature/burnout-prediction-ui     # Burnout forecast component

# Backend branches
backend/readiness-api             # Readiness calculation endpoints
backend/risk-scoring-engine       # Risk assessment API
backend/ai-insights-generator     # AI insight generation
backend/team-analytics-api        # Team-level analytics

# Bug fixes
fix/readiness-score-calculation   # Fix scoring algorithm
fix/crisis-alert-false-positives  # Reduce false alarms

# Refactoring
refactor/shared-chart-components  # Extract reusable chart library
refactor/api-client-abstraction   # Centralize API calls
```

---

### Development Workflow

#### Phase 1: Foundation (Week 1)
```bash
# Start from main
git checkout main
git pull origin main

# Create foundation branch
git checkout -b feature/coach-portal-foundation

# Commits:
git commit -m "feat(types): add comprehensive TypeScript interfaces for coach portal"
git commit -m "feat(layout): create CoachPortalLayout with sidebar navigation"
git commit -m "feat(ui): add core UI components (Card, Badge, Skeleton, etc.)"
git commit -m "feat(charts): implement reusable chart components with Recharts"
git commit -m "feat(theme): define color system and design tokens"

# Push and create PR
git push -u origin feature/coach-portal-foundation

# PR Title: "[FOUNDATION] Coach Portal - Core Infrastructure"
# PR Description:
# - TypeScript interfaces for all data models
# - Base layout with sidebar navigation
# - Reusable UI component library
# - Chart components (Line, Bar, Radar, Heatmap)
# - Design system (colors, spacing, typography)
#
# Testing:
# - [x] TypeScript compiles without errors
# - [x] UI components render correctly
# - [x] Navigation works on all screen sizes
# - [x] Charts display sample data

# After PR approval and merge to main
git checkout main
git pull origin main
git branch -d feature/coach-portal-foundation
```

---

#### Phase 2: Command Center (Week 2)
```bash
git checkout main
git pull origin main
git checkout -b feature/coach-command-center

# Iterative commits:
git commit -m "feat(command-center): add priority athlete list component"
git commit -m "feat(command-center): implement quick stats grid"
git commit -m "feat(command-center): create action feed with real-time flags"
git commit -m "feat(command-center): add intervention tracker"
git commit -m "feat(api): create /api/coach/dashboard endpoint"
git commit -m "feat(command-center): integrate with real backend data"
git commit -m "feat(command-center): add loading skeletons and error states"
git commit -m "test(command-center): add unit tests for priority algorithm"

git push -u origin feature/coach-command-center

# PR Title: "[COMMAND CENTER] AI-Powered Coach Dashboard"
# Include screenshots, GIFs of interactions
```

---

#### Phase 3: Roster & Profiles (Week 3)
```bash
git checkout main
git pull origin main
git checkout -b feature/coach-roster-view

git commit -m "feat(roster): create athlete card list with filtering"
git commit -m "feat(roster): implement advanced filter bar (7 dimensions)"
git commit -m "feat(roster): add athlete profile modal with tabs"
git commit -m "feat(roster): integrate readiness radar chart"
git commit -m "feat(roster): add archetype badge with coaching tips"
git commit -m "feat(api): create /api/coach/athletes endpoints"
git commit -m "feat(roster): add coach notes functionality"
git commit -m "perf(roster): optimize list rendering with virtualization"

git push -u origin feature/coach-roster-view
```

---

#### Phase 4: Readiness System (Week 4)
```bash
git checkout main
git pull origin main
git checkout -b feature/coach-readiness-system

git commit -m "feat(readiness): create daily heatmap view"
git commit -m "feat(readiness): implement 7-day forecast chart"
git commit -m "feat(readiness): add historical trends visualization"
git commit -m "feat(readiness): create recovery dashboard"
git commit -m "feat(api): implement 6-dimensional readiness calculation"
git commit -m "feat(api): add ARIMA/LSTM forecasting endpoint"
git commit -m "feat(readiness): integrate with game schedule"
git commit -m "feat(readiness): add lineup optimization suggestions"

git push -u origin feature/coach-readiness-system
```

---

#### Phase 5: Analytics Hub (Week 5-6)
```bash
# This is complex - break into sub-features

# Team Pulse
git checkout main
git pull origin main
git checkout -b feature/analytics-team-pulse

git commit -m "feat(analytics): add longitudinal trend charts"
git commit -m "feat(analytics): implement cohort comparison tool"
git commit -m "feat(analytics): create correlation matrix heatmap"
git commit -m "feat(api): add team-level analytics aggregation"

git push -u origin feature/analytics-team-pulse

# Performance Intelligence
git checkout main
git pull origin main
git checkout -b feature/analytics-performance-intel

git commit -m "feat(analytics): create readiness-performance scatter plot"
git commit -m "feat(analytics): add slump prediction dashboard"
git commit -m "feat(analytics): implement optimal states heatmap"
git commit -m "feat(api): integrate performance prediction model"

git push -u origin feature/analytics-performance-intel

# Intervention Outcomes
git checkout main
git pull origin main
git checkout -b feature/analytics-intervention-outcomes

git commit -m "feat(analytics): create intervention effectiveness table"
git commit -m "feat(analytics): add A/B test results visualization"
git commit -m "feat(analytics): implement archetype-specific success rates"
git commit -m "feat(api): add intervention outcome tracking"

git push -u origin feature/analytics-intervention-outcomes
```

---

#### Phase 6: AI Insights (Week 7-8)
```bash
git checkout main
git pull origin main
git checkout -b feature/coach-ai-insights

# Backend AI engine first
git commit -m "feat(ai): implement weekly team report generator"
git commit -m "feat(ai): add athlete briefing summarizer (GPT-4)"
git commit -m "feat(ai): create chat conversation NLP analyzer"
git commit -m "feat(ai): implement burnout prediction model (30-day)"
git commit -m "feat(ai): add crisis risk scoring algorithm"
git commit -m "feat(ai): create intervention recommendation engine"
git commit -m "feat(ai): implement team network analysis"
git commit -m "feat(ai): add leadership identification algorithm"

# Frontend integration
git commit -m "feat(insights): create automated summaries view"
git commit -m "feat(insights): implement predictive alerts dashboard"
git commit -m "feat(insights): add coaching guides with archetype tips"
git commit -m "feat(insights): create team dynamics network graph"
git commit -m "feat(insights): add real-time insight notifications"

git push -u origin feature/coach-ai-insights
```

---

#### Phase 7: Assignments & Habits (Week 9)
```bash
git checkout main
git pull origin main
git checkout -b feature/coach-assignments

git commit -m "feat(assignments): create assignment wizard with AI suggestions"
git commit -m "feat(assignments): build template library (50+ templates)"
git commit -m "feat(assignments): implement tracking dashboard"
git commit -m "feat(assignments): add NLP-powered response analyzer"
git commit -m "feat(api): create assignment CRUD endpoints"
git commit -m "feat(api): integrate AI-powered assignment recommendations"
git commit -m "feat(assignments): add auto-assignment rules engine"

git push -u origin feature/coach-assignments
```

---

#### Phase 8: Settings & Polish (Week 10)
```bash
git checkout main
git pull origin main
git checkout -b feature/coach-settings-polish

git commit -m "feat(settings): create team configuration panel"
git commit -m "feat(settings): implement notification preferences"
git commit -m "feat(settings): add AI personalization controls"
git commit -m "feat(settings): create consent management view"
git commit -m "feat(settings): add audit log viewer (FERPA compliance)"
git commit -m "feat(settings): implement data export functionality"
git commit -m "polish: add micro-interactions across all pages"
git commit -m "polish: implement loading skeletons everywhere"
git commit -m "polish: optimize bundle size (code splitting)"
git commit -m "test: achieve 80%+ test coverage on critical paths"

git push -u origin feature/coach-settings-polish
```

---

### Commit Message Convention

Use **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change that neither fixes bug nor adds feature
- `perf`: Performance improvement
- `test`: Adding tests
- `docs`: Documentation changes
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(command-center): add AI-powered priority athlete sorting

Implements priority algorithm that considers:
- Risk level (40% weight)
- Crisis alerts (30%)
- Readiness score (20%)
- Last coach interaction (10%)

Closes #142"

git commit -m "fix(readiness): correct sleep score calculation for night shift athletes

Previously assumed 10pm-6am sleep window. Now uses athlete's
preferred sleep schedule from settings.

Fixes #218"

git commit -m "perf(roster): virtualize athlete list for 500+ athletes

Replaces full render with react-window. Improves initial load
from 3.2s to 0.4s for 500 athletes.

Benchmark results included in PR."
```

---

### PR Review Checklist

Before creating PR, ensure:

**Code Quality:**
- [ ] TypeScript compiles without errors
- [ ] ESLint passes (no warnings)
- [ ] Prettier formatting applied
- [ ] No console.logs left in code
- [ ] No commented-out code

**Functionality:**
- [ ] Feature works as expected
- [ ] Edge cases handled (empty states, errors, loading)
- [ ] Mobile responsive (if applicable)
- [ ] Accessibility (ARIA labels, keyboard navigation)

**Performance:**
- [ ] No unnecessary re-renders (React DevTools)
- [ ] Images optimized
- [ ] Bundle size impact acceptable (<50kb per feature)
- [ ] Queries optimized (no N+1, use indexes)

**Testing:**
- [ ] Unit tests for critical logic
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user flows
- [ ] Manual testing completed

**Documentation:**
- [ ] README updated (if needed)
- [ ] API docs updated (if new endpoints)
- [ ] Inline comments for complex logic
- [ ] TypeScript JSDoc for public functions

---

### Merge Strategy

**Main Branch Protection:**
- Require 1+ approving review
- Require status checks to pass (CI/CD)
- Require branches to be up to date
- No force pushes
- No direct commits (PRs only)

**Merging:**
```bash
# After PR approval
# GitHub will handle merge, but local cleanup:

git checkout main
git pull origin main
git branch -d feature/branch-name            # Delete local
git push origin --delete feature/branch-name # Delete remote (optional, GitHub does this)

# Prune deleted remote branches
git fetch --prune
```

---

### Release Strategy

**Semantic Versioning:**
- `v1.0.0` - Initial coach portal launch
- `v1.1.0` - Add new AI insight type
- `v1.0.1` - Bug fix

**Release Branches:**
```bash
# When ready for production release
git checkout main
git pull origin main
git checkout -b release/v1.0.0

# Final testing, version bumps, changelog
git commit -m "chore(release): prepare v1.0.0"
git tag -a v1.0.0 -m "Version 1.0.0 - Elite Coach Portal Launch"

git push origin release/v1.0.0
git push origin v1.0.0

# Merge to main
# PR: release/v1.0.0 → main
```

---

## Development Best Practices

### 1. **Start with Types**
Always define TypeScript interfaces before building components.

### 2. **API-First Development**
Create mock API responses first, build UI against mocks, then wire real backend.

### 3. **Component Isolation**
Build components in Storybook isolation before integrating into pages.

### 4. **Progressive Enhancement**
1. Basic functionality first (no animations)
2. Add loading states
3. Add error handling
4. Add optimistic updates
5. Add micro-interactions

### 5. **Performance Budgets**
- Initial load: <2s (3G)
- Page transition: <300ms
- API response: <500ms (p95)
- Bundle size: <200kb (gzipped)

### 6. **Accessibility Standards**
- WCAG 2.1 AA compliance
- Keyboard navigation for all actions
- Screen reader tested
- Color contrast >4.5:1

---

## Testing Strategy

### Unit Tests
```typescript
// Example: Priority sorting algorithm
describe('priorityAthleteSort', () => {
  it('should prioritize CRITICAL risk over HIGH readiness', () => {
    const athletes = [
      { risk: 'HIGH', readiness: 95 },
      { risk: 'CRITICAL', readiness: 50 },
    ];

    const sorted = priorityAthleteSort(athletes);
    expect(sorted[0].risk).toBe('CRITICAL');
  });

  it('should consider recency of coach interaction', () => {
    // ...
  });
});
```

### Integration Tests
```typescript
// Example: API endpoint
describe('GET /api/coach/dashboard', () => {
  it('should return prioritized athletes with consent', async () => {
    const response = await request(app)
      .get('/api/coach/dashboard')
      .set('Authorization', `Bearer ${coachToken}`);

    expect(response.status).toBe(200);
    expect(response.body.priorityAthletes).toHaveLength(10);
    expect(response.body.priorityAthletes[0]).toHaveProperty('urgency');
  });
});
```

### E2E Tests (Playwright)
```typescript
test('Coach can view athlete profile and add note', async ({ page }) => {
  await page.goto('/coach/roster');
  await page.click('text=John Smith');

  await expect(page.locator('[data-testid="athlete-profile"]')).toBeVisible();
  await expect(page.locator('[data-testid="readiness-score"]')).toContainText(/\d+/);

  await page.fill('[data-testid="note-input"]', 'Great progress this week');
  await page.click('[data-testid="save-note"]');

  await expect(page.locator('text=Note saved')).toBeVisible();
});
```

---

## CI/CD Pipeline

```yaml
# .github/workflows/coach-portal.yml
name: Coach Portal CI/CD

on:
  pull_request:
    branches: [main]
    paths:
      - 'apps/web/src/app/(coach)/**'
      - 'apps/web/src/types/coach-portal.ts'

  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  deploy-preview:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Next Steps

1. **Initialize Foundation Branch**
   ```bash
   git checkout -b feature/coach-portal-foundation
   ```

2. **Create Core Components** (see next section)

3. **Build Command Center** (highest priority)

4. **Iterate with User Feedback** (critical for D1 buy-in)

---

*This plan ensures systematic, reviewable, testable development of a world-class coach portal that D1 programs will want to license.*
