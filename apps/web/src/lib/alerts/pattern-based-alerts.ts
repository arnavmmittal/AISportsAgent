/**
 * Pattern-Based Alert System
 *
 * Addresses key issues with threshold-based alerting:
 * 1. GAMING: Athletes can avoid thresholds by reporting just above them
 *    → Solution: Use personal baselines and anomaly detection (z-scores)
 *
 * 2. FALSE POSITIVES: Universal thresholds don't account for individual variation
 *    → Solution: Compare to athlete's own historical patterns
 *
 * 3. MISSED SIGNALS: Single-day dips might not matter, sustained changes do
 *    → Solution: Use multi-day patterns, not single values
 *
 * 4. SOCIAL DESIRABILITY: Athletes report what they think coaches want
 *    → Solution: Look at behavioral patterns (engagement, timing) not just scores
 *
 * Alert Types:
 * - BASELINE_DEVIATION: Score significantly below personal baseline
 * - ENGAGEMENT_PATTERN: Unusual check-in behavior (sudden stop, irregular timing)
 * - DECLINE_TRAJECTORY: Sustained multi-day decline (not just one bad day)
 * - BURNOUT_PATTERN: Specific combination of signals indicating burnout risk
 * - CHAT_BEHAVIORAL: Changes in how athlete uses chat (shorter responses, topic shifts)
 */

import { prisma } from '@/lib/prisma';
import type { Severity } from '@prisma/client';

interface PatternAlert {
  type: PatternAlertType;
  athleteId: string;
  athleteName: string;
  severity: Severity;
  headline: string;
  explanation: string;
  evidence: string[];
  suggestedAction: string;
  metadata: Record<string, unknown>;
}

type PatternAlertType =
  | 'BASELINE_DEVIATION'
  | 'ENGAGEMENT_PATTERN'
  | 'DECLINE_TRAJECTORY'
  | 'BURNOUT_PATTERN'
  | 'CHAT_BEHAVIORAL';

/**
 * Generate pattern-based alerts for a coach's athletes
 * These are smarter than threshold-based rules and harder to game
 */
