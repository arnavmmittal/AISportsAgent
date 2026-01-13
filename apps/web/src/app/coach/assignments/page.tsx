'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList, Plus, ChevronRight, Calendar, Users, AlertCircle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';

/**
 * Coach Assignments Page - Updated with Design System v2.0
 *
 * Features:
 * - Create and manage assignments for athletes
 * - Track submission status
 * - Filter by sport and due date
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-primary" />
              Assignments
            </h1>
            <p className="text-muted-foreground mt-1">Create and manage assignments for your athletes</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Assignment
          </Button>
        </header>

        {/* Main Content */}
        {isLoading ? (
          <div className="card-elevated p-12 text-center animate-slide-up">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="card-elevated p-12 text-center animate-slide-up">
            <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">No assignments yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first assignment to get started with athlete check-ins and journaling.
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Create First Assignment
            </Button>
          </div>
        ) : (
          <div className="space-y-3 animate-slide-up">
            {assignments.map((assignment) => {
              const stats = getSubmissionStats(assignment);
              const overdue = isOverdue(assignment.dueDate);

              return (
                <Link
                  key={assignment.id}
                  href={`/coach/assignments/${assignment.id}`}
                  className="block card-interactive p-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <ClipboardList className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-1">{assignment.title}</h3>
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
            <label htmlFor="title" className="block text-sm font-medium text-foreground">
              Title <span className="text-risk-red">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
              placeholder="e.g., Pre-Game Visualization Exercise"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-foreground">
              Description <span className="text-risk-red">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground resize-none"
              rows={4}
              placeholder="Describe what you want your athletes to reflect on or do..."
              required
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label htmlFor="dueDate" className="block text-sm font-medium text-foreground">
              Due Date <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>
            <input
              type="datetime-local"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            />
          </div>

          {/* Target Sport */}
          <div className="space-y-2">
            <label htmlFor="targetSport" className="block text-sm font-medium text-foreground">
              Target Sport <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              id="targetSport"
              value={formData.targetSport}
              onChange={(e) => setFormData({ ...formData, targetSport: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, assignToAll: e.target.checked })}
              className="mt-0.5 h-4 w-4 text-primary focus:ring-primary border-border rounded"
            />
            <label htmlFor="assignToAll" className="text-sm text-foreground">
              Assign to all athletes
              {formData.targetSport && (
                <span className="text-muted-foreground"> in {formData.targetSport}</span>
              )}
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
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
