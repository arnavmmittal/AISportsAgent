# MCP Agent System Integration Guide

## Current Status

### ✅ What's Working
- **Next.js Backend**: Basic GPT wrapper with sports psychology system prompt
- **Mobile App**: Beautiful UI, authentication, API connectivity
- **Database**: Prisma + PostgreSQL for users, sessions, messages, mood logs, goals

### ❌ What's Missing (The Good Stuff!)
The **full MCP agent system** with RAG, knowledge base, and sophisticated AI coaching exists in `ai-sports-mcp/` but isn't connected to the Next.js app yet.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (React Native)                │
│                    Web App (Next.js Frontend)                │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/SSE
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes (apps/web)                   │
│  - Authentication (JWT + NextAuth)                           │
│  - User Management (mood logs, goals)                        │
│  - Chat Proxy → Forwards to MCP Server                       │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP (port 8000)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          Python FastAPI MCP Server (ai-sports-mcp)           │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AthleteAgent (Discovery-First Protocol)             │   │
│  │  • 5-step conversation flow                          │   │
│  │  • RAG with knowledge base                           │   │
│  │  • Sport-specific coaching                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  KnowledgeAgent (RAG System)                         │   │
│  │  • ChromaDB vector store                             │   │
│  │  • OpenAI embeddings                                 │   │
│  │  • PDF ingestion & chunking                          │   │
│  │  • Metadata filtering (sport, framework, phase)      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GovernanceAgent (Crisis Detection)                  │   │
│  │  • Advanced NLP crisis detection                     │   │
│  │  • Multi-level risk assessment                       │   │
│  │  • Automatic escalation & alerting                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  CoachAgent (Analytics & Insights)                   │   │
│  │  • Team-level trends                                 │   │
│  │  • Anonymized reporting                              │   │
│  │  • Pattern detection                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────┬───────────────────┬───────────────────┘
                      │                   │
                      ▼                   ▼
              ┌───────────────┐   ┌─────────────────┐
              │   ChromaDB    │   │   PostgreSQL    │
              │ (Vector Store)│   │  (Chat History) │
              └───────────────┘   └─────────────────┘
```

## What Makes the MCP System Different?

### Current Next.js Chat (Simple)
```typescript
// Just calls OpenAI with a system prompt
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: SPORTS_PSYCH_PROMPT },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ]
});
```

### MCP AthleteAgent (Sophisticated)
```python
# 1. Get athlete context (sport, year, position)
athlete_context = self._get_athlete_context(athlete_id)

# 2. Retrieve relevant knowledge from vector DB
knowledge_context = self.knowledge_agent.get_context_for_athlete(
    query=user_message,
    athlete_sport=athlete_context['sport'],  # e.g., "basketball"
    max_chunks=3  # Top 3 most relevant PDF chunks
)
# Returns: Evidence-based CBT, mindfulness, flow state techniques

# 3. Check for crisis indicators
crisis_check = governance_agent.analyze_message(
    message=user_message,
    athlete_id=athlete_id
)
# Multi-level analysis: keyword matching, sentiment, context

# 4. Build context-aware system prompt
system_prompt = build_system_message(
    athlete_context,      # "You're talking to Sarah, a junior basketball point guard"
    knowledge_context,    # "Here's research on pre-game anxiety in basketball..."
    protocol_phase="explore"  # Current phase in 5-step protocol
)

# 5. Stream response with Discovery-First protocol
async for chunk in openai_stream(...):
    yield chunk  # Real-time streaming
```

## Step-by-Step Integration

### 1. Set Up Python Environment

```bash
cd ai-sports-mcp/server

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Set Up ChromaDB (Vector Database)

```bash
# ChromaDB can run:
# Option A: Embedded (easiest for dev)
# - No setup needed, stores locally in ./chroma_data

# Option B: Docker (recommended for production)
docker run -d -p 8001:8000 chromadb/chroma
```

### 3. Configure Environment Variables

Create `ai-sports-mcp/server/.env`:

```bash
# App Settings
APP_NAME="AI Sports Agent MCP Server"
APP_VERSION="1.0.0"
ENVIRONMENT="development"
DEBUG=true

# Database (same as Next.js)
DATABASE_URL="postgresql://user:password@localhost:5432/sports_agent"

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000

# ChromaDB
CHROMA_HOST=""  # Leave empty for embedded mode
CHROMA_PORT=8001
CHROMA_PERSIST_DIRECTORY="./chroma_data"
CHROMA_COLLECTION_NAME="sports_psych_kb"

# Knowledge Base
KB_CHUNK_SIZE=1000
KB_CHUNK_OVERLAP=200

# CORS (allow Next.js to call this server)
CORS_ORIGINS="http://localhost:3000,http://10.0.0.127:3000"

# Redis (optional - for async tasks)
REDIS_URL="redis://localhost:6379"
```

### 4. Ingest Knowledge Base PDFs

```bash
# Put your sports psychology PDF research in:
ai-sports-mcp/server/knowledge_base/pdfs/

# Examples:
# - CBT_for_Athletes.pdf
# - Flow_State_Research.pdf
# - Pre-Competition_Anxiety_Management.pdf
# - Mindfulness_in_Sports.pdf

# Run ingestion script
python scripts/ingest_knowledge_base.py
```

This will:
- Process each PDF into chunks
- Auto-tag with metadata (sport, framework, protocol phase)
- Generate embeddings
- Store in ChromaDB

### 5. Start the MCP Server

```bash
cd ai-sports-mcp/server
source venv/bin/activate

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server will be available at:
- `http://localhost:8000` (local)
- `http://localhost:8000/docs` (interactive API docs)
- `http://localhost:8000/health` (health check)

