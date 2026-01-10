/**
 * Coach Predictions API
 * Get predictions for all coached athletes
 *
 * GET - Get predictions for upcoming timeframe
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PredictionFeatures {
  moodAvg: number | null;
  moodTrend: number | null;
  moodVariance: number | null;
  confidenceAvg: number | null;
  confidenceTrend: number | null;
  stressAvg: number | null;
  stressTrend: number | null;
  hrvAvg: number | null;
  hrvVsBaseline: number | null;
  sleepAvg: number | null;
  sleepQuality: number | null;
  recoveryScore: number | null;
  strain: number | null;
  performanceBaseline: number | null;
  performanceVariance: number | null;
  recentTrend: number | null;
  dataQuality: number;
}

interface AthletePrediction {
  athleteId: string;
  athleteName: string;
  sport: string;
  predictedDeviation: number;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  contributingFactors: Array<{ factor: string; impact: number; actionable: boolean }>;
  recommendedActions: Array<{ action: string; expectedImpact: number }>;
  features: PredictionFeatures;
}

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);
    if (!authorized || !user) return response;

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const predictionDate = dateStr ? new Date(dateStr) : new Date();

    // Get coach's athletes
    const coachAthletes = await prisma.coachAthleteRelation.findMany({
      where: { coachId: user.id, consentGranted: true },
      include: {
        Athlete: {
          include: {
            User: { select: { name: true } },
            AthleteModel: true,
          },
        },
      },
    });

    const predictions: AthletePrediction[] = [];

    // Generate predictions for each athlete
    for (const relation of coachAthletes) {
      const athlete = relation.Athlete;
      if (!athlete) continue;

      try {
        // Gather recent data for prediction
        const sevenDaysAgo = new Date(predictionDate);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const threeDaysAgo = new Date(predictionDate);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        // Get recent mood logs
        const recentMoodLogs = await prisma.moodLog.findMany({
          where: {
            athleteId: athlete.userId,
            createdAt: { gte: sevenDaysAgo },
          },
          orderBy: { createdAt: 'desc' },
        });

        // Get recent wearable data
        const recentWearableData = await prisma.wearableDataPoint.findMany({
          where: {
            athleteId: athlete.userId,
            recordedAt: { gte: threeDaysAgo },
          },
          orderBy: { recordedAt: 'desc' },
        });

        // Get recent performance outcomes for baseline
        const recentOutcomes = await prisma.performanceOutcome.findMany({
          where: { athleteId: athlete.userId },
          orderBy: { date: 'desc' },
          take: 10,
        });

        // Calculate features
        const features = calculateFeatures(
          recentMoodLogs,
          recentWearableData,
          recentOutcomes,
          athlete.AthleteModel
        );

        // Make prediction
        const prediction = makePrediction(features, athlete.AthleteModel);

        predictions.push({
          athleteId: athlete.userId,
          athleteName: athlete.User.name || 'Unknown',
          sport: athlete.sport,
          ...prediction,
          features,
        });
      } catch (error) {
        console.error(`Prediction error for athlete ${athlete.userId}:`, error);
      }
    }

    // Sort by risk level (highest first)
    const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    predictions.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

    // Calculate summary
    const summary = {
      total: predictions.length,
      critical: predictions.filter((p) => p.riskLevel === 'CRITICAL').length,
      high: predictions.filter((p) => p.riskLevel === 'HIGH').length,
      medium: predictions.filter((p) => p.riskLevel === 'MEDIUM').length,
      low: predictions.filter((p) => p.riskLevel === 'LOW').length,
      avgConfidence: predictions.length > 0
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
        : 0,
    };

    return NextResponse.json({
      predictions,
      summary,
      predictionDate: predictionDate.toISOString(),
    });
  } catch (error) {
    console.error('Coach predictions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions (same as in predictions API)
function calculateFeatures(
  moodLogs: any[],
  wearableData: any[],
  outcomes: any[],
  athleteModel: any
): PredictionFeatures {
  const moodValues = moodLogs.map((m) => m.mood).filter((v) => v !== null);
  const confidenceValues = moodLogs.map((m) => m.confidence).filter((v) => v !== null);
  const stressValues = moodLogs.map((m) => m.stress).filter((v) => v !== null);

  const moodAvg = moodValues.length > 0 ? average(moodValues) : null;
  const confidenceAvg = confidenceValues.length > 0 ? average(confidenceValues) : null;
  const stressAvg = stressValues.length > 0 ? average(stressValues) : null;

  const moodTrend = moodValues.length >= 3 ? calculateTrend(moodValues) : null;
  const confidenceTrend = confidenceValues.length >= 3 ? calculateTrend(confidenceValues) : null;
  const stressTrend = stressValues.length >= 3 ? -calculateTrend(stressValues) : null;

  const moodVariance = moodValues.length >= 3 ? variance(moodValues) : null;

  const hrvValues = wearableData.map((w) => w.hrv).filter((v) => v !== null);
  const sleepValues = wearableData.map((w) => w.sleepDuration).filter((v) => v !== null);
  const sleepQualityValues = wearableData.map((w) => w.sleepQuality).filter((v) => v !== null);
  const recoveryValues = wearableData.map((w) => w.recoveryScore).filter((v) => v !== null);
  const strainValues = wearableData.map((w) => w.strain).filter((v) => v !== null);

  const hrvAvg = hrvValues.length > 0 ? average(hrvValues) : null;
  const hrvBaseline = athleteModel?.baselineHRV || null;
  const hrvVsBaseline = hrvAvg && hrvBaseline ? (hrvAvg - hrvBaseline) / hrvBaseline : null;

  const sleepAvg = sleepValues.length > 0 ? average(sleepValues) : null;
  const sleepQuality = sleepQualityValues.length > 0 ? average(sleepQualityValues) : null;
  const recoveryScore = recoveryValues.length > 0 ? average(recoveryValues) : null;
  const strain = strainValues.length > 0 ? average(strainValues) : null;

  const performanceRatings = outcomes
    .map((o) => o.overallRating)
    .filter((v): v is number => v !== null);
  const performanceBaseline =
    athleteModel?.baselinePerformance ||
    (performanceRatings.length > 0 ? average(performanceRatings) : null);
  const performanceVariance =
    performanceRatings.length >= 3 ? variance(performanceRatings) : null;
  const recentTrend =
    performanceRatings.length >= 3 ? calculateTrend(performanceRatings.slice(0, 5)) : null;

  const availableFeatures = [
    moodAvg,
    confidenceAvg,
    stressAvg,
    hrvAvg,
    sleepAvg,
    performanceBaseline,
  ].filter((v) => v !== null).length;
  const dataQuality = availableFeatures / 6;

  return {
    moodAvg,
    moodTrend,
    moodVariance,
    confidenceAvg,
    confidenceTrend,
    stressAvg,
    stressTrend,
    hrvAvg,
    hrvVsBaseline,
    sleepAvg,
    sleepQuality,
    recoveryScore,
    strain,
    performanceBaseline,
    performanceVariance,
    recentTrend,
    dataQuality,
  };
}

function makePrediction(
  features: PredictionFeatures,
  athleteModel: any
): {
  predictedDeviation: number;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  contributingFactors: Array<{ factor: string; impact: number; actionable: boolean }>;
  recommendedActions: Array<{ action: string; expectedImpact: number }>;
} {
  const weights = athleteModel?.predictionWeights || {
    mood: 0.15,
    confidence: 0.15,
    stress: 0.15,
    hrv: 0.15,
    sleep: 0.2,
    recovery: 0.1,
    trend: 0.1,
  };

  let predictedDeviation = 0;
  const contributingFactors: Array<{ factor: string; impact: number; actionable: boolean }> = [];

  if (features.moodAvg !== null) {
    const moodBaseline = athleteModel?.baselineMood || 7;
    const moodImpact = ((features.moodAvg - moodBaseline) / 10) * weights.mood;
    predictedDeviation += moodImpact;
    if (Math.abs(moodImpact) > 0.02) {
      contributingFactors.push({
        factor: moodImpact > 0 ? 'elevated_mood' : 'low_mood',
        impact: moodImpact,
        actionable: true,
      });
    }
  }

  if (features.confidenceAvg !== null) {
    const confBaseline = athleteModel?.baselineConfidence || 7;
    const confImpact = ((features.confidenceAvg - confBaseline) / 10) * weights.confidence;
    predictedDeviation += confImpact;
    if (Math.abs(confImpact) > 0.02) {
      contributingFactors.push({
        factor: confImpact > 0 ? 'high_confidence' : 'low_confidence',
        impact: confImpact,
        actionable: true,
      });
    }
  }

  if (features.stressAvg !== null) {
    const stressBaseline = athleteModel?.baselineStress || 5;
    const stressImpact = ((stressBaseline - features.stressAvg) / 10) * weights.stress;
    predictedDeviation += stressImpact;
    if (Math.abs(stressImpact) > 0.02) {
      contributingFactors.push({
        factor: stressImpact < 0 ? 'elevated_stress' : 'managed_stress',
        impact: stressImpact,
        actionable: true,
      });
    }
  }

  if (features.hrvVsBaseline !== null) {
    const hrvImpact = features.hrvVsBaseline * weights.hrv;
    predictedDeviation += hrvImpact;
    if (Math.abs(hrvImpact) > 0.02) {
      contributingFactors.push({
        factor: hrvImpact > 0 ? 'good_recovery' : 'poor_recovery',
        impact: hrvImpact,
        actionable: true,
      });
    }
  }

  if (features.sleepAvg !== null) {
    const sleepBaseline = athleteModel?.baselineSleep || 7.5;
    const sleepDeficit = features.sleepAvg - sleepBaseline;
    const sleepImpact = (sleepDeficit / 8) * weights.sleep;
    predictedDeviation += sleepImpact;
    if (Math.abs(sleepImpact) > 0.02) {
      contributingFactors.push({
        factor: sleepImpact < 0 ? 'sleep_deficit' : 'well_rested',
        impact: sleepImpact,
        actionable: true,
      });
    }
  }

  if (features.recoveryScore !== null) {
    const recoveryImpact = ((features.recoveryScore - 70) / 100) * weights.recovery;
    predictedDeviation += recoveryImpact;
    if (Math.abs(recoveryImpact) > 0.02) {
      contributingFactors.push({
        factor: recoveryImpact > 0 ? 'high_recovery' : 'low_recovery',
        impact: recoveryImpact,
        actionable: false,
      });
    }
  }

  if (features.recentTrend !== null) {
    const trendImpact = features.recentTrend * weights.trend;
    predictedDeviation += trendImpact;
    if (Math.abs(trendImpact) > 0.02) {
      contributingFactors.push({
        factor: trendImpact > 0 ? 'positive_momentum' : 'recent_slump',
        impact: trendImpact,
        actionable: false,
      });
    }
  }

  contributingFactors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  const confidence = Math.min(0.95, 0.3 + features.dataQuality * 0.6);

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (predictedDeviation <= -0.2) {
    riskLevel = 'CRITICAL';
  } else if (predictedDeviation <= -0.1) {
    riskLevel = 'HIGH';
  } else if (predictedDeviation <= -0.05) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  const recommendedActions: Array<{ action: string; expectedImpact: number }> = [];

  for (const factor of contributingFactors) {
    if (factor.impact < -0.02 && factor.actionable) {
      switch (factor.factor) {
        case 'sleep_deficit':
          recommendedActions.push({
            action: 'Get extra 30-60 minutes of sleep tonight',
            expectedImpact: Math.abs(factor.impact) * 0.5,
          });
          break;
        case 'elevated_stress':
          recommendedActions.push({
            action: 'Use 4-7-8 breathing technique before competition',
            expectedImpact: Math.abs(factor.impact) * 0.4,
          });
          break;
        case 'low_confidence':
          recommendedActions.push({
            action: 'Visualization session focusing on past successes',
            expectedImpact: Math.abs(factor.impact) * 0.35,
          });
          break;
        case 'low_mood':
          recommendedActions.push({
            action: 'Short mindfulness session to reset mental state',
            expectedImpact: Math.abs(factor.impact) * 0.3,
          });
          break;
        case 'poor_recovery':
          recommendedActions.push({
            action: 'Light recovery session and early rest',
            expectedImpact: Math.abs(factor.impact) * 0.25,
          });
          break;
      }
    }
  }

  recommendedActions.sort((a, b) => b.expectedImpact - a.expectedImpact);

  return {
    predictedDeviation: Math.round(predictedDeviation * 1000) / 1000,
    confidence: Math.round(confidence * 100) / 100,
    riskLevel,
    contributingFactors: contributingFactors.slice(0, 5),
    recommendedActions: recommendedActions.slice(0, 3),
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = average(values);
  return values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return -slope;
}
