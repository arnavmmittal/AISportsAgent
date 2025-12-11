import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function CoachDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin?callbackUrl=/coach/dashboard');
  }

  if (session.user?.role !== 'COACH' && session.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Coach Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {session.user?.name}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Readiness Dashboard Card */}
            <Link href="/coach/readiness">
              <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border-l-4 border-blue-500">
                <div className="flex items-center mb-3">
                  <div className="text-3xl mr-3">🎯</div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Team Readiness
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  View pre-game mental readiness scores for your team. Identify at-risk athletes.
                </p>
                <div className="mt-4 text-blue-600 font-medium text-sm flex items-center">
                  View Dashboard →
                </div>
              </div>
            </Link>

            {/* Record Performance Card */}
            <Link href="/coach/performance/record">
              <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border-l-4 border-green-500">
                <div className="flex items-center mb-3">
                  <div className="text-3xl mr-3">📊</div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Record Game Stats
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Enter post-game performance data to track mental-physical correlations.
                </p>
                <div className="mt-4 text-green-600 font-medium text-sm flex items-center">
                  Record Stats →
                </div>
              </div>
            </Link>

            {/* Athletes Management Card */}
            <Link href="/coach/athletes">
              <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border-l-4 border-purple-500">
                <div className="flex items-center mb-3">
                  <div className="text-3xl mr-3">👥</div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Manage Athletes
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  View and manage your team roster, athlete profiles, and data.
                </p>
                <div className="mt-4 text-purple-600 font-medium text-sm flex items-center">
                  View Athletes →
                </div>
              </div>
            </Link>

            {/* Insights Card */}
            <Link href="/coach/insights">
              <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border-l-4 border-orange-500">
                <div className="flex items-center mb-3">
                  <div className="text-3xl mr-3">💡</div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Team Insights
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Analyze mental performance trends and patterns across your team.
                </p>
                <div className="mt-4 text-orange-600 font-medium text-sm flex items-center">
                  View Insights →
                </div>
              </div>
            </Link>

            {/* Assignments Card */}
            <Link href="/coach/assignments">
              <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border-l-4 border-pink-500">
                <div className="flex items-center mb-3">
                  <div className="text-3xl mr-3">📋</div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Assignments
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Create and manage check-ins, reflections, and journaling exercises for athletes.
                </p>
                <div className="mt-4 text-pink-600 font-medium text-sm flex items-center">
                  Manage Assignments →
                </div>
              </div>
            </Link>

          </div>
        </div>

        {/* Overview Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-500 text-sm font-medium mb-1">
                Total Athletes
              </div>
              <div className="text-3xl font-bold text-gray-900">
                --
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Active roster
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-500 text-sm font-medium mb-1">
                Avg Team Mood
              </div>
              <div className="text-3xl font-bold text-blue-600">
                --
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last 7 days
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-500 text-sm font-medium mb-1">
                At-Risk Athletes
              </div>
              <div className="text-3xl font-bold text-red-600">
                --
              </div>
              <div className="text-xs text-gray-500 mt-1">
                RED readiness level
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-500 text-sm font-medium mb-1">
                Games Tracked
              </div>
              <div className="text-3xl font-bold text-green-600">
                --
              </div>
              <div className="text-xs text-gray-500 mt-1">
                This season
              </div>
            </div>

          </div>
        </div>

        {/* Getting Started Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            🚀 Getting Started
          </h2>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Step 1:</strong> Have your athletes create accounts and start logging their daily mood and mental state.
            </p>
            <p>
              <strong>Step 2:</strong> Check the <Link href="/coach/readiness" className="underline font-medium">Team Readiness</Link> dashboard 24-48 hours before games to see who's mentally ready.
            </p>
            <p>
              <strong>Step 3:</strong> After each game, <Link href="/coach/performance/record" className="underline font-medium">record game stats</Link> to build mental-performance correlations.
            </p>
            <p>
              <strong>Step 4:</strong> Review <Link href="/coach/insights" className="underline font-medium">Team Insights</Link> to identify patterns and optimize mental performance.
            </p>
          </div>
        </div>

        {/* Recent Activity (Placeholder) */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">
              No recent activity yet. Start by having your athletes use the platform!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
