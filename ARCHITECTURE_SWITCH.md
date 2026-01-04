# Architecture Switch: TypeScript → Python MCP Server

**Status:** Ready for deployment ✅
**Date:** 2026-01-04
**Decision:** Use Python MCP Server for production AI agent orchestration

---

## Summary

Switched from embedded TypeScript agents to Python MCP Server (FastAPI) for better scalability and production readiness.

## What Changed

### Before (TypeScript Agents)
```
Next.js App
  ├── src/agents/
  │   ├── AthleteAgent.ts
  │   ├── GovernanceAgent.ts
  │   ├── KnowledgeAgent.ts
  │   └── core/AgentOrchestrator.ts
  └── /api/chat/stream ──→ Uses TypeScript agents directly
```

**Pros:**
- ✅ Simple deployment (one Vercel app)
- ✅ Fast iteration

**Cons:**
- ❌ Couples AI logic to web app
- ❌ Harder to scale independently
- ❌ Miss Python AI ecosystem
- ❌ No background job support

### After (MCP Server)
```
Next.js App
  └── /api/chat/stream-mcp ──→ Proxies to MCP Server
                                      ↓
                            Python MCP Server (Railway)
                              ├── AthleteAgent
                              ├── GovernanceAgent
                              ├── KnowledgeAgent
                              └── CoachAgent
```

**Pros:**
- ✅ Independent scaling (scale AI separate from web)
- ✅ Python AI ecosystem (langchain, better ML libraries)
- ✅ Better separation of concerns
- ✅ Redis/Celery for background jobs
- ✅ Better monitoring

**Cons:**
- ❌ More complex deployment (~$30-60/month extra)
- ❌ Two services to manage

## Files Created

### New Files

1. **`apps/web/src/lib/mcp-client.ts`**
   - Client library for communicating with MCP server
   - Functions: `checkMCPHealth()`, `streamChatMessage()`, `parseSSEStream()`

2. **`apps/web/src/app/api/chat/stream-mcp/route.ts`**
   - New API endpoint that proxies to MCP server
   - Handles authentication, cost control, audit logging
   - Parses SSE stream from MCP and forwards to client

3. **`MCP_DEPLOYMENT_GUIDE.md`**
   - Complete Railway deployment guide
   - Environment setup, monitoring, troubleshooting
   - Security checklist and cost optimization tips

4. **`ARCHITECTURE_SWITCH.md`** (this file)
   - Decision record and migration guide

5. **`ai-sports-mcp/server/railway.json`**
   - Railway deployment configuration
   - Specifies Dockerfile, health checks, replicas

### Modified Files

1. **`apps/web/.env.example`**
   - Added MCP server configuration section:
     - `MCP_SERVER_URL`
     - `MCP_SERVICE_TOKEN`
     - `USE_MCP_SERVER`

## Cost Analysis

| Component | TypeScript | MCP Server | Difference |
|-----------|-----------|------------|------------|
| **Next.js hosting** | Vercel ($0-20/mo) | Vercel ($0-20/mo) | $0 |
| **AI backend** | Included | Railway ($20-50/mo) | +$20-50 |
| **Redis** | Not available | Railway Redis ($5-10/mo) | +$5-10 |
| **OpenAI API** | ~$50-200/mo | ~$50-200/mo | $0 |
| **Total** | $50-220/mo | $75-280/mo | **+$25-60/mo** |

**Recommendation:** Extra cost is justified for production scalability and better AI infrastructure.

## Migration Steps

### Option 1: Full Switch (Recommended for new deploys)

```bash
# 1. Deploy MCP server to Railway
cd ai-sports-mcp/server
railway init
railway up

# 2. Update Next.js environment
# In apps/web/.env.local:
MCP_SERVER_URL="https://your-mcp-server.up.railway.app"
USE_MCP_SERVER="true"

# 3. Replace chat endpoint
mv apps/web/src/app/api/chat/stream/route.ts apps/web/src/app/api/chat/stream-typescript/route.ts
mv apps/web/src/app/api/chat/stream-mcp/route.ts apps/web/src/app/api/chat/stream/route.ts

# 4. Deploy Next.js
git push origin main
```

### Option 2: Gradual Migration (Recommended for existing production)