export async function generatePatternAlerts(coachId: string): Promise<PatternAlert[]> {
  const alerts: PatternAlert[] = [];

  // Get athletes with consent
  const athletes = await prisma.coachAthleteRelation.findMany({
    where: { coachId, consentGranted: true },
    include: {
      Athlete: {
        include: {
          User: { select: { name: true } },
          AthleteModel: true,
        },
      },
    },
  });

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (const rel of athletes) {
    const athlete = rel.Athlete;
    const athleteName = athlete.User.name || 'Athlete';
    const baseline = athlete.AthleteModel;

    // 1. BASELINE DEVIATION
    // Use athlete's personal baseline, not universal threshold
    const baselineAlert = await checkBaselineDeviation(
      athlete.userId,
      athleteName,
      baseline,
      sevenDaysAgo
    );
    if (baselineAlert) alerts.push(baselineAlert);

    // 2. ENGAGEMENT PATTERN
    // Look at check-in behavior, not just scores
    const engagementAlert = await checkEngagementPattern(
      athlete.userId,
      athleteName,
      thirtyDaysAgo,
      now
    );
    if (engagementAlert) alerts.push(engagementAlert);

    // 3. DECLINE TRAJECTORY
    // Sustained multi-day decline, not single dip
    const declineAlert = await checkDeclineTrajectory(
      athlete.userId,
      athleteName,
      sevenDaysAgo
    );
    if (declineAlert) alerts.push(declineAlert);

    // 4. BURNOUT PATTERN
    // Specific combination indicating burnout risk
    const burnoutAlert = await checkBurnoutPattern(
      athlete.userId,
      athleteName,
      thirtyDaysAgo
    );
    if (burnoutAlert) alerts.push(burnoutAlert);

    // 5. CHAT BEHAVIORAL
    // Changes in how athlete uses chat
    const chatAlert = await checkChatBehavioral(
      athlete.userId,
      athleteName,
      thirtyDaysAgo
    );
    if (chatAlert) alerts.push(chatAlert);
  }

  // Sort by severity
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * 1. BASELINE DEVIATION
 * Compare to athlete's personal historical average, not universal threshold
 */
async function checkBaselineDeviation(
  athleteId: string,
  athleteName: string,
  baseline: { baselineMood: number | null; baselineConfidence: number | null; baselineStress: number | null } | null,
  since: Date
): Promise<PatternAlert | null> {
  if (!baseline?.baselineMood) return null;

  const recentLogs = await prisma.moodLog.findMany({
    where: { athleteId, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 7,
  });

  if (recentLogs.length < 3) return null;

  const avgMood = recentLogs.reduce((s, l) => s + l.mood, 0) / recentLogs.length;
  const avgConfidence = recentLogs.reduce((s, l) => s + l.confidence, 0) / recentLogs.length;

  // Calculate how many standard deviations from baseline
  // Use a rough SD estimate of 1.5 (typical for 1-10 mood scales)
  const estimatedSD = 1.5;
  const moodZScore = (avgMood - baseline.baselineMood) / estimatedSD;
  const confZScore = (avgConfidence - (baseline.baselineConfidence || 6)) / estimatedSD;

  // Alert if 1.5+ SD below baseline (roughly bottom 7%)
  if (moodZScore <= -1.5 || confZScore <= -1.5) {
    const worseMetric = moodZScore <= confZScore ? 'mood' : 'confidence';
    const zScore = Math.min(moodZScore, confZScore);

    return {
      type: 'BASELINE_DEVIATION',
      athleteId,
      athleteName,
      severity: zScore <= -2 ? 'HIGH' : 'MEDIUM',
      headline: `${athleteName} is significantly below their personal baseline`,
      explanation: `Their recent ${worseMetric} is ${Math.abs(zScore).toFixed(1)} standard deviations below their normal. This isn't about hitting a universal threshold - it's unusual for THIS athlete.`,
      evidence: [
        `Personal baseline ${worseMetric}: ${worseMetric === 'mood' ? baseline.baselineMood.toFixed(1) : (baseline.baselineConfidence || 6).toFixed(1)}`,
        `Recent average: ${worseMetric === 'mood' ? avgMood.toFixed(1) : avgConfidence.toFixed(1)}`,
        `Based on ${recentLogs.length} check-ins over the past week`,
      ],
      suggestedAction: `Check in with ${athleteName} - something may be off even if numbers look "okay" by general standards`,
      metadata: { avgMood, avgConfidence, moodZScore, confZScore, baselineMood: baseline.baselineMood },
    };
  }

  return null;
}

/**
 * 2. ENGAGEMENT PATTERN
 * Look at check-in behavior changes - harder to game than scores
 */
async function checkEngagementPattern(
  athleteId: string,
  athleteName: string,
  since: Date,
  now: Date
): Promise<PatternAlert | null> {
  const logs = await prisma.moodLog.findMany({
    where: { athleteId, createdAt: { gte: since } },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });

  if (logs.length < 5) return null; // Not enough history

  // Calculate engagement patterns
  const daysSinceStart = Math.floor((now.getTime() - since.getTime()) / (24 * 60 * 60 * 1000));
  const checkInRate = logs.length / daysSinceStart;

  // Look at recent vs historical engagement
  const midpoint = new Date(since.getTime() + (now.getTime() - since.getTime()) / 2);
  const recentLogs = logs.filter(l => l.createdAt >= midpoint);
  const olderLogs = logs.filter(l => l.createdAt < midpoint);

  const recentRate = recentLogs.length / (daysSinceStart / 2);
  const olderRate = olderLogs.length / (daysSinceStart / 2);

  // Alert if engagement dropped significantly (50%+ decline)
  if (olderRate > 0 && recentRate / olderRate < 0.5) {
    return {
      type: 'ENGAGEMENT_PATTERN',
      athleteId,
      athleteName,
      severity: recentRate < 0.2 ? 'HIGH' : 'MEDIUM',
      headline: `${athleteName}'s check-in frequency dropped significantly`,
      explanation: `They used to check in ${olderRate.toFixed(1)} times/day, now it's ${recentRate.toFixed(1)}. Disengagement can be an early warning sign.`,
      evidence: [
        `First half of period: ${olderLogs.length} check-ins`,
        `Recent period: ${recentLogs.length} check-ins`,
        `${Math.round((1 - recentRate / olderRate) * 100)}% drop in engagement`,
      ],
      suggestedAction: `Reach out to understand why engagement dropped - could be busy, frustrated with the app, or struggling`,
      metadata: { recentRate, olderRate, recentCount: recentLogs.length, olderCount: olderLogs.length },
    };
  }

  return null;
}

/**
 * 3. DECLINE TRAJECTORY
 * Multi-day sustained decline, not single bad day
 */
async function checkDeclineTrajectory(
  athleteId: string,
  athleteName: string,
  since: Date
): Promise<PatternAlert | null> {
  const logs = await prisma.moodLog.findMany({
    where: { athleteId, createdAt: { gte: since } },
    orderBy: { createdAt: 'asc' },
  });

  if (logs.length < 5) return null;

  // Check for consecutive days of decline
  let consecutiveDeclines = 0;
  let maxConsecutive = 0;
  let totalDecline = 0;

  for (let i = 1; i < logs.length; i++) {
    const prevMood = logs[i - 1].mood;
    const currMood = logs[i].mood;

    if (currMood < prevMood) {
      consecutiveDeclines++;
      totalDecline += prevMood - currMood;
      maxConsecutive = Math.max(maxConsecutive, consecutiveDeclines);
    } else {
      consecutiveDeclines = 0;
    }
  }

  // Alert if 3+ consecutive declines or total drop of 3+ points
  if (maxConsecutive >= 3 || totalDecline >= 3) {
    const latestMood = logs[logs.length - 1].mood;
    const earliestMood = logs[0].mood;

    return {
      type: 'DECLINE_TRAJECTORY',
      athleteId,
      athleteName,
      severity: maxConsecutive >= 4 || totalDecline >= 4 ? 'HIGH' : 'MEDIUM',
      headline: `${athleteName} shows a sustained decline pattern`,
      explanation: `This isn't just one bad day - there's a consistent downward trend over multiple check-ins.`,
      evidence: [
        `${maxConsecutive} consecutive days of declining mood`,
        `Overall change: ${earliestMood.toFixed(1)} → ${latestMood.toFixed(1)}`,
        `Total decline: ${totalDecline.toFixed(1)} points across ${logs.length} check-ins`,
      ],
      suggestedAction: `Consider a proactive 1:1 - sustained decline often means something deeper is going on`,
      metadata: { maxConsecutive, totalDecline, latestMood, earliestMood, logCount: logs.length },
    };
  }

  return null;
}

/**
 * 4. BURNOUT PATTERN
 * Specific combination of signals - not just low scores
 */
async function checkBurnoutPattern(
  athleteId: string,
  athleteName: string,
  since: Date
): Promise<PatternAlert | null> {
  const logs = await prisma.moodLog.findMany({
    where: { athleteId, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 14,
  });

  if (logs.length < 7) return null;

  // Burnout indicators
  const indicators: string[] = [];
  let burnoutScore = 0;

  // 1. Chronic high stress (average > 7)
  const avgStress = logs.reduce((s, l) => s + l.stress, 0) / logs.length;
  if (avgStress > 7) {
    indicators.push(`Chronic high stress (avg ${avgStress.toFixed(1)}/10)`);
    burnoutScore += 2;
  }

  // 2. Low energy despite rest (sleep ok but energy low)
  const logsWithSleep = logs.filter(l => l.sleep && l.energy);
  if (logsWithSleep.length >= 3) {
    const avgSleep = logsWithSleep.reduce((s, l) => s + (l.sleep || 0), 0) / logsWithSleep.length;
    const avgEnergy = logsWithSleep.reduce((s, l) => s + (l.energy || 0), 0) / logsWithSleep.length;
    if (avgSleep >= 7 && avgEnergy < 5) {
      indicators.push(`Low energy despite adequate sleep (${avgSleep.toFixed(1)}h sleep, ${avgEnergy.toFixed(1)}/10 energy)`);
      burnoutScore += 2;
    }
  }

  // 3. Declining confidence trend
  if (logs.length >= 5) {
    const recentConf = logs.slice(0, 3).reduce((s, l) => s + l.confidence, 0) / 3;
    const olderConf = logs.slice(-3).reduce((s, l) => s + l.confidence, 0) / 3;
    if (recentConf < olderConf - 1.5) {
      indicators.push(`Confidence declining (${olderConf.toFixed(1)} → ${recentConf.toFixed(1)})`);
      burnoutScore += 1;
    }
  }

  // 4. Mood flatness (low variance = going through motions)
  const moods = logs.map(l => l.mood);
  const moodMean = moods.reduce((a, b) => a + b, 0) / moods.length;
  const moodVariance = moods.reduce((sum, m) => sum + Math.pow(m - moodMean, 2), 0) / moods.length;
  if (moodVariance < 1 && moodMean < 6) {
    indicators.push(`Flat, low mood pattern (variance: ${moodVariance.toFixed(2)})`);
    burnoutScore += 1;
  }

  // Alert if 2+ burnout indicators
  if (burnoutScore >= 3) {
    return {
      type: 'BURNOUT_PATTERN',
      athleteId,
      athleteName,
      severity: burnoutScore >= 4 ? 'HIGH' : 'MEDIUM',
      headline: `${athleteName} shows burnout warning signs`,
      explanation: `Multiple indicators suggest burnout risk. This pattern is harder to fake and often indicates real struggles.`,
      evidence: indicators,
      suggestedAction: `Consider discussing workload/stress management - burnout is easier to prevent than recover from`,
      metadata: { burnoutScore, indicators, logCount: logs.length, avgStress },
    };
  }

  return null;
}

/**
 * 5. CHAT BEHAVIORAL
 * Changes in how athlete uses chat - topic shifts, engagement changes
 */
async function checkChatBehavioral(
  athleteId: string,
  athleteName: string,
  since: Date
): Promise<PatternAlert | null> {
  const insights = await prisma.chatInsight.findMany({
    where: { athleteId, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  if (insights.length < 3) return null;

  // Check for concerning topic shifts
  const concerningTopics = ['injury-concern', 'burnout', 'quitting', 'conflict', 'hopeless'];
  const recentTopics = insights.flatMap(i => i.topics);
  const concerningMentions = recentTopics.filter(t => concerningTopics.some(c => t.includes(c)));

  // Check sentiment trajectory
  const avgSentiment = insights.reduce((s, i) => s + i.overallSentiment, 0) / insights.length;
  const recentSentiment = insights.slice(0, 3).reduce((s, i) => s + i.overallSentiment, 0) / 3;
  const olderSentiment = insights.slice(-3).reduce((s, i) => s + i.overallSentiment, 0) / 3;

  const evidence: string[] = [];
  let shouldAlert = false;

  if (concerningMentions.length >= 2) {
    evidence.push(`Discussed concerning topics: ${[...new Set(concerningMentions)].join(', ')}`);
    shouldAlert = true;
  }

  if (recentSentiment < olderSentiment - 0.3) {
    evidence.push(`Conversation sentiment declining (${(olderSentiment * 100).toFixed(0)} → ${(recentSentiment * 100).toFixed(0)})`);
    shouldAlert = true;
  }

  if (avgSentiment < -0.3) {
    evidence.push(`Consistently negative tone in conversations (${(avgSentiment * 100).toFixed(0)})`);
    shouldAlert = true;
  }

  if (shouldAlert && evidence.length >= 2) {
    return {
      type: 'CHAT_BEHAVIORAL',
      athleteId,
      athleteName,
      severity: avgSentiment < -0.4 ? 'HIGH' : 'MEDIUM',
      headline: `${athleteName}'s chat patterns show concerning changes`,
      explanation: `The way they're using the AI coach has shifted - topic choices and emotional tone suggest something may be wrong.`,
      evidence,
      suggestedAction: `Review recent chat summaries if available, or check in directly`,
      metadata: { concerningMentions, avgSentiment, recentSentiment, olderSentiment },
    };
  }

  return null;
}

export type { PatternAlert, PatternAlertType };
