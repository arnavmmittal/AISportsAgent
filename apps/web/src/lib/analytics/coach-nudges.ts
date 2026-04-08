import { prisma } from '@/lib/prisma';

export interface Nudge {
  type: 'engagement' | 'readiness' | 'crisis' | 'trend';
  priority: 'low' | 'medium' | 'high';
  message: string;
  athleteNames?: string[];
}

/**
 * Generate AI nudges for a coach's dashboard.
 * These are actionable insights computed from real team data.
 */
export async function generateCoachNudges(coachId: string): Promise<Nudge[]> {
  const nudges: Nudge[] = [];
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    // Get coach's athletes
    const relations = await prisma.coachAthleteRelation.findMany({
      where: { coachId },
      include: {
        Athlete: {
          include: {
            User: { select: { name: true } },
            MoodLog: { orderBy: { createdAt: 'desc' }, take: 14 },
          },
        },
      },
    });

    const athletes = relations.map((r) => r.Athlete);

    // 1. Athletes who haven't checked in for 5+ days
    const inactive = athletes.filter((a) => {
      const lastLog = a.MoodLog[0];
      return !lastLog || lastLog.createdAt < fiveDaysAgo;
    });
    if (inactive.length > 0) {
      nudges.push({
        type: 'engagement',
        priority: inactive.length > 3 ? 'high' : 'medium',
        message: `${inactive.length} athlete${inactive.length > 1 ? "s haven't" : " hasn't"} checked in for 5+ days`,
        athleteNames: inactive.map((a) => a.User.name || 'Unknown'),
      });
    }

    // 2. Athletes with declining mood (last 3 days avg < prior 4 days avg)
    const declining: string[] = [];
    for (const athlete of athletes) {
      if (athlete.MoodLog.length < 5) continue;
      const recent3 = athlete.MoodLog.slice(0, 3);
      const prior4 = athlete.MoodLog.slice(3, 7);
      if (prior4.length === 0) continue;
      const recentAvg = recent3.reduce((s, l) => s + l.mood, 0) / recent3.length;
      const priorAvg = prior4.reduce((s, l) => s + l.mood, 0) / prior4.length;
      if (recentAvg < priorAvg - 1.5) {
        declining.push(athlete.User.name || 'Unknown');
      }
    }
    if (declining.length > 0) {
      nudges.push({
        type: 'readiness',
        priority: 'high',
        message: `${declining.length} athlete${declining.length > 1 ? 's show' : ' shows'} declining mood trends this week`,
        athleteNames: declining,
      });
    }

    // 3. Unacknowledged crisis alerts
    const unresolvedAlerts = await prisma.crisisAlert.count({
      where: {
        Athlete: { CoachAthlete: { some: { coachId } } },
        reviewed: false,
      },
    });
    if (unresolvedAlerts > 0) {
      nudges.push({
        type: 'crisis',
        priority: 'high',
        message: `${unresolvedAlerts} unresolved crisis alert${unresolvedAlerts > 1 ? 's' : ''} need attention`,
      });
    }

    // 4. Low team check-in rate (< 50% checked in yesterday)
    const totalAthletes = athletes.length;
    if (totalAthletes > 0) {
      const checkedInYesterday = athletes.filter((a) => {
        const lastLog = a.MoodLog[0];
        return lastLog && lastLog.createdAt > oneDayAgo;
      }).length;
      const rate = Math.round((checkedInYesterday / totalAthletes) * 100);
      if (rate < 50) {
        nudges.push({
          type: 'engagement',
          priority: 'medium',
          message: `Only ${rate}% of athletes checked in yesterday (${checkedInYesterday}/${totalAthletes})`,
        });
      }
    }
  } catch (error) {
    console.error('[NUDGES] Failed to generate nudges:', error);
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return nudges.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
