# 🧪 Quick Testing Guide

## Super Simple - One Command Testing!

### Test Web App
```bash
./quick-test.sh web
```
Opens: http://localhost:3000

**Login credentials:**
- Coach: `coach.smith@mvp-university.edu` / `coach123456`
- Athlete: `sarah.johnson@mvp-university.edu` / `athlete123456`

---

### Test Mobile App
```bash
./quick-test.sh mobile
```
Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Or scan QR code with Expo Go app

---

### Test Both (Requires 2 Terminals)
**Terminal 1:**
```bash
./quick-test.sh web
```

**Terminal 2:**
```bash
./quick-test.sh mobile
```

---

## What's Been Set Up For You

✅ **Database**: Seeded with 20 athletes, 2 coaches, 508 mood logs, 77 goals
✅ **API Keys**: All configured (OpenAI, ElevenLabs, Supabase)
✅ **Mobile Config**: Connected to your local IP (192.168.1.17:3000)
✅ **Weekly Summaries**: Fully integrated in coach athlete detail view
✅ **Coach Insights**: Now uses real data (no more mock data!)

---

## Quick Test Checklist

### Web App (http://localhost:3000)
- [ ] Login as coach or athlete
- [ ] Chat with AI (streaming responses work)
- [ ] View mood logs and charts
- [ ] Check goals management
- [ ] (Coach) View athlete detail page
- [ ] (Coach) See weekly summaries section

### Mobile App
- [ ] Login works
- [ ] Chat with voice input
- [ ] Mood tracking with charts
- [ ] Goals CRUD operations
- [ ] (Coach) Insights tab shows real data
- [ ] (Coach) See team readiness metrics

---

## Test Accounts

### Coaches
| Email | Password |
|-------|----------|
| coach.smith@mvp-university.edu | coach123456 |
| coach.williams@mvp-university.edu | coach123456 |

### Athletes (Pattern: [firstname].[lastname]@mvp-university.edu)
| Name | Email | Password | Risk Level |
|------|-------|----------|------------|
| Sarah Johnson | sarah.johnson@mvp-university.edu | athlete123456 | LOW |
| Mike Chen | mike.chen@mvp-university.edu | athlete123456 | HIGH |
| River Jackson | river.jackson@mvp-university.edu | athlete123456 | CRITICAL |

**All athletes**: Use password `athlete123456`

---

## What to Test

### 🎯 Key Features to Verify

**1. Chat Interface (Web & Mobile)**
- Real-time AI responses
- Voice input (mobile)
- Crisis detection modal
- Message history

**2. Mood Tracking**
- Daily mood logging
- 7-day trend charts (LineChart)
- Average calculations

**3. Coach Dashboard**
- Team overview stats
- At-risk athletes list
- Readiness scores
- **NEW:** Weekly summaries for each athlete

**4. Mobile Coach Insights**
- **FIXED:** Now shows real data from API
- Team metrics update in real-time
- Crisis alerts displayed
- Recommendations based on actual athlete data

---

## Troubleshooting

**Web won't start:**
```bash
cd apps/web
pnpm install
pnpm dev
```

**Mobile won't start:**
```bash
cd apps/mobile
pnpm install
pnpm start
```

**Database connection error:**
- Check that .env.local has correct DATABASE_URL
- Verify Supabase is accessible

**Mobile can't reach backend:**
- Web server must be running (./quick-test.sh web)
- Check that mobile .env.local has: `EXPO_PUBLIC_API_URL=http://192.168.1.17:3000`
- Make sure you're on the same network

---

## Advanced Testing

See `TESTING_GUIDE.md` for comprehensive testing instructions including:
- Branch switching
- Database management
- API endpoint testing
- Weekly summaries feature testing

---

**Need help?** Just run the apps and start exploring! Everything is pre-configured. 🚀
