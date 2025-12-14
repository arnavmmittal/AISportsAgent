/**
 * Multi-Factor Risk Assessment Algorithm
 * Combines multiple indicators to assess athlete wellbeing risk
 *
 * Risk Factors:
 * 1. Readiness Trends - Declining performance readiness over time
 * 2. Stress Patterns - Chronic or escalating stress levels
 * 3. Sleep Debt - Cumulative sleep deficiency
 * 4. Mental Health Indicators - Mood, anxiety, confidence patterns
 * 5. Physical Load - Training load vs recovery capacity
 * 6. Crisis Language - Concerning phrases in chat logs
 *
 * References:
 * - Soligard et al. (2016) - Athlete health protection
 * - Drew & Finch (2016) - Injury risk factors
 * - Gabbett (2016) - Training load and injury
 */

export interface AthleteRiskData {
  // Readiness history
  readinessHistory: Array<{
    date: string;
    score: number;
  }>;

  // Stress and mood data
  stressHistory: Array<{
    date: string;
    stress: number; // 1-10
    anxiety: number; // 1-10
    mood: number; // 1-10
  }>;

  // Sleep data
  sleepHistory: Array<{
    date: string;
    hours: number;
    quality: number; // 1-10
  }>;

  // Physical data
  physicalData: Array<{
    date: string;
    trainingLoad: number; // 0-100
    soreness: number; // 1-10
    fatigue: number; // 1-10
  }>;

  // Chat/crisis indicators (optional)
  recentChatLogs?: Array<{
    date: string;
    content: string;
    sentiment: number; // -1 to 1
  }>;

  // Context
  injuryHistory?: Array<{
    date: string;
    type: string;
    severity: 'minor' | 'moderate' | 'severe';
  }>;
}

export interface RiskFactor {
  category: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  score: number; // 0-100
  description: string;
  evidence: string[];
}

export interface RiskAssessment {
  level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  score: number; // 0-100
  confidence: number; // 0-100
  factors: RiskFactor[];
  recommendations: string[];
  urgency: 'immediate' | 'soon' | 'monitor' | 'none';
}

/**
 * Comprehensive multi-factor risk assessment
 */
export function assessRisk(data: AthleteRiskData): RiskAssessment {
  const factors: RiskFactor[] = [];

  // 1. Readiness trend analysis (30% weight)
  const readinessFactor = analyzeReadinessTrend(data.readinessHistory);
  factors.push(readinessFactor);

  // 2. Stress pattern analysis (25% weight)
  const stressFactor = analyzeStressPatterns(data.stressHistory);
  factors.push(stressFactor);

  // 3. Sleep debt analysis (20% weight)
  const sleepFactor = analyzeSleepDebt(data.sleepHistory);
  factors.push(sleepFactor);

  // 4. Physical load analysis (15% weight)
  const loadFactor = analyzePhysicalLoad(data.physicalData);
  factors.push(loadFactor);

  // 5. Mental health indicators (10% weight)
  const mentalFactor = analyzeMentalHealthIndicators(data.stressHistory);
  factors.push(mentalFactor);

  // 6. Crisis language detection (if chat logs available)
  if (data.recentChatLogs && data.recentChatLogs.length > 0) {
    const crisisFactor = detectCrisisLanguage(data.recentChatLogs);
    if (crisisFactor) {
      factors.push(crisisFactor);
    }
  }

  // Calculate composite risk score
  const score = calculateCompositeRiskScore(factors);
  const level = getRiskLevel(score);
  const confidence = calculateConfidence(data);
  const urgency = determineUrgency(level, factors);
  const recommendations = generateRecommendations(factors, level);

  return {
    level,
    score,
    confidence,
    factors: factors.sort((a, b) => b.score - a.score), // Highest risk first
    recommendations,
    urgency,
  };
}

/**
 * Analyze readiness trend over 7, 14, and 30 days
 */
