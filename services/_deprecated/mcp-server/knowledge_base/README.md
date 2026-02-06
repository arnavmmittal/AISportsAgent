# Knowledge Base - Sports Psychology Content

## Current Status

**Current Chunks**: 66 (from 1 PDF)
**Target**: 300-500 chunks (5-6 books)

## Directory Structure

```
knowledge_base/
├── AI Sports Psych Project.pdf          (Current - 66 chunks)
├── sports/
│   ├── general/                         (Cross-sport mental skills)
│   ├── basketball/                      (Basketball-specific)
│   ├── football/                        (Football-specific)
│   ├── soccer/                          (Soccer-specific)
│   └── research/                        (Academic papers)
└── README.md
```

## Recommended Books to Acquire

### Priority 1: General Mental Skills (300+ chunks)

1. **"Mind Gym" by Gary Mack** ⭐ **HIGH PRIORITY**
   - Sport: Basketball/General
   - Topics: Mental toughness, visualization, confidence
   - Estimated chunks: 80-100
   - Category: CONFIDENCE, VISUALIZATION
   - Place in: `sports/general/`

2. **"The Champion's Mind" by Jim Afremow** ⭐ **HIGH PRIORITY**
   - Sport: General
   - Topics: Peak performance, mental preparation, focus
   - Estimated chunks: 90-110
   - Category: PERFORMANCE, FOCUS
   - Place in: `sports/general/`

3. **"10-Minute Toughness" by Jason Selk** ⭐ **HIGH PRIORITY**
   - Sport: General
   - Topics: Pre-performance routines, mental conditioning
   - Estimated chunks: 60-80
   - Category: ROUTINE, PERFORMANCE
   - Place in: `sports/general/`

4. **"The Inner Game of Tennis" by Timothy Gallwey**
   - Sport: Tennis/General
   - Topics: Flow state, self-coaching, focus
   - Estimated chunks: 70-90
   - Category: FLOW, FOCUS
   - Place in: `sports/general/`

### Priority 2: Sport-Specific (100-150 chunks)

5. **"The Mental Game of Baseball" by H.A. Dorfman**
   - Sport: Baseball
   - Topics: Mental approach, pressure situations
   - Estimated chunks: 80-100
   - Category: ANXIETY, PERFORMANCE
   - Place in: `sports/baseball/`

6. **"Championship Habits" - Basketball-specific mental skills**
   - Sport: Basketball
   - Topics: Consistency, preparation, clutch performance
   - Estimated chunks: 60-80
   - Category: ROUTINE, CONFIDENCE
   - Place in: `sports/basketball/`

### Optional: Research Papers (50-100 chunks)

7. **Flow State Research** (Jackson & Csikszentmihalyi)
   - Academic papers on flow in sports
   - Estimated chunks: 20-30
   - Category: FLOW
   - Place in: `sports/research/`

8. **CBT in Sports** (Systematic reviews)
   - Evidence-based cognitive behavioral interventions
   - Estimated chunks: 20-30
   - Category: ANXIETY, CONFIDENCE
   - Place in: `sports/research/`

9. **Sleep & Performance Studies** (Mah et al.)
   - Sleep extension impact on athletic performance
   - Estimated chunks: 10-20
   - Category: PERFORMANCE
   - Place in: `sports/research/`

## How to Acquire Books

### Option 1: Purchase eBooks (Legal)
- Amazon Kindle (purchase → download as PDF via Calibre)
- Google Play Books
- Apple Books

### Option 2: Library Access
- University library digital collections
- OverDrive/Libby (public library eBooks)

### Option 3: Research Database Access
- PubMed/PubMed Central (free academic papers)
- ResearchGate
- Google Scholar → PDF links

## Ingestion Commands

### Step 1: Activate Virtual Environment
```bash
cd /Users/arnavmittal/Desktop/SportsAgent/ai-sports-mcp/server
source venv/bin/activate
```

### Step 2: Ingest PDFs