```bash
# 1. Deploy MCP server to Railway
cd ai-sports-mcp/server
railway init
railway up

# 2. Update Next.js environment
# In apps/web/.env.local:
MCP_SERVER_URL="https://your-mcp-server.up.railway.app"
USE_MCP_SERVER="false"  # Keep TypeScript for now

# 3. Test MCP endpoint in parallel
# Frontend uses: /api/chat/stream (TypeScript)
# Test separately: /api/chat/stream-mcp (MCP)

# 4. Monitor both for 7 days

# 5. Switch when confident
USE_MCP_SERVER="true"

# 6. Update frontend to use /api/chat/stream-mcp
```

## Environment Variables

### MCP Server (Railway)

```bash
# Required
ENVIRONMENT=production
DEBUG=false
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-proj-..."
JWT_SECRET_KEY="<generate>"
SERVICE_TOKEN="<generate>"

# Optional but recommended
REDIS_URL="redis://..."  # Auto-set by Railway
ENABLE_COST_LIMITS=true
COST_LIMIT_DAILY_PER_TENANT=500
SENTRY_DSN="https://..."
```

### Next.js (Vercel)

```bash
# New variables
MCP_SERVER_URL="https://your-mcp-server.up.railway.app"
MCP_SERVICE_TOKEN="<same-as-mcp-server>"
USE_MCP_SERVER="true"

# Existing variables (unchanged)
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-proj-..."
NEXTAUTH_SECRET="..."
# ... (all other variables same as before)
```

## Testing Checklist

Before switching to production:

- [ ] MCP server health check passes: `curl https://mcp-url/health`
- [ ] Chat endpoint works: Test `/api/chat/stream-mcp`
- [ ] Crisis detection triggers correctly
- [ ] Audit logs are saved to database
- [ ] Cost controls prevent runaway spend
- [ ] Streaming works in browser (SSE)
- [ ] Voice service integration works
- [ ] Load test with k6 (50 concurrent users)
- [ ] Monitor Railway metrics for 24 hours
- [ ] OpenAI costs are within budget

## Rollback Plan

If issues occur after deployment:

### Immediate Rollback (< 5 minutes)

```bash
# In Vercel dashboard or .env
USE_MCP_SERVER="false"

# Or restore TypeScript route:
git checkout staging -- apps/web/src/app/api/chat/stream/route.ts
git push origin main
```

### Investigate and Fix

1. Check Railway logs: `railway logs`
2. Check MCP health: `curl https://mcp-url/health`
3. Verify environment variables match
4. Test locally: `cd ai-sports-mcp/server && python -m app.main`

## Monitoring

### Railway Dashboard

- **URL:** https://railway.app/project/<your-project>
- **Metrics:** CPU, memory, network, request count
- **Logs:** Real-time streaming logs
- **Alerts:** Configure email/Slack notifications

### Sentry (Optional)

- **MCP Server:** Configure `SENTRY_DSN` in Railway
- **Next.js:** Configure `NEXT_PUBLIC_SENTRY_DSN` in Vercel
- **Alerts:** Set up alerts for error rate > 1%

## Performance Benchmarks

Target metrics (from LOAD_TESTING.md):

| Metric | TypeScript | MCP Server | Target |
|--------|-----------|------------|--------|
| p50 latency | ~300ms | ~400ms | <500ms |
| p95 latency | ~800ms | ~1000ms | <2000ms |
| p99 latency | ~1500ms | ~2000ms | <5000ms |
| Error rate | <0.1% | <0.1% | <1% |
| Concurrent users | 50 | 100+ | 100+ |

**Note:** MCP has slightly higher latency due to network hop, but better scalability.

## Next Steps

1. **Deploy MCP server to Railway** (see MCP_DEPLOYMENT_GUIDE.md)
2. **Test with pilot university** (1-2 weeks)
3. **Monitor costs and performance** (Railway + OpenAI bills)
4. **Optimize if needed** (connection pooling, caching)
5. **Document learnings** (update this file)
6. **Consider deleting TypeScript agents** (after 30 days of stable MCP)

## Support

- **MCP Server Code:** `ai-sports-mcp/server/`
- **Client Library:** `apps/web/src/lib/mcp-client.ts`
- **Deployment Guide:** `MCP_DEPLOYMENT_GUIDE.md`
- **Railway Docs:** https://docs.railway.app
- **Issues:** Create GitHub issue with `mcp-server` label

---

**Decision made by:** AI Sports Agent Team
**Approved by:** Solo Founder
**Implementation:** Complete ✅
**Status:** Ready for Railway deployment
