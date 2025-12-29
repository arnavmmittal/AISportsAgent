# Testing Guide - POST-MVP Features

This guide walks you through testing all the newly implemented POST-MVP features (Weeks 3-6).

## Prerequisites

1. **Database Setup**: Ensure PostgreSQL is running and `.env.local` is configured
2. **Dependencies**: Run `pnpm install` if you haven't already
3. **Prisma**: Run `pnpm prisma:generate` to generate Prisma client

## Step 1: Seed Test Data

Run these commands in order to populate your database with test data:

```bash
# Navigate to web app directory
cd apps/web

# Seed base data (school, coaches, athletes, mood logs)
pnpm db:seed

# Seed biometric data (HRV, sleep, resting HR, recovery scores)
pnpm db:seed-biometrics
```

**Expected Output:**
- ✅ School created: MVP University
- ✅ 2 coaches created (coach.smith@mvp-university.edu, coach.jones@mvp-university.edu)
- ✅ 20 athletes created with varying risk levels
- ✅ 30 days of mood logs per athlete
- ✅ ~2,400 biometric data points (20 athletes × 30 days × 4 metrics)

## Step 2: Start Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Step 3: Test Authentication

### Login as Coach
1. Navigate to `http://localhost:3000/auth/signin`
2. Use credentials:
   - Email: `coach.smith@mvp-university.edu`
   - Password: `password123`
3. You should be redirected to `/coach/dashboard`

### Login as Athlete
1. Sign out and return to `/auth/signin`
2. Use any athlete email (e.g., `sarah.johnson@mvp-university.edu`)
3. Password: `password123`
4. You should be redirected to `/student/dashboard`

## Step 4: Test Biometric Features (Week 3-4)

### As Athlete:

**Biometric Overview Cards**
1. Go to `/student/dashboard`
2. Scroll to "Biometric Overview" section
3. **Verify you see 4 cards:**
   - HRV (7-day avg) with trend indicator
   - Resting HR (7-day avg) with trend
   - Sleep (7-day avg) with trend
   - Recovery (7-day avg) with trend
4. **Check**: Each card should show:
   - ✅ Numeric value
   - ✅ Trend arrow (↑ improving, ↓ declining, → stable)
   - ✅ Status message

**HRV Chart**
1. Still on `/student/dashboard`, scroll to "Heart Rate Variability (HRV)" chart
2. **Verify:**
   - ✅ 30-day trend line visible
   - ✅ Baseline reference line (7-day average)
   - ✅ Color-coded zones: Green (>70ms), Yellow (50-70ms), Red (<50ms)
   - ✅ Tooltips on hover showing date and HRV value
   - ✅ Latest HRV status badge (Excellent/Good/Low)

**Readiness Score with HRV**
1. Check the main readiness score card
2. **Verify**: Score should reflect HRV integration (20% weight in physical dimension)

## Step 5: Test Advanced Analytics (Week 5)

### As Coach:

**Performance Correlation Matrix**
1. Log in as coach: `coach.smith@mvp-university.edu`
2. Go to `/coach/analytics`
3. Select an athlete from dropdown (e.g., "Sarah Johnson")
4. **Verify Performance Correlation section:**
   - ✅ Bar chart showing correlations (-1 to +1)
   - ✅ Green bars (positive correlation), Red bars (negative)
   - ✅ Top Factor highlight box
   - ✅ Detailed breakdown table
   - ✅ Recommendations panel
   - ✅ Significance indicators (✓ for p < 0.05)

**Team Readiness Heatmap**
1. Still on `/coach/analytics`
2. Scroll to "Team Readiness Heatmap" section
3. **Verify:**
   - ✅ 14-day × 20 athletes grid
   - ✅ Color coding: Green (85+), Blue (70-84), Yellow (60-69), Orange (45-59), Red (<45)
   - ✅ Click on a cell → navigates to athlete detail
   - ✅ Team insights showing avg score and data coverage
   - ✅ Legend at bottom

## Step 6: Test ML Forecasting (Week 6)

### As Coach:

**Readiness Forecast**
1. Go to `/coach/athletes/[athleteId]` (replace with actual ID from heatmap click)
2. Scroll to "7-Day Readiness Forecast" section
3. **Verify:**
   - ✅ Combined chart: Historical (solid line) + Forecast (dashed line)
   - ✅ Shaded confidence bounds (light blue area)
   - ✅ Reference lines: Optimal (85), Good (70), Low (50)
   - ✅ Trend indicator (↑ improving / ↓ declining / → stable)
   - ✅ Risk flags panel (if any concerning patterns)
   - ✅ Recommendations panel with specific actions
   - ✅ Forecast details table with 7 rows (one per day)

**Note**: Forecast requires 14+ days of historical readiness data. If you see "Insufficient data", you may need to:
- Run additional seed to generate readiness scores OR
- Test with an athlete that has been seeded with readiness data

## Step 7: Test Intervention Recommendations (Week 6)

### As Coach:

