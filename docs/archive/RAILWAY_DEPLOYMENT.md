# Railway Deployment Guide - MCP Server

## Prerequisites

1. **Railway Account**: Sign up at https://railway.app
2. **GitHub Repository**: Ensure code is pushed to GitHub
3. **Environment Variables**: Prepare values from `.env.example`

## Step 1: Create Railway Project

### Option A: Deploy from GitHub (Recommended)

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your repository: `arnavmmittal/FlowSportsCoach`
4. Railway will automatically detect the `railway.json` configuration

### Option B: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to repository
railway link
```

## Step 2: Configure Environment Variables

Railway needs these environment variables for production:

### Required Variables

```bash
# Database (from Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database

# AI Services
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4-turbo-preview

# Security
JWT_SECRET_KEY=<generate with: openssl rand -base64 32>
MCP_SERVICE_TOKEN=<generate with: openssl rand -base64 32>
NEXTAUTH_SECRET=<copy from Next.js app>

# CORS (Railway app URL)
CORS_ORIGINS=https://your-nextjs-app.vercel.app,https://your-railway-mcp.railway.app

# Environment
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Cost Controls
ENABLE_COST_LIMITS=true
COST_LIMIT_DAILY_PER_TENANT=500

# Rate Limiting (requires Redis - see Step 4)
RATE_LIMIT_ENABLED=true

# Crisis Detection
ENABLE_AI_CRISIS_DETECTION=true
CRISIS_ALERT_EMAIL=sports-psychology@university.edu
```

### Add Variables via Railway Dashboard

1. Go to your Railway project
2. Click on your service
3. Go to "Variables" tab
4. Click "+ New Variable"
5. Add each variable from above

### Add Variables via CLI

```bash
# Set environment variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set OPENAI_API_KEY="sk-proj-..."
railway variables set JWT_SECRET_KEY="$(openssl rand -base64 32)"
railway variables set MCP_SERVICE_TOKEN="$(openssl rand -base64 32)"
railway variables set ENVIRONMENT="production"
railway variables set DEBUG="false"
railway variables set ENABLE_COST_LIMITS="true"

# See all variables
railway variables
```

## Step 3: Add PostgreSQL (if using Railway's database)

**Note**: If using Supabase, skip this step and use your Supabase DATABASE_URL.

```bash
# Add PostgreSQL plugin
railway add postgresql

# Railway automatically sets DATABASE_URL
```

## Step 4: Add Redis (for Rate Limiting)

Railway needs Redis for rate limiting and circuit breakers:

```bash
# Add Redis plugin
railway add redis

# Railway automatically sets REDIS_URL
```

Or manually set Redis URL if using external provider:

```bash
railway variables set REDIS_URL="redis://username:password@host:port"
```

## Step 5: Deploy

### Auto-Deploy (Recommended)

Railway automatically deploys when you push to your GitHub branch:

```bash
# Commit changes
git add railway.json RAILWAY_DEPLOYMENT.md
git commit -m "feat(infra): Add Railway deployment configuration"
git push origin staging

# Railway will automatically build and deploy
```

### Manual Deploy via CLI

```bash
# Deploy current directory
railway up

# Or specify service
railway up --service mcp-server
```

## Step 6: Run Database Migrations

After first deployment, run Alembic migrations:

```bash
# SSH into Railway container
railway run bash

# Run migrations
alembic upgrade head

# Exit
exit
```

Or use Railway CLI:

```bash
railway run alembic upgrade head
```

## Step 7: Verify Deployment

### Check Health Endpoint

```bash
# Get your Railway URL
railway domain

# Test health check
curl https://your-app-name.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production"
}
```

### Check API Documentation

Visit: `https://your-app-name.railway.app/docs`

You should see FastAPI interactive documentation.

### Check Logs

```bash
# View logs in real-time
railway logs

# Or via dashboard: Project → Service → Deployments → View Logs
```

## Step 8: Custom Domain (Optional)

### Add Custom Domain

1. Go to Railway dashboard
2. Click on your service
3. Go to "Settings" tab
4. Under "Domains", click "Generate Domain" or "Add Custom Domain"
5. If using custom domain, add DNS records:

```
Type: CNAME
Name: mcp (or api)
Value: your-app-name.railway.app
```

### Update CORS Origins

After adding domain, update CORS:

