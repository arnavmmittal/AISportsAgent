# Complete Testing Checklist

**Purpose:** Systematically test all features before UW demo
**Timeline:** 2-3 days of focused testing
**Environment:** Physical device + laptop backend

---

## 🚀 Setup (15 minutes)

### Backend Setup
```bash
# Terminal 1: Start web backend
cd apps/web
pnpm dev
# Should start on http://localhost:3000

# Verify it's running
open http://localhost:3000
```

### Mobile Setup
```bash
# Terminal 2: Get your laptop's local IP
# Mac:
ipconfig getifaddr en0
# Returns something like: 192.168.1.123

# Update mobile .env.local
cd apps/mobile
nano .env.local
# Set: EXPO_PUBLIC_API_URL=http://192.168.1.123:3000

# Start mobile app
pnpm start
```

### Device Connection
1. Connect phone to SAME WiFi as laptop
2. Open Expo Go app on phone
3. Scan QR code from terminal
4. App should load on device

---

## ✅ Testing Matrix

### Priority Levels
- 🔴 **CRITICAL** - Must work for demo
- 🟡 **HIGH** - Should work, acceptable if minor bugs
- 🟢 **MEDIUM** - Nice to have, can skip if time-limited

---

## 1. Authentication Flow (🔴 CRITICAL)

### Test 1.1: Login with Seed Account
- [ ] Open app on device
- [ ] Should see login screen
- [ ] Enter `athlete1@uw.edu` / `See pilot-credentials.csv`
- [ ] Tap "Sign In"
- [ ] **EXPECTED:** Navigate to athlete dashboard
- [ ] **VERIFY:** Welcome message shows "Welcome back, [Athlete Name]"

### Test 1.2: Coach Login
- [ ] Logout (Settings → Logout)
- [ ] Enter `coach@uw.edu` / `See pilot-credentials.csv`
- [ ] Tap "Sign In"
- [ ] **EXPECTED:** Navigate to coach dashboard (different UI)
- [ ] **VERIFY:** Shows team stats, athlete roster

### Test 1.3: Demo Mode Fallback
- [ ] Logout
- [ ] Enter `demo@athlete.com` / `demo123`
- [ ] **EXPECTED:** Login works even if backend is offline
- [ ] **VERIFY:** Shows demo data, not real seed data

### Test 1.4: Invalid Credentials
- [ ] Try wrong password
- [ ] **EXPECTED:** Error message "Invalid credentials"
- [ ] **VERIFY:** Doesn't crash, stays on login screen

### Test 1.5: Token Persistence
- [ ] Login as athlete1
- [ ] Close app completely (swipe away)
- [ ] Reopen app
- [ ] **EXPECTED:** Still logged in, see dashboard
- [ ] **VERIFY:** No need to re-login

---

## 2. Athlete Chat (🔴 CRITICAL)

### Test 2.1: Text Chat - Basic
- [ ] Login as athlete1@uw.edu
- [ ] Navigate to Chat tab
- [ ] Type message: "I'm feeling nervous about tomorrow's game"
- [ ] Tap send
- [ ] **EXPECTED:** Message appears immediately
- [ ] **VERIFY:** AI response streams in (token-by-token)
- [ ] **TIMING:** Response starts within 2-3 seconds

### Test 2.2: Voice Chat - End-to-End (🔴 CRITICAL)
- [ ] In chat screen, tap microphone button
- [ ] **VERIFY:** Microphone icon changes (recording indicator)
- [ ] **VERIFY:** Haptic feedback when recording starts
- [ ] Speak: "I'm anxious about playing against UCLA"
- [ ] Tap mic button to stop
- [ ] **EXPECTED:**
  1. Transcript appears in chat (from Whisper)
  2. AI text response streams in
  3. Audio plays automatically (ElevenLabs TTS)
- [ ] **TIMING:**
  - Transcription: <3 seconds
  - AI response: <5 seconds
  - Audio playback: starts immediately
- [ ] **VERIFY:** Audio is natural-sounding (not robotic)

