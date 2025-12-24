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
    const total = assignment.submissions.length;
    const submitted = assignment.submissions.filter(s => s.status !== 'PENDING').length;
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Assignments
              </h1>
              <p className="mt-2 text-muted-foreground">
                Create and manage assignments for your athletes
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              + Create Assignment
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-muted-foreground">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-card rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No assignments yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first assignment to get started with athlete check-ins and journaling.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Create First Assignment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const stats = getSubmissionStats(assignment);
              const overdue = isOverdue(assignment.dueDate);

              return (
                <Link
                  key={assignment.id}
                  href={`/coach/assignments/${assignment.id}`}
                  className="block bg-card rounded-lg shadow hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">📋</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {assignment.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {assignment.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            {/* Submission Stats */}
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Submissions:</span>
                              <span className="font-medium text-green-600">
                                {stats.submitted}
                              </span>
                              <span className="text-muted-foreground">/</span>
                              <span className="font-medium text-muted-foreground">
                                {stats.total}
                              </span>
                            </div>

                            {/* Pending Count */}
                            {stats.pending > 0 && (
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                {stats.pending} pending
                              </span>
                            )}

                            {/* Due Date */}
                            {assignment.dueDate && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  overdue
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {overdue ? '⚠️ ' : '📅 '}
                                {formatDueDate(assignment.dueDate)}
                              </span>
                            )}

                            {/* Target Info */}
                            {assignment.targetSport && (
                              <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
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
      </div>

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">
              Create Assignment
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-muted-foreground"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border text-muted-foreground rounded-lg hover:bg-background transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
