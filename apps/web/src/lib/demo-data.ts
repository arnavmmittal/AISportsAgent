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
// ATHLETE PORTAL DEMO DATA
// ============================================================

export interface DemoAthleteDashboard {
  user: {
    name: string;
    sport: string | null;
    year: string | null;
  };
  readiness: {
    score: number;
    dimensions: { mood: number; sleep: number; stress: number; engagement: number };
    trend: 'up' | 'down' | 'stable';
    change: number;
  };
  stats: {
    checkInStreak: number;
    goalsCompleted: number;
    goalsTotal: number;
    lastChatTopic: string | null;
    hasCompletedCheckIn: boolean;
  };
  insight: {
    text: string;
    type: 'pattern' | 'recommendation' | 'celebration';
    actionUrl: string;
    actionLabel: string;
  };
  focusItems: {
    id: string;
    title: string;
    completed: boolean;
    type: 'routine' | 'assignment';
  }[];
  hasGameTomorrow: boolean;
  upcomingAssignments: {
    id: string;
    title: string;
    dueDate: string;
    estimatedTime: string | null;
  }[];
}

export interface DemoMoodLog {
  id: string;
  date: Date;
  mood: number;
  confidence: number;
  stress: number;
  energy: number;
  sleep: number;
  notes?: string;
}

export interface DemoGoal {
  id: string;
  title: string;
  category: 'performance' | 'mental' | 'academic' | 'personal';
  progress: number;
  target: number;
  unit: string;
  dueDate: string;
  status: 'on-track' | 'at-risk' | 'completed';
}

export interface DemoChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  topic: string;
}

export function generateDemoAthleteDashboard(): DemoAthleteDashboard {
  const insightOptions = [
    {
      text: "Your mood scores are 15% higher on days you get 7+ hours of sleep. Consider prioritizing rest tonight!",
      type: 'pattern' as const,
      actionUrl: '/student/wellness?tab=checkin',
      actionLabel: 'Log Sleep'
    },
    {
      text: "You've completed 5 check-ins in a row! Your consistency is paying off - keep building that awareness.",
      type: 'celebration' as const,
      actionUrl: '/student/wellness',
      actionLabel: 'View History'
    },
    {
      text: "Pre-game anxiety has been a theme in your recent chats. Try the box breathing exercise before tomorrow's game.",
      type: 'recommendation' as const,
      actionUrl: '/student/wellness?tab=readiness',
      actionLabel: 'Try Breathing'
    },
  ];

  return {
    user: {
      name: 'Alex Johnson',
      sport: 'Basketball',
      year: 'Junior',
    },
    readiness: {
      score: 78,
      dimensions: {
        mood: 82,
        sleep: 75,
        stress: 68,
        engagement: 85,
      },
      trend: 'up',
      change: 8,
    },
    stats: {
      checkInStreak: 7,
      goalsCompleted: 3,
      goalsTotal: 5,
      lastChatTopic: 'Pre-game focus techniques',
      hasCompletedCheckIn: false,
    },
    insight: randomChoice(insightOptions),
    focusItems: [
      { id: 'r1', title: 'Morning check-in', completed: false, type: 'routine' },
      { id: 'r2', title: '5-minute visualization', completed: false, type: 'routine' },
      { id: 'a1', title: 'Reflection: Post-game analysis', completed: false, type: 'assignment' },
    ],
    hasGameTomorrow: true,
    upcomingAssignments: [
      {
        id: 'assign-1',
        title: 'Pre-Game Mental Prep Checklist',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: '10 min',
      },
      {
        id: 'assign-2',
        title: 'Weekly Goal Review',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: '15 min',
      },
    ],
  };
}

export function generateDemoMoodLogs(days: number = 7): DemoMoodLog[] {
  const logs: DemoMoodLog[] = [];

  for (let i = days - 1; i >= 0; i--) {
    // Skip some days randomly to simulate missed check-ins
    if (i > 0 && Math.random() < 0.15) continue;

    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(8, randomInt(0, 59), 0, 0);

    // Create realistic mood patterns - better on recent days (streak effect)
    const baseMood = 5 + (7 - i) * 0.3;

    logs.push({
      id: generateId(),
      date,
      mood: Math.min(10, Math.max(1, Math.round(baseMood + randomFloat(-1.5, 1.5, 0)))),
      confidence: randomInt(5, 9),
      stress: randomInt(3, 7),
      energy: randomInt(5, 8),
      sleep: randomFloat(6, 8.5, 1),
      notes: i === 0 ? undefined : randomChoice([
        undefined,
        'Feeling ready for practice',
        'A bit tired today',
        'Good energy after rest day',
        'Looking forward to the game',
      ]),
    });
  }

  return logs;
}

