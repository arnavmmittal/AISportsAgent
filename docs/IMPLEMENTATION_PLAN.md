# Implementation Plan: Mental Performance Intelligence Platform

## What Stays (Enhanced)

| Component | Current | Enhanced |
|-----------|---------|----------|
| **Chat Interface** | AI conversations | + Intervention suggestions + Outcome prompts |
| **Knowledge Base (RAG)** | Sports psych research | + Protocol library + Effectiveness data |
| **Crisis Detection** | Keyword detection | Same (safety requirement, not feature) |
| **Mood Tracking** | Manual 1-10 scales | + Auto-correlate with outcomes |
| **Goals** | CRUD operations | + Progress tied to performance data |
| **Coach Dashboard** | Team overview | + Predictions + Evidence + Intervention tracking |

---

## Implementation Phases

### Phase 1: Data Foundation (Week 1-2)
**Goal:** Capture the data needed for predictions

#### 1.1 Database Schema Updates
```
New Models:
├── PerformanceOutcome (game stats, practice ratings)
├── Intervention (what was done + context)
├── InterventionOutcome (measured effect)
├── WearableDataPoint (normalized from WHOOP/etc)
├── AthleteBaseline (personal averages)
└── PredictionLog (track prediction accuracy)

Updated Models:
├── MoodLog (add: preGame flag, context tags)
├── ChatSession (add: interventionsSuggested)
├── Message (add: interventionType if applicable)
└── Athlete (add: baselineMetrics JSON)
```

#### 1.2 Performance Outcome Tracking
- Coach can input game/practice results
- API: `POST /api/performance-outcomes`
- UI: Simple form in coach dashboard
- Fields: date, type, sport-specific metrics, context

#### 1.3 Intervention Logging
- Track when athlete uses a technique
- Prompted after chat suggests intervention
- API: `POST /api/interventions`
- Outcome recording: `PATCH /api/interventions/:id/outcome`

---

### Phase 2: WHOOP Integration (Week 2-3)
**Goal:** Bring in physical recovery data

#### 2.1 OAuth Flow
- WHOOP Developer API registration
- OAuth 2.0 implementation
- Token storage (encrypted in DB)
- Refresh token handling

#### 2.2 Data Sync Service
- Background job to pull WHOOP data
- Normalize to WearableDataPoint model
- Metrics: HRV, sleep, strain, recovery
- Sync frequency: Every 4 hours

#### 2.3 Athlete Settings
- Connect/disconnect wearable
- Data sharing preferences
- View sync status

---

### Phase 3: Correlation Engine (Week 3-4)
**Goal:** Find patterns in the data

#### 3.1 Basic Correlations
- Mental state (mood, confidence, stress) vs outcomes
- Sleep vs performance
- HRV vs clutch performance
- Pre-game state vs game results

#### 3.2 Analytics API
- `GET /api/analytics/correlations/:athleteId`
- `GET /api/analytics/patterns/:athleteId`
- `GET /api/analytics/team-trends`

#### 3.3 Visualization Components
- Correlation heatmaps
- Trend overlays (mental + physical + outcomes)
- Pattern detection highlights

---

### Phase 4: Intervention Effectiveness (Week 4-5)
**Goal:** Track what actually works

#### 4.1 Effectiveness Calculation
- Match interventions to subsequent outcomes
- Calculate effect size per intervention type
- Build per-athlete effectiveness profile

#### 4.2 Recommendation Engine
- Query: "What works for THIS athlete in THIS situation?"
- Rank by: past effectiveness + context match + evidence base
- API: `GET /api/recommendations/:athleteId?context=pre_game`

#### 4.3 Chat Integration
- AI suggests interventions based on effectiveness data
- Prompt: "Last time you used 4-7-8 breathing before a game, your performance improved 15%"
- After chat: "Did you try the technique? How did it go?"

---

### Phase 5: Prediction Model (Week 5-7)
**Goal:** Predict performance before it happens

