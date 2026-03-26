# Future Optimizations

> **For Enterprise Scale (1000+ athletes, multiple universities)**
> Not needed for current pilot - implement when scaling beyond UW.

---

## 1. Caching Layer (Redis)

**Problem:** `analyzeTeamPerformanceCorrelations` runs O(n) queries per athlete. At scale this becomes slow.

**Solution:**
```typescript
// Add Redis caching with TTL
const cacheKey = `team:${schoolId}:correlations:${days}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await analyzeTeamPerformanceCorrelations(schoolId, sport, days);
await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1hr TTL
return result;
```

**Implementation:**
- Add `@upstash/redis` or `ioredis` package
- Create `src/lib/redis.ts` client
- Wrap analytics functions with cache layer
- Invalidate on new mood log / game result

---

## 2. Background Processing (Temporal or Bull)

**Problem:** Deep insight calculations are CPU-intensive. Real-time calculation won't scale.

**Solution:**
```typescript
// Instead of computing on-demand:
const insights = await generateDeepInsights(athleteId, teamIds, 90);

// Pre-compute nightly via cron job:
// /api/cron/compute-insights
for (const athlete of allAthletes) {
  const insights = await generateDeepInsights(athlete.id, teamIds, 90);
  await prisma.computedInsight.upsert({
    where: { athleteId: athlete.id },
    update: { insights: JSON.stringify(insights), computedAt: new Date() },
    create: { athleteId: athlete.id, insights: JSON.stringify(insights) },
  });
}

// API serves pre-computed:
const cached = await prisma.computedInsight.findUnique({ where: { athleteId } });
return cached?.insights;
```

**Implementation:**
- Add `ComputedInsight` table to Prisma schema
- Create nightly cron job `/api/cron/compute-insights`
- Modify API to serve cached insights
- Show "Last updated: X hours ago" in UI

---

## 3. Incremental Computation

**Problem:** Currently recalculates 90 days of data from scratch every time.

**Solution:**
```typescript
// Store running statistics instead of raw recalculation
interface RunningStats {
  n: number;
  sumX: number;
  sumY: number;
  sumXY: number;
  sumX2: number;
  sumY2: number;
}

// Update incrementally when new data arrives
function updateCorrelation(stats: RunningStats, newX: number, newY: number) {
  stats.n++;
  stats.sumX += newX;
  stats.sumY += newY;
  stats.sumXY += newX * newY;
  stats.sumX2 += newX * newX;
  stats.sumY2 += newY * newY;

  // Pearson r from running stats
  const r = (stats.n * stats.sumXY - stats.sumX * stats.sumY) /
    Math.sqrt((stats.n * stats.sumX2 - stats.sumX ** 2) * (stats.n * stats.sumY2 - stats.sumY ** 2));
  return r;
}
```

**Implementation:**
- Add `AthleteStats` table with running statistics
- Update on each mood log / game result webhook
- Expire old data points after 90 days (sliding window)

---

## 4. Vector Similarity (pgvector)

**Problem:** Finding "athletes like you" requires comparing across all athletes.

**Solution:**
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column
ALTER TABLE "Athlete" ADD COLUMN performance_vector vector(10);

-- Find similar athletes
SELECT id, name, 1 - (performance_vector <=> $1) AS similarity
FROM "Athlete"
WHERE school_id = $2
ORDER BY performance_vector <=> $1
LIMIT 5;
```

**Use Cases:**
- "Athletes with similar patterns perform better when..."
- "Your confidence-performance correlation is 2x higher than similar athletes"
- Personalized technique recommendations based on similar athlete success

**Implementation:**
- Enable pgvector in Supabase
- Create embedding pipeline (mood patterns → vector)
- Add similarity search to deep-insights

---

## 5. Multi-Tenant Query Isolation

**Problem:** At scale, queries for one school shouldn't affect others.

**Solution:**
- Supabase connection pooler with tenant routing
- Read replicas per region
- Query timeout enforcement (prevent runaway queries)

---

## 6. Real-Time Insights (WebSocket)

**Problem:** Coaches want live updates during games.

**Solution:**
```typescript
// Supabase Realtime subscription
const channel = supabase
  .channel('team-insights')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'MoodLog',
    filter: `athleteId=in.(${teamAthleteIds.join(',')})`
  }, (payload) => {
    // Trigger insight recalculation for this athlete
    recomputeInsights(payload.new.athleteId);
  })
  .subscribe();
```

---

## Priority Order

| Optimization | When to Implement | Effort |
|--------------|-------------------|--------|
| Redis caching | 50+ athletes | Low |
| Background jobs | 100+ athletes | Medium |
| Incremental stats | 200+ athletes | Medium |
| pgvector similarity | 500+ athletes | High |
| Multi-tenant isolation | 3+ universities | High |
| Real-time WebSocket | Coach request | Medium |

---

## Cost Considerations

| Optimization | Monthly Cost |
|--------------|-------------|
| Upstash Redis (10K requests/day) | $0 (free tier) |
| Background jobs (Vercel Cron) | Included |
| pgvector (Supabase Pro) | Already included |
| Read replicas | $25+/replica |

---

*Created: 2026-02-26*
*Implement when: Scaling beyond UW pilot*
