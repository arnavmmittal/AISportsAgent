/**
 * Demo Data Provider
 *
 * Generates realistic mock data for testing and demos.
 * Enable with ?demo=true in the URL.
 *
 * This allows stakeholders and developers to see what the UI
 * looks like with real data without needing to seed the database.
 */

// ============================================================
// TYPES
// ============================================================

export interface DemoAthlete {
  id: string;
  name: string;
  sport: string;
  year: string;
  riskLevel: 'critical' | 'warning' | 'good' | 'no-data';
  lastCheckIn: Date | null;
  moodScore: number | null;
  readinessScore: number | null;
  baseReadiness: number | null;
  chatContribution: number;
  chatInsights: {
    sentiment: 'improving' | 'stable' | 'declining';
    themes: string[];
    risks: string[];
  } | null;
  concern: string | null;
  missedCheckIns: number;
}

export interface DemoInsight {
  id: string;
  category: 'correlation' | 'prediction' | 'effective-technique' | 'pattern' | 'alert';
  priority: 'high' | 'medium' | 'low';
  headline: string;
  detail: string;
  metric?: {
    value: number | string;
    label: string;
    unit?: string;
  };
  athleteId?: string;
  athleteName?: string;
  actionable?: string;
  confidence: number;
  evidence: string;
}

export interface DemoTeamSummary {
  totalAthletes: number;
  athletesWithData: number;
  avgReadiness: number;
  avgCorrelation: number;
  topCorrelatedFactor: string;
  atRiskCount: number;
  improvingCount: number;
  decliningCount: number;
}

export interface DemoOutcome {
  id: string;
  date: string;
  athleteId: string;
  athleteName: string;
  outcomeType: string;
  opponent: string | null;
  homeAway: string | null;
  gameResult: string | null;
  overallRating: number | null;
  preEventMood: number | null;
}

export interface DemoDashboard {
  totalAthletes: number;
  avgReadiness: number;
  atRiskCount: number;
  crisisAlerts: number;
  weeklyTrend: { day: string; readiness: number }[];
  recentAlerts: { id: string; athleteName: string; type: string; severity: string }[];
}

// ============================================================
// DEMO DATA GENERATORS
// ============================================================