### Test 2.3: Voice Chat - Multiple Turns
- [ ] Send 3-4 voice messages in a row
- [ ] **VERIFY:** Each transcribes correctly
- [ ] **VERIFY:** Audio queue works (no overlapping)
- [ ] **VERIFY:** Can interrupt (tap stop during playback)

### Test 2.4: Crisis Detection
- [ ] Type: "I've been thinking about hurting myself"
- [ ] **EXPECTED:** Crisis modal pops up immediately
- [ ] **VERIFY:** Modal shows emergency hotlines (988, Crisis Text Line)
- [ ] **VERIFY:** "Call 988 Now" button works (opens phone dialer)
- [ ] **VERIFY:** Haptic warning feedback
- [ ] Tap "I Understand" to dismiss

### Test 2.5: Long Conversation
- [ ] Have 10+ message conversation
- [ ] **VERIFY:** Scroll works smoothly
- [ ] **VERIFY:** Messages don't disappear
- [ ] **VERIFY:** Typing indicator shows when AI is thinking

### Test 2.6: Session Persistence
- [ ] Navigate away (go to Mood tab)
- [ ] Come back to Chat tab
- [ ] **EXPECTED:** All messages still visible
- [ ] **VERIFY:** Can resume conversation

### Test 2.7: Error Handling
- [ ] Turn off WiFi on phone
- [ ] Try to send message
- [ ] **EXPECTED:** Error message "Connection lost - check network"
- [ ] **VERIFY:** Message not lost (still in input box)
- [ ] Turn WiFi back on
- [ ] Retry send
- [ ] **EXPECTED:** Works now

---

## 3. Athlete Mood Tracking (🟡 HIGH)

### Test 3.1: Log Mood - Complete Flow
- [ ] Navigate to Mood tab
- [ ] Tap "Log Mood" button
- [ ] Adjust sliders:
  - Mood: 8/10
  - Confidence: 7/10
  - Stress: 4/10
  - Energy: 6/10
  - Sleep: 7.5 hours
- [ ] Add notes: "Feeling good after yesterday's practice"
- [ ] Tap "Save"
- [ ] **EXPECTED:** Success message, navigate back
- [ ] **VERIFY:** New entry appears in "Recent Check-Ins" list
- [ ] **VERIFY:** Haptic feedback on save

### Test 3.2: Mood Visualizations
- [ ] Check 7-day trend LineChart
- [ ] **VERIFY:** Line graph shows last 7 days
- [ ] **VERIFY:** Gradient fill under line (purple)
- [ ] **VERIFY:** Smooth curves, not jagged
- [ ] Check average metrics BarChart
- [ ] **VERIFY:** 5 bars (mood, confidence, stress, energy, sleep)
- [ ] **VERIFY:** Color-coded correctly
- [ ] **VERIFY:** Values match recent logs

### Test 3.3: Empty State
- [ ] Logout, login as new athlete (athlete20@uw.edu)
- [ ] Navigate to Mood tab
- [ ] **EXPECTED:** Empty state message
- [ ] **VERIFY:** "Log your first mood" call-to-action

### Test 3.4: Edit/Delete Mood Log
- [ ] Find recent mood log
- [ ] Tap to view details
- [ ] **VERIFY:** Can see all metrics + notes
- [ ] **NOTE:** Edit/delete not implemented yet (okay for demo)

---

## 4. Athlete Goals (🟡 HIGH)

### Test 4.1: Create Goal
- [ ] Navigate to Goals tab
- [ ] Tap "+" or "Create Goal" button
- [ ] Fill form:
  - Title: "Improve free throw percentage"
  - Description: "Get to 85% by end of season"
  - Category: Performance
  - Target Date: [1 month from now]
- [ ] Tap "Create"
- [ ] **EXPECTED:** Goal appears in list
- [ ] **VERIFY:** Progress bar at 0%
- [ ] **VERIFY:** Status = "Not Started"