#### 5.1 Feature Engineering
```python
Features per prediction:
├── Mental State (last 7 days trend)
│   ├── mood_avg, mood_trend, mood_variance
│   ├── confidence_avg, confidence_trend
│   ├── stress_avg, stress_trend
│   └── pre_game_anxiety_score (if applicable)
│
├── Physical State (last 3 days)
│   ├── hrv_avg, hrv_vs_baseline
│   ├── sleep_avg, sleep_quality
│   ├── recovery_score
│   └── strain_load (acute:chronic ratio)
│
├── Context
│   ├── opponent_strength (if known)
│   ├── home_away
│   ├── stakes_level
│   ├── days_since_last_game
│   └── season_phase
│
└── Historical
    ├── performance_baseline
    ├── performance_variance
    ├── similar_context_outcomes
    └── recent_trend (last 5 games)
```

#### 5.2 Model Training
- Start with: XGBoost regression for performance deviation
- Target: % deviation from baseline performance
- Training data: historical outcomes + state at time of game
- Validation: Leave-one-out per athlete

#### 5.3 Prediction API
```
GET /api/predictions/:athleteId?date=2024-01-15

Response:
{
  "predictedDeviation": -0.12,  // 12% below baseline
  "confidence": 0.73,
  "riskLevel": "MEDIUM",
  "contributingFactors": [
    {"factor": "sleep_deficit", "impact": -0.05, "actionable": true},
    {"factor": "elevated_stress", "impact": -0.04, "actionable": true},
    {"factor": "opponent_strength", "impact": -0.03, "actionable": false}
  ],
  "recommendedActions": [
    {"action": "Extra 30min sleep tonight", "expectedImpact": +0.03},
    {"action": "Pre-game breathing routine", "expectedImpact": +0.02}
  ]
}
```

---

### Phase 6: Coach Intelligence Dashboard (Week 7-8)
**Goal:** Surface actionable insights

#### 6.1 Team Readiness View
- All athletes ranked by predicted performance
- Risk indicators (who needs attention)
- Quick actions per athlete

#### 6.2 Pre-Game Report
- Auto-generated before competition
- Per-athlete readiness + recommendations
- Team collective state assessment

#### 6.3 Post-Game Analysis
- Compare predictions to actuals
- Surface what worked/didn't
- Update effectiveness scores

#### 6.4 Evidence Dashboard
- "Your interventions this month"
- Success rates by type
- Athlete response patterns

---

## MCP Server Architecture

### Current State
```
MCP Server
├── AthleteAgent (chat)
├── CoachAgent (summaries)
├── GovernanceAgent (crisis)
└── KnowledgeAgent (RAG)
```

### Target State
```
MCP Server
├── Orchestrator
│   └── Routes requests, manages context
│
├── DialogueAgent (enhanced AthleteAgent)
│   ├── Conversation handling
│   ├── Intervention suggestions (from effectiveness data)
│   ├── Check-in prompts
│   └── Outcome capture
│
├── AnalyticsAgent (new)
│   ├── Pattern detection
│   ├── Correlation analysis
│   ├── Insight generation
│   └── Report creation
│
├── ReadinessAgent (new)
│   ├── Performance prediction
│   ├── Pre-game optimization
│   ├── Recovery recommendations
│   └── Risk assessment
│
├── InterventionAgent (new)
│   ├── Recommendation engine
│   ├── Effectiveness tracking
│   ├── Personalization
│   └── Protocol library
│
├── GovernanceAgent (unchanged)
│   └── Crisis detection (safety)
│
└── KnowledgeAgent (enhanced)
    ├── Sports psych research (RAG)
    ├── Protocol library
    └── Effectiveness evidence
```

### New Tools for Agents

