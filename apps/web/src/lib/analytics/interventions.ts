/**
 * Coach Intervention Recommendations
 *
 * Rule-based system that suggests specific interventions based on athlete mental state:
 * - Priority levels: URGENT, HIGH, MEDIUM, LOW
 * - Evidence-based intervention types
 * - Tracking of intervention effectiveness over time
 *
 * Intervention logic:
 * - Readiness < 50 → URGENT: Schedule 1-on-1 check-in
 * - Mood declining + low engagement → HIGH: Assign mood journaling
 * - High stress + upcoming game → MEDIUM: Pre-game mindfulness protocol
 * - Low confidence → MEDIUM: Review past successes
 */

import { prisma } from '@/lib/prisma';

export type InterventionPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export type InterventionCategory =
  | 'ONE_ON_ONE'
  | 'GROUP_SESSION'
  | 'MINDFULNESS'
  | 'COGNITIVE_RESTRUCTURING'
  | 'GOAL_SETTING'
  | 'RECOVERY_PROTOCOL'
  | 'LOAD_MANAGEMENT'
  | 'SLEEP_HYGIENE';

export interface InterventionRecommendation {
  id: string;
  athleteId: string;
  athleteName: string;
  priority: InterventionPriority;
  category: InterventionCategory;
  title: string;
  description: string;
  rationale: string; // Why this intervention is recommended
  estimatedDuration: string; // "15 min", "1 hour", etc.
  dueBy?: Date; // For urgent/high priority items
  triggers: string[]; // What triggered this recommendation
  relatedMetrics: {
    readiness?: number;
    mood?: number;
    stress?: number;
    confidence?: number;
    engagement?: number;
  };
}

export interface InterventionQueue {
  urgent: InterventionRecommendation[];
  high: InterventionRecommendation[];
  medium: InterventionRecommendation[];
  low: InterventionRecommendation[];
  total: number;
}

/**
 * Analyze athlete state and generate intervention recommendations
 */
