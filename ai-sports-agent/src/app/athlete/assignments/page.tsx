'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Target,
  Filter,
  Search,
  Brain,
  Dumbbell,
  Video,
  BookOpen,
  PenLine,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  PlayCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  User,
} from 'lucide-react';

interface AssignmentWithSubmission {
  submissionId: string;
  assignmentId: string;
  title: string;
  description: string;
  type: string;
  category: string;
  difficulty: string;
  estimatedTime: number;
  dueDate: string;
  assignedDate: string;
  coachName: string;
  status: string;
  response: any;
  timeSpent: number | null;
  startedAt: string | null;
  submittedAt: string | null;
  coachFeedback: string | null;
  coachRating: number | null;
  reviewedAt: string | null;
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

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string; bgColor: string }> = {
  NOT_STARTED: {
    icon: Circle,
    color: 'text-gray-500',
    label: 'Not Started',
    bgColor: 'bg-gray-100'
  },
  IN_PROGRESS: {
    icon: PlayCircle,
    color: 'text-yellow-600',
    label: 'In Progress',
    bgColor: 'bg-yellow-100'
  },
  SUBMITTED: {
    icon: CheckCircle2,
    color: 'text-green-600',
    label: 'Submitted',
    bgColor: 'bg-green-100'
  },
  REVIEWED: {
    icon: CheckCircle2,
    color: 'text-blue-600',
    label: 'Reviewed',
    bgColor: 'bg-blue-100'
  },
};

export default function AthleteAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    notStarted: 0,
    inProgress: 0,
    submitted: 0,
    reviewed: 0,
    overdue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchAssignments();
  }, [statusFilter, typeFilter]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/athlete/assignments?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const data = await response.json();
      setAssignments(data.assignments || []);
      setStats(data.stats || stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter assignments by search query
  const filteredAssignments = assignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group assignments by status for better organization
  const upcomingAssignments = filteredAssignments.filter(a =>
    a.status === 'NOT_STARTED' || a.status === 'IN_PROGRESS'
  ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const completedAssignments = filteredAssignments.filter(a =>
    a.status === 'SUBMITTED' || a.status === 'REVIEWED'
  ).sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime());

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-gray-600 mt-2">
            Complete mental performance assignments from your coaches
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-sm">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-sm">Not Started</p>
            <p className="text-2xl font-bold text-gray-500">{stats.notStarted}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-sm">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-sm">Submitted</p>
            <p className="text-2xl font-bold text-green-600">{stats.submitted}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-sm">Reviewed</p>
            <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-gray-600 text-sm">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="REVIEWED">Reviewed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="REFLECTION">Reflection</option>
              <option value="EXERCISE">Mental Exercise</option>
              <option value="VIDEO_WATCH">Video</option>
              <option value="READING">Reading</option>
              <option value="JOURNALING">Journaling</option>
              <option value="GOAL_SETTING">Goal Setting</option>
              <option value="MINDFULNESS">Mindfulness</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* No Assignments */}
        {!isLoading && filteredAssignments.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No assignments found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'You have no assignments at this time'}
            </p>
          </div>
        )}

        {/* Upcoming Assignments */}
        {!isLoading && upcomingAssignments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming & In Progress</h2>
            <div className="space-y-4">
              {upcomingAssignments.map((assignment) => {
                const Icon = TYPE_ICONS[assignment.type] || Target;
                const statusConfig = STATUS_CONFIG[assignment.status];
                const StatusIcon = statusConfig.icon;
                const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status !== 'SUBMITTED';
                const daysUntilDue = Math.ceil((new Date(assignment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                return (
                  <div
                    key={assignment.submissionId}
                    className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow ${
                      isOverdue ? 'border-2 border-red-300' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-3">
                          <div className={`w-12 h-12 rounded-lg ${TYPE_COLORS[assignment.type]} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              {assignment.title}
                            </h3>
                            <p className="text-gray-600 mb-2">{assignment.description}</p>

                            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                              <span className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                {assignment.coachName}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                {isOverdue ? (
                                  <span className="ml-2 text-red-600 font-medium">(Overdue)</span>
                                ) : daysUntilDue <= 3 ? (
                                  <span className="ml-2 text-orange-600 font-medium">({daysUntilDue}d left)</span>
                                ) : null}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {assignment.estimatedTime} min
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${statusConfig.bgColor} ${statusConfig.color} font-medium flex items-center`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                {assignment.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/athlete/assignments/${assignment.submissionId}`}
                        className="ml-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center whitespace-nowrap"
                      >
                        {assignment.status === 'NOT_STARTED' ? 'Start' : 'Continue'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Assignments */}
        {!isLoading && completedAssignments.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Completed</h2>
            <div className="space-y-4">
              {completedAssignments.map((assignment) => {
                const Icon = TYPE_ICONS[assignment.type] || Target;
                const statusConfig = STATUS_CONFIG[assignment.status];
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={assignment.submissionId}
                    className="bg-white rounded-lg shadow-sm p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg ${TYPE_COLORS[assignment.type]} flex items-center justify-center flex-shrink-0 opacity-60`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              {assignment.title}
                            </h3>

                            <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                              <span className={`px-2 py-1 rounded text-xs ${statusConfig.bgColor} ${statusConfig.color} font-medium flex items-center`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </span>
                              <span className="flex items-center">
                                Submitted: {assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleDateString() : '—'}
                              </span>
                              {assignment.timeSpent && (
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {assignment.timeSpent} min
                                </span>
                              )}
                            </div>

                            {/* Coach Feedback */}
                            {assignment.coachFeedback && (
                              <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm font-semibold text-blue-900 mb-1">Coach Feedback:</p>
                                <p className="text-sm text-blue-800">{assignment.coachFeedback}</p>
                                {assignment.coachRating && (
                                  <div className="flex items-center mt-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <span
                                        key={i}
                                        className={i < assignment.coachRating! ? 'text-yellow-500' : 'text-gray-300'}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/athlete/assignments/${assignment.submissionId}`}
                        className="ml-4 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center whitespace-nowrap"
                      >
                        View
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
