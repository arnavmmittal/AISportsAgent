'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/shared/ui/button';
import { Textarea } from '@/components/shared/ui/textarea';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  Send,
  FileText,
  Calendar,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Student Assignments Page - Updated with Design System v2.0
 *
 * Features:
 * - Clean card-based assignment list
 * - Status badges with semantic colors
 * - Due date indicators
 * - Submit/update responses
 */

type AssignmentStatus = 'PENDING' | 'SUBMITTED' | 'REVIEWED';

interface AssignmentSubmission {
  id: string;
  status: AssignmentStatus;
  response: string | null;
  submittedAt: string | null;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  createdAt: string;
  submissions: AssignmentSubmission[];
}

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const profileResponse = await fetch('/api/athlete/profile');
      const profileData = await profileResponse.json();

      if (!profileData.success || !profileData.data?.userId) {
        setAssignments([]);
        setIsLoading(false);
        return;
      }

      const userId = profileData.data.userId;
      const response = await fetch(`/api/assignments?athleteId=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }

      const data = await response.json();

      if (data.success) {
        const transformedAssignments: Assignment[] = data.data.map((assignment: any) => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate || null,
          createdAt: assignment.createdAt,
          submissions: assignment.submissions || [],
        }));
        setAssignments(transformedAssignments);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    if (assignment.submissions && assignment.submissions.length > 0) {
      setResponseText(assignment.submissions[0].response || '');
    } else {
      setResponseText('');
    }
  };

  const handleBack = () => {
    setSelectedAssignment(null);
    setResponseText('');
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;

    if (!responseText.trim()) {
      toast.error('Please enter your response before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          response: responseText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit assignment');
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Assignment submitted successfully!');
        await loadAssignments();
        handleBack();
      } else {
        throw new Error(data.error || 'Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusConfig = (status: AssignmentStatus) => {
    switch (status) {
      case 'PENDING':
        return { color: 'bg-warning/10 text-warning border-warning/20', text: 'Not Submitted' };
      case 'SUBMITTED':
        return { color: 'bg-success/10 text-success border-success/20', text: 'Submitted' };
      case 'REVIEWED':
        return { color: 'bg-primary/10 text-primary border-primary/20', text: 'Reviewed' };
      default:
        return { color: 'bg-muted text-muted-foreground border-border', text: status };
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return 'No due date';

    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const pendingAssignments = assignments.filter(
    (a) => !a.submissions || a.submissions.length === 0 || a.submissions[0].status === 'PENDING'
  );
  const submittedAssignments = assignments.filter(
    (a) => a.submissions && a.submissions.length > 0 && a.submissions[0].status !== 'PENDING'
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading assignments...</span>
        </div>
      </div>
    );
  }

  // Assignment Detail View
  if (selectedAssignment) {
    const submission = selectedAssignment.submissions?.[0];
    const status = submission?.status || 'PENDING';
    const statusConfig = getStatusConfig(status);
    const isSubmitted = status !== 'PENDING';

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Assignments
          </button>

          {/* Assignment Details Card */}
          <div className="card-elevated p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{selectedAssignment.title}</h2>

            <div className="flex items-center gap-3 flex-wrap">
              <span className={cn('px-3 py-1 text-sm font-medium rounded-full border', statusConfig.color)}>
                {statusConfig.text}
              </span>
              {selectedAssignment.dueDate && (
                <div
                  className={cn(
                    'flex items-center gap-1.5 text-sm',
                    isOverdue(selectedAssignment.dueDate) ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {isOverdue(selectedAssignment.dueDate) ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  {formatDueDate(selectedAssignment.dueDate)}
                </div>
              )}
              {submission?.submittedAt && (
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed">{selectedAssignment.description}</p>
          </div>

          {/* Response Card */}
          <div className="card-elevated overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium text-foreground">Your Response</h3>
              {isSubmitted && (
                <p className="text-sm text-muted-foreground mt-1">
                  You can edit and resubmit if needed
                </p>
              )}
            </div>
            <div className="p-4 space-y-4">
              <Textarea
                value={responseText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponseText(e.target.value)}
                placeholder="Enter your response here..."
                className="min-h-[200px] resize-none"
                disabled={isSubmitting}
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !responseText.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {isSubmitted ? 'Update Response' : 'Submit'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Assignment List View
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <header className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary" />
            Assignments
          </h1>
          <p className="text-muted-foreground mt-1">
            {pendingAssignments.length} pending task{pendingAssignments.length !== 1 ? 's' : ''}
          </p>
        </header>

        {assignments.length === 0 ? (
          <div className="card-elevated p-8 text-center animate-slide-up">
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="font-medium text-foreground mb-1">No tasks yet</h3>
            <p className="text-sm text-muted-foreground">Tasks from your coach will appear here</p>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up">
            {/* Pending Assignments */}
            {pendingAssignments.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Pending ({pendingAssignments.length})
                </h2>
                <div className="space-y-3">
                  {pendingAssignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onPress={() => handleSelectAssignment(assignment)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Submitted Assignments */}
            {submittedAssignments.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Completed ({submittedAssignments.length})
                </h2>
                <div className="space-y-3">
                  {submittedAssignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onPress={() => handleSelectAssignment(assignment)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Tips Card */}
        <section className="p-4 rounded-lg bg-info/5 border border-info/10 animate-slide-up">
          <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-info" />
            Assignment Tips
          </h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• <strong>Be honest:</strong> Your responses help your coach understand how to support you</li>
            <li>• <strong>Be specific:</strong> Include concrete examples and details</li>
            <li>• <strong>Take your time:</strong> Thoughtful reflection leads to better insights</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function AssignmentCard({
  assignment,
  onPress,
}: {
  assignment: Assignment;
  onPress: () => void;
}) {
  const submission = assignment.submissions?.[0];
  const status = submission?.status || 'PENDING';
  const isPending = status === 'PENDING';
  const isOverdueFlag = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { color: 'bg-warning/10 text-warning border-warning/20', text: 'Not Submitted' };
      case 'SUBMITTED':
        return { color: 'bg-success/10 text-success border-success/20', text: 'Submitted' };
      case 'REVIEWED':
        return { color: 'bg-primary/10 text-primary border-primary/20', text: 'Reviewed' };
      default:
        return { color: 'bg-muted text-muted-foreground border-border', text: status };
    }
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <button
      onClick={onPress}
      className="w-full card-interactive p-4 text-left"
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            isPending ? 'bg-warning/10' : 'bg-success/10'
          )}
        >
          {isPending ? (
            <ClipboardList className="w-5 h-5 text-warning" />
          ) : (
            <CheckCircle className="w-5 h-5 text-success" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground mb-1 truncate">{assignment.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{assignment.description}</p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border', statusConfig.color)}>
              {statusConfig.text}
            </span>

            {assignment.dueDate && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs',
                  isOverdueFlag ? 'text-destructive' : 'text-muted-foreground'
                )}
              >
                {isOverdueFlag ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {formatDueDate(assignment.dueDate)}
              </div>
            )}
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
}
