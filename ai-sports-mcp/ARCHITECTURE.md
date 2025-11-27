# AI Sports Agent - MCP Architecture Documentation

## Project Overview

Full-stack AI Sports Psychology platform with FastAPI backend (Python) and React frontend (TypeScript), implementing MCP (Model Context Protocol) agent orchestration.

---

## Directory Structure

```
ai-sports-mcp/
├── server/                          # FastAPI Backend
│   ├── app/
│   │   ├── agents/                  # MCP Agents
│   │   │   ├── __init__.py
│   │   │   ├── base_agent.py        # Base MCP agent class
│   │   │   ├── athlete_agent.py     # AthleteAgent (Discovery-First)
│   │   │   ├── coach_agent.py       # CoachAgent (Insights & Summaries)
│   │   │   ├── governance_agent.py  # GovernanceAgent (Crisis Detection)
│   │   │   └── knowledge_agent.py   # KnowledgeAgent (RAG/KB)
│   │   ├── api/                     # API Routes
│   │   │   ├── __init__.py
│   │   │   ├── chat.py              # /chat endpoint
│   │   │   ├── knowledge.py         # /kb/* endpoints
│   │   │   ├── reports.py           # /report/* endpoints
│   │   │   ├── auth.py              # Authentication
│   │   │   └── experiments.py       # Athlete logs/experiments
│   │   ├── core/                    # Core utilities
│   │   │   ├── config.py            # Settings (Pydantic)
│   │   │   ├── logging.py           # Logging setup
│   │   │   └── security.py          # Auth/security helpers
│   │   ├── db/                      # Database
│   │   │   ├── database.py          # SQLAlchemy setup
│   │   │   └── session.py           # DB session management
│   │   ├── models/                  # SQLAlchemy models
│   │   │   ├── user.py              # User, Athlete, Coach
│   │   │   ├── session.py           # ChatSession, Message
│   │   │   ├── knowledge.py         # FrameworkChunk, KnowledgeBase
│   │   │   ├── experiment.py        # Experiment logs
│   │   │   └── school.py            # Multi-tenant schools
│   │   ├── schemas/                 # Pydantic schemas (API)
│   │   │   ├── chat.py
│   │   │   ├── user.py
│   │   │   ├── knowledge.py
│   │   │   └── report.py
│   │   ├── services/                # Business logic
│   │   │   ├── chat_service.py
│   │   │   ├── knowledge_service.py
│   │   │   ├── auth_service.py
│   │   │   └── report_service.py
│   │   ├── tools/                   # Agent tools
│   │   │   ├── discovery_tools.py   # Discovery-First protocol tools
│   │   │   ├── framework_tools.py   # Sport-specific frameworks
│   │   │   ├── crisis_tools.py      # Crisis detection
│   │   │   └── retrieval_tools.py   # Vector search/RAG
│   │   ├── utils/                   # Utilities
│   │   │   ├── embeddings.py        # OpenAI embeddings
│   │   │   ├── pdf_processor.py     # PDF chunking/ingestion
│   │   │   ├── prompts.py           # Agent system prompts
│   │   │   └── tenancy.py           # Multi-tenant helpers
│   │   └── main.py                  # FastAPI app
│   ├── alembic/                     # DB migrations
│   ├── tests/                       # Backend tests
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── client/                          # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Register.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.tsx   # Main chat interface
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   └── ToolBadge.tsx    # Show when tools are triggered
│   │   │   ├── dashboard/
│   │   │   │   ├── CoachDashboard.tsx
│   │   │   │   ├── AthleteSummaryCard.tsx
│   │   │   │   ├── SentimentChart.tsx
│   │   │   │   └── WeeklyReport.tsx
│   │   │   ├── journal/
│   │   │   │   ├── JournalPage.tsx  # Private reflections
│   │   │   │   └── JournalEntry.tsx
│   │   │   ├── layout/
│   │   │   │   ├── NavBar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Footer.tsx
│   │   │   └── shared/
│   │   │       ├── Loading.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── Toast.tsx
│   │   ├── contexts/                # React Context
│   │   │   ├── AuthContext.tsx      # Firebase auth state
│   │   │   ├── ChatContext.tsx      # Chat state
│   │   │   └── TenantContext.tsx    # Multi-tenant context
│   │   ├── hooks/                   # Custom hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useChat.ts
│   │   │   ├── useKnowledgeBase.ts
│   │   │   └── useLocalStorage.ts   # For journal sync
│   │   ├── services/                # API clients
│   │   │   ├── api.ts               # Axios base
│   │   │   ├── chatService.ts
│   │   │   ├── authService.ts
│   │   │   ├── knowledgeService.ts
│   │   │   └── reportService.ts
│   │   ├── types/                   # TypeScript types
│   │   │   ├── user.ts
│   │   │   ├── chat.ts
│   │   │   ├── knowledge.ts
│   │   │   └── agent.ts
│   │   ├── utils/                   # Utilities
│   │   │   ├── firebase.ts          # Firebase config
│   │   │   ├── constants.ts         # App constants
│   │   │   └── formatters.ts
│   │   ├── styles/                  # Global styles
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
│
├── knowledge-base/                  # Knowledge Base Assets
│   ├── pdfs/                        # Source PDFs
│   │   └── AI_Sports_Psych_Project.pdf
│   ├── chunks/                      # Processed chunks (JSON)
│   └── embeddings/                  # Vector embeddings
│
├── docker-compose.yml               # Local dev environment
├── README.md
└── DEPLOYMENT.md
```

