'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  createdAt: string;
  targetSport: string | null;
  targetAthleteIds: string[] | null;
  submissions: {
    id: string;
    athleteId: string;
    status: 'PENDING' | 'SUBMITTED' | 'REVIEWED';
    submittedAt: string | null;
  }[];
}

export default function CoachAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/assignments');
      if (!response.ok) throw new Error('Failed to load assignments');
      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSubmissionStats = (assignment: Assignment) => {
    const submissions = assignment.submissions || [];
    const total = submissions.length;
    const submitted = submissions.filter(s => s.status !== 'PENDING').length;
    const pending = total - submitted;
    return { total, submitted, pending };
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Assignments
            </h1>
            <p className="mt-3 text-muted-foreground dark:text-gray-400 text-lg">
              Create and manage assignments for your athletes
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold hover:scale-105 transform"
          >
            📝 Create Assignment
          </button>
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
            <p className="mt-6 text-muted-foreground dark:text-gray-400 font-semibold text-lg">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl p-16 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-8xl mb-6">📋</div>
            <h3 className="text-3xl font-black text-foreground dark:text-gray-100 mb-4">
              No assignments yet
            </h3>
            <p className="text-muted-foreground dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
              Create your first assignment to get started with athlete check-ins and journaling.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold text-lg hover:scale-105 transform"
            >
              📝 Create First Assignment
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {assignments.map((assignment) => {
              const stats = getSubmissionStats(assignment);
              const overdue = isOverdue(assignment.dueDate);

              return (
                <Link
                  key={assignment.id}
                  href={`/coach/assignments/${assignment.id}`}
                  className="block bg-card dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all p-8 border border-gray-100 dark:border-gray-700 hover:scale-102 transform"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-3xl">📋</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-black text-foreground dark:text-gray-100 mb-2">
                            {assignment.title}
                          </h3>
                          <p className="text-muted-foreground dark:text-gray-400 text-base mb-4 line-clamp-2 font-semibold">
                            {assignment.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3">
                            {/* Submission Stats */}
                            <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 px-4 py-2 rounded-xl border-2 border-green-200 dark:border-green-800">
                              <span className="text-sm font-bold text-green-900 dark:text-green-200">Submissions:</span>
                              <span className="text-lg font-black text-green-600 dark:text-green-400">
                                {stats.submitted}
                              </span>
                              <span className="text-sm font-bold text-green-900 dark:text-green-200">/</span>
                              <span className="text-lg font-black text-green-900 dark:text-green-200">
                                {stats.total}
                              </span>
                            </div>

                            {/* Pending Count */}
                            {stats.pending > 0 && (
                              <span className="px-4 py-2 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-xl text-sm font-black shadow border-2 border-amber-200 dark:border-amber-800">
                                {stats.pending} pending
                              </span>
                            )}

                            {/* Due Date */}
                            {assignment.dueDate && (
                              <span
                                className={`px-4 py-2 rounded-xl text-sm font-black shadow border-2 ${
                                  overdue
                                    ? 'bg-red-100 text-red-800 border-red-200'
                                    : 'bg-blue-100 text-blue-800 border-blue-200'
                                }`}
                              >
                                {overdue ? '⚠️ ' : '📅 '}
                                {formatDueDate(assignment.dueDate)}
                              </span>
                            )}

                            {/* Target Info */}
                            {assignment.targetSport && (
                              <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-xl text-sm font-black shadow border-2 border-purple-200">
                                {assignment.targetSport}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      <svg
                        className="w-6 h-6 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Create Assignment Modal */}
        {showCreateModal && (
          <CreateAssignmentModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadAssignments();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Create Assignment Modal Component
function CreateAssignmentModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    targetSport: '',
    assignToAll: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.description) {
      setError('Title and description are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate || undefined,
        targetSport: formData.targetSport || undefined,
      };

      // If assign to all, set targetAthleteIds to null
      if (formData.assignToAll) {
        payload.targetAthleteIds = null;
      }

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create assignment');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-100">
        <div className="p-8 border-b-2 border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create Assignment
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Pre-Game Visualization Exercise"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={4}
              placeholder="Describe what you want your athletes to reflect on or do..."
              required
            />
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-muted-foreground mb-1">
              Due Date (Optional)
            </label>
            <input
              type="datetime-local"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Target Sport */}
          <div>
            <label htmlFor="targetSport" className="block text-sm font-medium text-muted-foreground mb-1">
              Target Sport (Optional)
            </label>
            <input
              type="text"
              id="targetSport"
              value={formData.targetSport}
              onChange={(e) => setFormData({ ...formData, targetSport: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Basketball, Soccer, Tennis (leave blank for all sports)"
            />
          </div>

          {/* Assign to All Checkbox */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="assignToAll"
              checked={formData.assignToAll}
              onChange={(e) => setFormData({ ...formData, assignToAll: e.target.checked })}
              className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-border rounded"
            />
            <label htmlFor="assignToAll" className="ml-2 block text-sm text-muted-foreground">
              Assign to all athletes
              {formData.targetSport && (
                <span className="text-muted-foreground"> in {formData.targetSport}</span>
              )}
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold text-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform"
            >
              {isSubmitting ? 'Creating...' : '✅ Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