function analyzeReadinessTrend(history: Array<{ date: string; score: number }>): RiskFactor {
  if (history.length < 3) {
    return {
      category: 'Readiness Trend',
      severity: 'low',
      score: 10,
      description: 'Insufficient data for trend analysis',
      evidence: ['Less than 3 data points'],
    };
  }

  // Sort by date (most recent first)
  const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate trends
  const last7 = sorted.slice(0, Math.min(7, sorted.length));
  const last14 = sorted.slice(0, Math.min(14, sorted.length));
  const last30 = sorted.slice(0, Math.min(30, sorted.length));

  const avg7 = last7.reduce((sum, r) => sum + r.score, 0) / last7.length;
  const avg14 = last14.reduce((sum, r) => sum + r.score, 0) / last14.length;
  const avg30 = last30.reduce((sum, r) => sum + r.score, 0) / last30.length;

  const evidence: string[] = [];
  let score = 0;
  let severity: 'critical' | 'high' | 'moderate' | 'low' = 'low';

  // Declining trend detection
  const decline7to14 = avg14 - avg7;
  const decline14to30 = avg30 - avg14;

  if (avg7 < 60) {
    score += 40;
    evidence.push(`7-day average critically low (${avg7.toFixed(1)})`);
  } else if (avg7 < 70) {
    score += 25;
    evidence.push(`7-day average low (${avg7.toFixed(1)})`);
  }

  if (decline7to14 > 10) {
    score += 30;
    evidence.push(`Steep 2-week decline (-${decline7to14.toFixed(1)} points)`);
  } else if (decline7to14 > 5) {
    score += 15;
    evidence.push(`Moderate decline (-${decline7to14.toFixed(1)} points)`);
  }

  if (decline14to30 > 15) {
    score += 30;
    evidence.push(`Prolonged 30-day decline (-${decline14to30.toFixed(1)} points)`);
  }

  // Volatility check (high variance = instability)
  const variance = calculateVariance(last7.map(r => r.score));
  if (variance > 400) {
    score += 20;
    evidence.push(`High volatility (variance: ${variance.toFixed(1)})`);
  }

  // Set severity
  if (score >= 70) severity = 'critical';
  else if (score >= 50) severity = 'high';
  else if (score >= 30) severity = 'moderate';
  else severity = 'low';

  return {
    category: 'Readiness Trend',
    severity,
    score: Math.min(100, score),
    description: severity === 'critical' ? 'Severe declining trend in readiness' :
                 severity === 'high' ? 'Significant readiness decline' :
                 severity === 'moderate' ? 'Moderate readiness concerns' :
                 'Readiness stable',
    evidence: evidence.length > 0 ? evidence : ['No significant concerns'],
  };
}

/**
 * Analyze stress patterns for chronic or escalating stress
 */
function analyzeStressPatterns(history: Array<{ date: string; stress: number; anxiety: number; mood: number }>): RiskFactor {
  if (history.length < 3) {
    return {
      category: 'Stress Patterns',
      severity: 'low',
      score: 10,
      description: 'Insufficient stress data',
      evidence: ['Less than 3 data points'],
    };
  }

  const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const last7 = sorted.slice(0, Math.min(7, sorted.length));
  const last14 = sorted.slice(0, Math.min(14, sorted.length));

  const avgStress7 = last7.reduce((sum, r) => sum + r.stress, 0) / last7.length;
  const avgAnxiety7 = last7.reduce((sum, r) => sum + r.anxiety, 0) / last7.length;
  const avgMood7 = last7.reduce((sum, r) => sum + r.mood, 0) / last7.length;

  const evidence: string[] = [];
  let score = 0;
  let severity: 'critical' | 'high' | 'moderate' | 'low' = 'low';

  // Chronic high stress
  if (avgStress7 >= 8) {
    score += 40;
    evidence.push(`Chronic high stress (avg ${avgStress7.toFixed(1)}/10)`);
  } else if (avgStress7 >= 7) {
    score += 25;
    evidence.push(`Elevated stress (avg ${avgStress7.toFixed(1)}/10)`);
  }

  // High anxiety
  if (avgAnxiety7 >= 8) {
    score += 35;
    evidence.push(`Severe anxiety (avg ${avgAnxiety7.toFixed(1)}/10)`);
  } else if (avgAnxiety7 >= 7) {
    score += 20;
    evidence.push(`High anxiety (avg ${avgAnxiety7.toFixed(1)}/10)`);
  }

  // Low mood
  if (avgMood7 <= 4) {
    score += 40;
    evidence.push(`Persistently low mood (avg ${avgMood7.toFixed(1)}/10)`);
  } else if (avgMood7 <= 5) {
    score += 25;
    evidence.push(`Low mood (avg ${avgMood7.toFixed(1)}/10)`);
  }

  // Stress escalation trend
  const stressTrend = calculateTrend(last14.map(r => r.stress));
  if (stressTrend > 0.3) {
    score += 20;
    evidence.push('Escalating stress pattern');
  }

  // Set severity
  if (score >= 70) severity = 'critical';
  else if (score >= 50) severity = 'high';
  else if (score >= 30) severity = 'moderate';
  else severity = 'low';

  return {
    category: 'Stress Patterns',
    severity,
    score: Math.min(100, score),
    description: severity === 'critical' ? 'Severe stress and anxiety levels' :
                 severity === 'high' ? 'Concerning stress patterns' :
                 severity === 'moderate' ? 'Moderate stress indicators' :
                 'Stress levels manageable',
    evidence: evidence.length > 0 ? evidence : ['No significant concerns'],
  };
}

