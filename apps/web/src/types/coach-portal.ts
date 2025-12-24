/**
 * Coach Portal - TypeScript Type Definitions
 * Comprehensive data models for the elite coach dashboard
 */

// ==================== CORE ENTITIES ====================

export interface Coach {
  id: string;
  userId: string;
  name: string;
  email: string;
  sport: string;
  title?: string;
  inviteCode?: string;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Athlete {
  id: string;
  userId: string;
  name: string;
  email: string;
  sport: string;
  year: AthleteYear;
  teamPosition?: string;
  profileImage?: string;

  // Consent & Privacy
  consentCoachView: boolean;
  consentChatSummaries: boolean;

  // Risk & Classification
  riskLevel: RiskLevel;
  archetype?: AthleteArchetype;
  lastRiskUpdate?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export enum AthleteYear {
  FRESHMAN = 'FRESHMAN',
  SOPHOMORE = 'SOPHOMORE',
  JUNIOR = 'JUNIOR',
  SENIOR = 'SENIOR',
  GRADUATE = 'GRADUATE',
}

export enum RiskLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AthleteArchetype {
  OVERTHINKER = 'OVERTHINKER',
  BURNOUT_RISK = 'BURNOUT_RISK',
  MOMENTUM_BUILDER = 'MOMENTUM_BUILDER',
  INCONSISTENT_PERFORMER = 'INCONSISTENT_PERFORMER',
  PRESSURE_AVOIDER = 'PRESSURE_AVOIDER',
  RESILIENT_WARRIOR = 'RESILIENT_WARRIOR',
  LOST_ATHLETE = 'LOST_ATHLETE',
  PERFECTIONIST = 'PERFECTIONIST',
}

// ==================== READINESS SYSTEM ====================

export interface ReadinessScore {
  id: string;
  athleteId: string;
  gameDate: Date;
  calculatedAt: Date;

  // Overall Score (0-100)
  score: number;
  level: ReadinessLevel;

  // 6-Dimensional Breakdown
  dimensions: ReadinessDimensions;

  // Contributing Factors
  topLimiters: string[];      // Top 3 factors lowering score
  topStrengths: string[];     // Top 3 factors boosting score

  // 7-day Averages (for trend calculation)
  moodAvg7d: number;
  stressAvg7d: number;
  sleepAvg3d: number;
  hrvRecovery?: number;
  daysSinceGame?: number;
  chatEngagement?: number;
}

export interface ReadinessDimensions {
  physical: number;      // 0-100
  mental: number;        // 0-100
  emotional: number;     // 0-100
  recovery: number;      // 0-100
  contextual: number;    // 0-100
  social: number;        // 0-100
}

export enum ReadinessLevel {
  OPTIMAL = 'OPTIMAL',       // 90-100: Peak readiness
  GOOD = 'GOOD',             // 75-89: Normal training
  MODERATE = 'MODERATE',     // 60-74: Modify intensity
  LOW = 'LOW',               // 45-59: Active recovery
  POOR = 'POOR',             // 0-44: Rest day
}

// Readiness Forecast (7-day prediction)
export interface ReadinessForecast {
  athleteId: string;
  predictions: Array<{
    date: Date;
    predictedScore: number;
    confidence: number;          // 0-1
    recommendedLoad: 'LIGHT' | 'MODERATE' | 'NORMAL' | 'HIGH';
  }>;
  upcomingGames: Array<{
    date: Date;
    opponent: string;
    expectedReadiness: number;
  }>;
}

// ==================== RISK & CRISIS DETECTION ====================

export interface RiskAssessment {
  athleteId: string;
  calculatedAt: Date;

  // Overall Risk Score (0-100)
  totalRiskScore: number;
  riskLevel: RiskLevel;

  // Component Risks
  mentalHealthRisk: number;    // 0-100
  burnoutRisk: number;          // 0-100
  performanceDeclineRisk: number;
  injuryRisk: number;
  disengagementRisk: number;

  // Flags & Alerts
  activeFlags: RiskFlag[];

  // Recommended Actions
  recommendedInterventions: string[];
  urgency: 'IMMEDIATE' | 'URGENT' | 'MONITOR' | 'ROUTINE';
}

export interface RiskFlag {
  type: RiskFlagType;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  detectedAt: Date;
  description: string;
  metric?: string;               // Which data point triggered this
  value?: number;
}

export enum RiskFlagType {
  CHRONIC_STRESS = 'CHRONIC_STRESS',
  MOOD_DECLINE = 'MOOD_DECLINE',
  ENGAGEMENT_DROP = 'ENGAGEMENT_DROP',
  PERFORMANCE_DECLINE = 'PERFORMANCE_DECLINE',
  SLEEP_DISRUPTION = 'SLEEP_DISRUPTION',
  SOCIAL_ISOLATION = 'SOCIAL_ISOLATION',
  OVERTRAINING = 'OVERTRAINING',
  BURNOUT_SIGNS = 'BURNOUT_SIGNS',
}

export interface CrisisAlert {
  id: string;
  athleteId: string;
  sessionId: string;
  messageId: string;

  severity: 'CRITICAL' | 'URGENT' | 'ELEVATED' | 'MONITOR';
  crisisScore: number;           // 0-100

  // Detection Details
  detectedKeywords: string[];
  sentimentScore: number;
  contextualRisks: string[];

  // Response Status
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  escalated: boolean;
  escalatedTo?: string;
  notes?: string;

  // Timestamps
  detectedAt: Date;
}

// ==================== PERFORMANCE & ANALYTICS ====================

export interface PerformanceMetric {
  id: string;
  athleteId: string;
  gameDate: Date;
  sport: string;

  // Game Context
  opponentName?: string;
  homeAway: 'HOME' | 'AWAY';
  gameImportance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // Mental State (pre-game)
  mentalMoodScore?: number;
  mentalStressScore?: number;
  mentalSleepHours?: number;
  mentalHRVScore?: number;
  readinessScore?: number;

  // Performance Stats (sport-specific JSON)
  stats: Record<string, any>;
  outcome: 'WIN' | 'LOSS' | 'TIE';

  // Predictions
  slumpPrediction?: boolean;
  predictedPerformance?: number;

  createdAt: Date;
}

export interface PerformancePrediction {
  athleteId: string;
  gameDate: Date;

  // Predictions with confidence intervals
  predictedStats: {
    metric: string;
    predicted: number;
    confidenceLow: number;
    confidenceHigh: number;
  }[];

  // Contributing Factors
  readinessContribution: number;
  mentalStateContribution: number;
  historicalTrendContribution: number;
  contextualFactors: string[];

  // Recommendations
  optimalMentalPrep: string[];
  riskFactors: string[];
}

// ==================== MOOD & WELLNESS ====================

export interface MoodLog {
  id: string;
  athleteId: string;

  // Core Metrics (1-10 scale)
  mood: number;
  confidence: number;
  stress: number;
  energy?: number;
  sleep?: number;            // Hours slept

  // Optional Context
  notes?: string;
  tags: string[];

  createdAt: Date;
}

export interface MoodTrend {
  athleteId: string;
  period: 'WEEK' | 'MONTH' | 'SEASON';

  // Averages
  avgMood: number;
  avgConfidence: number;
  avgStress: number;
  avgEnergy?: number;
  avgSleep?: number;

  // Trend Direction
  moodDelta: number;         // Change from previous period
  stressDelta: number;
  confidenceDelta: number;

  // Volatility (standard deviation)
  moodVolatility: number;
  stressVolatility: number;

  // Data Quality
  logCount: number;
  completenessRate: number;  // % of days logged
}

// ==================== GOALS & TASKS ====================

export interface Goal {
  id: string;
  athleteId: string;

  title: string;
  description?: string;
  category: GoalCategory;
  type: GoalType;
  status: GoalStatus;

  // Progress Tracking
  targetMetric?: string;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  completionPct: number;

  // Timeline
  startDate: Date;
  targetDate?: Date;
  completedAt?: Date;

  // Hierarchy
  parentGoalId?: string;
  childGoals?: Goal[];

  // AI Context
  aiSuggested: boolean;
  aiReason?: string;
  archetypeAlignment?: string;

  createdAt: Date;
  updatedAt: Date;
}

export enum GoalCategory {
  PERFORMANCE = 'PERFORMANCE',
  MENTAL = 'MENTAL',
  ACADEMIC = 'ACADEMIC',
  PERSONAL = 'PERSONAL',
}

export enum GoalType {
  LONG_TERM = 'LONG_TERM',
  SHORT_TERM = 'SHORT_TERM',
}

export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export interface Assignment {
  id: string;
  coachId: string;

  title: string;
  description: string;
  dueDate?: Date;

  // Targeting
  targetAthleteIds?: string[];   // Null = all athletes
  targetSport?: string;
  targetArchetype?: AthleteArchetype;

  // Assignment Type
  templateId?: string;
  category: 'CBT' | 'MINDFULNESS' | 'GOAL_SETTING' | 'REFLECTION' | 'ROUTINE' | 'OTHER';

  // Tracking
  submissions: AssignmentSubmission[];
  completionRate: number;
  avgResponseQuality?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  athleteId: string;

  response?: string;
  status: 'PENDING' | 'SUBMITTED' | 'REVIEWED';

  // AI Analysis
  sentiment?: number;
  keyThemes?: string[];
  qualityScore?: number;

  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== AI INSIGHTS ====================

export interface AIInsight {
  id: string;
  type: AIInsightType;
  category: 'ATHLETE' | 'TEAM' | 'INTERVENTION' | 'PREDICTION';

  // Scope
  athleteId?: string;          // Null if team-wide
  coachId: string;

  // Content
  title: string;
  summary: string;
  details: string;
  recommendations: string[];

  // Metadata
  confidence: number;          // 0-1
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  // Interaction
  viewed: boolean;
  viewedAt?: Date;
  dismissed: boolean;
  actionTaken?: string;

  generatedAt: Date;
  expiresAt?: Date;
}

export enum AIInsightType {
  // Automated Summaries
  WEEKLY_TEAM_REPORT = 'WEEKLY_TEAM_REPORT',
  ATHLETE_BRIEFING = 'ATHLETE_BRIEFING',
  CHAT_SUMMARY = 'CHAT_SUMMARY',
  PATTERN_ALERT = 'PATTERN_ALERT',

  // Predictive Alerts
  BURNOUT_PREDICTION = 'BURNOUT_PREDICTION',
  SLUMP_PREDICTION = 'SLUMP_PREDICTION',
  CRISIS_RISK = 'CRISIS_RISK',
  DISENGAGEMENT_WARNING = 'DISENGAGEMENT_WARNING',

  // Intervention Recommendations
  COACHING_GUIDE = 'COACHING_GUIDE',
  INTERVENTION_SUGGESTION = 'INTERVENTION_SUGGESTION',
  OPTIMAL_TIMING = 'OPTIMAL_TIMING',

  // Team Dynamics
  LEADERSHIP_IDENTIFIED = 'LEADERSHIP_IDENTIFIED',
  ISOLATION_ALERT = 'ISOLATION_ALERT',
  CONFLICT_DETECTION = 'CONFLICT_DETECTION',
  CLIQUE_FORMATION = 'CLIQUE_FORMATION',
}

export interface BurnoutPrediction {
  athleteId: string;
  predictedAt: Date;

  // 30-day Forecast
  burnoutProbability: number;   // 0-1
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  estimatedOnsetDate?: Date;

  // Contributing Factors
  chronicStress: boolean;
  emotionalExhaustion: boolean;
  cynicism: boolean;
  reducedEfficacy: boolean;
  trainingLoadMismanagement: boolean;

  // Scores
  stressScore: number;
  energyScore: number;
  motivationScore: number;
  performanceDecline: number;

  // Recommendations
  preventionStrategies: string[];
  loadRecommendation: 'REST_WEEK' | 'REDUCE_30' | 'REDUCE_50' | 'MONITOR';
}

// ==================== TEAM DYNAMICS ====================

export interface TeamChemistry {
  teamId: string;
  calculatedAt: Date;

  // Overall Scores
  cohesionScore: number;       // 0-100
  trustLevel: number;
  communicationQuality: number;

  // Network Analysis
  socialNetwork: SocialNetwork;
  leaders: string[];           // Athlete IDs
  isolatedAthletes: string[];
  cliques: Clique[];

  // Conflict Detection
  potentialConflicts: Array<{
    athlete1Id: string;
    athlete2Id: string;
    severity: 'LOW' | 'MODERATE' | 'HIGH';
    indicators: string[];
  }>;
}

export interface SocialNetwork {
  nodes: Array<{
    athleteId: string;
    centrality: number;         // How connected they are (0-1)
    positiveInfluence: number;  // Positive sentiment they generate
    connections: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    strength: number;           // Interaction frequency
    sentiment: number;          // Positive/negative
  }>;
}

export interface Clique {
  id: string;
  memberIds: string[];
  basis: 'YEAR' | 'POSITION' | 'STARTER_BENCH' | 'SOCIAL' | 'UNKNOWN';
  cohesionScore: number;
  isolation: boolean;            // Not interacting with rest of team
}

// ==================== COACH ACTIONS & INTERVENTIONS ====================

export interface CoachIntervention {
  id: string;
  coachId: string;
  athleteId: string;

  // Intervention Details
  type: InterventionType;
  description: string;
  triggeredBy?: string;        // AI insight ID or manual

  // Timing
  performedAt: Date;
  duration?: number;           // Minutes

  // Outcome Tracking
  outcomeRecorded: boolean;
  outcome?: 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE' | 'TOO_EARLY';
  notes?: string;

  // Learning
  archetypeAlignment?: AthleteArchetype;
  effectivenessScore?: number; // 0-10
}

export enum InterventionType {
  ONE_ON_ONE_MEETING = 'ONE_ON_ONE_MEETING',
  GROUP_SESSION = 'GROUP_SESSION',
  TEXT_CHECK_IN = 'TEXT_CHECK_IN',
  ASSIGNMENT_GIVEN = 'ASSIGNMENT_GIVEN',
  LOAD_ADJUSTMENT = 'LOAD_ADJUSTMENT',
  MENTAL_SKILLS_TRAINING = 'MENTAL_SKILLS_TRAINING',
  CRISIS_INTERVENTION = 'CRISIS_INTERVENTION',
  REFERRAL = 'REFERRAL',
  OTHER = 'OTHER',
}

export interface CoachNote {
  id: string;
  coachId: string;
  athleteId: string;

  content: string;
  isPrivate: boolean;
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

// ==================== COMMAND CENTER (Dashboard) ====================

export interface CommandCenterData {
  // Priority List (AI-sorted)
  priorityAthletes: PriorityAthlete[];

  // Quick Stats
  teamStats: {
    totalAthletes: number;
    withConsent: number;
    readinessDistribution: {
      optimal: number;
      good: number;
      moderate: number;
      low: number;
      poor: number;
    };
    activeCrisisAlerts: number;
    assignmentsDueToday: number;
  };

  // Action Feed
  recentFlags: RiskFlag[];
  newInsights: AIInsight[];

  // Intervention Tracker
  recentInterventions: CoachIntervention[];
  pendingFollowUps: Array<{
    athleteId: string;
    reason: string;
    dueDate: Date;
  }>;
}

export interface PriorityAthlete {
  athlete: Athlete;
  readiness: ReadinessScore;
  risk: RiskAssessment;

  // Why They're on This List
  urgency: 'CRITICAL' | 'URGENT' | 'MONITOR' | 'THRIVING';
  primaryReason: string;
  flags: RiskFlag[];

  // Recommended Action
  suggestedIntervention: string;
  actionDeadline?: Date;
}

// ==================== ANALYTICS TYPES ====================

export interface CohortComparison {
  cohortA: {
    name: string;
    athleteIds: string[];
  };
  cohortB: {
    name: string;
    athleteIds: string[];
  };

  metrics: {
    metric: string;
    cohortAAvg: number;
    cohortBAvg: number;
    difference: number;
    significant: boolean;
    pValue?: number;
  }[];
}

export interface CorrelationAnalysis {
  variable1: string;
  variable2: string;
  correlation: number;        // -1 to 1
  pValue: number;
  interpretation: string;
  scatterPlotData: Array<{
    x: number;
    y: number;
    athleteId: string;
  }>;
}

export interface LongitudinalTrend {
  metric: string;
  period: 'WEEK' | 'MONTH' | 'SEASON';
  dataPoints: Array<{
    date: Date;
    value: number;
    athleteCount: number;
  }>;
  trendDirection: 'IMPROVING' | 'STABLE' | 'DECLINING';
  changeRate: number;
}

// ==================== API RESPONSE TYPES ====================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: Date;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    timestamp: Date;
  };
}

// ==================== FILTER & QUERY TYPES ====================

export interface AthleteFilters {
  sport?: string[];
  year?: AthleteYear[];
  riskLevel?: RiskLevel[];
  readinessZone?: ReadinessLevel[];
  archetype?: AthleteArchetype[];
  consentGranted?: boolean;
  search?: string;
  sortBy?: 'name' | 'readiness' | 'risk' | 'lastUpdate';
  sortOrder?: 'asc' | 'desc';
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AnalyticsQuery {
  athleteIds?: string[];
  dateRange: DateRange;
  metrics: string[];
  groupBy?: 'day' | 'week' | 'month';
  cohorts?: {
    name: string;
    filter: AthleteFilters;
  }[];
}

// ==================== SETTINGS & CONFIG ====================

export interface CoachSettings {
  coachId: string;

  // Notification Preferences
  notifications: {
    crisisAlerts: {
      enabled: boolean;
      threshold: 'CRITICAL' | 'URGENT' | 'ELEVATED' | 'ALL';
      channels: ('EMAIL' | 'SMS' | 'PUSH')[];
    };
    dailyDigest: {
      enabled: boolean;
      time: string;              // HH:MM format
    };
    weeklyReport: {
      enabled: boolean;
      day: 'SUNDAY' | 'MONDAY';
      time: string;
    };
    riskAlerts: {
      enabled: boolean;
      minRiskLevel: RiskLevel;
    };
  };

  // AI Personalization
  aiConfig: {
    riskScoreWeighting: {
      mentalHealth: number;
      burnout: number;
      performance: number;
      injury: number;
      disengagement: number;
    };
    archetypeThresholds: Record<string, number>;
    interventionStyle: 'DATA_DRIVEN' | 'EMPATHETIC' | 'BALANCED';
  };

  // Display Preferences
  ui: {
    defaultView: 'COMMAND_CENTER' | 'ROSTER' | 'ANALYTICS';
    chartPreferences: Record<string, any>;
    theme: 'LIGHT' | 'DARK' | 'AUTO';
  };
}

// ==================== WEEKLY CHAT SUMMARIES ====================

export interface WeeklySummary {
  id: string;
  athleteId: string;
  summaryType: 'WEEKLY';

  // Week Boundaries
  weekStart: Date;
  weekEnd: Date;

  // Summary Content
  summary: string;                      // Human-readable overview
  keyThemes: string[];                  // Encrypted - high-level themes
  adherenceNotes: string | null;        // Encrypted - engagement notes
  recommendedActions: string[];         // Encrypted - suggested interventions
  riskFlags: string[];                  // Not encrypted - needed for penalties

  // Structured Numeric Scores (1-10 scale, NOT encrypted)
  moodScore: number | null;
  stressScore: number | null;
  sleepQualityScore: number | null;
  confidenceScore: number | null;
  sorenessScore: number | null;
  workloadPerception: number | null;

  // Goal Progress Tracking
  athleteGoalsProgress: Record<string, {
    status: 'on_track' | 'struggling' | 'achieved';
    notes: string;
    confidence: number;
  }> | null;

  // Engagement Metrics
  totalMessages: number | null;
  sessionCount: number | null;
  avgResponseTime: number | null;      // Seconds
  engagementScore: number | null;      // 1-10

  // Privacy & Audit
  redactedContent: boolean;
  viewedByCoach: boolean;
  viewedAt: Date | null;
  coachId: string | null;

  // Data Retention
  expiresAt: Date | null;
  revokedAt: Date | null;

  // Timestamps
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklySummaryWithConsent extends WeeklySummary {
  athlete: {
    name: string;
    consentChatSummaries: boolean;
    consentCoachView: boolean;
  };
}

export interface WeeklySummaryListResponse {
  summaries: WeeklySummary[];
  meta: {
    athleteId: string;
    athleteName: string;
    consentGranted: boolean;
    weekStart: Date;
    weekEnd: Date;
    hasMoreWeeks: boolean;
  };
}

// ==================== UTILITY TYPES ====================

export type ID = string;

export interface Timestamp {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDelete extends Timestamp {
  deletedAt?: Date;
  isDeleted: boolean;
}
