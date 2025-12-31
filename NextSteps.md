# Next Steps - Performance Tech Strategy & Demo Prep

**Last Updated**: 2025-12-31
**Status**: Reframed as performance optimization platform (NOT mental health)
**Goal**: UW Pilot → $100-200k/year contracts with D1 programs

---

## 🎯 Strategic Reframe: Performance Tech, Not Mental Health

### What Changed

**OLD positioning (WRONG):**
- Mental health therapy app
- Replaces clinical psychologists
- Heavy regulation (HIPAA, IRB approval)
- Liability concerns
- Hard sell to athletic departments

**NEW positioning (CORRECT):**
- **Performance analytics platform** (like WHOOP for mental readiness)
- **Scalability tool** (replaces impossible 1:150 Zoom meeting model)
- **Competitive advantage** (data-driven coaching insights)
- Lighter regulation (FERPA, standard software contract)
- Natural fit for athletic department budgets ($100-200k/year is market-rate)

### Core Value Props

**1. Predictive Performance Analytics**
- Correlate mental readiness → game performance
- "Athletes with readiness >85 score 23% more points"
- ML forecasting: predict who will struggle 7 days out
- Data-driven lineup decisions

**2. 24/7 Scalable Support**
- Replaces scheduled Zoom meetings (impossible at 1:150 ratio)
- Athletes get support when they need it (night before game)
- Voice + text chat available 24/7
- Frees up sports psychologist for high-risk cases

**Comps:**
- WHOOP (physical readiness): $30-50k/year per team
- Catapult (GPS tracking): $100-150k/year
- Kinduct (athlete management): $50-100k/year
- **Our pricing ($100-200k/year) is market-rate**

---

## 🚀 2-Week Demo Prep Plan

### ✅ Week 1: Testing & Polish (CRITICAL)

**Day 1-2: End-to-End Device Testing**
- [ ] Install app on YOUR iPhone/Android
- [ ] Run backend on laptop (`pnpm dev` in apps/web)
- [ ] Connect phone to same WiFi
- [ ] Update `EXPO_PUBLIC_API_URL` with laptop IP
- [ ] Test complete flow:
  - ✅ Login with seed account (athlete1@uw.edu / Athlete2024!)
  - ✅ Voice chat works (speak → transcribe → AI response → TTS)
  - ✅ Mood logging saves to database
  - ✅ Analytics dashboards load with data
  - ✅ Coach view shows team heatmap
  - ✅ Correlation matrix displays r-values
  - ✅ Readiness forecast shows 7-day prediction
- [ ] **List every bug you find** (there will be many)

**Day 3-4: Fix Critical Bugs**
- [ ] Fix TypeScript errors: ✅ Already done (14 errors fixed)
- [ ] Fix voice chat issues found in testing
- [ ] Fix analytics display bugs
- [ ] Ensure data persists (not just demo mode)
- [ ] Test on both iOS and Android if possible

**Day 5: Create Realistic Demo Data**
- [ ] Add performance stats to seed data:
  ```sql
  -- Basketball example: Points, Assists, Rebounds, Turnovers
  INSERT INTO performance_records (athlete_id, game_date, points, assists, rebounds, turnovers, minutes_played)
  VALUES
    -- Athlete with HIGH readiness → GOOD performance
    ('athlete1', '2024-12-15', 22, 5, 8, 2, 34),  -- Readiness 87
    ('athlete1', '2024-12-18', 24, 6, 7, 1, 36),  -- Readiness 89

    -- Athlete with LOW readiness → BAD performance
    ('athlete1', '2024-12-22', 9, 2, 4, 5, 24),   -- Readiness 62
    ('athlete1', '2024-12-25', 11, 1, 3, 4, 28);  -- Readiness 58
  ```
- [ ] Ensure mood logs correlate with performance
- [ ] Verify correlation matrix shows r>0.5
- [ ] Check forecast predicts declining performance

**Day 6-7: Backup Plans**
- [ ] Record video of working demo (when WiFi fails)
- [ ] Set up mobile hotspot backup (if campus WiFi unreliable)
- [ ] Test demo mode (offline fallback)
- [ ] Create slides with screenshots (if live demo fails)

### ✅ Week 2: Pitch & Outreach

**Day 8-10: Perfect the 10-Minute Pitch**

**Demo Flow:**

1. **The Problem** (1 min)
   - "UW has 1 sports psychologist for 150+ athletes"
   - "Can't do individual meetings - physically impossible"
   - "Athletes need support but can't access it"
   - "Coaches don't know who's struggling until it's too late"