/**
 * Analyze cumulative sleep debt
 */
function analyzeSleepDebt(history: Array<{ date: string; hours: number; quality: number }>): RiskFactor {
  if (history.length < 3) {
    return {
      category: 'Sleep Debt',
      severity: 'low',
      score: 10,
      description: 'Insufficient sleep data',
      evidence: ['Less than 3 data points'],
    };
  }

  const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const last7 = sorted.slice(0, Math.min(7, sorted.length));
  const last14 = sorted.slice(0, Math.min(14, sorted.length));

  const evidence: string[] = [];
  let score = 0;
  let severity: 'critical' | 'high' | 'moderate' | 'low' = 'low';

  // Calculate sleep debt (optimal = 8 hours)
  let sleepDebt = 0;
  last14.forEach(day => {
    const deficit = Math.max(0, 8 - day.hours);
    sleepDebt += deficit;
  });

  // Average sleep duration
  const avgHours = last7.reduce((sum, r) => sum + r.hours, 0) / last7.length;
  const avgQuality = last7.reduce((sum, r) => sum + r.quality, 0) / last7.length;

  // Severe sleep deprivation
  if (avgHours < 5.5) {
    score += 50;
    evidence.push(`Severe sleep deprivation (avg ${avgHours.toFixed(1)}h)`);
  } else if (avgHours < 6.5) {
    score += 35;
    evidence.push(`Inadequate sleep (avg ${avgHours.toFixed(1)}h)`);
  } else if (avgHours < 7) {
    score += 20;
    evidence.push(`Below optimal sleep (avg ${avgHours.toFixed(1)}h)`);
  }

  // Poor sleep quality
  if (avgQuality <= 4) {
    score += 30;
    evidence.push(`Poor sleep quality (avg ${avgQuality.toFixed(1)}/10)`);
  } else if (avgQuality <= 6) {
    score += 15;
    evidence.push(`Suboptimal sleep quality (avg ${avgQuality.toFixed(1)}/10)`);
  }

  // Cumulative sleep debt
  if (sleepDebt >= 15) {
    score += 35;
    evidence.push(`Severe cumulative sleep debt (${sleepDebt.toFixed(1)}h over 14 days)`);
  } else if (sleepDebt >= 10) {
    score += 20;
    evidence.push(`Moderate sleep debt (${sleepDebt.toFixed(1)}h over 14 days)`);
  } else if (sleepDebt >= 5) {
    score += 10;
    evidence.push(`Mild sleep debt (${sleepDebt.toFixed(1)}h over 14 days)`);
  }

  // Set severity
  if (score >= 70) severity = 'critical';
  else if (score >= 50) severity = 'high';
  else if (score >= 30) severity = 'moderate';
  else severity = 'low';

  return {
    category: 'Sleep Debt',
    severity,
    score: Math.min(100, score),
    description: severity === 'critical' ? 'Severe sleep deprivation' :
                 severity === 'high' ? 'Significant sleep deficit' :
                 severity === 'moderate' ? 'Moderate sleep concerns' :
                 'Sleep adequate',
    evidence: evidence.length > 0 ? evidence : ['No significant concerns'],
  };
}

