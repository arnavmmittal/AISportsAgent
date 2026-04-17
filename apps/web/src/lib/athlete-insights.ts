/**
 * Athlete Insights Service
 *
 * Generates sport psychology-forward insights: mental readiness patterns,
 * coach connection status, growth metrics, and context-aware conversation
 * starters for the wellness center and chat tab.
 */

interface MoodLogInput {
  id: string;
  mood: number;
  confidence: number | null;
  stress: number;
  energy: number | null;
  sleep: number | null;
  contextTags: string[];
  createdAt: Date;
  notes: string | null;
}

interface InsightsInput {
  moodLogs: MoodLogInput[];
  coachInteractions: { date: Date }[];
  goals: { status: string }[];
  upcomingGame: { opponent: string; date: Date } | null;
  checkInStreak: number;
}

interface ConversationStarter {
  type: 'checkin' | 'trend' | 'game' | 'toolkit' | 'general';
  text: string;
  prompt: string;
}

interface AthleteInsights {
  mentalPattern: { text: string; type: 'pattern' | 'observation' | 'fallback' };
  coachConnection: { lastInteractionDaysAgo: number | null; text: string };
  growthMetric: { score: number; delta: number; text: string; label: string };
  conversationStarters: ConversationStarter[];
  weeklyInsight: string;
}

export type { MoodLogInput, InsightsInput, ConversationStarter, AthleteInsights };

export async function generateAthleteInsights(input: InsightsInput): Promise<AthleteInsights> {
  const { moodLogs, coachInteractions, goals, upcomingGame, checkInStreak } = input;

  // Mental Readiness Pattern
  const mentalPattern = detectMentalPattern(moodLogs);

  // Coach Connection
  const lastInteraction = coachInteractions.length > 0
    ? coachInteractions.sort((a, b) => b.date.getTime() - a.date.getTime())[0]
    : null;
  const lastInteractionDaysAgo = lastInteraction
    ? Math.floor((Date.now() - lastInteraction.date.getTime()) / 86400000)
    : null;
  const coachConnection = {
    lastInteractionDaysAgo,
    text: lastInteractionDaysAgo === null
      ? 'No coach interactions yet'
      : lastInteractionDaysAgo === 0
        ? 'Coach checked in today'
        : lastInteractionDaysAgo === 1
          ? 'Coach checked in yesterday'
          : `Last coach interaction: ${lastInteractionDaysAgo} days ago`,
  };

  // Growth Metric (Self-Awareness Score)
  const growthMetric = calculateGrowthMetric(moodLogs, checkInStreak, goals);

  // Conversation Starters
  const conversationStarters = generateConversationStarters(moodLogs, upcomingGame);

  // Weekly Insight
  const weeklyInsight = generateWeeklyInsight(moodLogs);

  return { mentalPattern, coachConnection, growthMetric, conversationStarters, weeklyInsight };
}

