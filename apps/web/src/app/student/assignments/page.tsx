'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  Send,
  FileText,
  Loader2,
} from 'lucide-react';
import { Card, Button, AnimatedCounter, Badge } from '@/design-system/components';
import { fadeInUp, staggerContainer } from '@/design-system/motion';
import { toast } from 'sonner';

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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const profileResponse = await fetch('/api/athlete/profile');
      const profileData = await profileResponse.json();

      if (!profileData.success || !profileData.data?.userId) {
        console.log('No user session found');
        setAssignments([]);
        return;
      }

      const userId = profileData.data.userId;

      // Fetch assignments from API
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
    } catch (err) {
      console.error('Error loading assignments:', error);
      setError('Failed to load assignments');
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
        headers: {
          'Content-Type': 'application/json',
        },
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
        toast.success('Assignment submitted successfully');
        await loadAssignments();
        handleBack();
      } else {
        throw new Error(data.error || 'Failed to submit');
      }
    } catch (err) {
      console.error('Error submitting assignment:', err);
      toast.error('Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
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

  const getStatusInfo = (status: AssignmentStatus) => {
    switch (status) {
      case 'PENDING':
        return { text: 'Not Submitted', variant: 'secondary' as const };
      case 'SUBMITTED':
        return { text: 'Submitted', variant: 'success' as const };
      case 'REVIEWED':
        return { text: 'Reviewed', variant: 'primary' as const };
      default:
        return { text: status, variant: 'secondary' as const };
    }
  };

  const pendingAssignments = assignments.filter(
    (a) => !a.submissions || a.submissions.length === 0 || a.submissions[0].status === 'PENDING'
  );
  const submittedAssignments = assignments.filter(
    (a) => a.submissions && a.submissions.length > 0 && a.submissions[0].status !== 'PENDING'
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 dark:text-primary-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400 font-body">Loading assignments...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Card variant="elevated" padding="xl" className="text-center">
          <AlertTriangle className="w-16 h-16 text-danger-600 dark:text-danger-400 mx-auto mb-6" />
          <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Failed to load assignments
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-body mb-8">{error}</p>
          <Button onClick={loadAssignments} variant="primary" size="lg">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  // Assignment Detail View
  if (selectedAssignment) {
    const submission = selectedAssignment.submissions?.[0];
    const status = submission?.status || 'PENDING';
    const statusInfo = getStatusInfo(status);
    const isSubmitted = status !== 'PENDING';
    const overdue = isOverdue(selectedAssignment.dueDate);

    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-8">
          {/* Back Button */}
          <motion.div variants={fadeInUp}>
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="gap-2"
              icon={<ChevronLeft className="w-5 h-5" />}
            >
              Back to Assignments
            </Button>
          </motion.div>

          {/* Assignment Details */}
          <motion.div variants={fadeInUp}>
            <Card variant="elevated" padding="xl">
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
                    {selectedAssignment.title}
                  </h1>
                  <p className="text-lg text-gray-700 dark:text-gray-300 font-body leading-relaxed">
                    {selectedAssignment.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>

                  {selectedAssignment.dueDate && (
                    <div
                      className={`flex items-center gap-2 text-sm font-body font-semibold ${
                        overdue
                          ? 'text-danger-700 dark:text-danger-300'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {overdue ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      {formatDueDate(selectedAssignment.dueDate)}
                    </div>
                  )}

                  {submission?.submittedAt && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-body font-semibold">
                      Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Response Editor */}
          <motion.div variants={fadeInUp}>
            <Card variant="elevated" padding="xl">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">
                    Your Response
                  </h2>
                  {isSubmitted && (
                    <p className="text-base text-gray-600 dark:text-gray-400 font-body">
                      You can edit and resubmit if needed
                    </p>
                  )}
                </div>

                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter your response here..."
                  className="w-full min-h-[300px] px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-body text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all"
                  disabled={isSubmitting}
                />

                <div className="flex gap-4">
                  <Button onClick={handleBack} variant="secondary" size="lg" className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    variant="primary"
                    size="lg"
                    className="flex-1 gap-2"
                    disabled={isSubmitting || !responseText.trim()}
                    icon={
                      isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )
                    }
                  >
                    {isSubmitting ? 'Submitting...' : isSubmitted ? 'Update Response' : 'Submit'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Assignment List View
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-10">
        {/* Header */}
        <motion.div variants={fadeInUp}>
          <h1 className="text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Assignments
          </h1>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-4xl font-display font-bold text-primary-600 dark:text-primary-400">
                <AnimatedCounter value={pendingAssignments.length} decimals={0} />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider font-semibold">
                Pending
              </div>
            </div>
            <div>
              <div className="text-4xl font-display font-bold text-success-600 dark:text-success-400">
                <AnimatedCounter value={submittedAssignments.length} decimals={0} />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-body uppercase tracking-wider font-semibold">
                Completed
              </div>
            </div>
          </div>
        </motion.div>

        {/* Empty State */}
        {assignments.length === 0 && (
          <motion.div variants={fadeInUp}>
            <Card variant="elevated" padding="xl" className="text-center">
              <ClipboardList className="w-24 h-24 text-gray-400 dark:text-gray-600 mx-auto mb-6" />
              <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
                No assignments yet
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 font-body">
                Assignments from your coach will appear here
              </p>
            </Card>
          </motion.div>
        )}

        {/* Pending Assignments */}
        {pendingAssignments.length > 0 && (
          <motion.div variants={fadeInUp} className="space-y-6">
            <h2 className="text-xs font-body font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Pending
            </h2>
            <div className="space-y-4">
              {pendingAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onPress={() => handleSelectAssignment(assignment)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Submitted Assignments */}
        {submittedAssignments.length > 0 && (
          <motion.div variants={fadeInUp} className="space-y-6">
            <h2 className="text-xs font-body font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Completed
            </h2>
            <div className="space-y-4">
              {submittedAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onPress={() => handleSelectAssignment(assignment)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Tips */}
        {assignments.length > 0 && (
          <motion.div variants={fadeInUp}>
            <Card variant="elevated" padding="lg" className="border-l-4 border-primary-600 dark:border-primary-400">
              <div className="flex items-start gap-4">
                <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
                <div className="space-y-3">
                  <h3 className="text-lg font-display font-bold text-gray-900 dark:text-white">Assignment Tips</h3>
                  <ul className="space-y-2 text-base text-gray-700 dark:text-gray-300 font-body">
                    <li className="flex items-start gap-3">
                      <span className="text-primary-600 dark:text-primary-400 font-bold mt-0.5">•</span>
                      <span>Be honest and specific in your responses</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary-600 dark:text-primary-400 font-bold mt-0.5">•</span>
                      <span>Include concrete examples and details</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary-600 dark:text-primary-400 font-bold mt-0.5">•</span>
                      <span>Take your time for thoughtful reflection</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function AssignmentCard({ assignment, onPress }: { assignment: Assignment; onPress: () => void }) {
  const submission = assignment.submissions?.[0];
  const status = submission?.status || 'PENDING';
  const isPending = status === 'PENDING';
  const overdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusInfo = (status: AssignmentStatus) => {
    switch (status) {
      case 'PENDING':
        return { text: 'Not Submitted', variant: 'secondary' as const };
      case 'SUBMITTED':
        return { text: 'Submitted', variant: 'success' as const };
      case 'REVIEWED':
        return { text: 'Reviewed', variant: 'primary' as const };
      default:
        return { text: status, variant: 'secondary' as const };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <Card variant="elevated" padding="lg" hover className="cursor-pointer" onClick={onPress}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4 flex-1">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isPending
                ? 'bg-warning-100 dark:bg-warning-900/30'
                : 'bg-success-100 dark:bg-success-900/30'
            }`}
          >
            {isPending ? (
              <ClipboardList className="w-6 h-6 text-warning-700 dark:text-warning-300" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-success-700 dark:text-success-300" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">
              {assignment.title}
            </h3>
            <p className="text-base text-gray-700 dark:text-gray-300 font-body line-clamp-2 mb-3">
              {assignment.description}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>

              {assignment.dueDate && (
                <div
                  className={`flex items-center gap-2 text-sm font-body font-semibold ${
                    overdue ? 'text-danger-700 dark:text-danger-300' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {overdue ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  {formatDueDate(assignment.dueDate)}
                </div>
              )}
            </div>
          </div>
        </div>

        <ChevronLeft className="w-6 h-6 text-gray-400 dark:text-gray-600 flex-shrink-0 rotate-180" />
      </div>
    </Card>
  );
}
