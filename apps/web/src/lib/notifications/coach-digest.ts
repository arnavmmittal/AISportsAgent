/**
 * Coach Notification Digest System
 *
 * Addresses notification overload:
 * 1. Daily cap: Max 5-7 notifications per day (prevents alert fatigue)
 * 2. Priority-based: Critical/High always shown, Medium/Low go to digest
 * 3. Aggregation: Similar alerts grouped ("3 athletes have low readiness")
 * 4. Weekly digest: Non-urgent items summarized weekly
 * 5. Smart timing: Delivered at coach's preferred time, not 2am
 *
 * Philosophy: Coaches managing 150+ athletes can't respond to 50 alerts.
 * Quality > Quantity. Every notification should feel actionable.
 */

import { prisma } from '@/lib/prisma';
import type { Severity } from '@prisma/client';
import {
  generatePatternAlerts,
  type PatternAlert,
} from '@/lib/alerts/pattern-based-alerts';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Maximum notifications per day per coach
  MAX_DAILY_NOTIFICATIONS: 6,

  // Severity thresholds
  ALWAYS_NOTIFY: ['CRITICAL', 'HIGH'] as Severity[],
  DIGEST_ONLY: ['LOW'] as Severity[],

  // If more than this many athletes have same issue, aggregate
  AGGREGATION_THRESHOLD: 3,

  // Weekly digest day (0 = Sunday, 1 = Monday)
  WEEKLY_DIGEST_DAY: 1, // Monday

  // Quiet hours (don't send notifications during these hours)
  QUIET_HOURS_START: 22, // 10 PM
  QUIET_HOURS_END: 7, // 7 AM
};

// ============================================================================
// TYPES
// ============================================================================

interface ProcessedNotification {
  id: string;
  type: 'immediate' | 'digest' | 'aggregated';
  severity: Severity;
  headline: string;
  details: string;
  athleteIds: string[];
  athleteNames: string[];
  actionUrl?: string;
  suggestedAction: string;
  createdAt: Date;
}

interface CoachDigest {
  coachId: string;
  coachName: string;
  immediate: ProcessedNotification[]; // Send now
  digest: ProcessedNotification[]; // Hold for daily/weekly digest
  aggregated: ProcessedNotification[]; // Multiple athletes, same issue
  weeklyOnly: ProcessedNotification[]; // Low priority, weekly summary
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Process alerts for a coach and return structured notifications
 * This is the main entry point - call daily or on-demand
 */
export async function processCoachNotifications(coachId: string): Promise<CoachDigest> {
  const coach = await prisma.user.findUnique({
    where: { id: coachId },
    select: { name: true },
  });

  const digest: CoachDigest = {
    coachId,
    coachName: coach?.name || 'Coach',
    immediate: [],
    digest: [],
    aggregated: [],
    weeklyOnly: [],
  };

  // Get today's already-sent notifications to avoid duplicates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sentToday = await prisma.generatedAlert.count({
    where: {
      coachId,
      createdAt: { gte: today },
      isRead: true,
    },
  });

  const remainingBudget = CONFIG.MAX_DAILY_NOTIFICATIONS - sentToday;

  // Generate pattern-based alerts
  const patternAlerts = await generatePatternAlerts(coachId);

  // Get pending threshold-based alerts (unread and not dismissed)
  const pendingAlerts = await prisma.generatedAlert.findMany({
    where: {
      coachId,
      isRead: false,
      isDismissed: false,
    },
    orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
  });

  // Combine all alerts
  const allAlerts: Array<{
    severity: Severity;
    headline: string;
    details: string;
    athleteId?: string;
    athleteName?: string;
    suggestedAction: string;
    source: 'pattern' | 'threshold';
    metadata?: Record<string, unknown>;
  }> = [
    ...patternAlerts.map((a) => ({
      severity: a.severity,
      headline: a.headline,
      details: a.explanation,
      athleteId: a.athleteId,
      athleteName: a.athleteName,
      suggestedAction: a.suggestedAction,
      source: 'pattern' as const,
      metadata: a.metadata,
    })),
    ...pendingAlerts.map((a) => ({
      severity: a.severity,
      headline: a.title,
      details: a.message,
      athleteId: a.athleteId || undefined,
      athleteName: undefined, // Need to fetch separately if needed
      suggestedAction: 'Review this alert',
      source: 'threshold' as const,
      metadata: a.metadata as Record<string, unknown> | undefined,
    })),
  ];

  // Sort by severity
  const severityOrder: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };
  allAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Group similar alerts for aggregation
  const grouped = groupSimilarAlerts(allAlerts);

  // Process each group
  let immediateCount = 0;

  for (const group of grouped) {
    const notification = createNotification(group);

    // CRITICAL/HIGH always go to immediate (if within budget)
    if (CONFIG.ALWAYS_NOTIFY.includes(group.severity)) {
      if (immediateCount < remainingBudget) {
        digest.immediate.push(notification);
        immediateCount++;
      } else {
        // Budget exceeded, add to digest
        digest.digest.push(notification);
      }
    }
    // LOW goes to weekly digest
    else if (CONFIG.DIGEST_ONLY.includes(group.severity)) {
      digest.weeklyOnly.push(notification);
    }
    // MEDIUM goes to daily digest
    else {
      if (group.athleteIds.length >= CONFIG.AGGREGATION_THRESHOLD) {
        digest.aggregated.push(notification);
      } else {
        digest.digest.push(notification);
      }
    }
  }

  // Apply final cap on immediate notifications
  if (digest.immediate.length > CONFIG.MAX_DAILY_NOTIFICATIONS) {
    const overflow = digest.immediate.splice(CONFIG.MAX_DAILY_NOTIFICATIONS);
    digest.digest.push(...overflow);
  }

  return digest;
}

