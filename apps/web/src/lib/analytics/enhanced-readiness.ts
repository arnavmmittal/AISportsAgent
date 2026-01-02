/**
 * Enhanced Readiness Calculation with Chat Insights
 *
 * Combines traditional mood log metrics with conversational intelligence
 * from chat sessions to provide more accurate readiness assessment.
 *
 * Formula:
 * Enhanced Readiness = (Base Readiness * 0.65) + (Chat Influence * 0.35)
 *
 * Chat influence considers:
 * - Sentiment trend (-1 to 1)
 * - Topics discussed (stress indicators, coping strategies)
 * - Emotional tone patterns
 * - Pre-game mental state
 */

import { calculateReadiness, type MoodLogData, type ReadinessBreakdown } from './readiness';
import { getAthleteInsights } from '@/lib/chat-analysis';

export interface ChatInfluence {
  score: number; // 0-100
  sentimentTrend: 'improving' | 'stable' | 'declining';
  dominantThemes: string[];
  riskFlags: string[];
  recommendations: string[];
  contribution: number; // How much chat moved the needle (-30 to +30)
}

export interface EnhancedReadinessBreakdown extends ReadinessBreakdown {
  chatInfluence?: ChatInfluence;
  baseReadiness: number; // Original readiness without chat
  enhancedReadiness: number; // With chat insights
}

/**
 * Calculate enhanced readiness with chat insights
 */
export async function calculateEnhancedReadiness(
  athleteId: string,
  moodLog: MoodLogData,
  sport?: string
): Promise<EnhancedReadinessBreakdown> {
  // Step 1: Calculate base readiness from mood log
  const baseReadiness = calculateReadiness(moodLog, sport);

  // Step 2: Get recent chat insights (last 3 days)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const recentInsights = await getAthleteInsights(athleteId, threeDaysAgo);

  // Step 3: If no chat data, return base readiness
  if (recentInsights.length === 0) {
    return {
      ...baseReadiness,
      baseReadiness: baseReadiness.overall,
      enhancedReadiness: baseReadiness.overall
    };
  }

  // Step 4: Analyze chat impact
  const chatInfluence = analyzeChatImpact(recentInsights);

  // Step 5: Combine scores (70% base + 30% chat)
  const enhancedScore = Math.round(
    baseReadiness.overall * 0.70 + chatInfluence.score * 0.30
  );

  // Step 6: Merge recommendations
  const combinedRecommendations = [
    ...baseReadiness.recommendations,
    ...chatInfluence.recommendations
  ];

  return {
    ...baseReadiness,
    overall: enhancedScore,
    baseReadiness: baseReadiness.overall,
    enhancedReadiness: enhancedScore,
    chatInfluence,
    recommendations: combinedRecommendations
  };
}

/**
 * Analyze impact of recent chat sessions on readiness
 */
function analyzeChatImpact(insights: any[]): ChatInfluence {
  if (insights.length === 0) {
    return {
      score: 70,
      sentimentTrend: 'stable',
      dominantThemes: [],
      riskFlags: [],
      recommendations: [],
      contribution: 0
    };
  }

  // 1. Calculate average sentiment
  const avgSentiment = insights.reduce((sum, i) => sum + i.overallSentiment, 0) / insights.length;
  const sentimentScore = (avgSentiment + 1) * 50; // Convert -1:1 to 0:100

  // 2. Detect sentiment trend
  const recentSentiment = insights.slice(0, 2).reduce((sum, i) => sum + i.overallSentiment, 0) / Math.min(2, insights.length);
  const olderSentiment = insights.slice(-2).reduce((sum, i) => sum + i.overallSentiment, 0) / Math.min(2, insights.length);
  const sentimentTrend: ChatInfluence['sentimentTrend'] =
    recentSentiment > olderSentiment + 0.2 ? 'improving' :
    recentSentiment < olderSentiment - 0.2 ? 'declining' : 'stable';

  // 3. Extract dominant themes
  const allTopics = insights.flatMap(i => i.topics);
  const topicCounts = allTopics.reduce((acc: Record<string, number>, topic) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {});
  const dominantThemes = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([topic]) => topic);

  // 4. Identify risk flags
  const riskFlags: string[] = [];
  const allStressIndicators = insights.flatMap(i => i.stressIndicators);

  if (allStressIndicators.includes('fear of failure')) {
    riskFlags.push('Performance anxiety detected in recent conversations');
  }
  if (allStressIndicators.includes('coach pressure')) {
    riskFlags.push('Perceived coaching pressure may impact confidence');
  }
  if (allStressIndicators.includes('academic overload')) {
    riskFlags.push('Academic stress affecting mental bandwidth');
  }
  if (allStressIndicators.includes('comparison to others')) {
    riskFlags.push('Social comparison patterns detected');
  }
  if (allStressIndicators.includes('injury anxiety')) {
    riskFlags.push('Injury concerns mentioned - monitor physical readiness');
  }

  // 5. Adjust score based on topics
  let topicAdjustment = 0;

  // Negative topics (reduce score)
  if (dominantThemes.includes('performance-anxiety')) topicAdjustment -= 10;
  if (dominantThemes.includes('team-conflict')) topicAdjustment -= 8;
  if (dominantThemes.includes('coach-pressure')) topicAdjustment -= 8;
  if (dominantThemes.includes('injury-concern')) topicAdjustment -= 12;
  if (dominantThemes.includes('academic-stress')) topicAdjustment -= 6;

  // Positive topics (increase score)
  if (dominantThemes.includes('mindset-mental')) topicAdjustment += 8;
  if (dominantThemes.includes('goal-setting')) topicAdjustment += 6;
  if (dominantThemes.includes('recovery-rest')) topicAdjustment += 5;

  // 6. Check for coping strategies (positive signal)
  const allCopingStrategies = insights.flatMap(i => i.copingStrategies);
  const copingBonus = Math.min(allCopingStrategies.length * 2, 10); // Max +10

  // 7. Pre-game mindset check
  const preGameInsights = insights.filter(i => i.isPreGame);
  let preGameAdjustment = 0;

  if (preGameInsights.length > 0) {
    const anxiousCount = preGameInsights.filter(i => i.preGameMindset === 'anxious').length;
    const focusedCount = preGameInsights.filter(i => i.preGameMindset === 'focused').length;

    if (anxiousCount > 0) {
      preGameAdjustment -= 15;
      riskFlags.push(`Anxious pre-game mindset in ${anxiousCount} recent session(s)`);
    }
    if (focusedCount > 0) {
      preGameAdjustment += 10;
    }
  }

  // 8. Calculate final chat score
  const rawScore = sentimentScore + topicAdjustment + copingBonus + preGameAdjustment;
  const chatScore = Math.max(0, Math.min(100, rawScore));

  // 9. Generate recommendations
  const recommendations = generateChatBasedRecommendations(
    insights,
    sentimentTrend,
    dominantThemes,
    riskFlags
  );

  // 10. Calculate contribution (how much chat moved readiness from neutral 70)
  const contribution = Math.round(chatScore - 70);

  return {
    score: chatScore,
    sentimentTrend,
    dominantThemes,
    riskFlags,
    recommendations,
    contribution
  };
}

