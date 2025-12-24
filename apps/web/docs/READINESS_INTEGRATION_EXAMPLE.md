# Readiness Score Integration Example

This document shows how to integrate the enhanced readiness score algorithm with the coach dashboard API.

## Backend Integration (Coach Dashboard API)

```typescript
// src/app/api/coach/dashboard/route.ts
import { calculateReadinessScore } from '@/lib/readiness-score';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  // ... authentication and coach validation ...

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Fetch athletes with related data
  const athletes = await prisma.athlete.findMany({
    where: {
      CoachAthlete: {
        some: { coachId: coach.userId, consentGranted: true }
      }
    },
    include: {
      User: {
        select: {
          name: true,
          email: true,
        }
      },
      // Latest MoodLog (daily snapshot)
      moodLogs: {
        where: { createdAt: { gte: oneDayAgo } },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      // Latest Weekly Summary (if consent granted)
      chatSummaries: {
        where: {
          summaryType: 'WEEKLY',
          weekStart: { gte: oneWeekAgo },
          revokedAt: null,
          expiresAt: { gt: new Date() }
        },
        orderBy: { weekStart: 'desc' },
        take: 1
      },
      // Recent chat activity
      chatSessions: {
        where: { createdAt: { gte: oneWeekAgo } },
        select: {
          id: true,
          _count: {
            select: { Message: true }
          }
        }
      },
      // Goals for completion rate
      goals: {
        where: {
          startDate: { gte: oneWeekAgo }
        },
        select: {
          id: true,
          status: true
        }
      }
    }
  });

  // Calculate readiness for each athlete
  const athleteData = athletes.map(athlete => {
    const latestMoodLog = athlete.moodLogs[0];
    const latestWeeklySummary = athlete.chatSummaries[0];

    // Only include weekly summary if athlete has consented
    const weeklySummary = athlete.consentChatSummaries && latestWeeklySummary ? {
      moodScore: latestWeeklySummary.moodScore!,
      stressScore: latestWeeklySummary.stressScore!,
      confidenceScore: latestWeeklySummary.confidenceScore!,
      sleepQualityScore: latestWeeklySummary.sleepQualityScore!,
      engagementScore: latestWeeklySummary.engagementScore!,
      sorenessScore: latestWeeklySummary.sorenessScore!,
      riskFlags: latestWeeklySummary.riskFlags as string[]
    } : undefined;

    // Calculate readiness with enhanced algorithm
    const readiness = calculateReadinessScore({
      moodLog: latestMoodLog ? {
        mood: latestMoodLog.mood,
        stress: latestMoodLog.stress,
        confidence: latestMoodLog.confidence,
        sleepQuality: latestMoodLog.sleepQuality
      } : undefined,

      weeklySummary,

      recentActivity: {
        messageCount: athlete.chatSessions.reduce(
          (sum, s) => sum + s._count.Message, 0
        ),
        sessionCount: athlete.chatSessions.length,
        goalCompletionRate: athlete.goals.length > 0
          ? athlete.goals.filter(g => g.status === 'COMPLETED').length / athlete.goals.length
          : 0
      }
    });

    return {
      id: athlete.userId,
      name: athlete.User.name,
      email: athlete.User.email,
      sport: athlete.sport,
      year: athlete.year,
      
      // Enhanced readiness data
      readinessScore: readiness.score,
      readinessLevel: readiness.level,
      readinessConfidence: readiness.confidence,
      readinessSignals: readiness.signals,
      
      // Other data
      latestMoodLog: latestMoodLog || null,
      weeklySummary: weeklySummary ? latestWeeklySummary : null,
      hasWeeklySummaryConsent: athlete.consentChatSummaries,
    };
  });

  return NextResponse.json({
    athletes: athleteData,
    meta: {
      total: athleteData.length,
      timestamp: new Date().toISOString()
    }
  });
}
```

## Frontend Integration (Athlete Card)

```typescript
// src/components/coach/roster/AthleteCard.tsx
import ReadinessBreakdown from '@/components/coach/readiness/ReadinessBreakdown';
import { ReadinessOutput } from '@/lib/readiness-score';

interface AthleteCardProps {
  athlete: {
    id: string;
    name: string;
    readinessScore: number;
    readinessLevel: string;
    readinessConfidence: number;
    readinessSignals: any;
  };
}

export function AthleteCard({ athlete }: AthleteCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const readinessData: ReadinessOutput = {
    score: athlete.readinessScore,
    level: athlete.readinessLevel as any,
    confidence: athlete.readinessConfidence,
    signals: athlete.readinessSignals
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      {/* Compact Readiness Display */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{athlete.name}</h3>
        <ReadinessBreakdown readiness={readinessData} expanded={false} />
      </div>

      {/* Toggle Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-blue-600 hover:text-blue-700"
      >
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>

      {/* Expanded Readiness Breakdown */}
      {showDetails && (
        <ReadinessBreakdown readiness={readinessData} expanded={true} />
      )}
    </div>
  );
}
```

## Example Response

```json
{
  "athletes": [
    {
      "id": "athlete-123",
      "name": "Jane Doe",
      "readinessScore": 78,
      "readinessLevel": "GOOD",
      "readinessConfidence": 0.8,
      "readinessSignals": {
        "mood": {
          "value": 7.6,
          "source": "blended",
          "weight": 0.3
        },
        "stress": {
          "value": 5.2,
          "source": "blended",
          "weight": 0.25
        },
        "confidence": {
          "value": 8.1,
          "source": "blended",
          "weight": 0.2
        },
        "sleep": {
          "value": 6.8,
          "source": "blended",
          "weight": 0.15
        },
        "engagement": {
          "value": 8.5,
          "source": "weekly",
          "weight": 0.1
        },
        "riskPenalty": 5,
        "rawScore": 83,
        "finalScore": 78
      },
      "hasWeeklySummaryConsent": true
    }
  ]
}
```

## Key Points

1. **Blending Strategy**: 
   - If both MoodLog and WeeklySummary exist: 70% daily + 30% weekly
   - If only one exists: 100% of that source
   - Confidence score increases with more data sources

2. **Risk Penalties**:
   - Applied from weekly summary risk flags
   - Maximum 50 points penalty
   - Examples: "elevated stress" (-5), "burnout indicators" (-12)

3. **Confidence Indicator**:
   - 0.3 baseline (defaults)
   - +0.4 if MoodLog exists (explicit input)
   - +0.3 if WeeklySummary exists (AI-derived)
   - +0.1 if risk flags detected (additional signal)
   - Maximum 1.0

4. **Privacy**:
   - Weekly summary only included if `consentChatSummaries = true`
   - All privacy gates enforced at API level
   - No raw chat content exposed
