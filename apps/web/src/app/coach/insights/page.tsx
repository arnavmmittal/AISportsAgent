import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MessageCircle, TrendingUp, Users } from 'lucide-react';

export default async function CoachInsightsPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin?callbackUrl=/coach/insights');
  }

  if (session.user?.role !== 'COACH' && session.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Get coach's school
  const coach = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!coach) {
    return <div>Coach not found</div>;
  }

  // Get crisis alerts from the last 30 days (for athletes in same school)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const crisisAlerts = await prisma.crisisAlert.findMany({
    where: {
      Athlete: {
        User: {
          schoolId: coach.schoolId,
        },
      },
      detectedAt: {
        gte: thirtyDaysAgo,
      },
    },
    include: {
      Athlete: {
        include: {
          User: true,
        },
      },
      Message: true,
    },
    orderBy: {
      detectedAt: 'desc',
    },
    take: 20,
  });

  // Get all athletes for team metrics
  const athletes = await prisma.athlete.findMany({
    where: {
      User: {
        schoolId: coach.schoolId,
      },
    },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      MoodLog: {
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      },
      ChatSession: {
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          Message: true,
        },
      },
    },
  });

  // Calculate team metrics
  const totalAthletes = athletes.length;
  const activeAthletes = athletes.filter((a) => a.MoodLog.length > 0 || a.ChatSession.length > 0).length;
  const avgMoodLogs = athletes.reduce((sum, a) => sum + a.MoodLog.length, 0) / Math.max(totalAthletes, 1);
  const avgChatSessions = athletes.reduce((sum, a) => sum + a.ChatSession.length, 0) / Math.max(totalAthletes, 1);

  // Calculate team mood average
  const allMoodLogs = athletes.flatMap((a) => a.MoodLog);
  const teamAvgMood = allMoodLogs.length > 0
    ? allMoodLogs.reduce((sum, log) => sum + log.mood, 0) / allMoodLogs.length
    : 0;
  const teamAvgStress = allMoodLogs.length > 0
    ? allMoodLogs.reduce((sum, log) => sum + log.stress, 0) / allMoodLogs.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Team Insights
              </h1>
              <p className="mt-2 text-gray-600">
                Mental performance trends and crisis alerts
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
        {/* Team Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Athletes</p>
                  <p className="text-2xl font-bold text-gray-900">{activeAthletes}/{totalAthletes}</p>
                </div>
                <Users className="size-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Team Avg Mood</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {teamAvgMood > 0 ? teamAvgMood.toFixed(1) : '--'}/10
                  </p>
                </div>
                <TrendingUp className="size-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg Chat Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{avgChatSessions.toFixed(1)}</p>
                </div>
                <MessageCircle className="size-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Crisis Alerts (30d)</p>
                  <p className="text-2xl font-bold text-gray-900">{crisisAlerts.length}</p>
                </div>
                <AlertTriangle className="size-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Crisis Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Crisis Alerts</CardTitle>
            <CardDescription>
              Automatic detection of concerning language in athlete conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {crisisAlerts.length > 0 ? (
              <div className="space-y-4">
                {crisisAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-2 ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-50 border-red-200'
                        : alert.severity === 'HIGH'
                        ? 'bg-orange-50 border-orange-200'
                        : alert.severity === 'MEDIUM'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            variant="destructive"
                            className={
                              alert.severity === 'CRITICAL'
                                ? 'bg-red-600'
                                : alert.severity === 'HIGH'
                                ? 'bg-orange-500'
                                : alert.severity === 'MEDIUM'
                                ? 'bg-yellow-500'
                                : 'bg-blue-500'
                            }
                          >
                            {alert.severity}
                          </Badge>
                          <span className="font-semibold text-gray-900">
                            {alert.Athlete.User.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(alert.detectedAt).toLocaleDateString()} at{' '}
                            {new Date(alert.detectedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 italic mb-2">
                          "{alert.Message.content.substring(0, 150)}
                          {alert.Message.content.length > 150 ? '...' : ''}"
                        </p>
                        {alert.reviewed ? (
                          <div className="text-xs text-green-600 font-medium">
                            ✓ Reviewed
                            {alert.reviewedAt &&
                              ` on ${new Date(alert.reviewedAt).toLocaleDateString()}`}
                          </div>
                        ) : (
                          <div className="text-xs text-orange-600 font-medium">
                            ⚠️ Needs Review
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="size-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No crisis alerts in the last 30 days</p>
                <p className="text-sm text-gray-400 mt-2">
                  The system automatically flags concerning language for review
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engagement Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Engagement (Last 30 Days)</CardTitle>
            <CardDescription>
              Athletes using mood logging and AI chat features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Athletes logging moods regularly
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {athletes.filter((a) => a.MoodLog && a.MoodLog.length >= 7).length}/{totalAthletes}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Athletes using AI chat
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {athletes.filter((a) => a.ChatSession && a.ChatSession.length > 0).length}/{totalAthletes}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Total mood logs
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {allMoodLogs.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Total chat messages
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {athletes.reduce((sum, a) => sum + (a.ChatSession?.reduce((s, sess) => s + (sess.Message?.length || 0), 0) || 0), 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stress Distribution */}
        {allMoodLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Team Mental State Distribution (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Mood Levels</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">High (7-10)</span>
                      <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 rounded-full h-2"
                          style={{
                            width: `${(allMoodLogs.filter((l) => l.mood >= 7).length / allMoodLogs.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-900">
                        {Math.round((allMoodLogs.filter((l) => l.mood >= 7).length / allMoodLogs.length) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Medium (4-6)</span>
                      <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 rounded-full h-2"
                          style={{
                            width: `${(allMoodLogs.filter((l) => l.mood >= 4 && l.mood < 7).length / allMoodLogs.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-900">
                        {Math.round((allMoodLogs.filter((l) => l.mood >= 4 && l.mood < 7).length / allMoodLogs.length) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Low (1-3)</span>
                      <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 rounded-full h-2"
                          style={{
                            width: `${(allMoodLogs.filter((l) => l.mood < 4).length / allMoodLogs.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-900">
                        {Math.round((allMoodLogs.filter((l) => l.mood < 4).length / allMoodLogs.length) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Stress Levels</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Low (1-4)</span>
                      <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 rounded-full h-2"
                          style={{
                            width: `${(allMoodLogs.filter((l) => l.stress <= 4).length / allMoodLogs.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-900">
                        {Math.round((allMoodLogs.filter((l) => l.stress <= 4).length / allMoodLogs.length) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Medium (5-7)</span>
                      <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 rounded-full h-2"
                          style={{
                            width: `${(allMoodLogs.filter((l) => l.stress > 4 && l.stress <= 7).length / allMoodLogs.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-900">
                        {Math.round((allMoodLogs.filter((l) => l.stress > 4 && l.stress <= 7).length / allMoodLogs.length) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">High (8-10)</span>
                      <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 rounded-full h-2"
                          style={{
                            width: `${(allMoodLogs.filter((l) => l.stress > 7).length / allMoodLogs.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-900">
                        {Math.round((allMoodLogs.filter((l) => l.stress > 7).length / allMoodLogs.length) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