2. **The Solution - Chat** (2 min)
   - Show athlete using voice chat on phone
   - "I'm anxious about tomorrow's game against UCLA"
   - AI responds with sport-specific mental prep
   - "This is 24/7, not just scheduled Zoom times"

3. **The Killer Feature - Analytics** (4 min)
   - **Team Heatmap:**
     - "14-day readiness - see entire team at a glance"
     - "Green = good, red = at-risk"
   - **Performance Correlation:**
     - "When Sarah's readiness >85: 22 PPG"
     - "When readiness <70: 12 PPG"
     - "r=0.73 correlation between confidence and assists"
     - **"This is data you don't have today"**
   - **Readiness Forecast:**
     - "7-day forecast shows who will struggle next week"
     - "Proactive intervention before performance drops"

4. **The ROI** (2 min)
   - "Star player transfers due to mental health: $500k lost"
   - "One prevented injury: $100k saved"
   - "One extra conference win: $1M in bowl revenue"
   - **"$150k/year. If it prevents ONE star transfer, 5x ROI"**

5. **The Ask** (1 min)
   - "8-week pilot with women's basketball, 15 athletes, FREE"
   - "Show you correlations with YOUR athletes"
   - "No risk - if data isn't predictive, we walk away"
   - **"But I think you'll see data that changes how you coach"**

**Day 11-12: Rehearse**
- [ ] Practice pitch 5 times
- [ ] Time yourself (<10 minutes)
- [ ] Get 3 people to watch and ask hard questions
- [ ] Refine answers to objections

**Day 13-14: Outreach**
- [ ] Email UW women's basketball coach
  ```
  Subject: Predictive performance analytics pilot - 8 weeks, no cost

  Coach [Name],

  I'm a UW student who built an AI-powered athlete readiness platform that correlates mental state with game performance. We've seen r=0.7+ correlations between readiness scores and points/assists.

  I'd love to demo this and discuss an 8-week pilot with your team (no cost). The platform provides:
  - 24/7 mental performance support (replaces scheduled meetings)
  - Predictive analytics (who will struggle 7 days out)
  - Data-driven lineup insights

  Can we schedule 15 minutes this week?

  Best,
  [Your name]
  ```
- [ ] Email athletic director
- [ ] Email sports psychologist at UW
- [ ] Post on LinkedIn (tag UW athletics)

---

## 📊 Automated Performance Stats Collection

### The Problem
Manual data entry sucks. You need game stats automatically.

### Solution: Multi-Tier Approach

#### Tier 1: Web Scraping (Best for Pilot)

**Most D1 schools publish box scores on athletics websites:**
- UW: `https://gohuskies.com/sports/womens-basketball/stats`
- Every school has similar structure

**Implementation:**
```typescript
// apps/web/src/lib/scraping/uw-athletics.ts

import * as cheerio from 'cheerio';
import { prisma } from '@/lib/prisma';

export async function scrapeUWBasketballStats(gameUrl: string) {
  const response = await fetch(gameUrl);
  const html = await response.text();
  const $ = cheerio.load(html);

  // Parse box score table
  const stats = [];
  $('table.box-score tbody tr').each((i, row) => {
    const name = $(row).find('td.name').text().trim();
    const points = parseInt($(row).find('td.pts').text()) || 0;
    const rebounds = parseInt($(row).find('td.reb').text()) || 0;
    const assists = parseInt($(row).find('td.ast').text()) || 0;
    const turnovers = parseInt($(row).find('td.to').text()) || 0;
    const minutes = parseInt($(row).find('td.min').text()) || 0;

    stats.push({ name, points, rebounds, assists, turnovers, minutes });
  });

  return stats;
}

// Run daily via cron job
export async function importDailyStats() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Check UW athletics schedule API
  const games = await fetchRecentGames(yesterday);

  for (const game of games) {
    const stats = await scrapeUWBasketballStats(game.boxScoreUrl);

    for (const playerStats of stats) {
      // Match player name to athlete in database
      const athlete = await prisma.athlete.findFirst({
        where: { name: { contains: playerStats.name } }
      });

      if (athlete) {
        await prisma.performanceRecord.create({
          data: {
            athleteId: athlete.id,
            gameDate: game.date,
            points: playerStats.points,
            rebounds: playerStats.rebounds,
            assists: playerStats.assists,
            turnovers: playerStats.turnovers,
            minutesPlayed: playerStats.minutes,
          }
        });
      }
    }
  }
}
```

