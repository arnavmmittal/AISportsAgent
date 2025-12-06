import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function CoachInsightsPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin?callbackUrl=/coach/insights');
  }

  if (session.user?.role !== 'COACH' && session.user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

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
                Mental performance trends and analytics
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-8 text-white mb-8">
          <div className="flex items-center mb-4">
            <div className="text-5xl mr-4">💡</div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Advanced Analytics Coming Soon</h2>
              <p className="text-purple-100">
                Performance correlation charts, slump predictions, and ROI metrics
              </p>
            </div>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Mental-Performance Correlation */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">📈</div>
              <h3 className="text-lg font-semibold text-gray-900">
                Performance Correlation
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              See how mental state (mood, stress, sleep) correlates with game performance stats.
            </p>
            <div className="bg-gray-100 rounded p-4 text-xs text-gray-500">
              <strong>Example Insight:</strong> "Athletes with mood &gt;7 have +15% shooting accuracy"
            </div>
            <div className="mt-4 text-xs text-gray-400">
              ⏳ Available after 10+ games tracked
            </div>
          </div>

          {/* Slump Prediction */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">🔮</div>
              <h3 className="text-lg font-semibold text-gray-900">
                Slump Early Warning
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              ML model predicts performance decline 7-14 days before it shows in stats.
            </p>
            <div className="bg-gray-100 rounded p-4 text-xs text-gray-500">
              <strong>Example Alert:</strong> "Warning: John Smith shows mental pattern consistent with upcoming slump"
            </div>
            <div className="mt-4 text-xs text-gray-400">
              ⏳ Available after full season (90+ days data)
            </div>
          </div>

          {/* Team Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">📊</div>
              <h3 className="text-lg font-semibold text-gray-900">
                Team Mental Trends
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Track team-wide mood, stress, and engagement trends over time.
            </p>
            <div className="bg-gray-100 rounded p-4 text-xs text-gray-500">
              <strong>Example Chart:</strong> 30-day rolling average of team mood with game outcomes overlay
            </div>
            <div className="mt-4 text-xs text-gray-400">
              ⏳ Available after 30+ days of athlete mood logs
            </div>
          </div>

          {/* ROI Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">💰</div>
              <h3 className="text-lg font-semibold text-gray-900">
                ROI Calculator
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Calculate the value of mental performance optimization on win rate and program outcomes.
            </p>
            <div className="bg-gray-100 rounded p-4 text-xs text-gray-500">
              <strong>Example Metric:</strong> "+2 wins/season = $200K value (bowl game, recruiting)"
            </div>
            <div className="mt-4 text-xs text-gray-400">
              ⏳ Available after full season comparison
            </div>
          </div>

        </div>

        {/* Current Functionality */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            ✅ What's Available Now
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              • <Link href="/coach/readiness" className="underline font-medium">Team Readiness Scoring</Link> - Pre-game mental readiness (0-100 score)
            </p>
            <p>
              • <Link href="/coach/performance/record" className="underline font-medium">Performance Data Entry</Link> - Track game stats with mental state snapshots
            </p>
            <p>
              • Individual athlete chat history and mood logs (with consent)
            </p>
          </div>
          <p className="text-xs text-blue-600 mt-4">
            💡 Keep collecting data! Advanced insights unlock automatically as your dataset grows.
          </p>
        </div>

      </div>
    </div>
  );
}
