# AI Sports Agent - MCP Platform

**Evidence-based sports psychology platform with MCP (Model Context Protocol) agent orchestration**

Built for collegiate athletes and coaching staff using FastAPI (Python) + React (TypeScript).

---

## 🎯 Overview

The AI Sports Agent is a next-generation mental performance platform that uses autonomous MCP agents to provide:

- **For Athletes**: 24/7 evidence-based support using Discovery-First protocol
- **For Coaches**: Anonymized insights, team trends, and actionable summaries
- **For Institutions**: Privacy-first, multi-tenant architecture with customizable frameworks

### Core Innovation: MCP Agent Orchestration

Four specialized agents work together to deliver personalized, safe, research-backed support:

1. **AthleteAgent** - Discovery-First conversation protocol with sport-specific frameworks
2. **CoachAgent** - Team analytics and anonymized athlete insights
3. **GovernanceAgent** - Real-time crisis detection and safety monitoring
4. **KnowledgeAgent** - RAG-powered retrieval from embedded research base

---

## 📁 Project Structure

```
ai-sports-mcp/
├── server/                    # FastAPI Backend (Python)
│   ├── app/
│   │   ├── agents/            # 4 MCP Agents
│   │   ├── api/               # REST endpoints
│   │   ├── models/            # SQLAlchemy models
│   │   ├── tools/             # Agent tools
│   │   └── main.py
│   └── requirements.txt
│
├── client/                    # React Frontend (TypeScript)
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── hooks/             # Custom hooks
│   │   └── services/          # API clients
│   └── package.json
│
├── knowledge-base/            # Knowledge Base Assets
│   └── pdfs/                  # Source documents
│
├── ARCHITECTURE.md            # Detailed architecture docs
├── IMPLEMENTATION_GUIDE.md    # Code samples & guides
└── README.md                  # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.9.0 (for client)
- **Python** >= 3.11 (for server)
- **PostgreSQL** >= 15 (with pgvector extension)
- **Redis** >= 7.0 (for caching)
- **Firebase** project (for authentication)
- **OpenAI API** key

### 1. Backend Setup

```bash
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your credentials:
#   - DATABASE_URL
#   - OPENAI_API_KEY
#   - FIREBASE_CREDENTIALS_PATH
#   - etc.

# Run database migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

Visit: http://localhost:8000/v1/docs (Swagger API docs)

### 2. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with:
#   - VITE_API_URL=http://localhost:8000
#   - Firebase config
#   - etc.

# Start dev server
npm run dev
```

Visit: http://localhost:3000

### 3. Ingest Knowledge Base

```bash
# From server directory
python -m app.scripts.ingest_kb \
  --file ../knowledge-base/pdfs/AI_Sports_Psych_Project.pdf \
  --school-id uw_madison
```

---

## 🏗️ Architecture Highlights

### MCP Agent Workflow

```
User Message
    ↓
[GovernanceAgent] → Crisis Detection
    ↓
[KnowledgeAgent] → Retrieve Context from Vector DB
    ↓
[AthleteAgent/CoachAgent] → Generate Response
    ↓
    └─> Uses Tools:
        - Discovery Questions
        - Framework Retrieval
        - Action Planning
    ↓
