# Setup Guide - Flow Sports Coach

Complete setup instructions for development environment.

## Prerequisites

- **Node.js** >= 20.9.0 ([download](https://nodejs.org/))
- **pnpm** >= 8.0.0 (`npm install -g pnpm`)
- **PostgreSQL** >= 15 (or use Supabase free tier)
- **OpenAI API Key** ([get one](https://platform.openai.com/api-keys))
- **Git** for version control

## Quick Start (5 minutes)

### 1. Clone Repository
```bash
git clone https://github.com/arnavmmittal/FlowSportsCoach.git
cd SportsAgent
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Set Up Web App

#### 3.1 Create environment file
```bash
cd apps/web
cp .env.example .env.local
```

#### 3.2 Configure environment variables
Edit `apps/web/.env.local`:

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# NextAuth (use openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-..."

# Optional: Voice (if using voice chat)
NEXT_PUBLIC_WEBSOCKET_URL="ws://localhost:3001"
```

#### 3.3 Set up database
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (dev only)
npx prisma db push

# Or run migrations (production)
npx prisma migrate deploy
```

#### 3.4 Run development server
```bash
pnpm dev
```

Visit http://localhost:3000

### 4. Set Up Mobile App

#### 4.1 Navigate to mobile directory
```bash
cd apps/mobile
```

#### 4.2 Configure API endpoint
Edit `apps/mobile/packages/api-client/src/config.ts`:

```typescript
// For local development on physical device
export const API_BASE_URL = 'http://[YOUR-LOCAL-IP]:3000';

// For iOS simulator
export const API_BASE_URL = 'http://localhost:3000';

// For Android emulator
export const API_BASE_URL = 'http://10.0.2.2:3000';
```

#### 4.3 Start Expo development server
```bash
npx expo start
```

Scan QR code with Expo Go app or press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web (limited functionality)

## Database Setup Options

### Option A: Supabase (Recommended for MVP)

1. Create free account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Project Settings → Database
4. Use in `DATABASE_URL`

**Advantages:**
- Free tier generous (500MB database, 2GB bandwidth)
- Built-in auth, storage, realtime
- Automatic backups
- No local PostgreSQL needed

### Option B: Local PostgreSQL

1. Install PostgreSQL
2. Create database:
```bash
createdb ai_sports_agent
```
3. Use connection string:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai_sports_agent"
```

## Environment Separation (Production Ready)

### Development Environment
```bash
# apps/web/.env.local (never commit)
DATABASE_URL="postgresql://...dev.supabase.co..."
OPENAI_API_KEY="sk-...test-key..."
NEXT_PUBLIC_ENV="development"
```

### Production Environment
```bash
# Set in Vercel/deployment platform
DATABASE_URL="postgresql://...prod.supabase.co..."
OPENAI_API_KEY="sk-...prod-key..."
NEXT_PUBLIC_ENV="production"
```

**Best Practices:**
- Use separate Supabase projects for dev/prod
- Use different OpenAI API keys (set spending limits)
- Never commit `.env.local` or `.env` files
- Use `.env.example` as template only

## Testing

### Web App
```bash
cd apps/web

# Type check
pnpm type-check

# Lint
pnpm lint

# Build (test production build)
pnpm build
```

### Mobile App
```bash
cd apps/mobile

# Type check
npx tsc --noEmit

# Run on specific platform
npx expo start --ios
npx expo start --android
```

## Troubleshooting

### "Cannot find module 'next'"
```bash
# Delete node_modules and reinstall
rm -rf node_modules
pnpm install
```

### Database connection errors
```bash
# Check connection string format
# Must be: postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# Test connection
npx prisma db pull
```

### Prisma errors
```bash
# Regenerate client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
```

### Mobile app won't connect to API
1. Check your local IP address: `ipconfig getifaddr en0` (macOS)
2. Update `API_BASE_URL` in `packages/api-client/src/config.ts`
3. Ensure web server is running on port 3000
4. Disable firewall temporarily if needed

### "OpenAI API quota exceeded"
- Set spending limit in OpenAI dashboard
- Implement rate limiting (see [MVP_STATUS.md](./MVP_STATUS.md))

## Demo Accounts

Once database is set up, you can use demo accounts:

**Athlete:**
- Email: `demo@athlete.com`
- Password: `demo123`

**Coach:**
- Email: `demo@coach.com`
- Password: `demo123`

These are hardcoded in the auth system and don't require database records.

## Next Steps

1. Read [README.md](./README.md) for project overview
2. Check [MVP_STATUS.md](./MVP_STATUS.md) for current progress
3. Start with `/apps/web/src/app/api/chat/route.ts` to understand AI flow
4. Explore `/apps/web/src/components/` for UI components

## Getting Help

- Check existing GitHub issues
- Review code comments in complex files
- Test with demo accounts first before creating real users