```python
# Prediction Tools
@tool
def predict_performance(athlete_id: str, game_date: str, context: dict) -> PredictionResult:
    """Predict athlete performance for upcoming competition"""

@tool
def get_risk_factors(athlete_id: str) -> list[RiskFactor]:
    """Get current risk factors affecting predicted performance"""

# Intervention Tools
@tool
def recommend_intervention(athlete_id: str, situation: str) -> list[Intervention]:
    """Get personalized intervention recommendations with effectiveness data"""

@tool
def log_intervention(athlete_id: str, type: str, context: str) -> str:
    """Log that an intervention was performed"""

@tool
def record_outcome(intervention_id: str, outcome: dict) -> EffectivenessScore:
    """Record the outcome of an intervention"""

# Analytics Tools
@tool
def get_correlations(athlete_id: str, metric_pairs: list) -> list[Correlation]:
    """Get correlations between mental/physical state and outcomes"""

@tool
def detect_patterns(athlete_id: str, lookback_days: int) -> list[Pattern]:
    """Detect patterns in athlete data"""

@tool
def generate_insight(athlete_id: str, insight_type: str) -> Insight:
    """Generate a natural language insight about the athlete"""

# Data Tools
@tool
def get_athlete_state(athlete_id: str) -> AthleteState:
    """Get current mental + physical state"""

@tool
def get_wearable_data(athlete_id: str, days: int) -> list[WearableDataPoint]:
    """Get recent wearable data"""

@tool
def get_performance_history(athlete_id: str, limit: int) -> list[PerformanceOutcome]:
    """Get recent performance outcomes"""
```

---

## API Endpoints (New)

### Performance Outcomes
```
POST   /api/performance-outcomes          # Record game/practice result
GET    /api/performance-outcomes          # List outcomes (filtered)
GET    /api/performance-outcomes/:id      # Get specific outcome
PATCH  /api/performance-outcomes/:id      # Update outcome
```

### Interventions
```
POST   /api/interventions                 # Log intervention
GET    /api/interventions                 # List interventions
PATCH  /api/interventions/:id/outcome     # Record outcome
GET    /api/interventions/effectiveness   # Get effectiveness stats
```

### Predictions
```
GET    /api/predictions/:athleteId        # Get prediction for athlete
GET    /api/predictions/team              # Get team predictions
POST   /api/predictions/validate          # Compare prediction to actual
```

### Analytics
```
GET    /api/analytics/correlations/:athleteId
GET    /api/analytics/patterns/:athleteId
GET    /api/analytics/trends/:athleteId
GET    /api/analytics/team-overview
GET    /api/analytics/intervention-effectiveness
```

### Wearables
```
GET    /api/wearables/connect/:provider   # Start OAuth flow
GET    /api/wearables/callback/:provider  # OAuth callback
GET    /api/wearables/status              # Sync status
POST   /api/wearables/sync                # Force sync
DELETE /api/wearables/disconnect          # Remove integration
```

### Reports
```
GET    /api/reports/pre-game/:athleteId   # Pre-game readiness report
GET    /api/reports/weekly/:athleteId     # Weekly summary
GET    /api/reports/team-readiness        # Team pre-game report
GET    /api/reports/intervention-roi      # Coach intervention ROI
```

---

## Database Schema (Detailed)

