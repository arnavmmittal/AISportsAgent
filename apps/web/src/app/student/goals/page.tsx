'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Trophy,
  Heart,
  GraduationCap,
  User,
  Plus,
  Trash2,
  TrendingUp,
  Check,
  Calendar,
  Loader2,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/design-system/components';
import { Button } from '@/design-system/components/Button';
import { AnimatedCounter, RadialProgress } from '@/design-system/components';
import { fadeInUp, staggerContainer } from '@/design-system/motion';
import { toast } from 'sonner';

type GoalCategory = 'PERFORMANCE' | 'MENTAL' | 'ACADEMIC' | 'PERSONAL';
type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

interface Goal {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  status: GoalStatus;
  progress: number;
  targetDate?: Date;
  createdAt: Date;
}

interface SuggestedGoal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  reason: string;
}

const CATEGORY_CONFIG = {
  PERFORMANCE: {
    icon: Trophy,
    color: 'text-primary-600 dark:text-primary-400',
    bgColor: 'bg-primary-50 dark:bg-primary-900/20',
    borderColor: 'border-primary-200 dark:border-primary-800',
    label: 'Performance',
  },
  MENTAL: {
    icon: Heart,
    color: 'text-danger-600 dark:text-danger-400',
    bgColor: 'bg-danger-50 dark:bg-danger-900/20',
    borderColor: 'border-danger-200 dark:border-danger-800',
    label: 'Mental Wellness',
  },
  ACADEMIC: {
    icon: GraduationCap,
    color: 'text-success-600 dark:text-success-400',
    bgColor: 'bg-success-50 dark:bg-success-900/20',
    borderColor: 'border-success-200 dark:border-success-800',
    label: 'Academic',
  },
  PERSONAL: {
    icon: User,
    color: 'text-info-600 dark:text-info-400',
    bgColor: 'bg-info-50 dark:bg-info-900/20',
    borderColor: 'border-info-200 dark:border-info-800',
    label: 'Personal',
  },
};

