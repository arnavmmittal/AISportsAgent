# Network Setup Guide

This guide helps you run the AI Sports Agent across different networks (home, girlfriend's place, etc.) without manual configuration.

## Mobile App - No More IP Changes!

### Quick Setup

1. **One-time setup**:
   ```bash
   cd apps/mobile
   cp .env.example .env.local
   ```

2. **Find your computer's local IP**:
   - **Mac**: `ipconfig getifaddr en0`
   - **Windows**: `ipconfig` (look for IPv4 Address)
   - **Example output**: `192.168.1.100`

3. **Update `.env.local`** with your IP:
   ```bash
   # apps/mobile/.env.local
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
   EXPO_PUBLIC_VOICE_URL=ws://192.168.1.100:8000
   ```

4. **When you change networks** (home → girlfriend's place):
   - Find new IP: `ipconfig getifaddr en0`
   - Update `.env.local` with new IP
   - Restart Expo: `npm run start`
   - ✅ Done! No code changes needed

### Auto-Detection (Experimental)

The app tries to auto-detect your IP from Expo's dev server. If you see this warning:

```
⚠️  EXPO_PUBLIC_API_URL not set in .env.local
Using auto-detected IP or localhost.
```

It means auto-detection is running. This usually works, but setting `.env.local` is more reliable.

### Files Modified

- ✅ `apps/mobile/lib/auth.ts` - Now uses `config.apiUrl`
- ✅ `apps/mobile/app/(tabs)/chat.tsx` - Now uses `config.voiceUrl`
- ✅ `apps/mobile/config/index.ts` - Centralized configuration

### Why This Fixes Your Issue

**Before**: IP addresses hardcoded in 3+ files
```typescript
const API_URL = 'http://10.0.0.34:3000'; // Had to edit this every time!
```

**After**: One configuration file
```typescript
import config from '../config';
const API_URL = config.apiUrl; // Reads from .env.local
```

---

## Database Connection - Already Working!

Your Supabase database is properly configured and working:

✅ Connection successful to `db.ccbcrerrnkqqgxtlqjnm.supabase.co`
✅ 23 tables found (Account, Athlete, ChatSession, etc.)
✅ PostgreSQL 17.6 running

### If You See Database Errors

1. **Check Python dependencies**:
   ```bash
   cd ai-sports-mcp/server
   pip install -r requirements.txt
   ```

2. **Test connection**:
   ```bash
   python3 test-db-connection.py
   ```

3. **Check Supabase status**: https://supabase.com/dashboard/project/ccbcrerrnkqqgxtlqjnm

---

## Web App - Localhost Works Everywhere

The Next.js web app runs on `localhost:3000`, which works on any network:

```bash
cd apps/web
npm run dev
```

Open browser to http://localhost:3000 - no IP configuration needed!

---

##Quick Start Checklist

### First Time Setup
- [ ] Copy `apps/mobile/.env.example` to `apps/mobile/.env.local`
- [ ] Find your IP: `ipconfig getifaddr en0`
- [ ] Update `EXPO_PUBLIC_API_URL` in `.env.local`
- [ ] Install backend deps: `cd ai-sports-mcp/server && pip install -r requirements.txt`

### Every Time You Change Networks
- [ ] Find new IP: `ipconfig getifaddr en0`
- [ ] Update `.env.local` (just one file!)
- [ ] Restart Expo: `npm run start`

### If Database Fails
- [ ] Run: `python3 test-db-connection.py`
- [ ] Install deps: `pip install psycopg2-binary sqlalchemy`
- [ ] Check Supabase dashboard

---

## Troubleshooting

### "Network request failed" in mobile app
→ Wrong IP in `.env.local`. Run `ipconfig getifaddr en0` and update it.

### "Cannot connect to server" in mobile app
→ Make sure backend is running: `cd ai-sports-mcp/server && python -m app.main`

### "Database connection failed"
→ Run `python3 test-db-connection.py` to diagnose

### Expo shows different IP than my computer
→ Use manual IP in `.env.local` instead of relying on auto-detection

---

## Advanced: Deploy Backend to Cloud

To eliminate network configuration entirely, deploy the Python backend to:
- **Railway** (recommended): https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com

Then set:
```bash
# apps/mobile/.env.local
EXPO_PUBLIC_API_URL=https://your-app.railway.app
```

This works everywhere (home, girlfriend's place, coffee shop, etc.) without changes!