Streamed Response to Client
```

### Database Schema

**Multi-tenant with row-level security**:
- `schools` - Institution configs
- `users` - Athletes, coaches, admins
- `sessions` - Chat sessions
- `messages` - Conversation history
- `framework_chunks` - Vector-embedded knowledge base
- `experiments` - Athlete logs/journals
- `audit_logs` - Governance events

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full schema.

### API Endpoints

```
POST   /v1/chat              # Main chat endpoint (streaming)
POST   /v1/kb/query          # Knowledge base search
GET    /v1/report/weekly     # Coach summary reports
POST   /v1/experiments       # Athlete journals/logs
POST   /v1/auth/login        # Firebase authentication
GET    /v1/sessions          # Session history
```

See Swagger docs at `/v1/docs` when server is running.

---

## 🤖 MCP Agents

### 1. AthleteAgent (Discovery-First Protocol)

**Purpose**: Engage athletes using evidence-based conversation protocol

**Protocol Phases**:
1. **Discovery** (3-7 questions) - Build context before advising
2. **Understanding** - Validate comprehension
3. **Framework** - Apply CBT/mindfulness/flow techniques
4. **Action** - Create concrete next steps
5. **Follow-up** - Set reflection prompts

**Tools**:
- `ask_discovery_question()` - Generate protocol-aligned questions
- `retrieve_framework()` - Get sport-specific interventions
- `assess_readiness()` - Determine intervention timing
- `apply_cbt()`, `apply_mindfulness()` - Evidence-based techniques

**See**: [server/app/agents/athlete_agent.py](./server/app/agents/athlete_agent.py)

### 2. CoachAgent

**Purpose**: Generate insights and summaries for coaching staff

**Tools**:
- `anonymize_data()` - Remove PII from athlete sessions
- `generate_summary()` - Weekly/monthly team reports
- `detect_patterns()` - Identify trends across athletes
- `create_action_items()` - Suggest interventions

**Outputs**:
- Team sentiment trends
- Common themes across athletes
- Athletes needing attention (anonymized)
- Recommended coaching actions

### 3. GovernanceAgent

**Purpose**: Monitor for crisis language and ensure safety

**Crisis Triggers**:
- Self-harm/suicidal ideation
- Severe depression indicators
- Substance abuse
- Trauma/abuse disclosures

**Actions**:
1. Immediate pause of conversation
2. Provide crisis resources
3. Notify designated staff
4. Log to audit trail

**Tools**:
- `detect_crisis_language()` - ML pattern matching
- `escalate_alert()` - Emergency notifications
- `flag_session()` - Mark for human review

### 4. KnowledgeAgent (RAG)

**Purpose**: Manage knowledge base ingestion and retrieval

**Workflow**:
1. Process PDFs → Chunk (1-2 paragraphs)
2. Auto-tag with metadata (sport, framework, phase)
3. Generate embeddings (OpenAI text-embedding-3-large)
4. Store in vector DB (ChromaDB/Pinecone)
5. Semantic search on queries

**Metadata Structure**:
```json
{
  "sport": ["basketball", "general"],
  "framework": ["CBT", "flow-state"],
  "phase": "pre-competition",
  "protocol_step": "intervention",
  "tags": ["anxiety", "visualization"]
}
```

---

## 🎨 Frontend Components

### ChatWindow.tsx
Real-time chat with streaming responses and tool-call indicators

```tsx
<ChatWindow
  sessionId={sessionId}
  onSend={sendMessage}
  isStreaming={isStreaming}
/>
```

### JournalPage.tsx
Private reflections with local-first storage + optional sync

```tsx
<JournalPage
  entries={entries}
  onSave={saveEntry}
  syncToServer={true}
/>
```

### CoachDashboard.tsx
Team analytics with sentiment charts and athlete summaries

```tsx
<CoachDashboard
  weeklyReport={report}
  athleteSummaries={summaries}