### Test 4.2: Update Goal Progress
- [ ] Find goal just created
- [ ] Tap "+10%" button twice
- [ ] **EXPECTED:** Progress bar increases to 20%
- [ ] **VERIFY:** Visual progress bar updates
- [ ] **VERIFY:** Percentage text shows "20%"
- [ ] Tap "Complete" button
- [ ] **EXPECTED:** Progress jumps to 100%, status = "Completed"
- [ ] **VERIFY:** Green checkmark or completion indicator

### Test 4.3: AI Goal Suggestions
- [ ] Scroll to "AI Suggestions" section
- [ ] **VERIFY:** Shows 3-5 personalized goal suggestions
- [ ] Tap "Add" on one suggestion
- [ ] **EXPECTED:** Goal added to "My Goals" list
- [ ] **VERIFY:** Pre-filled with AI-generated text

### Test 4.4: Filter Goals
- [ ] Create goals in different categories (Performance, Mental, Academic)
- [ ] Tap category filter (e.g., "Performance")
- [ ] **EXPECTED:** Only performance goals visible
- [ ] Tap "All" to clear filter
- [ ] **VERIFY:** All goals visible again

### Test 4.5: Search Goals
- [ ] Type in search box: "free throw"
- [ ] **EXPECTED:** Only matching goals visible
- [ ] Clear search
- [ ] **VERIFY:** All goals back

### Test 4.6: Delete Goal
- [ ] Long-press on a goal (or tap delete icon)
- [ ] **EXPECTED:** Confirmation alert
- [ ] Tap "Delete"
- [ ] **VERIFY:** Goal disappears from list

---

## 5. Athlete Assignments (🟢 MEDIUM)

### Test 5.1: View Assignments
- [ ] Navigate to Assignments tab
- [ ] **VERIFY:** Shows "Pending" and "Completed" sections
- [ ] **VERIFY:** At least 1-2 seed assignments visible

### Test 5.2: Submit Assignment
- [ ] Tap on a pending assignment
- [ ] Read assignment details
- [ ] Tap "Submit Response"
- [ ] Type response in text box
- [ ] Tap "Submit"
- [ ] **EXPECTED:** Confirmation alert
- [ ] **VERIFY:** Assignment moves to "Completed" section
- [ ] **VERIFY:** Status badge changes to "Submitted" (green)

### Test 5.3: Edit Submission
- [ ] Find completed assignment
- [ ] Tap "Edit Response"
- [ ] Update text
- [ ] Tap "Save"
- [ ] **EXPECTED:** Updated response saved

### Test 5.4: Due Date Display
- [ ] Check assignment cards
- [ ] **VERIFY:** Shows "Due today" or "Due in X days"
- [ ] **VERIFY:** Overdue assignments show red warning

---

## 6. Athlete Settings (🟢 MEDIUM)

### Test 6.1: Profile Editing
- [ ] Navigate to Settings tab
- [ ] Tap "Edit Profile"
- [ ] Update name, sport, year, position
- [ ] Tap "Save"
- [ ] **EXPECTED:** Success message
- [ ] **VERIFY:** Changes reflect on dashboard

### Test 6.2: Consent Management
- [ ] Find "Privacy & Consent" section
- [ ] Toggle "Allow coach to view my data"
- [ ] **VERIFY:** Toggle works smoothly
- [ ] Toggle "Share chat summaries with coach"
- [ ] **VERIFY:** Both toggles independent

### Test 6.3: Notification Preferences
- [ ] Find "Notifications" section
- [ ] Toggle various notification types
- [ ] **VERIFY:** All toggles work
- [ ] **NOTE:** Actual notifications tested separately

### Test 6.4: Logout
- [ ] Tap "Logout" button
- [ ] **EXPECTED:** Confirmation alert
- [ ] Confirm logout
- [ ] **VERIFY:** Navigate to login screen
- [ ] **VERIFY:** Can't navigate back to dashboard

---

## 7. Coach Dashboard (🔴 CRITICAL)

### Test 7.1: Team Overview
- [ ] Login as coach@uw.edu
- [ ] **VERIFY:** Dashboard shows:
  - Total athletes count (should be ~20)
  - Athletes with consent
  - At-risk count
  - Crisis alerts count
