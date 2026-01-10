# AI Sports Agent - Component Status & Roadmap

Complete breakdown of every major component, its current stage, and what's needed for staging/production.

---

## Data Storage Layer

### 1. PostgreSQL (Supabase)
**Purpose:** Primary data store for users, athletes, mood logs, chat sessions, goals
**Current Status:** ✅ Configured, schema deployed

| Aspect | Status | Notes |
|--------|--------|-------|
| Schema | ✅ Done | Prisma schema in apps/web, SQLAlchemy models in MCP server |
| Connection | ✅ Working | Using Supabase pooler |
| RLS Policies | ⚠️ Partial | Need audit of all 40+ tables |
| Migrations | ✅ Working | Via Prisma |

**For Staging:** Working as-is
**For Production:**
- [ ] Audit all RLS policies (row-level security)
- [ ] Set up read replicas for coach dashboard queries
- [ ] Configure connection pooling limits
- [ ] Set up automated backups verification

---

### 2. Redis
**Purpose:** Rate limiting, cost tracking, circuit breakers, session caching
**Current Status:** ⚠️ Optional (graceful fallback if unavailable)

| Aspect | Status | Notes |
|--------|--------|-------|
| Rate Limiting | ✅ Implemented | Falls back to in-memory if Redis unavailable |
| Cost Tracking | ✅ Implemented | Per-user/tenant/global spend tracking |
| Circuit Breakers | ✅ Implemented | Auto-blocks requests when budget exceeded |
| Session Cache | ⚠️ Planned | Currently using in-memory |

**Current Usage in Code:**
- `app/middleware/cost_control.py` - Rate limits, budget tracking, circuit breakers
- `app/orchestrator/context_manager.py` - Optional session persistence

**For Staging:** Not required (uses in-memory fallback)
**For Production:**
- [ ] Deploy Redis instance (Railway addon or Upstash)
- [ ] Set `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` env vars
- [ ] Enable Redis for session caching (reduces DB load)
- [ ] Configure Redis persistence (AOF) for cost tracking durability

**Recommendation:** Skip Redis for staging to save costs. Add for production when you have 50+ concurrent users.

---

### 3. ChromaDB (Vector Store)
**Purpose:** RAG knowledge base for sports psychology content
**Current Status:** ✅ Local, populated with 9 chunks

| Aspect | Status | Notes |
|--------|--------|-------|
| Local Setup | ✅ Working | `./chroma_data/` |
| Content Ingested | ✅ Done | 9 chunks from KB |
| Query API | ✅ Working | Semantic search with filtering |
| Production Deploy | ❌ Not done | Need Chroma Cloud or self-hosted |

**For Staging:** Use local ChromaDB (data stored in `chroma_data/`)
**For Production:**
- [ ] Deploy to Chroma Cloud OR self-host on Railway
- [ ] Re-ingest knowledge base to production instance
- [ ] Set `CHROMA_HOST` env var
- [ ] Add more content (research papers, case studies)

---

## ML/Algorithm Components

### 4. Slump Detector (`app/ml/slump_detector.py`)
**Purpose:** Detect performance slumps and mental decline patterns
**Current Accuracy:** 44% (needs tuning)

| Strategy | Status | Description |
|----------|--------|-------------|
| Moving Average Crossover | ✅ Implemented | Short-term vs long-term trend |
| Consecutive Decline | ✅ Implemented | 3+ days declining |
| Volatility Spike | ✅ Implemented | Sudden variability increase |
| Multi-metric Divergence | ✅ Implemented | Mood vs confidence divergence |
| Pattern Matching | ✅ Implemented | 6 slump signature patterns |
| Engagement Withdrawal | ✅ Implemented | Reduced check-in frequency |

**Current Issues:**
- 25% recall (missing 75% of slumps)
- Thresholds calibrated for generic data, not real athletes

