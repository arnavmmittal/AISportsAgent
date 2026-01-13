'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shared/ui/dialog';
import {
  Target,
  Trophy,
  Heart,
  GraduationCap,
  User,
  Plus,
  Search,
  Trash2,
  Sparkles,
  TrendingUp,
  Check,
  Minus,
  Calendar,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Student Goals Page - Updated with Design System v2.0
 *
 * Features:
 * - Clean card-based goal list with semantic colors
 * - Category badges with consistent styling
 * - Progress tracking with new design system
 * - AI suggestions section
 */

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
    color: 'bg-primary/10 text-primary border-primary/20',
    bgColor: 'bg-primary',
  },
  MENTAL: {
    icon: Heart,
    color: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
    bgColor: 'bg-pink-500',
  },
  ACADEMIC: {
    icon: GraduationCap,
    color: 'bg-success/10 text-success border-success/20',
    bgColor: 'bg-success',
  },
  PERSONAL: {
    icon: User,
    color: 'bg-warning/10 text-warning border-warning/20',
    bgColor: 'bg-warning',
  },
};

export default function StudentGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [suggestedGoals, setSuggestedGoals] = useState<SuggestedGoal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
      const response = await fetch('/api/athlete/profile');
      const profileData = await response.json();

      if (!profileData.success || !profileData.data?.userId) {
        setGoals([]);
        setIsLoading(false);
        return;
      }

      const userId = profileData.data.userId;
      const goalsResponse = await fetch(`/api/goals?athleteId=${userId}`);
      const goalsData = await goalsResponse.json();

      if (goalsData.success) {
        const transformedGoals = goalsData.data.map((goal: any) => ({
          ...goal,
          targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
          createdAt: new Date(goal.createdAt),
        }));
        setGoals(transformedGoals);
      } else {
        setGoals([]);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuggestedGoals = async () => {
    try {
      const response = await fetch('/api/athlete/profile');
      const profileData = await response.json();

      if (!profileData.success || !profileData.data?.userId) return;

      const userId = profileData.data.userId;
      const suggestionsResponse = await fetch(`/api/goals/suggestions?athleteId=${userId}`);
      const suggestionsData = await suggestionsResponse.json();

      if (suggestionsData.success && Array.isArray(suggestionsData.data)) {
        setSuggestedGoals(suggestionsData.data);
      } else {
        setSuggestedGoals([]);
      }
    } catch (error) {
      console.error('Error loading goal suggestions:', error);
      setSuggestedGoals([]);
    }
  };

  const createGoal = async () => {
    if (!newGoal.title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    try {
      const profileResponse = await fetch('/api/athlete/profile');
      const profileData = await profileResponse.json();

      if (!profileData.success || !profileData.data?.userId) {
        toast.error('Please log in to create goals');
        return;
      }

      const userId = profileData.data.userId;
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: userId,
          title: newGoal.title,
          description: newGoal.description || undefined,
          category: newGoal.category,
          targetDate: newGoal.targetDate || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const createdGoal = {
          ...data.data,
          targetDate: data.data.targetDate ? new Date(data.data.targetDate) : undefined,
          createdAt: new Date(data.data.createdAt),
        };
        setGoals([createdGoal, ...goals]);
        setIsCreateDialogOpen(false);
        setNewGoal({ title: '', description: '', category: 'PERFORMANCE', targetDate: '' });
        toast.success('Goal created successfully!');
      } else {
        toast.error(data.error || 'Failed to create goal');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const addSuggestedGoal = async (suggestion: SuggestedGoal) => {
    try {
      const profileResponse = await fetch('/api/athlete/profile');
      const profileData = await profileResponse.json();

      if (!profileData.success || !profileData.data?.userId) {
        toast.error('Please log in to add goals');
        return;
      }

      const userId = profileData.data.userId;
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: userId,
          title: suggestion.title,
          description: suggestion.description,
          category: suggestion.category,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const createdGoal = {
          ...data.data,
          targetDate: data.data.targetDate ? new Date(data.data.targetDate) : undefined,
          createdAt: new Date(data.data.createdAt),
        };
        setGoals([createdGoal, ...goals]);
        setSuggestedGoals(suggestedGoals.filter((s) => s.id !== suggestion.id));
        toast.success(`"${suggestion.title}" added to your goals!`);
      } else {
        toast.error(data.error || 'Failed to add goal');
      }
    } catch (error) {
      console.error('Error adding suggested goal:', error);
      toast.error('Failed to add goal');
    }
  };

  const updateGoalProgress = async (goalId: string, delta: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const newProgress = Math.max(0, Math.min(100, goal.progress + delta));
    const newStatus = newProgress === 100 ? 'COMPLETED' : newProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress, status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setGoals(goals.map((g) => g.id === goalId ? { ...g, progress: newProgress, status: newStatus } : g));
        if (newProgress === 100) {
          toast.success('Goal completed! Great work!');
        }
      } else {
        toast.error(data.error || 'Failed to update goal');
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
      toast.error('Failed to update goal');
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        setGoals(goals.filter((g) => g.id !== goalId));
        toast.success('Goal deleted');
      } else {
        toast.error(data.error || 'Failed to delete goal');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const filteredGoals = goals.filter((goal) => {
    const matchesCategory = selectedCategory === 'ALL' || goal.category === selectedCategory;
    const matchesSearch = !searchQuery || goal.title.toLowerCase().includes(searchQuery.toLowerCase()) || goal.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const completedCount = goals.filter((g) => g.status === 'COMPLETED').length;
  const inProgressCount = goals.filter((g) => g.status === 'IN_PROGRESS').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading goals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <header className="flex items-start justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
              <Target className="w-7 h-7 text-primary" />
              Goals
            </h1>
            <p className="text-muted-foreground mt-1">
              {completedCount} completed, {inProgressCount} in progress
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
                <DialogDescription>Set a specific, measurable goal to track your progress</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Title *</label>
                  <Input
                    value={newGoal.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="e.g., Improve free throw percentage to 80%"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea
                    value={newGoal.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="Details about this goal..."
                    className="min-h-[80px]"
                    maxLength={500}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['PERFORMANCE', 'MENTAL', 'ACADEMIC', 'PERSONAL'] as const).map((category) => {
                      const Icon = CATEGORY_CONFIG[category].icon;
                      const isSelected = newGoal.category === category;
                      return (
                        <button
                          key={category}
                          onClick={() => setNewGoal({ ...newGoal, category })}
                          className={cn(
                            'p-3 rounded-lg border-2 transition-all text-left',
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={cn('w-5 h-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                            <span className={cn('font-medium text-sm', isSelected ? 'text-foreground' : 'text-muted-foreground')}>
                              {category.charAt(0) + category.slice(1).toLowerCase()}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Target Date (optional)</label>
                  <Input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={createGoal} className="flex-1">
                    Create Goal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {/* Search and Filters */}
        <div className="space-y-4 animate-slide-up">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search goals..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'PERFORMANCE', 'MENTAL', 'ACADEMIC', 'PERSONAL'].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-full transition-all',
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {category === 'ALL' ? 'All' : category.charAt(0) + category.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* AI-Suggested Goals */}
        {suggestedGoals.length > 0 && (
          <section className="card-elevated overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-border bg-info/5">
              <h2 className="font-medium text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-info" />
                AI-Suggested Goals
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Personalized recommendations based on your activity</p>
            </div>
            <div className="p-4 space-y-3">
              {suggestedGoals.map((suggestion) => {
                const Icon = CATEGORY_CONFIG[suggestion.category].icon;
                const config = CATEGORY_CONFIG[suggestion.category];
                return (
                  <div key={suggestion.id} className="card-interactive p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', config.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground">{suggestion.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{suggestion.description}</p>
                        <span className={cn('inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full border', config.color)}>
                          {suggestion.reason}
                        </span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => addSuggestedGoal(suggestion)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Goals List */}
        {filteredGoals.length === 0 ? (
          <div className="card-elevated p-8 text-center animate-slide-up">
            <Target className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="font-medium text-foreground mb-1">
              {searchQuery || selectedCategory !== 'ALL' ? 'No goals match your filters' : 'No goals yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'Try adjusting your search or filters'
                : 'Set your first goal to start tracking progress'}
            </p>
            {!searchQuery && selectedCategory === 'ALL' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            {filteredGoals.map((goal) => {
              const Icon = CATEGORY_CONFIG[goal.category].icon;
              const config = CATEGORY_CONFIG[goal.category];
              const isComplete = goal.progress === 100;

              return (
                <div key={goal.id} className="card-elevated p-5">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', config.color)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{goal.title}</h3>
                            {isComplete && <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />}
                          </div>
                          <span className={cn('inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full border', config.color)}>
                            {goal.category.charAt(0) + goal.category.slice(1).toLowerCase()}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteGoal(goal.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {goal.description && (
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    )}

                    {goal.targetDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Target: {goal.targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <span className="text-sm font-medium text-foreground">{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-300', isComplete ? 'bg-success' : 'bg-primary')}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateGoalProgress(goal.id, -10)}
                        disabled={goal.progress === 0}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Minus className="w-4 h-4 mr-1" />
                        -10%
                      </Button>
                      <Button
                        onClick={() => updateGoalProgress(goal.id, 10)}
                        disabled={goal.progress === 100}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        +10%
                      </Button>
                      <Button
                        onClick={() => updateGoalProgress(goal.id, 100 - goal.progress)}
                        disabled={goal.progress === 100}
                        size="sm"
                        className={cn('flex-1', isComplete && 'bg-success hover:bg-success/90')}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {isComplete ? 'Done!' : 'Complete'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tips Card */}
        <section className="p-4 rounded-lg bg-info/5 border border-info/10 animate-slide-up">
          <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-info" />
            Goal Setting Tips
          </h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• <strong>Make it SMART:</strong> Specific, Measurable, Achievable, Relevant, Time-bound</li>
            <li>• <strong>Focus on process:</strong> Break big goals into smaller daily actions</li>
            <li>• <strong>Track consistently:</strong> Update progress regularly to maintain momentum</li>
            <li>• <strong>Celebrate wins:</strong> Acknowledge progress at every milestone</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
