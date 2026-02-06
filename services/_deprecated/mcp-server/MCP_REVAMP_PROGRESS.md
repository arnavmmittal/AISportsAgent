# MCP Server Revamp Progress

## Overview

This document tracks the progress of revamping the MCP server to be the "AI Brain" of the platform.

**Branch**: `feature/mcp-server-revamp`
**Started**: 2026-01-10

## Goals

1. **Voice Pipeline** - ElevenLabs TTS + Deepgram/Whisper STT
2. **ML Prediction Engine** - XGBoost, statistical analysis, SHAP explainability
3. **Knowledge Base RAG** - ChromaDB + query rewriting + reranking
4. **Agent Orchestrator** - Route requests to appropriate agents
5. **Integration** - Connect Next.js app to use MCP for AI operations

---

## Implementation Progress

### Phase 1: Voice Pipeline

**Status**: COMPLETED

Files created/modified:
- `app/voice/elevenlabs_tts.py` - ElevenLabs TTS with streaming and voice profiles
- `app/voice/deepgram_stt.py` - Deepgram STT with emotion detection
- `app/voice/tts.py` - Unified TTS with provider fallback
- `app/voice/stt.py` - Unified STT with provider selection
- `app/voice/__init__.py` - Module exports
- `app/core/config.py` - Voice provider settings
- `app/api/routes/voice.py` - Voice API endpoints

Features:
- [x] ElevenLabs TTS with streaming
- [x] Context-aware voice selection (supportive, calm, encouraging, professional)
- [x] Voice profiles for emotional contexts
- [x] Deepgram STT with sentiment detection
- [x] Automatic provider failover
- [x] Emotion detection from transcript

---

### Phase 2: ML Prediction Engine

**Status**: COMPLETED

Files created:
- `app/ml/__init__.py` - Module exports
- `app/ml/feature_extractor.py` - Multi-modal feature extraction
- `app/ml/predictor.py` - XGBoost predictor with SHAP explanations
- `app/ml/slump_detector.py` - Pattern-based slump detection
- `app/ml/correlation_engine.py` - Statistical correlation analysis
- `app/ml/intervention_recommender.py` - Evidence-based intervention recommendations
- `app/api/routes/predictions.py` - ML API endpoints

Features:
- [x] Feature extraction from mood, biometrics, chat, performance
- [x] Performance risk prediction with SHAP explanations
- [x] Slump pattern detection (MA crossover, consecutive decline, volatility)
- [x] Statistical correlations (Pearson, Spearman, lagged)
- [x] Intervention recommendations with protocols
- [x] API endpoints: /predictions/risk, /predictions/slump, /predictions/correlations

---

### Phase 3: Knowledge Base RAG

**Status**: COMPLETED

Files created:
- `app/knowledge/__init__.py` - Module exports
- `app/knowledge/embeddings.py` - OpenAI embedding generation
- `app/knowledge/vectorstore.py` - ChromaDB vector store
- `app/knowledge/query_rewriter.py` - Query expansion and reformulation
- `app/knowledge/retriever.py` - Full retrieval pipeline with reranking
- `app/api/routes/knowledge.py` - Knowledge API endpoints

Features:
- [x] ChromaDB vector store integration
- [x] OpenAI embeddings (text-embedding-3-large)
- [x] Query rewriting with LLM
- [x] Query expansion with domain synonyms
- [x] LLM-based reranking
- [x] Context assembly with sources
- [x] API endpoints: /knowledge/query, /knowledge/add, /knowledge/status

---

### Phase 4: Agent Orchestrator

**Status**: COMPLETED

Files created:
- `app/orchestrator/__init__.py` - Module exports
- `app/orchestrator/intent_classifier.py` - Two-stage intent classification
- `app/orchestrator/context_manager.py` - Conversation state management
- `app/orchestrator/router.py` - Agent routing logic
- `app/api/routes/orchestrator.py` - Orchestrator API endpoints

Features:
- [x] Intent classifier with 15 intent types
- [x] Two-stage classification: fast keywords → LLM fallback
- [x] Crisis detection as first-pass check (always)
- [x] Conversation context with Discovery-First Protocol phases
- [x] Agent routing (Athlete, Coach, Knowledge, Governance)
- [x] Knowledge integration for technique/framework questions
- [x] Session emotional state tracking
- [x] Redis persistence option for horizontal scaling

---

### Phase 5: API Endpoints

**Status**: COMPLETED

Completed endpoints:
- [x] Voice: /voice/status, /voice/voices, /voice/synthesize, /voice/transcribe
- [x] Predictions: /predictions/risk, /predictions/slump, /predictions/correlations, /predictions/interventions
- [x] Knowledge: /knowledge/query, /knowledge/add, /knowledge/status, /knowledge/frameworks
- [x] Orchestrator: /orchestrator/chat, /orchestrator/classify, /orchestrator/context, /orchestrator/status

---

### Phase 6: Next.js Integration

**Status**: COMPLETED

Files modified:
- `apps/web/src/lib/mcp-client.ts` - Full MCP client with all new endpoints
- `apps/web/src/lib/api-client.ts` - API client class with new methods

Features:
- [x] Orchestrator API (chat, classify, context, status)
- [x] Knowledge API (query, frameworks, status)
- [x] Predictions API (risk, slump, correlations, interventions)
- [x] Voice API (synthesize, transcribe, voices, status)
- [x] TypeScript types for all responses

