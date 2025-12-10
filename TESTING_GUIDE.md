# AI Sports Agent - Local Testing Guide

Complete guide to test both web and mobile apps locally.

## Prerequisites

- **Node.js** >= 20.9.0
- **pnpm** installed (`npm install -g pnpm`)
- For iOS: macOS with Xcode
- For Android: Android Studio with emulator
- For Physical Device: **Expo Go app** (download from App Store/Play Store)

---

## 🚀 First-Time Setup

### 1. Install Dependencies

```bash
# From project root
cd /Users/arnavmittal/Desktop/SportsAgent

# Install all packages (web + mobile + shared)
pnpm install
```

### 2. Configure Web App Database

```bash
cd apps/web

# Generate Prisma Client (TypeScript types for database)
pnpm prisma:generate

# Push schema to SQLite database (creates dev.db file)
pnpm prisma db push
```

**Important**: These Prisma commands only need to be run:
- ✅ First time setting up the project
- ✅ After running `pnpm install` (fresh node_modules)
- ✅ After changing `prisma/schema.prisma`
- ❌ NOT every time you start the dev server

### 3. Verify Configuration

**Check Web Environment** (`apps/web/.env.local`):
```env
DATABASE_URL=file:./dev.db
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."
```

**Check Mobile API URL** (`apps/mobile/lib/auth.ts`):
```typescript
const API_URL = __DEV__
  ? 'http://10.0.0.127:3000'  // ✅ Your local IP
  : 'https://your-production-url.vercel.app';
```

---

## 🏃 Running the Apps (Daily Use)

### Terminal 1: Start Web Backend

```bash
cd /Users/arnavmittal/Desktop/SportsAgent/apps/web
pnpm dev
```

✅ **Web app running at: http://localhost:3000**

**Wait for this message:**
```
✓ Ready in 1400ms
```

Leave this terminal running!

### Terminal 2: Start Mobile App

```bash
cd /Users/arnavmittal/Desktop/SportsAgent/apps/mobile
pnpm start
```

**Options:**
- Press `i` → iOS Simulator
- Press `a` → Android Emulator
- Scan QR code with **Expo Go app** on your phone

---

## 📱 Testing on Physical Device (Recommended)

### Setup
1. Download **Expo Go** app on your phone
2. Make sure your phone and computer are on the **same WiFi**
3. Your local IP is configured: **10.0.0.127**

### Test Login

**Demo Account (No Database Required)**:
- Email: `demo@athlete.com`
- Password: `demo123`
- Works on both web and mobile immediately!

**Or Create Your Own Account**:
1. **On Web** (http://localhost:3000):
   - Click "Sign Up"
   - Create athlete account: `test@example.com` / `password123`

2. **On Mobile** (Expo Go):
   - Open the app via QR code
   - Login with same credentials: `test@example.com` / `password123`

### Test Features
- ✅ **Chat**: Send message, see AI streaming response
- ✅ **Mood**: Log mood, confidence, stress, sleep
- ✅ **Goals**: Create goal, update progress
- ✅ **Dashboard**: View stats and recent check-ins

---

## 🔧 Troubleshooting

### "Unable to connect to server" on Mobile

**Problem**: Mobile app can't reach `http://10.0.0.127:3000`

**Fix**:
```bash
# 1. Find your actual local IP
ipconfig getifaddr en0  # macOS WiFi

# 2. Update apps/mobile/lib/auth.ts
const API_URL = __DEV__
  ? 'http://YOUR_ACTUAL_IP:3000'  # Replace with your IP
  : '...';
```

### "Prisma Client not initialized" Error

**Problem**: Database client not generated

**Fix**:
```bash
cd /Users/arnavmittal/Desktop/SportsAgent/apps/web

# Regenerate Prisma Client
pnpm prisma:generate

# Sync database schema
pnpm prisma db push

# Restart dev server
pnpm dev
```

### Port 3000 Already in Use

**Problem**: Another process using port 3000

**Fix**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or let Next.js use port 3001
# (Update mobile API URL to :3001)
```

### Supabase RLS Warnings

**Problem**: Seeing "Table public.Account RLS not enabled"

**Explanation**: You're using SQLite locally, not Supabase. These warnings are safe to ignore for local testing.

**To silence warnings**: Switch `DATABASE_URL` in `.env.local` to:
```env
# Uncomment this line and comment out SQLite
DATABASE_URL=postgresql://postgres:p%3FY83B%3FP%3FuNnP5b@db.ccbcrerrnkqqgxtlqjnm.supabase.co:5432/postgres?sslmode=require
```

Then run:
```bash
pnpm prisma db push
pnpm dev
```

---

## 📝 Quick Reference Commands

### Web Development
```bash
cd apps/web
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm prisma:generate  # Generate Prisma Client
pnpm prisma db push   # Sync schema to database
pnpm prisma:studio    # Open database GUI
```

### Mobile Development
```bash
cd apps/mobile
pnpm start            # Start Expo dev server
pnpm ios              # Run iOS simulator
pnpm android          # Run Android emulator
```

### Database Management
```bash
cd apps/web

# View database in GUI
pnpm prisma:studio    # Opens http://localhost:5555

# Reset database (WARNING: deletes all data)
rm prisma/dev.db
pnpm prisma db push

# Check database schema
pnpm prisma:validate
```

---

## 🎯 Testing Checklist

### Web App (http://localhost:3000)
- [ ] Sign up as athlete
- [ ] Login with credentials
- [ ] Chat with AI (test streaming)
- [ ] Log mood entry
- [ ] Create a goal
- [ ] View dashboard

### Mobile App (Expo Go)
- [ ] Login with same credentials as web
- [ ] Navigate between tabs (Dashboard, Chat, Mood, Goals)
- [ ] Send chat message (verify streaming works)
- [ ] Log mood with sliders
- [ ] Create goal
- [ ] Check dashboard shows same data as web

### Cross-Platform Sync
- [ ] Create goal on web → appears on mobile
- [ ] Log mood on mobile → appears on web
- [ ] Chat session continues across devices

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Mobile can't connect | Verify same WiFi, check IP address in `auth.ts` |
| Prisma error on login | Run `pnpm prisma:generate && pnpm prisma db push` |
| Port 3000 in use | Kill process with `lsof -ti:3000 \| xargs kill` |
| Expo QR won't scan | Press `a` or `i` for emulator, or type URL manually |
| "Module not found" | Run `pnpm install` in project root |

---

## 🚢 Next Steps

After testing works:
1. Review `apps/mobile/README.md` for detailed mobile features
2. See `MOBILE_APP_DEPLOYMENT.md` for App Store submission
3. Check `PLAN.md` for project roadmap and completed phases

---

**Local IP**: 10.0.0.127
**Web Port**: 3000
**Database**: SQLite (local) / Supabase (production)
