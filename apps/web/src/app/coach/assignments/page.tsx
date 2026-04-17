'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  ChevronRight,
  Calendar,
  Users,
  AlertCircle,
  X,
  Loader2,
  BarChart3,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';

/**
 * Coach Assignments Page - Two-Column Layout
 *
 * Features:
 * - Create and manage assignments for athletes
 * - Track submission status
 * - Overview sidebar with stats, quick create, and tips
 */

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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [isQuickCreating, setIsQuickCreating] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

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
    const submitted = submissions.filter((s) => s.status !== 'PENDING').length;
    const pending = total - submitted;
    return { total, submitted, pending };
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Derived stats for overview
  const totalAssignments = assignments.length;
  const totalSubmissions = assignments.reduce((acc, a) => {
    const stats = getSubmissionStats(a);
    return acc + stats.submitted;
  }, 0);
  const totalExpected = assignments.reduce((acc, a) => {
    const stats = getSubmissionStats(a);
    return acc + stats.total;
  }, 0);
  const overdueCount = assignments.filter((a) => isOverdue(a.dueDate)).length;
  const submissionPercent =
    totalExpected > 0 ? Math.round((totalSubmissions / totalExpected) * 100) : 0;

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError(null);

    if (!quickTitle.trim() || !quickDescription.trim()) {
      setQuickError('Title and description are required');
      return;
    }

    setIsQuickCreating(true);

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickTitle.trim(),
          description: quickDescription.trim(),
          targetAthleteIds: null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create assignment');
      }

      setQuickTitle('');
      setQuickDescription('');
      loadAssignments();
    } catch (err: any) {
      setQuickError(err.message || 'Failed to create assignment');
    } finally {
      setIsQuickCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Page Title */}
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2 mb-6">
          <ClipboardList className="w-7 h-7 text-primary" />
          Assignments
        </h1>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Assignments
              </h2>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Assignment
              </Button>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="rounded-xl border bg-card p-12 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">
                  Loading assignments...
                </p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="rounded-xl border bg-card p-12 text-center">
                <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">
                  No assignments yet
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first assignment to get started with athlete
                  check-ins and journaling.
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create First Assignment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => {
                  const stats = getSubmissionStats(assignment);
                  const overdue = isOverdue(assignment.dueDate);

                  return (
                    <Link
                      key={assignment.id}
                      href={`/coach/assignments/${assignment.id}`}
                      className="block rounded-xl border bg-card p-5 hover:shadow-sm transition"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <ClipboardList className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground mb-1">
                                {assignment.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {assignment.description}
                              </p>

                              <div className="flex flex-wrap items-center gap-2">
                                {/* Submission Stats */}
                                <div className="flex items-center gap-1 px-2 py-1 rounded bg-risk-green/10 text-risk-green">
                                  <Users className="w-3 h-3" />
                                  <span className="text-xs font-medium">
                                    {stats.submitted}/{stats.total} submitted
                                  </span>
                                </div>

                                {/* Pending Count */}
                                {stats.pending > 0 && (
                                  <span className="px-2 py-1 rounded bg-warning/10 text-warning text-xs font-medium">
                                    {stats.pending} pending
                                  </span>
                                )}

                                {/* Due Date */}
                                {assignment.dueDate && (
                                  <span
                                    className={cn(
                                      'px-2 py-1 rounded text-xs font-medium flex items-center gap-1',
                                      overdue
                                        ? 'bg-risk-red/10 text-risk-red'
                                        : 'bg-info/10 text-info'
                                    )}
                                  >
                                    <Calendar className="w-3 h-3" />
                                    {formatDueDate(assignment.dueDate)}
                                  </span>
                                )}

                                {/* Target Sport */}
                                {assignment.targetSport && (
                                  <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-medium">
                                    {assignment.targetSport}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-2" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                Overview
              </h3>

              <div className="space-y-4">
                {/* Total Assignments */}
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {totalAssignments}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total assignments
                  </p>
                </div>

                {/* Submissions Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Submissions</span>
                    <span className="font-medium text-foreground">
                      {totalSubmissions} / {totalExpected}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${submissionPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {submissionPercent}% complete
                  </p>
                </div>

                {/* Overdue */}
                <div
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2',
                    overdueCount > 0
                      ? 'bg-risk-red/10 text-risk-red'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <span className="text-sm font-medium">Overdue</span>
                  <span className="text-sm font-bold">{overdueCount}</span>
                </div>
              </div>
            </div>

            {/* Quick Create Card */}
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                Quick Create
              </h3>

              <form onSubmit={handleQuickCreate} className="space-y-3">
                {quickError && (
                  <div className="p-2 rounded-lg bg-risk-red/10 border border-risk-red/30 flex items-center gap-2 text-xs text-risk-red">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {quickError}
                  </div>
                )}

                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
                  placeholder="Title"
                />
                <textarea
                  value={quickDescription}
                  onChange={(e) => setQuickDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground resize-none"
                  rows={3}
                  placeholder="Description"
                />
                <Button
                  type="submit"
                  disabled={isQuickCreating}
                  className="w-full flex items-center justify-center gap-2"
                  size="sm"
                >
                  {isQuickCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  Advanced...
                </button>
              </form>
            </div>

            {/* Tips Card */}
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-primary" />
                Tips
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 block w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                  Keep assignments focused on a single reflection or exercise
                  for higher completion rates.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 block w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                  Set due dates to create gentle accountability without added
                  pressure.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 block w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                  Use sport-specific assignments to tailor mental training to
                  each team.
                </li>
              </ul>
            </div>
          </div>
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
    </div>
  );
}

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
      <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Create Assignment
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-risk-red/10 border border-risk-red/30 flex items-center gap-2 text-sm text-risk-red">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-foreground"
            >
              Title <span className="text-risk-red">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
              placeholder="e.g., Pre-Game Visualization Exercise"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground"
            >
              Description <span className="text-risk-red">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground resize-none"
              rows={4}
              placeholder="Describe what you want your athletes to reflect on or do..."
              required
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label
              htmlFor="dueDate"
              className="block text-sm font-medium text-foreground"
            >
              Due Date{' '}
              <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>
            <input
              type="datetime-local"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            />
          </div>

          {/* Target Sport */}
          <div className="space-y-2">
            <label
              htmlFor="targetSport"
              className="block text-sm font-medium text-foreground"
            >
              Target Sport{' '}
              <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              id="targetSport"
              value={formData.targetSport}
              onChange={(e) =>
                setFormData({ ...formData, targetSport: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
              placeholder="e.g., Basketball, Soccer (leave blank for all)"
            />
          </div>

          {/* Assign to All */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <input
              type="checkbox"
              id="assignToAll"
              checked={formData.assignToAll}
              onChange={(e) =>
                setFormData({ ...formData, assignToAll: e.target.checked })
              }
              className="mt-0.5 h-4 w-4 text-primary focus:ring-primary border-border rounded"
            />
            <label htmlFor="assignToAll" className="text-sm text-foreground">
              Assign to all athletes
              {formData.targetSport && (
                <span className="text-muted-foreground">
                  {' '}
                  in {formData.targetSport}
                </span>
              )}
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Assignment'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