---

## New Files Summary

### Voice Module (`app/voice/`)
| File | Description |
|------|-------------|
| `elevenlabs_tts.py` | ElevenLabs TTS with streaming and voice profiles |
| `deepgram_stt.py` | Deepgram STT with emotion detection |
| `tts.py` | Unified TTS pipeline with fallback |
| `stt.py` | Unified STT pipeline with provider selection |

### ML Module (`app/ml/`)
| File | Description |
|------|-------------|
| `feature_extractor.py` | Extract features from multi-modal data |
| `predictor.py` | XGBoost performance predictor with SHAP |
| `slump_detector.py` | Pattern-based slump detection |
| `correlation_engine.py` | Statistical correlation analysis |
| `intervention_recommender.py` | Evidence-based intervention recommendations |

### Knowledge Module (`app/knowledge/`)
| File | Description |
|------|-------------|
| `embeddings.py` | OpenAI embedding generation |
| `vectorstore.py` | ChromaDB vector store wrapper |
| `query_rewriter.py` | Query expansion and reformulation |
| `retriever.py` | Full retrieval pipeline with reranking |

### Orchestrator Module (`app/orchestrator/`)
| File | Description |
|------|-------------|
| `intent_classifier.py` | Two-stage intent classification (keywords + LLM) |
| `context_manager.py` | Conversation context with Discovery-First Protocol |
| `router.py` | Agent routing logic and response coordination |

### API Routes (`app/api/routes/`)
| File | Description |
|------|-------------|
| `predictions.py` | ML prediction endpoints |
| `knowledge.py` | Knowledge base endpoints |
| `orchestrator.py` | Agent orchestrator endpoints |

---

## Dependencies Added to requirements.txt

```txt
# ML/Statistics
scikit-learn==1.5.2
scipy==1.14.1
xgboost==2.1.3
shap==0.46.0
tiktoken==0.7.0

# Vector Database
chromadb==0.5.23
sentence-transformers==3.3.1

# PDF Processing / RAG
langchain==0.3.14
langchain-community==0.3.14
langchain-openai==0.2.14

# Voice
websockets==13.1

# Testing
pytest==8.3.4
pytest-asyncio==0.24.0
```

---

## Environment Variables Summary

```env
# Voice - ElevenLabs (Primary TTS)
ELEVENLABS_API_KEY=xxx
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_MODEL_ID=eleven_turbo_v2_5
TTS_PROVIDER=elevenlabs

# Voice - Deepgram (Optional STT)
DEEPGRAM_API_KEY=xxx
STT_PROVIDER=whisper  # or deepgram

# Knowledge Base
CHROMA_PERSIST_DIR=./chroma_data
OPENAI_EMBEDDING_MODEL=text-embedding-3-large

# Existing
DATABASE_URL=xxx
OPENAI_API_KEY=xxx
NEXTAUTH_SECRET=xxx
```

---

## API Endpoint Summary

### Voice Endpoints
- `GET /api/voice/status` - Voice service status
- `GET /api/voice/voices` - List available voices
- `POST /api/voice/synthesize` - Convert text to speech
- `POST /api/voice/transcribe` - Convert audio to text
- `WS /api/voice/stream` - Bidirectional voice streaming

### ML Prediction Endpoints
- `POST /api/predictions/risk` - Predict performance risk
- `POST /api/predictions/slump` - Detect slump patterns
- `POST /api/predictions/correlations` - Compute correlations
- `POST /api/predictions/interventions` - Get intervention recommendations
- `GET /api/predictions/athlete/{id}` - Get prediction for athlete
- `GET /api/predictions/status` - ML service status

### Knowledge Base Endpoints
- `POST /api/knowledge/query` - Query knowledge base
- `POST /api/knowledge/add` - Add documents
- `GET /api/knowledge/status` - Collection status
- `POST /api/knowledge/rewrite` - Test query rewriting
- `GET /api/knowledge/frameworks` - List frameworks

### Agent Orchestrator Endpoints
- `POST /api/orchestrator/chat` - Unified chat with auto-routing
- `POST /api/orchestrator/classify` - Classify intent only
- `GET /api/orchestrator/context/{session_id}` - Get session context
- `DELETE /api/orchestrator/context/{session_id}` - Clear session
- `GET /api/orchestrator/status` - Service status
- `GET /api/orchestrator/agents` - List available agents

---

## Next Steps

1. **Testing** - Write integration tests for all new modules
2. **Deployment** - Deploy to Railway staging and test
3. **Documentation** - Update API documentation

---

## Implementation Complete

All six phases of the MCP server revamp have been completed:

1. **Voice Pipeline** - ElevenLabs TTS, Deepgram STT, provider fallback
2. **ML Prediction Engine** - XGBoost, SHAP, slump detection, correlations
3. **Knowledge Base RAG** - ChromaDB, query rewriting, LLM reranking
4. **Agent Orchestrator** - Intent classification, context management, routing
5. **API Endpoints** - All endpoints created and registered
6. **Next.js Integration** - Client libraries updated with TypeScript types

**Branch**: `feature/mcp-server-revamp`
**Commits**: 4 commits with full implementation

---

## Last Updated

2026-01-10 - All implementation phases completed. Ready for testing and deployment.
