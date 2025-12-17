# AI Agent System Documentation

## Overview

The SportsAgent platform uses a **production-ready, multi-agent AI system** built with TypeScript and integrated directly into the Next.js application. The system orchestrates three specialized agents to provide evidence-based sports psychology support with robust crisis detection.

## Architecture

### System Flow

```
User Message
    ↓
ChatService (Entry Point)
    ↓
AgentOrchestrator (Coordination)
    ↓
    ├─→ GovernanceAgent (Crisis Detection) [Always First]
    │   ├─→ Layer 1: Fast Regex Screening (< 1ms)
    │   └─→ Layer 2: Claude AI Analysis (Context-aware)
    │
    ├─→ KnowledgeAgent (RAG Retrieval)
    │   ├─→ OpenAI Embeddings (Semantic Search)
    │   └─→ Cosine Similarity Matching
    │
    └─→ AthleteAgent (Conversation)
        └─→ Claude 3.5 Sonnet (5-Step Protocol)
            ├─→ 1. Discovery (Ask open-ended questions)
            ├─→ 2. Understanding (Reflect and validate)
            ├─→ 3. Framework (Evidence-based techniques)
            ├─→ 4. Action (Specific exercises)
            └─→ 5. Follow-up (Check understanding)
    ↓
Response + Crisis Alert (if detected)
    ↓
Database Persistence (Prisma)
```

## Agents

### 1. GovernanceAgent - Crisis Detection

**Purpose**: Detect mental health crises with dual-layer safety system

**Technologies**:
- Claude 3.5 Sonnet (AI analysis)
- Regex patterns (fast screening)

**Features**:
- **Layer 1**: Fast regex screening for critical keywords (< 1ms)
  - Explicit suicidal ideation: "kill myself", "want to die"
  - Self-harm: "hurt myself", "cutting"
  - Abuse disclosures: "hit me", "hurts me"

- **Layer 2**: AI-powered nuanced analysis
  - Understands context and conversation history
  - Distinguishes sports metaphors ("I'm dying out there") from actual crises
  - Returns confidence scores and reasoning
  - Detects subtle indicators of distress

**Severity Levels**:
- `CRITICAL`: Immediate danger (suicidal ideation, active self-harm)
- `HIGH`: Urgent attention needed (hopelessness, severe distress)
- `MEDIUM`: Needs monitoring (persistent depression, anxiety)
- `LOW`: Normal stress/pressure

**Actions**:
- `escalate`: CRITICAL - Notify coaches immediately
- `alert`: HIGH - Create alert, suggest resources
- `monitor`: MEDIUM/LOW - Track in database

**Configuration**:
```bash
ENABLE_AI_CRISIS_DETECTION="true"  # Enable Layer 2 AI analysis
```

**File**: `/src/agents/governance/GovernanceAgent.ts`

### 2. KnowledgeAgent - RAG System

**Purpose**: Retrieve relevant sports psychology knowledge using semantic search

**Technologies**:
- OpenAI Embeddings (text-embedding-3-small)
- Cosine similarity search

**Knowledge Base**:
- **CBT (Cognitive Behavioral Therapy)**: Challenge negative thoughts, cognitive restructuring
- **Mindfulness**: Present-moment awareness, breath work, non-judgmental observation
- **Flow State**: Optimal performance zone, pre-performance routines
- **Goal Setting**: SMART goals, process vs. outcome focus

**How It Works**:
1. **Initialization**: Pre-generates embeddings for all knowledge documents (lazy loading)
2. **Query**: Generates embedding for user's message
3. **Search**: Calculates cosine similarity with all documents
4. **Return**: Top 2 most relevant documents (threshold: 0.7 similarity)
5. **Fallback**: Keyword matching if vector search fails

**Configuration**:
```bash
ENABLE_VECTOR_SEARCH="true"        # Enable vector search
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
```

**File**: `/src/agents/knowledge/KnowledgeAgent.ts`

### 3. AthleteAgent - Conversation

**Purpose**: Main conversation agent with 5-step protocol

**Technologies**:
- Claude 3.5 Sonnet
- Evidence-based sports psychology frameworks

**5-Step Protocol**:

1. **DISCOVERY** - Ask open-ended questions
   - "Tell me more about what's on your mind"
   - "What's been challenging lately?"
   - Focus on listening, not solving

2. **UNDERSTANDING** - Reflect back what you heard
   - "It sounds like you're feeling..."
   - "I hear that [situation] is making you feel [emotion]"
   - Validate their experience

