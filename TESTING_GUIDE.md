# Friends Testing Guide

Thanks for helping test Flow Sports Coach! This guide will walk you through testing all the key features.

## Getting Started

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Coach | coach1@uw.edu | See pilot-credentials.csv |
| Athlete | athlete1@uw.edu | See pilot-credentials.csv |
| Athlete | athlete2@uw.edu | See pilot-credentials.csv |

*Credentials are in `pilot-credentials.csv` (not committed to git). Each user has a unique password.*

**School:** University of Washington (demo)

**Note:** These accounts have 30 days of mood logs, chat history, and rich data already seeded.

### Staging URL
```
https://[your-vercel-preview-url]
```

---

## Testing Checklist

### 1. Authentication (5 min)

- [ ] **Login** - Go to `/auth/signin`, use athlete1 account
- [ ] **Logout** - Click profile → Sign out
- [ ] **Forgot Password** - Go to `/auth/forgot-password`, enter email (check console for email)
- [ ] **Sign Up** - Go to `/auth/signup`, create new account with invite code

### 2. Athlete Experience (15 min)

Login as an **athlete** (athlete1@test.flowsportscoach.com)

#### AI Chat
- [ ] Go to `/student/ai-coach`
- [ ] Send a message: "I'm feeling anxious about my game tomorrow"
- [ ] Verify you get a helpful response
- [ ] Try voice mode (click microphone icon)
- [ ] Check chat history (left drawer)

#### Mood Tracking
- [ ] Go to `/student/mood` or use dashboard quick action
- [ ] Log today's mood (slide the scales)
- [ ] Verify it saves successfully
- [ ] Check if mood chart updates

#### Goals
- [ ] Go to `/student/goals`
- [ ] Create a new goal: "Improve my mental focus during games"
- [ ] Update progress on an existing goal
- [ ] Mark a goal complete

#### Dashboard
- [ ] Go to `/student/dashboard` or `/student/home`
- [ ] Verify you see your mood trends
- [ ] Check readiness score displays

### 3. Coach Experience (15 min)

Login as the **coach** (coach@test.flowsportscoach.com)

#### Dashboard
- [ ] Go to `/coach/dashboard`
- [ ] Verify you see team overview stats
- [ ] Check athlete list loads
- [ ] Look for any crisis alerts

#### Athlete Profiles
- [ ] Click on an athlete (e.g., Alex Johnson)
- [ ] Verify you can see their mood history
- [ ] Check if goals are visible
- [ ] Look for chat insights (if consent granted)

#### Readiness Heatmap
- [ ] Go to `/coach/readiness`
- [ ] Verify 14-day heatmap displays
- [ ] Click on a cell to see details

#### Alerts
- [ ] Go to `/coach/alerts`
- [ ] Check if any crisis alerts exist
- [ ] Try marking one as reviewed

#### Assignments
- [ ] Go to `/coach/assignments`
- [ ] Create a new team assignment
- [ ] Check if athletes receive it

### 4. Crisis Detection (5 min)

Login as an **athlete**

- [ ] Go to AI Chat
- [ ] Type something that sounds concerning: "I've been feeling really hopeless lately and don't know what to do"
- [ ] Verify you get supportive resources
- [ ] Login as coach and check if an alert appeared

### 5. Mobile App (Optional - 10 min)

If testing the mobile app:

- [ ] Download Expo Go app
- [ ] Scan QR code from mobile build
- [ ] Login with athlete account
- [ ] Test chat (text and voice)
- [ ] Test mood logging
- [ ] Check push notifications work

---

## What to Report

When you find issues, please note:

1. **What you were doing** (step by step)
2. **What you expected** to happen
3. **What actually happened**
4. **Screenshot** if possible
5. **Browser/Device** you're using

### Severity Levels

- 🔴 **Critical**: App crashes, data loss, security issue
- 🟠 **High**: Feature doesn't work at all
- 🟡 **Medium**: Feature works but has problems
- 🟢 **Low**: Minor UI issues, typos

---

## Known Issues

Things we already know about:

1. Voice mode may require microphone permission popup
2. Push notifications only work on actual mobile devices (not web)
3. Some analytics charts may be empty until more data is logged

---

## Quick Feedback Template

```
**What I tested:** [feature name]
**Result:** ✅ Works / ❌ Broken / ⚠️ Partial
**Browser:** [Chrome/Safari/Firefox]
**Device:** [Desktop/iPhone/Android]
**Details:** [what happened]
**Screenshot:** [attach if helpful]
```

---

## Thank You!

Your feedback helps make this app better for real athletes. Every bug you find is one less problem for users!

Questions? Text/DM [your contact info here]
