# Knowledge Base Management Guide

## Overview

The AI Sports Agent uses a **hybrid knowledge base system** for Retrieval-Augmented Generation (RAG):

1. **PostgreSQL (Supabase)**: Stores knowledge chunks with metadata
2. **OpenAI Embeddings**: Vector representations for semantic search
3. **In-memory Search**: Fast retrieval during chat conversations

## Current Status

### ✅ What's Already Done

- **PDF Parsed**: `AISportsAgentKnowledgeBase.pdf` (508KB)
- **Chunks Generated**: `chunks.json` (86KB, pre-processed)
- **Ingestion Script**: Ready to run (see below)
- **API Endpoint**: `/api/admin/knowledge/ingest` for adding new content
- **Database Schema**: `KnowledgeBase` table with embeddings

### ❌ What Needs to Be Done

- [ ] **Initial Ingestion**: Run script to load chunks into database
- [ ] **Embedding Generation**: Create vector embeddings for all chunks
- [ ] **Verify Retrieval**: Test RAG queries in chat
- [ ] **Add School-Specific Content**: Optionally add custom resources per university

---

## Quick Start: Ingest Existing Knowledge Base

### 1. Set Up Environment

```bash
# Ensure you have OPENAI_API_KEY in .env.local
echo "OPENAI_API_KEY=sk-proj-..." >> apps/web/.env.local

# Or use existing .env
source apps/web/.env.local
```

### 2. Run Ingestion Script

```bash
# From repository root
cd apps/web

# Install dependencies if needed
pnpm install

# Ingest all chunks from PDF (one-time setup)
pnpm tsx scripts/ingest-knowledge-base.ts
```

**Expected Output:**
```
📚 Starting Knowledge Base Ingestion...

📖 Loaded PDF chunks:
  Source: AISportsAgentKnowledgeBase.pdf
  Pages: 42
  Chunks: 127
  Characters: 245,892
  Generated: 2024-12-30T11:41:00.000Z

Generating embedding for chunk kb_1...
Generating embedding for chunk kb_2...
  Progress: 10/127
  Progress: 20/127
  ...

✅ Ingestion Complete!
  Processed: 127
  Skipped: 0
  Errors: 0
  Total in DB: 127

📊 Knowledge Base Statistics

Total Chunks: 127

By Category:
  MINDFULNESS: 23
  CBT: 31
  FLOW_STATE: 18
  ANXIETY_MANAGEMENT: 22
  CONFIDENCE: 15
  MOTIVATION: 12
  GENERAL: 6

By Source:
  AISportsAgentKnowledgeBase.pdf: 127
```

### 3. Verify Ingestion

```bash
# Check stats
pnpm tsx scripts/ingest-knowledge-base.ts stats
```

**Or via SQL:**
```sql
-- Connect to Supabase
psql $DATABASE_URL

-- Count total knowledge chunks
SELECT COUNT(*) FROM "KnowledgeBase";

-- Group by category
SELECT category, COUNT(*) FROM "KnowledgeBase" GROUP BY category;

-- Sample a few entries
SELECT id, title, category, tags FROM "KnowledgeBase" LIMIT 5;
```

---

## Adding New Knowledge (Production)

Once deployed, you can add new content via API:

### Via cURL (Admin Access Required)

```bash
# Get admin JWT token (from login)
ADMIN_TOKEN="eyJhbGci..."

# Add new knowledge
curl -X POST https://your-app.vercel.app/api/admin/knowledge/ingest \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Breathing Techniques for Pre-Game Anxiety",
    "content": "Box breathing is a powerful technique... (full text here)",
    "source": "Sport Psychology Research Journal 2024",
    "sourceUrl": "https://example.com/article",
    "category": "ANXIETY_MANAGEMENT",
    "tags": ["breathing", "pre-game", "anxiety"],
    "schoolId": null
  }'
```

