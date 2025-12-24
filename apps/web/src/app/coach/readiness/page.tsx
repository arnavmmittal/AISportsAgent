import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Activity,
  Moon,
  MessageSquare
} from 'lucide-react';

// Readiness score calculation algorithm
function calculateReadinessScore(athlete: any) {
  const recentMoods = athlete.moodLogs;

  if (recentMoods.length === 0) {
    return {
      score: 0,
      level: 'RED' as const,
      factors: [],
      trend: 'stable' as const,
    };
  }

  // Calculate 7-day averages
  const moodAvg7d = recentMoods.reduce((sum: number, log: any) => sum + log.mood, 0) / recentMoods.length;
  const stressAvg7d = recentMoods.reduce((sum: number, log: any) => sum + log.stress, 0) / recentMoods.length;
  const confidenceAvg7d = recentMoods.reduce((sum: number, log: any) => sum + log.confidence, 0) / recentMoods.length;

  // Get 3-day sleep average
  const recent3Days = recentMoods.slice(0, 3);
  const sleepAvg3d = recent3Days.filter((log: any) => log.sleep).length > 0
    ? recent3Days.reduce((sum: number, log: any) => sum + (log.sleep || 0), 0) / recent3Days.filter((log: any) => log.sleep).length
    : 7;

  // Normalize features to 0-1 scale
  const moodNorm = (moodAvg7d - 1) / 9; // 1-10 scale to 0-1
  const stressNorm = 1 - ((stressAvg7d - 1) / 9); // Inverse for stress
  const confidenceNorm = (confidenceAvg7d - 1) / 9;
  const sleepNorm = Math.min((sleepAvg3d - 4) / 6, 1); // 4-10 hours normalized

  // Engagement boost (has recent sessions)
  const engagementBoost = athlete.sessions.length > 0 ? 0.1 : 0;

  // Weighted composite score (0-100)
  const score = Math.round(
    (0.30 * moodNorm +
     0.25 * stressNorm +
     0.20 * confidenceNorm +
     0.15 * sleepNorm +
     0.10 * engagementBoost) * 100
  );

  // Traffic light level
  let level: 'GREEN' | 'YELLOW' | 'RED' = 'LOW';
  if (score >= 75) level = 'GREEN';
  else if (score >= 55) level = 'YELLOW';
  else level = 'RED';

  // Calculate trend
  const midpoint = Math.floor(recentMoods.length / 2);
  const recentAvg = recentMoods.slice(0, midpoint).reduce((sum: number, log: any) => sum + log.mood, 0) / Math.max(midpoint, 1);
  const olderAvg = recentMoods.slice(midpoint).reduce((sum: number, log: any) => sum + log.mood, 0) / Math.max(recentMoods.length - midpoint, 1);
  const trend = recentAvg > olderAvg + 0.5 ? 'improving' : recentAvg < olderAvg - 0.5 ? 'declining' : 'stable';

  // Contributing factors
  const factors = [
    {
      factor: 'mood',
      label: 'Mood Level',
      value: moodAvg7d,
      impact: moodNorm * 30,
    },
    {
      factor: 'stress',
      label: 'Stress Management',
      value: 10 - stressAvg7d, // Show as positive
      impact: stressNorm * 25,
    },
    {
      factor: 'confidence',
      label: 'Confidence',
      value: confidenceAvg7d,
      impact: confidenceNorm * 20,
    },
    {
      factor: 'sleep',
      label: 'Sleep Quality',
      value: sleepAvg3d,
      impact: sleepNorm * 15,
    },
  ];

  // Sort factors by impact
  factors.sort((a, b) => b.impact - a.impact);

  return {
    score,
    level,
    factors: factors.slice(0, 3), // Top 3
    trend,
  };
}