---

## MCP Agents Architecture

### 1. **AthleteAgent** (Discovery-First Protocol)

**Purpose**: Engage athletes using evidence-based discovery-first conversation protocol

**Tools**:
- `ask_discovery_question()` - Generate open-ended questions based on protocol phase
- `retrieve_framework()` - Get sport-specific mental frameworks from KB
- `assess_readiness()` - Determine if athlete is ready for intervention
- `apply_framework()` - Apply CBT/mindfulness/flow frameworks

**Workflow**:
```python
1. Discovery Phase (3-7 questions)
   └─> Build context about athlete's situation
2. Understanding Phase
   └─> Summarize and validate understanding
3. Framework Selection
   ��─> Query KnowledgeAgent for relevant frameworks
4. Intervention Phase
   └─> Apply evidence-based techniques
5. Follow-up
   └─> Set action items and reflection prompts
```

**System Prompt Template**:
```
You are an evidence-based sports psychology assistant using the Discovery-First protocol.

PROTOCOL PHASES:
1. Discovery (3-7 open questions)
2. Understanding validation
3. Framework application
4. Action planning

RULES:
- Never jump to solutions before discovery
- Use sport-specific language
- Ground all advice in research
- Flag crisis language to GovernanceAgent
```

---

### 2. **CoachAgent**

**Purpose**: Generate insights and summaries for coaches from athlete data

**Tools**:
- `anonymize_data()` - Remove PII from athlete sessions
- `generate_summary()` - Create weekly/monthly summaries
- `detect_patterns()` - Find trends across athletes
- `create_action_items()` - Suggest coach interventions

**Workflow**:
```python
1. Collect athlete session data (past week/month)
2. Anonymize sensitive information
3. Analyze sentiment and topic trends
4. Generate summary report with:
   - Team-wide sentiment
   - Common themes
   - Athletes needing attention
   - Recommended actions
```

---

### 3. **GovernanceAgent**

**Purpose**: Monitor conversations for crisis language and ensure safety

**Tools**:
- `detect_crisis_language()` - ML-based crisis detection
- `escalate_alert()` - Send notifications to crisis team
- `flag_session()` - Mark session for human review
- `log_incident()` - Audit trail for compliance

**Crisis Triggers**:
- Self-harm mentions
- Suicidal ideation
- Severe depression indicators
- Substance abuse
- Abuse/trauma disclosures

**Action**: Immediately pause conversation, provide crisis resources, notify designated staff

