'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Filter,
  Search,
  Brain,
  Dumbbell,
  Video,
  BookOpen,
  PenLine,
  Target,
  Sparkles,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Circle,
  AlertCircle,
  Trash2,
  Edit,
  Eye,
  Loader2,
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  difficulty: string;
  estimatedTime: number;
  dueDate: string;
  assignedDate: string;
  sportFilter: string | null;
  yearFilter: string | null;
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    completionRate: number;
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

export default function CoachAssignmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSuccess, setShowSuccess] = useState(false);

  // Check for success message from query params
  useEffect(() => {
    if (searchParams.get('success') === 'created') {
      const assigned = searchParams.get('assigned');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  // Fetch assignments
  useEffect(() => {
    fetchAssignments();
  }, [typeFilter, statusFilter]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/coach/assignments?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This will also delete all athlete submissions.')) {
      return;
    }

    try {
      const response = await fetch(`/api/coach/assignments/${assignmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }

      // Refresh assignments list
      fetchAssignments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete assignment');
    }
  };

  // Filter assignments by search query
  const filteredAssignments = assignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate overview stats
  const totalAssignments = filteredAssignments.length;
  const totalAthletes = filteredAssignments.reduce((sum, a) => sum + a.stats.total, 0);
  const totalCompleted = filteredAssignments.reduce((sum, a) => sum + a.stats.completed, 0);
  const avgCompletionRate = totalAthletes > 0
    ? Math.round((totalCompleted / totalAthletes) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
              <p className="text-gray-600 mt-2">
                Manage mental performance assignments for your athletes
              </p>
            </div>
            <Link
              href="/coach/assignments/create"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Assignment
            </Link>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                Assignment created successfully and assigned to {searchParams.get('assigned')} athletes!
              </p>
            </div>
          )}

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Assignments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{totalAssignments}</p>
                </div>
                <Target className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Submissions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{totalAthletes}</p>
                </div>
                <Users className="w-10 h-10 text-purple-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{totalCompleted}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Completion Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{avgCompletionRate}%</p>
                </div>
                <Circle className="w-10 h-10 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
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

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
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

        {/* Assignments List */}
        {!isLoading && filteredAssignments.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No assignments found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first assignment to get started'}
            </p>
            {!searchQuery && typeFilter === 'all' && statusFilter === 'all' && (
              <Link
                href="/coach/assignments/create"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Assignment
              </Link>
            )}
          </div>
        )}

        {!isLoading && filteredAssignments.length > 0 && (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => {
              const Icon = TYPE_ICONS[assignment.type] || Target;
              const isOverdue = new Date(assignment.dueDate) < new Date();

              return (
                <div key={assignment.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-lg ${TYPE_COLORS[assignment.type]} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {assignment.title}
                          </h3>
                          <p className="text-gray-600 mb-3">{assignment.description}</p>

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
                          </div>
                        </div>
                      </div>

                      {/* Completion Stats */}
                      <div className="grid grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
                        <div>
                          <p className="text-gray-600 text-sm">Total</p>
                          <p className="text-2xl font-bold text-gray-900">{assignment.stats.total}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Completed</p>
                          <p className="text-2xl font-bold text-green-600">{assignment.stats.completed}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">In Progress</p>
                          <p className="text-2xl font-bold text-yellow-600">{assignment.stats.inProgress}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Completion Rate</p>
                          <p className="text-2xl font-bold text-blue-600">{assignment.stats.completionRate}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => router.push(`/coach/assignments/${assignment.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => router.push(`/coach/assignments/${assignment.id}/edit`)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