```prisma
// ============================================
// PERFORMANCE TRACKING
// ============================================

model PerformanceOutcome {
  id            String   @id @default(cuid())
  athleteId     String
  date          DateTime

  // Type
  outcomeType   OutcomeType   // PRACTICE, SCRIMMAGE, GAME, TOURNAMENT

  // Universal metrics (1-10 or 0-100)
  overallRating     Float?      // Self or coach rated
  consistencyScore  Float?      // Variance from expected
  clutchScore       Float?      // Pressure moment performance
  effortScore       Float?      // Perceived exertion
  focusScore        Float?      // Mental focus rating

  // Sport-specific (flexible JSON)
  sportMetrics      Json?       // {points: 24, rebounds: 8, ...}

  // Context
  opponent          String?
  stakes            StakesLevel
  homeAway          HomeAway?
  result            GameResult?  // WIN, LOSS, DRAW

  // Captured state at time of competition
  preEventMood         Float?
  preEventConfidence   Float?
  preEventStress       Float?
  preEventSleep        Float?
  preEventHRV          Float?
  preEventRecovery     Float?

  // Prediction tracking
  predictedDeviation   Float?      // What we predicted
  actualDeviation      Float?      // What happened (calculated)
  predictionAccuracy   Float?      // How close were we

  // Metadata
  recordedBy        String?        // Coach ID if coach entered
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  Athlete           Athlete  @relation(fields: [athleteId], references: [userId])
  Interventions     InterventionOutcome[]

  @@index([athleteId, date])
  @@index([outcomeType])
}

// ============================================
// INTERVENTION TRACKING
// ============================================

model Intervention {
  id            String   @id @default(cuid())
  athleteId     String

  // What
  type          InterventionType
  protocol      String              // Specific protocol name
  description   String?             // Details

  // When/Context
  performedAt   DateTime
  context       InterventionContext
  situation     String?             // Freeform situation description

  // How it was initiated
  source        InterventionSource  // AI_SUGGESTED, COACH_ASSIGNED, SELF
  suggestedInSessionId  String?     // Chat session that suggested it

  // Athlete feedback
  completed     Boolean  @default(false)
  athleteRating Float?              // 1-5 helpfulness rating
  athleteNotes  String?

  // Outcome tracking
  outcomes      InterventionOutcome[]

  // Calculated effectiveness (updated by system)
  effectivenessScore  Float?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  Athlete       Athlete  @relation(fields: [athleteId], references: [userId])
  ChatSession   ChatSession? @relation(fields: [suggestedInSessionId], references: [id])

  @@index([athleteId, performedAt])
  @@index([type])
  @@index([context])
}

model InterventionOutcome {
  id              String   @id @default(cuid())
  interventionId  String

  // Link to what happened after
  performanceOutcomeId  String?

  // Measured changes (vs baseline or prior state)
  moodChange          Float?
  confidenceChange    Float?
  stressChange        Float?
  focusChange         Float?
  performanceChange   Float?    // If linked to outcome

  // Timing
  measuredAt          DateTime
  hoursAfterIntervention  Float?

  // Notes
  notes               String?

  createdAt           DateTime @default(now())

  Intervention        Intervention @relation(fields: [interventionId], references: [id])
  PerformanceOutcome  PerformanceOutcome? @relation(fields: [performanceOutcomeId], references: [id])

  @@index([interventionId])
}

// ============================================
// WEARABLE INTEGRATION
// ============================================

model WearableConnection {
  id            String   @id @default(cuid())
  athleteId     String   @unique

  provider      WearableProvider
  accessToken   String            // Encrypted
  refreshToken  String?           // Encrypted
  tokenExpiry   DateTime?

  // Sync status
  lastSyncAt    DateTime?
  syncStatus    SyncStatus  @default(PENDING)
  syncError     String?

  // Preferences
  syncEnabled   Boolean  @default(true)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  Athlete       Athlete  @relation(fields: [athleteId], references: [userId])
}

model WearableDataPoint {
  id            String   @id @default(cuid())
  athleteId     String
  source        WearableProvider
  recordedAt    DateTime

  // Sleep
  sleepDuration     Float?    // hours
  sleepQuality      Float?    // 0-100
  sleepLatency      Float?    // minutes to fall asleep
  sleepEfficiency   Float?    // % time asleep vs in bed
  deepSleep         Float?    // hours
  remSleep          Float?    // hours
  lightSleep        Float?    // hours
  awakeTime         Float?    // hours

  // Recovery
  hrv               Float?    // ms (RMSSD)
  hrvBaseline       Float?    // personal baseline
  restingHR         Float?    // bpm
  recoveryScore     Float?    // 0-100

  // Strain/Activity
  strain            Float?    // WHOOP 0-21 or normalized
  calories          Float?
  activeMinutes     Float?

  // Respiratory
  respiratoryRate   Float?    // breaths/min
  spo2              Float?    // blood oxygen %

  // Raw data preserved
  rawData           Json?

  createdAt         DateTime @default(now())

  Athlete           Athlete  @relation(fields: [athleteId], references: [userId])

  @@unique([athleteId, source, recordedAt])
  @@index([athleteId, recordedAt])
}

// ============================================
// ATHLETE MODEL (ML-DERIVED)
// ============================================

model AthleteModel {
  id            String   @id @default(cuid())
  athleteId     String   @unique

  // Personal baselines
  baselineMood          Float?
  baselineConfidence    Float?
  baselineStress        Float?
  baselineHRV           Float?
  baselineSleep         Float?
  baselinePerformance   Float?

  // Optimal state (what state = best performance)
  optimalMood           Float?
  optimalConfidence     Float?
  optimalStress         Float?
  optimalHRV            Float?
  optimalSleep          Float?

  // Prediction model weights
  predictionWeights     Json?     // {mood: 0.2, hrv: 0.3, sleep: 0.25, ...}

  // Intervention effectiveness profile
  interventionProfile   Json?     // {breathing: {avg: 0.15, n: 8}, visualization: {...}}

  // Risk factors specific to this athlete
  riskFactors           Json?     // [{factor: "sleep_deficit", threshold: 6, impact: -0.08}]

  // Model metadata
  dataPointsUsed        Int       @default(0)
  lastTrainedAt         DateTime?
  modelVersion          String?
  accuracy              Float?    // Recent prediction accuracy

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  Athlete               Athlete   @relation(fields: [athleteId], references: [userId])
}

// ============================================
// PREDICTION LOGGING
// ============================================

model PredictionLog {
  id            String   @id @default(cuid())
  athleteId     String

  // When/What
  predictionDate    DateTime      // Date prediction was for
  createdAt         DateTime      // When prediction was made

  // Prediction
  predictedDeviation    Float     // % from baseline
  confidence            Float     // Model confidence
  riskLevel             RiskLevel

  // Features used (for debugging/analysis)
  featuresUsed          Json      // Snapshot of input features

  // Actual outcome (filled in later)
  actualDeviation       Float?
  outcomeId             String?   // Link to PerformanceOutcome

  // Accuracy (calculated when outcome known)
  predictionError       Float?    // Predicted - Actual
  wasAccurate           Boolean?  // Within acceptable threshold

  Athlete               Athlete   @relation(fields: [athleteId], references: [userId])

  @@index([athleteId, predictionDate])
}

// ============================================
// ENUMS
// ============================================

enum OutcomeType {
  PRACTICE
  SCRIMMAGE
  GAME
  TOURNAMENT
  COMPETITION
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

enum GameResult {
  WIN
  LOSS
  DRAW
}

enum InterventionType {
  BREATHING
  VISUALIZATION
  SELF_TALK
  ROUTINE
  FOCUS_CUE
  AROUSAL_REGULATION
  GOAL_SETTING
  COGNITIVE_REFRAME
  MINDFULNESS
  JOURNALING
  PHYSICAL_WARMUP
  OTHER
}

enum InterventionContext {
  PRE_GAME
  PRE_PRACTICE
  DURING_COMPETITION
  HALFTIME
  POST_ERROR
  POST_GAME
  POST_LOSS
  RECOVERY
  SLUMP
  INJURY_RETURN
  DAILY_ROUTINE
  ON_DEMAND
}

enum InterventionSource {
  AI_SUGGESTED
  COACH_ASSIGNED
  SELF_INITIATED
  PROTOCOL_SCHEDULED
}

enum WearableProvider {
  WHOOP
  GARMIN
  OURA
  APPLE_HEALTH
  FITBIT
  POLAR
}

enum SyncStatus {
  PENDING
  SYNCING
  SYNCED
  ERROR
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

---

## File Structure Changes

```
apps/web/src/
├── app/
│   ├── api/
│   │   ├── analytics/
│   │   │   ├── correlations/
│   │   │   ├── patterns/
│   │   │   └── trends/
│   │   ├── interventions/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── outcome/
│   │   ├── performance-outcomes/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   ├── predictions/
│   │   │   ├── route.ts
│   │   │   └── [athleteId]/
│   │   ├── reports/
│   │   │   ├── pre-game/
│   │   │   └── weekly/
│   │   └── wearables/
│   │       ├── connect/
│   │       ├── callback/
│   │       └── sync/
│   │
│   ├── coach/
│   │   ├── predictions/          # New: Team predictions view
│   │   ├── interventions/        # New: Intervention tracking
│   │   ├── outcomes/             # New: Log game results
│   │   └── analytics/            # Enhanced: Correlations
│   │
│   └── student/
│       ├── wearables/            # New: Connect WHOOP
│       └── progress/             # Enhanced: With predictions
│
├── lib/
│   ├── analytics/
│   │   ├── correlations.ts       # Correlation calculations
│   │   ├── patterns.ts           # Pattern detection
│   │   └── predictions.ts        # Prediction model interface
│   │
│   ├── interventions/
│   │   ├── effectiveness.ts      # Effectiveness calculations
│   │   ├── recommendations.ts    # Recommendation engine
│   │   └── protocols.ts          # Protocol library
│   │
│   └── wearables/
│       ├── whoop.ts              # WHOOP API client
│       ├── garmin.ts             # Garmin API client
│       └── sync.ts               # Sync orchestration
│
└── components/
    ├── analytics/
    │   ├── CorrelationChart.tsx
    │   ├── PredictionCard.tsx
    │   └── TrendOverlay.tsx
    │
    └── interventions/
        ├── InterventionLogger.tsx
        ├── EffectivenessCard.tsx
        └── RecommendationList.tsx
