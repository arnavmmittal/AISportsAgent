import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function CoachAthletesPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin?callbackUrl=/coach/athletes');
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
                Manage Athletes
              </h1>
              <p className="mt-2 text-gray-600">
                View and manage your team roster
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

        {/* Empty State */}
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No Athletes Yet
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Your team roster will appear here once athletes create accounts and join your team.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto mt-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              How to Add Athletes
            </h3>
            <div className="text-left space-y-3 text-sm text-blue-800">
              <p>
                <strong>Step 1:</strong> Share the signup link with your athletes:
                <code className="ml-2 px-2 py-1 bg-white rounded text-xs">
                  {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/signup
                </code>
              </p>
              <p>
                <strong>Step 2:</strong> Have them select "Student Athlete" as their role
              </p>
              <p>
                <strong>Step 3:</strong> Athletes should enter your school/team name to be linked to your roster
              </p>
              <p className="text-xs text-blue-600 mt-4">
                💡 Note: Multi-school support and automatic roster sync coming in next update
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