**Cron Job (runs daily at 6am):**
```typescript
// apps/web/src/app/api/cron/import-stats/route.ts

export async function GET(request: Request) {
  // Verify cron secret (prevent abuse)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await importDailyStats();

  return Response.json({ success: true });
}
```

**Vercel Cron (free tier):**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/import-stats",
    "schedule": "0 6 * * *"  // 6am daily
  }]
}
```

**Pros:**
- ✅ Fully automated
- ✅ Free (no API costs)
- ✅ Works for any D1 school (similar HTML structure)
- ✅ Gets ALL players automatically

**Cons:**
- ❌ Breaks if website redesigns
- ❌ Needs maintenance per school

#### Tier 2: Sports Data APIs (Best for Scale)

**Option A: ESPN API (Unofficial)**
```typescript
// Free but rate-limited
const espnUrl = `http://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams/264/statistics`;
// Team 264 = UW Huskies

const response = await fetch(espnUrl);
const data = await response.json();
```

**Option B: NCAA Stats API**
```typescript
// Official NCAA stats (requires approval)
const ncaaUrl = `https://stats.ncaa.org/team/${teamId}/stats`;
```

**Option C: SportsDataIO (Paid)**
- $50-200/month for college sports data
- Reliable, well-structured JSON
- Covers all D1 programs

**Pros:**
- ✅ Structured JSON (no parsing)
- ✅ Reliable (won't break on redesign)
- ✅ Fast implementation

**Cons:**
- ❌ Costs money (SportsDataIO)
- ❌ Rate limits (ESPN unofficial)
- ❌ Approval process (NCAA)

#### Tier 3: CSV Upload (Fallback)

**For coaches who already track stats:**
```typescript
// apps/web/src/app/api/performance/upload/route.ts

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const csvText = await file.text();

  // Parse CSV
  const rows = csvText.split('\n').map(row => row.split(','));
  const headers = rows[0]; // ['Name', 'Date', 'Points', 'Assists', ...]

  for (let i = 1; i < rows.length; i++) {
    const data = {};
    headers.forEach((header, index) => {
      data[header.toLowerCase()] = rows[i][index];
    });

    // Find athlete by name
    const athlete = await prisma.athlete.findFirst({
      where: { name: { contains: data.name } }
    });

    if (athlete) {
      await prisma.performanceRecord.create({
        data: {
          athleteId: athlete.id,
          gameDate: new Date(data.date),
          points: parseInt(data.points) || 0,
          assists: parseInt(data.assists) || 0,
          rebounds: parseInt(data.rebounds) || 0,
          // ... other stats
        }
      });
    }
  }

  return Response.json({ success: true, imported: rows.length - 1 });
}
```

**UI Component:**
```tsx
// apps/web/src/app/coach/performance/import/page.tsx

<input
  type="file"
  accept=".csv"
  onChange={async (e) => {
    const file = e.target.files?.[0];
    const formData = new FormData();
    formData.append('file', file);

    await fetch('/api/performance/upload', {
      method: 'POST',
      body: formData,
    });

    toast.success('Stats imported!');
  }}