**Response:**
```json
{
  "success": true,
  "knowledge": {
    "id": "kb_1704394800_abc123",
    "title": "Breathing Techniques for Pre-Game Anxiety",
    "category": "ANXIETY_MANAGEMENT",
    "source": "Sport Psychology Research Journal 2024"
  },
  "message": "Knowledge ingested successfully"
}
```

### Via Admin Dashboard (Future)

In the future, create an admin UI at `/admin/knowledge` with:
- File upload for PDFs
- Form for manual entry
- Bulk import via CSV
- Edit/delete existing knowledge

---

## Knowledge Base Structure

### Categories

Knowledge is automatically categorized into:

| Category | Description | Examples |
|----------|-------------|----------|
| `MINDFULNESS` | Mindfulness and meditation techniques | Breathing exercises, body scans |
| `CBT` | Cognitive Behavioral Therapy | Thought reframing, cognitive restructuring |
| `FLOW_STATE` | Optimal performance states | Entering the zone, flow triggers |
| `MOTIVATION` | Goal-setting and motivation | Intrinsic vs extrinsic, self-determination |
| `ANXIETY_MANAGEMENT` | Managing pre-game and performance anxiety | Relaxation techniques, exposure |
| `CONFIDENCE` | Building self-efficacy and confidence | Positive self-talk, visualization |
| `TEAM_DYNAMICS` | Team cohesion and communication | Leadership, conflict resolution |
| `INJURY_RECOVERY` | Psychological aspects of injury | Coping strategies, return-to-play |
| `GENERAL` | General sports psychology concepts | Overview topics |

### Tags

Chunks are auto-tagged based on content keywords:
- breathing
- meditation
- visualization
- cbt
- flow
- anxiety
- stress
- confidence
- goal-setting
- team
- injury
- (and more...)

### Metadata Structure

Each knowledge chunk includes:

```typescript
{
  id: "kb_1704394800_abc123",          // Unique ID
  title: "First 100 chars of content...", // Auto-generated
  content: "Full text content",        // The actual knowledge
  source: "AISportsAgentKB.pdf",       // Source document
  sourceUrl: "page-12",                // Reference (page number or URL)
  embedding: [0.123, -0.456, ...],     // 1536-dim vector (OpenAI)
  category: "MINDFULNESS",             // Auto-categorized
  tags: "breathing, meditation",       // Comma-separated
  isActive: true,                      // Can be disabled
  schoolId: null,                      // null = global, or specific school
  createdAt: "2025-01-04T...",
  updatedAt: "2025-01-04T..."
}
```

---

## School-Specific Knowledge

You can add custom knowledge for specific schools:

### Global Knowledge (Shared)

```bash
# Add global knowledge (available to all schools)
pnpm tsx scripts/ingest-knowledge-base.ts
# (No --school-id flag = global)
```

### School-Specific Knowledge

```bash
# Add knowledge for University of Washington only
pnpm tsx scripts/ingest-knowledge-base.ts --school-id="school-uw-12345"

# Or via API
curl -X POST https://your-app.vercel.app/api/admin/knowledge/ingest \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "UW Mental Health Resources",
    "content": "University of Washington provides...",
    "source": "UW Health & Wellness",
    "category": "GENERAL",
    "schoolId": "school-uw-12345"
  }'
```

**How it works in RAG:**
- When athlete from UW chats, retrieval includes:
  - Global knowledge (all schools)
  - UW-specific knowledge only
- Athletes from other schools never see UW-specific content

---

## How RAG Uses Knowledge Base

### 1. User Message → Query

```
Athlete: "I'm feeling really anxious before games"
```

### 2. Query Rewriting (Optional)

```typescript
// AI rewrites query for better semantic search
const rewritten = "techniques for managing pre-game anxiety in athletes";
```

### 3. Embedding Generation

```typescript
const queryEmbedding = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: rewritten,
});
```

### 4. Semantic Search

```typescript
// Find top 5 most relevant chunks (cosine similarity)
const results = await prisma.knowledgeBase.findMany({
  where: {
    isActive: true,
    OR: [
      { schoolId: null }, // Global knowledge
      { schoolId: user.schoolId }, // School-specific
    ],
  },
  // In production, use pgvector for efficient similarity search:
  // ORDER BY embedding <=> query_embedding LIMIT 5
});
```

