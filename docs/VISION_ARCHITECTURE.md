# Flow Sports Coach: Vision Architecture

## The Core Insight

**"Happy athletes perform better"** is obvious and not defensible.

**What's defensible:** A system that can predict performance outcomes from mental/physical state, recommend personalized interventions with evidence of effectiveness, and get smarter over time.

---

## Product Positioning

### What We Are
- **Mental Performance Intelligence Platform**
- A force multiplier for sports psychologists (1 → 150+ athletes)
- Predictive analytics connecting mental state → physical performance → outcomes
- Evidence-based intervention engine that learns what works for each athlete

### What We're NOT
- Mental health app / therapy replacement
- Generic mood tracker
- Crisis intervention tool (that's a safety requirement, not a feature)
- Wellness app

---

## The Three Pillars

### 1. PREDICT - Performance Risk Detection
Not "athlete is stressed" but "athlete will underperform by X% on Saturday based on converging signals"

**Data Inputs:**
- Mental state (mood, confidence, stress, focus, motivation)
- Physical recovery (WHOOP: HRV, sleep, strain, recovery score)
- Training load (practice intensity, volume, quality ratings)
- Context (opponent, home/away, stakes, recent results)
- Historical patterns (this athlete's performance under similar conditions)

**Outputs:**
- Performance risk score (0-100)
- Predicted performance deviation from baseline
- Contributing factors ranked by impact
- Confidence interval on prediction

### 2. PRESCRIBE - Personalized Intervention Engine
Not "try deep breathing" but "this specific protocol improved YOUR focus by 23% in 3/4 similar situations"

**How It Works:**
- Track every intervention (breathing, visualization, self-talk, routine adjustment)
- Measure outcomes (next practice performance, game stats, self-reported state)
- Build individual effectiveness profiles
- Recommend based on: situation type + athlete profile + historical effectiveness

**Intervention Categories:**
- Pre-competition routines (personalized timing, sequence)
- In-moment techniques (pressure situations, recovery from errors)
- Recovery protocols (post-loss, injury return, slump breaking)
- Skill-specific mental frameworks (clutch situations, consistency, focus)

### 3. PATTERN - Multi-Level Analytics
Not "team average mood is 7.2" but "when your starting 5 collective HRV is below threshold, win probability drops 34%"

**Individual Level:**
- Personal performance patterns (time of day, opponent type, stakes level)
- Mental skill development trajectory
- Intervention response profile
- Risk factor identification

**Team Level:**
- Collective mental state → team performance correlation
- Leadership influence mapping (who affects team mood?)
- Chemistry indicators
- Pre-game energy optimization

**Sport-Specific:**
- Position-specific mental demands (QB decision speed vs WR route focus)
- Phase-of-season patterns (early season vs playoffs)
- Competition type adjustments (tournament vs regular season)

---

## Technical Architecture

### Current State (MVP)
```
┌─────────────────┐     ┌─────────────────┐
│   Next.js Web   │────▶│   Supabase DB   │
│   (Chat + CRUD) │     │   (Basic data)  │
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│   MCP Server    │
│   (Chat only)   │
└─────────────────┘
```

### Target State (Full Vision)
```
                                    ┌──────────────────────────────────┐
                                    │         DATA INGESTION           │
                                    │  ┌─────────┐ ┌─────────┐        │
                                    │  │  WHOOP  │ │ Garmin  │  ...   │
                                    │  │   API   │ │   API   │        │
                                    │  └────┬────┘ └────┬────┘        │
                                    │       │          │              │
                                    │       ▼          ▼              │
                                    │  ┌─────────────────────────┐    │
                                    │  │   Unified Data Pipeline │    │
                                    │  │   (Kafka/Event Stream)  │    │
                                    │  └───────────┬─────────────┘    │
                                    └──────────────│──────────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
                    ▼                              ▼                              ▼
┌───────────────────────────────┐  ┌───────────────────────────────┐  ┌───────────────────────────────┐
│      PREDICTION ENGINE        │  │     INTERVENTION ENGINE       │  │      ANALYTICS ENGINE         │
│                               │  │                               │  │                               │
│  ┌─────────────────────────┐  │  │  ┌─────────────────────────┐  │  │  ┌─────────────────────────┐  │
│  │  Performance Predictor  │  │  │  │  Effectiveness Tracker  │  │  │  │   Pattern Detection     │  │
│  │  (ML: XGBoost/Neural)   │  │  │  │  (Causal Inference)     │  │  │  │   (Time Series + ML)    │  │
│  └─────────────────────────┘  │  │  └─────────────────────────┘  │  │  └─────────────────────────┘  │
│                               │  │                               │  │                               │
│  ┌─────────────────────────┐  │  │  ┌─────────────────────────┐  │  │  ┌─────────────────────────┐  │
│  │   Risk Signal Fusion    │  │  │  │  Personalization Model  │  │  │  │   Correlation Engine    │  │
│  │  (Multi-modal: HRV +    │  │  │  │  (What works for YOU)   │  │  │  │  (Mental → Physical →   │  │
│  │   Sleep + Mental + ...)  │  │  │  │                         │  │  │  │   Performance)          │  │
│  └─────────────────────────┘  │  │  └─────────────────────────┘  │  │  └─────────────────────────┘  │
│                               │  │                               │  │                               │
│  ┌─────────────────────────┐  │  │  ┌─────────────────────────┐  │  │  ┌─────────────────────────┐  │
│  │   Confidence Scoring    │  │  │  │   Recommendation Gen    │  │  │  │   Insight Generation    │  │
│  │  (How sure are we?)     │  │  │  │  (Context-aware)        │  │  │  │  (Natural Language)     │  │
│  └─────────────────────────┘  │  │  └─────────────────────────┘  │  │  └─────────────────────────┘  │
└───────────────────────────────┘  └───────────────────────────────┘  └───────────────────────────────┘
                    │                              │                              │
                    └──────────────────────────────┼──────────────────────────────┘
                                                   │
                                                   ▼
                                    ┌───────────────────────────────┐
                                    │       KNOWLEDGE LAYER         │
                                    │                               │
                                    │  ┌─────────────────────────┐  │
                                    │  │   Athlete Knowledge     │  │
                                    │  │   Graph (Neo4j)         │  │
                                    │  │                         │  │
                                    │  │  - Individual profiles  │  │
                                    │  │  - Intervention history │  │
                                    │  │  - Performance patterns │  │
                                    │  │  - Team relationships   │  │
                                    │  └─────────────────────────┘  │
                                    │                               │
                                    │  ┌─────────────────────────┐  │
                                    │  │   Sports Psych KB       │  │
                                    │  │   (RAG + Vector)        │  │
                                    │  │                         │  │
                                    │  │  - Research evidence    │  │
                                    │  │  - Protocol library     │  │
                                    │  │  - Sport-specific       │  │
                                    │  └─────────────────────────┘  │
                                    └───────────────────────────────┘
                                                   │
                                                   ▼
                    ┌──────────────────────────────────────────────────────────────┐
                    │                      MCP AGENT LAYER                         │
                    │                                                              │
                    │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
                    │  │ Athlete Agent  │  │  Coach Agent   │  │ Analytics Agent│  │
                    │  │                │  │                │  │                │  │
                    │  │ - Conversation │  │ - Summaries    │  │ - Deep dives   │  │
                    │  │ - Check-ins    │  │ - Alerts       │  │ - Reports      │  │
                    │  │ - Interventions│  │ - Team view    │  │ - Predictions  │  │
                    │  └────────────────┘  └────────────────┘  └────────────────┘  │
                    │                                                              │
                    │  ┌────────────────┐  ┌────────────────┐                      │
                    │  │ Readiness Agent│  │ Research Agent │                      │
                    │  │                │  │                │                      │
                    │  │ - Pre-game     │  │ - Evidence     │                      │
                    │  │ - Recovery     │  │ - Protocols    │                      │
                    │  │ - Optimization │  │ - Updates      │                      │
                    │  └────────────────┘  └────────────────┘                      │
                    └──────────────────────────────────────────────────────────────┘
                                                   │
                                                   ▼
                    ┌──────────────────────────────────────────────────────────────┐
                    │                     CLIENT APPLICATIONS                      │
                    │                                                              │
                    │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
                    │  │   Athlete App  │  │   Coach Web    │  │  Admin Portal  │  │
                    │  │   (Mobile)     │  │   Dashboard    │  │                │  │
                    │  └────────────────┘  └────────────────┘  └────────────────┘  │
                    └──────────────────────────────────────────────────────────────┘
```

---

## Data Model Evolution

### Current: Basic Tracking
```
Athlete → logs mood → coach sees average
```

### Target: Intelligence Network
```
Athlete
  ├── Mental State (continuous, multi-dimensional)
  │     ├── Mood, Confidence, Stress, Focus, Motivation
  │     ├── Context tags (pre-game, post-loss, injury, etc.)
  │     └── Temporal patterns (time of day, day of week, season phase)
  │
  ├── Physical State (integrated from wearables)
  │     ├── HRV, Sleep (duration, quality, stages)
  │     ├── Strain, Recovery Score
  │     ├── Training Load (acute, chronic, ratio)
  │     └── Biometric baselines and deviations
  │
  ├── Performance Outcomes (ground truth)
  │     ├── Practice ratings (self, coach)
  │     ├── Game statistics (sport-specific)
  │     ├── Competition results
  │     └── Clutch/pressure situation performance
  │
  ├── Intervention History
  │     ├── What was recommended
  │     ├── What was done
  │     ├── Context of intervention
  │     ├── Measured outcome
  │     └── Effectiveness score (learned over time)
  │
  └── Personal Model (ML-derived)
        ├── Performance prediction coefficients
        ├── Risk factor weights
        ├── Intervention response profile
        └── Optimal state targets
```

---

## Key Differentiators

### 1. The Prediction Flywheel
More athletes → More data → Better predictions → More value → More athletes

### 2. Personalization Depth
Not "athletes like you" but "what works for YOU specifically"
- Individual intervention effectiveness models
- Personal baseline and deviation tracking
- Context-aware recommendations

### 3. Evidence Loop
Every recommendation generates outcome data → improves future recommendations

### 4. Multi-Modal Signal Fusion
Mental state + Physical recovery + Training load + Context = Prediction
- No single signal is reliable; combination is powerful
- Sport-specific weighting of signals

### 5. Coach Efficiency Multiplier
Not replacing the coach, but giving them superhuman awareness:
- "Here are the 3 athletes who need you this week, why, and what to do"
- "Your intervention with Sarah worked; here's the evidence"
- "Team collective state suggests adjust Wednesday practice intensity"

---

## Implementation Phases

### Phase 1: Foundation (Current → 3 months)
**Goal:** Prove the core loop works

- [ ] WHOOP integration (OAuth, data sync)
- [ ] Performance outcome tracking (game stats input)
- [ ] Basic correlation dashboard (mental state vs outcomes)
- [ ] Intervention logging with outcome tracking
- [ ] Simple prediction model (v1: rule-based + regression)

**Metric:** Can we show a coach one insight they couldn't see before?

### Phase 2: Intelligence (3-6 months)
**Goal:** Predictions that are actually useful

- [ ] ML prediction models (per-athlete, per-sport)
- [ ] Intervention effectiveness tracking
- [ ] Personalized recommendation engine
- [ ] Pre-competition readiness optimization
- [ ] Team-level analytics

**Metric:** Prediction accuracy > 70% on performance deviation

### Phase 3: Platform (6-12 months)
**Goal:** Defensible data advantage

- [ ] Multi-sport model library
- [ ] Cross-athlete learning (privacy-preserving)
- [ ] Real-time game-day insights
- [ ] Coach collaboration tools
- [ ] API for athletic department integration

**Metric:** Retention > 90%, NPS > 50

---

## MCP Server Redesign

### Current Agents
- AthleteAgent (basic chat)
- CoachAgent (summaries)
- GovernanceAgent (crisis detection)
- KnowledgeAgent (RAG)

### New Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR                             │
│   Routes requests, manages context, coordinates multi-agent     │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   DIALOGUE    │       │  ANALYTICS    │       │   READINESS   │
│    AGENT      │       │    AGENT      │       │    AGENT      │
│               │       │               │       │               │
│ - Athlete     │       │ - Patterns    │       │ - Prediction  │
│   conversations│      │ - Correlations│       │ - Optimization│
│ - Check-ins   │       │ - Insights    │       │ - Game-day    │
│ - Coaching    │       │ - Reports     │       │ - Recovery    │
└───────────────┘       └───────────────┘       └───────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         TOOLS LAYER                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ get_athlete_ │  │ predict_     │  │ recommend_   │          │
│  │ state()      │  │ performance()│  │ intervention()│         │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ get_physical_│  │ analyze_     │  │ generate_    │          │
│  │ data()       │  │ patterns()   │  │ insight()    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ log_         │  │ get_team_    │  │ search_      │          │
│  │ intervention()│ │ overview()   │  │ research()   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### New Tools Required

```python
# Prediction Tools
predict_performance(athlete_id, game_date, context) → {
  predicted_deviation: float,  # % from baseline
  confidence: float,
  risk_factors: [{factor, impact, actionable}],
  recommended_actions: [...]
}

# Intervention Tools
recommend_intervention(athlete_id, situation_type) → {
  interventions: [{
    protocol: str,
    evidence: {times_used, avg_improvement, confidence},
    personalized_adjustments: str
  }]
}

log_intervention(athlete_id, intervention_type, context) → intervention_id
record_intervention_outcome(intervention_id, outcome_metrics) → effectiveness_score

# Analytics Tools
get_performance_correlation(athlete_id, mental_metric, performance_metric, time_range) → {
  correlation: float,
  significance: float,
  visualization_data: [...]
}

analyze_team_dynamics(team_id) → {
  collective_state: {...},
  influence_map: {...},
  risk_athletes: [...],
  optimization_suggestions: [...]
}

# Integration Tools
sync_wearable_data(athlete_id, provider) → {last_sync, data_points}
import_game_stats(game_id, stats_source) → {imported_metrics}
```

---

## Database Schema Additions

```prisma
// Performance Outcomes - The Ground Truth
model PerformanceOutcome {
  id            String   @id @default(cuid())
  athleteId     String
  date          DateTime
  outcomeType   OutcomeType  // PRACTICE, GAME, COMPETITION

  // Sport-agnostic metrics
  overallRating     Float?      // 1-10 scale
  consistencyScore  Float?      // Variance from expected
  clutchScore       Float?      // Performance in pressure moments

  // Sport-specific (JSON for flexibility)
  sportMetrics      Json?       // {points: 24, assists: 8, ...}

  // Context
  opponent          String?
  stakes            StakesLevel // LOW, MEDIUM, HIGH, CRITICAL
  homeAway          HomeAway?

  // Mental state snapshot at game time
  preGameMentalState Json?      // Captured readiness scores

  Athlete       Athlete  @relation(fields: [athleteId], references: [userId])

  @@index([athleteId, date])
}

// Intervention Tracking
model Intervention {
  id            String   @id @default(cuid())
  athleteId     String

  // What
  interventionType  InterventionType  // BREATHING, VISUALIZATION, SELF_TALK, ROUTINE, etc.
  protocol          String            // Specific protocol name
  description       String?

  // When/Context
  performedAt       DateTime
  context           InterventionContext  // PRE_GAME, POST_ERROR, SLUMP, etc.
  situationType     String?              // More specific tagging

  // Source
  recommendedBy     RecommendationSource  // AI, COACH, SELF
  wasRecommended    Boolean              // Did we suggest this?

  // Outcome tracking
  outcomeRecorded   Boolean  @default(false)
  effectivenessScore Float?   // Calculated from outcome
  athleteFeedback   String?

  // Link to performance outcome if applicable
  relatedOutcomeId  String?

  Athlete       Athlete  @relation(fields: [athleteId], references: [userId])

  @@index([athleteId, performedAt])
  @@index([interventionType, effectivenessScore])
}

// Athlete Personal Model (ML-derived, updated periodically)
model AthleteModel {
  id            String   @id @default(cuid())
  athleteId     String   @unique

  // Performance prediction weights
  predictionCoefficients  Json    // {hrv_weight: 0.3, sleep_weight: 0.25, ...}

  // Intervention effectiveness profile
  interventionProfile     Json    // {breathing: {avg_effect: 0.23, n: 12}, ...}

  // Personal baselines
  baselineMetrics         Json    // {avg_hrv: 65, avg_sleep: 7.2, ...}
  optimalStateProfile     Json    // {target_hrv: 70, target_sleep: 8, ...}

  // Model metadata
  lastUpdated             DateTime
  dataPointsUsed          Int
  modelVersion            String

  Athlete       Athlete  @relation(fields: [athleteId], references: [userId])
}

// Wearable Data (normalized from various sources)
model WearableDataPoint {
  id            String   @id @default(cuid())
  athleteId     String
  source        WearableSource  // WHOOP, GARMIN, OURA, APPLE_WATCH
  recordedAt    DateTime

  // Normalized metrics (not all sources have all)
  hrv               Float?
  restingHR         Float?
  sleepDuration     Float?    // hours
  sleepQuality      Float?    // 0-100
  sleepStages       Json?     // {deep: 1.5, rem: 2.0, light: 3.5}
  strain            Float?    // 0-21 (WHOOP scale, normalized)
  recovery          Float?    // 0-100
  calories          Float?

  // Raw data preserved
  rawData           Json?

  Athlete       Athlete  @relation(fields: [athleteId], references: [userId])

  @@index([athleteId, recordedAt])
  @@index([source, recordedAt])
}

enum OutcomeType {
  PRACTICE
  SCRIMMAGE
  GAME
  COMPETITION
  TOURNAMENT
}

enum StakesLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum HomeAway {
  HOME
  AWAY
  NEUTRAL
}

enum InterventionType {
  BREATHING
  VISUALIZATION
  SELF_TALK
  ROUTINE_ADJUSTMENT
  FOCUS_CUE
  AROUSAL_REGULATION
  GOAL_SETTING
  COGNITIVE_REFRAME
  MINDFULNESS
  OTHER
}

enum InterventionContext {
  PRE_GAME
  PRE_PRACTICE
  POST_ERROR
  HALFTIME
  TIMEOUT
  POST_GAME
  POST_LOSS
  SLUMP
  INJURY_RETURN
  HIGH_PRESSURE
  DAILY_ROUTINE
}

enum RecommendationSource {
  AI_RECOMMENDED
  COACH_ASSIGNED
  SELF_INITIATED
}

enum WearableSource {
  WHOOP
  GARMIN
  OURA
  APPLE_WATCH
  FITBIT
  POLAR
  MANUAL
}
```

---

## Success Metrics

### For Athletes
- Performance improvement (actual game stats trend)
- Consistency improvement (reduced variance)
- Faster recovery from setbacks
- Self-reported confidence in mental game

### For Coaches
- Time saved per athlete (hours/week)
- Prediction accuracy (% of flagged athletes who needed intervention)
- Intervention success rate
- Team performance trends

### For Platform
- Prediction accuracy vs actual outcomes
- Recommendation acceptance rate
- Intervention effectiveness improvement over time
- Data completeness (% of athletes with full data)

---

## Competitive Moat

1. **Data Network Effect:** More athletes → better models → more value → more athletes
2. **Personalization Depth:** Individual models require longitudinal data competitors don't have
3. **Sport-Specific Intelligence:** Deep models per sport/position take time to build
4. **Integration Depth:** Wearable + performance + mental = unique dataset
5. **Evidence Loop:** Continuous improvement from intervention tracking

---

## Open Questions

1. **Privacy:** How to do cross-athlete learning while preserving privacy?
2. **Validation:** How to validate predictions without waiting for game outcomes?
3. **Adoption:** How to get athletes to log enough data for models to work?
4. **Integration:** Which wearable/stats integrations are highest priority?
5. **Sport Priority:** Start deep in one sport or broad across many?

---

*Last Updated: 2026-01-10*
*Status: Vision Document - Not Yet Implemented*
