# MCP Server Deployment Guide

**Architecture Switch: TypeScript Agents → Python MCP Server**

This guide explains how to deploy the Python MCP Server (FastAPI) to Railway for production use.

## Why MCP Server?

**Benefits over embedded TypeScript agents:**
- ✅ Better scalability (independent scaling from web app)
- ✅ Python AI ecosystem (langchain, better ML libraries)
- ✅ Separation of concerns (AI logic separate from web app)
- ✅ Better monitoring and observability
- ✅ Can use Redis/Celery for background jobs
- ✅ Easier to add more agent types without bloating Next.js

**Cost difference:**
- TypeScript: $0/month extra (runs on Vercel with Next.js)
- MCP Server: ~$20-50/month for Railway hosting + $10/month for Redis
- **Total extra cost: ~$30-60/month**
- **OpenAI costs are identical** (both use same API)

## Architecture Overview

```
┌─────────────────┐
│  Web Client     │
│  (Next.js)      │
└────────┬────────┘
         │ HTTPS + JWT
         ↓
┌─────────────────────────┐
│  Next.js API Gateway    │ ← Vercel
│  /api/chat/stream-mcp   │
└────────┬────────────────┘
         │ Internal API + Service Token
         ↓
┌─────────────────────────┐
│  MCP Server (FastAPI)   │ ← Railway
│  Python Agent Runtime   │
│  - AthleteAgent         │
│  - GovernanceAgent      │
│  - KnowledgeAgent       │
│  - CoachAgent           │
└────────┬────────────────┘
         │ OpenAI API
         ↓
┌─────────────────────────┐
│  OpenAI GPT-4 API       │
└─────────────────────────┘
```

## Prerequisites

1. **Railway Account**: Sign up at https://railway.app
2. **GitHub Repository**: Your code must be in GitHub
3. **OpenAI API Key**: From https://platform.openai.com/api-keys
4. **Supabase Database**: Same database used by Next.js app

## Deployment Steps

### Step 1: Prepare MCP Server Environment

Create `.env` file in `ai-sports-mcp/server/`:

```bash
# Copy from example
cp ai-sports-mcp/server/.env.example ai-sports-mcp/server/.env

# Edit with your values
nano ai-sports-mcp/server/.env
```

**Required variables:**
```bash
# Environment
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
PORT=8000

# Database (same as Next.js)
DATABASE_URL="postgresql://user:password@host:5432/database"

# OpenAI (same key as Next.js or separate)
OPENAI_API_KEY="sk-proj-..."
OPENAI_MODEL="gpt-4-turbo-preview"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"

# Security
JWT_SECRET_KEY="<generate with: openssl rand -base64 32>"
SERVICE_TOKEN="<generate with: openssl rand -base64 32>"

# Redis (Railway will provide)
REDIS_URL="redis://localhost:6379"

# ChromaDB (for vector storage)
CHROMA_HOST=""  # Leave empty for local, or use Chroma Cloud
CHROMA_API_KEY=""

# Cost Controls
ENABLE_COST_LIMITS=true
COST_LIMIT_DAILY_PER_TENANT=500
COST_LIMIT_MONTHLY_TOTAL=10000

# Monitoring
SENTRY_DSN=""  # Optional
LOG_LEVEL=INFO
```

### Step 2: Deploy to Railway

#### Option A: Using Railway CLI (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Navigate to MCP server directory
cd ai-sports-mcp/server

# Initialize Railway project
railway init

# Link to your Railway project
railway link

# Add environment variables
railway variables set ENVIRONMENT=production
railway variables set OPENAI_API_KEY="sk-proj-..."
railway variables set DATABASE_URL="postgresql://..."
railway variables set SERVICE_TOKEN="<your-token>"
# ... add all required variables

# Deploy
railway up
```

#### Option B: Using Railway Dashboard (Web UI)

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Create New Project**: Click "New Project"
3. **Select Source**: Choose "Deploy from GitHub repo"
4. **Select Repository**: Choose your AISportsAgent repository
5. **Configure Root Directory**:
   - Set root directory to: `ai-sports-mcp/server`
6. **Add Environment Variables**:
   - Click "Variables" tab
   - Add all variables from Step 1
7. **Deploy**: Railway will automatically detect the Dockerfile and deploy

### Step 3: Add Redis (Required for rate limiting)

In Railway dashboard:

1. Click "+ New" → "Database" → "Add Redis"
2. Railway will automatically set `REDIS_URL` environment variable
3. No additional configuration needed

### Step 4: Configure Next.js to Use MCP Server

Update `apps/web/.env.local`:

```bash
# MCP Server URL (from Railway deployment)
MCP_SERVER_URL="https://your-mcp-server.up.railway.app"