- [ ] **VERIFY:** Time range selector (7d/14d/30d) works
- [ ] **VERIFY:** Pull-to-refresh works

### Test 7.2: Team Mood Averages
- [ ] Check "Team Mood" widget
- [ ] **VERIFY:** Shows average mood, confidence, stress
- [ ] **VERIFY:** Numbers make sense (0-10 range)
- [ ] Switch time range (7d → 30d)
- [ ] **VERIFY:** Averages update

### Test 7.3: Readiness Scores
- [ ] Check "Today's Readiness" section
- [ ] **VERIFY:** Shows athletes with readiness scores (0-100)
- [ ] **VERIFY:** Color coding (green >85, yellow 70-84, red <70)

### Test 7.4: At-Risk Athletes
- [ ] Check "At-Risk Athletes" list
- [ ] **VERIFY:** Shows athletes with low readiness
- [ ] **VERIFY:** Mood indicators visible
- [ ] Tap on an athlete
- [ ] **EXPECTED:** Navigate to athlete detail view

### Test 7.5: Crisis Alerts
- [ ] Check "Recent Crisis Alerts" section
- [ ] **VERIFY:** Shows severity, athlete name, timestamp
- [ ] **VERIFY:** Can tap to view details

---

## 8. Coach Analytics (🔴 CRITICAL - KEY DEMO FEATURE)

### Test 8.1: Team Heatmap
- [ ] Navigate to Analytics tab
- [ ] **VERIFY:** Shows 14-day × N athletes heatmap
- [ ] **VERIFY:** Color coding:
  - Green (85-100): Good readiness
  - Yellow (70-84): Moderate
  - Orange (50-69): Low
  - Red (<50): Critical
- [ ] **VERIFY:** Can scroll through athletes
- [ ] Tap on a cell
- [ ] **EXPECTED:** Navigate to athlete detail for that day

### Test 8.2: Performance Correlation Matrix
- [ ] Scroll to "Performance Correlations" section
- [ ] **VERIFY:** Shows heatmap with r-values
- [ ] **VERIFY:** Metrics include:
  - Mood vs Points/Assists
  - Confidence vs Performance
  - Sleep vs Energy
  - Stress vs Turnovers
- [ ] **VERIFY:** r-values displayed (-1.0 to 1.0)
- [ ] **VERIFY:** Color coding (red = negative, green = positive)
- [ ] **VERIFY:** Sample size shown (n=X games)

### Test 8.3: Generated Insights
- [ ] Check "Key Insights" section
- [ ] **VERIFY:** Shows text insights like:
  - "Strong correlation (r=0.73) between sleep and performance"
  - "Athletes with higher confidence score more points"
- [ ] **VERIFY:** Actionable recommendations

---

## 9. Coach Readiness (🔴 CRITICAL - KEY DEMO FEATURE)

### Test 9.1: Readiness Forecast Chart
- [ ] Navigate to Readiness tab
- [ ] Select an athlete from dropdown
- [ ] **VERIFY:** Shows 7-day forecast line chart
- [ ] **VERIFY:** Confidence bounds (shaded area)
- [ ] **VERIFY:** Risk flags:
  - "Predicted decline"
  - "High variability"
  - "Below optimal threshold"

### Test 9.2: Multiple Athlete Comparison
- [ ] Select different athletes
- [ ] **VERIFY:** Chart updates for each
- [ ] **VERIFY:** Forecast changes appropriately

---

## 10. Coach Insights (🟡 HIGH)

### Test 10.1: Intervention Queue
- [ ] Navigate to Insights tab
- [ ] **VERIFY:** Shows prioritized interventions
- [ ] **VERIFY:** Priority levels:
  - URGENT (red): Readiness <50
  - HIGH (orange): Declining trend
  - MEDIUM (yellow): Moderate issues
  - LOW (blue): Monitoring
- [ ] **VERIFY:** Action buttons:
  - "View Athlete"
  - "Mark Complete"
  - "Escalate"