**Intervention Queue**
1. Go to `/coach/insights`
2. Scroll to "Intervention Queue" section
3. **Verify:**
   - ✅ Summary badges showing count per priority (Urgent/High/Medium/Low)
   - ✅ Filter buttons to toggle priority levels
   - ✅ Intervention cards with color coding:
     - Red border/background: URGENT
     - Orange border/background: HIGH
     - Yellow border/background: MEDIUM
     - Blue border/background: LOW
   - ✅ Each card shows:
     - Priority badge
     - Category badge (ONE_ON_ONE, MINDFULNESS, etc.)
     - Due date (for urgent/high)
     - Athlete name
     - Estimated duration
     - Description and rationale
     - Related metrics (readiness, mood, stress, engagement)
     - Action buttons: "View Athlete", "Mark Complete"
4. **Test interactivity:**
   - Click "View Athlete" → should navigate to athlete detail page
   - Test priority filters (All/URGENT/HIGH/MEDIUM/LOW)

## Step 8: API Testing (Optional)

You can test the APIs directly using curl or Postman:

### Get Biometric Data
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/biometrics?athleteId=ATHLETE_ID&metricType=hrv&days=30"
```

### Get Performance Correlations
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/analytics/performance-correlation?athleteId=ATHLETE_ID&days=90"
```

### Get Readiness Forecast
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/analytics/readiness-forecast?athleteId=ATHLETE_ID&days=30"
```

### Get Team Heatmap
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/coach/analytics/team-heatmap?coachId=COACH_ID&days=14"
```

### Get Intervention Queue
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/coach/interventions?coachId=COACH_ID"
```

## Common Issues & Solutions

### Issue: "No biometric data available"
**Solution**: Run `pnpm db:seed-biometrics` to generate HRV, sleep, resting HR data

### Issue: "Insufficient data for forecasting"
**Solution**: Forecasting requires 14+ days of readiness scores. Seed script should generate these, but if missing:
1. Check that mood logs exist (they're used to calculate readiness)
2. Manually trigger readiness score calculation for athletes

### Issue: "No correlations found"
**Solution**: Performance correlations require:
- At least 20 performance metrics (games/competitions)
- Corresponding mood logs within 24 hours before each game
- Run additional seed to create performance data if missing

### Issue: Components not visible on pages
**Solution**: Components may not be integrated into existing pages yet. Check:
- `/student/dashboard` for biometric components
- `/coach/analytics` for correlation matrix and heatmap
- `/coach/insights` for intervention queue
- Individual athlete pages for forecast charts

### Issue: Build errors
**Solution**:
```bash
pnpm build
# If errors, check console output
# Most common: missing imports or type errors
```

## Testing Checklist

Use this checklist to verify all features work:

### Week 3-4: Biometric Integration
- [ ] BiometricOverview cards display 7-day averages
- [ ] Trend indicators show correct direction (↑↓→)
- [ ] HRV chart renders with 30 days of data
- [ ] HRV zones are color-coded correctly
- [ ] Baseline reference line appears
- [ ] Tooltips show on hover
- [ ] Readiness score reflects HRV (check breakdown)

### Week 5: Advanced Analytics
- [ ] Performance Correlation Matrix loads
- [ ] Correlation bars render correctly (green/red)
- [ ] Top factor is highlighted
- [ ] Recommendations are actionable
- [ ] Significance indicators appear
- [ ] Team Heatmap displays 14×20 grid
- [ ] Cells are color-coded by readiness level
- [ ] Clicking cell navigates to athlete detail
- [ ] Team insights show correct averages

### Week 6: ML Forecasting + Interventions
- [ ] Readiness Forecast generates 7-day prediction
- [ ] Historical and forecast lines appear
- [ ] Confidence bounds (shaded area) render
- [ ] Risk flags panel shows warnings
- [ ] Recommendations are specific
- [ ] Forecast details table has 7 rows
- [ ] Intervention Queue groups by priority
- [ ] Cards are color-coded correctly
- [ ] Priority filters work
- [ ] Action buttons are clickable
- [ ] Due dates appear for urgent/high items

## Performance Expectations

- **Page load**: < 3 seconds for dashboards
- **API response**: < 1 second for most endpoints
- **Forecast generation**: < 2 seconds for 30 days historical data
- **Heatmap**: < 1 second for 20 athletes × 14 days

## Next Steps After Testing

1. **Report bugs**: If you find issues, create GitHub issues or note them
2. **UI feedback**: Check if components look professional (no emojis in coach views per Week 7 plan)
3. **Data quality**: Verify seed data creates realistic patterns
4. **Integration gaps**: Note any components that aren't integrated into pages yet

## Demo Preparation (Week 8)

Once testing is complete, you'll be ready for:
- **30-minute demo script** (to be created in Week 8)
- **UW sports psychology demo** showcase
- **Production deployment** to Vercel + Supabase

---

**Questions or Issues?**
- Check console logs in browser DevTools (F12)
- Check server logs in terminal running `pnpm dev`
- Review API responses in Network tab
- Verify database has data using `pnpm prisma:studio`
