'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Textarea } from '@/components/shared/ui/textarea';
import { Badge } from '@/components/shared/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  Send,
  FileText,
  Calendar,
} from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = () => {
    // Mock assignments data
    const mockAssignments: Assignment[] = [
      {
        id: '1',
        title: 'Pre-Game Visualization Exercise',
        description:
          'Describe your ideal pre-game mental preparation routine. Include specific visualization techniques, breathing exercises, and mental cues you would use. Aim for 200-300 words.',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        submissions: [],
      },
      {
        id: '2',
        title: 'Thought Record Journal',
        description:
          'Complete a thought record for a recent challenging situation. Identify the trigger, your automatic thoughts, emotions, and more balanced alternative thoughts.',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        submissions: [],
      },
      {
        id: '3',
        title: 'Performance Reflection',
        description:
          'Reflect on your last game or competition. What went well? What could be improved? What mental strategies helped or hindered your performance?',
        dueDate: null,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        submissions: [
          {
            id: 's1',
            status: 'SUBMITTED',
            response:
              'Last game I noticed I was getting too anxious before free throws. I tried the breathing technique we discussed and it really helped calm my nerves. My shooting percentage improved from 65% to 78%.',
            submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      },
    ];
    setAssignments(mockAssignments);
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
      // TODO: Replace with actual API call
      // await apiClient.submitAssignment(selectedAssignment.id, responseText);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update assignments list
      setAssignments(
        assignments.map((a) => {
          if (a.id === selectedAssignment.id) {
            return {
              ...a,
              submissions: [
                {
                  id: `sub_${Date.now()}`,
                  status: 'SUBMITTED' as AssignmentStatus,
                  response: responseText,
                  submittedAt: new Date().toISOString(),
                },
              ],
            };
          }
          return a;
        })
      );

      toast.success('Assignment submitted successfully!');
      handleBack();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-muted/20 text-muted-foreground';
      case 'SUBMITTED':
        return 'bg-secondary/20 text-secondary';
      case 'REVIEWED':
        return 'bg-accent/20 text-secondary';
      default:
        return 'bg-muted text-gray-800';
    }
  };

  const getStatusText = (status: AssignmentStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Not Submitted';
      case 'SUBMITTED':
        return 'Submitted';
      case 'REVIEWED':
        return 'Reviewed';
      default:
        return status;
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
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const pendingAssignments = assignments.filter(
    (a) => !a.submissions || a.submissions.length === 0 || a.submissions[0].status === 'PENDING'
  );
  const submittedAssignments = assignments.filter(
    (a) => a.submissions && a.submissions.length > 0 && a.submissions[0].status !== 'PENDING'
  );

  // Assignment Detail View
  if (selectedAssignment) {
    const submission = selectedAssignment.submissions?.[0];
    const status = submission?.status || 'PENDING';
    const isSubmitted = status !== 'PENDING';

    return (
      <div className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Assignments
          </button>

          {/* Assignment Details Card */}
          <div className="bg-gradient-to-br from-accent/20 to-accent/30 rounded-2xl shadow-xl p-8 border-2 border-accent/20">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-secondary">
                {selectedAssignment.title}
              </h2>
              {selectedAssignment.dueDate && (
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black shadow ${
                    isOverdue(selectedAssignment.dueDate)
                      ? 'bg-muted-foreground/20 text-muted-foreground border-2 border-muted-foreground'
                      : 'bg-muted/20 text-muted-foreground border-2 border-muted'
                  }`}
                >
                  {isOverdue(selectedAssignment.dueDate) ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                  {formatDueDate(selectedAssignment.dueDate)}
                </div>
              )}

              <p className="text-secondary leading-relaxed text-lg font-semibold">
                {selectedAssignment.description}
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <span className={`px-4 py-2 rounded-xl text-sm font-black shadow border-2 ${
                  status === 'PENDING'
                    ? 'bg-muted/20 text-muted-foreground border-muted'
                    : status === 'SUBMITTED'
                    ? 'bg-secondary/20 text-secondary border-secondary/20'
                    : 'bg-accent/20 text-secondary border-accent/20'
                }`}>
                  {getStatusText(status)}
                </span>
                {submission?.submittedAt && (
                  <span className="text-base text-secondary font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Response Card */}
          <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="p-8 border-b-2 border-gray-100 dark:border-gray-700">
              <h3 className="text-2xl font-black text-foreground">Your Response</h3>
              {isSubmitted && (
                <p className="text-base text-muted-foreground mt-2 font-semibold">
                  You can edit and resubmit if needed
                </p>
              )}
            </div>
            <div className="p-8 space-y-6">
              <Textarea
                value={responseText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponseText(e.target.value)}
                placeholder="Enter your response here..."
                className="min-h-[250px] resize-none text-base font-medium"
                disabled={isSubmitting}
              />

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 px-6 py-4 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold text-lg disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !responseText.trim()}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {isSubmitted ? 'Update Response' : 'Submit'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Assignment List View
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Assignments
          </h1>
          <p className="mt-3 text-muted-foreground dark:text-gray-400 text-lg">
            {pendingAssignments.length} pending task
            {pendingAssignments.length !== 1 ? 's' : ''}
          </p>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl p-16 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-8xl mb-6">📋</div>
            <h3 className="text-3xl font-black text-foreground mb-4">No tasks yet</h3>
            <p className="text-lg text-muted-foreground">
              Tasks from your coach will appear here
            </p>
          </div>
        ) : (
        <>
          {/* Pending Assignments */}
          {pendingAssignments.length > 0 && (
            <div className="space-y-6 mb-10">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-wide">
                Pending
              </h2>
              {pendingAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onPress={() => handleSelectAssignment(assignment)}
                />
              ))}
            </div>
          )}

          {/* Submitted Assignments */}
          {submittedAssignments.length > 0 && (
            <div className="space-y-6 mb-10">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-wide">
                Completed
              </h2>
              {submittedAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onPress={() => handleSelectAssignment(assignment)}
                />
              ))}
            </div>
          )}
        </>
      )}

        {/* Tips Card */}
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl shadow-xl p-8 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-blue-900 mb-4">Assignment Tips</h3>
              <ul className="space-y-3 text-blue-800 font-semibold">
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-black text-xl mt-0.5">•</span>
                  <span>
                    <strong className="font-black">Be honest:</strong> Your responses help your coach understand how to
                    support you better
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-black text-xl mt-0.5">•</span>
                  <span>
                    <strong className="font-black">Be specific:</strong> Include concrete examples and details
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-black text-xl mt-0.5">•</span>
                  <span>
                    <strong className="font-black">Take your time:</strong> Thoughtful reflection leads to better insights
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-black text-xl mt-0.5">•</span>
                  <span>
                    <strong className="font-black">Ask questions:</strong> Use assignments as opportunities to discuss
                    challenges with your coach
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-muted/20 text-muted-foreground';
      case 'SUBMITTED':
        return 'bg-secondary/20 text-secondary';
      case 'REVIEWED':
        return 'bg-accent/20 text-secondary';
      default:
        return 'bg-muted text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Not Submitted';
      case 'SUBMITTED':
        return 'Submitted';
      case 'REVIEWED':
        return 'Reviewed';
      default:
        return status;
    }
  };

  return (
    <div
      className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 cursor-pointer hover:shadow-2xl transition-all hover:scale-[1.02]"
      onClick={onPress}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-6 flex-1">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              isPending
                ? 'bg-gradient-to-br from-amber-500 to-amber-600'
                : 'bg-gradient-to-br from-secondary to-secondary'
            }`}
          >
            {isPending ? (
              <ClipboardList className="w-8 h-8 text-white" />
            ) : (
              <CheckCircle className="w-8 h-8 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-black text-foreground mb-2">{assignment.title}</h3>
            <p className="text-base text-muted-foreground dark:text-gray-400 line-clamp-2 mb-4 font-semibold">
              {assignment.description}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-4 py-2 rounded-xl text-sm font-black shadow border-2 ${
                status === 'PENDING'
                  ? 'bg-muted/20 text-muted-foreground border-muted'
                  : status === 'SUBMITTED'
                  ? 'bg-secondary/20 text-secondary border-secondary/20'
                  : 'bg-accent/20 text-secondary border-accent/20'
              }`}>
                {getStatusText(status)}
              </span>

              {assignment.dueDate && (
                <div
                  className={`flex items-center gap-2 text-sm font-bold ${
                    isOverdueFlag ? 'text-muted-foreground' : 'text-gray-600'
                  }`}
                >
                  {isOverdueFlag ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  {formatDueDate(assignment.dueDate)}
                </div>
              )}
            </div>
          </div>
        </div>

        <svg
          className="w-6 h-6 text-muted-foreground flex-shrink-0"
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
  );
}
