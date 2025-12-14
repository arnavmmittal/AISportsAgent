/**
 * Coach Dashboard API
 * Returns aggregated team metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCoach } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireCoach(request);

    if (!authorized || !user) {
      return response;
    }

    // Return mock data for demo coach
    if (user.id.startsWith('demo-')) {
      const mockData = {
        overview: {
          totalAthletes: 24,
          athletesWithConsent: 18,
          athletesWithoutConsent: 6,
          atRiskCount: 3,
          crisisAlertsCount: 1,
          timeRange: 7,
        },
        teamMood: {
          avgMood: 7.2,
          avgConfidence: 7.8,
          avgStress: 4.3,
          totalLogs: 156,
        },
        moodTrend: [
          {
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            avgMood: 7.1,
            avgConfidence: 7.5,
            avgStress: 4.5,
            count: 18,
          },
          {
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            avgMood: 6.8,
            avgConfidence: 7.3,
            avgStress: 5.2,
            count: 20,
          },
          {
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            avgMood: 7.4,
            avgConfidence: 7.9,
            avgStress: 3.8,
            count: 22,
          },
          {
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            avgMood: 7.6,
            avgConfidence: 8.1,
            avgStress: 4.0,
            count: 21,
          },
          {
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            avgMood: 7.3,
            avgConfidence: 7.7,
            avgStress: 4.4,
            count: 19,
          },
          {
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            avgMood: 7.5,
            avgConfidence: 8.0,
            avgStress: 4.1,
            count: 23,
          },
          {
            date: new Date().toISOString(),
            avgMood: 7.2,
            avgConfidence: 7.8,
            avgStress: 4.3,
            count: 18,
          },
        ],
        crisisAlerts: [
          {
            id: 'alert-1',
            athleteId: 'athlete-5',
            athlete: {
              id: 'athlete-5',
              name: 'Taylor Martinez',
              sport: 'Track',
              year: 'Sophomore',
            },
            alertType: 'HIGH_STRESS',
            severity: 'high',
            message: 'Detected language indicating high stress and burnout',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            resolved: false,
          },
          {
            id: 'alert-2',
            athleteId: 'athlete-8',
            athlete: {
              id: 'athlete-8',
              name: 'Jordan Kim',
              sport: 'Soccer',
              year: 'Junior',
            },
            alertType: 'DECLINING_MOOD',
            severity: 'medium',
            message: 'Mood scores declining for 5 consecutive days',
            createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            detectedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            resolved: false,
          },
        ],
        atRiskAthletes: [
          {
            id: 'athlete-1',
            name: 'Mike Chen',
            sport: 'Basketball',
            year: 'Sophomore',
            recentMood: {
              mood: 5,
              confidence: 4,
              stress: 8,
            },
          },
          {
            id: 'athlete-2',
            name: 'Emily Rodriguez',
            sport: 'Soccer',
            year: 'Junior',
            recentMood: {
              mood: 6,
              confidence: 5,
              stress: 7,
            },
          },
          {
            id: 'athlete-3',
            name: 'Jordan Smith',
            sport: 'Track',
            year: 'Freshman',
            recentMood: {
              mood: 4,
              confidence: 3,
              stress: 9,
            },
          },
        ],
        athleteReadiness: [
          {
            athlete: {
              id: 'athlete-10',
              name: 'Sarah Johnson',
              sport: 'Basketball',
              teamPosition: 'Point Guard',
            },
            mood: 9,
            confidence: 9,
            stress: 2,
            readiness: 95,
            status: 'excellent' as const,
          },
          {
            athlete: {
              id: 'athlete-11',
              name: 'Marcus Williams',
              sport: 'Basketball',
              teamPosition: 'Center',
            },
            mood: 8,
            confidence: 8,
            stress: 3,
            readiness: 88,
            status: 'excellent' as const,
          },
          {
            athlete: {
              id: 'athlete-12',
              name: 'Alex Turner',
              sport: 'Soccer',
              teamPosition: 'Midfielder',
            },
            mood: 7,
            confidence: 7,
            stress: 4,
            readiness: 78,
            status: 'good' as const,
          },
          {
            athlete: {
              id: 'athlete-13',
              name: 'Jamie Lee',
              sport: 'Volleyball',
              teamPosition: 'Setter',
            },
            mood: 6,
            confidence: 6,
            stress: 5,
            readiness: 68,
            status: 'fair' as const,
          },
          {
            athlete: {
              id: 'athlete-1',
              name: 'Mike Chen',
              sport: 'Basketball',
              teamPosition: 'Forward',
            },
            mood: 5,
            confidence: 4,
            stress: 8,
            readiness: 52,
            status: 'at-risk' as const,
          },
        ],
      };

      return NextResponse.json({ data: mockData });
    }

    // For non-demo users, return error (database not fully implemented)
    return NextResponse.json(
      { error: 'Dashboard data not available' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Coach dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