### 5. Context Augmentation

```typescript
const context = results.map(r => r.content).join('\n\n');

const systemPrompt = `You are a sports psychology AI.

RELEVANT KNOWLEDGE:
${context}

USER QUESTION: ${userMessage}

Provide an evidence-based response using the knowledge above.`;
```

### 6. AI Response

```
AI: "Pre-game anxiety is very common. Let me share some evidence-based techniques:

1. **Box Breathing** (from research): 4-count inhale, hold, exhale, hold...
2. **Positive Self-Talk**: Reframe 'I'm nervous' to 'I'm excited'...
3. **Visualization**: Picture yourself succeeding...

These techniques are backed by sports psychology research and proven effective."
```

---

## Updating Knowledge Base

### Re-generate Embeddings

If you change the embedding model or need to update vectors:

```bash
pnpm tsx scripts/ingest-knowledge-base.ts --update-embeddings
```

This will:
- Keep existing chunks
- Regenerate embeddings with current model
- Update `updatedAt` timestamp

### Add New PDF

1. **Place PDF in `knowledge_base/` directory**
   ```bash
   cp new-research.pdf apps/web/knowledge_base/
   ```

2. **Generate chunks** (if you have a chunking script)
   ```bash
   # You'll need to create this script or manually chunk the PDF
   node scripts/chunk-pdf.js knowledge_base/new-research.pdf
   ```

3. **Ingest chunks**
   ```bash
   pnpm tsx scripts/ingest-knowledge-base.ts
   ```

### Deactivate Outdated Knowledge

```sql
-- Disable specific chunks (they won't appear in search)
UPDATE "KnowledgeBase"
SET "isActive" = false
WHERE source = 'outdated-research.pdf';
```

### Delete Knowledge

```sql
-- Permanently delete (use with caution)
DELETE FROM "KnowledgeBase"
WHERE source = 'old-file.pdf';
```

---

## Performance Optimization

### Vector Search with pgvector

For production, use **pgvector extension** in Supabase for fast similarity search:

```sql
-- Enable pgvector extension (run in Supabase SQL Editor)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column (if not already present)
ALTER TABLE "KnowledgeBase"
ADD COLUMN embedding_vector vector(1536);

-- Populate vector column from JSON embeddings
UPDATE "KnowledgeBase"
SET embedding_vector = embedding::text::vector;

-- Create index for fast similarity search
CREATE INDEX ON "KnowledgeBase"
USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100);

-- Query with vector similarity (fast!)
SELECT id, title, content,
  1 - (embedding_vector <=> '[0.123, -0.456, ...]') AS similarity
FROM "KnowledgeBase"
WHERE isActive = true
ORDER BY embedding_vector <=> '[0.123, -0.456, ...]'
LIMIT 5;
```

### Caching Frequently Retrieved Chunks

```typescript
// In-memory cache for hot knowledge (LRU cache)
import LRU from 'lru-cache';

const knowledgeCache = new LRU<string, KnowledgeChunk[]>({
  max: 500, // Cache 500 queries
  ttl: 1000 * 60 * 60, // 1 hour TTL
});

async function retrieveKnowledge(query: string) {
  // Check cache first
  const cached = knowledgeCache.get(query);
  if (cached) return cached;

  // Fetch from DB
  const results = await searchKnowledge(query);

  // Cache results
  knowledgeCache.set(query, results);

  return results;
}
```

---

## Monitoring & Analytics

### Track Knowledge Usage

```typescript
// Log which knowledge chunks are being used
await prisma.knowledgeUsage.create({
  data: {
    knowledgeId: chunk.id,
    sessionId: chat.sessionId,
    athleteId: athlete.id,
    usedAt: new Date(),
  },
});

// Later, analyze:
// - Which chunks are most helpful?
// - Which categories are underutilized?
// - Are there gaps in knowledge coverage?
```

### Knowledge Base Health Metrics