**To Maximize:**
- [ ] Collect 60+ days of real pilot data
- [ ] Tune `decline_threshold` (currently 0.5, try 0.3-0.7)
- [ ] Tune `volatility_threshold` (currently 2.0, try 1.5-2.5)
- [ ] Add sport-specific thresholds (swimmers vs golfers differ)
- [ ] Add time-of-season awareness (pre-season vs championship)

**Target Accuracy:** 70%+ recall, 60%+ precision

---

### 5. Performance Predictor (`app/ml/predictor.py`)
**Purpose:** Predict 7-day performance risk using XGBoost
**Current Status:** ⚠️ Rule-based fallback (XGBoost not installed)

| Mode | Status | Accuracy |
|------|--------|----------|
| XGBoost Model | ❌ Not trained | N/A |
| Rule-based Fallback | ✅ Working | ~30% precision |
| SHAP Explainability | ❌ Not available | Requires XGBoost |

**Feature Weights (Rule-based):**
```
latest_mood: 0.15
latest_confidence: 0.20
latest_stress: -0.15
latest_energy: 0.10
latest_sleep: 0.10
mood_trend: 0.08
confidence_trend: 0.10
```

**To Maximize:**
- [ ] Install XGBoost: `pip install xgboost shap scikit-learn scipy`
- [ ] Train model on synthetic data first: `python scripts/train_predictor.py`
- [ ] Retrain on pilot data (minimum 20 athletes × 60 days)
- [ ] Tune hyperparameters (max_depth, learning_rate, n_estimators)
- [ ] Add SHAP explanations for coach dashboard

**Target:** 50%+ precision on high-risk predictions

---

### 6. Feature Extractor (`app/ml/feature_extractor.py`)
**Purpose:** Extract ML features from multi-modal athlete data
**Current Status:** ✅ Working

| Feature Category | Count | Status |
|-----------------|-------|--------|
| Mood Features | 8 | ✅ Working |
| Biometric Features | 6 | ✅ Working (if data available) |
| Chat Features | 5 | ✅ Working |
| Temporal Features | 4 | ✅ Working |
| Trend Features | 6 | ✅ Working |
| Performance Features | 3 | ✅ Working |

**Total: ~32 features**

**To Maximize:**
- [ ] Add sport-specific features (e.g., swimmer taper, football contact load)
- [ ] Add academic calendar features (midterms, finals)
- [ ] Add competition proximity features
- [ ] Normalize features for XGBoost training

---

### 7. Correlation Engine (`app/ml/correlation_engine.py`)
**Purpose:** Find statistical correlations between metrics
**Current Status:** ⚠️ Basic implementation (scipy not installed)

| Analysis | Status | Notes |
|----------|--------|-------|
| Pearson Correlation | ⚠️ Fallback | Basic numpy implementation |
| Spearman Correlation | ❌ Needs scipy | |
| Significance Testing | ❌ Needs scipy | |
| Lag Correlation | ✅ Implemented | Find delayed effects |

**To Maximize:**
- [ ] Install scipy: `pip install scipy`
- [ ] Enable full correlation analysis
- [ ] Add visualization output for coach dashboard
- [ ] Add rolling correlation windows

---

### 8. Intervention Recommender (`app/ml/intervention_recommender.py`)
**Purpose:** Recommend evidence-based interventions
**Current Status:** ✅ Working

| Category | Interventions | Status |
|----------|--------------|--------|
| Breathing | 3 | ✅ 4-7-8, box breathing, PMR |
| Cognitive | 4 | ✅ Self-talk, reframing, strengths recall |
| Visualization | 3 | ✅ Success imagery, PETTLEP |
| Routine | 3 | ✅ Pre-competition, recovery |
| Relaxation | 2 | ✅ PMR, body scan |
| Focus | 3 | ✅ Attention control, cue words |
| + More | 27+ | ✅ Total 45+ interventions |

