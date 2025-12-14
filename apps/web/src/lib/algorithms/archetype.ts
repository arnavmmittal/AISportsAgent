/**
 * Athlete Archetype Classification Algorithm
 * Classifies athletes into psychological archetypes for tailored coaching
 *
 * Eight Archetypes:
 * 1. Overthinker - High anxiety, ruminates on mistakes, analysis paralysis
 * 2. Burnout Risk - Declining motivation, chronic stress, poor recovery
 * 3. Momentum Builder - Performance streaky, confidence-driven, thrives on success
 * 4. Perfectionist - High standards, fear of failure, self-critical
 * 5. Resilient Warrior - Bounces back quickly, consistent performer, mentally tough
 * 6. Anxious Achiever - High achiever with high anxiety, pressure-driven
 * 7. Steady Performer - Consistent, emotionally stable, reliable
 * 8. Disengaged - Low motivation, disconnected, minimal effort
 *
 * References:
 * - Smith et al. (2006) - Athlete personality and coping
 * - Nicholls et al. (2008) - Coping effectiveness in sport
 * - Gould et al. (2002) - Psychological characteristics of Olympic champions
 */

export interface AthleteArchetypeData {
  // Psychological patterns (14-30 days minimum)
  psychologicalHistory: Array<{
    date: string;
    mood: number; // 1-10
    confidence: number; // 1-10
    stress: number; // 1-10
    anxiety: number; // 1-10
    motivation?: number; // 1-10 (optional)
  }>;

  // Performance/readiness history
  performanceHistory: Array<{
    date: string;
    readiness: number; // 0-100
    performance?: number; // 1-10 (optional)
  }>;

  // Recovery patterns
  recoveryData: Array<{
    date: string;
    sleepQuality: number; // 1-10
    recoveryQuality: number; // 1-10
  }>;

  // Behavioral patterns (optional)
  engagementMetrics?: {
    chatFrequency: number; // messages per week
    assignmentCompletionRate: number; // 0-100%
    selfReflectionDepth: number; // 1-10
  };
}

export type ArchetypeType =
  | 'OVERTHINKER'
  | 'BURNOUT_RISK'
  | 'MOMENTUM_BUILDER'
  | 'PERFECTIONIST'
  | 'RESILIENT_WARRIOR'
  | 'ANXIOUS_ACHIEVER'
  | 'STEADY_PERFORMER'
  | 'DISENGAGED';

export interface ArchetypeScore {
  type: ArchetypeType;
  score: number; // 0-100 match strength
  confidence: number; // 0-100 classification confidence
}

export interface ArchetypeClassification {
  primary: ArchetypeScore;
  secondary?: ArchetypeScore; // If close match
  allScores: ArchetypeScore[];
  traits: string[];
  strengths: string[];
  challenges: string[];
  coachingStrategies: string[];
  communicationStyle: string;
  idealInterventions: string[];
}

/**
 * Classify athlete into psychological archetype
 */
export function classifyArchetype(data: AthleteArchetypeData): ArchetypeClassification {
  // Calculate scores for each archetype
  const scores: ArchetypeScore[] = [
    { type: 'OVERTHINKER', ...calculateOverthinkerScore(data) },
    { type: 'BURNOUT_RISK', ...calculateBurnoutRiskScore(data) },
    { type: 'MOMENTUM_BUILDER', ...calculateMomentumBuilderScore(data) },
    { type: 'PERFECTIONIST', ...calculatePerfectionistScore(data) },
    { type: 'RESILIENT_WARRIOR', ...calculateResilientWarriorScore(data) },
    { type: 'ANXIOUS_ACHIEVER', ...calculateAnxiousAchieverScore(data) },
    { type: 'STEADY_PERFORMER', ...calculateSteadyPerformerScore(data) },
    { type: 'DISENGAGED', ...calculateDisengagedScore(data) },
  ];

  // Sort by score
  const sorted = scores.sort((a, b) => b.score - a.score);

  const primary = sorted[0];
  const secondary = sorted[1].score >= 60 && Math.abs(sorted[0].score - sorted[1].score) < 15
    ? sorted[1]
    : undefined;

  // Generate profile
  const profile = getArchetypeProfile(primary.type, secondary?.type);

  return {
    primary,
    secondary,
    allScores: sorted,
    ...profile,
  };
}

/**
 * OVERTHINKER - High anxiety, ruminates on mistakes
 */
