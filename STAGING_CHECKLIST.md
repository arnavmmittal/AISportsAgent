# Staging Environment Checklist

Use this checklist to verify your staging environment is properly configured for friends testing.

## Vercel Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Make sure you set these for **Preview** (staging) environment:

### Required (App Won't Work)

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | Your Supabase connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | From Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | From Supabase dashboard |
| `NEXTAUTH_SECRET` | (generated) | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Vercel preview URL | e.g., `https://your-app-staging.vercel.app` |
| `OPENAI_API_KEY` | `sk-...` | From OpenAI dashboard |

### Recommended (Key Features)

| Variable | Value | Notes |
|----------|-------|-------|
| `CRON_SECRET` | (generated) | Run: `openssl rand -base64 32` |
| `NEXT_PUBLIC_ENV` | `staging` | Identifies environment |
| `NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS` | `true` | Allow demo login for testing |
| `ENABLE_COST_LIMITS` | `false` | Disable for testing (or set high limits) |

### Optional (Can Add Later)

| Variable | Value | Notes |
|----------|-------|-------|
| `SENDGRID_API_KEY` | `SG.xxx` | For password reset emails |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://...` | Error tracking |
| `EXPO_ACCESS_TOKEN` | Token | Push notifications |

---

## Pre-Flight Checklist

### 1. Database Ready
- [ ] Supabase project created
- [ ] DATABASE_URL working (can connect)
- [ ] Prisma migrations applied: `pnpm prisma:migrate`
- [ ] Test data seeded: `pnpm seed:friends`

### 2. Vercel Configured
- [ ] All required env vars set
- [ ] Build succeeds (check deployments)
- [ ] Preview URL accessible

### 3. Quick Smoke Test
- [ ] Can load homepage
- [ ] Can login with test account
- [ ] Can send chat message
- [ ] Chat response comes back

---

## Seed Test Data

After Vercel is configured, seed test accounts:

```bash
# Connect to your staging database
cd apps/web

# Set DATABASE_URL to staging
export DATABASE_URL="postgresql://..."

# Run the main seed script (includes comprehensive test data)
pnpm prisma:seed
```

This creates:
- 1 coach account (coach@uw.edu / Coach2024!)
- 50 athlete accounts (athlete1-50@uw.edu / Athlete2024!)
- 30 days of mood logs per athlete
- Chat sessions with psychological insights
- Goals, interventions, and predictions
- Full demo data for testing all features

---

## Staging vs Production Differences

| Setting | Staging | Production |
|---------|---------|------------|
| `NEXT_PUBLIC_ENV` | `staging` | `production` |
| `ENABLE_DEMO_ACCOUNTS` | `true` | `false` |
| `ENABLE_COST_LIMITS` | `false` or high | `true` with limits |
| Cost limits | Relaxed | Enforced ($500/day) |
| Error verbosity | Detailed | Minimal |
| Sentry | Optional | Required |

---

## Troubleshooting

### "Can't connect to database"
- Check DATABASE_URL is set correctly
- Use "Transaction" mode connection string from Supabase
- Verify IP isn't blocked in Supabase

### "Login doesn't work"
- Check NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your Vercel URL exactly
- Verify Supabase keys are correct

### "Chat not responding"
- Check OPENAI_API_KEY is set and valid
- Check OpenAI has spending limit not exceeded
- Look at Vercel function logs for errors

### "Build fails"
- Check all required env vars are set
- Look at Vercel build logs
- Try building locally: `pnpm build`

---

## Share With Friends

Once staging is working, share:

1. **Staging URL**: `https://[your-vercel-preview-url]`
2. **Testing Guide**: `TESTING_GUIDE.md`
3. **Test Accounts**: Listed in testing guide

---

## Ready for Production?

When friends testing is complete and bugs are fixed:

1. [ ] All critical bugs fixed
2. [ ] RLS policies verified
3. [ ] Cost controls enabled
4. [ ] Sentry configured
5. [ ] Demo accounts disabled
6. [ ] Merge staging → main
7. [ ] Deploy to production