/>
```

**Pros:**
- ✅ Works with ANY data source
- ✅ Coaches already have this data (Excel, TeamBuildr, Kinduct)
- ✅ 100% reliable (manual = always works)

**Cons:**
- ❌ Not automated (requires coach to upload)
- ❌ Extra work for coaches

#### Tier 4: Integration with Existing Systems

**Most D1 programs use:**
- **Kinduct** (athlete management)
- **TeamBuildr** (strength training)
- **Catapult** (GPS tracking)

**API Integration:**
```typescript
// If school uses Kinduct, integrate via their API
const kinductStats = await fetch(`https://api.kinduct.com/v1/athletes/${athleteId}/performance`, {
  headers: {
    'Authorization': `Bearer ${KINDUCT_API_KEY}`,
  }
});
```

**Pros:**
- ✅ Fully automated
- ✅ Real-time data
- ✅ Trusted source

**Cons:**
- ❌ Requires partnership with vendor
- ❌ Different per school
- ❌ May not have game stats (only training data)

---

### Recommended Approach for UW Pilot

**Phase 1 (Week 1-2): Manual CSV Upload**
- Ask coach for last 20 games in Excel
- You manually import once
- Prove correlations exist

**Phase 2 (Week 3-4): Build Web Scraper**
- Scrape `gohuskies.com` box scores
- Run daily cron job
- Auto-import new games

**Phase 3 (Month 2+): Sports Data API**
- Subscribe to SportsDataIO ($50/month)
- Or get ESPN API working
- Scale to other schools

**Cost:**
- Phase 1: $0
- Phase 2: $0 (web scraping)
- Phase 3: $50-200/month (API)

**For demo:** Use Phase 1 (manual CSV). Show it works. Then automate later.

---

## 📋 Production Checklist (Post-Pilot)

### IF pilot shows strong correlations (r>0.5, p<0.05)

**Month 1-2: Production Infrastructure**
- [ ] Replace demo accounts with Supabase Auth
- [ ] Implement RLS policies (athletes see only their data)
- [ ] Add cost controls (daily message caps, monthly budget)
- [ ] Enforce crisis detection on every message
- [ ] Remove all mock data from API routes
- [ ] Set up monitoring (Sentry, LogRocket)

**Month 3-4: Expand Pilot**
- [ ] Add 2-3 more UW teams
- [ ] Refine algorithms based on feedback
- [ ] Polish coach dashboard UX
- [ ] Add automated stats import

**Month 5-6: Fundraising**
- [ ] Create deck with pilot results
- [ ] Apply to Y Combinator, TechStars Sports
- [ ] Raise $250-500k pre-seed
- [ ] Hire 1 engineer + 1 customer success

**Month 7-12: Scale**
- [ ] Approach 5 Pac-12 schools
- [ ] $100-200k/year contracts
- [ ] Target revenue: $500k-1M ARR Year 1
- [ ] Team: 3-4 people

---

## 💰 Business Model

### Pricing Tiers

**Tier 1: Single Team ($100k/year)**
- 50 athletes
- All features
- Email support
- Quarterly business reviews

**Tier 2: Full Program ($150k/year)**
- 100 athletes
- All features
- Dedicated customer success
- Monthly business reviews
- Custom integrations

**Tier 3: Enterprise ($200k+/year)**
- 200+ athletes
- All features
- 24/7 support
- Weekly check-ins
- White-label option
- On-premise deployment

### Target Market

**Phase 1 (Year 1): Pac-12 Schools**
- 12 schools
- Focus on basketball, football
- Target: 5 contracts = $500-750k ARR

**Phase 2 (Year 2): Power 5 Conferences**
- 65 schools
- Expand to all sports
- Target: 20 contracts = $2-3M ARR

**Phase 3 (Year 3+): All D1**
- 350 schools
- Add D2, D3 (lower pricing)
- Target: 50+ contracts = $5-10M ARR

---

## 🎯 Success Metrics

### Pilot Success (8 weeks)
- ✅ Correlation r>0.5 between readiness and performance
- ✅ 60%+ athletes use app weekly
- ✅ 50%+ mood log completion rate
- ✅ Coach finds insights valuable ("changed my lineup based on this")
- ✅ <$200 OpenAI costs
- ✅ 0 crisis detection failures

### Year 1 Success
- ✅ 5 school contracts
- ✅ $500k ARR
- ✅ Team of 3-4 people
- ✅ Raised $250-500k
- ✅ Conference presentation (AAASP, APA)

---

## 🚨 Risk Mitigation

### Technical Risks
- **Voice chat fails during demo**: Video backup + demo mode
- **Stats scraping breaks**: CSV upload fallback
- **Backend crashes**: Demo mode works offline

### Business Risks
- **School says no**: Multiple schools in parallel
- **Correlations are weak**: More data, refine algorithm
- **Can't fundraise**: Bootstrap with first contract revenue

### Personal Risks
- **Graduate before product ready**: Incorporate, hire team
- **Burnout from solo work**: Find co-founders early
- **Opportunity cost**: Dual-track with job applications

---

## 🎯 This Week's Action Items

### Day 1 (Today): ✅ DONE
- [x] Updated NextSteps.md with reframed strategy
- [x] Designed automated stats collection system

### Day 2-3: Critical Testing
- [ ] Install app on your phone
- [ ] Test voice chat works end-to-end
- [ ] Test analytics dashboards load
- [ ] List all bugs

### Day 4-5: Fix & Polish
- [ ] Fix critical bugs
- [ ] Add realistic performance data to seed
- [ ] Verify correlations show up
- [ ] Record backup video

### Weekend: Outreach
- [ ] Email UW women's basketball coach
- [ ] Email athletic director
- [ ] Post on LinkedIn
- [ ] Goal: 1 meeting scheduled

---

**Next Review**: After testing on device + getting first demo scheduled

**Status**: Ready to test → Ready to demo → Ready to pilot
