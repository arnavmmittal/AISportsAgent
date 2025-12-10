# Unified Development Setup

## Quick Start (Everything in One Command!)

```bash
# Install dependencies (first time only)
pnpm install

# Run EVERYTHING (MCP server + Next.js backend)
pnpm dev:full

# In another terminal, start mobile app
pnpm dev:mobile
```

## What `pnpm dev:full` Does

Starts **both** servers concurrently:

1. **MCP Server** (Python FastAPI on port 8000)
   - AthleteAgent with RAG + Discovery-First protocol
   - KnowledgeAgent with ChromaDB vector store
   - GovernanceAgent with crisis detection
   - CoachAgent with team analytics

2. **Next.js Backend** (on port 3000)
   - Web app UI
   - API routes (auth, mood logs, goals)
   - Chat proxy to MCP server

## First-Time Setup

### 1. Install Root Dependencies

```bash
pnpm install  # Installs concurrently + turbo
```

### 2. Configure MCP Server

```bash
cd ai-sports-mcp/server

# Copy environment template
cp .env.example .env

# Edit .env and add:
# - Your OPENAI_API_KEY
# - DATABASE_URL (same as Next.js)
# - CORS_ORIGINS (should include http://localhost:3000)
```

### 3. Set Up Python Virtual Environment (First Time Only)

The `dev:full` script will auto-create the venv, but you can do it manually:

```bash
cd ai-sports-mcp/server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Ingest Knowledge Base PDFs (Optional but Recommended)

```bash
cd ai-sports-mcp/server

# Put your sports psychology research PDFs in:
mkdir -p knowledge_base/pdfs
# Add PDF files like:
# - CBT_for_Athletes.pdf
# - Flow_State_Research.pdf
# - Pre_Competition_Anxiety.pdf

# Run ingestion
source venv/bin/activate
python scripts/ingest_knowledge_base.py
```

## Available Commands

### Backend Development

```bash
# Run both MCP + Next.js (RECOMMENDED)
pnpm dev:full

# Run only Next.js backend (basic GPT wrapper)
pnpm dev:web

# Run only MCP server (Python)
pnpm dev:mcp
```

### Mobile Development

```bash
# Start Expo dev server
pnpm dev:mobile

# Or directly in mobile directory
cd apps/mobile
pnpm start
```

### Other Commands

```bash
# Build everything
pnpm build

# Run linter
pnpm lint

# Clean all node_modules
pnpm clean
```

## Port Configuration

- **MCP Server**: http://localhost:8000
  - API Docs: http://localhost:8000/docs
  - Health Check: http://localhost:8000/health

- **Next.js**: http://localhost:3000
  - Also accessible at http://10.0.0.127:3000 (for mobile)

- **ChromaDB**: http://localhost:8001 (if using Docker)

- **Expo**: http://localhost:8081

## Verifying Everything is Working

### 1. Check MCP Server

```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","version":"1.0.0","environment":"development"}
```

### 2. Check Next.js

```bash
curl http://localhost:3000/api/auth/mobile/login -X OPTIONS -I
# Should return: HTTP/1.1 204 No Content
```

### 3. Check Knowledge Base

```bash
cd ai-sports-mcp/server
source venv/bin/activate
python scripts/check_kb_stats.py
# Should show: "Knowledge base contains X documents in Y chunks"
```

### 4. Test Mobile App

1. Open Expo Go on your phone
2. Scan QR code from `pnpm dev:mobile`
3. Login with demo credentials:
   - Email: `demo@athlete.com`
   - Password: `demo123`
4. Chat should now use full MCP system with RAG!

## Troubleshooting

### "MCP server won't start"

**Check Python version:**
```bash
python3 --version  # Should be >= 3.11
```

**Check if .env exists:**
```bash
ls ai-sports-mcp/server/.env
# If not found, copy from .env.example and configure
```

**Check OpenAI API key:**
```bash
grep OPENAI_API_KEY ai-sports-mcp/server/.env
# Should have your actual API key
```

### "Next.js can't connect to MCP"

**Check MCP is running:**
```bash
curl http://localhost:8000/health
```

**Check CORS settings in MCP .env:**
```bash
CORS_ORIGINS="http://localhost:3000,http://10.0.0.127:3000"
```

**Check Next.js .env.local has MCP URL:**
```bash
grep MCP_SERVER_URL apps/web/.env.local
# Should be: MCP_SERVER_URL="http://localhost:8000"
```

### "Chat responses are still generic (no RAG)"

Knowledge base might be empty:

```bash
cd ai-sports-mcp/server
source venv/bin/activate

# Check if any documents are loaded
python scripts/check_kb_stats.py

# If empty, ingest PDFs
python scripts/ingest_knowledge_base.py
```

### "Can't connect to mobile app"

**Check IP address is correct:**
```bash
# On Mac
ipconfig getifaddr en0

# Update in apps/mobile/lib/auth.ts if changed
```

**Make sure Next.js is bound to 0.0.0.0:**
```bash
# Should see: "Network: http://0.0.0.0:3000"
pnpm dev:web
```

## Development Workflow

### Typical Day

```bash
# Morning - Start everything
pnpm dev:full

# In another terminal - Start mobile
pnpm dev:mobile

# Work on features...
# - Mobile UI changes: Hot reload automatically
# - Next.js changes: Auto-restart
# - MCP changes: Auto-restart

# Evening - Commit your work
git add .
git commit -m "feat: add new feature"
```

### Working on Agents

When modifying MCP agents:

1. Edit files in `ai-sports-mcp/server/app/agents/`
2. Server auto-reloads (thanks to `--reload` flag)
3. Test in mobile app immediately
4. Check logs in terminal for debugging

### Working on Knowledge Base

Add new research:

```bash
# 1. Add PDF to knowledge base
cp ~/Downloads/New_Research.pdf ai-sports-mcp/server/knowledge_base/pdfs/

# 2. Ingest
cd ai-sports-mcp/server
source venv/bin/activate
python scripts/ingest_knowledge_base.py

# 3. Test retrieval
python scripts/query_knowledge_base.py "your test query"
```

### Working on Mobile UI

1. Changes in `apps/mobile/` hot reload instantly
2. No need to restart anything
3. Shake device → "Reload" if needed

## Next Steps

Once you have everything running:

1. ✅ Test chat with RAG - should reference research papers
2. ✅ Verify Discovery-First protocol - should ask open-ended questions
3. ✅ Test crisis detection - try keywords like "feeling hopeless"
4. 📚 Add more PDFs to knowledge base
5. 🎨 Customize system prompts in `athlete_agent.py`
6. 📊 Build coach dashboard using CoachAgent

## Questions?

See `MCP_INTEGRATION_GUIDE.md` for detailed architecture and integration details.
