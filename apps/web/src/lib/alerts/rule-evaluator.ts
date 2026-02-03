/**
 * Alert Rule Evaluator
 *
 * Evaluates coach-defined alert rules against current data
 * and generates alerts when conditions are met.
 *
 * Supports these rule types:
 * - READINESS_DROP: Readiness score drops below threshold
 * - READINESS_DECLINE: Readiness trending down over time
 * - INACTIVITY: No check-in for X days
 * - CHAT_INACTIVITY: No chat for X days
 * - SENTIMENT_DECLINE: Chat sentiment drops below threshold
 * - THEME_MENTION: Specific topic mentioned in chat
 * - MULTIPLE_ATHLETES: X athletes have same condition
 * - FORECAST_DECLINE: Predicted readiness decline
 * - MISSED_CHECKINS: Missed X check-ins in time window
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { AlertRule, Severity, AlertTriggerType } from '@prisma/client';

interface RuleEvaluationResult {
  triggered: boolean;
  athleteId?: string;
  athleteName?: string;
  message: string;
  severity: Severity;
  metadata?: Record<string, unknown>;
}

/**
 * Evaluate all enabled rules for a coach
 */
export async function evaluateRulesForCoach(coachId: string): Promise<void> {
  // Get all enabled rules for this coach
  const rules = await prisma.alertRule.findMany({
    where: {
      coachId,
      isEnabled: true,
    },
  });

  // Get coach's athletes
  const coach = await prisma.coach.findUnique({
    where: { userId: coachId },
    select: { sport: true },
  });

  if (!coach) return;

  // Get athletes with consent
  const athletes = await prisma.athlete.findMany({
    where: {
      CoachAthlete: {
        some: {
          coachId,
          consentGranted: true,
        },
      },
    },
    include: {
      User: { select: { name: true } },
    },
  });

  // Evaluate each rule
  for (const rule of rules) {
    const results = await evaluateRule(rule, athletes);

    // Create alerts for triggered results
    for (const result of results) {
      if (result.triggered) {
        await createAlertFromResult(rule, coachId, result);
      }
    }

    // Update rule's last triggered time and count
    if (results.some(r => r.triggered)) {
      await prisma.alertRule.update({
        where: { id: rule.id },
        data: {
          lastTriggeredAt: new Date(),
          triggerCount: { increment: 1 },
        },
      });
    }
  }
}

/**
 * Evaluate a single rule against all applicable athletes
 */