/>
```

### Login.tsx / Register.tsx
Firebase authentication with role-based routing

```tsx
<Login onSuccess={redirectToDashboard} />
<Register role="athlete" sport="basketball" />
```

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for full code samples.

---

## 🔐 Security & Privacy

### Multi-Tenancy
- Row-level security by `school_id`
- Separate vector collections per institution
- Custom frameworks per school

### Data Encryption
- PHI encrypted at rest (AES-256)
- TLS in transit
- Firebase Auth tokens (JWT)

### HIPAA/FERPA Compliance
- Audit logs for all data access
- Athlete consent required for coach access
- Crisis events tracked and escalated
- Data retention policies configurable per institution

### Role-Based Access Control
- **Athlete**: Own sessions, journals, reflections
- **Coach**: Anonymized team summaries, flagged sessions
- **Admin**: School config, user management

---

## 📊 Knowledge Base

### Ingestion Pipeline

1. **Upload PDF** (e.g., AI Sports Psych Project.pdf)
2. **Extract & Chunk** (1000 tokens, 200 overlap)
3. **Auto-Tag** with GPT-4:
   - Sport applicability
   - Framework type (CBT, mindfulness, etc.)
   - Competition phase
   - Protocol step
4. **Embed** with text-embedding-3-large (3072 dimensions)
5. **Store** in vector DB with metadata

### Query Example

```python
results = await knowledge_agent.query(
    query="CBT techniques for pre-game anxiety in basketball",
    filters={
        "sport": "basketball",
        "framework": "CBT",
        "phase": "pre-competition"
    },
    top_k=5
)
```

Returns top 5 most relevant chunks with relevance scores.

---

## 🧪 Testing

### Backend Tests

```bash
cd server
pytest tests/ -v
```

**Coverage**:
- Unit tests for each MCP agent
- API endpoint integration tests
- Crisis detection accuracy
- Knowledge retrieval precision

### Frontend Tests

```bash
cd client
npm run test
```

**Coverage**:
- Component rendering
- Chat streaming
- Auth flows
- Error boundaries

---

## 🚢 Deployment

### Docker Compose (Local Development)

```bash
# From project root
docker-compose up
```

Includes:
- PostgreSQL with pgvector
- Redis
- FastAPI backend
- React frontend (Vite dev server)

### Production Deployment

**Backend** (FastAPI):
- **Recommended**: AWS ECS, Google Cloud Run, or Railway
- **Database**: Supabase (managed Postgres + pgvector)
- **Redis**: AWS ElastiCache or Redis Cloud
- **Monitoring**: Prometheus + Grafana

**Frontend** (React):
- **Recommended**: Vercel, Netlify, or Cloudflare Pages
- **CDN**: Automatic via deployment platform

**Vector DB**:
- **ChromaDB**: Self-hosted or Chroma Cloud
- **Alternative**: Pinecone (managed, paid)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step guides.

---

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Full system architecture, database schema, agent workflows
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Code samples for all MCP agents and components
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guides
- **[API_DOCS.md](./API_DOCS.md)** - Complete API reference

---

## 🛠️ Development

### Adding a New Sport Framework

1. Add PDF to `knowledge-base/pdfs/`
2. Run ingestion with sport metadata:
   ```bash
   python -m app.scripts.ingest_kb \
     --file path/to/framework.pdf \
     --metadata '{"sport": "soccer", "framework": "mental-imagery"}'
   ```
3. Update sport list in school config

### Customizing Discovery Protocol

Edit `server/app/core/config.py`:
```python
DISCOVERY_MIN_QUESTIONS = 5
DISCOVERY_MAX_QUESTIONS = 10
```

Or per-school via `schools.config`:
```json
{
  "discovery_protocol": {
    "min_questions": 3,
    "max_questions": 7,
    "custom_prompts": ["..."]
  }
}
```

### Adding Crisis Keywords

Edit `server/app/agents/governance_agent.py`:
```python
CRISIS_PATTERNS = [
    r'\b(new pattern here)\b',
    ...
]
```

---

## 🤝 Contributing

This is a university research project. For contributions:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Proprietary - University of Wisconsin-Madison
Contact: [sports-tech@wisc.edu](mailto:sports-tech@wisc.edu)

---

## 🙏 Acknowledgments

- UW Sports Psychology Department
- Collegiate athletes who provided feedback
- OpenAI for GPT-4 and embedding models
- LangChain community

---

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@ai-sports-agent.edu

---

**Built with ❤️ for student-athlete mental performance**

Version: 1.0.0 | Last Updated: 2024
