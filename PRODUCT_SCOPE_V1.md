# Flow Sports Coach — V1 Product Scope

## Product Vision

Flow Sports Coach gives athletic programs 24/7 AI-powered mental performance support for their athletes, backed by real sports psychology, with a data layer that gives coaches visibility they've never had — who's thriving, who's struggling, what interventions work, and how mental readiness correlates with game-day performance.

**One-line pitch:** _"Your athletes get an AI mental performance coach. You get the data."_

---

## Target Customer

**Primary buyer:** Head of Sport Psychology / Mental Performance Coordinator at NCAA Division I programs, professional sports academies, and elite high school athletic programs.

**Secondary buyer:** Head coaches at programs without dedicated sport psych staff (D2/D3, NAIA) — they need this MORE because they have zero mental performance infrastructure.

**End user:** Student-athletes (18-24, mobile-first, won't fill out forms, will talk to an AI).

**Budget source:** Athletic department operational budget. Mental performance line item. Typical sport psych contractor costs $150-300/hour × 10-20 hours/month = $1,500-6,000/month per team. We price well below that.

---

## Pricing Model

### Per-athlete, annual contract

| Tier | Price | Includes |
|------|-------|----------|
| **Team** | $20/athlete/month | AI coach chat, mood tracking, wearable sync, coach dashboard, readiness heatmap, crisis alerts, performance correlation |
| **Program** | $15/athlete/month | Everything in Team + multiple teams, custom knowledge base upload, cross-team analytics, priority support |
| **Enterprise** | Custom | Everything in Program + SSO, dedicated onboarding, SLA, API access |

**Example deal sizes:**
- 1 basketball team (15 athletes) = $300/month = **$3,600/year**
- 1 football program (85 athletes) = $1,275/month = **$15,300/year**
- Full athletic department (400 athletes, Program tier) = $6,000/month = **$72,000/year**

**Why this works:** A single sports psychologist costs $36,000-72,000/year. This doesn't replace them — it extends their reach 24/7 and gives them data. The tool pays for itself if it saves the sport psych 3-4 hours/month of routine check-ins.

### Free trial
30-day free trial for one team (up to 25 athletes). No credit card required. Coach sees value within the first week when readiness data starts populating.

---

## Why Coaches Pay — The Four Value Pillars

### 1. Athlete Access (Time Leverage)
**Problem:** A sports psychologist can see each athlete for maybe 30 minutes/week. Athletes need support at 11pm before a big game, not during Tuesday office hours.

**Solution:** AI coach available 24/7, grounded in real sports psychology (ACT, mindfulness, imagery, self-talk frameworks). Handles routine mental skills work — pre-performance routines, arousal regulation, confidence building, post-game processing.

**What the coach keeps:** Complex cases, relationship building, team dynamics, clinical intervention. The AI handles the 80% so the coach can focus on the 20% that requires a human.

**Revenue justification:** "My athletes get 10x more mental performance touchpoints without me hiring another staff member."

### 2. Visibility (Data They Never Had)
**Problem:** Coaches currently assess athlete mental state through gut feeling and brief conversations. They miss things. An athlete can hide declining mental health for weeks.

**Solution:** Real-time dashboard showing team readiness, individual mood trends, check-in frequency, and AI-generated alerts ("Marcus hasn't engaged in 6 days — consider reaching out").

**Revenue justification:** "I can see my whole team's mental state at a glance. I've never had this data before."

### 3. Performance Edge (Competitive Advantage)
**Problem:** Every team trains physically. Mental performance is the untapped edge, but it's invisible — coaches can't measure it or tie it to outcomes.

**Solution:** Performance correlation engine. Coach logs game outcomes (points, errors, coach rating). System correlates backwards to readiness scores, mood patterns, sleep data, intervention completion. Surfaces patterns: "When team average readiness is above 75, win rate is 78%. When below 60, win rate is 41%."

**Revenue justification:** "I can see exactly which mental performance interventions lead to better game-day results. This is a competitive advantage."

### 4. Liability Protection (Risk Mitigation)
**Problem:** Student-athlete mental health crises are increasing. If an athlete is in distress and the program didn't notice or respond, the university faces enormous legal and reputational risk.

**Solution:** Three-layer crisis detection with documented audit trail. Every detection is logged — what was detected, when, what resources were provided to the athlete, when the coach was notified, when they acknowledged. This is a paper trail that demonstrates duty of care.

**Revenue justification:** "If something happens, we can show we had systems in place. The alternative is hoping we don't miss something."

### Bonus: Coach ROI Proof (Stickiness)
Sports psychologists constantly justify their existence to athletic directors. Flow Sports Coach generates data that proves mental performance programs work: "Athletes who completed 3+ AI coaching sessions per week performed 22% better." This gives the coach ammunition for their own budget renewal. If they cancel Flow Sports Coach, they lose the data that justifies their job. This creates extreme retention.

---

## V1 Feature Scope

### ATHLETE EXPERIENCE (Mobile-first)

**Three tabs. That's it. Chat, Check-in, Profile.**

#### AI Coach Chat
- Conversational AI mental performance coach
- **Primary LLM: Claude (Sonnet)** — better at empathetic, nuanced conversation
- **Fallback LLM: GPT-4o** — if Anthropic API is unavailable
- **RAG pipeline:** Every response grounded in curated sports psychology knowledge base (see Knowledge Base section)
- Voice mode: speech-to-text (Whisper) → Claude → text-to-speech (ElevenLabs)
- Structured tool outputs: breathing exercises, visualization scripts, pre-performance routines delivered as interactive cards, not just text
- Session continuity: AI remembers prior conversations, builds on previous work
- Works offline: queues messages, syncs when reconnected (V1 stretch)

#### Daily Check-in
- 30-second mood check-in: overall mood (1-5), confidence, energy, sleep quality, stress level
- Optional free-text note ("big game tomorrow, feeling nervous")
- Streak indicator to encourage daily use
- Data feeds into readiness score and coach dashboard automatically

#### Wearable Sync
- WHOOP integration (V1) — automatic, passive data: HRV, sleep stages, recovery score, strain
- Garmin, Oura, Apple Health (V2)
- Athlete connects once, data flows automatically — zero ongoing effort

#### Crisis Response
- Three-layer detection runs on every message (keyword → content analysis → contextual LLM)
- When triggered: empathetic AI response + immediate display of crisis resources (988 Lifeline, Crisis Text Line, campus counseling)
- AI does NOT attempt therapy — bridges to real help
- Athlete is not "locked out" — can continue chatting but resources remain visible

#### Privacy Controls
- Athlete sees exactly what the coach can see (transparency)
- Default sharing: readiness score, mood trends, check-in frequency, crisis alerts
- Opt-in sharing: chat topic summaries (never raw transcripts)
- Always shared (non-negotiable): crisis alerts
- Never shared: chat transcripts, raw message content

---

### COACH EXPERIENCE (Desktop web app)

**Four core views: Roster, Heatmap, Correlations, Alerts.**

#### Team Roster (Home Screen)
- Table of all athletes on coach's team(s)
- Each row: Name, current readiness (red/yellow/green), last check-in timestamp, 7-day mood trend (↑↓→), active crisis flag
- Click athlete → individual detail view:
  - 30-day mood chart (mood, confidence, energy, stress, sleep)
  - Readiness score trend line
  - Check-in streak and engagement metrics
  - Chat topic summaries (if athlete opted in) — categories like "pre-game anxiety," "confidence," "sleep issues," NOT transcripts
  - Wearable data trends (HRV, sleep, recovery)
  - Performance correlation for this athlete (see below)
- Quick actions: assign intervention, send encouragement message, flag for follow-up

#### Readiness Heatmap
- Grid: athletes (rows) × days (columns) × color-coded readiness score
- At-a-glance team mental state over 30/60/90 days
- Filter by readiness level, by sport, by team
- This is the "wow" screenshot that sells the product in demos

#### Performance Correlation Dashboard
- **Game Outcome Logging:** Simple form — date, athlete(s), sport-specific metrics (flexible fields), subjective performance rating (1-10), game result (W/L/T), notes
- **Correlation Engine:** System automatically correlates:
  - Readiness score on game day vs. performance outcome
  - Mood trends in 3 days before game vs. result
  - Sleep quality (from check-in or WHOOP) vs. performance
  - Intervention completion vs. next-game performance
  - Chat engagement frequency vs. performance trends
- **Insight Generation:** Claude analyzes correlations and generates plain-English insights:
  - "When Sarah's readiness is above 80, she averages 18 points. Below 60, she averages 11."
  - "Athletes who completed the assigned pre-game visualization had a 23% better performance rating."
  - "Team readiness drops an average of 15 points during exam weeks."
- **Coach Report View:** Exportable summary for presentations to athletic directors (PDF/email) — this is the "prove your program works" feature

#### Alert Feed
- Chronological list of all crisis detections and system alerts
- Each alert: athlete name, timestamp, severity (low/medium/high/critical), status (new/acknowledged/resolved)
- Coach marks as acknowledged (logged with timestamp) or resolved (with optional note)
- No chat content shown — just: "A potential mental health concern was detected. Please check in with this athlete."
- Full audit trail exportable for compliance

#### AI Nudges (Daily Briefing)
- Coach opens dashboard → top section shows 3-5 AI-generated action items:
  - "3 athletes haven't checked in for 5+ days"
  - "Team average readiness dropped 12% this week"
  - "Riley's sleep quality has declined for 8 consecutive days"
  - "Tomorrow is a game day — 4 athletes have readiness below 60"
- Generated by Claude analyzing team data overnight (batch job)
- Dismissable, actionable, concise

#### Assignments
- Coach creates an assignment: title, description, due date, assigned athletes
- Types: breathing exercise, visualization script, journaling prompt, custom
- Athletes see it in their app, complete it, mark done
- Coach sees completion rates per assignment
- Completion data feeds into performance correlation engine

---

### KNOWLEDGE BASE (RAG System)

#### Curated Foundation (ships with product)
- 30-50 foundational sports psychology sources, chunked and embedded:
  - Acceptance and Commitment Therapy (ACT) for athletes
  - Mindfulness-Sport Performance Enhancement (MSPE)
  - Pre-Performance Routine design (Singer, Cotterill)
  - PETTLEP imagery model
  - Self-talk frameworks (instructional vs. motivational)
  - Arousal regulation techniques (centering, progressive relaxation)
  - Confidence-building models (Vealey, Bandura self-efficacy)
  - Sleep hygiene for athletes
  - Team cohesion and leadership psychology
  - Injury rehabilitation psychology
  - Transition and identity (athletic identity, career transitions)
- Sources cited in AI responses: "Based on the PETTLEP imagery framework (Holmes & Collins, 2001)..."

#### Coach-Uploadable (per-program customization)
- Coach uploads PDFs/docs: team-specific mental performance protocols, program philosophy, custom exercises
- Documents are chunked, embedded, and added to that team's RAG namespace
- AI incorporates program-specific language and approaches
- Example: "Coach Johnson's pre-game centering protocol" becomes something the AI can walk athletes through

#### Architecture
- Vector store: pgvector (PostgreSQL extension — no additional infrastructure)
- Embeddings: Anthropic or OpenAI embedding model (benchmark on sports psych content to choose)
- Retrieval: Top-k relevant chunks injected into Claude's context on every chat message
- Namespace isolation: each team has its own knowledge partition (base + custom)

---

### TRUST & COMPLIANCE

#### Data Privacy
- **FERPA awareness:** Student educational records are protected. Chat content is treated as confidential. Coaches see aggregate/summary data, never raw content.
- **Athlete consent flow:** On first login, athlete explicitly consents to: (1) AI coaching, (2) mood data sharing with coach, (3) optional chat topic sharing, (4) crisis alert sharing (mandatory). Consent is logged with timestamp.
- **Data retention:** Chat messages retained for 1 year, then auto-deleted. Aggregate analytics retained for 3 years. Athlete can request full data deletion at any time.
- **Encryption:** All data encrypted at rest (AES-256) and in transit (TLS 1.3). Chat messages encrypted with per-user keys.

#### Crisis Safety
- Three-layer detection on every message (no exceptions)
- Immediate resource display to athlete
- Coach notification within 60 seconds
- Full audit trail: detection timestamp, severity, resources shown, coach notification timestamp, coach acknowledgment timestamp
- Monthly crisis response summary report for compliance

#### Reliability
- 99.9% uptime target for chat service
- LLM fallback chain: Claude → GPT-4o → cached response for common topics
- Graceful degradation: if AI is down, athlete sees: "I'm temporarily unavailable. If you need immediate support: [crisis resources]." Coach is notified of outage.
- All data backed up daily with point-in-time recovery

#### Security Posture
- SOC 2 Type II (target for year 1 — required by most universities)
- Role-based access control (athlete, coach, admin)
- Multi-tenant isolation (school A cannot see school B's data)
- API rate limiting and cost controls (already built)
- No data used for LLM training (contractual guarantee with Anthropic/OpenAI)

---

## What is NOT in V1

| Feature | Why Not |
|---------|---------|
| ESPN/stats auto-import | Massive scope, manual game logging covers the need |
| Burnout detection algorithm | Readiness trends + correlation engine covers this naturally |
| Readiness forecasting/predictions | Current state + trends is sufficient; predictions add complexity without clear coach value |
| Video visualization | No clear buyer need |
| Admin dashboard | We're not a multi-tenant platform yet — handle admin via database/support |
| Goal management page | Assignments + AI chat cover goal-setting |
| Weekly digest emails | V2 — coaches check dashboard daily during season |
| Garmin/Oura/Apple Health | V2 — WHOOP first, expand integrations based on demand |
| Group chat / team chat | V2 — individual coaching is the core |
| Parent/guardian portal | V2 — for high school programs |
| Billing/self-serve signup | V1 uses manual onboarding (we set up each team). Self-serve in V2. |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    ATHLETE (Mobile)                  │
│   React Native (Expo) — 3 tabs: Chat, Check-in,     │
│   Profile                                            │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / WSS
                       ▼
┌─────────────────────────────────────────────────────┐
│                    API LAYER                          │
│   Next.js API Routes (Vercel)                        │
│   ┌──────────┐ ┌──────────┐ ┌───────────┐           │
│   │ Chat/SSE │ │ Mood API │ │ Coach API │           │
│   └────┬─────┘ └────┬─────┘ └─────┬─────┘           │
│        │             │             │                  │
│   ┌────▼─────────────▼─────────────▼─────┐           │
│   │         Business Logic Layer          │           │
│   │  • Crisis Detection (3-layer)         │           │
│   │  • Readiness Scoring                  │           │
│   │  • Correlation Engine                 │           │
│   │  • AI Nudge Generator                 │           │
│   │  • RAG Retrieval                      │           │
│   └────┬──────────┬──────────┬───────────┘           │
│        │          │          │                        │
│   ┌────▼────┐ ┌───▼───┐ ┌───▼────┐                  │
│   │ Claude  │ │ GPT-4o│ │Whisper │                   │
│   │(primary)│ │(fallbk)│ │+ 11Lab│                   │
│   └─────────┘ └───────┘ └────────┘                   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                   DATA LAYER                         │
│   PostgreSQL (Supabase)                              │
│   ┌───────────┐ ┌──────────┐ ┌────────────┐         │
│   │  Prisma   │ │ pgvector │ │  Supabase  │         │
│   │  (ORM)    │ │  (RAG)   │ │  (Auth)    │         │
│   └───────────┘ └──────────┘ └────────────┘         │
└─────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                    COACH (Web)                        │
│   Next.js App Router (Vercel)                        │
│   4 views: Roster, Heatmap, Correlations, Alerts     │
└─────────────────────────────────────────────────────┘
```

---

## Build Sequence

### Phase 1: Foundation Reset (1 week)
- Switch chat pipeline from GPT-4 to Claude (Sonnet) as primary
- Add GPT-4o as fallback with automatic failover
- Strip all non-V1 pages and routes (goals, visualization, admin, complex analytics)
- Clean up mobile app to 3 tabs (chat, check-in, profile)
- Ensure auth, mood tracking, WHOOP sync, crisis detection all work end-to-end

### Phase 2: Knowledge Base / RAG (1 week)
- Set up pgvector extension in Supabase PostgreSQL
- Curate and chunk initial sports psychology document set
- Build embedding pipeline (ingest → chunk → embed → store)
- Integrate RAG retrieval into chat pipeline (retrieve → inject context → Claude responds)
- Build coach upload endpoint (PDF → chunk → embed → team namespace)
- Test: AI responses should cite specific frameworks and feel grounded, not generic

### Phase 3: Coach Dashboard — Core Views (2 weeks)
- Team Roster view with real data (readiness, mood trends, engagement)
- Individual athlete detail view (charts, trends, wearable data)
- Readiness Heatmap with real data
- Alert Feed with crisis history and acknowledgment flow
- AI Nudges (daily batch job generating coach action items)

### Phase 4: Performance Correlation Engine (1-2 weeks)
- Game outcome logging form (flexible fields per sport)
- Correlation calculation engine (readiness × mood × sleep × engagement vs. outcomes)
- Claude-powered insight generation from correlation data
- Individual athlete correlation view
- Team-level correlation summary
- Exportable coach report (PDF)

### Phase 5: Mobile Polish + Onboarding (1 week)
- Athlete onboarding flow (consent, privacy explanation, first check-in)
- Coach onboarding flow (add team, invite athletes, dashboard tour)
- Mobile push notifications (check-in reminders, assignment notifications)
- Mobile polish (offline handling, loading states, error states)

### Phase 6: Trust & Ship (1 week)
- Audit trail verification (crisis detection → notification → acknowledgment, all logged)
- Privacy controls UI (athlete sees/manages what's shared)
- Data export for athletes (FERPA compliance)
- Security review (auth, RLS policies, API rate limiting)
- Staging environment end-to-end testing
- Production deployment

**Total estimated timeline: 7-8 weeks for a focused solo developer**

---

## Success Metrics (First 90 Days After Launch)

### Athlete Engagement
- Daily active rate: >40% of onboarded athletes check in or chat per day
- Average sessions/week: 3+ per athlete
- Retention: >70% still active after 30 days

### Coach Value
- Dashboard login frequency: 4+ times/week during season
- Time from crisis detection to coach acknowledgment: <4 hours average
- Coach NPS: >50

### Business
- 3 paid teams within 90 days of launch
- $0 churn in first season (no team cancels mid-season)
- 1 athletic department expansion (single team → multiple teams)
- Pipeline: 10+ qualified leads from first 3 reference customers

### Product-Market Fit Signal
- A coach says unprompted: "I can't imagine going back to not having this data"
- An athlete tells their coach: "I actually use this one"

---

## Competitive Moat

1. **Data flywheel:** More athlete conversations → better correlation data → more coach value → more teams → more athletes. Competitors starting from scratch can't replicate the data.

2. **Knowledge base grounding:** Generic AI chatbots give generic advice. Ours cites specific sports psychology frameworks. Coaches trust it because it sounds like a colleague, not a chatbot.

3. **Privacy-first architecture:** Athletes actually use it because they trust it's private. Competitors who show coaches raw transcripts will get lower athlete engagement, which means worse data, which means less coach value.

4. **Switching cost:** After one season, the coach has correlation data proving their program works. Leaving means losing that proof. Every season adds more data and more lock-in.

---

## Open Questions (Resolve Before Building)

1. **Validate pricing with 2-3 coaches.** Is $20/athlete/month in the right range? Would they prefer flat per-team pricing?

2. **Sport-specific customization.** Do we need different correlation metrics per sport (points for basketball, ERA for baseball, etc.) or does a generic performance rating (1-10) suffice for V1?

3. **Consent model with minors.** If we expand to high school programs, athletes under 18 need parental consent. Not a V1 blocker (target college first) but affects architecture.

4. **LLM contract terms.** Verify Anthropic's data usage policy allows us to process sensitive student mental health data. Get this in writing before launch.

5. **Insurance.** Do we need professional liability insurance for providing AI-based mental health-adjacent support? Talk to a lawyer before first paying customer.

---

_Last updated: 2025-04-08_
_Status: Draft — pending founder validation with target customers_