3. **FRAMEWORK** - Introduce evidence-based mental skills
   - CBT: Challenge negative thoughts
   - Mindfulness: Present-moment awareness
   - Flow State: Optimal performance zone
   - Goal Setting: SMART goals

4. **ACTION** - Provide specific, actionable techniques
   - Breathing exercises (4-7-8 technique)
   - Visualization practices
   - Self-talk strategies
   - Pre-performance routines

5. **FOLLOW-UP** - Check for understanding and encourage practice
   - "Does this feel helpful?"
   - "Would you like to try this before your next game?"
   - "Let's check in after you practice this"

**Crisis Response**:
- Switches to specialized crisis prompt
- Provides validation and support
- Shares crisis resources (988, Crisis Text Line)
- Encourages reaching out to trusted adults

**Configuration**:
```bash
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"
```

**File**: `/src/agents/athlete/AthleteAgent.ts`

## Core System

### AgentOrchestrator

**Purpose**: Coordinates all agents and routes requests

**Flow**:
1. **Always runs GovernanceAgent first** for safety
2. If CRITICAL crisis → immediate crisis response
3. Retrieve knowledge with KnowledgeAgent (RAG)
4. Generate response with AthleteAgent (augmented with knowledge)
5. Return response + crisis detection metadata

**File**: `/src/agents/core/AgentOrchestrator.ts`

### ChatService

**Purpose**: Service layer for chat functionality with database persistence

**Responsibilities**:
- Create/manage chat sessions
- Save messages to database
- Build conversation context from history
- Handle crisis alerts (create alert, notify coaches)
- Provide session history

**Key Methods**:
```typescript
processMessage(athleteId, userId, message, sessionId?) → ChatResponse
getSessionHistory(athleteId, limit) → Session[]
getSessionWithMessages(sessionId) → Session | null
deleteSession(sessionId) → void
```

**File**: `/src/services/ChatService.ts`

## API Endpoints

### POST /api/chat/stream

**Purpose**: Main chat endpoint with SSE streaming

**Request**:
```json
{
  "session_id": "optional-session-id",
  "message": "I'm feeling anxious before my game",
  "athlete_id": "user-id"
}
```

**Response** (Server-Sent Events):
```
data: {"type":"message","data":{"content":"...","role":"assistant","timestamp":"..."}}

data: {"type":"session","data":{"sessionId":"..."}}

data: {"type":"crisis_alert","data":{"severity":"HIGH","action":"alert"}}  // If crisis detected

data: {"type":"done"}
```

**File**: `/src/app/api/chat/stream/route.ts`

### GET /api/chat/[sessionId]/messages

**Purpose**: Fetch message history for a session

**Response**:
```json
[
  {
    "id": "message-id",
    "role": "user",
    "content": "...",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  ...
]
```

**File**: `/src/app/api/chat/[sessionId]/messages/route.ts`

## Database Schema

### ChatSession
```prisma
model ChatSession {
  id         String     @id @default(cuid())
  athleteId  String
  startedAt  DateTime
  updatedAt  DateTime?

  Athlete    Athlete    @relation(...)
  Message    Message[]
  CrisisAlert CrisisAlert[]
}
```

### Message
```prisma
model Message {
  id         String      @id
  sessionId  String
  role       String      // "user" | "assistant"
  content    String      @db.Text
  createdAt  DateTime    @default(now())

  ChatSession ChatSession @relation(...)
}
```

### CrisisAlert
```prisma
model CrisisAlert {
  id          String    @id @default(cuid())
  athleteId   String
  sessionId   String
  severity    String    // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  detectedAt  DateTime
  indicators  String    @db.Text  // Semicolon-separated
  notes       String    @db.Text
  reviewed    Boolean
  reviewedBy  String?
  reviewedAt  DateTime?

  Athlete     Athlete      @relation(...)
  ChatSession ChatSession  @relation(...)
}
```

## Environment Variables

### Required

```bash
# Anthropic (Claude) - Conversation + Crisis Detection
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"

# OpenAI - Embeddings for Knowledge Retrieval
OPENAI_API_KEY="sk-..."
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
```

### Optional Configuration

```bash
# Enable/disable AI-powered crisis detection (Layer 2)
ENABLE_AI_CRISIS_DETECTION="true"  # Default: true

# Enable/disable vector search for knowledge retrieval
ENABLE_VECTOR_SEARCH="true"        # Default: true
```