/**
 * Analyze physical load vs recovery capacity
 */
function analyzePhysicalLoad(data: Array<{ date: string; trainingLoad: number; soreness: number; fatigue: number }>): RiskFactor {
  if (data.length < 3) {
    return {
      category: 'Physical Load',
      severity: 'low',
      score: 10,
      description: 'Insufficient physical data',
      evidence: ['Less than 3 data points'],
    };
  }

  const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const last7 = sorted.slice(0, Math.min(7, sorted.length));

  const avgLoad = last7.reduce((sum, r) => sum + r.trainingLoad, 0) / last7.length;
  const avgSoreness = last7.reduce((sum, r) => sum + r.soreness, 0) / last7.length;
  const avgFatigue = last7.reduce((sum, r) => sum + r.fatigue, 0) / last7.length;

  const evidence: string[] = [];
  let score = 0;
  let severity: 'critical' | 'high' | 'moderate' | 'low' = 'low';

  // High training load
  if (avgLoad > 85) {
    score += 30;
    evidence.push(`Very high training load (avg ${avgLoad.toFixed(1)})`);
  } else if (avgLoad > 75) {
    score += 15;
    evidence.push(`Elevated training load (avg ${avgLoad.toFixed(1)})`);
  }

  // Chronic soreness
  if (avgSoreness >= 8) {
    score += 35;
    evidence.push(`Severe chronic soreness (avg ${avgSoreness.toFixed(1)}/10)`);
  } else if (avgSoreness >= 7) {
    score += 20;
    evidence.push(`High soreness levels (avg ${avgSoreness.toFixed(1)}/10)`);
  }

  // Physical fatigue
  if (avgFatigue >= 8) {
    score += 35;
    evidence.push(`Extreme physical fatigue (avg ${avgFatigue.toFixed(1)}/10)`);
  } else if (avgFatigue >= 7) {
    score += 20;
    evidence.push(`High fatigue (avg ${avgFatigue.toFixed(1)}/10)`);
  }

  // Load spike detection (acute:chronic ratio)
  if (last7.length >= 7 && sorted.length >= 21) {
    const acuteLoad = last7.reduce((sum, r) => sum + r.trainingLoad, 0);
    const chronicLoad = sorted.slice(0, 21).reduce((sum, r) => sum + r.trainingLoad, 0) / 3;
    const acwr = acuteLoad / chronicLoad;

    if (acwr > 1.5) {
      score += 25;
      evidence.push(`Dangerous load spike (ACWR: ${acwr.toFixed(2)})`);
    } else if (acwr > 1.3) {
      score += 15;
      evidence.push(`Elevated load ratio (ACWR: ${acwr.toFixed(2)})`);
    }
  }

  // Set severity
  if (score >= 70) severity = 'critical';
  else if (score >= 50) severity = 'high';
  else if (score >= 30) severity = 'moderate';
  else severity = 'low';

  return {
    category: 'Physical Load',
    severity,
    score: Math.min(100, score),
    description: severity === 'critical' ? 'Severe overload and inadequate recovery' :
                 severity === 'high' ? 'High physical strain' :
                 severity === 'moderate' ? 'Moderate load concerns' :
                 'Training load manageable',
    evidence: evidence.length > 0 ? evidence : ['No significant concerns'],
  };
}

/**
 * Analyze mental health indicators
 */