**To Maximize:**
- [ ] Add historical effectiveness tracking per athlete
- [ ] Add sport-specific intervention weighting
- [ ] Add time-of-day recommendations
- [ ] Connect to knowledge base for detailed protocols

---

## Agent Components

### 9. Athlete Agent (`app/agents/athlete_agent.py`)
**Purpose:** Main conversation agent for athletes
**Current Status:** ✅ Implemented (39KB, ~1000 lines)

| Feature | Status | Notes |
|---------|--------|-------|
| 6-Phase Protocol | ✅ Implemented | CHECK_IN → WRAP_UP |
| Sport-Specific Prompts | ✅ Implemented | 11 sports |
| Crisis Detection | ✅ Integrated | Calls GovernanceAgent |
| Memory/Context | ✅ Implemented | Conversation history |
| RAG Integration | ✅ Implemented | Queries knowledge base |
| Tool Calling | ✅ Implemented | Mood logging, goals |

**To Maximize:**
- [ ] Fine-tune phase transition logic
- [ ] Add more sport-specific interventions
- [ ] Improve follow-up question generation
- [ ] Add session summarization

---

### 10. Coach Agent (`app/agents/coach_agent.py`)
**Purpose:** Analytics and insights for coaches
**Current Status:** ✅ Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Team Summary | ✅ Implemented | Aggregated mood/stress |
| Risk Alerts | ✅ Implemented | High-risk athlete flags |
| Trend Analysis | ✅ Implemented | Week-over-week changes |
| Anonymization | ✅ Implemented | No individual data exposure |

**To Maximize:**
- [ ] Add visualization data for charts
- [ ] Add comparative benchmarks (team vs league)
- [ ] Add intervention effectiveness reports

---

### 11. Governance Agent (`app/agents/governance_agent.py`)
**Purpose:** Crisis detection and safety monitoring
**Current Status:** ✅ Implemented

| Detection Type | Status | Notes |
|---------------|--------|-------|
| Self-harm Language | ✅ Implemented | Keyword + pattern matching |
| Suicidal Ideation | ✅ Implemented | Escalation trigger |
| Eating Disorder | ✅ Implemented | Red flag detection |
| Abuse Disclosure | ✅ Implemented | Mandatory reporting |
| Severe Depression | ✅ Implemented | Pattern matching |

**To Maximize:**
- [ ] Add ML-based classification (not just keywords)
- [ ] Reduce false positives with context understanding
- [ ] Add audit logging for compliance
- [ ] Test with adversarial inputs

**CRITICAL:** Must have 100% recall on true crises. False negatives unacceptable.

---

### 12. Knowledge Agent (`app/agents/knowledge_agent.py`)
**Purpose:** RAG interface for knowledge base
**Current Status:** ✅ Working

| Feature | Status | Notes |
|---------|--------|-------|
| PDF Ingestion | ✅ Implemented | Chunking + embedding |
| Text Ingestion | ✅ Implemented | Via ingest_text.py |
| Semantic Search | ✅ Working | OpenAI embeddings |
| Metadata Filtering | ✅ Implemented | Sport, framework, phase |
| Auto-tagging | ✅ Implemented | Keyword extraction |

**To Maximize:**
- [ ] Add more content (target: 100+ chunks)
- [ ] Add query rewriting for better retrieval
- [ ] Add re-ranking for relevance
- [ ] Add citation tracking

---

### 13. Readiness Engine (`app/agents/readiness_engine.py`)
**Purpose:** Pre-competition readiness assessment
**Current Status:** ✅ Implemented

| Assessment | Status | Notes |
|-----------|--------|-------|
| Mental Readiness | ✅ Implemented | Mood, confidence, focus |
| Physical Readiness | ✅ Implemented | Sleep, energy, soreness |
| Competition Anxiety | ✅ Implemented | Pre-game nerves |
| Recommendations | ✅ Implemented | Personalized prep plan |