### Test 10.2: Intervention Actions
- [ ] Tap "View Athlete" on an intervention
- [ ] **EXPECTED:** Navigate to athlete detail
- [ ] Back to Insights
- [ ] Tap "Mark Complete"
- [ ] **EXPECTED:** Intervention disappears or status changes

---

## 11. Coach Athletes Roster (🟢 MEDIUM)

### Test 11.1: Roster View
- [ ] Navigate to Athletes tab
- [ ] **VERIFY:** Shows list of all athletes
- [ ] **VERIFY:** Each card shows:
  - Name, sport, year
  - Risk badge (high/medium/low)
  - Mood indicator
  - Active goals count
  - Consent status

### Test 11.2: Filtering
- [ ] Tap filter (if available)
- [ ] Filter by risk level (e.g., "High Risk")
- [ ] **VERIFY:** Only high-risk athletes visible
- [ ] Clear filter
- [ ] **VERIFY:** All athletes back

### Test 11.3: Athlete Detail
- [ ] Tap on an athlete
- [ ] **VERIFY:** Shows detailed view:
  - Recent mood logs
  - Active goals
  - Chat session count
  - Crisis alerts (if any)
  - Readiness trend

---

## 12. Coach Assignments (🟢 MEDIUM)

### Test 12.1: Create Assignment
- [ ] Navigate to Assignments tab
- [ ] Tap "Create Assignment"
- [ ] Fill form:
  - Title: "Pre-game visualization exercise"
  - Description: "Spend 10 minutes visualizing success"
  - Assign to: Select 3-4 athletes
  - Due date: [3 days from now]
- [ ] Tap "Create"
- [ ] **EXPECTED:** Assignment created
- [ ] **VERIFY:** Appears in assignments list

### Test 12.2: View Submissions
- [ ] Find assignment with submissions
- [ ] Tap to view
- [ ] **VERIFY:** Shows list of who submitted
- [ ] Tap on a submission
- [ ] **VERIFY:** Can read athlete's response

---

## 13. Push Notifications (🟢 MEDIUM)

### Test 13.1: Permission Request
- [ ] Fresh install of app
- [ ] Login
- [ ] **EXPECTED:** Permission prompt for notifications
- [ ] Tap "Allow"
- [ ] **VERIFY:** Permission granted

### Test 13.2: Notification Delivery
- [ ] **NOTE:** Requires backend to send test notification
- [ ] Trigger notification (e.g., new assignment)
- [ ] **VERIFY:** Notification appears on lock screen
- [ ] Tap notification
- [ ] **EXPECTED:** Opens app to relevant screen

### Test 13.3: Notification Preferences
- [ ] Go to Settings
- [ ] Toggle notification preferences
- [ ] **VERIFY:** Changes save

---

## 14. Performance & Edge Cases (🟡 HIGH)

### Test 14.1: App Performance
- [ ] Monitor app responsiveness
- [ ] **VERIFY:** No lag when scrolling
- [ ] **VERIFY:** Charts render smoothly
- [ ] **VERIFY:** Voice chat responds quickly

### Test 14.2: Memory Usage
- [ ] Have long chat session (20+ messages)
- [ ] Navigate between tabs rapidly
- [ ] **VERIFY:** No crashes
- [ ] **VERIFY:** App doesn't slow down

### Test 14.3: Network Interruption
- [ ] Mid-chat, turn off WiFi
- [ ] **VERIFY:** Graceful error message
- [ ] Turn WiFi back on
- [ ] **VERIFY:** Can resume

### Test 14.4: Background/Foreground
- [ ] Start voice recording
- [ ] Switch to another app (background)
- [ ] Come back
- [ ] **VERIFY:** Recording stopped gracefully (not crashed)

### Test 14.5: Low Battery
- [ ] Test with <20% battery
- [ ] **VERIFY:** App still works
- [ ] **VERIFY:** Voice chat doesn't drain battery excessively

---

## 15. Demo-Specific Tests (🔴 CRITICAL)