### 6. Update Next.js Chat Endpoint

Replace `apps/web/src/app/api/chat/stream/route.ts` to proxy to MCP:

```typescript
import { NextRequest } from 'next/server';
import { verifyAuthFromRequest } from '@/lib/auth-helpers';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    // Verify authentication
    const user = await verifyAuthFromRequest(req);
    if (!user) {
      return new Response(
        encoder.encode('data: ' + JSON.stringify({ type: 'error', data: 'Unauthorized' }) + '\n\n'),
        { status: 401, headers: { 'Content-Type': 'text/event-stream' } }
      );
    }

    const body = await req.json();
    const { session_id, message, athlete_id } = body;

    // Verify permissions
    if (user.id !== athlete_id && user.role !== 'ADMIN') {
      return new Response(
        encoder.encode('data: ' + JSON.stringify({ type: 'error', data: 'Forbidden' }) + '\n\n'),
        { status: 403, headers: { 'Content-Type': 'text/event-stream' } }
      );
    }

    // Forward to MCP server
    const mcpResponse = await fetch(`${MCP_SERVER_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id,
        message,
        athlete_id,
        stream: true
      })
    });

    if (!mcpResponse.ok) {
      throw new Error(`MCP server error: ${mcpResponse.statusText}`);
    }

    // Stream response from MCP server
    return new Response(mcpResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat proxy error:', error);
    return new Response(
      encoder.encode('data: ' + JSON.stringify({ type: 'error', data: 'Internal server error' }) + '\n\n'),
      { headers: { 'Content-Type': 'text/event-stream' } }
    );
  }
}
```

### 7. Add MCP Server URL to Next.js `.env.local`

```bash
# apps/web/.env.local
MCP_SERVER_URL="http://localhost:8000"
```

## Testing the Integration

### 1. Start Both Servers

Terminal 1 (MCP Server):
```bash
cd ai-sports-mcp/server
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2 (Next.js):
```bash
cd apps/web
npm run dev -- -H 0.0.0.0
```

### 2. Test Chat with Knowledge Base

Mobile app should now:
1. ✅ Use Discovery-First protocol (asks open-ended questions)
2. ✅ Retrieve relevant research from knowledge base
3. ✅ Provide evidence-based techniques (CBT, mindfulness, flow state)
4. ✅ Detect crisis language with advanced NLP
5. ✅ Adapt responses based on athlete's sport, year, position

### 3. Verify Knowledge Base is Working

Look for logs like:
```
INFO: Retrieved 3 knowledge chunks for query "I'm anxious before games"
DEBUG: Top match: "CBT_for_Athletes.pdf" - Pre-competition anxiety management (relevance: 0.92)
```

## Key Features You Get

### Discovery-First Protocol
```
Phase 1 (Explore): "What's been on your mind lately with basketball?"
Phase 2 (Clarify): "Can you tell me more about when that anxiety happens?"
Phase 3 (Collaborate): "What have you tried before that helped?"
Phase 4 (Experiment): "Let's try a pre-game breathing technique..."
Phase 5 (Iterate): "How did that technique work for you?"
```

### Sport-Specific Context
```
System knows: "You're talking to Sarah, a junior basketball point guard"
Knowledge base retrieves: Basketball-specific anxiety research
Techniques suggested: Relevant to point guards (decision-making under pressure)
```

### Evidence-Based Techniques
Every suggestion includes:
- **Why it works**: "This is based on CBT research showing..."
- **How to do it**: Step-by-step instructions
- **When to use**: Pre-game, during performance slumps, etc.

### Crisis Detection
Multi-level analysis:
- **Keyword matching**: "suicide", "self-harm", "want to die"
- **Sentiment analysis**: Detecting hopelessness, despair
- **Context awareness**: Distinguishes "I'm dying" (metaphor) from actual crisis
- **Automatic escalation**: Creates alerts for coaches, provides resources

## Monitoring & Debugging

### Check MCP Server Health
```bash
curl http://localhost:8000/health
```

### View API Docs
```
http://localhost:8000/docs
```

### Check ChromaDB Collections
```python
python scripts/query_knowledge_base.py "pre-game anxiety"
```

### View Logs
MCP server logs all:
- Agent interactions
- Knowledge base retrievals
- Crisis detections
- Errors

## Next Steps

1. **Populate Knowledge Base**: Add sports psychology research PDFs
2. **Fine-Tune Prompts**: Adjust system prompts based on athlete feedback
3. **Add Voice**: Integrate text-to-speech for responses
4. **Coach Dashboard**: Connect CoachAgent for team analytics
5. **Production Deploy**: Set up Redis, ChromaDB in production

## Troubleshooting

**Q: Chat isn't using knowledge base**
- Check `ai-sports-mcp/server/chroma_data/` exists
- Run ingestion script: `python scripts/ingest_knowledge_base.py`
- Check logs for "Retrieved X knowledge chunks"

**Q: MCP server connection refused**
- Verify server is running: `curl http://localhost:8000/health`
- Check `MCP_SERVER_URL` in Next.js `.env.local`
- Check CORS settings in MCP server config

**Q: Responses are still generic**
- Knowledge base might be empty - add PDFs and run ingestion
- Check athlete context is being retrieved (logs should show sport, year)
- Verify OpenAI API key is set in MCP server `.env`

## Questions?

The full MCP system is production-ready and waiting to be connected. Once integrated, you'll have a truly sophisticated AI sports psychology coach, not just a GPT wrapper!
