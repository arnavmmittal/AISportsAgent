# Configuration Guide

## Environment Files

This directory contains environment-specific configuration templates for all deployment environments.

### Files

- **`.env.development`** - Local development configuration
- **`.env.staging`** - Staging environment (pre-production testing)
- **`.env.production`** - Production environment (live customer data)

### Usage

#### For Local Development

```bash
# Copy development template to web app
cp config/environments/.env.development apps/web/.env.local

# Edit with your actual values
code apps/web/.env.local

# Fill in:
# - Your Supabase credentials
# - Your OpenAI API key
# - Generate NEXTAUTH_SECRET: openssl rand -base64 32
```

#### For Staging Deployment (Vercel)

```bash
# In Vercel dashboard:
# 1. Go to Project Settings → Environment Variables
# 2. Select "Staging" environment
# 3. Copy values from config/environments/.env.staging
# 4. Replace [PLACEHOLDERS] with actual secrets
```

#### For Production Deployment (Vercel)

```bash
# CRITICAL: Review security checklist first (see DEPLOYMENT.md)

# In Vercel dashboard:
# 1. Go to Project Settings → Environment Variables
# 2. Select "Production" environment
# 3. Copy values from config/environments/.env.production
# 4. Replace [PLACEHOLDERS] with actual secrets
# 5. VERIFY: ENABLE_DEMO_ACCOUNTS=false
# 6. VERIFY: ENABLE_COST_LIMITS=true
```

### Environment Validation

Each environment file includes critical security settings. The application validates these on startup:

**Production Requirements:**
- ✅ `ENABLE_DEMO_ACCOUNTS=false` (security)
- ✅ `ENABLE_COST_LIMITS=true` (cost protection)
- ✅ `NEXTAUTH_SECRET` ≥ 32 characters (security)
- ✅ `ENABLE_RATE_LIMITING=true` (DDoS protection)

**Startup fails if validation fails** - prevents insecure deployments.

### Secret Rotation Schedule

| Secret | Frequency | Command |
|--------|-----------|---------|
| `NEXTAUTH_SECRET` | Every 90 days | `openssl rand -base64 32` |
| `OPENAI_API_KEY` | Every 180 days | OpenAI dashboard → Revoke → New |
| `MCP_SERVICE_TOKEN` | Every 365 days | `openssl rand -hex 32` |

**Set calendar reminders** for rotation dates.

### Folder Structure

```
config/
├── environments/
│   ├── .env.development     # Local dev template
│   ├── .env.staging         # Staging template
│   └── .env.production      # Production template
└── README.md                # This file
```

### Security Best Practices

1. **Never commit `.env.local` or `.env` files** (already in `.gitignore`)
2. **Use separate secrets for each environment** (dev ≠ staging ≠ prod)
3. **Rotate secrets on schedule** (see table above)
4. **Validate on startup** (app checks critical flags)
5. **Use Vercel env vars for staging/prod** (not files)

### Troubleshooting

**"supabaseUrl is required" error:**
- Ensure env vars are in `apps/web/.env.local` (not root)
- Restart dev server after changes

**"NEXTAUTH_SECRET must be at least 32 characters":**
```bash
openssl rand -base64 32
```

**Production deploy fails validation:**
- Check Vercel env vars: `ENABLE_DEMO_ACCOUNTS=false`
- Check Vercel env vars: `ENABLE_COST_LIMITS=true`

---

**See [DEPLOYMENT.md](../DEPLOYMENT.md) for complete deployment guide**
