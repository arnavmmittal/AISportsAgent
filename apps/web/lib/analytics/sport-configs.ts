/**
 * Sport-Specific Configurations for Performance Analytics
 *
 * Defines metrics, readiness weights, and correlation models for all major collegiate sports.
 * Based on sports science research and performance psychology literature.
 */

export type SportMetric = {
  key: string;
  label: string;
  unit?: string;
  higherIsBetter: boolean; // true = higher values indicate better performance
  correlationWeight: number; // 0-1, importance for overall performance score
};

export type ReadinessWeights = {
  // Mental factors (0-10 scale)
  mood: number;
  confidence: number;
  stress: number; // inverted (10-stress)
  energy: number;
  focus: number;
  motivation: number;

  // Physical factors
  sleep: number; // hours, normalized to 0-10
  soreness: number; // 0-10, inverted
  fatigue: number; // 0-10, inverted
  hrv: number; // if available, normalized

  // Cognitive factors
  mentalClarity: number;
  anxiety: number; // inverted
};

export type SportConfig = {
  name: string;
  category: 'team' | 'individual' | 'hybrid';
  primaryDemands: ('endurance' | 'power' | 'skill' | 'strategy' | 'precision')[];

  // Performance metrics tracked for this sport
  metrics: SportMetric[];

  // Primary performance indicator (for correlation analysis)
  primaryMetric: string;

  // Readiness factor weights (must sum to 1.0)
  readinessWeights: Partial<ReadinessWeights>;

  // Temporal weighting for readiness calculation
  temporalWeights: {
    today: number;      // Weight for same-day mood log
    yesterday: number;  // Weight for previous day
    week: number;       // Weight for 7-day average
  };

  // Expected correlation thresholds (for validation)
  expectedCorrelations: {
    [metricKey: string]: {
      minR: number; // Minimum expected Pearson r with readiness
      optimal: number; // Optimal correlation coefficient
    };
  };
};

/**
 * All supported sports with complete configurations
 */