function calculateOverthinkerScore(data: AthleteArchetypeData): { score: number; confidence: number } {
  const recent = data.psychologicalHistory.slice(0, 14);
  if (recent.length < 7) return { score: 0, confidence: 0 };

  let score = 0;

  // High chronic anxiety
  const avgAnxiety = recent.reduce((sum, r) => sum + r.anxiety, 0) / recent.length;
  if (avgAnxiety >= 7.5) score += 35;
  else if (avgAnxiety >= 6.5) score += 25;
  else if (avgAnxiety >= 5.5) score += 10;

  // Moderate to low confidence (self-doubt)
  const avgConfidence = recent.reduce((sum, r) => sum + r.confidence, 0) / recent.length;
  if (avgConfidence <= 5.5) score += 25;
  else if (avgConfidence <= 6.5) score += 15;

  // High stress
  const avgStress = recent.reduce((sum, r) => sum + r.stress, 0) / recent.length;
  if (avgStress >= 7) score += 20;
  else if (avgStress >= 6) score += 10;

  // Mood variability (emotional instability from overthinking)
  const moodVariance = calculateVariance(recent.map(r => r.mood));
  if (moodVariance > 6) score += 20;
  else if (moodVariance > 4) score += 10;

  const confidence = recent.length >= 14 ? 85 : 70;
  return { score: Math.min(100, score), confidence };
}

/**
 * BURNOUT_RISK - Declining motivation, chronic stress, poor recovery
 */
function calculateBurnoutRiskScore(data: AthleteArchetypeData): { score: number; confidence: number } {
  const recent = data.psychologicalHistory.slice(0, 14);
  const recentPerf = data.performanceHistory.slice(0, 14);
  const recentRecovery = data.recoveryData.slice(0, 14);

  if (recent.length < 7) return { score: 0, confidence: 0 };

  let score = 0;

  // Declining readiness trend
  if (recentPerf.length >= 7) {
    const trend = calculateTrend(recentPerf.map(r => r.readiness));
    if (trend < -0.5) score += 30;
    else if (trend < -0.3) score += 20;
  }

  // Low motivation (if available)
  const motivationData = recent.filter(r => r.motivation !== undefined);
  if (motivationData.length >= 5) {
    const avgMotivation = motivationData.reduce((sum, r) => sum + (r.motivation || 0), 0) / motivationData.length;
    if (avgMotivation <= 4.5) score += 30;
    else if (avgMotivation <= 5.5) score += 20;
  }

  // Chronic high stress
  const avgStress = recent.reduce((sum, r) => sum + r.stress, 0) / recent.length;
  if (avgStress >= 7.5) score += 25;
  else if (avgStress >= 6.5) score += 15;

  // Poor recovery
  if (recentRecovery.length >= 7) {
    const avgRecovery = recentRecovery.reduce((sum, r) => sum + r.recoveryQuality, 0) / recentRecovery.length;
    if (avgRecovery <= 5) score += 15;
    else if (avgRecovery <= 6) score += 10;
  }

  const confidence = recent.length >= 14 && recentPerf.length >= 14 ? 90 : 70;
  return { score: Math.min(100, score), confidence };
}

/**
 * MOMENTUM_BUILDER - Performance streaky, confidence-driven
 */
function calculateMomentumBuilderScore(data: AthleteArchetypeData): { score: number; confidence: number } {
  const recent = data.psychologicalHistory.slice(0, 21);
  const recentPerf = data.performanceHistory.slice(0, 21);

  if (recent.length < 10 || recentPerf.length < 10) return { score: 0, confidence: 0 };

  let score = 0;

  // High performance variability (streaky)
  const perfVariance = calculateVariance(recentPerf.map(r => r.readiness));
  if (perfVariance > 300 && perfVariance < 600) score += 30;
  else if (perfVariance >= 200) score += 20;

  // Confidence tracks performance (correlation)
  const confidencePerfCorrelation = calculateCorrelation(
    recent.slice(0, Math.min(recent.length, recentPerf.length)).map(r => r.confidence),
    recentPerf.slice(0, Math.min(recent.length, recentPerf.length)).map(r => r.readiness)
  );
  if (confidencePerfCorrelation > 0.6) score += 35;
  else if (confidencePerfCorrelation > 0.4) score += 20;

  // Moderate to good average performance (not burned out)
  const avgReadiness = recentPerf.reduce((sum, r) => sum + r.readiness, 0) / recentPerf.length;
  if (avgReadiness >= 70 && avgReadiness <= 85) score += 20;

  // Quick mood swings based on outcomes
  const moodVariance = calculateVariance(recent.map(r => r.mood));
  if (moodVariance > 5 && moodVariance < 12) score += 15;

  const confidence = recent.length >= 21 && recentPerf.length >= 21 ? 85 : 65;
  return { score: Math.min(100, score), confidence };
}