### Test 15.1: Complete Demo Flow (REHEARSE 3X)
1. **Start:** Show athlete login
2. **Chat:** Ask "I'm nervous about tomorrow's game" (voice)
3. **Voice Response:** Verify AI responds with natural voice
4. **Mood Log:** Show logging mood with visualization
5. **Switch to Coach:** Logout, login as coach
6. **Team Heatmap:** Show 14-day readiness
7. **Correlation:** Point to "When Sarah's readiness >85, she scores 22 PPG"
8. **Forecast:** Show 7-day prediction with risk flag
9. **Intervention:** Show prioritized recommendation
10. **ROI Pitch:** "This prevents star transfers, injuries, missed wins"

**TIMING:** 10 minutes total, practice until smooth

### Test 15.2: Backup Plan
- [ ] Record video of working demo (full 10-min flow)
- [ ] Screenshot every major screen
- [ ] Create PDF slides with screenshots
- [ ] Test demo mode (offline) works

### Test 15.3: Network Reliability
- [ ] Test on campus WiFi (if possible)
- [ ] Bring mobile hotspot as backup
- [ ] Verify laptop IP doesn't change mid-demo

---

## 🐛 Bug Tracking

Use this template to track bugs:

```
BUG #X: [Title]
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- Steps to reproduce:
  1. ...
  2. ...
- Expected: ...
- Actual: ...
- Screenshot: [attach if possible]
- Workaround: ...
- Status: OPEN / FIXED / WONTFIX
```

**Priority for Fixing:**
1. CRITICAL - Blocks demo (fix immediately)
2. HIGH - Noticeable but demo can proceed (fix before demo)
3. MEDIUM - Minor polish (fix if time permits)
4. LOW - Edge case (document, fix later)

---

## 📊 Testing Completion Checklist

**Day 1 (4-6 hours):**
- [ ] Setup (backend + mobile)
- [ ] Authentication (Tests 1.1-1.5)
- [ ] Athlete Chat (Tests 2.1-2.7) - MOST CRITICAL
- [ ] Athlete Mood (Tests 3.1-3.4)
- [ ] List all bugs found

**Day 2 (4-6 hours):**
- [ ] Fix CRITICAL bugs from Day 1
- [ ] Athlete Goals (Tests 4.1-4.6)
- [ ] Athlete Assignments (Tests 5.1-5.4)
- [ ] Athlete Settings (Tests 6.1-6.4)
- [ ] Coach Dashboard (Tests 7.1-7.5)
- [ ] List all bugs found

**Day 3 (4-6 hours):**
- [ ] Fix remaining CRITICAL bugs
- [ ] Coach Analytics (Tests 8.1-8.3) - DEMO KEY FEATURE
- [ ] Coach Readiness (Tests 9.1-9.2) - DEMO KEY FEATURE
- [ ] Coach Insights (Tests 10.1-10.2)
- [ ] Performance tests (Tests 14.1-14.5)
- [ ] Demo flow rehearsal (Test 15.1) - 3x minimum

**Day 4 (Optional - Polish):**
- [ ] Fix HIGH priority bugs
- [ ] Record backup demo video
- [ ] Create screenshot slides
- [ ] Final demo rehearsal 2x more

---

## ✅ Ready for Demo When:

- [ ] ✅ Voice chat works reliably (>80% success rate)
- [ ] ✅ Analytics dashboards load with data
- [ ] ✅ Correlation matrix shows r>0.5 values
- [ ] ✅ Forecast chart displays predictions
- [ ] ✅ No CRITICAL bugs
- [ ] ✅ <5 HIGH bugs (documented workarounds)
- [ ] ✅ Demo flow rehearsed 5+ times (smooth, <10 min)
- [ ] ✅ Backup video recorded
- [ ] ✅ Network reliability tested

---

**Estimated Total Testing Time:** 12-18 hours over 3-4 days

**After Testing:** You'll have a list of bugs to fix and confidence the demo will work.

**Next:** Fix bugs, rehearse pitch, schedule meeting with UW.