export const SPORT_CONFIGS: Record<string, SportConfig> = {
  'Basketball': {
    name: 'Basketball',
    category: 'team',
    primaryDemands: ['endurance', 'power', 'skill', 'strategy'],
    metrics: [
      { key: 'points', label: 'Points', higherIsBetter: true, correlationWeight: 0.35 },
      { key: 'assists', label: 'Assists', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'rebounds', label: 'Rebounds', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'steals', label: 'Steals', higherIsBetter: true, correlationWeight: 0.08 },
      { key: 'blocks', label: 'Blocks', higherIsBetter: true, correlationWeight: 0.07 },
      { key: 'turnovers', label: 'Turnovers', higherIsBetter: false, correlationWeight: 0.10 },
      { key: 'fieldGoalPct', label: 'FG%', unit: '%', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'threePointPct', label: '3P%', unit: '%', higherIsBetter: true, correlationWeight: 0.10 },
      { key: 'freeThrowPct', label: 'FT%', unit: '%', higherIsBetter: true, correlationWeight: 0.08 },
      { key: 'minutes', label: 'Minutes', higherIsBetter: true, correlationWeight: 0.05 },
      { key: 'plusMinus', label: '+/-', higherIsBetter: true, correlationWeight: 0.12 },
    ],
    primaryMetric: 'points',
    readinessWeights: {
      mood: 0.15,
      confidence: 0.20,      // High weight - crucial for performance
      stress: 0.15,          // Inverted
      energy: 0.15,          // Important for endurance
      focus: 0.12,           // Decision-making under pressure
      motivation: 0.08,
      sleep: 0.10,           // Recovery
      anxiety: 0.05,         // Inverted - pre-game nerves
    },
    temporalWeights: {
      today: 0.50,
      yesterday: 0.30,
      week: 0.20,
    },
    expectedCorrelations: {
      points: { minR: 0.50, optimal: 0.68 },
      assists: { minR: 0.45, optimal: 0.60 },
      fieldGoalPct: { minR: 0.40, optimal: 0.55 },
      turnovers: { minR: -0.40, optimal: -0.52 }, // Negative correlation
    },
  },

  'Football': {
    name: 'Football',
    category: 'team',
    primaryDemands: ['power', 'strategy', 'skill'],
    metrics: [
      // Offense
      { key: 'passingYards', label: 'Passing Yards', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'completionPct', label: 'Completion %', unit: '%', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'touchdowns', label: 'Touchdowns', higherIsBetter: true, correlationWeight: 0.25 },
      { key: 'rushingYards', label: 'Rushing Yards', higherIsBetter: true, correlationWeight: 0.18 },
      { key: 'receptions', label: 'Receptions', higherIsBetter: true, correlationWeight: 0.12 },
      { key: 'receivingYards', label: 'Receiving Yards', higherIsBetter: true, correlationWeight: 0.15 },
      // Defense
      { key: 'tackles', label: 'Tackles', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'sacks', label: 'Sacks', higherIsBetter: true, correlationWeight: 0.18 },
      { key: 'interceptions', label: 'Interceptions', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'forcedFumbles', label: 'Forced Fumbles', higherIsBetter: true, correlationWeight: 0.10 },
      // Negative
      { key: 'turnovers', label: 'Turnovers', higherIsBetter: false, correlationWeight: 0.20 },
      { key: 'penalties', label: 'Penalties', higherIsBetter: false, correlationWeight: 0.08 },
    ],
    primaryMetric: 'touchdowns',
    readinessWeights: {
      mood: 0.12,
      confidence: 0.22,      // Critical for performance
      stress: 0.12,
      energy: 0.18,          // High physical demands
      focus: 0.15,           // Complex playbook execution
      motivation: 0.08,
      sleep: 0.10,
      anxiety: 0.03,
    },
    temporalWeights: {
      today: 0.55,           // Game day readiness critical
      yesterday: 0.25,
      week: 0.20,
    },
    expectedCorrelations: {
      touchdowns: { minR: 0.52, optimal: 0.65 },
      completionPct: { minR: 0.45, optimal: 0.58 },
      turnovers: { minR: -0.48, optimal: -0.60 },
    },
  },

  'Soccer': {
    name: 'Soccer',
    category: 'team',
    primaryDemands: ['endurance', 'skill', 'strategy'],
    metrics: [
      { key: 'goals', label: 'Goals', higherIsBetter: true, correlationWeight: 0.35 },
      { key: 'assists', label: 'Assists', higherIsBetter: true, correlationWeight: 0.25 },
      { key: 'shots', label: 'Shots', higherIsBetter: true, correlationWeight: 0.12 },
      { key: 'shotsOnTarget', label: 'Shots on Target', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'passes', label: 'Passes', higherIsBetter: true, correlationWeight: 0.08 },
      { key: 'passAccuracy', label: 'Pass Accuracy', unit: '%', higherIsBetter: true, correlationWeight: 0.10 },
      { key: 'tackles', label: 'Tackles', higherIsBetter: true, correlationWeight: 0.08 },
      { key: 'interceptions', label: 'Interceptions', higherIsBetter: true, correlationWeight: 0.08 },
      { key: 'saves', label: 'Saves (GK)', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'minutesPlayed', label: 'Minutes', higherIsBetter: true, correlationWeight: 0.05 },
      { key: 'fouls', label: 'Fouls', higherIsBetter: false, correlationWeight: 0.08 },
      { key: 'yellowCards', label: 'Yellow Cards', higherIsBetter: false, correlationWeight: 0.10 },
    ],
    primaryMetric: 'goals',
    readinessWeights: {
      mood: 0.12,
      confidence: 0.15,
      stress: 0.10,
      energy: 0.22,          // Endurance critical - 90 minutes
      focus: 0.12,
      motivation: 0.10,
      sleep: 0.15,           // Recovery essential
      fatigue: 0.04,
    },
    temporalWeights: {
      today: 0.45,
      yesterday: 0.30,
      week: 0.25,            // Cumulative fatigue matters
    },
    expectedCorrelations: {
      goals: { minR: 0.48, optimal: 0.62 },
      assists: { minR: 0.42, optimal: 0.56 },
      passAccuracy: { minR: 0.38, optimal: 0.50 },
    },
  },

  'Volleyball': {
    name: 'Volleyball',
    category: 'team',
    primaryDemands: ['power', 'skill', 'strategy'],
    metrics: [
      { key: 'kills', label: 'Kills', higherIsBetter: true, correlationWeight: 0.30 },
      { key: 'attackPct', label: 'Attack %', unit: '%', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'assists', label: 'Assists', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'blocks', label: 'Blocks', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'digs', label: 'Digs', higherIsBetter: true, correlationWeight: 0.12 },
      { key: 'aces', label: 'Aces', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'serviceErrors', label: 'Service Errors', higherIsBetter: false, correlationWeight: 0.10 },
      { key: 'attackErrors', label: 'Attack Errors', higherIsBetter: false, correlationWeight: 0.12 },
      { key: 'receptionPct', label: 'Reception %', unit: '%', higherIsBetter: true, correlationWeight: 0.08 },
    ],
    primaryMetric: 'kills',
    readinessWeights: {
      mood: 0.12,
      confidence: 0.20,      // Mental game crucial
      stress: 0.12,
      energy: 0.15,
      focus: 0.18,           // High precision required
      motivation: 0.08,
      sleep: 0.10,
      anxiety: 0.05,
    },
    temporalWeights: {
      today: 0.50,
      yesterday: 0.30,
      week: 0.20,
    },
    expectedCorrelations: {
      kills: { minR: 0.50, optimal: 0.64 },
      attackPct: { minR: 0.45, optimal: 0.58 },
      aces: { minR: 0.40, optimal: 0.52 },
    },
  },

  'Baseball': {
    name: 'Baseball',
    category: 'team',
    primaryDemands: ['skill', 'precision', 'strategy'],
    metrics: [
      // Batting
      { key: 'hits', label: 'Hits', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'battingAvg', label: 'Batting Avg', unit: 'AVG', higherIsBetter: true, correlationWeight: 0.25 },
      { key: 'homeRuns', label: 'Home Runs', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'rbi', label: 'RBIs', higherIsBetter: true, correlationWeight: 0.18 },
      { key: 'runs', label: 'Runs', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'stolenBases', label: 'Stolen Bases', higherIsBetter: true, correlationWeight: 0.08 },
      { key: 'strikeouts', label: 'Strikeouts (Batting)', higherIsBetter: false, correlationWeight: 0.12 },
      // Pitching
      { key: 'earnedRunAvg', label: 'ERA', higherIsBetter: false, correlationWeight: 0.30 },
      { key: 'strikeoutsPitching', label: 'Strikeouts (Pitching)', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'walks', label: 'Walks', higherIsBetter: false, correlationWeight: 0.10 },
      { key: 'whip', label: 'WHIP', higherIsBetter: false, correlationWeight: 0.18 },
      // Fielding
      { key: 'fieldingPct', label: 'Fielding %', unit: '%', higherIsBetter: true, correlationWeight: 0.10 },
      { key: 'errors', label: 'Errors', higherIsBetter: false, correlationWeight: 0.12 },
    ],
    primaryMetric: 'battingAvg',
    readinessWeights: {
      mood: 0.10,
      confidence: 0.22,      // Mental game critical
      stress: 0.12,
      energy: 0.10,
      focus: 0.25,           // Extreme precision required
      motivation: 0.08,
      sleep: 0.08,
      anxiety: 0.05,         // Pressure situations
    },
    temporalWeights: {
      today: 0.60,           // Game day mental state critical
      yesterday: 0.25,
      week: 0.15,
    },
    expectedCorrelations: {
      battingAvg: { minR: 0.52, optimal: 0.66 },
      homeRuns: { minR: 0.45, optimal: 0.58 },
      strikeouts: { minR: -0.42, optimal: -0.55 },
    },
  },

  'Softball': {
    name: 'Softball',
    category: 'team',
    primaryDemands: ['skill', 'precision', 'strategy'],
    metrics: [
      // Same as baseball with minor adjustments
      { key: 'hits', label: 'Hits', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'battingAvg', label: 'Batting Avg', unit: 'AVG', higherIsBetter: true, correlationWeight: 0.25 },
      { key: 'homeRuns', label: 'Home Runs', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'rbi', label: 'RBIs', higherIsBetter: true, correlationWeight: 0.18 },
      { key: 'runs', label: 'Runs', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'stolenBases', label: 'Stolen Bases', higherIsBetter: true, correlationWeight: 0.10 },
      { key: 'strikeouts', label: 'Strikeouts', higherIsBetter: false, correlationWeight: 0.12 },
      { key: 'earnedRunAvg', label: 'ERA', higherIsBetter: false, correlationWeight: 0.30 },
      { key: 'fieldingPct', label: 'Fielding %', unit: '%', higherIsBetter: true, correlationWeight: 0.10 },
    ],
    primaryMetric: 'battingAvg',
    readinessWeights: {
      mood: 0.10,
      confidence: 0.22,
      stress: 0.12,
      energy: 0.10,
      focus: 0.25,
      motivation: 0.08,
      sleep: 0.08,
      anxiety: 0.05,
    },
    temporalWeights: { today: 0.60, yesterday: 0.25, week: 0.15 },
    expectedCorrelations: {
      battingAvg: { minR: 0.52, optimal: 0.66 },
      homeRuns: { minR: 0.45, optimal: 0.58 },
    },
  },

  'Track': {
    name: 'Track & Field',
    category: 'individual',
    primaryDemands: ['endurance', 'power', 'precision'],
    metrics: [
      { key: 'time', label: 'Time', unit: 'seconds', higherIsBetter: false, correlationWeight: 0.50 },
      { key: 'distance', label: 'Distance', unit: 'meters', higherIsBetter: true, correlationWeight: 0.50 },
      { key: 'height', label: 'Height', unit: 'meters', higherIsBetter: true, correlationWeight: 0.50 },
      { key: 'place', label: 'Place', higherIsBetter: false, correlationWeight: 0.30 },
      { key: 'personalBest', label: 'Personal Best', higherIsBetter: true, correlationWeight: 0.40 },
    ],
    primaryMetric: 'time',
    readinessWeights: {
      mood: 0.10,
      confidence: 0.18,
      stress: 0.10,
      energy: 0.25,          // Endurance critical
      focus: 0.12,
      motivation: 0.10,
      sleep: 0.12,
      fatigue: 0.03,
    },
    temporalWeights: {
      today: 0.40,
      yesterday: 0.30,
      week: 0.30,            // Training load accumulation
    },
    expectedCorrelations: {
      time: { minR: -0.55, optimal: -0.68 }, // Negative - lower time is better
      distance: { minR: 0.52, optimal: 0.65 },
    },
  },

  'Swimming': {
    name: 'Swimming & Diving',
    category: 'individual',
    primaryDemands: ['endurance', 'precision', 'power'],
    metrics: [
      { key: 'time', label: 'Time', unit: 'seconds', higherIsBetter: false, correlationWeight: 0.50 },
      { key: 'splits', label: 'Split Time', unit: 'seconds', higherIsBetter: false, correlationWeight: 0.20 },
      { key: 'stroke', label: 'Stroke', higherIsBetter: true, correlationWeight: 0.10 },
      { key: 'divingScore', label: 'Diving Score', higherIsBetter: true, correlationWeight: 0.40 },
      { key: 'place', label: 'Place', higherIsBetter: false, correlationWeight: 0.25 },
      { key: 'personalBest', label: 'Personal Best', higherIsBetter: true, correlationWeight: 0.35 },
    ],
    primaryMetric: 'time',
    readinessWeights: {
      mood: 0.08,
      confidence: 0.15,
      stress: 0.10,
      energy: 0.25,          // Extreme endurance demands
      focus: 0.18,           // Technique precision
      motivation: 0.08,
      sleep: 0.14,           // Recovery critical
      fatigue: 0.02,
    },
    temporalWeights: {
      today: 0.35,
      yesterday: 0.30,
      week: 0.35,            // Cumulative training fatigue
    },
    expectedCorrelations: {
      time: { minR: -0.58, optimal: -0.70 },
      divingScore: { minR: 0.50, optimal: 0.64 },
    },
  },

  'Tennis': {
    name: 'Tennis',
    category: 'individual',
    primaryDemands: ['endurance', 'skill', 'strategy', 'precision'],
    metrics: [
      { key: 'aces', label: 'Aces', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'doubleFaults', label: 'Double Faults', higherIsBetter: false, correlationWeight: 0.12 },
      { key: 'firstServePct', label: '1st Serve %', unit: '%', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'winnersPerSet', label: 'Winners', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'unforcedErrors', label: 'Unforced Errors', higherIsBetter: false, correlationWeight: 0.18 },
      { key: 'breakPoints', label: 'Break Points Won', unit: '%', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'setsWon', label: 'Sets Won', higherIsBetter: true, correlationWeight: 0.30 },
    ],
    primaryMetric: 'setsWon',
    readinessWeights: {
      mood: 0.12,
      confidence: 0.22,      // Mental toughness critical
      stress: 0.15,
      energy: 0.15,
      focus: 0.18,
      motivation: 0.08,
      sleep: 0.08,
      anxiety: 0.02,
    },
    temporalWeights: { today: 0.55, yesterday: 0.25, week: 0.20 },
    expectedCorrelations: {
      setsWon: { minR: 0.55, optimal: 0.68 },
      unforcedErrors: { minR: -0.50, optimal: -0.64 },
    },
  },

  'Golf': {
    name: 'Golf',
    category: 'individual',
    primaryDemands: ['precision', 'skill', 'strategy'],
    metrics: [
      { key: 'score', label: 'Score', higherIsBetter: false, correlationWeight: 0.40 },
      { key: 'parOrBetter', label: 'Par or Better', unit: '%', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'greensInRegulation', label: 'GIR', unit: '%', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'fairwaysHit', label: 'Fairways Hit', unit: '%', higherIsBetter: true, correlationWeight: 0.12 },
      { key: 'puttsPerRound', label: 'Putts', higherIsBetter: false, correlationWeight: 0.15 },
      { key: 'birdies', label: 'Birdies', higherIsBetter: true, correlationWeight: 0.18 },
      { key: 'bogeys', label: 'Bogeys', higherIsBetter: false, correlationWeight: 0.10 },
    ],
    primaryMetric: 'score',
    readinessWeights: {
      mood: 0.12,
      confidence: 0.25,      // Mental game paramount
      stress: 0.15,
      energy: 0.08,
      focus: 0.22,           // Extreme concentration required
      motivation: 0.08,
      sleep: 0.08,
      anxiety: 0.02,
    },
    temporalWeights: { today: 0.65, yesterday: 0.20, week: 0.15 },
    expectedCorrelations: {
      score: { minR: -0.60, optimal: -0.72 }, // Negative - lower score is better
      parOrBetter: { minR: 0.55, optimal: 0.68 },
    },
  },

  'Lacrosse': {
    name: 'Lacrosse',
    category: 'team',
    primaryDemands: ['endurance', 'skill', 'strategy'],
    metrics: [
      { key: 'goals', label: 'Goals', higherIsBetter: true, correlationWeight: 0.30 },
      { key: 'assists', label: 'Assists', higherIsBetter: true, correlationWeight: 0.22 },
      { key: 'shots', label: 'Shots', higherIsBetter: true, correlationWeight: 0.12 },
      { key: 'shotPct', label: 'Shot %', unit: '%', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'groundBalls', label: 'Ground Balls', higherIsBetter: true, correlationWeight: 0.10 },
      { key: 'turnovers', label: 'Turnovers', higherIsBetter: false, correlationWeight: 0.12 },
      { key: 'saves', label: 'Saves (GK)', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'causedTurnovers', label: 'Caused Turnovers', higherIsBetter: true, correlationWeight: 0.10 },
    ],
    primaryMetric: 'goals',
    readinessWeights: {
      mood: 0.12,
      confidence: 0.18,
      stress: 0.12,
      energy: 0.18,
      focus: 0.15,
      motivation: 0.10,
      sleep: 0.12,
      anxiety: 0.03,
    },
    temporalWeights: { today: 0.50, yesterday: 0.30, week: 0.20 },
    expectedCorrelations: {
      goals: { minR: 0.48, optimal: 0.62 },
      assists: { minR: 0.42, optimal: 0.56 },
    },
  },

  'Wrestling': {
    name: 'Wrestling',
    category: 'individual',
    primaryDemands: ['power', 'endurance', 'strategy'],
    metrics: [
      { key: 'wins', label: 'Wins', higherIsBetter: true, correlationWeight: 0.40 },
      { key: 'takedowns', label: 'Takedowns', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'escapes', label: 'Escapes', higherIsBetter: true, correlationWeight: 0.12 },
      { key: 'reversals', label: 'Reversals', higherIsBetter: true, correlationWeight: 0.12 },
      { key: 'nearFalls', label: 'Near Falls', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'pins', label: 'Pins', higherIsBetter: true, correlationWeight: 0.30 },
      { key: 'technicalFalls', label: 'Technical Falls', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'ridingTime', label: 'Riding Time', unit: 'seconds', higherIsBetter: true, correlationWeight: 0.10 },
    ],
    primaryMetric: 'wins',
    readinessWeights: {
      mood: 0.10,
      confidence: 0.20,
      stress: 0.12,
      energy: 0.22,          // Extreme physical demands
      focus: 0.15,
      motivation: 0.10,
      sleep: 0.08,
      anxiety: 0.03,
    },
    temporalWeights: { today: 0.55, yesterday: 0.25, week: 0.20 },
    expectedCorrelations: {
      wins: { minR: 0.52, optimal: 0.66 },
      pins: { minR: 0.48, optimal: 0.60 },
    },
  },

  'IceHockey': {
    name: 'Ice Hockey',
    category: 'team',
    primaryDemands: ['endurance', 'power', 'skill', 'strategy'],
    metrics: [
      { key: 'goals', label: 'Goals', higherIsBetter: true, correlationWeight: 0.30 },
      { key: 'assists', label: 'Assists', higherIsBetter: true, correlationWeight: 0.22 },
      { key: 'shots', label: 'Shots', higherIsBetter: true, correlationWeight: 0.12 },
      { key: 'shotPct', label: 'Shot %', unit: '%', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'plusMinus', label: '+/-', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'hits', label: 'Hits', higherIsBetter: true, correlationWeight: 0.08 },
      { key: 'blockedShots', label: 'Blocked Shots', higherIsBetter: true, correlationWeight: 0.08 },
      { key: 'saves', label: 'Saves (GK)', higherIsBetter: true, correlationWeight: 0.25 },
      { key: 'savePct', label: 'Save %', unit: '%', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'penalties', label: 'Penalties', unit: 'minutes', higherIsBetter: false, correlationWeight: 0.10 },
    ],
    primaryMetric: 'goals',
    readinessWeights: {
      mood: 0.12,
      confidence: 0.18,
      stress: 0.12,
      energy: 0.20,
      focus: 0.15,
      motivation: 0.10,
      sleep: 0.10,
      anxiety: 0.03,
    },
    temporalWeights: { today: 0.50, yesterday: 0.30, week: 0.20 },
    expectedCorrelations: {
      goals: { minR: 0.50, optimal: 0.64 },
      assists: { minR: 0.45, optimal: 0.58 },
    },
  },

  'Gymnastics': {
    name: 'Gymnastics',
    category: 'individual',
    primaryDemands: ['precision', 'power', 'skill'],
    metrics: [
      { key: 'vaultScore', label: 'Vault Score', higherIsBetter: true, correlationWeight: 0.25 },
      { key: 'barsScore', label: 'Bars Score', higherIsBetter: true, correlationWeight: 0.25 },
      { key: 'beamScore', label: 'Beam Score', higherIsBetter: true, correlationWeight: 0.25 },
      { key: 'floorScore', label: 'Floor Score', higherIsBetter: true, correlationWeight: 0.25 },
      { key: 'allAroundScore', label: 'All-Around Score', higherIsBetter: true, correlationWeight: 0.40 },
      { key: 'executionScore', label: 'Execution Score', higherIsBetter: true, correlationWeight: 0.30 },
      { key: 'difficultyScore', label: 'Difficulty Score', higherIsBetter: true, correlationWeight: 0.20 },
      { key: 'deductions', label: 'Deductions', higherIsBetter: false, correlationWeight: 0.25 },
    ],
    primaryMetric: 'allAroundScore',
    readinessWeights: {
      mood: 0.10,
      confidence: 0.25,      // Mental game critical for precision
      stress: 0.12,
      energy: 0.12,
      focus: 0.25,           // Extreme precision required
      motivation: 0.08,
      sleep: 0.06,
      anxiety: 0.02,
    },
    temporalWeights: { today: 0.65, yesterday: 0.20, week: 0.15 },
    expectedCorrelations: {
      allAroundScore: { minR: 0.58, optimal: 0.72 },
      executionScore: { minR: 0.55, optimal: 0.68 },
    },
  },

  'Rowing': {
    name: 'Rowing',
    category: 'team',
    primaryDemands: ['endurance', 'power', 'strategy'],
    metrics: [
      { key: 'time', label: 'Time', unit: 'seconds', higherIsBetter: false, correlationWeight: 0.50 },
      { key: 'strokeRate', label: 'Stroke Rate', unit: 'spm', higherIsBetter: true, correlationWeight: 0.15 },
      { key: 'split', label: 'Split Time', unit: '/500m', higherIsBetter: false, correlationWeight: 0.25 },
      { key: 'place', label: 'Place', higherIsBetter: false, correlationWeight: 0.30 },
      { key: 'watts', label: 'Watts', higherIsBetter: true, correlationWeight: 0.20 },
      { key: '2kErg', label: '2k Erg Time', unit: 'seconds', higherIsBetter: false, correlationWeight: 0.35 },
    ],
    primaryMetric: 'time',
    readinessWeights: {
      mood: 0.08,
      confidence: 0.15,
      stress: 0.10,
      energy: 0.28,          // Extreme endurance + power
      focus: 0.15,
      motivation: 0.10,
      sleep: 0.12,
      fatigue: 0.02,
    },
    temporalWeights: {
      today: 0.35,
      yesterday: 0.30,
      week: 0.35,            // Training load critical
    },
    expectedCorrelations: {
      time: { minR: -0.60, optimal: -0.72 },
      watts: { minR: 0.55, optimal: 0.68 },
    },
  },
};

/**
 * Get sport configuration by name (case-insensitive)
 */
export function getSportConfig(sportName: string): SportConfig | null {
  const normalized = sportName.trim();

  // Direct match
  if (SPORT_CONFIGS[normalized]) {
    return SPORT_CONFIGS[normalized];
  }

  // Case-insensitive search
  const match = Object.entries(SPORT_CONFIGS).find(
    ([key]) => key.toLowerCase() === normalized.toLowerCase()
  );

  return match ? match[1] : null;
}

/**
 * Get all supported sport names
 */
export function getSupportedSports(): string[] {
  return Object.keys(SPORT_CONFIGS).sort();
}

/**
 * Get sports by category
 */
export function getSportsByCategory(category: 'team' | 'individual' | 'hybrid'): string[] {
  return Object.entries(SPORT_CONFIGS)
    .filter(([_, config]) => config.category === category)
    .map(([name]) => name)
    .sort();
}
