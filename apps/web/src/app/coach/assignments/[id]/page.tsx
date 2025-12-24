'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Athlete {
  id: string;
  name: string;
  email: string;
  athlete: {
    sport: string;
    year: string;
    teamPosition: string | null;
  };
}

interface Submission {
  id: string;
  athleteId: string;
  response: string | null;
  status: 'PENDING' | 'SUBMITTED' | 'REVIEWED';
  submittedAt: string | null;
  createdAt: string;
  athlete: Athlete;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  createdAt: string;
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    loadAssignmentDetails();
  }, [assignmentId]);

  const loadAssignmentDetails = async () => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/submissions`);
      if (!response.ok) throw new Error('Failed to load assignment');

      const data = await response.json();
      setAssignment(data.assignment);
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error loading assignment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSubmissionStats = () => {
    const total = submissions.length;
    const submitted = submissions.filter(s => s.status !== 'PENDING').length;
    const reviewed = submissions.filter(s => s.status === 'REVIEWED').length;
    const pending = total - submitted;
    return { total, submitted, reviewed, pending };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not submitted';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-muted-foreground">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Assignment not found</p>
          <Link href="/coach/assignments" className="mt-4 inline-block text-purple-600 hover:text-purple-700">
            ← Back to Assignments
          </Link>
        </div>
      </div>
    );
  }

  const stats = getSubmissionStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/coach/assignments"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Assignments
          </Link>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {assignment.title}
              </h1>
              <p className="text-muted-foreground mb-4">
                {assignment.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                {assignment.dueDate && (
                  <span
                    className={`px-3 py-1 rounded-full font-medium ${
                      isOverdue(assignment.dueDate)
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isOverdue(assignment.dueDate) ? '⚠️ Overdue: ' : '📅 Due: '}
                    {formatDate(assignment.dueDate)}
                  </span>
                )}

                <span className="text-muted-foreground">
                  Created {formatDate(assignment.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-background rounded-lg p-4">
              <div className="text-muted-foreground text-sm font-medium mb-1">Total Athletes</div>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-700 text-sm font-medium mb-1">Submitted</div>
              <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
            </div>

            <div className="bg-amber-50 rounded-lg p-4">
              <div className="text-amber-700 text-sm font-medium mb-1">Pending</div>
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-purple-700 text-sm font-medium mb-1">Reviewed</div>
              <div className="text-2xl font-bold text-purple-600">{stats.reviewed}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Athlete Responses ({stats.submitted} of {stats.total})
        </h2>

        {submissions.length === 0 ? (
          <div className="bg-card rounded-lg shadow p-12 text-center">
            <p className="text-muted-foreground">No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-card rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">
                        {submission.athlete.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {submission.athlete.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {submission.athlete.athlete.sport}
                        {submission.athlete.athlete.year && ` • ${submission.athlete.athlete.year}`}
                        {submission.athlete.athlete.teamPosition && ` • ${submission.athlete.athlete.teamPosition}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {submission.status === 'PENDING' && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                        Not Submitted
                      </span>
                    )}
                    {submission.status === 'SUBMITTED' && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        ✓ Submitted
                      </span>
                    )}
                    {submission.status === 'REVIEWED' && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        ✓ Reviewed
                      </span>
                    )}
                  </div>
                </div>

                {submission.status !== 'PENDING' && submission.response && (
                  <>
                    <div className="bg-background rounded-lg p-4 mb-3">
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {submission.response}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Submitted {formatDate(submission.submittedAt)}
                      </span>

                      {submission.status === 'SUBMITTED' && (
                        <button
                          onClick={async () => {
                            // Mark as reviewed
                            try {
                              const response = await fetch(`/api/assignments/${assignmentId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  submissionId: submission.id,
                                  status: 'REVIEWED'
                                }),
                              });

                              if (response.ok) {
                                await loadAssignmentDetails();
                              }
                            } catch (error) {
                              console.error('Failed to mark as reviewed:', error);
                            }
                          }}
                          className="px-3 py-1 text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Mark as Reviewed
                        </button>
                      )}
                    </div>
                  </>
                )}

                {submission.status === 'PENDING' && (
                  <p className="text-muted-foreground italic text-sm">
                    Waiting for athlete to submit their response
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
