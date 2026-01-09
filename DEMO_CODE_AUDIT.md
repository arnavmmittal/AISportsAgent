# Demo/Test Code Audit - Staging/Production Blockers

**Date:** 2026-01-09
**Status:** ⚠️ Multiple mock data implementations need API replacements

## Summary

This document tracks all hardcoded mock/demo/test data in the codebase that could cause issues in staging and production environments.

---

## 🚨 CRITICAL ISSUES (Production Blockers)

### None Currently

✅ The recent fix removed the hardcoded `'test-athlete-1'` ID from the chat API.

---

## ⚠️ HIGH PRIORITY (Mock Data in UI)

These won't break the app but will show fake data instead of real data:

### 1. **Student Assignments Page** - Mock Data
**Files:**
- `apps/web/src/app/assignments/page.tsx` (lines ~30-50)
- `apps/web/src/app/student/assignments/page.tsx` (lines ~30-50)

**Issue:**
```typescript
const mockAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Pre-Game Mental Preparation',
    // ... fake data
  }
];
setAssignments(mockAssignments);
```

**Impact:** Users see fake assignments instead of real data
**Fix Required:** Create `/api/assignments` endpoint, fetch from database
**Priority:** MEDIUM (assignments feature may not be in MVP)

---

### 2. **Student Goals Page** - Mock Data
**File:** `apps/web/src/app/student/goals/page.tsx`

**Issue:**
```typescript
const mockGoals: Goal[] = [...]; // Lines ~50-80
setGoals(mockGoals);

const mockSuggestions: SuggestedGoal[] = [...]; // Lines ~150-200
setSuggestedGoals(mockSuggestions);
```

**Impact:**
- Users see fake goals
- Goal suggestions are hardcoded

**Fix Required:**
- Goals: Already has `/api/goals` - just need to uncomment fetch logic
- Suggestions: `/api/goals/suggestions` exists but uses mock fallback

**Priority:** HIGH (goals are core MVP feature)

---

### 3. **Student Mood Logging** - Mock Past Week Data
**File:** `apps/web/src/app/student/mood/page.tsx`

**Issue:**
```typescript
const mockLogs = generateMockWeekLogs(); // Line ~100
setPastWeekLogs(mockLogs);

// Generates 7 days of fake mood logs
function generateMockWeekLogs() { ... }
```

**Impact:** Past mood logs are fake, only new logs are real
**Fix Required:** Fetch past week logs from `/api/mood/logs?days=7`
**Priority:** HIGH (mood tracking is core MVP feature)

---

### 4. **Coach Athletes List** - Mock Fallback
**File:** `apps/web/src/app/coach/athletes/page.tsx`

**Issue:**
```typescript
// Keep mock data as fallback (remove these when API is working)
const mockAthletes: Athlete[] = [
  {
    id: 'ath-001',
    name: 'Marcus Johnson',
    // ... fake data
  }
];
```

**Current Status:**
- API fetch is implemented and works ✅
- Mock data is commented out ✅
- Comment says "remove when API working" ✅

**Impact:** Low - mock data is only used if API fails
**Fix Required:** Remove mock fallback entirely for production
**Priority:** LOW (already using real API)

---

### 5. **Coach Performance Recording** - Mock Athletes
**File:** `apps/web/src/app/coach/performance/record/page.tsx`

**Issue:**
```typescript
// For now, using mock data
const mockAthletes: Athlete[] = [
  { id: '1', name: 'Marcus Thompson', sport: 'Basketball' },
  // ... more fake athletes
];
setAthletes(mockAthletes);
```

**Impact:** Can't record performance for real athletes
**Fix Required:** Fetch from `/api/athletes` or `/api/coach/athletes`
**Priority:** MEDIUM (performance tracking is important but may not be MVP)

---

### 6. **Coach Reports Page** - Mock Data
**File:** `apps/web/src/app/coach/reports/page.tsx`

**Issue:**
```typescript
// Use first athlete for demo
// Use mock data for demo
```