```bash
railway variables set CORS_ORIGINS="https://your-app.vercel.app,https://mcp.yourdomain.com"
```

## Step 9: Connect Next.js App

Update your Next.js app to point to Railway MCP server:

```bash
# In apps/web/.env.production
MCP_SERVER_URL=https://your-app-name.railway.app
MCP_SERVICE_TOKEN=<same token from Railway>
```

Redeploy Next.js app to Vercel.

## Step 10: Production Checklist

Before going live, verify:

- [ ] All environment variables set correctly
- [ ] `ENVIRONMENT=production`
- [ ] `DEBUG=false`
- [ ] `ENABLE_COST_LIMITS=true`
- [ ] Database migrations applied
- [ ] Health check returns 200 OK
- [ ] API docs accessible at `/docs`
- [ ] Crisis detection enabled
- [ ] CORS configured for production domains
- [ ] Logs show no errors

## Monitoring & Maintenance

### View Logs

```bash
# CLI
railway logs --follow

# Dashboard
Project → Service → Deployments → View Logs
```

### Restart Service

```bash
# CLI
railway restart

# Dashboard
Project → Service → Settings → Restart
```

### Rollback Deployment

```bash
# Via CLI
railway rollback

# Via Dashboard
Project → Service → Deployments → Previous Deployment → Redeploy
```

### Scale Service (if needed)

Railway Pro plan allows scaling:

1. Go to Service Settings
2. Adjust CPU/Memory allocation
3. Railway auto-scales based on load

## Cost Estimation

**Railway Free Tier:**
- $5/month credit
- 512 MB RAM, 1 vCPU
- 1 GB disk
- Enough for testing/staging

**Railway Pro (Recommended for Production):**
- ~$20-50/month depending on usage
- Auto-scaling
- Better performance

**Add-ons:**
- PostgreSQL: ~$5-10/month (or use Supabase)
- Redis: ~$5/month

**Total Estimated Cost:** $20-50/month for production MCP server

## Troubleshooting

### Build Fails

**Check Dockerfile path:**
```bash
# Ensure railway.json has correct path
cat railway.json | grep dockerfilePath
# Should be: "infra/docker/mcp-server.Dockerfile"
```

**Check build logs:**
```bash
railway logs --deployment <deployment-id>
```

### Health Check Fails

**Verify environment variables:**
```bash
railway variables | grep -E "DATABASE_URL|OPENAI_API_KEY"
```

**Check database connection:**
```bash
railway run python -c "from app.db.session import engine; print(engine.url)"
```

### App Crashes on Startup

**Common issues:**

1. **Missing environment variable:**
   - Check logs for `KeyError` or validation errors
   - Add missing variable: `railway variables set VAR_NAME="value"`

2. **Database migration not run:**
   - Run: `railway run alembic upgrade head`

3. **Port binding issue:**
   - Railway sets `$PORT` automatically
   - Ensure Dockerfile uses `0.0.0.0:$PORT`

4. **Import errors:**
   - Verify all dependencies in `requirements.txt`
   - Rebuild: `railway up --detach`

### Rate Limiting Not Working

**Ensure Redis is configured:**
```bash
railway variables | grep REDIS_URL
```

**If missing, add Redis:**
```bash
railway add redis
```

## Security Best Practices

1. **Rotate Secrets Regularly**
   ```bash
   # Generate new JWT secret
   railway variables set JWT_SECRET_KEY="$(openssl rand -base64 32)"
   ```

2. **Enable HTTPS Only**
   - Railway provides HTTPS by default
   - Never expose HTTP endpoints

3. **Restrict CORS**
   - Only allow production domains
   - No wildcards in production

4. **Monitor Costs**
   - Set up Railway billing alerts
   - Review usage weekly

5. **Backup Database**
   - If using Railway PostgreSQL, enable automated backups
   - If using Supabase, backups are automatic

## CI/CD Integration

Railway supports automatic deployments from GitHub:

1. **Connect GitHub Repository**
   - Railway → Project → Settings → Connect GitHub

2. **Auto-Deploy on Push**
   - Push to `main` branch auto-deploys to production
   - Push to `staging` branch auto-deploys to staging environment

3. **Preview Deployments (Pro plan)**
   - Every PR gets a preview deployment
   - Test changes before merging

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app
- **Pricing**: https://railway.app/pricing

---

**Last Updated**: 2025-01-04
**Version**: 1.0.0
