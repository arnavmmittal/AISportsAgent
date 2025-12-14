import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

export default async function CoachAthletesPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin?callbackUrl=/coach/athletes');
  }

  if (session.user?.role !== 'COACH' && session.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Skip database queries for demo coach
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

      // Get all athletes from the same school
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
              ChatSummary: {
                orderBy: { generatedAt: 'desc' },
                take: 1, // Most recent summary
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
          MoodLog: [
            { mood: 8, confidence: 9, stress: 3, energy: 8, sleep: 8, createdAt: new Date() },
          ],
          ChatSummary: [
            { summary: 'High performer, strong mental resilience', generatedAt: new Date() },
          ],
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
          MoodLog: [
            { mood: 5, confidence: 6, stress: 7, energy: 5, sleep: 6, createdAt: new Date() },
          ],
          ChatSummary: [
            { summary: 'Experiencing academic stress, needs support', generatedAt: new Date() },
          ],
        },
      },
    ];
  }

  // Calculate metrics for each athlete
  const athleteMetrics = athletes.map((athlete) => {
    const recentMoods = athlete.Athlete?.MoodLog || [];

    if (recentMoods.length === 0) {
      return {
        ...athlete,
        avgMood: 0,
        avgStress: 0,
        avgConfidence: 0,
        trend: 'neutral' as const,
        riskLevel: 'LOW' as const,
      };
    }

    const avgMood = recentMoods.reduce((sum, log) => sum + log.mood, 0) / recentMoods.length;
    const avgStress = recentMoods.reduce((sum, log) => sum + log.stress, 0) / recentMoods.length;
    const avgConfidence = recentMoods.reduce((sum, log) => sum + log.confidence, 0) / recentMoods.length;

    // Calculate trend (comparing first half vs second half of recent logs)
    const midpoint = Math.floor(recentMoods.length / 2);
    const recentAvg = recentMoods.slice(0, midpoint).reduce((sum, log) => sum + log.mood, 0) / Math.max(midpoint, 1);
    const olderAvg = recentMoods.slice(midpoint).reduce((sum, log) => sum + log.mood, 0) / Math.max(recentMoods.length - midpoint, 1);
    const trend = recentAvg > olderAvg + 0.5 ? 'improving' : recentAvg < olderAvg - 0.5 ? 'declining' : 'neutral';

    // Determine risk level based on mood and stress
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (avgMood < 4 || avgStress > 7) {
      riskLevel = 'HIGH';
    } else if (avgMood < 5 || avgStress > 6) {
      riskLevel = 'MEDIUM';
    }

    // Critical if very low mood or very high stress
    if (avgMood < 3 || avgStress > 8) {
      riskLevel = 'CRITICAL';
    }

    return {
      ...athlete,
      avgMood: Math.round(avgMood * 10) / 10,
      avgStress: Math.round(avgStress * 10) / 10,
      avgConfidence: Math.round(avgConfidence * 10) / 10,
      trend,
      riskLevel,
    };
  });

  // Sort by risk level (CRITICAL first, then HIGH, MEDIUM, LOW)
  const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sortedAthletes = athleteMetrics.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

  // Count by risk level
  const riskCounts = {
    CRITICAL: sortedAthletes.filter((a) => a.riskLevel === 'CRITICAL').length,
    HIGH: sortedAthletes.filter((a) => a.riskLevel === 'HIGH').length,
    MEDIUM: sortedAthletes.filter((a) => a.riskLevel === 'MEDIUM').length,
    LOW: sortedAthletes.filter((a) => a.riskLevel === 'LOW').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Team Roster
              </h1>
              <p className="mt-2 text-gray-600">
                {coach.School.name} - {athletes.length} Athletes
              </p>
            </div>
            <Link href="/coach/dashboard">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Risk Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-700">{riskCounts.CRITICAL}</div>
                <div className="text-sm text-red-600 mt-1">Critical Risk</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-700">{riskCounts.HIGH}</div>
                <div className="text-sm text-orange-600 mt-1">High Risk</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-700">{riskCounts.MEDIUM}</div>
                <div className="text-sm text-yellow-600 mt-1">Medium Risk</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-700">{riskCounts.LOW}</div>
                <div className="text-sm text-green-600 mt-1">Low Risk</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Athletes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Athlete Mental Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedAthletes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Athlete
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Sport
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Position
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Avg Mood (7d)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Avg Stress (7d)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Confidence
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Trend
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                        Risk Level
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedAthletes.map((athlete) => (
                      <tr key={athlete.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">{athlete.name}</div>
                          <div className="text-sm text-gray-500">{athlete.athlete?.year || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {athlete.athlete?.sport || 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {athlete.athlete?.teamPosition || 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`font-semibold ${
                            athlete.avgMood >= 7 ? 'text-green-600' :
                            athlete.avgMood >= 5 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {athlete.avgMood > 0 ? athlete.avgMood.toFixed(1) : '--'}/10
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`font-semibold ${
                            athlete.avgStress <= 4 ? 'text-green-600' :
                            athlete.avgStress <= 6 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {athlete.avgStress > 0 ? athlete.avgStress.toFixed(1) : '--'}/10
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-sm text-gray-700">
                            {athlete.avgConfidence > 0 ? athlete.avgConfidence.toFixed(1) : '--'}/10
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            {athlete.trend === 'improving' && (
                              <div className="flex items-center gap-1 text-green-600">
                                <TrendingUp className="size-4" />
                                <span className="text-xs font-medium">Improving</span>
                              </div>
                            )}
                            {athlete.trend === 'declining' && (
                              <div className="flex items-center gap-1 text-red-600">
                                <TrendingDown className="size-4" />
                                <span className="text-xs font-medium">Declining</span>
                              </div>
                            )}
                            {athlete.trend === 'neutral' && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <Minus className="size-4" />
                                <span className="text-xs font-medium">Stable</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Badge
                              variant={
                                athlete.riskLevel === 'CRITICAL' ? 'destructive' :
                                athlete.riskLevel === 'HIGH' ? 'destructive' :
                                athlete.riskLevel === 'MEDIUM' ? 'secondary' :
                                'secondary'
                              }
                              className={
                                athlete.riskLevel === 'CRITICAL' ? 'bg-red-600' :
                                athlete.riskLevel === 'HIGH' ? 'bg-orange-500' :
                                athlete.riskLevel === 'MEDIUM' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }
                            >
                              {athlete.riskLevel}
                            </Badge>
                            {(athlete.riskLevel === 'CRITICAL' || athlete.riskLevel === 'HIGH') && (
                              <AlertCircle className="size-4 text-red-500" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No athletes found in your school.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Summaries Section */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Chat Summaries</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Summaries are only shown for athletes who have granted consent in their settings.
            </p>
          </CardHeader>
          <CardContent>
            {(() => {
              const athletesWithConsent = sortedAthletes.filter(
                (a) => a.athlete?.consentChatSummaries === true
              );

              if (athletesWithConsent.length === 0) {
                return (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🔒</div>
                    <p className="text-gray-500">
                      No athletes have consented to share chat summaries yet.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Athletes can enable sharing in their Settings {'>'} Privacy & Coach Access
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {athletesWithConsent.map((athlete) => {
                    const latestSummary = athlete.athlete?.chatSummaries?.[0];

                    return (
                      <div
                        key={athlete.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{athlete.name}</h4>
                            <p className="text-sm text-gray-500">
                              {athlete.athlete?.sport} • {athlete.athlete?.year}
                            </p>
                          </div>
                          {latestSummary ? (
                            <span className="text-xs text-gray-500">
                              {new Date(latestSummary.generatedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500">No recent summary</span>
                          )}
                        </div>

                        {latestSummary ? (
                          <>
                            {/* Summary Text */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {latestSummary.summary}
                              </p>
                            </div>

                            {/* Key Themes */}
                            {latestSummary.keyThemes && Array.isArray(latestSummary.keyThemes) && latestSummary.keyThemes.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-gray-500 mb-2">Key Themes:</p>
                                <div className="flex flex-wrap gap-2">
                                  {(latestSummary.keyThemes as string[]).map((theme, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                                    >
                                      {theme}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Emotional State */}
                            {latestSummary.emotionalState && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500">Emotional State:</span>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    latestSummary.emotionalState === 'positive'
                                      ? 'bg-green-100 text-green-700'
                                      : latestSummary.emotionalState === 'negative'
                                      ? 'bg-red-100 text-red-700'
                                      : latestSummary.emotionalState === 'mixed'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {latestSummary.emotionalState === 'positive' && '😊 Positive'}
                                  {latestSummary.emotionalState === 'negative' && '😔 Struggling'}
                                  {latestSummary.emotionalState === 'mixed' && '😐 Mixed'}
                                  {latestSummary.emotionalState === 'neutral' && '😐 Neutral'}
                                </span>
                              </div>
                            )}

                            {/* Action Items */}
                            {latestSummary.actionItems && Array.isArray(latestSummary.actionItems) && latestSummary.actionItems.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-500 mb-2">Follow-up Items:</p>
                                <ul className="space-y-1">
                                  {(latestSummary.actionItems as string[]).map((item, idx) => (
                                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                                      <span className="text-purple-500 mt-0.5">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">No chat sessions this week</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Help Text */}
        {riskCounts.CRITICAL > 0 || riskCounts.HIGH > 0 ? (
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-6 text-orange-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">Action Recommended</h3>
                  <p className="text-sm text-orange-800">
                    You have {riskCounts.CRITICAL + riskCounts.HIGH} athlete(s) showing signs of elevated mental health risk.
                    Consider reaching out for a one-on-one check-in or reviewing their recent chat sessions for more context.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
