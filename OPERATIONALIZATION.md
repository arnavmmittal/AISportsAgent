# Flow Sports Coach - Operationalization Guide

## Overview

This guide covers three critical areas for taking the Flow Sports Coach from staging to production:

1. **Knowledge Base Population** - How to ingest sports psychology content
2. **ML Training Data Acquisition** - How to calibrate ML models with real data
3. **Pilot Validation** - How to validate with real athletes

---

## 1. Knowledge Base Population

### Current Setup

The knowledge base uses ChromaDB for vector storage with OpenAI embeddings (text-embedding-3-large). Content is chunked into ~1000 token segments with 200 token overlap and auto-tagged for sport, framework, phase, and protocol step.

### Ingestion Scripts

**For Text/Markdown Files:**
```bash
cd services/mcp-server

# Basic ingestion
python scripts/ingest_text.py \
  --file ./knowledge_base/uw_sports_psychology_kb.md \
  --source "UW Sports Psychology" \
  --category MENTAL_PERFORMANCE

# Full options
python scripts/ingest_text.py \
  --file /path/to/content.md \
  --source "Source Name" \
  --category ANXIETY \
  --chunk-size 1000 \
  --chunk-overlap 200 \
  --reset  # Warning: deletes existing data
```

**For PDF Files:**
```bash
python scripts/ingest_knowledge_base.py \
  --pdf /path/to/document.pdf \
  --source "Source Name" \
  --category CONFIDENCE
```

### Content Categories

Use these categories when ingesting:
- `ANXIETY` - Pre-competition nerves, performance anxiety
- `CONFIDENCE` - Self-belief, mental bank account, imposter syndrome
- `FOCUS` - Concentration, attention control, present-moment awareness
- `MOTIVATION` - Drive, goals, purpose, values
- `RESILIENCE` - Setback recovery, adversity coping, growth mindset
- `MENTAL_PERFORMANCE` - General sports psychology, frameworks
- `TEAM_DYNAMICS` - Communication, leadership, team cohesion
- `RECOVERY` - Mental recovery, decompression, balance

### Already Prepared Content

The comprehensive sports psychology knowledge base is ready at:
```
services/mcp-server/knowledge_base/uw_sports_psychology_kb.md
```

Contains:
- Discovery-First 6-Phase Protocol
- Mental Skills Assessment (Beginner/Intermediate/Advanced)
- 11 Sport-Specific Mental Demands and Interventions
- 8 Evidence-Based Frameworks (Tracy, Clear, Zinsser, Csikszentmihalyi, Dweck, ACT, CBT, Mindfulness)
- Complete PETTLEP Visualization Framework
- Sport-Specific Imagery Scripts
- Crisis Language Detection Patterns

### Recommended Additional Content

1. **Academic Research PDFs** - Peer-reviewed sports psychology studies
2. **Sport-Specific Guides** - Deep dives into specific sports
3. **Case Studies** - Anonymized examples of mental performance challenges
4. **Intervention Protocols** - Step-by-step therapeutic techniques
5. **Crisis Response Guidelines** - Mental health first aid protocols

---

## 2. ML Training Data Acquisition

### Current ML Components

The system has three ML models that need calibration:

1. **Performance Prediction Model** (XGBoost)
   - Predicts risk of performance decline
   - Features: mood trends, sleep, stress, training load
   - Outputs: 7-day risk score

2. **Slump Detection Model**
   - Identifies patterns indicative of performance slumps
   - Uses 6 detection strategies (trend, volatility, correlation, etc.)
   - Outputs: slump probability and contributing factors

3. **Intervention Recommender**
   - Matches athlete state to 45+ intervention protocols
   - Uses collaborative filtering and content-based matching
   - Outputs: ranked intervention suggestions

### Training Data Options

#### Option A: Synthetic Data Generation (MVP)

Generate realistic synthetic data to bootstrap the models before real data is available.

**Advantages:**
- Fast to generate
- Privacy-safe
- Can create edge cases and scenarios

**Disadvantages:**
- May not reflect real patterns
- Needs validation with real data eventually

**Implementation:**
```python
# services/mcp-server/scripts/generate_synthetic_data.py

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_athlete_trajectory(days=90, slump_probability=0.3):
    """Generate realistic athlete mood/performance trajectory."""
    base_mood = np.random.uniform(6, 8)
    trajectory = []

    in_slump = False
    slump_start = None

    for day in range(days):
        # Introduce slumps
        if not in_slump and np.random.random() < 0.02:
            in_slump = True
            slump_start = day
        if in_slump and day - slump_start > np.random.randint(7, 21):
            in_slump = False

        # Generate metrics
        noise = np.random.normal(0, 0.5)
        slump_effect = -1.5 if in_slump else 0

        mood = np.clip(base_mood + noise + slump_effect, 1, 10)
        confidence = np.clip(mood + np.random.normal(0, 0.3), 1, 10)
        stress = np.clip(10 - mood + np.random.normal(0, 0.5), 1, 10)
        sleep_hours = np.clip(7 + (mood - 5) * 0.3 + np.random.normal(0, 1), 3, 12)

        trajectory.append({
            'day': day,
            'mood': round(mood, 1),
            'confidence': round(confidence, 1),
            'stress': round(stress, 1),
            'sleep_hours': round(sleep_hours, 1),
            'in_slump': in_slump
        })

    return trajectory
```

#### Option B: Historical Data Import (If Available)

If you have access to existing athlete data from spreadsheets, surveys, or databases:

**Required Data Fields:**
- Athlete ID (anonymized)
- Date/timestamp
- Mood rating (1-10)
- Confidence rating (1-10)
- Stress level (1-10)
- Sleep hours/quality
- Training load (RPE * duration)
- Performance outcomes (optional)
- Injury status (optional)
- Competition results (optional)

