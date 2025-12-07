'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Save,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Brain,
  Dumbbell,
  Video,
  BookOpen,
  PenLine,
  Target,
  Sparkles,
} from 'lucide-react';

interface SubmissionDetail {
  submission: {
    id: string;
    status: string;
    response: any;
    timeSpent: number | null;
    startedAt: string | null;
    submittedAt: string | null;
    coachFeedback: string | null;
    coachRating: number | null;
    reviewedAt: string | null;
    assignment: {
      id: string;
      title: string;
      description: string;
      instructions: string;
      type: string;
      category: string;
      difficulty: string;
      estimatedTime: number;
      resources: any;
      dueDate: string;
      assignedDate: string;
      coachName: string;
    };
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

export default function AssignmentCompletionPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id as string;

  const [data, setData] = useState<SubmissionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  useEffect(() => {
    // Start timer when assignment is started
    if (data?.submission.status === 'NOT_STARTED' || data?.submission.status === 'IN_PROGRESS') {
      setStartTime(new Date());
    }
  }, [data]);

  const fetchSubmission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/athlete/assignments/${submissionId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch assignment');
      }

      const result = await response.json();
      setData(result);

      // Initialize responses from existing submission
      if (result.submission.response) {
        setResponses(result.submission.response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTimeSpent = (): number => {
    if (!startTime) return data?.submission.timeSpent || 0;
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffMinutes = Math.round(diffMs / 60000);
    return (data?.submission.timeSpent || 0) + diffMinutes;
  };

  const handleSaveProgress = async () => {
    if (!data) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const timeSpent = calculateTimeSpent();

      const response = await fetch(`/api/athlete/assignments/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          response: responses,
          timeSpent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save progress');
      }

      setSuccessMessage('Progress saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Refresh data
      await fetchSubmission();
      setStartTime(new Date()); // Reset timer
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save progress');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!data) return;

    // Validate responses
    if (Object.keys(responses).length === 0) {
      setError('Please complete the assignment before submitting');
      return;
    }

    if (!confirm('Are you sure you want to submit this assignment? You will not be able to edit it after submission.')) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const timeSpent = calculateTimeSpent();

      const response = await fetch(`/api/athlete/assignments/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SUBMITTED',
          response: responses,
          timeSpent,
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit assignment');
      }

      // Redirect back to assignments list with success message
      router.push('/athlete/assignments?success=submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Assignment</h2>
            <p className="text-red-800 mb-6">{error}</p>
            <Link
              href="/athlete/assignments"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assignments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { submission } = data!;
  const { assignment } = submission;
  const Icon = TYPE_ICONS[assignment.type] || Target;
  const isOverdue = new Date(assignment.dueDate) < new Date();
  const isCompleted = submission.status === 'SUBMITTED' || submission.status === 'REVIEWED';
  const canEdit = !isCompleted && !isOverdue;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/athlete/assignments"
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Assignments
          </Link>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-lg ${TYPE_COLORS[assignment.type]} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
                <p className="text-gray-600 mb-4">{assignment.description}</p>

                {/* Metadata */}
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    Coach: {assignment.coachName}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    {isOverdue && (
                      <span className="ml-2 text-red-600 font-medium">(Overdue)</span>
                    )}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Est. {assignment.estimatedTime} min
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    {assignment.difficulty}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {assignment.category}
                  </span>
                </div>

                {/* Status Badge */}
                {isCompleted && (
                  <div className="mt-4 flex items-center text-green-600">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    <span className="font-semibold">
                      Submitted on {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{assignment.instructions}</p>
          </div>

          {/* Resources */}
          {assignment.resources && Object.keys(assignment.resources).length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Resources</h3>
              {assignment.resources.videos && assignment.resources.videos.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Videos:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {assignment.resources.videos.map((url: string, i: number) => (
                      <li key={i}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {assignment.resources.links && assignment.resources.links.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Links:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {assignment.resources.links.map((url: string, i: number) => (
                      <li key={i}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Completion Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Response</h2>

          {assignment.type === 'REFLECTION' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Reflection
                </label>
                <textarea
                  value={responses.reflection || ''}
                  onChange={(e) => setResponses({ ...responses, reflection: e.target.value })}
                  disabled={!canEdit}
                  rows={8}
                  placeholder="Write your reflection here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          )}

          {assignment.type === 'JOURNALING' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Journal Entry
                </label>
                <textarea
                  value={responses.journal || ''}
                  onChange={(e) => setResponses({ ...responses, journal: e.target.value })}
                  disabled={!canEdit}
                  rows={10}
                  placeholder="Write freely about your thoughts and feelings..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          )}

          {assignment.type === 'EXERCISE' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Did you complete the exercise?
                </label>
                <select
                  value={responses.completed || ''}
                  onChange={(e) => setResponses({ ...responses, completed: e.target.value })}
                  disabled={!canEdit}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="partially">Partially</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How did it make you feel?
                </label>
                <textarea
                  value={responses.notes || ''}
                  onChange={(e) => setResponses({ ...responses, notes: e.target.value })}
                  disabled={!canEdit}
                  rows={6}
                  placeholder="Describe your experience..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          )}

          {assignment.type === 'READING' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Takeaways
                </label>
                <textarea
                  value={responses.takeaways || ''}
                  onChange={(e) => setResponses({ ...responses, takeaways: e.target.value })}
                  disabled={!canEdit}
                  rows={6}
                  placeholder="What were the main points you learned?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How will you apply this?
                </label>
                <textarea
                  value={responses.application || ''}
                  onChange={(e) => setResponses({ ...responses, application: e.target.value })}
                  disabled={!canEdit}
                  rows={4}
                  placeholder="How will you use this knowledge?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          )}

          {assignment.type === 'VIDEO_WATCH' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary of Video
                </label>
                <textarea
                  value={responses.summary || ''}
                  onChange={(e) => setResponses({ ...responses, summary: e.target.value })}
                  disabled={!canEdit}
                  rows={6}
                  placeholder="Summarize what you learned from the video..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          )}

          {assignment.type === 'GOAL_SETTING' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Statement
                </label>
                <input
                  type="text"
                  value={responses.goal || ''}
                  onChange={(e) => setResponses({ ...responses, goal: e.target.value })}
                  disabled={!canEdit}
                  placeholder="What is your goal?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Steps
                </label>
                <textarea
                  value={responses.actionSteps || ''}
                  onChange={(e) => setResponses({ ...responses, actionSteps: e.target.value })}
                  disabled={!canEdit}
                  rows={6}
                  placeholder="List the steps you'll take to achieve this goal..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          )}

          {assignment.type === 'MINDFULNESS' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={responses.duration || ''}
                  onChange={(e) => setResponses({ ...responses, duration: parseInt(e.target.value) })}
                  disabled={!canEdit}
                  min="1"
                  placeholder="How long did you practice?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience
                </label>
                <textarea
                  value={responses.experience || ''}
                  onChange={(e) => setResponses({ ...responses, experience: e.target.value })}
                  disabled={!canEdit}
                  rows={6}
                  placeholder="Describe your mindfulness experience..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Coach Feedback (if reviewed) */}
        {submission.coachFeedback && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Coach Feedback</h3>
            <p className="text-blue-800 mb-3">{submission.coachFeedback}</p>
            {submission.coachRating && (
              <div className="flex items-center">
                <span className="text-sm font-medium text-blue-900 mr-2">Rating:</span>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-xl ${i < submission.coachRating! ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={handleSaveProgress}
              disabled={isSaving}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Progress
                </>
              )}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(responses).length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Assignment
                </>
              )}
            </button>
          </div>
        )}

        {/* Info about submission */}
        {submission.timeSpent && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Time spent: {submission.timeSpent} minutes
          </div>
        )}
      </div>
    </div>
  );
}