**General Mental Skills:**
```bash
# Mind Gym
python scripts/ingest_knowledge_base.py \
  --pdf knowledge_base/sports/general/mind_gym.pdf \
  --source "Mind Gym by Gary Mack" \
  --category CONFIDENCE

# The Champion's Mind
python scripts/ingest_knowledge_base.py \
  --pdf knowledge_base/sports/general/champions_mind.pdf \
  --source "The Champion's Mind by Jim Afremow" \
  --category PERFORMANCE

# 10-Minute Toughness
python scripts/ingest_knowledge_base.py \
  --pdf knowledge_base/sports/general/10_minute_toughness.pdf \
  --source "10-Minute Toughness by Jason Selk" \
  --category ROUTINE

# The Inner Game of Tennis
python scripts/ingest_knowledge_base.py \
  --pdf knowledge_base/sports/general/inner_game_tennis.pdf \
  --source "The Inner Game of Tennis by Timothy Gallwey" \
  --category FLOW
```

**Sport-Specific:**
```bash
# Mental Game of Baseball
python scripts/ingest_knowledge_base.py \
  --pdf knowledge_base/sports/baseball/mental_game_baseball.pdf \
  --source "The Mental Game of Baseball by H.A. Dorfman" \
  --category ANXIETY

# Championship Habits (Basketball)
python scripts/ingest_knowledge_base.py \
  --pdf knowledge_base/sports/basketball/championship_habits.pdf \
  --source "Championship Habits" \
  --category ROUTINE
```

**Research Papers:**
```bash
# Flow State Research
python scripts/ingest_knowledge_base.py \
  --pdf knowledge_base/sports/research/flow_state_jackson.pdf \
  --source "Flow in Sports - Jackson & Csikszentmihalyi" \
  --category FLOW

# CBT in Sports
python scripts/ingest_knowledge_base.py \
  --pdf knowledge_base/sports/research/cbt_sports_review.pdf \
  --source "CBT Interventions in Sports - Systematic Review" \
  --category ANXIETY

# Sleep & Performance
python scripts/ingest_knowledge_base.py \
  --pdf knowledge_base/sports/research/sleep_performance_mah.pdf \
  --source "Sleep Extension and Athletic Performance - Mah et al." \
  --category PERFORMANCE
```

### Step 3: Verify Chunk Count
```bash
python scripts/query_knowledge_base.py --stats
```

Expected output:
```
Total Chunks: 300-500
```

## Metadata Tagging Strategy

For better search results, tag PDFs with:

- **Sport**: basketball, football, soccer, baseball, general
- **Framework**: cbt, mindfulness, visualization, flow_state
- **Category**: ANXIETY, CONFIDENCE, FOCUS, PERFORMANCE, ROUTINE, FLOW
- **Performance Phase**: pre_competition, in_competition, post_competition, recovery
- **Evidence Level**: peer_reviewed, expert_opinion, case_study

**Example enhanced ingestion:**
```bash
python scripts/ingest_knowledge_base.py \
  --pdf knowledge_base/sports/basketball/mind_gym.pdf \
  --source "Mind Gym by Gary Mack" \
  --category CONFIDENCE \
  --sport basketball \
  --framework visualization \
  --evidence-level expert_opinion
```

## Quality Control

After ingestion:

1. **Check chunk count**: Should be 300-500
2. **Test semantic search**:
   ```bash
   python scripts/query_knowledge_base.py --query "pre-game anxiety basketball"
   ```
3. **Verify diversity**: Chunks from multiple sources
4. **Check metadata**: Sport tags applied correctly

## Expected Timeline

- **Acquiring PDFs**: 1-2 days (purchase/library access)
- **Organizing files**: 30 minutes
- **Ingestion**: 1-2 hours (depending on PDF count)
- **Testing**: 30 minutes

Total: 2-3 days for complete knowledge base expansion.

## Multi-Tenancy Note

When pilot schools customize knowledge base:
- Add `--school-id` flag to ingestion script
- Filter queries by schoolId in KnowledgeAgent
- Example: UW Football adds custom playbook

```bash
python scripts/ingest_knowledge_base.py \
  --pdf knowledge_base/uw_football_mental_playbook.pdf \
  --source "UW Football Mental Performance Playbook" \
  --category ROUTINE \
  --school-id school-uw-12345
```

## Current Ingestion Status

- [x] AI Sports Psych Project.pdf (66 chunks)
- [ ] Mind Gym
- [ ] The Champion's Mind
- [ ] 10-Minute Toughness
- [ ] The Inner Game of Tennis
- [ ] The Mental Game of Baseball
- [ ] Championship Habits
- [ ] Flow State Research
- [ ] CBT in Sports Review
- [ ] Sleep & Performance Study

**Next Steps**: Acquire PDFs from list above and run ingestion commands.