# Service token (must match MCP server)
MCP_SERVICE_TOKEN="<same-token-as-step-1>"

# Enable MCP mode
USE_MCP_SERVER="true"
```

### Step 5: Update Chat Endpoint

**Option A: Switch existing endpoint** (Breaking change)

Rename the route file:
```bash
cd apps/web/src/app/api/chat

# Backup TypeScript version
mv stream/route.ts stream-typescript/route.ts

# Use MCP version
mv stream-mcp/route.ts stream/route.ts
```

**Option B: Use both endpoints** (Gradual migration)

Keep both routes:
- `/api/chat/stream` - TypeScript agents (existing)
- `/api/chat/stream-mcp` - MCP server (new)

Update chat UI to use MCP endpoint:
```typescript
// apps/web/src/app/chat/page.tsx
const response = await fetch('/api/chat/stream-mcp', { /* ... */ });
```

### Step 6: Verify Deployment

Test health check:
```bash
curl https://your-mcp-server.up.railway.app/health

# Expected response:
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production"
}
```

Test chat endpoint:
```bash
curl -X POST https://your-mcp-server.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session",
    "message": "How do I handle pre-game anxiety?",
    "athlete_id": "test-athlete"
  }'
```

## Monitoring

### Railway Built-in Monitoring

Railway provides:
- CPU/Memory usage graphs
- Request logs
- Deployment history
- Automatic HTTPS certificates

Access at: https://railway.app/project/<your-project>/deployments

### Add Sentry (Optional)

1. Create Sentry project: https://sentry.io
2. Get DSN
3. Add to Railway variables:
   ```bash
   railway variables set SENTRY_DSN="https://..."
   ```

## Scaling

Railway auto-scales based on traffic. To adjust:

1. Go to Railway dashboard → Settings
2. Configure:
   - **Instances**: Number of replicas (1-10)
   - **Memory**: 512MB - 8GB
   - **CPU**: 0.5 - 4 vCPUs

**Recommended for production:**
- Instances: 2 (for redundancy)
- Memory: 1GB
- CPU: 1 vCPU

**Estimated costs:**
- 1 instance, 512MB: ~$5/month
- 2 instances, 1GB each: ~$20/month
- 4 instances, 2GB each: ~$80/month

## Cost Optimization

1. **Use connection pooling**: Set `DATABASE_POOL_SIZE=10`
2. **Enable caching**: Redis for frequently accessed data
3. **Optimize embeddings**: Use `text-embedding-3-small` (cheaper)
4. **Set token limits**: Prevent runaway costs
5. **Monitor usage**: Check Railway metrics daily

## Rollback Plan

If MCP deployment fails:

1. Switch back to TypeScript agents:
   ```bash
   # In apps/web/.env.local
   USE_MCP_SERVER="false"
   ```

2. Or restore old route:
   ```bash
   mv stream-typescript/route.ts stream/route.ts
   ```

3. Redeploy Vercel (automatic on push)

## Troubleshooting

### MCP Server Won't Start

**Check logs:**
```bash
railway logs
```

**Common issues:**
- Missing environment variables
- Database connection failed
- Invalid OpenAI API key
- Port already in use (change PORT to 8000)

### Next.js Can't Connect to MCP

**Check:**
1. MCP_SERVER_URL is correct
2. Service token matches on both sides
3. MCP server health check passes
4. CORS is configured (should be automatic)

### Slow Response Times

**Optimize:**
1. Add more Railway instances
2. Enable Redis caching
3. Use connection pooling
4. Check OpenAI API latency (not MCP issue)

## Security Checklist

- [ ] `SERVICE_TOKEN` is strong (32+ characters)
- [ ] `JWT_SECRET_KEY` is unique and secure
- [ ] `DEBUG=false` in production
- [ ] CORS origins list is restrictive (not `*`)
- [ ] Database uses SSL connection
- [ ] Cost limits are enabled
- [ ] Rate limiting is active
- [ ] Sentry error tracking configured
- [ ] Regular security updates (Railway auto-patches)

## Next Steps

After successful deployment:

1. **Monitor for 24 hours**: Check Railway logs and metrics
2. **Load test**: Use k6 script from LOAD_TESTING.md
3. **Cost tracking**: Monitor Railway + OpenAI bills
4. **Document**: Update team wiki with deployment info
5. **Backup**: Export Railway env vars to secure vault

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **MCP Server Issues**: Check `ai-sports-mcp/server/` code
- **Next.js Integration**: Check `apps/web/src/lib/mcp-client.ts`
