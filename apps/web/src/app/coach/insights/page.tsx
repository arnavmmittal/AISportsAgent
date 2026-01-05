// TODO: Re-implement auth after Supabase migration
// import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MessageCircle, TrendingUp, Users } from 'lucide-react';

// Force dynamic rendering to avoid database connection issues during build
export const dynamic = 'force-dynamic';

export default async function CoachInsightsPage() {
  // TODO: Re-implement auth check after Supabase migration
  // const session = await auth();
  // if (!session) {
  //   redirect('/auth/signin?callbackUrl=/coach/insights');
  // }
  // if (session.user?.role !== 'COACH' && session.user?.role !== 'ADMIN') {
  //   redirect('/dashboard');
  // }

  // Get first coach (temporary until auth implemented)
  const coach = await prisma.user.findFirst({
    where: { role: 'COACH' },
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Team Insights
              </h1>
              <p className="mt-2 text-muted-foreground">
                Mental performance trends and crisis alerts
              </p>
            </div>
            <Link href="/coach/dashboard">
              <button className="px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-background">
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
                  <p className="text-sm text-muted-foreground">Active Athletes</p>
                  <p className="text-2xl font-bold text-foreground">{activeAthletes}/{totalAthletes}</p>
                </div>
                <Users className="size-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Team Avg Mood</p>
                  <p className="text-2xl font-bold text-foreground">
                    {teamAvgMood > 0 ? teamAvgMood.toFixed(1) : '--'}/10
                  </p>
                </div>
                <TrendingUp className="size-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Chat Sessions</p>
                  <p className="text-2xl font-bold text-foreground">{avgChatSessions.toFixed(1)}</p>
                </div>
                <MessageCircle className="size-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Crisis Alerts (30d)</p>
                  <p className="text-2xl font-bold text-foreground">{crisisAlerts.length}</p>
                </div>
                <AlertTriangle className="size-8 text-muted-foreground" />
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
                        ? 'bg-muted-foreground/10 border-muted-foreground'
                        : alert.severity === 'HIGH'
                        ? 'bg-muted/10 border-muted'
                        : alert.severity === 'MEDIUM'
                        ? 'bg-muted/10 border-muted'
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
                                ? 'bg-muted-foreground/30'
                                : alert.severity === 'HIGH'
                                ? 'bg-muted/100'
                                : alert.severity === 'MEDIUM'
                                ? 'bg-muted/100'
                                : 'bg-blue-500'
                            }
                          >
                            {alert.severity}
                          </Badge>
                          <span className="font-semibold text-foreground">
                            {alert.Athlete.User.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(alert.detectedAt).toLocaleDateString()} at{' '}
                            {new Date(alert.detectedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground italic mb-2">
                          "{alert.Message.content.substring(0, 150)}
                          {alert.Message.content.length > 150 ? '...' : ''}"
                        </p>
                        {alert.reviewed ? (
                          <div className="text-xs text-secondary font-medium">
                            ✓ Reviewed
                            {alert.reviewedAt &&
                              ` on ${new Date(alert.reviewedAt).toLocaleDateString()}`}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground font-medium">
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
                <AlertTriangle className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No crisis alerts in the last 30 days</p>
                <p className="text-sm text-muted-foreground mt-2">
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
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">
                  Athletes logging moods regularly
                </span>
                <span className="text-lg font-bold text-foreground">
                  {athletes.filter((a) => a.MoodLog && a.MoodLog.length >= 7).length}/{totalAthletes}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">
                  Athletes using AI chat
                </span>
                <span className="text-lg font-bold text-foreground">
                  {athletes.filter((a) => a.ChatSession && a.ChatSession.length > 0).length}/{totalAthletes}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">
                  Total mood logs
                </span>
                <span className="text-lg font-bold text-foreground">
                  {allMoodLogs.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">
                  Total chat messages
                </span>
                <span className="text-lg font-bold text-foreground">
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
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">Mood Levels</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">High (7-10)</span>
                      <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-secondary/100 rounded-full h-2"
                          style={{
                            width: `${(allMoodLogs.filter((l) => l.mood >= 7).length / allMoodLogs.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {Math.round((allMoodLogs.filter((l) => l.mood >= 7).length / allMoodLogs.length) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Medium (4-6)</span>
                      <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-muted/100 rounded-full h-2"
                          style={{
                            width: `${(allMoodLogs.filter((l) => l.mood >= 4 && l.mood < 7).length / allMoodLogs.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {Math.round((allMoodLogs.filter((l) => l.mood >= 4 && l.mood < 7).length / allMoodLogs.length) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Low (1-3)</span>
                      <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-muted-foreground/100 rounded-full h-2"
                          style={{
                            width: `${(allMoodLogs.filter((l) => l.mood < 4).length / allMoodLogs.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {Math.round((allMoodLogs.filter((l) => l.mood < 4).length / allMoodLogs.length) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">Stress Levels</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Low (1-4)</span>
                      <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-secondary/100 rounded-full h-2"
                          style={{
                            width: `${(allMoodLogs.filter((l) => l.stress <= 4).length / allMoodLogs.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {Math.round((allMoodLogs.filter((l) => l.stress <= 4).length / allMoodLogs.length) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Medium (5-7)</span>
                      <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-muted/100 rounded-full h-2"
                          style={{
                            width: `${(allMoodLogs.filter((l) => l.stress > 4 && l.stress <= 7).length / allMoodLogs.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {Math.round((allMoodLogs.filter((l) => l.stress > 4 && l.stress <= 7).length / allMoodLogs.length) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">High (8-10)</span>
                      <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-muted-foreground/100 rounded-full h-2"
                          style={{
                            width: `${(allMoodLogs.filter((l) => l.stress > 7).length / allMoodLogs.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground">
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