/**
 * PERFECTIONIST - High standards, fear of failure, self-critical
 */
function calculatePerfectionistScore(data: AthleteArchetypeData): { score: number; confidence: number } {
  const recent = data.psychologicalHistory.slice(0, 14);
  const recentPerf = data.performanceHistory.slice(0, 14);

  if (recent.length < 7) return { score: 0, confidence: 0 };

  let score = 0;

  // High stress despite good performance
  const avgStress = recent.reduce((sum, r) => sum + r.stress, 0) / recent.length;
  const avgReadiness = recentPerf.length > 0
    ? recentPerf.reduce((sum, r) => sum + r.readiness, 0) / recentPerf.length
    : 75;

  if (avgStress >= 6.5 && avgReadiness >= 75) score += 30;
  else if (avgStress >= 6 && avgReadiness >= 70) score += 20;

  // Moderate anxiety
  const avgAnxiety = recent.reduce((sum, r) => sum + r.anxiety, 0) / recent.length;
  if (avgAnxiety >= 6 && avgAnxiety <= 7.5) score += 25;

  // Confidence doesn't match high performance (self-critical)
  const avgConfidence = recent.reduce((sum, r) => sum + r.confidence, 0) / recent.length;
  if (avgReadiness >= 75 && avgConfidence <= 6.5) score += 30;
  else if (avgReadiness >= 70 && avgConfidence <= 7) score += 20;

  // Consistent performance (tries to be perfect)
  if (recentPerf.length >= 7) {
    const perfVariance = calculateVariance(recentPerf.map(r => r.readiness));
    if (perfVariance < 150 && avgReadiness >= 70) score += 15;
  }

  const confidence = recent.length >= 14 ? 80 : 65;
  return { score: Math.min(100, score), confidence };
}

/**
 * RESILIENT_WARRIOR - Bounces back quickly, mentally tough
 */
function calculateResilientWarriorScore(data: AthleteArchetypeData): { score: number; confidence: number } {
  const recent = data.psychologicalHistory.slice(0, 21);
  const recentPerf = data.performanceHistory.slice(0, 21);
  const recentRecovery = data.recoveryData.slice(0, 14);

  if (recent.length < 10) return { score: 0, confidence: 0 };

  let score = 0;

  // Low anxiety despite challenges
  const avgAnxiety = recent.reduce((sum, r) => sum + r.anxiety, 0) / recent.length;
  if (avgAnxiety <= 4.5) score += 25;
  else if (avgAnxiety <= 5.5) score += 15;

  // High confidence
  const avgConfidence = recent.reduce((sum, r) => sum + r.confidence, 0) / recent.length;
  if (avgConfidence >= 7.5) score += 25;
  else if (avgConfidence >= 7) score += 15;

  // Good mood stability
  const moodVariance = calculateVariance(recent.map(r => r.mood));
  if (moodVariance < 3) score += 20;
  else if (moodVariance < 5) score += 10;

  // Quick recovery after setbacks (look for bounce-backs)
  if (recentPerf.length >= 14) {
    const bouncebacks = countBouncebacks(recentPerf.map(r => r.readiness));
    if (bouncebacks >= 3) score += 20;
    else if (bouncebacks >= 2) score += 10;
  }

  // Good recovery quality
  if (recentRecovery.length >= 7) {
    const avgRecovery = recentRecovery.reduce((sum, r) => sum + r.recoveryQuality, 0) / recentRecovery.length;
    if (avgRecovery >= 7.5) score += 10;
  }

  const confidence = recent.length >= 21 ? 85 : 70;
  return { score: Math.min(100, score), confidence };
}

/**
 * ANXIOUS_ACHIEVER - High achiever with high anxiety
 */