function detectMentalPattern(logs: MoodLogInput[]): AthleteInsights['mentalPattern'] {
  if (logs.length < 5) {
    return { text: 'Complete more check-ins to reveal your mental readiness patterns.', type: 'fallback' };
  }

  // Check confidence trend (recent 3 vs older)
  const recentConf = logs.slice(0, 3).filter(l => l.confidence != null);
  const olderConf = logs.slice(3).filter(l => l.confidence != null);
  if (recentConf.length >= 2 && olderConf.length >= 2) {
    const recentAvg = recentConf.reduce((s, l) => s + (l.confidence || 0), 0) / recentConf.length;
    const olderAvg = olderConf.reduce((s, l) => s + (l.confidence || 0), 0) / olderConf.length;
    if (recentAvg - olderAvg > 1) {
      return { text: 'Your confidence is building — up significantly from earlier this week.', type: 'pattern' };
    }
    if (olderAvg - recentAvg > 1) {
      return { text: 'Your confidence has dipped recently. Negative self-talk patterns may be a factor.', type: 'pattern' };
    }
  }

  // Check stress volatility (coefficient of variation)
  const stressValues = logs.slice(0, 7).map(l => l.stress);
  if (stressValues.length >= 5) {
    const avg = stressValues.reduce((a, b) => a + b, 0) / stressValues.length;
    const variance = stressValues.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / stressValues.length;
    const cv = Math.sqrt(variance) / (avg || 1);
    if (cv < 0.2 && avg <= 5) {
      return { text: 'Your stress levels are stable and manageable — strong emotional regulation.', type: 'pattern' };
    }
    if (cv > 0.5) {
      return { text: 'Your stress has been volatile this week. Building a consistent routine may help stabilize.', type: 'pattern' };
    }
  }

  // Check pre-game patterns from contextTags
  const preGameLogs = logs.filter(l => l.contextTags.includes('Pre-Game'));
  if (preGameLogs.length >= 2) {
    const preGameStress = preGameLogs.reduce((s, l) => s + l.stress, 0) / preGameLogs.length;
    const normalLogs = logs.filter(l => !l.contextTags.includes('Pre-Game'));
    const normalStress = normalLogs.length > 0
      ? normalLogs.reduce((s, l) => s + l.stress, 0) / normalLogs.length
      : 5;
    if (preGameStress > normalStress + 2) {
      return { text: 'Pre-game anxiety is a pattern for you — your stress spikes before competitions.', type: 'pattern' };
    }
  }

  // Default mood-level observation
  const avgMood = logs.slice(0, 7).reduce((s, l) => s + l.mood, 0) / Math.min(logs.length, 7);
  return {
    text: avgMood >= 7
      ? 'Your mental state has been consistently positive this week.'
      : avgMood >= 5
        ? 'Your mood has been in the moderate range — room to optimize your mental game.'
        : 'You\'ve been going through a tough stretch. Your wellbeing comes first.',
    type: 'observation',
  };
}

function calculateGrowthMetric(
  logs: MoodLogInput[],
  streak: number,
  goals: { status: string }[],
): AthleteInsights['growthMetric'] {
  if (logs.length === 0) {
    return { score: 0, delta: 0, text: 'Start checking in daily to build your self-awareness score.', label: 'Self-Awareness' };
  }

  // 40% check-in consistency (streak / 14 days)
  const streakScore = Math.min(streak / 14, 1) * 100;

  // 30% detail quality: notes + context tags + detailed fields
  const detailScore = (() => {
    const recent = logs.slice(0, 7);
    const withNotes = recent.filter(l => l.notes && l.notes.trim().length > 10).length;
    const withTags = recent.filter(l => l.contextTags.length > 0).length;
    const withDetails = recent.filter(l => l.energy != null || l.sleep != null).length;
    return ((withNotes + withTags + withDetails) / (recent.length * 3)) * 100;
  })();

  // 30% goal engagement (completed / total)
  const goalScore = (() => {
    const completed = goals.filter(g => g.status === 'COMPLETED').length;
    const total = goals.length;
    if (total === 0) return 50; // neutral if no goals
    return (completed / total) * 100;
  })();

  const score = Math.round(streakScore * 0.4 + detailScore * 0.3 + goalScore * 0.3);

  // Delta: compare this week's detail level vs last week
  const recentDetail = logs.slice(0, 7).filter(l => l.notes || l.contextTags.length > 0).length;
  const olderDetail = logs.slice(7, 14).filter(l => l.notes || l.contextTags.length > 0).length;
  const delta = logs.length >= 8 ? recentDetail - olderDetail : 0;

  const text = score >= 75
    ? `Self-awareness score: ${score}% — you're building strong mental habits.`
    : score >= 40
      ? `Self-awareness score: ${score}% — more detailed check-ins will deepen your insights.`
      : `Self-awareness score: ${score}% — consistency is key. Try checking in daily.`;

  return { score, delta, text, label: 'Self-Awareness' };
}