```

---

## Implementation Order

### Sprint 1 (Days 1-5): Schema + Core APIs
1. [ ] Add new Prisma models
2. [ ] Run migration
3. [ ] Create PerformanceOutcome CRUD API
4. [ ] Create Intervention CRUD API
5. [ ] Basic UI for coach to log outcomes

### Sprint 2 (Days 6-10): Intervention Tracking
1. [ ] Intervention logging in chat flow
2. [ ] Outcome recording flow
3. [ ] Effectiveness calculation service
4. [ ] Basic recommendation API

### Sprint 3 (Days 11-15): Wearable Integration
1. [ ] WHOOP OAuth flow
2. [ ] Data sync service
3. [ ] WearableDataPoint storage
4. [ ] Athlete wearable settings UI

### Sprint 4 (Days 16-20): Analytics
1. [ ] Correlation calculation service
2. [ ] Pattern detection
3. [ ] Analytics API endpoints
4. [ ] Visualization components

### Sprint 5 (Days 21-25): Predictions
1. [ ] Feature engineering pipeline
2. [ ] Prediction model (start simple)
3. [ ] Prediction API
4. [ ] Coach prediction dashboard

### Sprint 6 (Days 26-30): Polish + MCP
1. [ ] MCP server agent updates
2. [ ] New tools implementation
3. [ ] Pre-game report generation
4. [ ] End-to-end testing

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Coach can log game outcomes
- [ ] Interventions are tracked with outcomes
- [ ] Basic correlation visible (mood vs performance)

### Phase 2 Complete When:
- [ ] WHOOP data syncing
- [ ] Multi-signal correlations working
- [ ] Recommendations based on effectiveness data

### Phase 3 Complete When:
- [ ] Predictions with >60% accuracy
- [ ] Coach sees "who needs attention" with evidence
- [ ] Intervention ROI visible

---

*Created: 2026-01-10*
*Branch: feature/prediction-intelligence-backend*