```sql
-- Most used knowledge chunks (last 30 days)
SELECT kb.id, kb.title, COUNT(*) as usage_count
FROM "KnowledgeBase" kb
JOIN "KnowledgeUsage" ku ON ku."knowledgeId" = kb.id
WHERE ku."usedAt" > NOW() - INTERVAL '30 days'
GROUP BY kb.id, kb.title
ORDER BY usage_count DESC
LIMIT 20;

-- Gaps: Categories with low usage
SELECT category, COUNT(*) as chunk_count, SUM(usage_count) as total_usage
FROM "KnowledgeBase" kb
LEFT JOIN (
  SELECT "knowledgeId", COUNT(*) as usage_count
  FROM "KnowledgeUsage"
  WHERE "usedAt" > NOW() - INTERVAL '30 days'
  GROUP BY "knowledgeId"
) ku ON ku."knowledgeId" = kb.id
GROUP BY category
ORDER BY total_usage ASC;
```

---

## Troubleshooting

### Issue: Embeddings not generating

**Cause:** OpenAI API key not set

**Fix:**
```bash
# Verify key is set
echo $OPENAI_API_KEY

# If not, add to .env.local
echo "OPENAI_API_KEY=sk-proj-..." >> apps/web/.env.local
```

### Issue: Rate limit errors

**Cause:** Generating embeddings too fast (3000/min limit)

**Fix:**
```typescript
// Script already includes rate limiting (20ms delay)
await new Promise(resolve => setTimeout(resolve, 20));

// If still hitting limits, increase delay:
await new Promise(resolve => setTimeout(resolve, 50)); // 20 req/sec
```

### Issue: Chunks not appearing in search

**Cause:** `isActive = false` or wrong schoolId

**Fix:**
```sql
-- Check if chunks are active
SELECT COUNT(*) FROM "KnowledgeBase" WHERE "isActive" = true;

-- Activate all chunks
UPDATE "KnowledgeBase" SET "isActive" = true;

-- Check schoolId filtering
SELECT "schoolId", COUNT(*) FROM "KnowledgeBase" GROUP BY "schoolId";
```

### Issue: Low-quality retrieval

**Cause:** Query embeddings don't match content embeddings

**Fix:**
1. Use **query rewriting** to improve semantic match
2. Increase number of results retrieved (top 10 instead of top 5)
3. Use **hybrid search** (keyword + semantic)
4. Fine-tune embedding model (advanced)

---

## Best Practices

### 1. Keep Chunks Focused

```
❌ Bad: 5000-word chapter dump
✅ Good: 300-500 word focused chunks on specific topics
```

### 2. Cite Sources

```
✅ Always include source + URL in metadata
```

### 3. Regular Updates

```
🔄 Monthly: Review and update outdated knowledge
📅 Quarterly: Add new research and techniques
🗑️  Annually: Remove deprecated content
```

### 4. Test Retrieval Quality

```bash
# Manually test RAG queries
pnpm tsx scripts/test-rag.ts "How do I manage pre-game anxiety?"

# Expected: Relevant chunks about anxiety management techniques
```

### 5. Version Control Knowledge

```bash
# Keep knowledge_base/ in git
git add knowledge_base/
git commit -m "feat(kb): Add new sports psychology research"
```

---

## Next Steps

1. **Run Initial Ingestion** (5-10 minutes)
   ```bash
   pnpm tsx scripts/ingest-knowledge-base.ts
   ```

2. **Verify in Database**
   ```sql
   SELECT COUNT(*) FROM "KnowledgeBase";
   ```

3. **Test RAG in Chat**
   - Start chat session
   - Ask question about anxiety/confidence/flow
   - Verify AI uses knowledge base (check for citations)

4. **Add School-Specific Content** (optional)
   - Use API endpoint to add custom resources
   - Test with school-specific query

5. **Monitor Usage**
   - Track which knowledge is most helpful
   - Identify gaps and add new content

---

**Last Updated:** 2025-01-04
**Version:** 1.0.0
