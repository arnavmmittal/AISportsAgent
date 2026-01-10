'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Clock, CheckCircle2, AlertCircle, Calendar, Users, Loader2, X, Plus } from 'lucide-react';
import { Card } from '@/design-system/components';
import { Button } from '@/design-system/components/Button';
import { AnimatedCounter } from '@/design-system/components';

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
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/assignments');
      if (!response.ok) throw new Error('Failed to load assignments');
      const data = await response.json();
      setAssignments(data.assignments || []);
      setError(null);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setError('Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const getSubmissionStats = (assignment: Assignment) => {
    const submissions = assignment.submissions || [];
    const total = submissions.length;
    const submitted = submissions.filter(s => s.status !== 'PENDING').length;
    const pending = total - submitted;
    const completionRate = total > 0 ? Math.round((submitted / total) * 100) : 0;
    return { total, submitted, pending, completionRate };
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const filteredAssignments = assignments.filter(assignment => {
    const stats = getSubmissionStats(assignment);
    const overdue = isOverdue(assignment.dueDate);

    if (filter === 'all') return true;
    if (filter === 'active') return stats.pending > 0 && !overdue;
    if (filter === 'completed') return stats.pending === 0;
    if (filter === 'overdue') return overdue && stats.pending > 0;
    return true;
  });

  const totalAssignments = assignments.length;
  const activeCount = assignments.filter(a => {
    const stats = getSubmissionStats(a);
    return stats.pending > 0 && !isOverdue(a.dueDate);
  }).length;
  const completedCount = assignments.filter(a => {
    const stats = getSubmissionStats(a);
    return stats.pending === 0;
  }).length;
  const overdueCount = assignments.filter(a => {
    const stats = getSubmissionStats(a);
    return isOverdue(a.dueDate) && stats.pending > 0;
  }).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-body">Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Card variant="elevated" padding="lg" className="max-w-md text-center border-danger-200 dark:border-danger-800">
          <AlertCircle className="w-16 h-16 text-danger-600 dark:text-danger-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-danger-700 dark:text-danger-300 mb-2">{error}</h2>
          <p className="text-gray-600 dark:text-gray-400 font-body mb-6">Please try again later</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Assignments
            </h1>
            <p className="mt-3 text-gray-600 dark:text-gray-400 text-lg font-body">
              Create and manage assignments for your athletes
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Plus className="w-5 h-5" />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Assignment
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card variant="elevated" padding="lg" hover>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Total</div>
                <div className="text-5xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
                  <AnimatedCounter value={totalAssignments} decimals={0} />
                </div>
                <div className="text-sm text-primary-600 dark:text-primary-400 font-medium font-body">Assignments</div>
              </div>
              <FileText className="w-16 h-16 text-primary-600 dark:text-primary-400 opacity-80" />
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hover className="border-info-200 dark:border-info-800/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-info-600 dark:text-info-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Active</div>
                <div className="text-5xl font-display font-bold text-info-700 dark:text-info-300 mb-2">
                  <AnimatedCounter value={activeCount} decimals={0} />
                </div>
                <div className="text-sm text-info-600 dark:text-info-400 font-medium font-body">In progress</div>
              </div>
              <Clock className="w-16 h-16 text-info-600 dark:text-info-400 opacity-80" />
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hover className="border-success-200 dark:border-success-800/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-success-600 dark:text-success-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Completed</div>
                <div className="text-5xl font-display font-bold text-success-700 dark:text-success-300 mb-2">
                  <AnimatedCounter value={completedCount} decimals={0} />
                </div>
                <div className="text-sm text-success-600 dark:text-success-400 font-medium font-body">Fully submitted</div>
              </div>
              <CheckCircle2 className="w-16 h-16 text-success-600 dark:text-success-400 opacity-80" />
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hover className="border-danger-200 dark:border-danger-800/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-danger-600 dark:text-danger-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Overdue</div>
                <div className="text-5xl font-display font-bold text-danger-700 dark:text-danger-300 mb-2">
                  <AnimatedCounter value={overdueCount} decimals={0} />
                </div>
                <div className="text-sm text-danger-600 dark:text-danger-400 font-medium font-body">Need attention</div>
              </div>
              <AlertCircle className="w-16 h-16 text-danger-600 dark:text-danger-400 opacity-80" />
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Card variant="elevated" padding="none" className="mb-8">
          <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="md"
              onClick={() => setFilter('all')}
            >
              All ({totalAssignments})
            </Button>
            <Button
              variant={filter === 'active' ? 'secondary' : 'outline'}
              size="md"
              onClick={() => setFilter('active')}
              leftIcon={<Clock className="w-4 h-4" />}
            >
              Active ({activeCount})
            </Button>
            <Button
              variant={filter === 'completed' ? 'success' : 'outline'}
              size="md"
              onClick={() => setFilter('completed')}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Completed ({completedCount})
            </Button>
            <Button
              variant={filter === 'overdue' ? 'danger' : 'outline'}
              size="md"
              onClick={() => setFilter('overdue')}
              leftIcon={<AlertCircle className="w-4 h-4" />}
            >
              Overdue ({overdueCount})
            </Button>
          </div>

          {/* Assignments List */}
          <div className="p-6">
            {filteredAssignments.length === 0 ? (
              <div className="p-16 text-center">
                <FileText className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {assignments.length === 0 ? 'No assignments yet' : 'No assignments found'}
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 font-body mb-8 max-w-md mx-auto">
                  {assignments.length === 0
                    ? 'Create your first assignment to get started with athlete check-ins and journaling.'
                    : `No ${filter} assignments at the moment.`
                  }
                </p>
                {assignments.length === 0 && (
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<Plus className="w-5 h-5" />}
                    onClick={() => setShowCreateModal(true)}
                  >
                    Create First Assignment
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => {
                  const stats = getSubmissionStats(assignment);
                  const overdue = isOverdue(assignment.dueDate);

                  return (
                    <Link
                      key={assignment.id}
                      href={`/coach/assignments/${assignment.id}`}
                      className="block"
                    >
                      <Card variant="elevated" padding="lg" hover className="transition-all">
                        <div className="flex items-start gap-6">
                          {/* Icon */}
                          <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${
                            overdue ? 'bg-danger-600 dark:bg-danger-500' :
                            stats.pending === 0 ? 'bg-success-600 dark:bg-success-500' :
                            'bg-primary-600 dark:bg-primary-500'
                          }`}>
                            {overdue ? (
                              <AlertCircle className="w-7 h-7 text-white" />
                            ) : stats.pending === 0 ? (
                              <CheckCircle2 className="w-7 h-7 text-white" />
                            ) : (
                              <FileText className="w-7 h-7 text-white" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
                              {assignment.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-base mb-4 line-clamp-2 font-body">
                              {assignment.description}
                            </p>

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-3">
                              {/* Completion Progress */}
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                                  <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono">
                                    {stats.submitted}/{stats.total}
                                  </span>
                                </div>
                                {stats.total > 0 && (
                                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                                    <span className={`text-sm font-bold font-mono ${
                                      stats.completionRate === 100 ? 'text-success-600 dark:text-success-400' :
                                      stats.completionRate >= 50 ? 'text-warning-600 dark:text-warning-400' :
                                      'text-danger-600 dark:text-danger-400'
                                    }`}>
                                      {stats.completionRate}%
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Due Date */}
                              {assignment.dueDate && (
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                                  overdue
                                    ? 'bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400'
                                    : 'bg-info-50 dark:bg-info-900/20 text-info-600 dark:text-info-400'
                                }`}>
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-sm font-bold font-body">
                                    {formatDueDate(assignment.dueDate)}
                                  </span>
                                </div>
                              )}

                              {/* Target Sport */}
                              {assignment.targetSport && (
                                <div className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-3 py-1.5 rounded-lg">
                                  <span className="text-sm font-bold font-body">{assignment.targetSport}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

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
      <Card variant="elevated" padding="none" className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-primary-600 dark:bg-primary-500">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-display font-bold text-white">
              Create Assignment
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-danger-50 dark:bg-danger-900/20 border-l-4 border-danger-600 dark:border-danger-500 p-4 rounded-r-lg">
              <p className="text-danger-700 dark:text-danger-300 font-semibold text-sm font-body">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-body">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow font-body"
              placeholder="e.g., Pre-Game Visualization Exercise"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-body">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow font-body"
              rows={4}
              placeholder="Describe what you want your athletes to reflect on or do..."
              required
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-body">
              Due Date (Optional)
            </label>
            <input
              type="datetime-local"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow font-body"
            />
          </div>

          <div>
            <label htmlFor="targetSport" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-body">
              Target Sport (Optional)
            </label>
            <input
              type="text"
              id="targetSport"
              value={formData.targetSport}
              onChange={(e) => setFormData({ ...formData, targetSport: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow font-body"
              placeholder="e.g., Basketball, Soccer, Tennis (leave blank for all sports)"
            />
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="assignToAll"
              checked={formData.assignToAll}
              onChange={(e) => setFormData({ ...formData, assignToAll: e.target.checked })}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-700 rounded"
            />
            <label htmlFor="assignToAll" className="ml-3 block text-sm text-gray-900 dark:text-gray-100 font-body">
              Assign to all athletes
              {formData.targetSport && (
                <span className="text-gray-600 dark:text-gray-400"> in {formData.targetSport}</span>
              )}
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<CheckCircle2 className="w-5 h-5" />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Assignment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