/**
 * Get weekly digest for a coach
 * Call on Monday (or configured day)
 */
export async function generateWeeklyDigest(coachId: string): Promise<{
  summary: string;
  totalAlerts: number;
  topConcerns: string[];
  athletesNeedingAttention: string[];
  positiveNotes: string[];
}> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Get all alerts from past week
  const weeklyAlerts = await prisma.generatedAlert.findMany({
    where: {
      coachId,
      createdAt: { gte: weekAgo },
    },
    include: {
      Athlete: {
        include: { User: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get athletes who had issues
  const athletesWithIssues = new Set<string>();
  const concernCounts: Record<string, number> = {};

  for (const alert of weeklyAlerts) {
    if (alert.athleteId) {
      athletesWithIssues.add(alert.Athlete?.User.name || 'Unknown');
    }

    // Count concern types (extract from ruleId or metadata)
    const metadata = alert.metadata as Record<string, unknown> | null;
    const concern = (metadata?.alertType as string) || alert.ruleId || 'general';
    concernCounts[concern] = (concernCounts[concern] || 0) + 1;
  }

  // Get top concerns
  const topConcerns = Object.entries(concernCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([concern, count]) => `${formatConcernType(concern)} (${count})`);

  // Get positive notes - athletes who improved
  const improvedAthletes = await getImprovedAthletes(coachId, weekAgo);

  return {
    summary: `This week: ${weeklyAlerts.length} alerts across ${athletesWithIssues.size} athletes`,
    totalAlerts: weeklyAlerts.length,
    topConcerns,
    athletesNeedingAttention: [...athletesWithIssues].slice(0, 5),
    positiveNotes: improvedAthletes.slice(0, 3),
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface AlertGroup {
  type: string;
  severity: Severity;
  alerts: Array<{
    headline: string;
    details: string;
    athleteId?: string;
    athleteName?: string;
    suggestedAction: string;
  }>;
  athleteIds: string[];
  athleteNames: string[];
}

function groupSimilarAlerts(
  alerts: Array<{
    severity: Severity;
    headline: string;
    details: string;
    athleteId?: string;
    athleteName?: string;
    suggestedAction: string;
    source: string;
  }>
): AlertGroup[] {
  const groups: Map<string, AlertGroup> = new Map();

  for (const alert of alerts) {
    // Create group key based on alert type/pattern
    const groupKey = getGroupKey(alert.headline, alert.severity);

    if (groups.has(groupKey)) {
      const group = groups.get(groupKey)!;
      group.alerts.push(alert);
      if (alert.athleteId) group.athleteIds.push(alert.athleteId);
      if (alert.athleteName) group.athleteNames.push(alert.athleteName);
    } else {
      groups.set(groupKey, {
        type: groupKey,
        severity: alert.severity,
        alerts: [alert],
        athleteIds: alert.athleteId ? [alert.athleteId] : [],
        athleteNames: alert.athleteName ? [alert.athleteName] : [],
      });
    }
  }

  return Array.from(groups.values());
}

function getGroupKey(headline: string, severity: Severity): string {
  // Extract the pattern type from headline
  const patterns = [
    'baseline', 'engagement', 'decline', 'burnout', 'chat',
    'readiness', 'inactivity', 'sentiment', 'forecast',
  ];

  for (const pattern of patterns) {
    if (headline.toLowerCase().includes(pattern)) {
      return `${severity}-${pattern}`;
    }
  }

  return `${severity}-general`;
}

function createNotification(group: AlertGroup): ProcessedNotification {
  const isAggregated = group.athleteIds.length >= CONFIG.AGGREGATION_THRESHOLD;

  let headline: string;
  let details: string;

  if (isAggregated) {
    headline = `${group.athleteIds.length} athletes: ${group.alerts[0].headline.split(':')[0] || group.type}`;
    details = `${group.athleteNames.slice(0, 3).join(', ')}${group.athleteIds.length > 3 ? ` and ${group.athleteIds.length - 3} more` : ''}`;
  } else {
    headline = group.alerts[0].headline;
    details = group.alerts[0].details;
  }

  return {
    id: `${group.type}-${Date.now()}`,
    type: isAggregated ? 'aggregated' : group.severity === 'LOW' ? 'digest' : 'immediate',
    severity: group.severity,
    headline,
    details,
    athleteIds: group.athleteIds,
    athleteNames: group.athleteNames,
    suggestedAction: group.alerts[0].suggestedAction,
    createdAt: new Date(),
  };
}

function formatConcernType(type: string): string {
  const mapping: Record<string, string> = {
    READINESS_DROP: 'Low readiness',
    INACTIVITY: 'Check-in gaps',
    SENTIMENT_DECLINE: 'Negative sentiment',
    BASELINE_DEVIATION: 'Below baseline',
    BURNOUT_PATTERN: 'Burnout signs',
    DECLINE_TRAJECTORY: 'Declining trend',
  };
  return mapping[type] || type.toLowerCase().replace(/_/g, ' ');
}

async function getImprovedAthletes(coachId: string, since: Date): Promise<string[]> {
  // Find athletes whose readiness improved
  const athletes = await prisma.coachAthleteRelation.findMany({
    where: { coachId, consentGranted: true },
    include: { Athlete: { include: { User: { select: { name: true } } } } },
  });

  const improved: string[] = [];

  for (const rel of athletes) {
    const scores = await prisma.readinessScore.findMany({
      where: { athleteId: rel.athleteId, calculatedAt: { gte: since } },
      orderBy: { calculatedAt: 'asc' },
    });

    if (scores.length >= 3) {
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
      const secondHalf = scores.slice(Math.floor(scores.length / 2));

      const firstAvg = firstHalf.reduce((s, sc) => s + sc.score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, sc) => s + sc.score, 0) / secondHalf.length;

      if (secondAvg > firstAvg + 5) {
        improved.push(`${rel.Athlete.User.name || 'Athlete'} improved ${Math.round(secondAvg - firstAvg)} points`);
      }
    }
  }

  return improved;
}

/**
 * Check if we're in quiet hours
 */
export function isQuietHours(): boolean {
  const hour = new Date().getHours();
  return hour >= CONFIG.QUIET_HOURS_START || hour < CONFIG.QUIET_HOURS_END;
}

/**
 * Should send weekly digest today?
 */
export function isWeeklyDigestDay(): boolean {
  return new Date().getDay() === CONFIG.WEEKLY_DIGEST_DAY;
}

export { CONFIG as NOTIFICATION_CONFIG };
export type { ProcessedNotification, CoachDigest };