/**
 * Generate recommendations based on chat insights
 */
function generateChatBasedRecommendations(
  insights: any[],
  sentimentTrend: ChatInfluence['sentimentTrend'],
  dominantThemes: string[],
  riskFlags: string[]
): string[] {
  const recs: string[] = [];

  // Sentiment-based recommendations
  if (sentimentTrend === 'declining') {
    recs.push('Declining chat sentiment - schedule check-in or mental skills session');
  }

  const avgSentiment = insights.reduce((sum, i) => sum + i.overallSentiment, 0) / insights.length;
  if (avgSentiment < -0.3) {
    recs.push('Negative sentiment pattern detected - prioritize mental recovery');
  }

  // Topic-based recommendations
  if (dominantThemes.includes('performance-anxiety')) {
    recs.push('Address performance anxiety with cognitive reframing or visualization');
  }
  if (dominantThemes.includes('team-conflict')) {
    recs.push('Team dynamics concern - consider team-building or conflict resolution');
  }
  if (dominantThemes.includes('injury-concern')) {
    recs.push('Physical concerns mentioned - ensure medical clearance before competition');
  }
  if (dominantThemes.includes('academic-stress')) {
    recs.push('Academic pressure noted - support time management and prioritization');
  }

  // Pre-game specific
  const preGameInsights = insights.filter(i => i.isPreGame);
  if (preGameInsights.some(i => i.preGameMindset === 'anxious')) {
    recs.push('Pre-game anxiety detected - implement pre-competition routine');
  }
  if (preGameInsights.some(i => i.preGameMindset === 'distracted')) {
    recs.push('Distracted mindset before competition - refocus with breathing or centering');
  }

  // Positive indicators
  const allCopingStrategies = insights.flatMap(i => i.copingStrategies);
  if (allCopingStrategies.length > 0 && avgSentiment > 0) {
    recs.push('Actively using coping strategies - continue current mental skills practice');
  }

  // Risk flag recommendations
  if (riskFlags.some(f => f.includes('fear of failure'))) {
    recs.push('PRIORITY: Address fear of failure through process-focused goals');
  }
  if (riskFlags.some(f => f.includes('coach pressure'))) {
    recs.push('Coach-athlete relationship concern - clarify expectations and communication');
  }

  return recs;
}

/**
 * Get enhanced readiness with chat insights for display
 */
export async function getEnhancedReadinessForDisplay(
  athleteId: string,
  moodLog: MoodLogData,
  sport?: string
) {
  const enhanced = await calculateEnhancedReadiness(athleteId, moodLog, sport);

  return {
    overall: enhanced.enhancedReadiness,
    baseReadiness: enhanced.baseReadiness,
    chatContribution: enhanced.chatInfluence?.contribution || 0,
    breakdown: {
      physical: enhanced.physical,
      mental: enhanced.mental,
      cognitive: enhanced.cognitive,
      confidence: enhanced.confidence
    },
    chatInsights: enhanced.chatInfluence ? {
      sentiment: enhanced.chatInfluence.sentimentTrend,
      themes: enhanced.chatInfluence.dominantThemes,
      risks: enhanced.chatInfluence.riskFlags
    } : null,
    recommendations: enhanced.recommendations,
    riskLevel: enhanced.riskLevel,
    trend: enhanced.trend
  };
}
