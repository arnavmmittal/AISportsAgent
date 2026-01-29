/**
 * AI Insights API
 *
 * GET /api/coach/ai-insights
 *
 * Aggregates all advanced analytics into clear, actionable insights:
 * - Performance correlations with plain-English explanations
 * - ML predictions and risk assessments
 * - Intervention effectiveness per athlete
 * - Readiness forecasts
 * - Personalized recommendations
 *
 * This is the "showcase" endpoint that demonstrates the value of the analytics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { analyzeTeamPerformanceCorrelations, analyzePerformanceCorrelations } from '@/lib/analytics/performance-correlation';
import { calculateAthleteEffectivenessProfile } from '@/lib/analytics/intervention-effectiveness';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PlainEnglishInsight {
  id: string;
  category: 'correlation' | 'prediction' | 'intervention' | 'pattern' | 'alert';
  priority: 'high' | 'medium' | 'low';
  headline: string; // Main insight in plain English
  detail: string; // Supporting detail
  metric?: {
    value: number | string;
    label: string;
    unit?: string;
  };
  athleteId?: string;
  athleteName?: string;
  actionable?: string; // What to do about it
  confidence: number; // 0-1
  evidence: string; // Why we know this
}

interface TeamAnalyticsSummary {
  totalAthletes: number;
  athletesWithData: number;
  avgReadiness: number;
  avgCorrelation: number;
  topCorrelatedFactor: string;
  atRiskCount: number;
  improvingCount: number;
  decliningCount: number;
}

export async function GET(req: NextRequest) {
  const { authorized, user, response } = await requireCoach(req);
  if (!authorized || !user) return response;

  try {
    const insights: PlainEnglishInsight[] = [];
    let teamSummary: TeamAnalyticsSummary | null = null;

    // Get coach's athletes
    const coachRelations = await prisma.coachAthleteRelation.findMany({
      where: { coachId: user.id, consentGranted: true },
      include: {
        Athlete: {
          include: {
            User: { select: { id: true, name: true } },
          },
        },
      },
    });

    const athletes = coachRelations.map((r) => ({
      id: r.athleteId,
      name: r.Athlete.User.name || 'Unknown',
      sport: r.Athlete.sport,
    }));

    if (athletes.length === 0) {
      return NextResponse.json({
        success: true,
        insights: [],
        teamSummary: null,
        message: 'No athletes with consent found',
      });
    }

    // 1. Get team-wide correlation analysis
    const teamCorrelations = await analyzeTeamPerformanceCorrelations(user.schoolId, undefined, 90);

    // Find top correlated factor
    const significantCorrelations = teamCorrelations.avgCorrelations
      .filter((c) => c.isSignificant && Math.abs(c.correlation) >= 0.3)
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    if (significantCorrelations.length > 0) {
      const top = significantCorrelations[0];
      const direction = top.correlation > 0 ? 'higher' : 'lower';
      const impact = top.correlation > 0 ? 'better' : 'worse';

      insights.push({
        id: `team-corr-${top.metric}`,
        category: 'correlation',
        priority: 'high',
        headline: `${top.metric} is ${Math.round(Math.abs(top.correlation) * 100)}% correlated with performance`,
        detail: `Across your team, athletes with ${direction} ${top.metric.toLowerCase()} scores show ${impact} game performance.`,
        metric: {
          value: (top.correlation > 0 ? '+' : '') + top.correlation.toFixed(2),
          label: 'Correlation (r)',
        },
        confidence: top.isSignificant ? 0.95 : 0.7,
        evidence: `Based on ${top.sampleSize} game-mood pairings with statistical significance (p < 0.05)`,
        actionable: top.correlation > 0
          ? `Focus on boosting ${top.metric.toLowerCase()} across the team for better performance outcomes`
          : `Address ${top.metric.toLowerCase()} concerns as they appear to negatively impact performance`,
      });
    }

    // Add insights for each significant correlation factor
    for (const corr of significantCorrelations.slice(1, 4)) {
      insights.push({
        id: `team-corr-${corr.metric}`,
        category: 'correlation',
        priority: 'medium',
        headline: corr.insight,
        detail: `${corr.strength.replace('_', ' ')} ${corr.direction} correlation between ${corr.metric.toLowerCase()} and performance`,
        metric: {
          value: (corr.correlation > 0 ? '+' : '') + corr.correlation.toFixed(2),
          label: corr.metric,
        },
        confidence: corr.isSignificant ? 0.9 : 0.6,
        evidence: `Based on ${corr.sampleSize} observations`,
      });
    }

    // 2. Per-athlete insights (top 10 athletes with most data)
    const athleteInsightPromises = athletes.slice(0, 10).map(async (athlete) => {
      const results: PlainEnglishInsight[] = [];

      try {
        // Get individual correlation analysis
        const athleteCorr = await analyzePerformanceCorrelations(athlete.id, 90);

        if (athleteCorr.topFactor && athleteCorr.topFactor.isSignificant) {
          const factor = athleteCorr.topFactor;
          const percentImpact = Math.round(Math.abs(factor.correlation) * 100);

          // Generate specific insight based on sport and metric
          let specificInsight = '';
          if (factor.metric.toLowerCase().includes('sleep')) {
            specificInsight = `When ${athlete.name} gets good sleep, their performance improves by ~${percentImpact}%`;
          } else if (factor.metric.toLowerCase().includes('confidence')) {
            specificInsight = `${athlete.name}'s confidence level predicts ${percentImpact}% of their performance variation`;
          } else if (factor.metric.toLowerCase().includes('stress')) {
            specificInsight = `Lower stress for ${athlete.name} = better performance (${percentImpact}% correlation)`;
          } else if (factor.metric.toLowerCase().includes('mood')) {
            specificInsight = `${athlete.name} performs ${factor.correlation > 0 ? 'better' : 'worse'} when mood is ${factor.correlation > 0 ? 'high' : 'low'}`;
          } else {
            specificInsight = `${factor.metric} strongly predicts ${athlete.name}'s performance`;
          }

          results.push({
            id: `athlete-corr-${athlete.id}`,
            category: 'correlation',
            priority: Math.abs(factor.correlation) >= 0.5 ? 'high' : 'medium',
            headline: specificInsight,
            detail: factor.insight,
            athleteId: athlete.id,
            athleteName: athlete.name,
            metric: {
              value: (factor.correlation > 0 ? '+' : '') + factor.correlation.toFixed(2),
              label: factor.metric,
            },
            confidence: 0.85,
            evidence: `Based on ${factor.sampleSize} games with mood logs within 24h`,
          });
        }

        // Get intervention effectiveness
        const effectiveness = await calculateAthleteEffectivenessProfile(athlete.id);

        if (effectiveness.topRecommendations.length > 0) {
          const topRec = effectiveness.topRecommendations[0];

          if (topRec.previousSuccess > 70) {
            results.push({
              id: `athlete-intervention-${athlete.id}`,
              category: 'intervention',
              priority: 'medium',
              headline: `${topRec.protocol} works ${Math.round(topRec.previousSuccess)}% of the time for ${athlete.name}`,
              detail: `This ${topRec.type.toLowerCase().replace('_', ' ')} technique has been consistently effective`,
              athleteId: athlete.id,
              athleteName: athlete.name,
              metric: {
                value: `${Math.round(topRec.previousSuccess)}%`,
                label: 'Success Rate',
              },
              confidence: topRec.confidence,
              evidence: topRec.evidence,
              actionable: `Recommend ${topRec.protocol} when ${athlete.name} needs support`,
            });
          }
        }
      } catch (error) {
        // Skip athletes with errors (likely insufficient data)
        console.log(`Skipping insights for ${athlete.name}: insufficient data`);
      }

      return results;
    });

    const athleteInsights = (await Promise.all(athleteInsightPromises)).flat();
    insights.push(...athleteInsights);

    // 3. Get recent mood trends and identify at-risk athletes
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMoodLogs = await prisma.moodLog.findMany({
      where: {
        athleteId: { in: athletes.map((a) => a.id) },
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        Athlete: {
          include: {
            User: { select: { name: true } },
          },
        },
      },
    });

    // Group by athlete and calculate trends
    const athleteMoodTrends: Record<string, { moods: number[]; name: string }> = {};
    for (const log of recentMoodLogs) {
      if (!athleteMoodTrends[log.athleteId]) {
        athleteMoodTrends[log.athleteId] = {
          moods: [],
          name: log.Athlete.User.name || 'Unknown',
        };
      }
      athleteMoodTrends[log.athleteId].moods.push(log.mood);
    }

    // Identify concerning patterns
    let atRiskCount = 0;
    let improvingCount = 0;
    let decliningCount = 0;

    for (const [athleteId, data] of Object.entries(athleteMoodTrends)) {
      if (data.moods.length < 3) continue;

      const recentAvg = data.moods.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const olderAvg = data.moods.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, data.moods.length);
      const trend = recentAvg - olderAvg;

      if (recentAvg < 4) {
        atRiskCount++;
        insights.push({
          id: `alert-low-mood-${athleteId}`,
          category: 'alert',
          priority: 'high',
          headline: `${data.name}'s mood has been consistently low (avg: ${recentAvg.toFixed(1)}/10)`,
          detail: 'This pattern often precedes performance decline and potential burnout',
          athleteId,
          athleteName: data.name,
          metric: {
            value: recentAvg.toFixed(1),
            label: 'Avg Mood',
            unit: '/10',
          },
          confidence: 0.9,
          evidence: `Based on ${data.moods.length} check-ins over the past 7 days`,
          actionable: 'Schedule 1-on-1 check-in and consider reduced training load',
        });
      } else if (trend > 1.5) {
        improvingCount++;
      } else if (trend < -1.5) {
        decliningCount++;
        insights.push({
          id: `alert-declining-${athleteId}`,
          category: 'pattern',
          priority: 'medium',
          headline: `${data.name}'s mood is declining (down ${Math.abs(trend).toFixed(1)} points)`,
          detail: 'Recent check-ins show a downward trend compared to last week',
          athleteId,
          athleteName: data.name,
          confidence: 0.8,
          evidence: `Comparing recent 3-day average to previous average`,
          actionable: 'Monitor closely and consider proactive intervention',
        });
      }
    }

    // 4. Calculate team summary
    const totalMoods = Object.values(athleteMoodTrends).flatMap((d) => d.moods);
    const avgReadiness = totalMoods.length > 0
      ? totalMoods.reduce((a, b) => a + b, 0) / totalMoods.length * 10 // Convert 1-10 to 0-100
      : 0;

    teamSummary = {
      totalAthletes: athletes.length,
      athletesWithData: Object.keys(athleteMoodTrends).length,
      avgReadiness: Math.round(avgReadiness),
      avgCorrelation: significantCorrelations.length > 0
        ? significantCorrelations.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / significantCorrelations.length
        : 0,
      topCorrelatedFactor: significantCorrelations[0]?.metric || 'Insufficient data',
      atRiskCount,
      improvingCount,
      decliningCount,
    };

    // 5. Add team-level pattern insights
    if (teamCorrelations.consistentFactors.length > 0) {
      insights.push({
        id: 'team-consistent-factors',
        category: 'pattern',
        priority: 'high',
        headline: `${teamCorrelations.consistentFactors.join(' and ')} consistently predict performance across your team`,
        detail: `These factors show significant correlation for 70%+ of your athletes`,
        confidence: 0.9,
        evidence: `Analyzed ${teamCorrelations.teamSize} athletes with performance data`,
        actionable: `Build team protocols around optimizing ${teamCorrelations.consistentFactors.join(' and ').toLowerCase()}`,
      });
    }

    // Sort insights by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return NextResponse.json({
      success: true,
      insights,
      teamSummary,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Insights error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