function calculateAnxiousAchieverScore(data: AthleteArchetypeData): { score: number; confidence: number } {
  const recent = data.psychologicalHistory.slice(0, 14);
  const recentPerf = data.performanceHistory.slice(0, 14);

  if (recent.length < 7) return { score: 0, confidence: 0 };

  let score = 0;

  // High anxiety
  const avgAnxiety = recent.reduce((sum, r) => sum + r.anxiety, 0) / recent.length;
  if (avgAnxiety >= 7) score += 30;
  else if (avgAnxiety >= 6) score += 20;

  // High performance despite anxiety
  const avgReadiness = recentPerf.length > 0
    ? recentPerf.reduce((sum, r) => sum + r.readiness, 0) / recentPerf.length
    : 75;

  if (avgReadiness >= 75 && avgAnxiety >= 6.5) score += 35;
  else if (avgReadiness >= 70 && avgAnxiety >= 6) score += 25;

  // High stress
  const avgStress = recent.reduce((sum, r) => sum + r.stress, 0) / recent.length;
  if (avgStress >= 6.5) score += 20;

  // Moderate confidence (doubt despite achievement)
  const avgConfidence = recent.reduce((sum, r) => sum + r.confidence, 0) / recent.length;
  if (avgConfidence >= 6 && avgConfidence <= 7.5) score += 15;

  const confidence = recent.length >= 14 && recentPerf.length >= 14 ? 85 : 70;
  return { score: Math.min(100, score), confidence };
}

/**
 * STEADY_PERFORMER - Consistent, emotionally stable
 */
function calculateSteadyPerformerScore(data: AthleteArchetypeData): { score: number; confidence: number } {
  const recent = data.psychologicalHistory.slice(0, 21);
  const recentPerf = data.performanceHistory.slice(0, 21);

  if (recent.length < 10) return { score: 0, confidence: 0 };

  let score = 0;

  // Low variability in all metrics (emotional stability)
  const moodVariance = calculateVariance(recent.map(r => r.mood));
  const stressVariance = calculateVariance(recent.map(r => r.stress));
  const anxietyVariance = calculateVariance(recent.map(r => r.anxiety));

  if (moodVariance < 3 && stressVariance < 3 && anxietyVariance < 3) score += 35;
  else if (moodVariance < 5 && stressVariance < 5 && anxietyVariance < 5) score += 25;

  // Consistent performance
  if (recentPerf.length >= 10) {
    const perfVariance = calculateVariance(recentPerf.map(r => r.readiness));
    if (perfVariance < 150) score += 25;
    else if (perfVariance < 250) score += 15;
  }

  // Moderate to good metrics (balanced)
  const avgMood = recent.reduce((sum, r) => sum + r.mood, 0) / recent.length;
  const avgStress = recent.reduce((sum, r) => sum + r.stress, 0) / recent.length;
  const avgAnxiety = recent.reduce((sum, r) => sum + r.anxiety, 0) / recent.length;

  if (avgMood >= 6.5 && avgMood <= 8 && avgStress >= 4 && avgStress <= 6 && avgAnxiety >= 3 && avgAnxiety <= 6) {
    score += 25;
  }

  // Good average performance
  const avgReadiness = recentPerf.length > 0
    ? recentPerf.reduce((sum, r) => sum + r.readiness, 0) / recentPerf.length
    : 0;
  if (avgReadiness >= 70 && avgReadiness <= 85) score += 15;

  const confidence = recent.length >= 21 ? 90 : 75;
  return { score: Math.min(100, score), confidence };
}

/**
 * DISENGAGED - Low motivation, disconnected
 */
function calculateDisengagedScore(data: AthleteArchetypeData): { score: number; confidence: number } {
  const recent = data.psychologicalHistory.slice(0, 14);
  const recentPerf = data.performanceHistory.slice(0, 14);

  if (recent.length < 7) return { score: 0, confidence: 0 };

  let score = 0;

  // Low motivation (if available)
  const motivationData = recent.filter(r => r.motivation !== undefined);
  if (motivationData.length >= 5) {
    const avgMotivation = motivationData.reduce((sum, r) => sum + (r.motivation || 0), 0) / motivationData.length;
    if (avgMotivation <= 4) score += 35;
    else if (avgMotivation <= 5) score += 25;
  }

  // Low confidence
  const avgConfidence = recent.reduce((sum, r) => sum + r.confidence, 0) / recent.length;
  if (avgConfidence <= 5) score += 25;
  else if (avgConfidence <= 6) score += 15;

  // Low mood
  const avgMood = recent.reduce((sum, r) => sum + r.mood, 0) / recent.length;
  if (avgMood <= 5) score += 25;
  else if (avgMood <= 6) score += 15;

  // Low performance
  const avgReadiness = recentPerf.length > 0
    ? recentPerf.reduce((sum, r) => sum + r.readiness, 0) / recentPerf.length
    : 0;
  if (avgReadiness <= 60) score += 15;

  // Low engagement (if available)
  if (data.engagementMetrics) {
    if (data.engagementMetrics.chatFrequency <= 2) score += 15;
    if (data.engagementMetrics.assignmentCompletionRate <= 40) score += 15;
  }

  const confidence = recent.length >= 14 ? 85 : 70;
  return { score: Math.min(100, score), confidence };
}

