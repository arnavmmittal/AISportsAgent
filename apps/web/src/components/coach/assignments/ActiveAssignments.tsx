/**
 * ActiveAssignments Component
 * Track all currently assigned mental skills exercises
 */

'use client';

import { useState } from 'react';
import { DashboardSection } from '../layouts/DashboardGrid';
import StatCard from '../ui/StatCard';

type AssignmentStatus = 'all' | 'pending' | 'in-progress' | 'submitted' | 'overdue';

interface ActiveAssignment {
  id: string;
  athleteName: string;
  sport: string;
  assignmentTitle: string;
  framework: string;
  assignedDate: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'submitted' | 'overdue';
  progress: number; // 0-100
  daysRemaining: number;
  completedSessions: number;
  totalSessions: number;
}

export default function ActiveAssignments() {
  const [filterStatus, setFilterStatus] = useState<AssignmentStatus>('all');

  // TODO: Replace with API data from /api/coach/assignments/active
  const assignments: ActiveAssignment[] = [
    {
      id: 'a1',
      athleteName: 'Sarah Johnson',
      sport: 'Basketball',
      assignmentTitle: 'Pre-Competition Breathing Protocol',
      framework: 'Mindfulness',
      assignedDate: '2025-12-08',
      dueDate: '2025-12-18',
      status: 'in-progress',
      progress: 60,
      daysRemaining: 5,
      completedSessions: 6,
      totalSessions: 10,
    },
    {
      id: 'a2',
      athleteName: 'Mike Chen',
      sport: 'Basketball',
      assignmentTitle: 'Thought Record Journal',
      framework: 'CBT',
      assignedDate: '2025-12-10',
      dueDate: '2025-12-17',
      status: 'pending',
      progress: 0,
      daysRemaining: 4,
      completedSessions: 0,
      totalSessions: 7,
    },
    {
      id: 'a3',
      athleteName: 'Jordan Smith',
      sport: 'Soccer',
      assignmentTitle: 'Mental Imagery Practice',
      framework: 'Performance',
      assignedDate: '2025-12-05',
      dueDate: '2025-12-19',
      status: 'in-progress',
      progress: 85,
      daysRemaining: 6,
      completedSessions: 12,
      totalSessions: 14,
    },
    {
      id: 'a4',
      athleteName: 'Alex Martinez',
      sport: 'Soccer',
      assignmentTitle: 'SMART Goal Setting Workshop',
      framework: 'Goal Setting',
      assignedDate: '2025-12-01',
      dueDate: '2025-12-12',
      status: 'overdue',
      progress: 40,
      daysRemaining: -1,
      completedSessions: 1,
      totalSessions: 4,
    },
    {
      id: 'a5',
      athleteName: 'Taylor Brown',
      sport: 'Basketball',
      assignmentTitle: 'Positive Self-Talk Training',
      framework: 'Performance',
      assignedDate: '2025-12-11',
      dueDate: '2025-12-21',
      status: 'submitted',
      progress: 100,
      daysRemaining: 8,
      completedSessions: 10,
      totalSessions: 10,
    },
    {
      id: 'a6',
      athleteName: 'Chris Lee',
      sport: 'Football',
      assignmentTitle: 'Sleep Optimization Protocol',
      framework: 'Recovery',
      assignedDate: '2025-11-25',
      dueDate: '2025-12-16',
      status: 'in-progress',
      progress: 75,
      daysRemaining: 3,
      completedSessions: 16,
      totalSessions: 21,
    },
  ];

  const statusCounts = {
    all: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    'in-progress': assignments.filter(a => a.status === 'in-progress').length,
    submitted: assignments.filter(a => a.status === 'submitted').length,
    overdue: assignments.filter(a => a.status === 'overdue').length,
  };

  const filteredAssignments = filterStatus === 'all'
    ? assignments
    : assignments.filter(a => a.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-slate-900/50 border-slate-600 text-slate-300';
      case 'in-progress': return 'bg-blue-900/20 border-blue-700 text-blue-300';
      case 'submitted': return 'bg-secondary/20 border-secondary text-accent';
      case 'overdue': return 'bg-muted-foreground/20 border-muted-foreground text-chrome';
      default: return 'bg-slate-900/50 border-slate-600 text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in-progress': return '🔄';
      case 'submitted': return '✅';
      case 'overdue': return '⚠️';
      default: return '📋';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          title="Total Active"
          value={statusCounts.all}
          subtitle="All assignments"
          variant="default"
        />
        <StatCard
          title="Pending"
          value={statusCounts.pending}
          subtitle="Not started"
          variant="warning"
        />
        <StatCard
          title="In Progress"
          value={statusCounts['in-progress']}
          subtitle="Currently working"
          variant="default"
        />
        <StatCard
          title="Submitted"
          value={statusCounts.submitted}
          subtitle="Awaiting review"
          variant="success"
        />
        <StatCard
          title="Overdue"
          value={statusCounts.overdue}
          subtitle="Needs attention"
          variant="danger"
        />
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {([
          { id: 'all', label: 'All Assignments', icon: '📋' },
          { id: 'pending', label: 'Pending', icon: '⏳' },
          { id: 'in-progress', label: 'In Progress', icon: '🔄' },
          { id: 'submitted', label: 'Submitted', icon: '✅' },
          { id: 'overdue', label: 'Overdue', icon: '⚠️' },
        ] as const).map(filter => (
          <button
            key={filter.id}
            onClick={() => setFilterStatus(filter.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg border transition-all ${
              filterStatus === filter.id
                ? 'bg-primary border-blue-500 text-white'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="mr-2">{filter.icon}</span>
            {filter.label}
            <span className="ml-2 opacity-70">
              ({statusCounts[filter.id as keyof typeof statusCounts]})
            </span>
          </button>
        ))}
      </div>

      {/* Assignments List */}
      <DashboardSection
        title={`${filteredAssignments.length} Assignment${filteredAssignments.length !== 1 ? 's' : ''}`}
      >
        <div className="space-y-3">
          {filteredAssignments.map(assignment => (
            <div
              key={assignment.id}
              className={`p-4 rounded-lg border ${getStatusColor(assignment.status)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white">
                      {assignment.athleteName}
                    </h3>
                    <span className="text-xs text-slate-400">{assignment.sport}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      assignment.status === 'submitted'
                        ? 'bg-secondary/20/50 text-accent'
                        : assignment.status === 'overdue'
                        ? 'bg-muted-foreground/20/50 text-chrome'
                        : assignment.status === 'in-progress'
                        ? 'bg-blue-900/50 text-blue-300'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {getStatusIcon(assignment.status)} {assignment.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-white mb-1">
                    {assignment.assignmentTitle}
                  </h4>
                  <p className="text-sm text-blue-400 mb-3">{assignment.framework}</p>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Progress</span>
                      <span className="text-xs font-semibold text-white">
                        {assignment.completedSessions}/{assignment.totalSessions} sessions
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          assignment.progress === 100
                            ? 'bg-secondary/100'
                            : assignment.progress >= 50
                            ? 'bg-blue-500'
                            : 'bg-muted/100'
                        }`}
                        style={{ width: `${assignment.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}</span>
                    <span className={assignment.daysRemaining < 0 ? 'text-muted-foreground' : assignment.daysRemaining <= 3 ? 'text-muted-foreground' : ''}>
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      {assignment.daysRemaining >= 0
                        ? ` (${assignment.daysRemaining} day${assignment.daysRemaining !== 1 ? 's' : ''} left)`
                        : ` (${Math.abs(assignment.daysRemaining)} day${Math.abs(assignment.daysRemaining) !== 1 ? 's' : ''} overdue)`
                      }
                    </span>
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  {assignment.status === 'submitted' && (
                    <button className="px-3 py-1 bg-secondary hover:bg-secondary text-white text-xs rounded-md transition-colors">
                      Review Submission
                    </button>
                  )}
                  {assignment.status === 'overdue' && (
                    <button className="px-3 py-1 bg-muted-foreground hover:bg-muted-foreground/30 text-white text-xs rounded-md transition-colors">
                      Send Reminder
                    </button>
                  )}
                  {(assignment.status === 'pending' || assignment.status === 'in-progress') && (
                    <button className="px-3 py-1 bg-primary hover:opacity-90 text-white text-xs rounded-md transition-colors">
                      Check Progress
                    </button>
                  )}
                  <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-md transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