function analyzeMentalHealthIndicators(history: Array<{ date: string; stress: number; anxiety: number; mood: number }>): RiskFactor {
  if (history.length < 3) {
    return {
      category: 'Mental Health',
      severity: 'low',
      score: 10,
      description: 'Insufficient mental health data',
      evidence: ['Less than 3 data points'],
    };
  }

  const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const last7 = sorted.slice(0, Math.min(7, sorted.length));

  const evidence: string[] = [];
  let score = 0;
  let severity: 'critical' | 'high' | 'moderate' | 'low' = 'low';

  // Count concerning days (low mood OR high stress/anxiety)
  const concerningDays = last7.filter(day =>
    day.mood <= 4 || day.stress >= 8 || day.anxiety >= 8
  ).length;

  if (concerningDays >= 5) {
    score += 40;
    evidence.push(`${concerningDays}/7 days with concerning mental health indicators`);
  } else if (concerningDays >= 3) {
    score += 25;
    evidence.push(`${concerningDays}/7 days with elevated indicators`);
  }

  // Mood variance (instability)
  const moodVariance = calculateVariance(last7.map(r => r.mood));
  if (moodVariance > 9) {
    score += 20;
    evidence.push('High mood instability');
  }

  // Combined stress + anxiety (synergistic effect)
  const avgStress = last7.reduce((sum, r) => sum + r.stress, 0) / last7.length;
  const avgAnxiety = last7.reduce((sum, r) => sum + r.anxiety, 0) / last7.length;

  if (avgStress >= 7 && avgAnxiety >= 7) {
    score += 30;
    evidence.push('Combined high stress and anxiety');
  }

  // Set severity
  if (score >= 70) severity = 'critical';
  else if (score >= 50) severity = 'high';
  else if (score >= 30) severity = 'moderate';
  else severity = 'low';

  return {
    category: 'Mental Health',
    severity,
    score: Math.min(100, score),
    description: severity === 'critical' ? 'Severe mental health concerns' :
                 severity === 'high' ? 'Significant mental health indicators' :
                 severity === 'moderate' ? 'Moderate mental health concerns' :
                 'Mental health stable',
    evidence: evidence.length > 0 ? evidence : ['No significant concerns'],
  };
}

/**
 * Detect crisis language in chat logs
 */
function detectCrisisLanguage(logs: Array<{ date: string; content: string; sentiment: number }>): RiskFactor | null {
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'not worth living', 'better off dead',
    'hurt myself', 'self-harm', 'cutting', 'can\'t go on', 'want to die',
    'hopeless', 'no point', 'give up', 'worthless', 'nobody cares'
  ];

  const recentLogs = logs.slice(0, Math.min(10, logs.length));
  let crisisCount = 0;
  const concerningPhrases: string[] = [];

  recentLogs.forEach(log => {
    const lowerContent = log.content.toLowerCase();
    crisisKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        crisisCount++;
        concerningPhrases.push(keyword);
      }
    });
  });

  // Check for very negative sentiment
  const avgSentiment = recentLogs.reduce((sum, log) => sum + log.sentiment, 0) / recentLogs.length;
  const verylowSentiment = avgSentiment < -0.7;

  if (crisisCount > 0 || verylowSentiment) {
    return {
      category: 'Crisis Indicators',
      severity: 'critical',
      score: crisisCount > 0 ? 100 : 80,
      description: crisisCount > 0 ? 'CRITICAL: Crisis language detected' : 'Extremely negative sentiment',
      evidence: crisisCount > 0
        ? [`Crisis keywords detected: ${[...new Set(concerningPhrases)].join(', ')}`]
        : [`Very negative sentiment (${avgSentiment.toFixed(2)})`],
    };
  }

  return null;
}

/**
 * Calculate composite risk score from all factors
 */
function calculateCompositeRiskScore(factors: RiskFactor[]): number {
  const weights: Record<string, number> = {
    'Readiness Trend': 0.30,
    'Stress Patterns': 0.25,
    'Sleep Debt': 0.20,
    'Physical Load': 0.15,
    'Mental Health': 0.10,
    'Crisis Indicators': 1.0, // Overrides all others if present
  };

  // If crisis detected, that takes precedence
  const crisisFactor = factors.find(f => f.category === 'Crisis Indicators');
  if (crisisFactor) {
    return 100;
  }

  // Otherwise, weighted average
  let totalScore = 0;
  let totalWeight = 0;

  factors.forEach(factor => {
    const weight = weights[factor.category] || 0.05;
    totalScore += factor.score * weight;
    totalWeight += weight;
  });

  return Math.round(totalScore / totalWeight);
}

/**
 * Determine risk level from score
 */
function getRiskLevel(score: number): 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MODERATE';
  return 'LOW';
}

/**
 * Calculate confidence based on data completeness
 */
