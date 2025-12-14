import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CoachAnalyticsPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin?callbackUrl=/coach/analytics');
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
                Team Analytics
              </h1>
              <p className="mt-2 text-gray-600">
                Deep dive into performance metrics and trends
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📈 Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Track athlete performance over time with detailed metrics and visualizations.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Weekly Average:</span>
                  <span className="font-semibold text-green-600">+12%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monthly Trend:</span>
                  <span className="font-semibold text-green-600">↑ Improving</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sport-Specific Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏀 Sport Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Analytics segmented by sport category.
              </p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Basketball</span>
                    <span className="font-semibold">12 athletes</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Soccer</span>
                    <span className="font-semibold">8 athletes</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mental Health Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🧠 Mental Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Team-wide mental wellness indicators.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Avg Mood Score:</span>
                  <span className="font-semibold">7.2/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Avg Confidence:</span>
                  <span className="font-semibold">7.8/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Avg Stress:</span>
                  <span className="font-semibold text-orange-600">4.3/10</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💬 Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Chat and interaction statistics.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Active Today:</span>
                  <span className="font-semibold">18 athletes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">This Week:</span>
                  <span className="font-semibold">24 athletes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Engagement Rate:</span>
                  <span className="font-semibold text-green-600">92%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goal Completion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎯 Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Team goal completion metrics.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Active Goals:</span>
                  <span className="font-semibold">45</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Completed:</span>
                  <span className="font-semibold text-green-600">37</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Success Rate:</span>
                  <span className="font-semibold text-green-600">82%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crisis Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚨 Risk Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Identified patterns requiring attention.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">At-Risk Athletes:</span>
                  <span className="font-semibold text-red-600">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Crisis Alerts:</span>
                  <span className="font-semibold text-orange-600">2</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Resolved This Week:</span>
                  <span className="font-semibold text-green-600">5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-10">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚀 Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">📊 Custom Reports</h3>
                  <p className="text-sm text-blue-700">Generate custom analytics reports for specific time periods and metrics.</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">🤖 AI Predictions</h3>
                  <p className="text-sm text-purple-700">ML-powered predictions for athlete performance and risk levels.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">📈 Comparative Analysis</h3>
                  <p className="text-sm text-green-700">Compare individual athletes or teams against benchmarks.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