const SPORTS = ['Basketball', 'Football', 'Soccer', 'Swimming', 'Tennis', 'Volleyball', 'Track & Field'];
const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
const FIRST_NAMES = ['Sarah', 'Mike', 'Emma', 'James', 'Olivia', 'Ethan', 'Sophia', 'Liam', 'Ava', 'Noah', 'Isabella', 'Mason', 'Mia', 'Lucas', 'Charlotte'];
const LAST_NAMES = ['Johnson', 'Chen', 'Williams', 'Garcia', 'Smith', 'Brown', 'Davis', 'Miller', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Martinez', 'Robinson', 'Lee'];
const THEMES = ['pre-game-anxiety', 'confidence', 'team-dynamics', 'academic-stress', 'sleep-issues', 'motivation', 'recovery', 'injury-concern', 'performance-pressure'];
const OPPONENTS = ['State University', 'Tech College', 'City University', 'Mountain State', 'Coastal College', 'Valley University'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// ============================================================
// ATHLETES
// ============================================================

export function generateDemoAthletes(count: number = 25): DemoAthlete[] {
  const athletes: DemoAthlete[] = [];

  // Ensure we have a good distribution of risk levels
  const riskDistribution = {
    critical: Math.ceil(count * 0.12),  // ~12% critical
    warning: Math.ceil(count * 0.24),   // ~24% warning
    good: Math.ceil(count * 0.56),      // ~56% good
    'no-data': Math.ceil(count * 0.08)  // ~8% no data
  };

  let riskIndex = 0;
  const riskLevels = Object.entries(riskDistribution).flatMap(([level, num]) =>
    Array(num).fill(level as DemoAthlete['riskLevel'])
  ).slice(0, count);

  // Shuffle risk levels
  for (let i = riskLevels.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [riskLevels[i], riskLevels[j]] = [riskLevels[j], riskLevels[i]];
  }

  for (let i = 0; i < count; i++) {
    const riskLevel = riskLevels[i] || 'good';
    const hasData = riskLevel !== 'no-data';

    let readinessScore: number | null = null;
    let moodScore: number | null = null;
    let concern: string | null = null;
    let chatContribution = 0;
    let sentiment: 'improving' | 'stable' | 'declining' = 'stable';

    if (hasData) {
      switch (riskLevel) {
        case 'critical':
          readinessScore = randomInt(20, 45);
          moodScore = randomInt(2, 4);
          concern = randomChoice([
            'Reported high anxiety levels',
            'Significant sleep disruption',
            'Expressing burnout symptoms',
            'Multiple missed check-ins',
            'Declining performance trend'
          ]);
          chatContribution = randomInt(-15, -5);
          sentiment = 'declining';
          break;
        case 'warning':
          readinessScore = randomInt(46, 64);
          moodScore = randomInt(4, 6);
          concern = randomChoice([
            'Mild stress indicators',
            'Inconsistent sleep patterns',
            'Some pre-game anxiety',
            'Academic pressure noted'
          ]);
          chatContribution = randomInt(-8, 5);
          sentiment = randomChoice(['stable', 'declining']);
          break;
        case 'good':
          readinessScore = randomInt(65, 95);
          moodScore = randomInt(6, 9);
          chatContribution = randomInt(0, 12);
          sentiment = randomChoice(['improving', 'stable']);
          break;
      }
    }

    athletes.push({
      id: generateId(),
      name: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
      sport: randomChoice(SPORTS),
      year: randomChoice(YEARS),
      riskLevel,
      lastCheckIn: hasData ? hoursAgo(randomInt(1, 48)) : null,
      moodScore,
      readinessScore,
      baseReadiness: readinessScore ? readinessScore - chatContribution : null,
      chatContribution,
      chatInsights: hasData ? {
        sentiment,
        themes: [randomChoice(THEMES), randomChoice(THEMES)].filter((v, i, a) => a.indexOf(v) === i),
        risks: riskLevel === 'critical' ? [randomChoice(['burnout-risk', 'anxiety-elevated', 'support-needed'])] : []
      } : null,
      concern,
      missedCheckIns: riskLevel === 'critical' ? randomInt(2, 5) : riskLevel === 'warning' ? randomInt(0, 2) : 0
    });
  }

  return athletes;
}

// ============================================================
// AI INSIGHTS
// ============================================================

export function generateDemoInsights(): DemoInsight[] {
  return [
    // High priority correlation
    {
      id: generateId(),
      category: 'correlation',
      priority: 'high',
      headline: 'Sleep quality strongly predicts next-day performance',
      detail: 'Athletes who report 7+ hours of quality sleep perform 23% better in games the following day. This correlation is statistically significant across your team.',
      metric: { value: 0.72, label: 'Correlation', unit: 'r' },
      confidence: 94,
      evidence: 'Based on 847 mood logs and 156 game outcomes over 90 days',
      actionable: 'Consider implementing team-wide sleep hygiene protocols before game weeks'
    },
    // Effective technique (formerly intervention)
    {
      id: generateId(),
      category: 'effective-technique',
      priority: 'high',
      headline: 'Box breathing reduces pre-game anxiety by 34%',
      detail: 'Athletes who practiced box breathing before games showed significantly lower anxiety scores and higher confidence ratings.',
      metric: { value: 34, label: 'Anxiety Reduction', unit: '%' },
      confidence: 89,
      evidence: 'Tracked across 23 athletes over 6 weeks',
      actionable: 'Incorporate 5-minute box breathing into pre-game routine'
    },
    // Pattern detection
    {
      id: generateId(),
      category: 'pattern',
      priority: 'medium',
      headline: 'Wednesday slump detected across basketball team',
      detail: 'Readiness scores consistently drop 12 points on Wednesdays, likely due to heavy practice schedule on Tuesdays.',
      metric: { value: -12, label: 'Readiness Drop', unit: 'pts' },
      confidence: 78,
      evidence: 'Pattern observed for 4 consecutive weeks',
      actionable: 'Consider lighter Tuesday practices or Wednesday recovery focus'
    },
    // Prediction
    {
      id: generateId(),
      category: 'prediction',
      priority: 'medium',
      headline: '3 athletes at risk of performance decline this week',
      detail: 'Based on mood trends, sleep patterns, and historical data, Sarah J., Mike C., and Emma W. may underperform if current patterns continue.',
      metric: { value: 3, label: 'At-Risk Athletes' },
      confidence: 82,
      evidence: 'ML model trained on 2 seasons of performance data',
      actionable: 'Schedule check-ins with flagged athletes before weekend games'
    },
    // Alert
    {
      id: generateId(),
      category: 'alert',
      priority: 'high',
      headline: 'Burnout indicators detected for James Garcia',
      detail: 'James has shown declining mood scores for 2 weeks, mentioned feeling "exhausted" in chat sessions, and missed 3 check-ins.',
      athleteName: 'James Garcia',
      confidence: 91,
      evidence: 'Chat sentiment analysis + mood log patterns',
      actionable: 'Recommend 1:1 conversation and possible training load reduction'
    },
    // More correlations
    {
      id: generateId(),
      category: 'correlation',
      priority: 'medium',
      headline: 'Pre-game confidence correlates with shooting percentage',
      detail: 'Basketball players who rate confidence 8+ before games have 18% higher shooting percentages.',
      metric: { value: 0.61, label: 'Correlation', unit: 'r' },
      confidence: 85,
      evidence: 'Based on 234 game performances',
      actionable: 'Focus pre-game prep on confidence-building exercises'
    },
    // Effective technique
    {
      id: generateId(),
      category: 'effective-technique',
      priority: 'medium',
      headline: 'Visualization exercises improve performance consistency',
      detail: 'Athletes using pre-game visualization show 28% less performance variance game-to-game.',
      metric: { value: 28, label: 'Variance Reduction', unit: '%' },
      confidence: 76,
      evidence: 'Tracked across 15 athletes using visualization protocol',
      actionable: 'Expand visualization training to full roster'
    },
    // Pattern
    {
      id: generateId(),
      category: 'pattern',
      priority: 'low',
      headline: 'Morning check-ins correlate with better engagement',
      detail: 'Athletes who complete check-ins before 10 AM have 15% higher overall engagement scores.',
      metric: { value: 15, label: 'Engagement Boost', unit: '%' },
      confidence: 71,
      evidence: 'Analysis of check-in timing vs engagement metrics',
      actionable: 'Encourage morning check-in routine'
    }
  ];
}

export function generateDemoTeamSummary(): DemoTeamSummary {
  return {
    totalAthletes: 47,
    athletesWithData: 43,
    avgReadiness: 72,
    avgCorrelation: 0.68,
    topCorrelatedFactor: 'Sleep Quality',
    atRiskCount: 5,
    improvingCount: 18,
    decliningCount: 7
  };
}

// ============================================================
// DASHBOARD
// ============================================================

export function generateDemoDashboard(): DemoDashboard {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return {
    totalAthletes: 47,
    avgReadiness: 72,
    atRiskCount: 5,
    crisisAlerts: 1,
    weeklyTrend: days.map((day, i) => ({
      day,
      readiness: 68 + randomInt(-5, 8) + (i === 2 ? -8 : 0) // Wednesday slump
    })),
    recentAlerts: [
      { id: generateId(), athleteName: 'James Garcia', type: 'Burnout Risk', severity: 'high' },
      { id: generateId(), athleteName: 'Sarah Johnson', type: 'Declining Trend', severity: 'medium' },
      { id: generateId(), athleteName: 'Emma Williams', type: 'Missed Check-ins', severity: 'medium' }
    ]
  };
}

// ============================================================
// OUTCOMES
// ============================================================

export function generateDemoOutcomes(count: number = 20): DemoOutcome[] {
  const outcomes: DemoOutcome[] = [];
  const athletes = generateDemoAthletes(10);

  for (let i = 0; i < count; i++) {
    const athlete = randomChoice(athletes);
    const isWin = Math.random() > 0.4; // 60% win rate

    outcomes.push({
      id: generateId(),
      date: daysAgo(randomInt(1, 30)).toISOString(),
      athleteId: athlete.id,
      athleteName: athlete.name,
      outcomeType: randomChoice(['GAME', 'GAME', 'GAME', 'PRACTICE', 'SCRIMMAGE']),
      opponent: randomChoice(OPPONENTS),
      homeAway: randomChoice(['HOME', 'AWAY']),
      gameResult: isWin ? 'WIN' : 'LOSS',
      overallRating: randomInt(55, 95),
      preEventMood: randomInt(4, 9)
    });
  }

  return outcomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ============================================================
// READINESS HEATMAP
// ============================================================

export interface DemoReadinessDay {
  date: string;
  athletes: { id: string; name: string; score: number }[];
}

export function generateDemoReadinessHeatmap(days: number = 14): DemoReadinessDay[] {
  const athletes = generateDemoAthletes(15);
  const heatmap: DemoReadinessDay[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = daysAgo(i);
    heatmap.push({
      date: date.toISOString().split('T')[0],
      athletes: athletes.map(a => ({
        id: a.id,
        name: a.name,
        score: Math.max(20, Math.min(100, (a.readinessScore || 70) + randomInt(-15, 15)))
      }))
    });
  }

  return heatmap;
}

// ============================================================
// HELPER: Check if demo mode is enabled
// ============================================================

export function isDemoMode(searchParams: URLSearchParams | { get: (key: string) => string | null }): boolean {
  return searchParams.get('demo') === 'true';
}