function generateConversationStarters(
  logs: MoodLogInput[],
  upcomingGame: { opponent: string; date: Date } | null,
): ConversationStarter[] {
  const starters: ConversationStarter[] = [];
  const today = logs.find(l => l.createdAt.toDateString() === new Date().toDateString());

  // From today's check-in: stress >= 7 or mood <= 4
  if (today) {
    if (today.stress >= 7) {
      starters.push({
        type: 'checkin',
        text: `Your stress is at ${today.stress} today — want to talk through what's going on?`,
        prompt: "I'm feeling really stressed today and could use some help managing it.",
      });
    } else if (today.mood <= 4) {
      starters.push({
        type: 'checkin',
        text: 'Looks like a tough day. Want to work through it?',
        prompt: "I'm not feeling great today and want to talk about it.",
      });
    }
  }

  // From game schedule: upcoming game within 2 days
  if (upcomingGame) {
    const daysUntil = Math.ceil((upcomingGame.date.getTime() - Date.now()) / 86400000);
    if (daysUntil <= 2) {
      starters.push({
        type: 'game',
        text: `Game vs ${upcomingGame.opponent} ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`} — ready to prep?`,
        prompt: `I have a game against ${upcomingGame.opponent} coming up and want to mentally prepare.`,
      });
    }
  }

  // From trends: confidence low 3+ days
  if (logs.length >= 3) {
    const recentConf = logs.slice(0, 3).filter(l => l.confidence != null);
    if (recentConf.length >= 3 && recentConf.every(l => (l.confidence || 5) <= 4)) {
      starters.push({
        type: 'trend',
        text: "Your confidence has been low for a few days. Let's work on that.",
        prompt: "My confidence has been low lately. Can you help me build it back up?",
      });
    }
  }

  // Fallback: 4 general sport psych starters
  if (starters.length === 0) {
    starters.push(
      { type: 'general', text: 'Pre-game mental preparation', prompt: 'Help me prepare mentally for my next competition.' },
      { type: 'general', text: 'Build mental toughness', prompt: 'I want to develop more mental toughness and resilience.' },
      { type: 'general', text: 'Manage performance anxiety', prompt: 'I struggle with anxiety before big moments. Can you help?' },
      { type: 'general', text: 'Find your flow state', prompt: 'How can I get into the zone more consistently?' },
    );
  }

  return starters.slice(0, 4);
}

function generateWeeklyInsight(logs: MoodLogInput[]): string {
  if (logs.length < 2) return 'Keep checking in — your patterns will emerge soon.';

  const weekLogs = logs.slice(0, 7);
  const stressValues = weekLogs.map(l => l.stress);
  const moodValues = weekLogs.map(l => l.mood);

  // Resilience: bounced back from high stress
  const highStressDays = stressValues.filter(s => s >= 7).length;
  const recentStress = stressValues[0] || 5;
  if (highStressDays >= 2 && recentStress <= 4) {
    return 'You bounced back from elevated stress this week — resilience improving.';
  }

  // Consistency: mood range <= 2 and mood >= 6
  const moodRange = Math.max(...moodValues) - Math.min(...moodValues);
  if (moodRange <= 2 && moodValues[0] >= 6) {
    return 'Steady mood all week — mental consistency is one of your strengths.';
  }

  // Trend: improving or declining
  if (weekLogs.length >= 4) {
    const firstHalf = moodValues.slice(Math.ceil(moodValues.length / 2));
    const secondHalf = moodValues.slice(0, Math.ceil(moodValues.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (secondAvg - firstAvg > 1) return 'Your mood has been trending up this week — keep the momentum.';
    if (firstAvg - secondAvg > 1) return 'Your mood dipped this week. Be extra intentional about recovery.';
  }

  return 'Your patterns are building. Consistent check-ins unlock deeper insights.';
}
