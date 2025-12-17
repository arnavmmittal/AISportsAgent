'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
        return 'bg-yellow-100 text-yellow-800';
      case 'SUBMITTED':
        return 'bg-green-100 text-green-800';
      case 'REVIEWED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6 p-6">
        {/* Back Button */}
        <Button onClick={handleBack} variant="ghost" className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back to Tasks
        </Button>

        {/* Assignment Details Card */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedAssignment.title}
              </h2>
              {selectedAssignment.dueDate && (
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
                    isOverdue(selectedAssignment.dueDate)
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {isOverdue(selectedAssignment.dueDate) ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  {formatDueDate(selectedAssignment.dueDate)}
                </div>
              )}
            </div>

            <p className="text-gray-700 leading-relaxed">
              {selectedAssignment.description}
            </p>

            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(status)}>{getStatusText(status)}</Badge>
              {submission?.submittedAt && (
                <span className="text-sm text-gray-600">
                  Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Response Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Response</CardTitle>
            {isSubmitted && (
              <CardDescription className="text-blue-600">
                Tap to edit and resubmit if needed
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={responseText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponseText(e.target.value)}
              placeholder="Enter your response here..."
              className="min-h-[250px] resize-none"
              disabled={isSubmitting}
            />

            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !responseText.trim()}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
          </CardContent>
        </Card>
      </div>
      </DashboardLayout>
    );
  }

  // Assignment List View
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-purple-600" />
            Tasks
          </h1>
          <p className="text-gray-600 mt-1">
            {pendingAssignments.length} pending task
            {pendingAssignments.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600">
              Tasks from your coach will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pending Assignments */}
          {pendingAssignments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
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
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
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
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Task Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>Be honest:</strong> Your responses help your coach understand how to
                support you better
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>Be specific:</strong> Include concrete examples and details
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>Take your time:</strong> Thoughtful reflection leads to better insights
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>Ask questions:</strong> Use tasks as opportunities to discuss
                challenges with your coach
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
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
        return 'bg-yellow-100 text-yellow-800';
      case 'SUBMITTED':
        return 'bg-green-100 text-green-800';
      case 'REVIEWED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <Card
      className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01]"
      onClick={onPress}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isPending ? 'bg-yellow-100' : 'bg-green-100'
              }`}
            >
              {isPending ? (
                <ClipboardList className="w-6 h-6 text-yellow-600" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 mb-1">{assignment.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {assignment.description}
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={getStatusColor(status)}>{getStatusText(status)}</Badge>

                {assignment.dueDate && (
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      isOverdueFlag ? 'text-red-600 font-semibold' : 'text-gray-500'
                    }`}
                  >
                    {isOverdueFlag ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {formatDueDate(assignment.dueDate)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