export default async function CoachReadinessPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin?callbackUrl=/coach/readiness');
  }

  if (session.user?.role !== 'COACH' && session.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Skip database for demo coach
  let athletes: any[] = [];
  let coach: any = {
    School: { name: 'Demo University' },
    schoolId: 'demo-school-123',
  };

  if (!session.user.id.startsWith('demo-')) {
    try {
      // Get coach's school
      const dbCoach = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { School: true },
      });

      if (!dbCoach) {
        return <div>Coach not found</div>;
      }

      coach = dbCoach;

      // Get all athletes with recent data
      athletes = await prisma.user.findMany({
        where: {
          role: 'ATHLETE',
          schoolId: coach.schoolId,
        },
        include: {
          Athlete: {
            include: {
              MoodLog: {
                orderBy: { createdAt: 'desc' },
                take: 7, // Last 7 days
              },
              ChatSession: {
                where: {
                  createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                  },
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching athletes:', error);
      athletes = [];
    }
  } else {
    // Mock data for demo coach
    athletes = [
      {
        id: 'athlete-1',
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        Athlete: {
          sport: 'Basketball',
          year: 'Junior',
          teamPosition: 'Point Guard',
          moodLogs: [
            { mood: 9, confidence: 9, stress: 2, energy: 9, sleep: 8, createdAt: new Date() },
            { mood: 8, confidence: 9, stress: 3, energy: 8, sleep: 8, createdAt: new Date(Date.now() - 86400000) },
            { mood: 9, confidence: 9, stress: 2, energy: 9, sleep: 8, createdAt: new Date(Date.now() - 172800000) },
          ],
          sessions: [{ id: 's1', createdAt: new Date() }],
        },
      },
      {
        id: 'athlete-2',
        name: 'Mike Chen',
        email: 'mike.c@example.com',
        Athlete: {
          sport: 'Basketball',
          year: 'Sophomore',
          teamPosition: 'Shooting Guard',
          moodLogs: [
            { mood: 5, confidence: 6, stress: 7, energy: 5, sleep: 6, createdAt: new Date() },
            { mood: 5, confidence: 5, stress: 8, energy: 4, sleep: 5, createdAt: new Date(Date.now() - 86400000) },
          ],
          sessions: [],
        },
      },
    ];
  }

  // Calculate readiness scores for all athletes
  const athleteReadiness = athletes.map((athlete) => {
    // Pass the athlete data with correct structure
    const athleteData = {
      moodLogs: athlete.Athlete?.moodLogs || [],
      sessions: athlete.Athlete?.sessions || [],
    };
    const readiness = calculateReadinessScore(athleteData);
    return {
      id: athlete.id,
      name: athlete.name,
      position: athlete.Athlete?.teamPosition,
      ...readiness,
    };
  });

  // Sort by score (worst first)
  const sortedAthletes = athleteReadiness.sort((a, b) => a.score - b.score);

  // Count by level
  const greenCount = sortedAthletes.filter((a) => a.level === 'GREEN').length;
  const yellowCount = sortedAthletes.filter((a) => a.level === 'YELLOW').length;
  const redCount = sortedAthletes.filter((a) => a.level === 'RED').length;

  // Get at-risk athletes
  const atRiskAthletes = sortedAthletes.filter((a) => a.level === 'RED');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass-strong shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Pre-Competition Readiness
              </h1>
              <p className="mt-2 text-muted-foreground">
                Mental readiness scores for {coach.School.name} athletes
              </p>
            </div>
            <Link href="/coach/dashboard">
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground glass-strong border border-border rounded-lg hover:bg-background">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Team Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-green-500 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ready to Compete</p>
                  <p className="text-3xl font-bold text-green-700">{greenCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {athletes.length > 0 ? ((greenCount / athletes.length) * 100).toFixed(0) : 0}% of team
                  </p>
                </div>
                <CheckCircle className="size-8 text-green-600" />
              </div>
              <div className="mt-3 w-full bg-green-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-600"
                  style={{ width: `${athletes.length > 0 ? (greenCount / athletes.length) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-yellow-500 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monitor Closely</p>
                  <p className="text-3xl font-bold text-yellow-700">{yellowCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {athletes.length > 0 ? ((yellowCount / athletes.length) * 100).toFixed(0) : 0}% of team
                  </p>
                </div>
                <TrendingUp className="size-8 text-yellow-600" />
              </div>
              <div className="mt-3 w-full bg-yellow-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-yellow-600"
                  style={{ width: `${athletes.length > 0 ? (yellowCount / athletes.length) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Intervention Needed</p>
                  <p className="text-3xl font-bold text-red-700">{redCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {athletes.length > 0 ? ((redCount / athletes.length) * 100).toFixed(0) : 0}% of team
                  </p>
                </div>
                <AlertTriangle className="size-8 text-red-600" />
              </div>
              <div className="mt-3 w-full bg-red-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-red-600"
                  style={{ width: `${athletes.length > 0 ? (redCount / athletes.length) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* At-Risk Athletes Alert */}
        {atRiskAthletes.length > 0 && (
          <Card className="border-l-4 border-red-500 bg-red-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                <AlertTriangle className="size-5" />
                {atRiskAthletes.length} Athlete{atRiskAthletes.length > 1 ? 's' : ''} Need Immediate Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {atRiskAthletes.map((athlete) => (
                  <div key={athlete.id} className="p-4 glass-strong border-2 border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-foreground">{athlete.name}</h3>
                          {athlete.position && (
                            <span className="text-sm text-muted-foreground">{athlete.position}</span>
                          )}
                          <Badge className="bg-red-600 text-white">
                            {athlete.score}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Top factors: {athlete.factors.map((f) => f.label).join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        {athlete.trend === 'declining' && (
                          <div className="flex items-center gap-1 text-red-600 text-sm">
                            <TrendingDown className="size-4" />
                            <span>Declining</span>
                          </div>
                        )}
                        {athlete.trend === 'stable' && (
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Minus className="size-4" />
                            <span>Stable</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 glass-strong border border-red-200 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Recommended Action:</strong> Schedule 1-on-1 conversations with these athletes before game day. Focus on stress management and sleep optimization.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Full Team Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Team Readiness Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b-2 border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Athlete
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Position
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                      Score
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                      Level
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                      Trend
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Top Factors
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedAthletes.map((athlete) => (
                    <tr
                      key={athlete.id}
                      className={`hover:bg-background transition-colors ${
                        athlete.level === 'RED' ? 'bg-red-50' :
                        athlete.level === 'YELLOW' ? 'bg-yellow-50' :
                        'bg-green-50'
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">{athlete.name}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {athlete.position || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-2xl font-bold ${
                          athlete.level === 'GREEN' ? 'text-green-600' :
                          athlete.level === 'YELLOW' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {athlete.score}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge className={
                          athlete.level === 'GREEN' ? 'bg-green-500 text-white' :
                          athlete.level === 'YELLOW' ? 'bg-yellow-500 text-white' :
                          'bg-red-500 text-white'
                        }>
                          {athlete.level}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {athlete.trend === 'improving' && (
                            <>
                              <TrendingUp className="size-4 text-green-600" />
                              <span className="text-xs text-green-600">Improving</span>
                            </>
                          )}
                          {athlete.trend === 'declining' && (
                            <>
                              <TrendingDown className="size-4 text-red-600" />
                              <span className="text-xs text-red-600">Declining</span>
                            </>
                          )}
                          {athlete.trend === 'stable' && (
                            <>
                              <Minus className="size-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Stable</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {athlete.factors.map((factor, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                              {factor.factor === 'mood' && <Brain className="size-3" />}
                              {factor.factor === 'stress' && <Activity className="size-3" />}
                              {factor.factor === 'sleep' && <Moon className="size-3" />}
                              {factor.factor === 'engagement' && <MessageSquare className="size-3" />}
                              <span>
                                <strong>{factor.label}:</strong> {factor.value.toFixed(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-blue-50 border-l-4 border-blue-500">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Coaching Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {redCount > 0 && (
              <div className="flex gap-3">
                <AlertTriangle className="size-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground">High Priority</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {redCount} athlete{redCount > 1 ? 's' : ''} need immediate intervention.
                    Schedule 1-on-1 meetings to address stress, sleep, and mental state concerns.
                  </p>
                </div>
              </div>
            )}
            {yellowCount > 0 && (
              <div className="flex gap-3">
                <TrendingUp className="size-5 text-yellow-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground">Monitor</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {yellowCount} athlete{yellowCount > 1 ? 's' : ''} in yellow status should be monitored closely.
                    Quick check-ins during warm-up recommended.
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <CheckCircle className="size-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground">Team Preparation</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {greenCount} athlete{greenCount !== 1 ? 's are' : ' is'} mentally ready for peak performance.
                  Focus team meeting on maintaining positive momentum and executing game plan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
