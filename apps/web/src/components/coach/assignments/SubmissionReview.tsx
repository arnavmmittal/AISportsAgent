/**
 * SubmissionReview Component
 * Review and provide feedback on athlete assignment submissions
 */

'use client';

import { useState } from 'react';
import { DashboardSection } from '../layouts/DashboardGrid';
import StatCard from '../ui/StatCard';

interface Submission {
  id: string;
  athleteName: string;
  sport: string;
  assignmentTitle: string;
  framework: string;
  submittedDate: string;
  daysAgo: number;
  responseQuality: 'excellent' | 'good' | 'needs-work';
  wordCount: number;
  keyInsights: string[];
  responses: {
    question: string;
    answer: string;
  }[];
  needsReview: boolean;
}

export default function SubmissionReview() {
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);

  // TODO: Replace with API data from /api/coach/assignments/submissions
  const submissions: Submission[] = [
    {
      id: 's1',
      athleteName: 'Taylor Brown',
      sport: 'Basketball',
      assignmentTitle: 'Positive Self-Talk Training',
      framework: 'Performance',
      submittedDate: '2025-12-12',
      daysAgo: 1,
      responseQuality: 'excellent',
      wordCount: 487,
      keyInsights: [
        'Identified 3 recurring negative thought patterns during free throws',
        'Created personalized cue words: "Smooth", "Trust", "Follow through"',
        'Practiced self-talk in 5 training sessions with noticeable improvement',
      ],
      responses: [
        {
          question: 'What negative self-talk patterns did you notice during competition?',
          answer: 'I noticed I always say "Don\'t miss" before free throws, which actually makes me more anxious. I also catch myself thinking "I always choke in close games" when the pressure is on.',
        },
        {
          question: 'What positive alternatives did you develop?',
          answer: 'Instead of "Don\'t miss", I now say "Smooth and follow through". For close games, I remind myself "I\'ve prepared for this, trust the process".',
        },
        {
          question: 'How did you practice these new self-talk patterns?',
          answer: 'I practiced them every day during free throw drills. Coach also helped by creating high-pressure scenarios in practice where I could use my new cue words.',
        },
      ],
      needsReview: true,
    },
    {
      id: 's2',
      athleteName: 'Jordan Smith',
      sport: 'Soccer',
      assignmentTitle: 'Mental Imagery Practice',
      framework: 'Performance',
      submittedDate: '2025-12-11',
      daysAgo: 2,
      responseQuality: 'good',
      wordCount: 312,
      keyInsights: [
        'Developed vivid imagery for penalty kick routine',
        'Practiced PETTLEP model daily for 2 weeks',
        'Noticed improved confidence in game situations',
      ],
      responses: [
        {
          question: 'Describe your most effective imagery session',
          answer: 'I imagined the entire penalty kick process - the walk up, the feel of the ball, the sound of the crowd. I visualized the ball going exactly where I wanted it 10 times in a row.',
        },
        {
          question: 'What physical sensations did you incorporate?',
          answer: 'I focused on the feeling of my muscles tightening and releasing, the weight shift in my plant foot, and the snap of my ankle on contact.',
        },
      ],
      needsReview: true,
    },
    {
      id: 's3',
      athleteName: 'Chris Lee',
      sport: 'Football',
      assignmentTitle: 'Sleep Optimization Protocol',
      framework: 'Recovery',
      submittedDate: '2025-12-10',
      daysAgo: 3,
      responseQuality: 'needs-work',
      wordCount: 145,
      keyInsights: [
        'Set consistent sleep schedule (11 PM - 7 AM)',
        'Reports only 50% compliance with routine',
      ],
      responses: [
        {
          question: 'What was your average sleep duration this week?',
          answer: '6.5 hours, but it was inconsistent. Some nights 7 hours, some 5.5.',
        },
        {
          question: 'What barriers prevented you from following the protocol?',
          answer: 'Late practices and studying for finals made it hard to stick to my bedtime.',
        },
      ],
      needsReview: true,
    },
  ];

  const pendingReviewCount = submissions.filter(s => s.needsReview).length;
  const avgWordCount = Math.round(submissions.reduce((sum, s) => sum + s.wordCount, 0) / submissions.length);

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Pending Review"
          value={pendingReviewCount}
          subtitle="Awaiting feedback"
          variant={pendingReviewCount > 0 ? 'warning' : 'success'}
        />
        <StatCard
          title="Avg Response Quality"
          value="85%"
          subtitle="Thoughtful responses"
          variant="success"
        />
        <StatCard
          title="Avg Word Count"
          value={avgWordCount}
          subtitle="Per submission"
          variant="default"
        />
        <StatCard
          title="Response Time"
          value="1.2 days"
          subtitle="Coach review turnaround"
          variant="success"
        />
      </div>

      {/* Submissions List */}
      <DashboardSection title="Recent Submissions">
        <div className="space-y-4">
          {submissions.map(submission => (
            <div
              key={submission.id}
              className="p-5 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-white">
                      {submission.athleteName}
                    </h3>
                    <span className="text-xs text-slate-400">{submission.sport}</span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        submission.responseQuality === 'excellent'
                          ? 'bg-secondary/20/30 text-accent'
                          : submission.responseQuality === 'good'
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-muted-foreground/20/30 text-muted-foreground'
                      }`}
                    >
                      {submission.responseQuality === 'excellent' && '⭐ Excellent'}
                      {submission.responseQuality === 'good' && '👍 Good'}
                      {submission.responseQuality === 'needs-work' && '📝 Needs Work'}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-1">
                    {submission.assignmentTitle}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                    <span className="text-blue-400">{submission.framework}</span>
                    <span>Submitted {submission.daysAgo} day{submission.daysAgo !== 1 ? 's' : ''} ago</span>
                    <span>{submission.wordCount} words</span>
                  </div>

                  {/* Key Insights */}
                  <div className="mb-3">
                    <h5 className="text-xs font-semibold text-slate-400 uppercase mb-2">
                      Key Insights:
                    </h5>
                    <ul className="space-y-1">
                      {submission.keyInsights.map((insight, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-start">
                          <span className="text-accent mr-2">✓</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Responses Preview */}
                  <button
                    onClick={() => setSelectedSubmission(
                      selectedSubmission === submission.id ? null : submission.id
                    )}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {selectedSubmission === submission.id ? '▼ Hide Responses' : '▶ View Full Responses'}
                  </button>

                  {selectedSubmission === submission.id && (
                    <div className="mt-4 space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-600">
                      {submission.responses.map((response, idx) => (
                        <div key={idx}>
                          <h6 className="text-sm font-semibold text-blue-400 mb-2">
                            {response.question}
                          </h6>
                          <p className="text-sm text-slate-300 pl-3 border-l-2 border-blue-500">
                            {response.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  <button className="px-4 py-2 bg-secondary hover:bg-secondary text-white text-sm rounded-md transition-colors">
                    Provide Feedback
                  </button>
                  <button className="px-4 py-2 bg-primary hover:opacity-90 text-white text-sm rounded-md transition-colors">
                    Mark Excellent
                  </button>
                  <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-md transition-colors">
                    View History
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Feedback Templates */}
      <DashboardSection
        title="Quick Feedback Templates"
        description="Common responses you can customize"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              type: 'Excellent Work',
              template: 'Excellent work on this assignment! Your insights show deep engagement with the material. I especially appreciate how you...',
              color: 'green',
            },
            {
              type: 'Good Progress',
              template: 'Great progress! You\'re on the right track. To take it further, consider...',
              color: 'blue',
            },
            {
              type: 'Needs More Detail',
              template: 'Thanks for your submission. To get more benefit from this exercise, I\'d like you to expand on...',
              color: 'amber',
            },
            {
              type: 'Follow-Up Questions',
              template: 'Interesting response. I have a few follow-up questions to help you go deeper: 1)... 2)... 3)...',
              color: 'purple',
            },
          ].map((template, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border cursor-pointer hover:bg-slate-800/70 transition-colors ${
                template.color === 'green'
                  ? 'bg-secondary/20/10 border-secondary'
                  : template.color === 'blue'
                  ? 'bg-blue-900/10 border-blue-700'
                  : template.color === 'amber'
                  ? 'bg-muted-foreground/20/10 border-muted-foreground'
                  : 'bg-accent/20/10 border-accent'
              }`}
            >
              <h5 className="text-sm font-semibold text-white mb-2">{template.type}</h5>
              <p className="text-xs text-slate-300 italic">&quot;{template.template}&quot;</p>
            </div>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
