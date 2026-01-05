'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/shared/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import {
  Target,
  Plus,
  Edit,
  Check,
  Archive,
  TrendingUp,
  Brain,
  GraduationCap,
  Heart,
  Trash2,
  MoreVertical,
} from 'lucide-react';

// Goal categories
type GoalCategory = 'PERFORMANCE' | 'MENTAL' | 'ACADEMIC' | 'PERSONAL';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  progress: number;
  targetDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;
}

const categoryConfig = {
  PERFORMANCE: {
    label: 'Performance',
    icon: Target,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
  },
  MENTAL: {
    label: 'Mental',
    icon: Brain,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/20',
  },
  ACADEMIC: {
    label: 'Academic',
    icon: GraduationCap,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/20',
  },
  PERSONAL: {
    label: 'Personal',
    icon: Heart,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    borderColor: 'border-secondary/20',
  },
};

export default function GoalsPage() {
  const { data: session } = useSession();
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'PERFORMANCE' as GoalCategory,
    targetDate: '',
  });

  // Mock data - replace with actual API call
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Improve free throw percentage to 85%',
      description: 'Practice 50 free throws daily, focusing on form and consistency',
      category: 'PERFORMANCE',
      progress: 65,
      targetDate: '2025-12-31',
      status: 'ACTIVE',
      createdAt: '2025-11-01',
    },
    {
      id: '2',
      title: 'Reduce pre-game anxiety',
      description: 'Practice deep breathing and visualization techniques before each game',
      category: 'MENTAL',
      progress: 40,
      targetDate: '2025-12-15',
      status: 'ACTIVE',
      createdAt: '2025-11-10',
    },
    {
      id: '3',
      title: 'Maintain 3.5 GPA',
      description: 'Attend all study sessions and submit assignments on time',
      category: 'ACADEMIC',
      progress: 80,
      targetDate: '2025-12-20',
      status: 'ACTIVE',
      createdAt: '2025-10-15',
    },
    {
      id: '4',
      title: 'Build better sleep routine',
      description: 'Aim for 8 hours of sleep per night, no screens 1 hour before bed',
      category: 'PERSONAL',
      progress: 55,
      targetDate: '2025-12-01',
      status: 'ACTIVE',
      createdAt: '2025-11-15',
    },
  ]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    // TODO: Call API to create goal
    const newGoalData: Goal = {
      id: Date.now().toString(),
      ...newGoal,
      progress: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    setGoals([...goals, newGoalData]);
    setShowNewGoalForm(false);
    setNewGoal({
      title: '',
      description: '',
      category: 'PERFORMANCE',
      targetDate: '',
    });
  };

  const handleMarkComplete = (goalId: string) => {
    setGoals(
      goals.map((goal) =>
        goal.id === goalId ? { ...goal, progress: 100, status: 'COMPLETED' as const } : goal
      )
    );
  };

  const handleArchive = (goalId: string) => {
    setGoals(goals.filter((goal) => goal.id !== goalId));
  };

  const activeGoals = goals.filter((g) => g.status === 'ACTIVE');
  const completedGoals = goals.filter((g) => g.status === 'COMPLETED');

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Goals</h1>
            <p className="text-muted-foreground mt-2">
              Set and track your performance, mental, academic, and personal targets
            </p>
          </div>
          <Button
            onClick={() => setShowNewGoalForm(!showNewGoalForm)}
            size="lg"
            className="gap-2"
          >
            <Plus className="size-5" />
            New Goal
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{activeGoals.length}</div>
                <div className="text-sm text-muted-foreground mt-1">Active Goals</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-success/20 bg-gradient-to-br from-success/5 to-success/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-success">{completedGoals.length}</div>
                <div className="text-sm text-muted-foreground mt-1">Completed</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-accent">
                  {Math.round(
                    activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length || 0
                  )}
                  %
                </div>
                <div className="text-sm text-muted-foreground mt-1">Avg. Progress</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-secondary">
                  {activeGoals.filter((g) => g.progress >= 75).length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Near Completion</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Goal Form */}
        {showNewGoalForm && (
          <Card className="border-2 border-primary/30 shadow-lg">
            <CardHeader>
              <CardTitle>Create New Goal</CardTitle>
              <CardDescription>Set a new target to track your progress</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Goal Title</label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    className="w-full border-2 border-muted rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g., Improve my serves consistency"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Description</label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    className="w-full border-2 border-muted rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors resize-none"
                    rows={3}
                    placeholder="Describe your goal and how you plan to achieve it"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Category</label>
                    <select
                      value={newGoal.category}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, category: e.target.value as GoalCategory })
                      }
                      className="w-full border-2 border-muted rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                    >
                      <option value="PERFORMANCE">Performance</option>
                      <option value="MENTAL">Mental</option>
                      <option value="ACADEMIC">Academic</option>
                      <option value="PERSONAL">Personal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Target Date</label>
                    <input
                      type="date"
                      value={newGoal.targetDate}
                      onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                      className="w-full border-2 border-muted rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    Create Goal
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewGoalForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Active Goals */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Active Goals ({activeGoals.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeGoals.map((goal) => {
              const config = categoryConfig[goal.category];
              const Icon = config.icon;
              const daysUntilTarget = Math.ceil(
                (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Card
                  key={goal.id}
                  className={`border-2 ${config.borderColor} hover:shadow-lg transition-shadow`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.bgColor}`}>
                          <Icon className={`size-6 ${config.color}`} />
                        </div>
                        <div>
                          <Badge variant="secondary" className="mb-2">
                            {config.label}
                          </Badge>
                          <CardTitle className="text-lg">{goal.title}</CardTitle>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2">{goal.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold">Progress</span>
                        <span className={`font-bold ${config.color}`}>{goal.progress}%</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${config.bgColor.replace('/10', '')} transition-all duration-500`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Target Date */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Target Date:</span>
                      <span className="font-medium">
                        {new Date(goal.targetDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Days Remaining:</span>
                      <span
                        className={`font-medium ${
                          daysUntilTarget < 7
                            ? 'text-destructive'
                            : daysUntilTarget < 30
                            ? 'text-warning'
                            : 'text-success'
                        }`}
                      >
                        {daysUntilTarget > 0 ? `${daysUntilTarget} days` : 'Overdue'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <Edit className="size-4" />
                        Edit
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => handleMarkComplete(goal.id)}
                      >
                        <Check className="size-4" />
                        Complete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(goal.id)}
                        className="gap-2"
                      >
                        <Archive className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {activeGoals.length === 0 && (
            <Card className="border-2 border-dashed border-muted">
              <CardContent className="py-12 text-center">
                <Target className="size-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active goals yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first goal to start tracking your progress
                </p>
                <Button onClick={() => setShowNewGoalForm(true)}>
                  <Plus className="size-4 mr-2" />
                  Create Goal
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Completed Goals ({completedGoals.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedGoals.map((goal) => {
                const config = categoryConfig[goal.category];
                const Icon = config.icon;

                return (
                  <Card
                    key={goal.id}
                    className="border-2 border-success/20 bg-success/5 opacity-75"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-success/10">
                            <Icon className="size-6 text-success" />
                          </div>
                          <div>
                            <Badge variant="secondary" className="mb-2">
                              {config.label}
                            </Badge>
                            <CardTitle className="text-lg line-through">{goal.title}</CardTitle>
                          </div>
                        </div>
                        <Check className="size-6 text-success" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Completed on {new Date(goal.targetDate).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