function calculateConfidence(data: AthleteRiskData): number {
  let confidence = 0;
  let maxConfidence = 0;

  // Readiness data (25 points)
  maxConfidence += 25;
  if (data.readinessHistory.length >= 14) confidence += 25;
  else if (data.readinessHistory.length >= 7) confidence += 15;
  else if (data.readinessHistory.length >= 3) confidence += 10;

  // Stress data (25 points)
  maxConfidence += 25;
  if (data.stressHistory.length >= 14) confidence += 25;
  else if (data.stressHistory.length >= 7) confidence += 15;
  else if (data.stressHistory.length >= 3) confidence += 10;

  // Sleep data (20 points)
  maxConfidence += 20;
  if (data.sleepHistory.length >= 14) confidence += 20;
  else if (data.sleepHistory.length >= 7) confidence += 12;
  else if (data.sleepHistory.length >= 3) confidence += 8;

  // Physical data (20 points)
  maxConfidence += 20;
  if (data.physicalData.length >= 14) confidence += 20;
  else if (data.physicalData.length >= 7) confidence += 12;
  else if (data.physicalData.length >= 3) confidence += 8;

  // Chat logs (10 points bonus)
  if (data.recentChatLogs && data.recentChatLogs.length >= 5) {
    confidence += 10;
  }

  return Math.round((confidence / maxConfidence) * 100);
}

/**
 * Determine urgency level
 */
function determineUrgency(level: string, factors: RiskFactor[]): 'immediate' | 'soon' | 'monitor' | 'none' {
  // Crisis language = immediate
  if (factors.some(f => f.category === 'Crisis Indicators')) {
    return 'immediate';
  }

  if (level === 'CRITICAL') return 'immediate';
  if (level === 'HIGH') return 'soon';
  if (level === 'MODERATE') return 'monitor';
  return 'none';
}

/**
 * Generate recommendations based on risk factors
 */
function generateRecommendations(factors: RiskFactor[], level: string): string[] {
  const recommendations: string[] = [];

  // Crisis handling
  if (factors.some(f => f.category === 'Crisis Indicators')) {
    recommendations.push('IMMEDIATE: Contact athlete and mental health professional');
    recommendations.push('Activate crisis response protocol');
    recommendations.push('Do not leave athlete unsupervised');
    return recommendations;
  }

  // High priority factors
  const highSeverity = factors.filter(f => f.severity === 'critical' || f.severity === 'high');

  highSeverity.forEach(factor => {
    switch (factor.category) {
      case 'Readiness Trend':
        recommendations.push('Schedule individual check-in to discuss declining readiness');
        recommendations.push('Consider reduced training load or rest day');
        break;
      case 'Stress Patterns':
        recommendations.push('Refer to sports psychologist or counselor');
        recommendations.push('Implement stress management techniques (mindfulness, CBT)');
        break;
      case 'Sleep Debt':
        recommendations.push('Educate on sleep hygiene and recovery importance');
        recommendations.push('Adjust training schedule to prioritize sleep');
        break;
      case 'Physical Load':
        recommendations.push('Reduce training volume by 20-30%');
        recommendations.push('Increase recovery modalities (ice baths, massage, stretching)');
        break;
      case 'Mental Health':
        recommendations.push('Schedule mental health screening');
        recommendations.push('Connect with campus mental health resources');
        break;
    }
  });

  // General recommendations by level
  if (level === 'CRITICAL' && recommendations.length === 0) {
    recommendations.push('Immediate intervention required - schedule meeting today');
  } else if (level === 'HIGH' && recommendations.length === 0) {
    recommendations.push('Schedule check-in within 24-48 hours');
  } else if (level === 'MODERATE') {
    recommendations.push('Continue monitoring - weekly check-ins recommended');
  }

  // Add monitoring if no specific actions
  if (recommendations.length === 0) {
    recommendations.push('Continue standard monitoring protocol');
  }

  return recommendations;
}

/**
 * Helper: Calculate variance
 */
function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Helper: Calculate linear trend (slope)
 */
function calculateTrend(values: number[]): number {
  const n = values.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  const sumX = indices.reduce((sum, val) => sum + val, 0);
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = indices.reduce((sum, val, i) => sum + val * values[i], 0);
  const sumX2 = indices.reduce((sum, val) => sum + val * val, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}