**Impact:** Reports show fake data
**Fix Required:** Implement real report generation via MCP server
**Priority:** MEDIUM (reports are important but complex)

---

### 7. **Main Dashboard** - Mock Data
**File:** `apps/web/src/app/dashboard/page.tsx`

**Issue:**
```typescript
// For now, use mock data since API endpoints aren't created yet
const mockData: any = {
  upcomingGames: [...],
  recentPerformances: [...],
  weeklyGoals: [...]
};
setDashboardData(mockData);
```

**Impact:** Dashboard shows fake data
**Fix Required:** Create `/api/dashboard` endpoint
**Priority:** MEDIUM (nice-to-have, not core functionality)

---

### 8. **Goals Suggestions API** - Mock Fallback
**File:** `apps/web/src/app/api/goals/suggestions/route.ts`

**Issue:**
```typescript
// Fall through to mock suggestions
const mockSuggestions = generateMockSuggestions(profile, moodTrends);
return NextResponse.json({
  data: mockSuggestions,
});

// Mock IDs: 'mock_1', 'mock_2', 'mock_3'
```

**Impact:** Goal suggestions are fake even though API exists
**Fix Required:** Implement real AI-powered suggestions via MCP server
**Priority:** HIGH (suggestions are core to user experience)

---

## ✅ RESOLVED ISSUES

### ~~Chat Interface - Hardcoded Response~~
**Status:** FIXED ✅ (commit: 3a0e72e)
- Removed `setTimeout` fake response
- Now calls real MCP server
- Uses authenticated user ID

### ~~Chat API - Test Athlete ID~~
**Status:** FIXED ✅ (commit: 3a0e72e)
- Removed `'test-athlete-1'` hardcoded ID
- Now uses `user.id` from authentication
- Properly creates database records

---

## 📋 PRODUCTION READINESS CHECKLIST

Before launching to production:

### Must Fix (Blockers)
- [ ] None currently - all critical issues resolved ✅

### Should Fix (Core Features)
- [ ] **Goals:** Remove mock goals, fetch from database
- [ ] **Mood Logging:** Remove mock past week logs, fetch from API
- [ ] **Goal Suggestions:** Implement AI-powered suggestions (not mocks)

### Nice to Fix (Non-Core)
- [ ] **Assignments:** Implement real assignments API (if in scope)
- [ ] **Performance Recording:** Fetch real athletes list
- [ ] **Reports:** Implement real report generation
- [ ] **Dashboard:** Create real dashboard API

### Cleanup
- [ ] Remove all `mockData` variables and `generateMock*` functions
- [ ] Remove comments that say "For now, using mock data"
- [ ] Search codebase for `mock`, `fake`, `demo`, `test-` and verify each

---

## 🔍 HOW TO VERIFY

Before each production deploy:

```bash
# Search for mock data
grep -r "mock\|fake\|demo" apps/web/src --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".test."

# Search for setTimeout (fake async)
grep -r "setTimeout\|setInterval" apps/web/src --include="*.ts" --include="*.tsx"

# Search for hardcoded IDs
grep -r "test-\|demo-\|mock-" apps/web/src --include="*.ts" --include="*.tsx"
```

---

## 🎯 NEXT STEPS

**Immediate (this week):**
1. Fix goals page to fetch real data
2. Fix mood logging past week data
3. Implement AI goal suggestions

**Before production launch:**
1. Complete production readiness checklist above
2. Run verification commands
3. Test all features with real database data
4. Remove all mock fallbacks

**Post-launch (nice to have):**
1. Implement assignments if needed
2. Implement performance recording
3. Implement reports dashboard

---

## 📝 NOTES

- **MCP Server:** ✅ No mock data found, all real implementations
- **API Routes:** ✅ Chat API fixed, using real auth
- **Authentication:** ✅ Using real Supabase auth, no demo accounts
- **Database:** ✅ Using real PostgreSQL, no test data injection

**Last Updated:** 2026-01-09
**Next Review:** Before production deployment