**To Maximize:**
- [ ] Add biometric integration (HRV, sleep tracker)
- [ ] Add historical comparison (vs last competition)
- [ ] Add team readiness aggregation

---

## Orchestration Components

### 14. Intent Classifier (`app/orchestrator/intent_classifier.py`)
**Purpose:** Classify user intent to route to correct agent
**Current Status:** ✅ Implemented

| Intent | Status | Routes To |
|--------|--------|-----------|
| CRISIS | ✅ | GovernanceAgent |
| MOOD_LOG | ✅ | AthleteAgent |
| GOAL_SETTING | ✅ | AthleteAgent |
| READINESS_CHECK | ✅ | ReadinessEngine |
| KNOWLEDGE_QUERY | ✅ | KnowledgeAgent |
| GENERAL_CHAT | ✅ | AthleteAgent |

**To Maximize:**
- [ ] Add ML-based classification (currently rule-based)
- [ ] Add confidence scoring
- [ ] Add multi-intent detection

---

### 15. Router (`app/orchestrator/router.py`)
**Purpose:** Route requests to appropriate agents
**Current Status:** ✅ Implemented

---

### 16. Context Manager (`app/orchestrator/context_manager.py`)
**Purpose:** Manage conversation context and memory
**Current Status:** ✅ Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| In-memory Context | ✅ Working | Default |
| Redis Context | ⚠️ Optional | Set `use_redis=True` |
| Context Summarization | ✅ Implemented | For long conversations |
| Athlete Memory | ✅ Implemented | Persistent preferences |

---

## Voice Components

### 17. Speech-to-Text (`app/voice/stt.py`, `deepgram_stt.py`)
**Purpose:** Convert athlete speech to text
**Current Status:** ✅ Implemented

| Provider | Status | Notes |
|----------|--------|-------|
| OpenAI Whisper | ✅ Implemented | Default, good quality |
| Deepgram | ✅ Implemented | Lower latency option |

**To Maximize:**
- [ ] Add streaming STT for real-time
- [ ] Add noise cancellation preprocessing
- [ ] Add sports terminology custom vocabulary

---

### 18. Text-to-Speech (`app/voice/tts.py`, `elevenlabs_tts.py`)
**Purpose:** Convert AI responses to speech
**Current Status:** ✅ Implemented

| Provider | Status | Notes |
|----------|--------|-------|
| OpenAI TTS | ✅ Implemented | Default |
| ElevenLabs | ✅ Implemented | More natural voices |

**To Maximize:**
- [ ] Add voice selection per athlete preference
- [ ] Add SSML support for better prosody
- [ ] Add streaming TTS for faster response

---

## Summary: Priority Actions

### For Staging (Current)
1. ✅ PostgreSQL - Working
2. ✅ ChromaDB (local) - Working
3. ⏭️ Redis - Skip (use fallback)
4. ⚠️ ML Models - Rule-based mode acceptable

### For Production

**High Priority:**
1. [ ] Install full ML dependencies (`xgboost scipy scikit-learn`)
2. [ ] Train predictor on pilot data
3. [ ] Tune slump detector thresholds
4. [ ] Deploy Redis for rate limiting
5. [ ] Audit RLS policies

**Medium Priority:**
6. [ ] Deploy ChromaDB to cloud
7. [ ] Add more KB content (100+ chunks)
8. [ ] Add ML-based intent classification
9. [ ] Add historical intervention tracking

**Lower Priority:**
10. [ ] Add biometric integrations
11. [ ] Add streaming voice
12. [ ] Add sport-specific model variants

---

## Quick Reference: Install Full ML Stack

```bash
cd services/mcp-server
source venv/bin/activate

# Install full ML dependencies
pip install xgboost shap scikit-learn scipy

# Regenerate training data
python scripts/generate_training_data.py --athletes 100 --days 120

# Validate models
python scripts/validate_ml_models.py --verbose

# Train XGBoost predictor (script needed)
python scripts/train_predictor.py  # TODO: create this
```