export function generateDemoGoals(): DemoGoal[] {
  return [
    {
      id: generateId(),
      title: 'Improve free throw percentage',
      category: 'performance',
      progress: 78,
      target: 85,
      unit: '%',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'on-track',
    },
    {
      id: generateId(),
      title: 'Complete 30 visualization sessions',
      category: 'mental',
      progress: 18,
      target: 30,
      unit: 'sessions',
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'on-track',
    },
    {
      id: generateId(),
      title: 'Maintain 3.5 GPA',
      category: 'academic',
      progress: 3.6,
      target: 3.5,
      unit: 'GPA',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
    },
    {
      id: generateId(),
      title: 'Build pre-game routine',
      category: 'mental',
      progress: 4,
      target: 5,
      unit: 'steps',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'on-track',
    },
    {
      id: generateId(),
      title: 'Reduce pre-game anxiety',
      category: 'mental',
      progress: 2,
      target: 5,
      unit: 'techniques',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'at-risk',
    },
  ];
}

export function generateDemoChatSessions(): DemoChatSession[] {
  return [
    {
      id: generateId(),
      title: 'Pre-game focus techniques',
      lastMessage: "Try the 4-7-8 breathing technique before stepping on the court...",
      timestamp: hoursAgo(2),
      messageCount: 12,
      topic: 'anxiety',
    },
    {
      id: generateId(),
      title: 'Dealing with performance pressure',
      lastMessage: "Remember, pressure is a privilege. It means you're in a position to make an impact...",
      timestamp: daysAgo(1),
      messageCount: 18,
      topic: 'confidence',
    },
    {
      id: generateId(),
      title: 'Sleep and recovery',
      lastMessage: "Your sleep data shows improvement! The consistent bedtime routine is working...",
      timestamp: daysAgo(3),
      messageCount: 8,
      topic: 'recovery',
    },
    {
      id: generateId(),
      title: 'Post-game reflection',
      lastMessage: "Let's break down what went well and identify one area for tomorrow's practice...",
      timestamp: daysAgo(5),
      messageCount: 15,
      topic: 'reflection',
    },
  ];
}

// ============================================================
// CHAT INSIGHTS (Team-wide conversation analysis for coaches)
// ============================================================

export interface DemoChatInsightsResponse {
  teamSentiment: {
    current: number;
    trend: 'improving' | 'stable' | 'declining';
    weeklyChange: number;
  };
  topThemes: {
    theme: string;
    count: number;
    athletes: string[];
    trend: 'increasing' | 'stable' | 'decreasing';
  }[];
  sentimentHistory: {
    date: string;
    avgSentiment: number;
    sessionCount: number;
  }[];
  disengagedAthletes: {
    id: string;
    name: string;
    sport: string | null;
    daysSinceChat: number;
    lastChatDate: string | null;
  }[];
  concerningAthletes: {
    id: string;
    name: string;
    sport: string | null;
    concerningTopics: string[];
    avgSentiment: number;
    recentSessions: number;
  }[];
  stats: {
    totalSessions: number;
    athletesWithChats: number;
    avgSessionsPerAthlete: number;
    chatEngagementRate: number;
  };
  generatedAt: string;
}

const CHAT_THEMES = [
  'performance-anxiety',
  'competition-preparation',
  'mindset-mental',
  'recovery-rest',
  'team-conflict',
  'academic-stress',
  'coach-pressure',
  'injury-concern',
  'goal-setting',
  'technique-refinement',
];

const CONCERNING_CHAT_TOPICS = [
  'fear of failure',
  'performance expectations',
  'comparison to others',
  'social isolation',
];

