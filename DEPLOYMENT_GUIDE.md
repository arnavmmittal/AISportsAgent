# Production Deployment Guide

> **Feeling overwhelmed?** That's normal! This guide breaks everything down into simple steps. You don't need to set up everything at once - start with the essentials and add services as needed.

## The Mental Model

Think of your app like a house:

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR APP (The House)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ESSENTIAL (You need these to open the door)               │
│   ├── Database (Supabase) - Where data lives                │
│   ├── Hosting (Vercel) - Where code runs                    │
│   └── Auth Secret - Locks the doors                         │
│                                                              │
│   IMPORTANT (Makes it actually useful)                       │
│   ├── OpenAI API - The AI brain                             │
│   └── Email (SendGrid) - Password resets, notifications     │
│                                                              │
│   NICE TO HAVE (Add when you need them)                     │
│   ├── Sentry - Tells you when things break                  │
│   ├── Push Notifications (Expo) - Mobile alerts             │
│   ├── SMS (Twilio) - Emergency escalation                   │
│   └── Analytics (Vercel) - Usage insights                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## The Good News: Vercel + Supabase Handle Most of It

Here's the secret: **you don't manage servers**. Vercel and Supabase are "serverless" - they:
- Auto-scale when you get more users
- Handle SSL certificates
- Manage databases backups
- Run cron jobs
- Deploy automatically from git

**Your job is just: (1) set environment variables, (2) push code.**

---

## Step-by-Step Setup

### Phase 1: Get It Running (30 minutes)

You only need **4 things** to deploy:

| Service | What It Does | Free Tier |
|---------|--------------|-----------|
| [Supabase](https://supabase.com) | Database + Auth | 500MB, 50K users |
| [Vercel](https://vercel.com) | Hosting | 100GB bandwidth |
| [OpenAI](https://platform.openai.com) | AI chat | Pay-as-you-go (~$0.01/chat) |
| Your secrets | Auth security | Free (you generate them) |

#### 1. Supabase Setup (10 min)
```bash
# 1. Create account at supabase.com
# 2. Create new project
# 3. Go to Settings → Database → Connection string
# 4. Copy the "Transaction" connection string
```

Add to Vercel:
```
DATABASE_URL=postgresql://postgres:xxxxx@db.xxxxx.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

#### 2. Vercel Setup (10 min)
```bash
# 1. Create account at vercel.com
# 2. Import your GitHub repo
# 3. Set root directory to: apps/web
# 4. Add environment variables (see below)
# 5. Deploy!
```

#### 3. Generate Your Secrets (5 min)
```bash
# Run these commands to generate secure secrets:
openssl rand -base64 32  # NEXTAUTH_SECRET
openssl rand -base64 32  # CRON_SECRET
openssl rand -hex 32     # SUMMARY_ENCRYPTION_KEY
```

#### 4. OpenAI API Key (5 min)
```bash
# 1. Go to platform.openai.com
# 2. Create API key
# 3. Add spending limit ($10-50 to start)
```

**That's it for Phase 1!** Your app will work with just these.

---

### Phase 2: Add Email (15 minutes)

Without email, users can't reset passwords. Add SendGrid:

```bash
# 1. Create account at sendgrid.com (free: 100 emails/day)
# 2. Create API key with "Mail Send" permission
# 3. Verify your sending domain or use Single Sender Verification
```

Add to Vercel:
```
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@yourdomain.com
```

---

### Phase 3: Add Monitoring (15 minutes)

So you know when things break before users tell you:

```bash
# 1. Create account at sentry.io (free: 5K errors/month)
# 2. Create a Next.js project
# 3. Copy the DSN
```

Add to Vercel:
```
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

---

### Phase 4: Add Push Notifications (When you have mobile users)

```bash
# Expo Push is FREE and automatic!
# Just need an access token for higher rate limits:
# 1. Go to expo.dev
# 2. Create access token
```

Add to Vercel:
```
EXPO_ACCESS_TOKEN=xxxxx
```

---

### Phase 5: Add SMS Escalation (When you need it)

Only needed if you want SMS for critical crisis alerts:

```bash
# 1. Create account at twilio.com
# 2. Get a phone number (~$1/month)
# 3. Copy credentials
```

Add to Vercel:
```
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
CRISIS_EMERGENCY_PHONE=+1987654321
```

---

## Managing Environment Variables

### The Simple Way: Vercel Dashboard

1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add each variable
4. Choose which environments (Production, Preview, Development)

### For Local Development

Create `.env.local` (never commit this!):
```bash
cp .env.example .env.local
# Then fill in your values
```

### Pro Tip: Use Vercel CLI

```bash
# Pull production env vars to local
vercel env pull .env.local

# Push local env vars to Vercel
vercel env add VARIABLE_NAME
```

---

## The Deployment Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Local     │────▶│   Staging   │────▶│ Production  │
│ Development │     │  (Preview)  │     │   (Live)    │
└─────────────┘     └─────────────┘     └─────────────┘
     │                    │                    │
     │                    │                    │
  .env.local         Auto-deploy          Auto-deploy
  localhost:3000     on PR branch         on main branch
```

**How it works:**
1. You code locally with `.env.local`
2. Push to a branch → Vercel creates a preview URL
3. Test on preview URL
4. Merge to main → Vercel deploys to production

**You never manually deploy.** Just push code.

---

## Quick Reference: All Environment Variables

### Required (App Won't Work Without These)
```bash
DATABASE_URL                    # Supabase connection string
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase public key
NEXTAUTH_SECRET                # Generate: openssl rand -base64 32
NEXTAUTH_URL                   # https://yourdomain.com
OPENAI_API_KEY                 # OpenAI API key
```

### Recommended (Important Features)
```bash
SENDGRID_API_KEY               # Email sending
EMAIL_FROM                     # noreply@yourdomain.com
CRON_SECRET                    # Generate: openssl rand -base64 32
NEXT_PUBLIC_SENTRY_DSN         # Error tracking
```

### Optional (Add When Needed)
```bash
EXPO_ACCESS_TOKEN              # Push notifications
TWILIO_ACCOUNT_SID            # SMS
TWILIO_AUTH_TOKEN             # SMS
TWILIO_PHONE_NUMBER           # SMS
CRISIS_EMERGENCY_EMAIL        # Escalation recipient
CRISIS_EMERGENCY_PHONE        # Escalation recipient
```

---

## Checklist: First Production Deploy

```
□ Phase 1: Core Setup
  □ Supabase project created
  □ DATABASE_URL set in Vercel
  □ NEXT_PUBLIC_SUPABASE_URL set
  □ NEXT_PUBLIC_SUPABASE_ANON_KEY set
  □ NEXTAUTH_SECRET generated and set
  □ NEXTAUTH_URL set to your domain
  □ OPENAI_API_KEY set
  □ OpenAI spending limit set ($10-50)

□ Phase 2: Email
  □ SendGrid account created
  □ SENDGRID_API_KEY set
  □ EMAIL_FROM verified

□ Phase 3: Monitoring
  □ Sentry account created
  □ NEXT_PUBLIC_SENTRY_DSN set

□ Phase 4: Security
  □ CRON_SECRET generated and set
  □ Supabase RLS policies enabled
  □ NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=false

□ Final Steps
  □ Custom domain configured in Vercel
  □ Test password reset flow
  □ Test user registration
  □ Test chat functionality
```

---

## Cost Expectations

| Service | Free Tier | Typical Cost (100 users) |
|---------|-----------|-------------------------|
| Supabase | 500MB DB | Free |
| Vercel | 100GB/month | Free |
| OpenAI | Pay-per-use | $10-30/month |
| SendGrid | 100 emails/day | Free |
| Sentry | 5K errors/month | Free |
| Twilio | - | $1-5/month |

**Total for 100 users: ~$15-40/month** (mostly OpenAI)

---

## Common Issues

### "Environment variable not found"
- Make sure it's set in Vercel for the right environment (Production vs Preview)
- Redeploy after adding variables

### "Database connection failed"
- Use the "Transaction" connection string from Supabase, not "Session"
- Check if your IP is allowed in Supabase

### "OpenAI rate limit"
- Add a spending limit in OpenAI dashboard
- The app has built-in rate limiting per user

### "Emails not sending"
- Verify your sender email in SendGrid
- Check SendGrid activity log for errors

---

## Need Help?

1. **Vercel Docs**: vercel.com/docs
2. **Supabase Docs**: supabase.com/docs
3. **This Project**: Check CLAUDE.md for architecture details

Remember: **You don't need everything at once.** Start with Phase 1, get it working, then add features as needed.