---

### 4. **KnowledgeAgent**

**Purpose**: Manage knowledge base ingestion and retrieval (RAG)

**Tools**:
- `ingest_pdf()` - Process and chunk PDF documents
- `generate_embeddings()` - Create vector embeddings
- `query_knowledge()` - Semantic search over KB
- `tag_chunks()` - Metadata tagging (sport, framework, phase)

**KB Structure**:
```json
{
  "chunk_id": "uuid",
  "content": "1-2 paragraph chunk",
  "source": "AI Sports Psych Project.pdf",
  "page": 42,
  "metadata": {
    "sport": ["basketball", "general"],
    "framework": ["CBT", "flow-state"],
    "phase": "performance-anxiety",
    "protocol_step": "intervention",
    "tags": ["pre-game", "visualization"]
  },
  "embedding": [0.123, -0.456, ...]
}
```

---

## Database Schema (PostgreSQL + SQLAlchemy)

```sql
-- Multi-tenant schools
CREATE TABLE schools (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),  -- e.g., "wisc.edu"
    config JSONB,         -- Custom frameworks, branding
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users (athletes, coaches, admins)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    school_id UUID REFERENCES schools(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    firebase_uid VARCHAR(255) UNIQUE,
    role VARCHAR(50) NOT NULL,  -- athlete, coach, admin
    name VARCHAR(255),
    sport VARCHAR(100),
    year VARCHAR(50),  -- Freshman, Sophomore, etc.
    encrypted_data JSONB,  -- PHI with encryption
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    agent_type VARCHAR(50),  -- athlete, coach
    status VARCHAR(50),      -- active, completed, flagged
    protocol_phase VARCHAR(50),  -- discovery, understanding, intervention
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    role VARCHAR(50),        -- user, assistant, system
    content TEXT NOT NULL,
    tool_calls JSONB,        -- Track which tools were used
    metadata JSONB,          -- sentiment, flags, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Experiments (athlete logs/reflections)
CREATE TABLE experiments (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES sessions(id),
    type VARCHAR(50),        -- journal, mood-log, goal
    content JSONB,           -- Flexible structure
    encrypted BOOLEAN DEFAULT FALSE,
    local_only BOOLEAN DEFAULT FALSE,  -- Not synced to server
    created_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge base chunks
CREATE TABLE framework_chunks (
    id UUID PRIMARY KEY,
    school_id UUID REFERENCES schools(id),  -- Tenant-specific
    content TEXT NOT NULL,
    source VARCHAR(255),
    page_number INTEGER,
    chunk_index INTEGER,
    embedding VECTOR(3072),  -- pgvector extension
    metadata JSONB,          -- sport, framework, phase, tags
    created_at TIMESTAMP DEFAULT NOW()
);

-- Governance/audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES sessions(id),
    event_type VARCHAR(100),  -- crisis_detected, escalation, etc.
    severity VARCHAR(50),     -- low, medium, high, critical
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_chunks_school ON framework_chunks(school_id);
CREATE INDEX idx_chunks_embedding ON framework_chunks USING ivfflat (embedding vector_cosine_ops);
```

---

## API Endpoints

### **1. `/v1/chat` - Main chat orchestration**

```python
POST /v1/chat

Request:
{
  "message": "I'm feeling anxious before tomorrow's game",
  "session_id": "uuid",  # optional
  "user_id": "uuid",
  "role": "athlete"  # or coach
}

Response (SSE stream):
{
  "type": "message_start",
  "session_id": "uuid",
  "agent": "AthleteAgent"
}
{
  "type": "tool_call",
  "tool": "retrieve_framework",
  "args": {"sport": "basketball", "topic": "pre-game-anxiety"}
}
{
  "type": "content",
  "delta": "It sounds like you're experiencing..."
}
{
  "type": "message_complete",
  "metadata": {"protocol_phase": "discovery", "question_count": 1}
}
```

