'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Badge } from '@/components/shared/ui/badge';
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
} from 'lucide-react';
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
    color: 'text-accent bg-accent/20',
    gradient: 'from-purple-600 to-violet-600',
    bgGradient: 'from-purple-50 to-violet-50',
  },
  MENTAL: {
    icon: Heart,
    color: 'text-pink-600 bg-pink-100',
    gradient: 'from-pink-600 to-rose-600',
    bgGradient: 'from-pink-50 to-rose-50',
  },
  ACADEMIC: {
    icon: GraduationCap,
    color: 'text-secondary bg-secondary/20',
    gradient: 'from-green-600 to-emerald-600',
    bgGradient: 'from-green-50 to-emerald-50',
  },
  PERSONAL: {
    icon: User,
    color: 'text-muted-foreground bg-muted/20',
    gradient: 'from-orange-600 to-amber-600',
    bgGradient: 'from-orange-50 to-amber-50',
  },
};

export default function StudentGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [suggestedGoals, setSuggestedGoals] = useState<SuggestedGoal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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
      // Get current user from Supabase session
      const response = await fetch('/api/athlete/profile');
      const profileData = await response.json();

      if (!profileData.success || !profileData.data?.userId) {
        toast.error('Please log in to view your goals');
        return;
      }

      const userId = profileData.data.userId;

      // Fetch goals from API
      const goalsResponse = await fetch(`/api/goals?athleteId=${userId}`);
      const goalsData = await goalsResponse.json();

      if (goalsData.success) {
        // Transform API data to match component structure
        const transformedGoals = goalsData.data.map((goal: any) => ({
          ...goal,
          targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
          createdAt: new Date(goal.createdAt),
        }));
        setGoals(transformedGoals);
      } else {
        console.error('Failed to load goals:', goalsData.error);
        setGoals([]);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
      toast.error('Failed to load goals');
      setGoals([]);
    }
  };

  const loadSuggestedGoals = async () => {
    try {
      // Get current user from Supabase session
      const response = await fetch('/api/athlete/profile');
      const profileData = await response.json();

      if (!profileData.success || !profileData.data?.userId) {
        return;
      }

      const userId = profileData.data.userId;

      // Fetch suggestions from API
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
      // Get current user ID
      const profileResponse = await fetch('/api/athlete/profile');
      const profileData = await profileResponse.json();

      if (!profileData.success || !profileData.data?.userId) {
        toast.error('Please log in to create goals');
        return;
      }

      const userId = profileData.data.userId;

      // Create goal via API
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        // Add to local state
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
      // Get current user ID
      const profileResponse = await fetch('/api/athlete/profile');
      const profileData = await profileResponse.json();

      if (!profileData.success || !profileData.data?.userId) {
        toast.error('Please log in to add goals');
        return;
      }

      const userId = profileData.data.userId;

      // Create goal from suggestion via API
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    const newStatus =
      newProgress === 100
        ? 'COMPLETED'
        : newProgress > 0
          ? 'IN_PROGRESS'
          : 'NOT_STARTED';

    try {
      // Update via API
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progress: newProgress,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setGoals(
          goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  progress: newProgress,
                  status: newStatus,
                }
              : g
          )
        );

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
      // Delete via API
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Remove from local state
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
    const matchesSearch =
      !searchQuery ||
      goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-8 h-8 text-accent" />
            Goals & Progress
          </h1>
          <p className="text-muted-foreground mt-1">Set targets and track your progress</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set a specific, measurable goal to track your progress
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={newGoal.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g., Improve free throw percentage to 80%"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newGoal.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="Details about this goal..."
                  className="min-h-[80px]"
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    ['PERFORMANCE', 'MENTAL', 'ACADEMIC', 'PERSONAL'] as const
                  ).map((category) => {
                    const Icon = CATEGORY_CONFIG[category].icon;
                    const isSelected = newGoal.category === category;
                    return (
                      <button
                        key={category}
                        onClick={() => setNewGoal({ ...newGoal, category })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? `bg-gradient-to-br ${CATEGORY_CONFIG[category].gradient} text-white border-transparent`
                            : 'border-border hover:border-gray-300 bg-card'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5" />
                          <span className="font-semibold text-sm">{category}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Date (optional)</label>
                <Input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setIsCreateDialogOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createGoal}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                >
                  Create Goal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                placeholder="Search goals..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'PERFORMANCE', 'MENTAL', 'ACADEMIC', 'PERSONAL'].map((category) => (
                <Button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  className={
                    selectedCategory === category
                      ? 'bg-accent hover:bg-accent'
                      : ''
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI-Suggested Goals */}
      {suggestedGoals.length > 0 && (
        <Card className="border-2 border-muted bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">AI-Suggested Goals</CardTitle>
            </div>
            <CardDescription>
              Personalized recommendations based on your profile & recent activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestedGoals.map((suggestion) => {
                const Icon = CATEGORY_CONFIG[suggestion.category].icon;
                return (
                  <div
                    key={suggestion.id}
                    className={`p-4 rounded-lg bg-gradient-to-br ${CATEGORY_CONFIG[suggestion.category].gradient} text-white`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-card/20 rounded-full flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <Button
                        onClick={() => addSuggestedGoal(suggestion)}
                        size="sm"
                        variant="secondary"
                        className="bg-card/20 hover:bg-card/30 text-white border-0"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <h4 className="font-bold text-white mb-2">{suggestion.title}</h4>
                    <p className="text-sm text-white/90 mb-3">{suggestion.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-card/20 text-white border-0">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {suggestion.reason}
                      </Badge>
                      <span className="text-xs text-white/80 font-semibold">
                        {suggestion.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No goals yet</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || selectedCategory !== 'ALL'
                  ? 'No goals match your filters'
                  : 'Set your first goal to start tracking your progress'}
              </p>
              {!searchQuery && selectedCategory === 'ALL' && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Goal
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredGoals.map((goal) => {
            const Icon = CATEGORY_CONFIG[goal.category].icon;
            return (
              <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${CATEGORY_CONFIG[goal.category].gradient} flex items-center justify-center`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground text-lg">{goal.title}</h3>
                          <Badge
                            variant="secondary"
                            className={CATEGORY_CONFIG[goal.category].color}
                          >
                            {goal.category}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteGoal(goal.id)}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-muted-foreground hover:bg-muted-foreground/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Description */}
                    {goal.description && (
                      <p className="text-muted-foreground text-sm">{goal.description}</p>
                    )}

                    {/* Target Date */}
                    {goal.targetDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Target: {goal.targetDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Progress</span>
                        <span className="text-sm font-bold text-foreground">
                          {goal.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${CATEGORY_CONFIG[goal.category].gradient} transition-all duration-300`}
                          style={{ width: `${goal.progress}%` }}
                        ></div>
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
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {goal.progress === 100 ? 'Done!' : 'Complete'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Tips Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Goal Setting Tips
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                <strong>Make it SMART:</strong> Specific, Measurable, Achievable, Relevant,
                Time-bound
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                <strong>Focus on process:</strong> Break big goals into smaller daily actions
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                <strong>Track consistently:</strong> Update progress regularly to maintain
                momentum
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>
                <strong>Celebrate wins:</strong> Acknowledge progress at every milestone
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
