import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, Badge, Button, MetricCard, AnimatedCounter } from '@/design-system/components';
import { AlertTriangle, MessageCircle, TrendingUp, Users, ChevronLeft, Brain, Activity } from 'lucide-react';
import { EmptyState } from '@/components/shared/page-components';

// Force dynamic rendering to avoid database connection issues during build
export const dynamic = 'force-dynamic';

export default async function CoachInsightsPage() {
  // Get first coach (temporary until auth implemented)
  const coach = await prisma.user.findFirst({
    where: { role: 'COACH' },
  });

  if (!coach) {
    return <div>Coach not found</div>;
  }

  // Get crisis alerts from the last 30 days
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/coach/dashboard">
            <Button variant="ghost" size="sm" className="flex items-center gap-2 mb-4">
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl lg:text-6xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Team Insights
          </h1>
          <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 font-body">
            Mental performance trends and crisis alerts
          </p>
        </div>

        {/* Team Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Active Athletes"
            value={activeAthletes}
            suffix={`/${totalAthletes}`}
            gradient="primary"
            icon={<Users className="w-5 h-5" />}
          />

          <MetricCard
            label="Team Avg Mood"
            value={teamAvgMood}
            decimals={1}
            suffix="/10"
            gradient="success"
            icon={<TrendingUp className="w-5 h-5" />}
          />

          <MetricCard
            label="Avg Chat Sessions"
            value={avgChatSessions}
            decimals={1}
            gradient="secondary"
            icon={<MessageCircle className="w-5 h-5" />}
          />

          <MetricCard
            label="Crisis Alerts (30d)"
            value={crisisAlerts.length}
            gradient="danger"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
        </div>

        {/* Crisis Alerts */}
        <Card variant="elevated" padding="lg" className="mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
              Recent Crisis Alerts
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 font-body">
              Automatic detection of concerning language in athlete conversations
            </p>
          </div>

          {crisisAlerts.length > 0 ? (
            <div className="space-y-4">
              {crisisAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-5 rounded-xl border-2 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-600'
                      : alert.severity === 'HIGH'
                      ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-600'
                      : 'bg-info-50 dark:bg-info-900/20 border-info-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge
                          variant={
                            alert.severity === 'CRITICAL'
                              ? 'danger'
                              : alert.severity === 'HIGH'
                              ? 'warning'
                              : 'secondary'
                          }
                          size="sm"
                        >
                          {alert.severity}
                        </Badge>
                        <span className="font-semibold text-gray-900 dark:text-white font-body">
                          {alert.Athlete.User.name}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-body">
                          {new Date(alert.detectedAt).toLocaleDateString()} at{' '}
                          {new Date(alert.detectedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-3 font-body">
                        "{alert.Message.content.substring(0, 150)}
                        {alert.Message.content.length > 150 ? '...' : ''}"
                      </p>
                      {alert.reviewed ? (
                        <Badge variant="success" size="sm">
                          ✓ Reviewed
                          {alert.reviewedAt &&
                            ` on ${new Date(alert.reviewedAt).toLocaleDateString()}`}
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          ⚠️ Needs Review
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={AlertTriangle}
              title="All Clear"
              description="No crisis alerts in the last 30 days. The system automatically flags concerning language for review."
              iconColor="success"
            />
          )}
        </Card>

        {/* Engagement Trends */}
        <Card variant="elevated" padding="lg" className="mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
              Platform Engagement (Last 30 Days)
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 font-body">
              Athletes using mood logging and AI chat features
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-body">
                Athletes logging moods regularly
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white font-display">
                {athletes.filter((a) => a.MoodLog && a.MoodLog.length >= 7).length}/{totalAthletes}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-body">
                Athletes using AI chat
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white font-display">
                {athletes.filter((a) => a.ChatSession && a.ChatSession.length > 0).length}/{totalAthletes}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-body">
                Total mood logs
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white font-display">
                {allMoodLogs.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-body">
                Total chat messages
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white font-display">
                {athletes.reduce((sum, a) => sum + (a.ChatSession?.reduce((s, sess) => s + (sess.Message?.length || 0), 0) || 0), 0)}
              </span>
            </div>
          </div>
        </Card>

        {/* Stress Distribution */}
        {allMoodLogs.length > 0 && (
          <Card variant="elevated" padding="lg">
            <div className="mb-6">
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                Team Mental State Distribution (Last 30 Days)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wider font-body">Mood Levels</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-body w-24">High (7-10)</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-success-500 to-success-600 rounded-full h-3 transition-all"
                        style={{
                          width: `${(allMoodLogs.filter((l) => l.mood >= 7).length / allMoodLogs.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white font-display w-12 text-right">
                      {Math.round((allMoodLogs.filter((l) => l.mood >= 7).length / allMoodLogs.length) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-body w-24">Medium (4-6)</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-warning-500 to-warning-600 rounded-full h-3 transition-all"
                        style={{
                          width: `${(allMoodLogs.filter((l) => l.mood >= 4 && l.mood < 7).length / allMoodLogs.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white font-display w-12 text-right">
                      {Math.round((allMoodLogs.filter((l) => l.mood >= 4 && l.mood < 7).length / allMoodLogs.length) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-body w-24">Low (1-3)</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-danger-500 to-danger-600 rounded-full h-3 transition-all"
                        style={{
                          width: `${(allMoodLogs.filter((l) => l.mood < 4).length / allMoodLogs.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white font-display w-12 text-right">
                      {Math.round((allMoodLogs.filter((l) => l.mood < 4).length / allMoodLogs.length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wider font-body">Stress Levels</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-body w-24">Low (1-4)</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-success-500 to-success-600 rounded-full h-3 transition-all"
                        style={{
                          width: `${(allMoodLogs.filter((l) => l.stress <= 4).length / allMoodLogs.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white font-display w-12 text-right">
                      {Math.round((allMoodLogs.filter((l) => l.stress <= 4).length / allMoodLogs.length) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-body w-24">Medium (5-7)</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-warning-500 to-warning-600 rounded-full h-3 transition-all"
                        style={{
                          width: `${(allMoodLogs.filter((l) => l.stress > 4 && l.stress <= 7).length / allMoodLogs.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white font-display w-12 text-right">
                      {Math.round((allMoodLogs.filter((l) => l.stress > 4 && l.stress <= 7).length / allMoodLogs.length) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-body w-24">High (8-10)</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-danger-500 to-danger-600 rounded-full h-3 transition-all"
                        style={{
                          width: `${(allMoodLogs.filter((l) => l.stress > 7).length / allMoodLogs.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white font-display w-12 text-right">
                      {Math.round((allMoodLogs.filter((l) => l.stress > 7).length / allMoodLogs.length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