**Backend Logic**:
```python
# app/api/chat.py
@router.post("/")
async def chat(request: ChatRequest, db: Session):
    # 1. Determine agent (athlete vs coach)
    if request.role == "athlete":
        agent = app.state.athlete_agent
    elif request.role == "coach":
        agent = app.state.coach_agent

    # 2. Load session context
    session = get_or_create_session(request.session_id, request.user_id)

    # 3. Check governance
    crisis_detected = await app.state.governance_agent.check_crisis(request.message)
    if crisis_detected:
        return handle_crisis_response()

    # 4. Query knowledge base
    context = await app.state.knowledge_agent.query(
        query=request.message,
        metadata_filter={"sport": user.sport}
    )

    # 5. Generate response
    async for chunk in agent.stream_response(
        message=request.message,
        session=session,
        context=context
    ):
        yield chunk
```

---

### **2. `/v1/kb/query` - Knowledge base retrieval**

```python
POST /v1/kb/query

Request:
{
  "query": "CBT techniques for performance anxiety",
  "filters": {
    "sport": "basketball",
    "framework": "CBT",
    "phase": "pre-competition"
  },
  "top_k": 5
}

Response:
{
  "results": [
    {
      "chunk_id": "uuid",
      "content": "Cognitive Behavioral Therapy (CBT) for athletes...",
      "source": "AI Sports Psych Project.pdf",
      "page": 23,
      "relevance_score": 0.89,
      "metadata": {...}
    },
    ...
  ]
}
```

---

### **3. `/v1/report/weekly` - Coach summary reports**

```python
GET /v1/report/weekly?coach_id=uuid&start_date=2024-01-01

Response:
{
  "report_id": "uuid",
  "coach_id": "uuid",
  "period": "2024-01-01 to 2024-01-07",
  "summary": {
    "total_athletes": 15,
    "active_sessions": 42,
    "average_sentiment": 0.65,  # -1 to 1
    "common_topics": ["pre-game anxiety", "confidence", "team dynamics"],
    "athletes_needing_attention": [
      {
        "athlete_id": "uuid",  # anonymized
        "alias": "Athlete A",
        "concern_level": "medium",
        "summary": "Showing signs of burnout, frequent mentions of fatigue"
      }
    ],
    "recommended_actions": [
      "Schedule 1-on-1 check-in with Athlete A",
      "Consider team session on stress management"
    ]
  },
  "generated_at": "2024-01-08T10:00:00Z"
}
```

---

## Frontend Components

### **1. ChatWindow.tsx**

```tsx
// client/src/components/chat/ChatWindow.tsx
import React, { useState, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ToolBadge } from './ToolBadge';

export const ChatWindow: React.FC = () => {
  const { messages, sendMessage, isStreaming, toolCalls } = useChat();

  return (
    <div className="chat-container">
      {/* Messages */}
      <div className="messages">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Tool badges (show when agent uses tools) */}
      {toolCalls.length > 0 && (
        <div className="tool-indicators">
          {toolCalls.map(tool => (
            <ToolBadge key={tool.id} tool={tool} />
          ))}
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        disabled={isStreaming}
      />
    </div>
  );
};

// Hook implementation
// client/src/hooks/useChat.ts
export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolCalls, setToolCalls] = useState([]);

  const sendMessage = async (content: string) => {
    setIsStreaming(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content }]);

    // Stream response
    const response = await fetch('/v1/chat', {
      method: 'POST',
      body: JSON.stringify({ message: content }),
      headers: { 'Content-Type': 'application/json' }
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let assistantMessage = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const data = JSON.parse(chunk);

      if (data.type === 'content') {
        assistantMessage += data.delta;
        setMessages(prev => [...prev.slice(0, -1), {
          role: 'assistant',
          content: assistantMessage
        }]);
      } else if (data.type === 'tool_call') {
        setToolCalls(prev => [...prev, data]);
      }
    }

    setIsStreaming(false);
  };

  return { messages, sendMessage, isStreaming, toolCalls };
};
```

---

### **2. JournalPage.tsx**

