# Testing Guide - No Git Required! 🧪

All git operations are handled for you. Just follow these simple steps.

---

## 🎯 What You'll Test

1. **Main Branch** - Current production state (baseline)
2. **Chat Summaries Branch** - New weekly summaries feature
3. **Mobile App** - Complete mobile experience (already merged to main)

---

## 📱 Testing Mobile (Always Available)

The mobile app is on main and ready to go:

```bash
cd apps/mobile
pnpm install
pnpm start
```

Then press `i` for iOS or `a` for Android, or scan QR code with Expo Go.

**What to test:**
- ✅ All 13+ screens working
- ✅ Voice input in chat
- ✅ Mood tracking with charts
- ✅ Goals management
- ✅ Coach portal
- ✅ Push notifications setup

---

## 🌐 Testing Web App

### Switching Between Versions (No Git!)

I've created a simple script for you:

```bash
# Test main branch (baseline)
./test-switch.sh main

# Test chat summaries feature
./test-switch.sh summaries

# Check which branch you're on
./test-switch.sh status
```

---

## 🧪 Test Scenario 1: Main Branch (Baseline)

**What's included:** Basic chat, auth, dashboards (NO weekly summaries)

```bash
# Switch to main
./test-switch.sh main

# Install and run
pnpm install
pnpm dev:web
```

**Open:** http://localhost:3000

**Test checklist:**
- [ ] Can signup/login
- [ ] Chat interface works
- [ ] Can send messages and get AI responses
- [ ] Athlete dashboard shows stats
- [ ] Coach dashboard shows athletes (if you have coach account)
- [ ] Mood logging works
- [ ] Goals can be created/edited

**Expected:** NO weekly summaries feature visible

---

## 🧪 Test Scenario 2: Chat Summaries Branch

**What's NEW:** Weekly summaries, readiness algorithm, encryption, audit logs

```bash
# Switch to summaries branch
./test-switch.sh summaries

# Install dependencies (schema changed)
pnpm install

# Setup database for new schema
cd apps/web
pnpm prisma:generate
pnpm prisma db push   # or: pnpm prisma:migrate dev

# Run the app
cd ../..
pnpm dev:web
```

**Open:** http://localhost:3000

### What to Look For:

#### 1. **Database Changes**
```bash
# Open Prisma Studio to inspect
cd apps/web && pnpm prisma:studio
```
- Look for `ChatSummary` table
- Check if it has `type` field with values: `SESSION` or `WEEKLY`

#### 2. **Coach API Endpoint**
- Login as coach
- Open browser console (F12)
- Navigate to coach dashboard
- Check Network tab for calls to: `/api/coach/weekly-summaries`
- Should return JSON (empty array if no summaries yet)

#### 3. **Generate Test Summary Manually**

You'll need to create some chat data first, then generate a summary:

```bash
# Test the generation endpoint
curl -X POST http://localhost:3000/api/cron/generate-weekly-summaries \
  -H "Content-Type: application/json"
```

#### 4. **Check for UI Integration**

The feature has these components:
- `WeeklySummaryDrawer` - Should appear in coach dashboard
- `ReadinessBreakdown` - Signal visualization
- `ConsentSettingsModal` - Athlete consent settings

**Look for:**
- [ ] Coach dashboard has new "Weekly Summaries" section
- [ ] Athlete settings has consent toggle
- [ ] Readiness scores visible somewhere

#### 5. **Test New Features**

**Files to explore:**
- `/apps/web/src/lib/summarizer.ts` - Summary generation logic
- `/apps/web/src/lib/readiness-score.ts` - Algorithm
- `/apps/web/src/lib/encryption.ts` - Data encryption
- `/apps/web/src/lib/audit.ts` - Audit logging
- `/apps/web/docs/WEEKLY_SUMMARIES_INTEGRATION.md` - Integration guide

---

## 🔍 What You're Looking For

### ✅ Complete Features:
- Backend logic (summarizer, encryption, audit logs)
- API endpoints exist and respond
- Database schema updated
- Components exist in codebase

### ❓ Missing/Incomplete:
- Is `WeeklySummaryDrawer` visible in coach UI?
- Is athlete consent modal accessible?
- Does clicking anything trigger the new APIs?
- Are there console errors?

---

## 🐛 Common Issues & Fixes

**Database schema errors:**
```bash
cd apps/web
pnpm prisma:generate
pnpm prisma db push --force-reset  # WARNING: Resets data!
```

**Dependencies out of sync:**
```bash
pnpm clean
pnpm install
```

**Environment variables missing:**
```bash
cd apps/web
cp .env.example .env.local
# Edit .env.local and add:
# - DATABASE_URL
# - NEXTAUTH_SECRET (generate: openssl rand -base64 32)
# - OPENAI_API_KEY or ANTHROPIC_API_KEY
```

**Port already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

---

## 📊 Comparison Checklist

| Feature | Main Branch | Summaries Branch |
|---------|-------------|------------------|
| Basic chat | ✅ | ✅ |
| Mood logging | ✅ | ✅ |
| Goals | ✅ | ✅ |
| Coach dashboard | ✅ | ✅ |
| **Weekly summaries** | ❌ | ✅ (check UI) |
| **Readiness algorithm** | ❌ | ✅ (check if visible) |
| **Athlete consent** | ❌ | ✅ (check if accessible) |
| **Encryption** | ❌ | ✅ (backend only) |
| **Audit logs** | ❌ | ✅ (backend only) |

---

## 📝 After Testing

Please note:
1. **What works** vs **what doesn't**
2. **Is the UI integrated?** (Can you see/use the new features?)
3. **Any console errors?**
4. **Database schema issues?**
5. **Missing environment variables?**

I'll help fix anything that's broken or incomplete!

---

## 🚀 Quick Test Commands

```bash
# Switch to baseline
./test-switch.sh main
pnpm dev:web

# Switch to new feature
./test-switch.sh summaries
cd apps/web && pnpm prisma:generate && pnpm prisma db push && cd ../..
pnpm dev:web

# Check current branch
./test-switch.sh status

# Test mobile
cd apps/mobile && pnpm start

# Open database inspector
cd apps/web && pnpm prisma:studio
```

---

**Need help?** Just tell me what errors you see or what's not working!