async function evaluateRule(
  rule: AlertRule,
  athletes: Array<{ userId: string; User: { name: string | null } }>
): Promise<RuleEvaluationResult[]> {
  const results: RuleEvaluationResult[] = [];
  const now = new Date();
  const timeWindow = rule.timeWindowDays || 7;
  const windowStart = new Date(now.getTime() - timeWindow * 24 * 60 * 60 * 1000);

  switch (rule.triggerType as AlertTriggerType) {
    case 'READINESS_DROP':
      // Check if any athlete's current readiness is below threshold
      for (const athlete of athletes) {
        const latestReadiness = await prisma.readinessScore.findFirst({
          where: { athleteId: athlete.userId },
          orderBy: { calculatedAt: 'desc' },
        });

        if (latestReadiness && rule.threshold && latestReadiness.score < rule.threshold) {
          results.push({
            triggered: true,
            athleteId: athlete.userId,
            athleteName: athlete.User.name || 'Unknown',
            message: `${athlete.User.name || 'Athlete'}'s readiness dropped to ${latestReadiness.score} (below ${rule.threshold})`,
            severity: latestReadiness.score < 50 ? 'HIGH' : 'MEDIUM',
            metadata: { score: latestReadiness.score, threshold: rule.threshold },
          });
        }
      }
      break;

    case 'INACTIVITY':
      // Check for athletes who haven't logged mood in X days
      for (const athlete of athletes) {
        const latestMoodLog = await prisma.moodLog.findFirst({
          where: { athleteId: athlete.userId },
          orderBy: { createdAt: 'desc' },
        });

        const daysSinceLog = latestMoodLog
          ? Math.floor((now.getTime() - latestMoodLog.createdAt.getTime()) / (24 * 60 * 60 * 1000))
          : 999;

        const thresholdDays = rule.threshold || 7;
        if (daysSinceLog >= thresholdDays) {
          results.push({
            triggered: true,
            athleteId: athlete.userId,
            athleteName: athlete.User.name || 'Unknown',
            message: `${athlete.User.name || 'Athlete'} hasn't checked in for ${daysSinceLog} days`,
            severity: daysSinceLog >= 14 ? 'HIGH' : 'MEDIUM',
            metadata: { daysSinceLog, thresholdDays },
          });
        }
      }
      break;

    case 'CHAT_INACTIVITY':
      // Check for athletes who haven't chatted in X days
      for (const athlete of athletes) {
        const latestSession = await prisma.chatSession.findFirst({
          where: { athleteId: athlete.userId },
          orderBy: { createdAt: 'desc' },
        });

        const daysSinceChat = latestSession
          ? Math.floor((now.getTime() - latestSession.createdAt.getTime()) / (24 * 60 * 60 * 1000))
          : 999;

        const thresholdDays = rule.threshold || 7;
        if (daysSinceChat >= thresholdDays) {
          results.push({
            triggered: true,
            athleteId: athlete.userId,
            athleteName: athlete.User.name || 'Unknown',
            message: `${athlete.User.name || 'Athlete'} hasn't used the AI coach for ${daysSinceChat} days`,
            severity: 'LOW',
            metadata: { daysSinceChat, thresholdDays },
          });
        }
      }
      break;

    case 'SENTIMENT_DECLINE':
      // Check for athletes with negative sentiment in recent chats
      for (const athlete of athletes) {
        const recentInsights = await prisma.chatInsight.findMany({
          where: {
            athleteId: athlete.userId,
            createdAt: { gte: windowStart },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        if (recentInsights.length > 0) {
          const avgSentiment = recentInsights.reduce((sum, i) => sum + i.overallSentiment, 0) / recentInsights.length;
          const threshold = rule.threshold || -0.2;

          if (avgSentiment < threshold) {
            results.push({
              triggered: true,
              athleteId: athlete.userId,
              athleteName: athlete.User.name || 'Unknown',
              message: `${athlete.User.name || 'Athlete'}'s conversation sentiment is concerning (${(avgSentiment * 100).toFixed(0)})`,
              severity: avgSentiment < -0.5 ? 'HIGH' : 'MEDIUM',
              metadata: { avgSentiment, threshold },
            });
          }
        }
      }
      break;

    case 'THEME_MENTION':
      // Check for athletes mentioning a specific topic
      if (!rule.thresholdString) break;

      for (const athlete of athletes) {
        const recentInsights = await prisma.chatInsight.findMany({
          where: {
            athleteId: athlete.userId,
            createdAt: { gte: windowStart },
            topics: { has: rule.thresholdString },
          },
        });

        if (recentInsights.length > 0) {
          results.push({
            triggered: true,
            athleteId: athlete.userId,
            athleteName: athlete.User.name || 'Unknown',
            message: `${athlete.User.name || 'Athlete'} mentioned "${rule.thresholdString}" in recent conversations`,
            severity: ['injury-concern', 'performance-anxiety', 'coach-pressure'].includes(rule.thresholdString)
              ? 'MEDIUM'
              : 'LOW',
            metadata: { topic: rule.thresholdString, mentionCount: recentInsights.length },
          });
        }
      }
      break;

    case 'READINESS_DECLINE':
      // Check for athletes whose readiness is trending down
      for (const athlete of athletes) {
        const recentScores = await prisma.readinessScore.findMany({
          where: {
            athleteId: athlete.userId,
            calculatedAt: { gte: windowStart },
          },
          orderBy: { calculatedAt: 'asc' },
        });

        if (recentScores.length >= 3) {
          // Calculate trend (simple linear regression)
          const n = recentScores.length;
          const sumX = (n * (n - 1)) / 2;
          const sumY = recentScores.reduce((sum, s) => sum + s.score, 0);
          const sumXY = recentScores.reduce((sum, s, i) => sum + i * s.score, 0);
          const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

          const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

          // Negative slope indicates decline
          const declineThreshold = rule.threshold || -1.5;
          if (slope < declineThreshold) {
            results.push({
              triggered: true,
              athleteId: athlete.userId,
              athleteName: athlete.User.name || 'Unknown',
              message: `${athlete.User.name || 'Athlete'}'s readiness is trending down (${slope.toFixed(1)} points/day)`,
              severity: slope < -3 ? 'HIGH' : 'MEDIUM',
              metadata: { slope, declineThreshold },
            });
          }
        }
      }
      break;

    case 'FORECAST_DECLINE':
      // Check readiness forecasts for predicted declines
      for (const athlete of athletes) {
        // Get latest readiness and forecast a simple trend
        const recentScores = await prisma.readinessScore.findMany({
          where: {
            athleteId: athlete.userId,
            calculatedAt: { gte: windowStart },
          },
          orderBy: { calculatedAt: 'desc' },
          take: 7,
        });

        if (recentScores.length >= 3) {
          const avgScore = recentScores.reduce((sum, s) => sum + s.score, 0) / recentScores.length;
          const latestScore = recentScores[0].score;
          const trendDirection = latestScore - avgScore;

          // If trending down and forecast to drop below threshold
          const forecastScore = latestScore + trendDirection * 3; // Project 3 days out
          const threshold = rule.threshold || 60;

          if (forecastScore < threshold && latestScore >= threshold) {
            results.push({
              triggered: true,
              athleteId: athlete.userId,
              athleteName: athlete.User.name || 'Unknown',
              message: `${athlete.User.name || 'Athlete'}'s readiness is forecast to drop below ${threshold} in the coming days`,
              severity: 'MEDIUM',
              metadata: { currentScore: latestScore, forecastScore, threshold },
            });
          }
        }
      }
      break;

    case 'MULTIPLE_ATHLETES':
      // This is a meta-rule - check if multiple athletes meet a condition
      // For now, check if multiple athletes have low readiness
      const athletesWithLowReadiness: string[] = [];
      const threshold = rule.threshold || 60;
      const minCount = rule.minOccurrences || 3;

      for (const athlete of athletes) {
        const latestReadiness = await prisma.readinessScore.findFirst({
          where: { athleteId: athlete.userId },
          orderBy: { calculatedAt: 'desc' },
        });

        if (latestReadiness && latestReadiness.score < threshold) {
          athletesWithLowReadiness.push(athlete.User.name || 'Unknown');
        }
      }

      if (athletesWithLowReadiness.length >= minCount) {
        results.push({
          triggered: true,
          message: `${athletesWithLowReadiness.length} athletes have readiness below ${threshold}: ${athletesWithLowReadiness.slice(0, 3).join(', ')}${athletesWithLowReadiness.length > 3 ? '...' : ''}`,
          severity: athletesWithLowReadiness.length >= 5 ? 'HIGH' : 'MEDIUM',
          metadata: {
            count: athletesWithLowReadiness.length,
            athletes: athletesWithLowReadiness,
            threshold,
          },
        });
      }
      break;

    case 'MISSED_CHECKINS':
      // Check for athletes who missed X check-ins in the time window
      for (const athlete of athletes) {
        const expectedCheckIns = timeWindow; // One per day expected
        const actualCheckIns = await prisma.moodLog.count({
          where: {
            athleteId: athlete.userId,
            createdAt: { gte: windowStart },
          },
        });

        const missedCount = expectedCheckIns - actualCheckIns;
        const threshold = rule.minOccurrences || Math.ceil(timeWindow * 0.5); // Default: missed >50%

        if (missedCount >= threshold) {
          results.push({
            triggered: true,
            athleteId: athlete.userId,
            athleteName: athlete.User.name || 'Unknown',
            message: `${athlete.User.name || 'Athlete'} missed ${missedCount} check-ins in the last ${timeWindow} days`,
            severity: missedCount >= timeWindow * 0.7 ? 'HIGH' : 'MEDIUM',
            metadata: { missedCount, expectedCheckIns, actualCheckIns },
          });
        }
      }
      break;
  }

  return results;
}

/**
 * Create an alert from an evaluation result
 */
async function createAlertFromResult(
  rule: AlertRule,
  coachId: string,
  result: RuleEvaluationResult
): Promise<void> {
  // Check for duplicate alerts (same rule + athlete within last 24 hours)
  const existingAlert = await prisma.generatedAlert.findFirst({
    where: {
      ruleId: rule.id,
      athleteId: result.athleteId || null,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      isDismissed: false,
    },
  });

  if (existingAlert) {
    // Don't create duplicate alerts
    return;
  }

  await prisma.generatedAlert.create({
    data: {
      ruleId: rule.id,
      coachId,
      athleteId: result.athleteId,
      title: rule.name,
      message: result.message,
      severity: result.severity,
      metadata: (result.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });
}

/**
 * Get all unread alerts for a coach
 */
export async function getUnreadAlertsForCoach(coachId: string) {
  return prisma.generatedAlert.findMany({
    where: {
      coachId,
      isRead: false,
      isDismissed: false,
    },
    include: {
      Athlete: {
        include: {
          User: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Mark an alert as read
 */
export async function markAlertAsRead(alertId: string, coachId: string) {
  return prisma.generatedAlert.updateMany({
    where: {
      id: alertId,
      coachId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Dismiss an alert
 */
export async function dismissAlert(alertId: string, coachId: string) {
  return prisma.generatedAlert.updateMany({
    where: {
      id: alertId,
      coachId,
    },
    data: {
      isDismissed: true,
    },
  });
}
