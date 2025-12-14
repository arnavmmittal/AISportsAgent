'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
    color: 'text-purple-600 bg-purple-100',
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
    color: 'text-green-600 bg-green-100',
    gradient: 'from-green-600 to-emerald-600',
    bgGradient: 'from-green-50 to-emerald-50',
  },
  PERSONAL: {
    icon: User,
    color: 'text-orange-600 bg-orange-100',
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

  const loadGoals = () => {
    // Mock goals data
    const mockGoals: Goal[] = [
      {
        id: '1',
        title: 'Improve free throw percentage to 80%',
        description: 'Practice 50 free throws daily, focus on form and breathing',
        category: 'PERFORMANCE',
        status: 'IN_PROGRESS',
        progress: 75,
        targetDate: new Date('2025-03-01'),
        createdAt: new Date('2025-01-01'),
      },
      {
        id: '2',
        title: 'Complete mindfulness practice 5x this week',
        description: 'Daily 10-minute meditation sessions before practice',
        category: 'MENTAL',
        status: 'IN_PROGRESS',
        progress: 60,
        createdAt: new Date('2025-01-05'),
      },
      {
        id: '3',
        title: 'Maintain 3.5 GPA this semester',
        description: 'Study 2 hours before each game, attend all tutoring sessions',
        category: 'ACADEMIC',
        status: 'IN_PROGRESS',
        progress: 40,
        targetDate: new Date('2025-05-15'),
        createdAt: new Date('2024-12-15'),
      },
    ];
    setGoals(mockGoals);
  };

  const loadSuggestedGoals = () => {
    // Mock AI suggestions
    const mockSuggestions: SuggestedGoal[] = [
      {
        id: 's1',
        title: 'Build pre-game visualization routine',
        description:
          'Spend 5 minutes visualizing perfect execution before each game. Research shows this improves performance by 15-20%.',
        category: 'MENTAL',
        reason: 'Based on your anxiety patterns',
      },
      {
        id: 's2',
        title: 'Improve vertical jump by 3 inches',
        description:
          'Plyometric training 3x per week. Track progress weekly with vertical jump tests.',
        category: 'PERFORMANCE',
        reason: 'Complements current goals',
      },
    ];
    setSuggestedGoals(mockSuggestions);
  };

  const createGoal = () => {
    if (!newGoal.title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    const goal: Goal = {
      id: `goal_${Date.now()}`,
      title: newGoal.title,
      description: newGoal.description || undefined,
      category: newGoal.category,
      status: 'NOT_STARTED',
      progress: 0,
      targetDate: newGoal.targetDate ? new Date(newGoal.targetDate) : undefined,
      createdAt: new Date(),
    };

    setGoals([goal, ...goals]);
    setIsCreateDialogOpen(false);
    setNewGoal({ title: '', description: '', category: 'PERFORMANCE', targetDate: '' });
    toast.success('Goal created successfully!');
  };

  const addSuggestedGoal = (suggestion: SuggestedGoal) => {
    const goal: Goal = {
      id: `goal_${Date.now()}`,
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category,
      status: 'NOT_STARTED',
      progress: 0,
      createdAt: new Date(),
    };

    setGoals([goal, ...goals]);
    setSuggestedGoals(suggestedGoals.filter((s) => s.id !== suggestion.id));
    toast.success(`"${suggestion.title}" added to your goals!`);
  };

  const updateGoalProgress = (goalId: string, delta: number) => {
    setGoals(
      goals.map((goal) => {
        if (goal.id === goalId) {
          const newProgress = Math.max(0, Math.min(100, goal.progress + delta));
          return {
            ...goal,
            progress: newProgress,
            status:
              newProgress === 100
                ? 'COMPLETED'
                : newProgress > 0
                  ? 'IN_PROGRESS'
                  : 'NOT_STARTED',
          };
        }
        return goal;
      })
    );

    if (delta === 100) {
      toast.success('Goal completed! Great work!');
    }
  };

  const deleteGoal = (goalId: string) => {
    setGoals(goals.filter((g) => g.id !== goalId));
    toast.success('Goal deleted');
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-8 h-8 text-purple-600" />
            Goals & Progress
          </h1>
          <p className="text-gray-600 mt-1">Set targets and track your progress</p>
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
                            : 'border-gray-200 hover:border-gray-300 bg-white'
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                      ? 'bg-purple-600 hover:bg-purple-700'
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
        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-600" />
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
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <Button
                        onClick={() => addSuggestedGoal(suggestion)}
                        size="sm"
                        variant="secondary"
                        className="bg-white/20 hover:bg-white/30 text-white border-0"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <h4 className="font-bold text-white mb-2">{suggestion.title}</h4>
                    <p className="text-sm text-white/90 mb-3">{suggestion.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-white/20 text-white border-0">
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
              <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No goals yet</h3>
              <p className="text-gray-600 mb-6">
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
                          <h3 className="font-bold text-gray-900 text-lg">{goal.title}</h3>
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
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Description */}
                    {goal.description && (
                      <p className="text-gray-600 text-sm">{goal.description}</p>
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
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-bold text-gray-900">
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
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Goal Setting Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>Make it SMART:</strong> Specific, Measurable, Achievable, Relevant,
                Time-bound
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>Focus on process:</strong> Break big goals into smaller daily actions
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                <strong>Track consistently:</strong> Update progress regularly to maintain
                momentum
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
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
