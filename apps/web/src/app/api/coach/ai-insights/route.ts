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
import { predictBurnout, type BurnoutHistoricalData, type BurnoutPrediction } from '@/lib/algorithms/burnout';
import { forecastReadinessTrend, type ReadinessForecast } from '@/lib/analytics/forecasting';
import { generateTeamDeepInsights, type DeepInsight } from '@/lib/analytics/deep-insights';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PlainEnglishInsight {
  id: string;
  category: 'correlation' | 'prediction' | 'intervention' | 'pattern' | 'alert' | 'burnout' | 'forecast' | 'deep_insight' | 'intervention_outcome';
  priority: 'high' | 'medium' | 'low' | 'critical';
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

// Team forecast summary for coach dashboard
interface TeamForecastSummary {
  avgPredictedScore: number;
  trend: 'improving' | 'declining' | 'stable';
  atRiskDays: { date: string; athleteCount: number }[];
  athletesWithDecline: { id: string; name: string; predictedLow: number; dayOfWeek: string }[];
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

    // 0. Generate DEEP INSIGHTS (non-obvious, actionable findings)
    // These are prioritized at the top because they're the most valuable
    try {
      const deepInsights = await generateTeamDeepInsights(user.id, user.schoolId);

      // Convert DeepInsight to PlainEnglishInsight format
      for (const deep of deepInsights) {
        // Use intervention_outcome category for technique→stat insights
        // Use deep_insight for other advanced analytics
        const category = deep.type === 'intervention_outcome' ? 'intervention_outcome' : 'deep_insight';

        // For intervention_outcome, create a richer metric display
        let metric: PlainEnglishInsight['metric'] = undefined;
        if (deep.interventionDetails) {
          // Show the actual stat improvement: "+10.5 pts"
          const sign = deep.interventionDetails.improvement > 0 ? '+' : '';
          metric = {
            value: `${sign}${deep.interventionDetails.improvement.toFixed(1)}`,
            label: deep.interventionDetails.sportMetric,
            unit: deep.interventionDetails.metricUnit,
          };
        } else if (deep.comparisonToNorm) {
          metric = {
            value: `${deep.comparisonToNorm.percentileDifference > 0 ? '+' : ''}${deep.comparisonToNorm.percentileDifference}%`,
            label: 'vs Team Avg',
          };
        }

        insights.push({
          id: deep.id,
          category,
          priority: deep.priority === 'critical' ? 'critical' : deep.priority,
          headline: deep.headline,
          detail: deep.explanation,
          athleteId: deep.athleteId,
          athleteName: deep.athleteName,
          metric,
          confidence: deep.evidence.confidence,
          evidence: deep.evidence.statisticalNote,
          actionable: deep.actionable,
        });
      }
    } catch (error) {
      console.log('Deep insights generation skipped:', error instanceof Error ? error.message : 'unknown');
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

        // Get burnout prediction (30-day analysis)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [readinessScores, moodLogs] = await Promise.all([
          prisma.readinessScore.findMany({
            where: { athleteId: athlete.id, calculatedAt: { gte: thirtyDaysAgo } },
            orderBy: { calculatedAt: 'asc' },
          }),
          prisma.moodLog.findMany({
            where: { athleteId: athlete.id, createdAt: { gte: thirtyDaysAgo } },
            orderBy: { createdAt: 'asc' },
          }),
        ]);

        if (moodLogs.length >= 7) {
          const burnoutInput: BurnoutHistoricalData = {
            readinessHistory: readinessScores.map((r) => ({
              date: r.calculatedAt.toISOString().split('T')[0],
              score: r.score,
            })),
            psychologicalHistory: moodLogs.map((m) => ({
              date: m.createdAt.toISOString().split('T')[0],
              mood: m.mood,
              stress: m.stress,
              confidence: m.confidence,
              anxiety: Math.round(m.stress * 0.8),
            })),
            physicalHistory: moodLogs
              .filter((m) => m.sleep !== null)
              .map((m) => ({
                date: m.createdAt.toISOString().split('T')[0],
                sleepHours: (m.sleep ?? 5) * 0.9,
                sleepQuality: m.sleep ?? 5,
                fatigue: 10 - (m.energy ?? 5),
                soreness: 3,
              })),
          };

          const burnoutPrediction = predictBurnout(burnoutInput);

          // Only add insight if burnout risk is elevated (not healthy)
          if (burnoutPrediction.currentStage !== 'healthy' && burnoutPrediction.probability >= 40) {
            const priorityMap: Record<string, 'high' | 'medium' | 'low'> = {
              critical: 'high',
              advanced: 'high',
              developing: 'medium',
              'early-warning': 'medium',
              healthy: 'low',
            };

            const stageLabels: Record<string, string> = {
              critical: 'Critical burnout risk',
              advanced: 'Advanced burnout warning',
              developing: 'Developing burnout indicators',
              'early-warning': 'Early burnout warning signs',
              healthy: 'Healthy',
            };

            results.push({
              id: `burnout-${athlete.id}`,
              category: 'burnout',
              priority: priorityMap[burnoutPrediction.currentStage] || 'medium',
              headline: `${athlete.name}: ${stageLabels[burnoutPrediction.currentStage]}`,
              detail: burnoutPrediction.warningNow.length > 0
                ? `Key indicators: ${burnoutPrediction.warningNow.slice(0, 2).map((w) => w.indicator).join(', ')}`
                : `${burnoutPrediction.probability}% probability within ${burnoutPrediction.daysUntilRisk} days`,
              athleteId: athlete.id,
              athleteName: athlete.name,
              metric: {
                value: burnoutPrediction.probability,
                label: 'Risk',
                unit: '%',
              },
              confidence: 0.85,
              evidence: `Based on ${moodLogs.length} mood logs over 30 days`,
              actionable: burnoutPrediction.preventionStrategies[0] || 'Schedule 1:1 check-in this week',
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

    // 6. Generate team forecast summary (7-day readiness predictions)
    let teamForecast: TeamForecastSummary | null = null;
    const forecastPromises = athletes.slice(0, 15).map(async (athlete) => {
      try {
        const forecast = await forecastReadinessTrend(athlete.id, 30);
        return { athleteId: athlete.id, athleteName: athlete.name, forecast };
      } catch {
        return null; // Skip athletes with insufficient data
      }
    });

    const forecastResults = (await Promise.all(forecastPromises)).filter((r): r is NonNullable<typeof r> => r !== null);

    if (forecastResults.length >= 3) {
      // Calculate aggregate stats
      const allPredictions = forecastResults.flatMap((r) =>
        r.forecast.forecast.slice(0, 7).map((f) => ({
          date: f.date,
          score: f.predictedScore,
          athleteId: r.athleteId,
          athleteName: r.athleteName,
        }))
      );

      // Group by date to find at-risk days
      const dateGroups: Record<string, { date: string; scores: number[]; athletes: { id: string; name: string; score: number }[] }> = {};
      for (const pred of allPredictions) {
        if (!dateGroups[pred.date]) {
          dateGroups[pred.date] = { date: pred.date, scores: [], athletes: [] };
        }
        dateGroups[pred.date].scores.push(pred.score);
        dateGroups[pred.date].athletes.push({ id: pred.athleteId, name: pred.athleteName, score: pred.score });
      }

      const atRiskDays = Object.values(dateGroups)
        .map((g) => ({
          date: g.date,
          athleteCount: g.athletes.filter((a) => a.score < 60).length,
        }))
        .filter((d) => d.athleteCount > 0)
        .sort((a, b) => b.athleteCount - a.athleteCount)
        .slice(0, 3);

      // Find athletes with predicted declines
      const athletesWithDecline = forecastResults
        .filter((r) => r.forecast.trend === 'declining' || r.forecast.riskFlags.length > 0)
        .map((r) => {
          const lowestDay = r.forecast.forecast.slice(0, 7).reduce((min, f) => (f.predictedScore < min.predictedScore ? f : min));
          return {
            id: r.athleteId,
            name: r.athleteName,
            predictedLow: Math.round(lowestDay.predictedScore),
            dayOfWeek: new Date(lowestDay.date).toLocaleDateString('en-US', { weekday: 'short' }),
          };
        })
        .slice(0, 5);

      // Calculate average predicted score
      const avgPredictedScore = allPredictions.length > 0
        ? Math.round(allPredictions.reduce((sum, p) => sum + p.score, 0) / allPredictions.length)
        : 0;

      // Determine overall trend
      const trendCounts = forecastResults.reduce(
        (acc, r) => {
          acc[r.forecast.trend] = (acc[r.forecast.trend] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      const dominantTrend = Object.entries(trendCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as 'improving' | 'declining' | 'stable' || 'stable';

      teamForecast = {
        avgPredictedScore,
        trend: dominantTrend,
        atRiskDays,
        athletesWithDecline,
      };

      // Add forecast insight if there are concerning predictions
      if (athletesWithDecline.length > 0) {
        insights.push({
          id: 'team-forecast-alert',
          category: 'forecast',
          priority: athletesWithDecline.length >= 3 ? 'high' : 'medium',
          headline: `${athletesWithDecline.length} athlete${athletesWithDecline.length > 1 ? 's' : ''} predicted to decline this week`,
          detail: `${athletesWithDecline.map((a) => `${a.name} (${a.dayOfWeek}: ${a.predictedLow})`).join(', ')}`,
          confidence: 0.8,
          evidence: `Based on 7-day readiness forecasts using Holt's exponential smoothing`,
          actionable: 'Consider proactive check-ins before predicted low days',
        });
      }
    }

    // Sort insights by priority (critical first, then high, medium, low)
    const priorityOrder: Record<string, number> = { critical: -1, high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));

    return NextResponse.json({
      success: true,
      insights,
      teamSummary,
      teamForecast,
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