export function generateDemoChatInsights(): DemoChatInsightsResponse {
  // Generate 14 days of sentiment history
  const sentimentHistory: DemoChatInsightsResponse['sentimentHistory'] = [];
  let baseSentiment = 0.1;
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    baseSentiment += (Math.random() - 0.45) * 0.15; // Slight upward trend
    baseSentiment = Math.max(-0.8, Math.min(0.8, baseSentiment));
    sentimentHistory.push({
      date: date.toISOString().split('T')[0],
      avgSentiment: Math.round(baseSentiment * 100) / 100,
      sessionCount: Math.floor(Math.random() * 8) + 3,
    });
  }

  // Current sentiment from last few days
  const recentSentiments = sentimentHistory.slice(-3);
  const currentSentiment = recentSentiments.reduce((sum, d) => sum + d.avgSentiment, 0) / recentSentiments.length;
  const olderSentiments = sentimentHistory.slice(-7, -3);
  const olderSentiment = olderSentiments.reduce((sum, d) => sum + d.avgSentiment, 0) / olderSentiments.length;
  const weeklyChange = currentSentiment - olderSentiment;

  // Generate top themes with realistic distribution
  const topThemes: DemoChatInsightsResponse['topThemes'] = [
    {
      theme: 'competition-preparation',
      count: 28,
      athletes: ['Sarah Johnson', 'Mike Chen', 'Emma Williams', 'James Garcia', 'Olivia Smith'],
      trend: 'increasing',
    },
    {
      theme: 'performance-anxiety',
      count: 19,
      athletes: ['Mike Chen', 'Sophia Davis', 'Lucas Miller'],
      trend: 'stable',
    },
    {
      theme: 'mindset-mental',
      count: 15,
      athletes: ['Emma Williams', 'Ava Wilson', 'Noah Taylor'],
      trend: 'increasing',
    },
    {
      theme: 'recovery-rest',
      count: 12,
      athletes: ['James Garcia', 'Isabella Anderson'],
      trend: 'stable',
    },
    {
      theme: 'academic-stress',
      count: 8,
      athletes: ['Sophia Davis', 'Charlotte Thomas'],
      trend: 'increasing',
    },
    {
      theme: 'team-conflict',
      count: 5,
      athletes: ['Ethan Brown', 'Mason Martinez'],
      trend: 'decreasing',
    },
  ];

  // Generate disengaged athletes (haven't chatted in 7+ days)
  const disengagedAthletes: DemoChatInsightsResponse['disengagedAthletes'] = [
    {
      id: 'demo-athlete-15',
      name: 'Tyler Robinson',
      sport: 'Football',
      daysSinceChat: 14,
      lastChatDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-athlete-16',
      name: 'Rachel Lee',
      sport: 'Swimming',
      daysSinceChat: 10,
      lastChatDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-athlete-17',
      name: 'David Kim',
      sport: 'Basketball',
      daysSinceChat: 8,
      lastChatDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Generate athletes with concerning patterns
  const concerningAthletes: DemoChatInsightsResponse['concerningAthletes'] = [
    {
      id: 'demo-athlete-2',
      name: 'Mike Chen',
      sport: 'Football',
      concerningTopics: ['performance-anxiety', 'fear of failure', 'comparison to others'],
      avgSentiment: -0.35,
      recentSessions: 4,
    },
    {
      id: 'demo-athlete-6',
      name: 'Sophia Davis',
      sport: 'Soccer',
      concerningTopics: ['academic-stress', 'performance expectations'],
      avgSentiment: -0.22,
      recentSessions: 3,
    },
  ];

  return {
    teamSentiment: {
      current: Math.round(currentSentiment * 100) / 100,
      trend: weeklyChange > 0.1 ? 'improving' : weeklyChange < -0.1 ? 'declining' : 'stable',
      weeklyChange: Math.round(weeklyChange * 100) / 100,
    },
    topThemes,
    sentimentHistory,
    disengagedAthletes,
    concerningAthletes,
    stats: {
      totalSessions: 87,
      athletesWithChats: 22,
      avgSessionsPerAthlete: 3.9,
      chatEngagementRate: 88,
    },
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================
// HELPER: Check if demo mode is enabled
// ============================================================

export function isDemoMode(searchParams: URLSearchParams | { get: (key: string) => string | null }): boolean {
  return searchParams.get('demo') === 'true';
}