export default function StudentGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [suggestedGoals, setSuggestedGoals] = useState<SuggestedGoal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'PERFORMANCE' as GoalCategory,
    targetDate: '',
  });

  useEffect(() => {
    loadGoals();
    loadSuggestedGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/goals');
      if (!response.ok) throw new Error('Failed to load goals');
      const data = await response.json();
      setGoals(data.goals || []);
      setError(null);
    } catch (error) {
      console.error('Error loading goals:', error);
      setError('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuggestedGoals = async () => {
    try {
      const response = await fetch('/api/goals/suggested');
      if (response.ok) {
        const data = await response.json();
        setSuggestedGoals(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error loading suggested goals:', error);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title) {
      toast.error('Please enter a goal title');
      return;
    }

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGoal.title,
          description: newGoal.description || undefined,
          category: newGoal.category,
          targetDate: newGoal.targetDate || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create goal');

      toast.success('Goal created successfully!');
      loadGoals();
      setIsCreateDialogOpen(false);
      setNewGoal({ title: '', description: '', category: 'PERFORMANCE', targetDate: '' });
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete goal');

      toast.success('Goal deleted');
      loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const handleUpdateProgress = async (goalId: string, newProgress: number) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress }),
      });

      if (!response.ok) throw new Error('Failed to update progress');

      loadGoals();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const filteredGoals = goals.filter((goal) => {
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         goal.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || goal.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: goals.length,
    inProgress: goals.filter(g => g.status === 'IN_PROGRESS').length,
    completed: goals.filter(g => g.status === 'COMPLETED').length,
    avgProgress: goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-body">Loading goals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Card variant="elevated" padding="lg" className="max-w-md text-center border-danger-200 dark:border-danger-800">
          <AlertTriangle className="w-16 h-16 text-danger-600 dark:text-danger-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-danger-700 dark:text-danger-300 mb-2">{error}</h2>
          <p className="text-gray-600 dark:text-gray-400 font-body mb-6">Please try again later</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8"
      initial="hidden"
      animate="show"
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div variants={fadeInUp} className="mb-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                Goals
              </h1>
              <p className="mt-3 text-gray-600 dark:text-gray-400 text-lg font-body">
                Track your performance, mental wellness, and personal growth
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Plus className="w-5 h-5" />}
              onClick={() => setIsCreateDialogOpen(true)}
            >
              New Goal
            </Button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card variant="elevated" padding="lg" hover>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Total Goals</div>
                <div className="text-5xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">
                  <AnimatedCounter value={stats.total} decimals={0} />
                </div>
                <div className="text-sm text-primary-600 dark:text-primary-400 font-medium font-body">Active tracking</div>
              </div>
              <Target className="w-16 h-16 text-primary-600 dark:text-primary-400 opacity-80" />
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hover className="border-info-200 dark:border-info-800/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-info-600 dark:text-info-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">In Progress</div>
                <div className="text-5xl font-display font-bold text-info-700 dark:text-info-300 mb-2">
                  <AnimatedCounter value={stats.inProgress} decimals={0} />
                </div>
                <div className="text-sm text-info-600 dark:text-info-400 font-medium font-body">Currently working</div>
              </div>
              <TrendingUp className="w-16 h-16 text-info-600 dark:text-info-400 opacity-80" />
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hover className="border-success-200 dark:border-success-800/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-success-600 dark:text-success-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Completed</div>
                <div className="text-5xl font-display font-bold text-success-700 dark:text-success-300 mb-2">
                  <AnimatedCounter value={stats.completed} decimals={0} />
                </div>
                <div className="text-sm text-success-600 dark:text-success-400 font-medium font-body">Achieved</div>
              </div>
              <CheckCircle2 className="w-16 h-16 text-success-600 dark:text-success-400 opacity-80" />
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hover className="border-warning-200 dark:border-warning-800/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-warning-600 dark:text-warning-400 text-xs font-semibold uppercase tracking-wider mb-2 font-body">Avg Progress</div>
                <div className="text-5xl font-display font-bold text-warning-700 dark:text-warning-300 mb-2">
                  <AnimatedCounter value={stats.avgProgress} decimals={0} />
                  <span className="text-2xl">%</span>
                </div>
                <div className="text-sm text-warning-600 dark:text-warning-400 font-medium font-body">Overall momentum</div>
              </div>
              <Trophy className="w-16 h-16 text-warning-600 dark:text-warning-400 opacity-80" />
            </div>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeInUp}>
          <Card variant="elevated" padding="lg" className="mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="text"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-[200px] px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow font-body"
              />
              <div className="flex gap-2">
                <Button
                  variant={selectedCategory === 'ALL' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setSelectedCategory('ALL')}
                >
                  All
                </Button>
                {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
                  const Icon = config.icon;
                  return (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'primary' : 'outline'}
                      size="md"
                      leftIcon={<Icon className="w-4 h-4" />}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Goals List */}
        <motion.div variants={fadeInUp} className="space-y-4 mb-10">
          {filteredGoals.length === 0 ? (
            <Card variant="elevated" padding="lg" className="text-center">
              <Target className="w-20 h-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">
                {goals.length === 0 ? 'No goals yet' : 'No goals found'}
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 font-body mb-8 max-w-md mx-auto">
                {goals.length === 0
                  ? 'Create your first goal to start tracking your progress'
                  : 'Try adjusting your filters or search query'
                }
              </p>
              {goals.length === 0 && (
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Plus className="w-5 h-5" />}
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  Create First Goal
                </Button>
              )}
            </Card>
          ) : (
            filteredGoals.map((goal) => {
              const config = CATEGORY_CONFIG[goal.category];
              const Icon = config.icon;

              return (
                <Card key={goal.id} variant="elevated" padding="lg" hover className={`border-l-4 ${config.borderColor}`}>
                  <div className="flex items-start gap-6">
                    {/* Radial Progress */}
                    <div className="flex-shrink-0">
                      <RadialProgress
                        value={goal.progress}
                        max={100}
                        size="md"
                        color={goal.category.toLowerCase() as any}
                        showValue={true}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Icon className={`w-5 h-5 ${config.color}`} />
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold font-mono ${config.bgColor} ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <h3 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100 mb-1">
                            {goal.title}
                          </h3>
                          {goal.description && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm font-body line-clamp-2">
                              {goal.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          Delete
                        </Button>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 font-body">Progress</span>
                          <span className="text-xs font-bold text-gray-900 dark:text-gray-100 font-mono">{goal.progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${config.bgColor.replace('/20', '')} transition-all duration-500`}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateProgress(goal.id, Math.max(0, goal.progress - 10))}
                        >
                          -10%
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateProgress(goal.id, Math.min(100, goal.progress + 10))}
                        >
                          +10%
                        </Button>
                        {goal.targetDate && (
                          <div className="flex items-center gap-2 ml-auto text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-body">
                              {new Date(goal.targetDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </motion.div>

        {/* Create Goal Modal */}
        {isCreateDialogOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card variant="elevated" padding="none" className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-primary-600 dark:bg-primary-500">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-display font-bold text-white">Create New Goal</h2>
                  <button
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-body">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow font-body"
                    placeholder="e.g., Improve free throw accuracy to 85%"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-body">
                    Description
                  </label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow font-body"
                    rows={3}
                    placeholder="Add details about your goal..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-body">
                    Category *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={category}
                          onClick={() => setNewGoal({ ...newGoal, category: category as GoalCategory })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            newGoal.category === category
                              ? `${config.borderColor} ${config.bgColor}`
                              : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${config.color} mx-auto mb-2`} />
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100 font-body">
                            {config.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-body">
                    Target Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow font-body"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    leftIcon={<Check className="w-5 h-5" />}
                    onClick={handleCreateGoal}
                  >
                    Create Goal
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </motion.div>
  );
}