```tsx
// client/src/components/journal/JournalPage.tsx
import React, { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export const JournalPage: React.FC = () => {
  const [entries, setEntries] = useLocalStorage('journal_entries', []);
  const [currentEntry, setCurrentEntry] = useState('');

  const saveEntry = () => {
    const newEntry = {
      id: crypto.randomUUID(),
      content: currentEntry,
      timestamp: new Date().toISOString(),
      synced: false  // Mark as local-only initially
    };

    setEntries(prev => [...prev, newEntry]);
    setCurrentEntry('');

    // Optional: sync to server with encryption
    syncToServer(newEntry);
  };

  return (
    <div className="journal-container">
      <h2>Private Reflections</h2>
      <textarea
        value={currentEntry}
        onChange={e => setCurrentEntry(e.target.value)}
        placeholder="Write your thoughts... (stored locally)"
      />
      <button onClick={saveEntry}>Save Entry</button>

      {/* Past entries */}
      <div className="entries">
        {entries.map(entry => (
          <div key={entry.id} className="entry">
            <small>{new Date(entry.timestamp).toLocaleString()}</small>
            <p>{entry.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### **3. CoachDashboard.tsx**

```tsx
// client/src/components/dashboard/CoachDashboard.tsx
import React, { useEffect, useState } from 'react';
import { reportService } from '@/services/reportService';
import { SentimentChart } from './SentimentChart';
import { AthleteSummaryCard } from './AthleteSummaryCard';

export const CoachDashboard: React.FC = () => {
  const [report, setReport] = useState(null);

  useEffect(() => {
    reportService.getWeeklyReport().then(setReport);
  }, []);

  if (!report) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <h1>Team Mental Performance Dashboard</h1>

      {/* Summary stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Active Athletes</h3>
          <p>{report.summary.total_athletes}</p>
        </div>
        <div className="stat-card">
          <h3>Sessions This Week</h3>
          <p>{report.summary.active_sessions}</p>
        </div>
        <div className="stat-card">
          <h3>Avg Sentiment</h3>
          <p>{(report.summary.average_sentiment * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Sentiment trend */}
      <SentimentChart data={report.sentiment_history} />

      {/* Athletes needing attention */}
      <div className="attention-section">
        <h2>Athletes Needing Attention</h2>
        {report.summary.athletes_needing_attention.map(athlete => (
          <AthleteSummaryCard key={athlete.athlete_id} athlete={athlete} />
        ))}
      </div>

      {/* Recommended actions */}
      <div className="actions">
        <h2>Recommended Actions</h2>
        <ul>
          {report.summary.recommended_actions.map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
```

---

## Multi-Tenancy & Privacy

### Tenant Isolation

```python
# app/utils/tenancy.py
def get_tenant_context(request: Request) -> str:
    """
    Extract tenant (school) ID from:
    1. User's school_id
    2. Request subdomain (e.g., uw.sports-agent.com)
    3. Custom header (X-Tenant-ID)
    """
    # Get from authenticated user
    if request.user:
        return request.user.school_id

    # Get from subdomain
    host = request.headers.get("host")
    subdomain = host.split(".")[0]
    return subdomain_to_school_id(subdomain)

# Apply to all queries
def filter_by_tenant(query, tenant_id: str):
    return query.filter(Model.school_id == tenant_id)
```

### Data Encryption

```python
# app/core/security.py
from cryptography.fernet import Fernet

def encrypt_sensitive_data(data: dict, key: bytes) -> str:
    """Encrypt PHI and sensitive fields"""
    f = Fernet(key)
    return f.encrypt(json.dumps(data).encode()).decode()

def decrypt_sensitive_data(encrypted: str, key: bytes) -> dict:
    """Decrypt for authorized access only"""
    f = Fernet(key)
    return json.loads(f.decrypt(encrypted.encode()))

# Apply to journal entries, detailed session logs, etc.
```

---

## Knowledge Base Ingestion Pipeline

```python
# app/services/knowledge_service.py
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.utils.embeddings import generate_embedding

async def ingest_pdf(
    file_path: str,
    school_id: str,
    metadata_tags: dict
):
    """
    Process PDF into knowledge base:
    1. Extract text from PDF
    2. Chunk into 1-2 paragraph pieces
    3. Generate embeddings
    4. Tag with metadata
    5. Store in vector DB
    """
    # 1. Extract text
    import pdfplumber
    with pdfplumber.open(file_path) as pdf:
        text = "\n".join(page.extract_text() for page in pdf.pages)

    # 2. Chunk with overlap
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.KNOWLEDGE_CHUNK_SIZE,
        chunk_overlap=settings.KNOWLEDGE_CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " "]
    )
    chunks = splitter.split_text(text)

    # 3. Process each chunk
    for i, chunk_text in enumerate(chunks):
        # Generate embedding
        embedding = await generate_embedding(chunk_text)

        # Auto-tag with LLM
        tags = await auto_tag_chunk(chunk_text)

        # Store in DB
        chunk = FrameworkChunk(
            school_id=school_id,
            content=chunk_text,
            source=file_path,
            chunk_index=i,
            embedding=embedding,
            metadata={
                **metadata_tags,
                **tags,
                "sport": extract_sports(chunk_text),
                "framework": extract_frameworks(chunk_text),
                "protocol_step": classify_protocol_step(chunk_text)
            }
        )
        db.add(chunk)

    await db.commit()

