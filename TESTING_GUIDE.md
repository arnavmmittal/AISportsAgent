# Testing Guide - Multi-User Testing Setup

**Last Updated**: 2025-12-12

This guide explains how to test the AI Sports Agent with multiple friends without passing your laptop around.

---

## Quick Comparison: Local vs Cloud Testing

| Feature | Local Testing | Cloud Testing (Railway) |
|---------|---------------|-------------------------|
| **Cost** | FREE | $5-10/month |
| **Setup Time** | 5 minutes | 30 minutes |
| **Your Laptop** | Must stay on | Can be off |
| **Network Required** | Same WiFi | Any internet |
| **Best For** | 2-3 friends, same location | 5-10+ friends, anywhere |
| **Recommended?** | Quick tests only | **YES - for real testing** |

**My Recommendation**: Use **Cloud Testing (Railway)** for any serious testing. Worth the $5-10.

---

## Option A: Local Testing (Same WiFi Only)

### How It Works
```
Your Laptop (10.0.0.127):
├─ MCP Server on port 8000
├─ Web App on port 3000
└─ ChromaDB (local)

Friend's Phone (same WiFi):
└─ Connects to http://10.0.0.127:3000
```

### Quick Steps

1. **Start backend on your laptop:**
```bash
cd /Users/arnavmittal/Desktop/SportsAgent
pnpm dev:full
```

2. **Find your IP:**
```bash
ipconfig getifaddr en0
# Example: 10.0.0.127
```

3. **Update mobile config:**
```bash
# Edit: apps/mobile/.env.local
EXPO_PUBLIC_API_URL=http://10.0.0.127:3000
EXPO_PUBLIC_VOICE_URL=ws://10.0.0.127:8000
```

4. **Start mobile app:**
```bash
cd apps/mobile
npm run start
```

5. **Friends test:**
   - Install Expo Go (iOS/Android)
   - Scan your QR code
   - Must be on **same WiFi** as you
   - Login: demo@athlete.com / demo123

**Limitations:**
- ❌ Your laptop must stay on
- ❌ Everyone needs same WiFi
- ❌ Can't test remotely

---

## Option B: Cloud Testing with Railway (Recommended!)

### Why Railway?
- ✅ Your laptop can be off
- ✅ Friends test from anywhere
- ✅ More realistic environment
- ✅ Only $5-10/month

### Setup (30 minutes)

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

#### 2. Deploy Backend
```bash
cd /Users/arnavmittal/Desktop/SportsAgent/ai-sports-mcp/server
railway init
# Choose: Project name "ai-sports-mcp"
railway up
```

#### 3. Set Environment Variables

Go to Railway dashboard (https://railway.app) → Your Project → Variables:

Add these:
```
DATABASE_URL = postgresql://postgres:p%3FY83B%3FP%3FuNnP5b@db.ccbcrerrnkqqgxtlqjnm.supabase.co:5432/postgres?sslmode=require

OPENAI_API_KEY = sk-your-key-here

ENVIRONMENT = production

CORS_ORIGINS = *
```

#### 4. Get Your Public URL
```bash
railway domain
# Example output: https://ai-sports-mcp-production-a1b2.up.railway.app
```

**Copy this URL!**

#### 5. Update Mobile App
```bash
# Edit: apps/mobile/.env.local
EXPO_PUBLIC_API_URL=https://ai-sports-mcp-production-a1b2.up.railway.app
EXPO_PUBLIC_VOICE_URL=wss://ai-sports-mcp-production-a1b2.up.railway.app
```

Note: Use `https://` and `wss://` for Railway

#### 6. Test
```bash
cd apps/mobile
npm run start
# Scan QR code on your phone
# Login and send a message
# Should work! 🎉
```

#### 7. Share with Friends

Send them:
1. Screenshot of Expo QR code
2. Login: demo@athlete.com / demo123
3. They can test from **anywhere**!

### Railway Costs
- **Free tier**: $5 credit/month (~10-20 hours)
- **Starter plan**: $5/month (500 hours, no sleep)

Upgrade at: Railway dashboard → Settings → Plans

### Update Your Code
```bash
# When you make changes:
cd ai-sports-mcp/server
railway up  # Redeploy
```

### View Logs
```bash
railway logs --tail 50
```

---

## Testing Checklist

### Before Testing
- [ ] Set OpenAI limit: https://platform.openai.com/account/limits ($50-100/month)
- [ ] Choose method (Local or Railway)
- [ ] Test yourself first
- [ ] Prepare feedback form

### During Testing (Weekly)
- [ ] Check OpenAI usage
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Track engagement

### Metrics to Track
- Sessions per user per week
- Average session length
- Voice vs text usage
- Most used features
- Bug frequency

---

## Troubleshooting

### "Network request failed"

**Local:**
- Check IP: `ipconfig getifaddr en0`
- Update `.env.local` if changed
- Restart Expo

**Railway:**
- Check status: `railway status`
- View logs: `railway logs`
- Test URL: `https://your-app.railway.app/health`

### "Cannot connect to voice"

- Railway: Use `wss://` (not `ws://`)
- Local: Use `ws://` (not `wss://`)
- Check MCP server is running

### Changes not showing

**Local:** Reload app (shake device)

**Railway:** Redeploy → `railway up`

---

## Recommended Testing Flow

### Week 1: You + 2 Friends ($10-30)
- Deploy to Railway
- Share QR code
- 50-100 test conversations
- Fix major bugs

### Week 2-3: 5-10 Real Athletes ($70-150)
- Recruit from your team
- Weekly check-ins
- 300-500 conversations
- Validate product-market fit

### Week 4+: Scale or Iterate
- If engagement high (60%+ weekly active): Scale to 50-100 users
- If mixed: Iterate on feedback
- If low: Pivot or redesign

---

## Next Steps

1. **Choose your method:**
   - Quick test (2-3 friends, same WiFi) → Local
   - Real validation (5-10 athletes) → Railway ✅

2. **Follow setup steps above**

3. **Test yourself first**

4. **Invite friends**

5. **Collect feedback**

6. **Iterate!**

**Questions?** Check PRODUCTION_ROADMAP.md or create GitHub Issue

---

**Good luck testing! 🚀**
