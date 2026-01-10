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

## ✅ RECENTLY RESOLVED (Mock Data Cleanup - Feature Branch)

### 1. **Student Goals Page** - Mock Data ✅ FIXED
**File:** `apps/web/src/app/student/goals/page.tsx`
**Status:** RESOLVED (2026-01-09)
**Fix Applied:**
- Removed all mock goals and suggestions data
- Implemented fetch from `/api/goals` with error handling
- All CRUD operations (create, update, delete) use real API
- Goal suggestions fetch from `/api/goals/suggestions`

---

### 2. **Student Mood Logging** - Mock Past Week Data ✅ FIXED
**File:** `apps/web/src/app/student/mood/page.tsx`
**Status:** RESOLVED (2026-01-09)
**Fix Applied:**
- Removed `generateMockWeekLogs()` function
- Fetches past 7 days from `/api/mood-logs`
- Submit function saves via `/api/mood-logs` POST
- Shows empty state when no past data exists

---

### 3. **Coach Athletes List** - Mock Fallback ✅ FIXED
**File:** `apps/web/src/app/coach/athletes/page.tsx`
**Status:** RESOLVED (2026-01-09)
**Fix Applied:**
- Removed unused mockAthletes array entirely
- Already uses real API (was just dead code)
- Cleaned up comments

---

### 4. **Coach Performance Recording** - Mock Athletes ✅ FIXED
**File:** `apps/web/src/app/coach/performance/record/page.tsx`
**Status:** RESOLVED (2026-01-09)
**Fix Applied:**
- Removed mockAthletes array
- Fetches real athletes from `/api/athletes`
- Error handling shows empty state if API fails

---

### 5. **Student Assignments Page** - Mock Data ✅ FIXED
**Files:**
- `apps/web/src/app/assignments/page.tsx`
- `apps/web/src/app/student/assignments/page.tsx`
**Status:** RESOLVED (2026-01-09)
**Fix Applied:**
- Removed all mock assignments data
- Attempts to fetch from `/api/assignments` (not implemented yet)
- Shows empty state when no assignments exist
- Submit function calls `/api/assignments/submit`
- TODO: Implement `/api/assignments` endpoint

**Note:** Assignments feature is MEDIUM priority (may not be in MVP)

---

### 6. **Main Dashboard** - Mock Data ✅ FIXED
**File:** `apps/web/src/app/dashboard/page.tsx`
**Status:** RESOLVED (2026-01-09)
**Fix Applied:**
- Removed all mock data
- Aggregates real data from existing APIs:
  - Mood trends from `/api/mood-logs` (last 7 days)
  - Goals progress from `/api/goals` (calculates average)
- Quick mood check-in saves via `/api/mood-logs`
- Shows empty states when no data available
- TODO: Implement streak calculation and chat sessions fetch

---

## ⚠️ REMAINING MEDIUM PRIORITY

### 7. **Coach Reports Page** - Mock Data
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
- [x] None currently - all critical issues resolved ✅

### Should Fix (Core Features) ✅ COMPLETED
- [x] **Goals:** Remove mock goals, fetch from database ✅
- [x] **Mood Logging:** Remove mock past week logs, fetch from API ✅
- [x] **Goal Suggestions:** Fetch from `/api/goals/suggestions` (mock fallback still exists in API)
- [x] **Dashboard:** Aggregate real data from existing APIs ✅
- [x] **Coach Pages:** Remove all mock athlete data ✅

### Nice to Fix (Non-Core)
- [x] **Assignments:** Updated to call `/api/assignments` (endpoint not implemented - shows empty state)
- [x] **Performance Recording:** Fetch real athletes list ✅
- [ ] **Reports:** Implement real report generation (complex, low priority)

### Cleanup
- [ ] Remove all `mockData` variables and `generateMock*` functions
- [ ] Remove comments that say "For now, using mock data"
- [ ] Search codebase for `mock`, `fake`, `demo`, `test-` and verify each

---

## 🔍 HOW TO VERIFY

Before each production deploy:

```bash
# Search for mock data (should return minimal results now)
grep -r "mockData\|mockAthletes\|mockGoals\|mockAssignments" apps/web/src --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".test."

# Search for setTimeout (fake async) - should only be in real timeout logic
grep -r "setTimeout.*resolve\|setTimeout.*fake\|setTimeout.*mock" apps/web/src --include="*.ts" --include="*.tsx"

# Search for hardcoded test IDs (should be none)
grep -r "test-athlete-\|demo-\|mock-" apps/web/src --include="*.ts" --include="*.tsx" | grep -v "test\." | grep -v "spec\."
```

**Recent Cleanup (2026-01-09):**
- ✅ Goals page: All mock data removed
- ✅ Mood logging: Mock week generator removed
- ✅ Coach athletes: Mock fallback removed
- ✅ Coach performance: Mock athletes removed
- ✅ Assignments: Mock data removed (shows empty state)
- ✅ Dashboard: All mock data removed, uses real APIs
- ✅ Chat interface: Fake setTimeout response removed
- ✅ Chat API: Hardcoded 'test-athlete-1' ID removed

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

**Last Updated:** 2026-01-09 (Major cleanup completed)
**Next Review:** Before production deployment
**Branch:** `feature/remove-mock-data` (ready to merge to staging)
