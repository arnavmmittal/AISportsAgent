'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Circle,
  PlayCircle,
  AlertCircle,
  Loader2,
  Download,
  Brain,
  Dumbbell,
  Video,
  BookOpen,
  PenLine,
  Target,
  Sparkles,
} from 'lucide-react';

interface AssignmentDetail {
  assignment: {
    id: string;
    title: string;
    description: string;
    instructions: string;
    type: string;
    category: string;
    difficulty: string;
    estimatedTime: number;
    resources: any;
    sportFilter: string | null;
    yearFilter: string | null;
    dueDate: string;
    assignedDate: string;
    submissions: Submission[];
  };
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    completionRate: number;
  };
}

interface Submission {
  id: string;
  status: string;
  response: any;
  timeSpent: number | null;
  startedAt: string | null;
  submittedAt: string | null;
  coachFeedback: string | null;
  coachRating: number | null;
  athlete: {
    sport: string;
    year: string;
    position: string | null;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

const TYPE_ICONS: Record<string, any> = {
  REFLECTION: Brain,
  EXERCISE: Dumbbell,
  VIDEO_WATCH: Video,
  READING: BookOpen,
  JOURNALING: PenLine,
  GOAL_SETTING: Target,
  MINDFULNESS: Sparkles,
};

const TYPE_COLORS: Record<string, string> = {
  REFLECTION: 'bg-purple-100 text-purple-600',
  EXERCISE: 'bg-blue-100 text-blue-600',
  VIDEO_WATCH: 'bg-red-100 text-red-600',
  READING: 'bg-green-100 text-green-600',
  JOURNALING: 'bg-yellow-100 text-yellow-600',
  GOAL_SETTING: 'bg-orange-100 text-orange-600',
  MINDFULNESS: 'bg-pink-100 text-pink-600',
};

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  NOT_STARTED: { icon: Circle, color: 'text-gray-400', label: 'Not Started' },
  IN_PROGRESS: { icon: PlayCircle, color: 'text-yellow-500', label: 'In Progress' },
  SUBMITTED: { icon: CheckCircle2, color: 'text-green-500', label: 'Submitted' },
  REVIEWED: { icon: CheckCircle2, color: 'text-blue-500', label: 'Reviewed' },
};

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const [data, setData] = useState<AssignmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  const fetchAssignment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/coach/assignments/${assignmentId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch assignment');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data) return;

    const headers = ['Name', 'Email', 'Sport', 'Year', 'Status', 'Time Spent (min)', 'Submitted At'];
    const rows = data.assignment.submissions.map((sub) => [
      sub.athlete.user.name,
      sub.athlete.user.email,
      sub.athlete.sport,
      sub.athlete.year,
      sub.status,
      sub.timeSpent || '—',
      sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignment-${assignmentId}-submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Assignment</h2>
            <p className="text-red-800 mb-6">{error || 'Assignment not found'}</p>
            <Link
              href="/coach/assignments"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assignments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { assignment, stats } = data;
  const Icon = TYPE_ICONS[assignment.type] || Target;
  const isOverdue = new Date(assignment.dueDate) < new Date();

  // Filter submissions
  const filteredSubmissions = assignment.submissions.filter((sub) =>
    filterStatus === 'all' ? true : sub.status === filterStatus
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/coach/assignments"
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assignments
          </Link>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-lg ${TYPE_COLORS[assignment.type]} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
                <p className="text-gray-600 mb-4">{assignment.description}</p>

                {/* Metadata */}
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    {isOverdue && (
                      <span className="ml-2 text-red-600 font-medium">(Overdue)</span>
                    )}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {assignment.estimatedTime} min
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    {assignment.difficulty}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {assignment.category}
                  </span>
                  {assignment.sportFilter && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                      {assignment.sportFilter}
                    </span>
                  )}
                  {assignment.yearFilter && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                      {assignment.yearFilter}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{assignment.instructions}</p>
            </div>

            {/* Resources */}
            {assignment.resources && Object.keys(assignment.resources).length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Resources</h3>
                <pre className="text-sm text-gray-700 overflow-auto">
                  {JSON.stringify(assignment.resources, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Athletes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">In Progress</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.inProgress}</p>
              </div>
              <PlayCircle className="w-10 h-10 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completion Rate</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.completionRate}%</p>
              </div>
              <Circle className="w-10 h-10 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Athlete Submissions</h2>
            <div className="flex items-center gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="REVIEWED">Reviewed</option>
              </select>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No submissions found for this filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Athlete</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Sport</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Year</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Time Spent</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission) => {
                    const statusConfig = STATUS_CONFIG[submission.status];
                    const StatusIcon = statusConfig.icon;

                    return (
                      <tr key={submission.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{submission.athlete.user.name}</p>
                            <p className="text-sm text-gray-600">{submission.athlete.user.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-900">{submission.athlete.sport}</td>
                        <td className="py-4 px-4 text-gray-900">{submission.athlete.year}</td>
                        <td className="py-4 px-4">
                          <span className={`flex items-center ${statusConfig.color}`}>
                            <StatusIcon className="w-4 h-4 mr-2" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-900">
                          {submission.timeSpent ? `${submission.timeSpent} min` : '—'}
                        </td>
                        <td className="py-4 px-4 text-gray-900">
                          {submission.submittedAt
                            ? new Date(submission.submittedAt).toLocaleDateString()
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