export async function generateInterventionRecommendations(
  athleteId: string
): Promise<InterventionRecommendation[]> {
  const recommendations: InterventionRecommendation[] = [];

  // Fetch athlete info
  const athlete = await prisma.athlete.findUnique({
    where: { userId: athleteId },
    include: {
      User: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!athlete) {
    throw new Error(`Athlete not found: ${athleteId}`);
  }

  const athleteName = athlete.User.name || athlete.User.email;

  // Fetch recent readiness score (last 7 days)
  const recentReadiness = await prisma.readinessScore.findFirst({
    where: {
      athleteId,
      calculatedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: {
      calculatedAt: 'desc',
    },
  });

  // Fetch recent mood logs (last 7 days)
  const recentMoods = await prisma.moodLog.findMany({
    where: {
      athleteId,
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 7,
  });

  // Calculate mood trend (improving/declining/stable)
  let moodTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (recentMoods.length >= 3) {
    const recent3Avg = recentMoods.slice(0, 3).reduce((sum, m) => sum + m.mood, 0) / 3;
    const older3Avg = recentMoods.slice(3, 6).reduce((sum, m) => sum + m.mood, 0) / 3 || recent3Avg;

    if (recent3Avg < older3Avg - 1.5) moodTrend = 'declining';
    else if (recent3Avg > older3Avg + 1.5) moodTrend = 'improving';
  }

  // Calculate avg metrics
  const avgMood = recentMoods.length > 0 ? recentMoods.reduce((sum, m) => sum + m.mood, 0) / recentMoods.length : null;
  const avgStress = recentMoods.length > 0 ? recentMoods.reduce((sum, m) => sum + m.stress, 0) / recentMoods.length : null;
  const avgConfidence = recentMoods.length > 0 ? recentMoods.reduce((sum, m) => sum + m.confidence, 0) / recentMoods.length : null;

  // Fetch recent chat engagement (last 7 days)
  const chatSessions = await prisma.chatSession.findMany({
    where: {
      athleteId,
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      _count: {
        select: {
          Message: true,
        },
      },
    },
  });

  const chatEngagement = chatSessions.length;
  const totalMessages = chatSessions.reduce((sum, s) => sum + s._count.Message, 0);

  // Fetch crisis alerts (unresolved)
  const unresolvedCrisis = await prisma.crisisAlert.findMany({
    where: {
      athleteId,
      reviewed: false,
    },
    orderBy: {
      detectedAt: 'desc',
    },
    take: 1,
  });

  // === RULE-BASED INTERVENTION LOGIC ===

  // Rule 1: URGENT - Crisis alert detected
  if (unresolvedCrisis.length > 0) {
    const crisis = unresolvedCrisis[0];
    recommendations.push({
      id: `crisis-${crisis.id}`,
      athleteId,
      athleteName,
      priority: 'URGENT',
      category: 'ONE_ON_ONE',
      title: 'Crisis Alert - Immediate Check-In Required',
      description: 'Schedule immediate 1-on-1 meeting to assess athlete well-being and provide support',
      rationale: `Crisis detected on ${crisis.detectedAt.toLocaleDateString()}. Severity: ${crisis.severity}`,
      estimatedDuration: '30-45 min',
      dueBy: new Date(Date.now() + 24 * 60 * 60 * 1000), // Within 24 hours
      triggers: ['crisis_alert', crisis.severity],
      relatedMetrics: {},
    });
  }

  // Rule 2: URGENT - Very low readiness (<45)
  if (recentReadiness && recentReadiness.score < 45) {
    recommendations.push({
      id: `urgent-readiness-${athleteId}`,
      athleteId,
      athleteName,
      priority: 'URGENT',
      category: 'ONE_ON_ONE',
      title: 'Very Low Readiness - Immediate Assessment',
      description: 'Conduct welfare check and adjust training plan. Athlete may need rest day or modified training.',
      rationale: `Readiness score critically low (${recentReadiness.score}/100)`,
      estimatedDuration: '20-30 min',
      dueBy: new Date(Date.now() + 24 * 60 * 60 * 1000),
      triggers: ['low_readiness', `score_${recentReadiness.score}`],
      relatedMetrics: {
        readiness: recentReadiness.score,
      },
    });
  }

  // Rule 3: HIGH - Declining mood trend + low engagement
  if (moodTrend === 'declining' && chatEngagement < 2 && avgMood && avgMood < 6) {
    recommendations.push({
      id: `mood-engagement-${athleteId}`,
      athleteId,
      athleteName,
      priority: 'HIGH',
      category: 'ONE_ON_ONE',
      title: 'Declining Mood with Withdrawal Pattern',
      description: 'Athlete showing signs of disengagement. Reach out for supportive check-in and encourage continued use of resources.',
      rationale: `Mood declining (avg ${avgMood.toFixed(1)}/10), only ${chatEngagement} chat sessions this week`,
      estimatedDuration: '15-20 min',
      dueBy: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Within 3 days
      triggers: ['declining_mood', 'low_engagement'],
      relatedMetrics: {
        mood: avgMood,
        engagement: chatEngagement,
      },
    });
  }

  // Rule 4: HIGH - Very high stress (>8/10)
  if (avgStress && avgStress > 8) {
    recommendations.push({
      id: `high-stress-${athleteId}`,
      athleteId,
      athleteName,
      priority: 'HIGH',
      category: 'MINDFULNESS',
      title: 'Elevated Stress - Stress Management Protocol',
      description: 'Assign mindfulness exercises and breathing techniques. Consider reducing training load.',
      rationale: `Stress levels very high (avg ${avgStress.toFixed(1)}/10 over past week)`,
      estimatedDuration: '10 min instruction + daily practice',
      dueBy: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      triggers: ['high_stress', `stress_${avgStress.toFixed(1)}`],
      relatedMetrics: {
        stress: avgStress,
      },
    });
  }

  // Rule 5: MEDIUM - Low confidence (<5/10)
  if (avgConfidence && avgConfidence < 5) {
    recommendations.push({
      id: `low-confidence-${athleteId}`,
      athleteId,
      athleteName,
      priority: 'MEDIUM',
      category: 'COGNITIVE_RESTRUCTURING',
      title: 'Low Confidence - Review Past Successes',
      description: 'Schedule session to review performance highlights and reframe negative self-talk.',
      rationale: `Confidence below optimal (avg ${avgConfidence.toFixed(1)}/10)`,
      estimatedDuration: '20-30 min',
      triggers: ['low_confidence'],
      relatedMetrics: {
        confidence: avgConfidence,
      },
    });
  }

  // Rule 6: MEDIUM - Moderate readiness (50-60)
  if (recentReadiness && recentReadiness.score >= 50 && recentReadiness.score < 60) {
    recommendations.push({
      id: `moderate-readiness-${athleteId}`,
      athleteId,
      athleteName,
      priority: 'MEDIUM',
      category: 'RECOVERY_PROTOCOL',
      title: 'Suboptimal Readiness - Recovery Check',
      description: 'Review sleep, nutrition, and recovery habits. Consider implementing active recovery day.',
      rationale: `Readiness in moderate zone (${recentReadiness.score}/100)`,
      estimatedDuration: '15 min',
      triggers: ['moderate_readiness'],
      relatedMetrics: {
        readiness: recentReadiness.score,
      },
    });
  }

  // Rule 7: LOW - No engagement this week
  if (chatEngagement === 0 && recentMoods.length === 0) {
    recommendations.push({
      id: `no-engagement-${athleteId}`,
      athleteId,
      athleteName,
      priority: 'LOW',
      category: 'ONE_ON_ONE',
      title: 'No Recent Engagement',
      description: 'Athlete has not logged any data or used chat this week. Send reminder or brief check-in.',
      rationale: 'No chat sessions or mood logs in past 7 days',
      estimatedDuration: '5-10 min',
      triggers: ['no_engagement'],
      relatedMetrics: {
        engagement: 0,
      },
    });
  }

  return recommendations;
}

/**
 * Get prioritized intervention queue for a coach
 * Returns all recommendations for consented athletes, sorted by priority
 *
 * OPTIMIZED: Uses batched queries instead of per-athlete queries
 */
export async function getCoachInterventionQueue(coachId: string): Promise<InterventionQueue> {
  // Get all consented athletes with their user info
  const athleteRelations = await prisma.coachAthleteRelation.findMany({
    where: {
      coachId,
      consentGranted: true,
    },
    include: {
      Athlete: {
        include: {
          User: { select: { name: true, email: true } },
        },
      },
    },
  });

  const athleteIds = athleteRelations.map((r) => r.athleteId);

  if (athleteIds.length === 0) {
    return { urgent: [], high: [], medium: [], low: [], total: 0 };
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // BATCH FETCH: Get all data in parallel for all athletes
  const [allReadiness, allMoods, allChatSessions, allCrisisAlerts] = await Promise.all([
    // All readiness scores (most recent per athlete)
    prisma.readinessScore.findMany({
      where: {
        athleteId: { in: athleteIds },
        calculatedAt: { gte: sevenDaysAgo },
      },
      orderBy: { calculatedAt: 'desc' },
    }),
    // All mood logs
    prisma.moodLog.findMany({
      where: {
        athleteId: { in: athleteIds },
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // All chat sessions with message counts
    prisma.chatSession.findMany({
      where: {
        athleteId: { in: athleteIds },
        createdAt: { gte: sevenDaysAgo },
      },
      include: { _count: { select: { Message: true } } },
    }),
    // All unresolved crisis alerts
    prisma.crisisAlert.findMany({
      where: {
        athleteId: { in: athleteIds },
        reviewed: false,
      },
      orderBy: { detectedAt: 'desc' },
    }),
  ]);

  // Index data by athleteId for O(1) lookups
  const readinessByAthlete = new Map<string, typeof allReadiness[0]>();
  for (const r of allReadiness) {
    if (!readinessByAthlete.has(r.athleteId)) {
      readinessByAthlete.set(r.athleteId, r);
    }
  }

  const moodsByAthlete = new Map<string, typeof allMoods>();
  for (const m of allMoods) {
    if (!moodsByAthlete.has(m.athleteId)) {
      moodsByAthlete.set(m.athleteId, []);
    }
    const arr = moodsByAthlete.get(m.athleteId)!;
    if (arr.length < 7) arr.push(m); // Keep only 7 most recent
  }

  const chatsByAthlete = new Map<string, typeof allChatSessions>();
  for (const c of allChatSessions) {
    if (!chatsByAthlete.has(c.athleteId)) {
      chatsByAthlete.set(c.athleteId, []);
    }
    chatsByAthlete.get(c.athleteId)!.push(c);
  }

  const crisisByAthlete = new Map<string, typeof allCrisisAlerts[0]>();
  for (const c of allCrisisAlerts) {
    if (!crisisByAthlete.has(c.athleteId)) {
      crisisByAthlete.set(c.athleteId, c);
    }
  }

  // Generate recommendations using pre-fetched data (no additional queries!)
  const allRecommendations: InterventionRecommendation[] = [];

  for (const relation of athleteRelations) {
    const athleteId = relation.athleteId;
    const athleteName = relation.Athlete.User.name || relation.Athlete.User.email || 'Unknown';

    const recentReadiness = readinessByAthlete.get(athleteId);
    const recentMoods = moodsByAthlete.get(athleteId) || [];
    const chatSessions = chatsByAthlete.get(athleteId) || [];
    const unresolvedCrisis = crisisByAthlete.get(athleteId);

    // Calculate metrics from pre-fetched data
    let moodTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentMoods.length >= 3) {
      const recent3Avg = recentMoods.slice(0, 3).reduce((sum, m) => sum + m.mood, 0) / 3;
      const older3Avg = recentMoods.slice(3, 6).reduce((sum, m) => sum + m.mood, 0) / 3 || recent3Avg;
      if (recent3Avg < older3Avg - 1.5) moodTrend = 'declining';
      else if (recent3Avg > older3Avg + 1.5) moodTrend = 'improving';
    }

    const avgMood = recentMoods.length > 0 ? recentMoods.reduce((sum, m) => sum + m.mood, 0) / recentMoods.length : null;
    const avgStress = recentMoods.length > 0 ? recentMoods.reduce((sum, m) => sum + m.stress, 0) / recentMoods.length : null;
    const avgConfidence = recentMoods.length > 0 ? recentMoods.reduce((sum, m) => sum + m.confidence, 0) / recentMoods.length : null;
    const chatEngagement = chatSessions.length;

    // === RULE-BASED INTERVENTION LOGIC (same rules, no DB calls) ===

    // Rule 1: URGENT - Crisis alert
    if (unresolvedCrisis) {
      allRecommendations.push({
        id: `crisis-${unresolvedCrisis.id}`,
        athleteId,
        athleteName,
        priority: 'URGENT',
        category: 'ONE_ON_ONE',
        title: 'Crisis Alert - Immediate Check-In Required',
        description: 'Schedule immediate 1-on-1 meeting to assess athlete well-being',
        rationale: `Crisis detected on ${unresolvedCrisis.detectedAt.toLocaleDateString()}. Severity: ${unresolvedCrisis.severity}`,
        estimatedDuration: '30-45 min',
        dueBy: new Date(Date.now() + 24 * 60 * 60 * 1000),
        triggers: ['crisis_alert', unresolvedCrisis.severity],
        relatedMetrics: {},
      });
    }

    // Rule 2: URGENT - Very low readiness (<45)
    if (recentReadiness && recentReadiness.score < 45) {
      allRecommendations.push({
        id: `urgent-readiness-${athleteId}`,
        athleteId,
        athleteName,
        priority: 'URGENT',
        category: 'ONE_ON_ONE',
        title: 'Very Low Readiness - Immediate Assessment',
        description: 'Conduct welfare check and adjust training plan.',
        rationale: `Readiness score critically low (${recentReadiness.score}/100)`,
        estimatedDuration: '20-30 min',
        dueBy: new Date(Date.now() + 24 * 60 * 60 * 1000),
        triggers: ['low_readiness', `score_${recentReadiness.score}`],
        relatedMetrics: { readiness: recentReadiness.score },
      });
    }

    // Rule 3: HIGH - Declining mood + low engagement
    if (moodTrend === 'declining' && chatEngagement < 2 && avgMood && avgMood < 6) {
      allRecommendations.push({
        id: `mood-engagement-${athleteId}`,
        athleteId,
        athleteName,
        priority: 'HIGH',
        category: 'ONE_ON_ONE',
        title: 'Declining Mood with Withdrawal Pattern',
        description: 'Athlete showing signs of disengagement. Reach out for supportive check-in.',
        rationale: `Mood declining (avg ${avgMood.toFixed(1)}/10), only ${chatEngagement} chat sessions this week`,
        estimatedDuration: '15-20 min',
        dueBy: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        triggers: ['declining_mood', 'low_engagement'],
        relatedMetrics: { mood: avgMood, engagement: chatEngagement },
      });
    }

    // Rule 4: HIGH - Very high stress (>8/10)
    if (avgStress && avgStress > 8) {
      allRecommendations.push({
        id: `high-stress-${athleteId}`,
        athleteId,
        athleteName,
        priority: 'HIGH',
        category: 'MINDFULNESS',
        title: 'Elevated Stress - Stress Management Protocol',
        description: 'Assign mindfulness exercises and breathing techniques.',
        rationale: `Stress levels very high (avg ${avgStress.toFixed(1)}/10)`,
        estimatedDuration: '10 min instruction + daily practice',
        dueBy: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        triggers: ['high_stress', `stress_${avgStress.toFixed(1)}`],
        relatedMetrics: { stress: avgStress },
      });
    }

    // Rule 5: MEDIUM - Low confidence (<5/10)
    if (avgConfidence && avgConfidence < 5) {
      allRecommendations.push({
        id: `low-confidence-${athleteId}`,
        athleteId,
        athleteName,
        priority: 'MEDIUM',
        category: 'COGNITIVE_RESTRUCTURING',
        title: 'Low Confidence - Review Past Successes',
        description: 'Schedule session to review performance highlights.',
        rationale: `Confidence below optimal (avg ${avgConfidence.toFixed(1)}/10)`,
        estimatedDuration: '20-30 min',
        triggers: ['low_confidence'],
        relatedMetrics: { confidence: avgConfidence },
      });
    }

    // Rule 6: MEDIUM - Moderate readiness (50-60)
    if (recentReadiness && recentReadiness.score >= 50 && recentReadiness.score < 60) {
      allRecommendations.push({
        id: `moderate-readiness-${athleteId}`,
        athleteId,
        athleteName,
        priority: 'MEDIUM',
        category: 'RECOVERY_PROTOCOL',
        title: 'Suboptimal Readiness - Recovery Check',
        description: 'Review sleep, nutrition, and recovery habits.',
        rationale: `Readiness in moderate zone (${recentReadiness.score}/100)`,
        estimatedDuration: '15 min',
        triggers: ['moderate_readiness'],
        relatedMetrics: { readiness: recentReadiness.score },
      });
    }

    // Rule 7: LOW - No engagement this week
    if (chatEngagement === 0 && recentMoods.length === 0) {
      allRecommendations.push({
        id: `no-engagement-${athleteId}`,
        athleteId,
        athleteName,
        priority: 'LOW',
        category: 'ONE_ON_ONE',
        title: 'No Recent Engagement',
        description: 'Athlete has not logged any data or used chat this week.',
        rationale: 'No chat sessions or mood logs in past 7 days',
        estimatedDuration: '5-10 min',
        triggers: ['no_engagement'],
        relatedMetrics: { engagement: 0 },
      });
    }
  }

  // Group by priority
  const queue: InterventionQueue = {
    urgent: allRecommendations.filter((r) => r.priority === 'URGENT'),
    high: allRecommendations.filter((r) => r.priority === 'HIGH'),
    medium: allRecommendations.filter((r) => r.priority === 'MEDIUM'),
    low: allRecommendations.filter((r) => r.priority === 'LOW'),
    total: allRecommendations.length,
  };

  return queue;
}