/**
 * Get archetype profile with coaching strategies
 */
function getArchetypeProfile(primary: ArchetypeType, secondary?: ArchetypeType) {
  const profiles: Record<ArchetypeType, {
    traits: string[];
    strengths: string[];
    challenges: string[];
    coachingStrategies: string[];
    communicationStyle: string;
    idealInterventions: string[];
  }> = {
    OVERTHINKER: {
      traits: ['Analytical', 'Self-aware', 'Detail-oriented', 'Anxious', 'Ruminative'],
      strengths: ['Thorough preparation', 'High awareness of mental state', 'Responds well to structured feedback'],
      challenges: ['Analysis paralysis', 'Difficulty letting go of mistakes', 'Pre-performance anxiety'],
      coachingStrategies: [
        'Teach mindfulness and present-moment focus techniques',
        'Implement pre-performance routines to reduce overthinking',
        'Use thought-stopping and cognitive restructuring (CBT)',
        'Encourage process goals over outcome goals',
      ],
      communicationStyle: 'Patient, validating, solution-focused. Avoid overloading with technical details.',
      idealInterventions: ['Mindfulness meditation', 'CBT for anxiety', 'Breathing exercises', 'Thought records'],
    },
    BURNOUT_RISK: {
      traits: ['Exhausted', 'Declining motivation', 'Overwhelmed', 'Disconnected', 'Low energy'],
      strengths: ['May have been high-performer previously', 'Often responds well to rest and support'],
      challenges: ['Chronic fatigue', 'Loss of passion', 'Risk of dropout', 'Poor recovery'],
      coachingStrategies: [
        'IMMEDIATE: Reduce training load significantly',
        'Schedule frequent check-ins and emotional support',
        'Revisit athlete\'s "why" and intrinsic motivations',
        'Implement structured recovery protocols',
        'Refer to sports psychologist for burnout assessment',
      ],
      communicationStyle: 'Empathetic, non-judgmental, supportive. Avoid pressure or guilt.',
      idealInterventions: ['Recovery week', 'Goal re-evaluation', 'Mental health referral', 'Rest and restoration'],
    },
    MOMENTUM_BUILDER: {
      traits: ['Confidence-driven', 'Streaky', 'Emotionally reactive', 'Success-motivated', 'Variable'],
      strengths: ['Can reach peak performance when hot', 'Highly motivated by success', 'Energizing teammate'],
      challenges: ['Struggles with adversity', 'Performance inconsistency', 'Emotional volatility'],
      coachingStrategies: [
        'Build confidence through small wins and progressive success',
        'Teach resilience strategies for handling setbacks',
        'Focus on process consistency rather than outcome streaks',
        'Develop pre-performance routines to stabilize mindset',
      ],
      communicationStyle: 'Encouraging, positive, growth-focused. Celebrate wins, reframe losses as learning.',
      idealInterventions: ['Success journals', 'Adversity coping skills', 'Mental toughness training', 'Routine building'],
    },
    PERFECTIONIST: {
      traits: ['High standards', 'Self-critical', 'Achievement-oriented', 'Fear of failure', 'Driven'],
      strengths: ['Excellent work ethic', 'Attention to detail', 'High intrinsic motivation', 'Consistent effort'],
      challenges: ['Never satisfied', 'High anxiety', 'Fear of mistakes', 'Burnout risk from over-training'],
      coachingStrategies: [
        'Reframe "failure" as necessary for growth',
        'Set realistic, achievable standards together',
        'Teach self-compassion and acceptance',
        'Celebrate progress, not just perfection',
      ],
      communicationStyle: 'Balanced between validation and reality-checking. Help them be kind to themselves.',
      idealInterventions: ['Self-compassion exercises', 'Growth mindset training', 'Mistake rituals', 'Process goals'],
    },
    RESILIENT_WARRIOR: {
      traits: ['Mentally tough', 'Quick recovery', 'Confident', 'Adaptable', 'Positive'],
      strengths: ['Bounces back from setbacks quickly', 'Emotionally stable', 'Reliable performer', 'Team leader'],
      challenges: ['May ignore warning signs', 'Could benefit from deeper self-reflection', 'May downplay struggles'],
      coachingStrategies: [
        'Leverage as team leader and mentor',
        'Continue building on strengths',
        'Encourage vulnerability and asking for help when needed',
        'Use as model for other athletes',
      ],
      communicationStyle: 'Direct, collaborative, empowering. They can handle honest feedback.',
      idealInterventions: ['Leadership development', 'Advanced mental skills', 'Peer mentoring', 'Challenge seeking'],
    },
    ANXIOUS_ACHIEVER: {
      traits: ['High-performing', 'Anxious', 'Driven', 'Pressure-sensitive', 'Achievement-focused'],
      strengths: ['Performs well despite anxiety', 'Strong work ethic', 'Highly motivated', 'Competitive'],
      challenges: ['High stress levels', 'Burnout risk', 'May sacrifice wellbeing for performance'],
      coachingStrategies: [
        'Validate their drive while addressing anxiety',
        'Teach anxiety management techniques (breathing, visualization)',
        'Help separate self-worth from performance outcomes',
        'Monitor closely for burnout warning signs',
      ],
      communicationStyle: 'Validating, calming, perspective-giving. Help them see beyond achievement.',
      idealInterventions: ['Anxiety management', 'Visualization', 'Values clarification', 'Work-life balance coaching'],
    },
    STEADY_PERFORMER: {
      traits: ['Consistent', 'Emotionally stable', 'Reliable', 'Balanced', 'Even-keeled'],
      strengths: ['Reliable team member', 'Consistent performance', 'Emotionally intelligent', 'Low drama'],
      challenges: ['May lack peak performance edge', 'Could benefit from goal-stretching', 'May plateau'],
      coachingStrategies: [
        'Maintain current mental approach (if it ain\'t broke...)',
        'Introduce performance peaks through periodization',
        'Challenge with stretch goals to avoid complacency',
        'Continue standard monitoring',
      ],
      communicationStyle: 'Straightforward, collaborative, growth-oriented. They\'re low-maintenance.',
      idealInterventions: ['Performance optimization', 'Goal-setting', 'Skill refinement', 'Leadership opportunities'],
    },
    DISENGAGED: {
      traits: ['Low motivation', 'Disconnected', 'Apathetic', 'Low confidence', 'Withdrawn'],
      strengths: ['Potential for re-engagement with right approach', 'May have untapped talent'],
      challenges: ['Lack of motivation', 'Poor performance', 'Risk of dropout', 'Team morale impact'],
      coachingStrategies: [
        'PRIORITY: Have one-on-one conversation to understand root cause',
        'Explore barriers (academic stress, personal issues, sport fit)',
        'Revisit goals and find intrinsic motivators',
        'Consider if sport is right fit or if break is needed',
        'Refer to counseling if deeper issues present',
      ],
      communicationStyle: 'Curious, non-judgmental, exploratory. Listen more than advise initially.',
      idealInterventions: ['Motivational interviewing', 'Goal rediscovery', 'Autonomy support', 'Mental health screening'],
    },
  };

  const profile = profiles[primary];

  // If secondary archetype, add note
  if (secondary) {
    profile.traits.push(`Secondary traits: ${secondary.replace('_', ' ').toLowerCase()}`);
  }

  return profile;
}

/**
 * Helper: Calculate variance
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Helper: Calculate linear trend (slope)
 */
function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  const sumX = indices.reduce((sum, val) => sum + val, 0);
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = indices.reduce((sum, val, i) => sum + val * values[i], 0);
  const sumX2 = indices.reduce((sum, val) => sum + val * val, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  return slope;
}

/**
 * Helper: Calculate correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  const numerator = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
  const denomX = Math.sqrt(x.reduce((sum, val) => sum + Math.pow(val - meanX, 2), 0));
  const denomY = Math.sqrt(y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0));

  if (denomX === 0 || denomY === 0) return 0;

  return numerator / (denomX * denomY);
}

/**
 * Helper: Count bounce-backs (recovery after drops)
 */
function countBouncebacks(values: number[]): number {
  let bouncebacks = 0;

  for (let i = 2; i < values.length; i++) {
    const drop = values[i - 1] < values[i - 2] - 10; // Dropped by 10+ points
    const recovery = values[i] > values[i - 1] + 8; // Recovered 8+ points

    if (drop && recovery) {
      bouncebacks++;
    }
  }

  return bouncebacks;
}
