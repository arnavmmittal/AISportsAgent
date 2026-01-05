/**
 * AssignmentLibrary Component
 * Browse and assign evidence-based mental skills exercises
 */

'use client';

import { useState } from 'react';
import { DashboardSection } from '../layouts/DashboardGrid';
import StatCard from '../ui/StatCard';

type AssignmentCategory = 'all' | 'cbt' | 'mindfulness' | 'goal-setting' | 'performance' | 'recovery';

interface AssignmentTemplate {
  id: string;
  title: string;
  category: AssignmentCategory;
  framework: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  objectives: string[];
  evidenceBase: string;
  assignedCount: number;
  completionRate: number;
  avgRating: number;
}

export default function AssignmentLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<AssignmentCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: Replace with API data from /api/coach/assignments/templates
  const templates: AssignmentTemplate[] = [
    {
      id: 'cbt-thought-record',
      title: 'Thought Record Journal',
      category: 'cbt',
      framework: 'Cognitive Behavioral Therapy',
      duration: '15 min/day for 7 days',
      difficulty: 'Beginner',
      description: 'Identify and challenge negative thoughts that impact performance',
      objectives: [
        'Recognize automatic negative thoughts',
        'Identify thinking patterns (catastrophizing, all-or-nothing)',
        'Develop balanced alternative thoughts',
      ],
      evidenceBase: 'Beck et al., 1979; Burns, 1980',
      assignedCount: 45,
      completionRate: 82,
      avgRating: 4.6,
    },
    {
      id: 'mindfulness-breathing',
      title: 'Pre-Competition Breathing Protocol',
      category: 'mindfulness',
      framework: 'Mindfulness-Based Stress Reduction',
      duration: '10 min before competition',
      difficulty: 'Beginner',
      description: 'Reduce pre-game anxiety through controlled breathing',
      objectives: [
        'Learn 4-7-8 breathing technique',
        'Practice present-moment awareness',
        'Reduce physiological arousal',
      ],
      evidenceBase: 'Kabat-Zinn, 1990; Gardner & Moore, 2007',
      assignedCount: 78,
      completionRate: 91,
      avgRating: 4.8,
    },
    {
      id: 'goal-setting-smart',
      title: 'SMART Goal Setting Workshop',
      category: 'goal-setting',
      framework: 'Goal-Setting Theory',
      duration: '30 min initial + weekly reviews',
      difficulty: 'Intermediate',
      description: 'Set specific, measurable, achievable, relevant, time-bound goals',
      objectives: [
        'Define outcome and process goals',
        'Create action plans with milestones',
        'Develop accountability systems',
      ],
      evidenceBase: 'Locke & Latham, 2002; Burton et al., 2010',
      assignedCount: 62,
      completionRate: 76,
      avgRating: 4.5,
    },
    {
      id: 'performance-imagery',
      title: 'Mental Imagery Practice',
      category: 'performance',
      framework: 'Imagery Training',
      duration: '15 min/day for 14 days',
      difficulty: 'Intermediate',
      description: 'Visualize successful performance to enhance motor learning',
      objectives: [
        'Develop vivid mental imagery skills',
        'Practice PETTLEP imagery model',
        'Integrate imagery into pre-performance routine',
      ],
      evidenceBase: 'Holmes & Collins, 2001; Weinberg, 2008',
      assignedCount: 38,
      completionRate: 68,
      avgRating: 4.3,
    },
    {
      id: 'recovery-sleep-hygiene',
      title: 'Sleep Optimization Protocol',
      category: 'recovery',
      framework: 'Sleep Hygiene',
      duration: '21 days (habit formation)',
      difficulty: 'Beginner',
      description: 'Establish consistent sleep routines for optimal recovery',
      objectives: [
        'Set consistent sleep/wake schedule',
        'Optimize sleep environment (temperature, light, sound)',
        'Develop pre-sleep wind-down routine',
      ],
      evidenceBase: 'Fullagar et al., 2015; Mah et al., 2011',
      assignedCount: 55,
      completionRate: 73,
      avgRating: 4.4,
    },
    {
      id: 'performance-self-talk',
      title: 'Positive Self-Talk Training',
      category: 'performance',
      framework: 'Self-Talk Theory',
      duration: '10 min/day for 10 days',
      difficulty: 'Beginner',
      description: 'Replace negative self-talk with performance-enhancing statements',
      objectives: [
        'Identify negative self-talk patterns',
        'Create personalized cue words and affirmations',
        'Practice in training and competition',
      ],
      evidenceBase: 'Hardy, 2006; Hatzigeorgiadis et al., 2011',
      assignedCount: 67,
      completionRate: 85,
      avgRating: 4.7,
    },
  ];

  const categories = [
    { id: 'all', label: 'All Templates', icon: '📚', count: templates.length },
    { id: 'cbt', label: 'CBT', icon: '🧠', count: templates.filter(t => t.category === 'cbt').length },
    { id: 'mindfulness', label: 'Mindfulness', icon: '🧘', count: templates.filter(t => t.category === 'mindfulness').length },
    { id: 'goal-setting', label: 'Goal Setting', icon: '🎯', count: templates.filter(t => t.category === 'goal-setting').length },
    { id: 'performance', label: 'Performance', icon: '⚡', count: templates.filter(t => t.category === 'performance').length },
    { id: 'recovery', label: 'Recovery', icon: '💤', count: templates.filter(t => t.category === 'recovery').length },
  ] as const;

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Library Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Templates"
          value={templates.length}
          subtitle="Evidence-based exercises"
          variant="default"
        />
        <StatCard
          title="Avg Completion Rate"
          value="79%"
          subtitle="Across all assignments"
          variant="success"
        />
        <StatCard
          title="Active Assignments"
          value={156}
          subtitle="Currently assigned"
          variant="default"
        />
        <StatCard
          title="Avg Rating"
          value="4.6/5"
          subtitle="Athlete feedback"
          variant="success"
        />
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id as AssignmentCategory)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg border transition-all ${
              selectedCategory === category.id
                ? 'bg-primary border-blue-500 text-white'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="mr-2">{category.icon}</span>
            {category.label}
            <span className="ml-2 opacity-70">({category.count})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search assignments by title or description..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
      />

      {/* Assignment Templates */}
      <DashboardSection
        title={`${filteredTemplates.length} Assignment${filteredTemplates.length !== 1 ? 's' : ''} Found`}
      >
        <div className="space-y-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="p-5 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{template.title}</h3>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        template.difficulty === 'Beginner'
                          ? 'bg-secondary/20/30 text-accent'
                          : template.difficulty === 'Intermediate'
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-accent/20/30 text-accent'
                      }`}
                    >
                      {template.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-blue-400 mb-2">{template.framework}</p>
                  <p className="text-sm text-slate-300 mb-3">{template.description}</p>

                  <div className="space-y-2 mb-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase">Objectives:</h4>
                    <ul className="space-y-1">
                      {template.objectives.map((objective, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          {objective}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>⏱️ {template.duration}</span>
                    <span>📚 {template.evidenceBase}</span>
                  </div>
                </div>

                <div className="ml-4 text-right">
                  <div className="mb-4">
                    <div className="text-sm text-slate-400 mb-1">Completion Rate</div>
                    <div className="text-2xl font-bold text-accent">
                      {template.completionRate}%
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm text-slate-400 mb-1">Athlete Rating</div>
                    <div className="text-lg font-semibold text-muted-foreground">
                      ⭐ {template.avgRating}/5
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mb-3">
                    {template.assignedCount} times assigned
                  </div>
                  <button className="w-full px-4 py-2 bg-primary hover:opacity-90 text-white text-sm rounded-md transition-colors">
                    Assign to Athletes
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