# Auto-tagging with GPT
async def auto_tag_chunk(text: str) -> dict:
    """Use GPT to extract metadata tags"""
    response = await openai.chat.completions.create(
        model="gpt-4",
        messages=[{
            "role": "system",
            "content": "Extract metadata tags from this sports psych text..."
        }, {
            "role": "user",
            "content": text
        }]
    )
    return json.loads(response.choices[0].message.content)
```

---

## Configuration for Universities

All university-specific config is centralized in `schools` table:

```json
{
  "school_id": "uw_madison",
  "name": "University of Wisconsin-Madison",
  "domain": "wisc.edu",
  "config": {
    "branding": {
      "primary_color": "#c5050c",
      "logo_url": "https://..."
    },
    "crisis_contacts": {
      "email": "crisis@wisc.edu",
      "phone": "608-555-1234"
    },
    "custom_frameworks": [
      {
        "name": "Badger Resilience Framework",
        "description": "UW-specific mental toughness approach",
        "content_id": "uuid"
      }
    ],
    "enabled_sports": ["football", "basketball", "hockey", "volleyball"],
    "discovery_protocol": {
      "min_questions": 5,
      "max_questions": 10,
      "custom_prompts": ["How does being a Badger impact your mindset?"]
    }
  }
}
```

---

## Running the Application

### Backend (FastAPI)

```bash
cd server

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your keys

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend (React + Vite)

```bash
cd client

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add Firebase config

# Start dev server
npm run dev
```

### Docker (Full Stack)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: ai_sports_agent
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./server
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/ai_sports_agent
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./client
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

```bash
# Run everything
docker-compose up
```

---

## Next Steps

1. **Backend**:
   - Implement all 4 MCP agents
   - Create API endpoints
   - Set up vector DB (ChromaDB/Pinecone)
   - Ingest knowledge base PDF

2. **Frontend**:
   - Build React components
   - Implement Firebase Auth
   - Create chat interface with streaming
   - Add coach dashboard

3. **Knowledge Base**:
   - Process AI Sports Psych PDF
   - Generate embeddings
   - Test retrieval quality

4. **Testing**:
   - Unit tests for agents
   - Integration tests for API
   - E2E tests for critical flows

5. **Deployment**:
   - Set up CI/CD
   - Deploy to cloud (AWS/GCP/Azure)
   - Configure monitoring
   - HIPAA/FERPA compliance audit

---

This architecture provides a scalable, modular foundation for the AI Sports Agent platform with clear separation of concerns, multi-tenancy support, and privacy-first design.