**Data Format:**
```csv
athlete_id,date,mood,confidence,stress,sleep_hours,training_load,competition_result
A001,2024-01-15,7.5,8.0,4.0,7.5,450,null
A001,2024-01-16,7.0,7.5,5.0,6.5,600,null
A001,2024-01-17,8.0,8.5,3.0,8.0,300,win
```

#### Option C: Pilot Collection (Recommended for Production)

Collect real data during pilot phase before relying on ML predictions.

**Minimum Data Requirements:**
- 20+ athletes
- 60+ days of consistent data per athlete
- Daily mood logs (70%+ compliance)
- Performance outcomes

**Collection Strategy:**
1. **Onboard athletes** with data collection expectations
2. **Implement daily check-ins** via app (2-minute completion)
3. **Track compliance** and follow up on gaps
4. **Record performance outcomes** from coaches
5. **Anonymize before analysis**

---

## 3. Pilot Validation Plan

### Pilot Overview

**Goal:** Validate the Flow Sports Coach with real collegiate athletes before broader deployment.

**Timeline:** 10-12 weeks minimum

**Participants:** 15-25 athletes from 2-3 different sports

### Phase 1: Pre-Pilot Preparation (Week 1-2)

**Technical Readiness:**
- [ ] Staging environment stable
- [ ] Knowledge base ingested and tested
- [ ] Crisis escalation workflow tested
- [ ] Coach dashboard functional
- [ ] Data export/backup procedures verified

**Participant Recruitment:**
- [ ] Partner with 2-3 coaches willing to participate
- [ ] Present to potential athlete participants
- [ ] Obtain informed consent (IRB if required)
- [ ] Collect baseline assessments

**Baseline Assessments:**
- Psychological Performance Inventory (PPI)
- Sport Competition Anxiety Test (SCAT)
- Brief COPE inventory
- Custom baseline survey on current mental skills

### Phase 2: Onboarding (Week 3)

**Athlete Onboarding:**
- Individual or small group orientation sessions
- Demonstrate app features
- Set expectations for usage (3-5 chats/week, daily mood logs)
- Establish communication channels for issues

**Coach Onboarding:**
- Dashboard walkthrough
- Anonymization explanation
- Crisis alert workflow review
- Weekly report expectations

### Phase 3: Active Pilot (Week 4-10)

**Weekly Check-ins:**
- Brief survey on user experience
- Track engagement metrics
- Address technical issues
- Document feature requests

**Metrics to Track:**

*Engagement Metrics:*
- Weekly active users
- Conversations per user per week
- Mood log completion rate
- Average conversation length
- Return visit rate

*Outcome Metrics:*
- Pre/post psychological assessments
- Self-reported mental skill improvement
- Coach satisfaction ratings
- Crisis detection accuracy

*Technical Metrics:*
- Response latency
- Error rates
- Cost per conversation
- Uptime percentage

### Phase 4: Evaluation (Week 11-12)

**Data Analysis:**
- Compare pre/post assessment scores
- Analyze engagement patterns
- Review conversation quality samples
- Assess ML model accuracy (predictions vs. actuals)

**Stakeholder Feedback:**
- Athlete exit interviews
- Coach feedback sessions
- Identify top feature requests
- Document improvement opportunities

**Deliverables:**
- Pilot summary report
- Recommendations for production
- Refined cost projections
- Updated roadmap

### Success Criteria

**Minimum Success (Go for Production):**
- 60%+ weekly active users
- 70%+ mood log compliance
- No missed crisis escalations
- Positive user satisfaction (4+/5 average)
- Cost within budget (<$5/user/month)

**Target Success:**
- 75%+ weekly active users
- 80%+ mood log compliance
- Measurable improvement in mental skills assessments
- Strong user satisfaction (4.5+/5 average)
- Positive coach feedback

**Outstanding Success:**
- 85%+ engagement rates
- Statistically significant improvement in performance metrics
- Athletes request to continue after pilot
- Coaches want to expand to full team

### Pilot Budget Estimate

| Item | Cost |
|------|------|
| OpenAI API (20 athletes × 10 weeks) | $200-400 |
| Infrastructure (staging) | $50/month |
| Incentives for participants | $0-500 |
| Assessment tools | $0-200 |
| **Total** | **$300-1200** |

---

## Getting Started Checklist

### Immediate Actions (This Week)

1. **Ingest Knowledge Base:**
   ```bash
   cd services/mcp-server
   source venv/bin/activate
   python scripts/ingest_text.py \
     --file ./knowledge_base/uw_sports_psychology_kb.md \
     --source "UW Sports Psychology" \
     --category MENTAL_PERFORMANCE
   ```

2. **Generate Synthetic Training Data:**
   - Create synthetic data script
   - Generate 50 synthetic athlete trajectories
   - Validate ML model with synthetic data

3. **Identify Pilot Cohort:**
   - Reach out to 2-3 coaches
   - Begin informal discussions about pilot participation

### Short-Term Actions (This Month)

1. **Expand Knowledge Base:**
   - Ingest 3-5 additional sources
   - Test RAG retrieval quality
   - Tune chunk size if needed

2. **Prepare Pilot Materials:**
   - Consent forms
   - Onboarding guides
   - Assessment instruments
   - Coach dashboard training

3. **Technical Validation:**
   - End-to-end testing in staging
   - Load testing with expected pilot volume
   - Verify crisis escalation workflow

### Pre-Production Checklist

- [ ] Knowledge base populated and tested
- [ ] ML models validated (synthetic or real data)
- [ ] Pilot completed with positive results
- [ ] Security audit passed
- [ ] Cost controls verified
- [ ] Crisis escalation tested
- [ ] Coach dashboard approved
- [ ] User documentation complete