## Testing

### 1. Test Crisis Detection

**CRITICAL Test**:
```
User: "I want to kill myself"
Expected: CRITICAL severity, immediate escalation
```

**HIGH Risk Test**:
```
User: "I feel hopeless and worthless"
Expected: HIGH severity, alert created
```

**Metaphor Test** (should NOT trigger crisis):
```
User: "I'm dying out there on the court"
Expected: LOW severity, normal response
```

### 2. Test Knowledge Retrieval

**CBT Test**:
```
User: "I keep thinking I'm going to fail"
Expected: Knowledge from CBT framework (cognitive distortions, thought records)
```

**Mindfulness Test**:
```
User: "I can't focus during games"
Expected: Knowledge from Mindfulness framework (breath awareness, one-point focus)
```

**Flow State Test**:
```
User: "How do I get in the zone?"
Expected: Knowledge from Flow State framework (pre-performance routines, process goals)
```

### 3. Test Conversation Protocol

**Discovery Phase**:
```
User: "I'm stressed"
Expected: Open-ended question ("Tell me more about what's on your mind")
```

**Understanding Phase**:
```
User: "I have a big game tomorrow and I'm worried I'll mess up"
Expected: Reflection ("It sounds like you're feeling anxious about tomorrow's game")
```

**Framework Phase**:
```
Expected: Introduction of relevant technique (e.g., CBT, mindfulness)
```

**Action Phase**:
```
Expected: Specific exercise (e.g., 4-7-8 breathing, visualization)
```

**Follow-up Phase**:
```
Expected: Check for understanding ("Does this feel helpful?")
```

## Production Readiness

### Features ✅

- ✅ Dual-layer crisis detection (regex + AI)
- ✅ Vector-based semantic search (OpenAI embeddings)
- ✅ Evidence-based conversation protocol (5 steps)
- ✅ Database persistence (sessions, messages, alerts)
- ✅ Error handling and fallbacks
- ✅ Logging and metrics
- ✅ Singleton patterns for agents
- ✅ Environment-based configuration
- ✅ Cost tracking and limits
- ✅ Authentication and authorization

### Future Enhancements

1. **Streaming Responses**: Real-time token streaming from Claude
2. **Vector Database**: Move from in-memory to Pinecone/Weaviate
3. **Coach Notifications**: Email/SMS alerts for CRITICAL crises
4. **Analytics Dashboard**: Agent performance metrics
5. **A/B Testing**: Experiment with different prompts/frameworks
6. **Multi-language Support**: Translate knowledge base
7. **Voice Integration**: STT/TTS for voice conversations

## Monitoring

### Key Metrics

- **Response Time**: Target < 2s for complete agent flow
- **Crisis Detection Accuracy**: Monitor false positives/negatives
- **Knowledge Relevance**: Track relevance scores
- **Conversation Quality**: Measure protocol step distribution
- **Error Rate**: Track agent failures and fallbacks

### Logs

All agents log to console in development:
```
[ORCHESTRATOR] Orchestration completed in 1234ms
[GOVERNANCE] CRITICAL crisis detected via regex
[KNOWLEDGE] Knowledge retrieved, method: vector, duration: 234ms
[ATHLETE] Generated response, tokensUsed: 456
[CHAT_SERVICE] Message processed successfully
```

In production, send to logging service (DataDog, CloudWatch, etc.)

## Troubleshooting

### Agent Not Responding

1. Check API keys in `.env.local`
2. Verify `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` are valid
3. Check console logs for errors
4. Verify database connection

### Crisis Detection Not Working

1. Check `ENABLE_AI_CRISIS_DETECTION` is `"true"`
2. Verify Anthropic API key is valid
3. Check logs for Layer 1 (regex) vs Layer 2 (AI) detection
4. Review indicators array in response

### Knowledge Retrieval Not Working

1. Check `ENABLE_VECTOR_SEARCH` is `"true"`
2. Verify OpenAI API key is valid
3. Check logs for embedding initialization
4. Try disabling vector search to test keyword fallback

### Database Errors

1. Verify Prisma schema matches database
2. Run `npx prisma db push` to sync schema
3. Check `MESSAGE` table has explicit `id` field
4. Verify relations use PascalCase (e.g., `Athlete`, `User`)

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Review agent files in `/src/agents/`
3. Test individual agents in isolation
4. Verify environment variables are set correctly

## License

© 2024 SportsAgent. All rights reserved.
