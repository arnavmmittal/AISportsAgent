# Elite Sports Psychology System - Implementation Documentation

**Last Updated**: 2025-12-12
**Status**: Phase 4 Complete, Phase 5 In Progress
**Branch**: `feature/elite-sports-psych-system`

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Phases Completed](#phases-completed)
4. [Implementation Details](#implementation-details)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Frontend Components](#frontend-components)
8. [Testing Guide](#testing-guide)
9. [Future Work](#future-work)

---

## Overview

### Mission
Transform the generic AI chat into an elite sports psychology session system that mimics 1:1 Zoom sessions with sports psychologists. The system diagnoses rapidly, selects targeted interventions, produces actionable plans, and learns over time.

### Core Problem Solved
- **Before**: AI had zero conversation context (messages stored but never retrieved)
- **Before**: Generic responses without sport-specific adaptations
- **Before**: No structured protocol or phase tracking
- **Before**: No memory of what works for each athlete

**After**:
- ✅ Full session context with last 10 messages + athlete profile
- ✅ 6-phase Discovery-First protocol with automatic transitions
- ✅ Structured JSON responses with action plans and tracking
- ✅ Athlete memory system tracking effective techniques
- ✅ Sport-aware, evidence-based RAG retrieval

---

## Architecture

### System Flow

```
User Message
    ↓
[1] SESSION CONTEXT LOADING (session.py)
    - Load last 10 messages
    - Get athlete profile (sport, position, year)
    - Load athlete memory (effective techniques, triggers)
    - Aggregate recent mood logs (3-day average)
    - Fetch active goals and upcoming games
    ↓
[2] CRISIS CHECK (GovernanceAgent)
    - Detect self-harm, suicide, severe issues
    - Immediate escalation if needed
    ↓
[3] ENHANCED RAG RETRIEVAL (rag_enhancement.py)
    - Generate 3-5 query variants
    - Retrieve KB chunks
    - Rerank by sport/evidence/phase relevance
    - Track citations
    ↓
[4] PHASE-AWARE PROMPT BUILDING (prompts.py)
    - Select base elite sports psych prompt
    - Add phase-specific guidance (CHECK_IN, CLARIFY, etc.)
    - Inject triage questions for CHECK_IN
    - Include athlete memory context
    - Add sport-specific terminology
    ↓
[5] STRUCTURED RESPONSE GENERATION (athlete_agent.py)
    - OpenAI function calling for structured JSON
    - Generate both human text + metadata
    - Include session stage, issues, protocol, action plan
    ↓
[6] PHASE TRANSITION (protocol.py)
    - Determine if ready for next phase
    - CHECK_IN → CLARIFY → FORMULATION → INTERVENTION → PLAN → WRAP_UP
    - Update session.discoveryPhase
    - Update session.phaseStartedAt
    ↓
[7] MEMORY UPDATE (session.py)
    - Track technique usage
    - Update effective techniques (after 2+ successes)
    - Identify common triggers (after 3+ occurrences)
    - Refresh transient state (stress, sleep, goals)
    ↓
[8] STREAM TO CLIENT (chat.py)
    - SSE stream: human text chunks
    - SSE metadata: structured JSON block
    - Frontend parses and renders widgets
```

---

## Phases Completed

### ✅ Phase 1: Foundation (3 commits, +631 lines)

**Goal**: Fix critical gaps - history retrieval + session persistence

**Files Created:**
- `ai-sports-mcp/server/app/core/session.py` (353 lines)
- `apps/web/src/app/api/chat/[sessionId]/messages/route.ts` (51 lines)

**Files Modified:**
- `apps/web/prisma/schema.prisma` (+8 fields to ChatSession, +AthleteMemory model)
- `ai-sports-mcp/server/app/agents/athlete_agent.py` (+170 lines)
- `ai-sports-mcp/server/app/api/routes/chat.py` (+15 lines)
- `apps/web/src/components/chat/ChatInterface.tsx` (+34 lines)

**Key Features:**
- Session context loading with last 10 messages
- Athlete profile, mood, goals, upcoming games
- Default athlete memory structure
- Persistent session IDs (no timestamp)
- History loading on frontend mount
- `chat_stream_with_context()` method in AthleteAgent

**Impact:**
- AI now has full conversation context
- Sessions persist across page refreshes
- Personalized responses using athlete data

---

### ✅ Phase 2: Structured Output System (1 commit, +1150 lines)

**Goal**: Implement JSON schema + protocol phase tracking

**Files Created:**
- `ai-sports-mcp/server/app/core/prompts.py` (494 lines)
- `ai-sports-mcp/server/app/core/structured_response.py` (219 lines)
- `apps/web/src/components/chat/ActionPlanWidget.tsx` (136 lines)
- `apps/web/src/components/chat/MetricTrackerWidget.tsx` (155 lines)

**Files Modified:**
- `ai-sports-mcp/server/app/agents/athlete_agent.py` (+168 lines)
- `ai-sports-mcp/server/app/api/routes/chat.py` (+10 lines)
- `apps/web/src/components/chat/ChatInterface.tsx` (+90 lines)

**Key Features:**
- Base elite sports psych system prompt with 6 phases
- Phase-specific prompts for each protocol stage
- Sport-specific terminology for 12+ sports
- StructuredResponse Pydantic schema
- OpenAI function calling for structured output
- Action Plan widget (Today/Week/Competition)
- Metric Tracker widget (0-10 sliders)

**Impact:**
- Every response includes rich metadata
- Action plans rendered as interactive widgets
- Progress tracking becomes measurable
- Protocol phases guide conversation flow

---

### ✅ Phase 3: Protocol-Guided Conversations (2 commits, +660 lines)

**Goal**: Enforce 6-phase Discovery-First protocol

**Files Created:**
- `ai-sports-mcp/server/app/core/protocol.py` (410 lines)

**Files Modified:**
- `ai-sports-mcp/server/app/core/prompts.py` (+191 lines)
- `ai-sports-mcp/server/app/agents/athlete_agent.py` (+49 lines)
- `ai-sports-mcp/server/app/core/session.py` (+6 lines)
- `apps/web/prisma/schema.prisma` (+1 field: phaseStartedAt)

**Key Features:**
- ProtocolPhaseManager with automatic transitions
- Phase-specific transition logic (min turns, requirements)
- InterventionSelector: 20+ issues → 8 frameworks
- Triage question templates (5 categories)
- Turn-based questioning (1-2 questions per turn)
- Timestamp-based turn counting (phaseStartedAt)

**Impact:**
- Protocol phases advance automatically
- Efficient triage in 2-3 turns
- Interventions matched to specific issues
- Turn counting accurate per phase

---

### ✅ Phase 4: Memory + RAG Enhancement (2 commits, +586 lines)

**Goal**: Build athlete mental model + enhanced knowledge retrieval

**Files Created:**
- `ai-sports-mcp/server/app/core/rag_enhancement.py` (410 lines)

**Files Modified:**
- `ai-sports-mcp/server/app/core/session.py` (+143 lines)
- `ai-sports-mcp/server/app/agents/athlete_agent.py` (+33 lines)

**Key Features:**
- `update_athlete_memory()` fully implemented
- Track technique outcomes (last 50 entries)
- Promote techniques to "effective" after 2+ successes
- Identify common triggers after 3+ occurrences
- Refresh transient state (stress, sleep, goals)
- RAGQueryRewriter: multi-query generation
- KBChunkReranker: 4-factor scoring
- KB citation tracking

**Impact:**
- Athletes build personalized mental models
- Effective techniques remembered and suggested
- Smarter RAG with sport/evidence/phase awareness
- Audit trail for all KB usage

---

## Implementation Details

### Database Schema

#### ChatSession Model
```prisma
model ChatSession {
  id               String    @id @default(cuid())
  athleteId        String
  athlete          Athlete   @relation(...)

  // Elite Sports Psych Protocol
  discoveryPhase   String?   @default("check_in")
  phaseStartedAt   DateTime? // When current phase started
  sessionGoals     Json?
  focusArea        String?
  systemContext    Json?
  isActive         Boolean   @default(true)
  lastActivityAt   DateTime  @updatedAt

  messages         Message[]
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
```

#### AthleteMemory Model
```prisma
model AthleteMemory {
  id                String   @id @default(cuid())
  athleteId         String   @unique
  athlete           Athlete  @relation(...)

  // Stable Traits (updated after 3+ confirming sessions)
  typicalAnxietyPattern    String?
  effectiveTechniques      Json     @default("[]")
  commonTriggers           Json     @default("[]")
  preferredCommunication   String?
  bestLearningStyle        String?

  // Transient State (refreshed every session)
  currentStressLevel       Int?
  upcomingCompetitions     Json?
  recentSleep              Float?
  activeGoals              Json?
  recentPerformance        String?

  // Technique Outcomes
  techniqueHistory         Json     @default("[]")

  lastUpdated              DateTime @updatedAt
  createdAt                DateTime @default(now())
}
```

---

### API Reference

#### POST /api/chat/stream

**Request:**
```json
{
  "session_id": "session_user123",
  "message": "I get so anxious before games",
  "athlete_id": "user123"
}
```

**Response (SSE Stream):**
```
data: {"type":"content","data":"I hear you"}
data: {"type":"content","data":" - pre-game nerves"}
data: {"type":"content","data":" are common."}
...
data: {"type":"metadata","data":{
  "session_stage": "check_in",
  "detected_issue_tags": ["pre-game anxiety"],
  "sport_context": {
    "sport": "basketball",
    "setting": "pre-game",
    "timeline": "game tomorrow"
  },
  "key_hypotheses": ["Over-arousal before competition"],
  "action_plan": {...},
  "tracking": {...},
  "kb_citations": ["kb_chunk_1", "kb_chunk_2"]
}}
data: [DONE]
```

#### GET /api/chat/{sessionId}/messages

**Response:**
```json
[
  {
    "id": "msg_123",
    "role": "user",
    "content": "I get anxious before games",
    "createdAt": "2025-12-12T10:00:00Z"
  },
  {
    "id": "msg_124",
    "role": "assistant",
    "content": "I hear you - pre-game nerves are common...",
    "createdAt": "2025-12-12T10:00:05Z"
  }
]
```

---

### Frontend Components

#### ActionPlanWidget
**Location**: `apps/web/src/components/chat/ActionPlanWidget.tsx`

**Props:**
```typescript
interface ActionPlanWidgetProps {
  plan: {
    today: string[];
    this_week: string[];
    next_competition: string[];
  };
  onCheckItem?: (timeframe: string, index: number, checked: boolean) => void;
}
```

**Features:**
- Three timeframe sections (TODAY, THIS WEEK, NEXT COMPETITION)
- Interactive checkboxes for each action
- Gradient UI with icons
- Animated entrance

---

#### MetricTrackerWidget
**Location**: `apps/web/src/components/chat/MetricTrackerWidget.tsx`

**Props:**
```typescript
interface MetricTrackerWidgetProps {
  metrics: Array<{
    name: string;
    scale: string;
    target?: number;
    when_to_log: string;
  }>;
  adherence_check?: string;
  one_word_debrief?: string;
  onLogMetric?: (metricName: string, value: number) => void;
}
```

**Features:**
- 0-10 sliders for each metric
- Visual target indicators
- "Log This Metric" buttons with success animation
- Adherence check and one-word debrief sections

---

## Testing Guide

### Manual Testing Checklist

#### Phase 1: Foundation
- [ ] New session creates ChatSession with default "check_in" phase
- [ ] Message history loads on page refresh
- [ ] Last 10 messages appear in chat UI
- [ ] Session ID persists (no timestamp in ID)
- [ ] Athlete profile loaded (sport, position, year)
- [ ] Recent mood data aggregated (last 3 days)

#### Phase 2: Structured Output
- [ ] Every AI response includes structured metadata
- [ ] Action plan widget appears when plan exists
- [ ] Metric tracker widget appears when metrics exist
- [ ] Checkboxes work in action plan
- [ ] Sliders work in metric tracker
- [ ] "Log This Metric" button shows success animation

#### Phase 3: Protocol-Guided
- [ ] New session starts in CHECK_IN phase
- [ ] First message asks 1-2 triage questions
- [ ] Second message asks 2-3 follow-up questions
- [ ] Phase advances to CLARIFY after 2-3 turns
- [ ] CLARIFY → FORMULATION transition occurs
- [ ] FORMULATION → INTERVENTION when protocol selected
- [ ] INTERVENTION → PLAN when exercise practiced
- [ ] PLAN → WRAP_UP when action plan created

#### Phase 4: Memory + RAG
- [ ] AthleteMemory created on first session
- [ ] Technique tracked after INTERVENTION phase
- [ ] Technique promoted to "effective" after 2+ successes
- [ ] Common triggers identified after 3+ occurrences
- [ ] Stress level updated from mood logs
- [ ] KB citations appear in structured response
- [ ] Query variants logged (check server logs)

---

## Future Work

### Phase 5: Advanced Features (IN PROGRESS)
**Estimated**: 3-4 days

**Features**:
1. **Routine Builder**
   - Generate pre-performance routines
   - Timer-based cue sequences
   - Sport-specific routine templates
   - Iterate based on feedback

2. **Practice Integration**
   - Convert mental skills → practice drills
   - Between-reps protocols
   - Sport-specific drill generation

3. **Pressure Simulator** (Optional)
   - Script-based mental rehearsal
   - Sport-specific pressure scenarios
   - Guided visualization

**Implementation Plan**:
- Create `practice_integration.py` with drill generators
- Create `routine_builder.py` with template system
- Add to structured response schema
- Create frontend Routine Builder widget

---

### Phase 6: Evaluation + Polish
**Estimated**: 2-3 days

**Features**:
1. **Evaluation Harness**
   - Metrics: actionability, sport-specificity, brevity
   - Test cases across 12 sports
   - A/B testing framework

2. **UI Polish**
   - Action plan dashboard
   - Progress tracking charts
   - Routine timer interface
   - Mobile responsive improvements

**Implementation Plan**:
- Create `evaluation/metrics.py`
- Create `evaluation/test_cases.py`
- Build evaluation runner
- Generate eval reports

---

### Phase 7: Production Readiness
**Estimated**: 3-5 days

**Tasks**:
1. **Database Migration**
   - Run Prisma migration when Supabase available
   - `npx prisma migrate dev --name elite-sports-psych-system`

2. **Testing & Bug Fixes**
   - Integration tests
   - End-to-end tests
   - Error handling improvements
   - Edge case coverage

3. **Documentation**
   - API documentation
   - User guide for athletes
   - Admin guide for coaches
   - Deployment guide

4. **Performance Optimization**
   - Caching strategy
   - Database query optimization
   - Frontend bundle optimization

---

## Git Workflow

### Current Status
- **Branch**: `feature/elite-sports-psych-system`
- **Commits**: 9 total
- **Status**: Pushed to GitHub
- **Pull Request**: Available

### Commit History
1. `fix: Update mobile app backend IP address`
2. `feat: Add Elite Sports Psych session structure to Prisma schema`
3. `feat: Complete Phase 1 Foundation - Session context & history retrieval`
4. `feat: Complete Phase 2 - Structured Output System with Protocol Phases`
5. `feat: Phase 3.1-3.2 - Protocol Phase State Machine & Auto-Transitions`
6. `feat: Phase 3.3-3.5 - Rapid Triage, Turn Counting & Phase Tracking`
7. `feat: Phase 4.1-4.3 - Memory System & RAG Enhancement`
8. `feat: Phase 4.5-4.6 - RAG Integration & Citation Tracking`
9. (Phase 5 commits in progress)

### Merging to Main
When ready to merge:
```bash
git checkout main
git pull origin main
git merge feature/elite-sports-psych-system
git push origin main
```

---

## Performance Metrics

### Code Statistics
- **Lines Added**: ~3027 lines (Phases 1-4)
- **Files Created**: 11 new files
- **Files Modified**: 12 existing files

### Response Time Targets
- Session context loading: <200ms
- RAG query generation: <100ms
- KB retrieval + reranking: <500ms
- Structured response generation: <3s
- Total response time: <4s

### Memory Usage
- AthleteMemory per athlete: ~2KB JSON
- Technique history (50 entries): ~5KB
- Session context object: ~10KB

---

## Troubleshooting

### Common Issues

**Issue**: Database connection error during migration
```
Error: P1001: Can't reach database server
```
**Solution**: Run `npx prisma generate` to generate types without migrating. Run migration when database is available.

---

**Issue**: Phase not advancing
**Symptoms**: Stuck in CHECK_IN phase after 3+ turns

**Debugging**:
1. Check `phaseStartedAt` is set in ChatSession
2. Verify turn count calculation in athlete_agent.py
3. Check ProtocolPhaseManager transition logic
4. Look for errors in structured response parsing

---

**Issue**: Memory not updating
**Symptoms**: effectiveTechniques stays empty

**Debugging**:
1. Check AthleteMemory record exists
2. Verify technique tracked in techniqueHistory
3. Check outcome field is "helpful" or "very_helpful"
4. Verify count >= 2 for promotion
5. Check session.py logs for errors

---

## References

- **OpenAI Function Calling**: https://platform.openai.com/docs/guides/function-calling
- **Prisma Schema**: https://www.prisma.io/docs/concepts/components/prisma-schema
- **SSE Streaming**: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- **Pydantic Models**: https://docs.pydantic.dev/

---

**Document Version**: 1.0
**Last Updated By**: Claude Code
**Next Review**: After Phase 5 completion
