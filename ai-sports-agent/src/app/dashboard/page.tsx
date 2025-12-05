'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Target,
  TrendingUp,
  Calendar,
  ChevronRight,
  Smile,
  Meh,
  Frown,
  Heart,
  Zap,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiClient, type AthleteDashboard } from '@/lib/api-client';

// Mood emoji options
const moodEmojis = [
  { icon: Frown, label: 'Struggling', value: 1, color: 'text-destructive' },
  { icon: Meh, label: 'Okay', value: 2, color: 'text-warning' },
  { icon: Smile, label: 'Good', value: 3, color: 'text-accent' },
  { icon: Heart, label: 'Great', value: 4, color: 'text-success' },
  { icon: Zap, label: 'Amazing', value: 5, color: 'text-primary' },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<AthleteDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Get real athlete ID from session
        const athleteId = session?.user?.id || 'athlete_test_123';

        const data = await apiClient.getAthleteDashboard(athleteId, 7);
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [session?.user?.id]);

  const handleMoodSelect = async (moodValue: number) => {
    setSelectedMood(moodValue);

    try {
      // TODO: Get real athlete ID from session
      const athleteId = session?.user?.id || 'athlete_test_123';

      const response = await apiClient.logMood(athleteId, { mood: moodValue });

      // Update streak in dashboard data
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          streak: response.streak,
        });
      }
    } catch (err) {
      console.error('Error logging mood:', err);
    }
  };

  const firstName = session?.user?.name?.split(' ')[0] || 'Athlete';

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-lg text-muted-foreground">Loading dashboard...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error || !dashboardData) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-lg text-destructive">{error || 'Failed to load dashboard'}</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Hey {firstName}, how are you feeling today?
              </h1>
              <p className="text-muted-foreground mt-2">
                Track your mental performance and stay on top of your goals
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{dashboardData.streak}</div>
                <div className="text-sm text-muted-foreground">day streak 🔥</div>
              </div>
            </div>
          </div>

          {/* Quick Mood Logger */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Quick Check-In</h3>
                  <p className="text-sm text-muted-foreground">How are you feeling right now?</p>
                </div>
                <div className="flex gap-2">
                  {moodEmojis.map((mood) => {
                    const Icon = mood.icon;
                    return (
                      <button
                        key={mood.value}
                        onClick={() => handleMoodSelect(mood.value)}
                        className={`
                          p-3 rounded-full transition-all hover:scale-110
                          ${selectedMood === mood.value
                            ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                            : 'bg-background hover:bg-accent/20'
                          }
                        `}
                        title={mood.label}
                      >
                        <Icon className={`size-6 ${selectedMood === mood.value ? '' : mood.color}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
              {selectedMood && (
                <div className="mt-3 text-sm text-success font-medium animate-in fade-in">
                  ✓ Mood logged! Keep up the consistency.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mood Trend Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <TrendingUp className="size-5 text-accent" />
                <Badge variant="secondary">7 days</Badge>
              </div>
              <CardTitle className="mt-3">Mood Trend</CardTitle>
              <CardDescription>Your emotional patterns this week</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simple bar chart visualization */}
              <div className="flex items-end justify-between h-32 gap-2">
                {dashboardData.mood_trend.mood_values.map((value, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-primary to-accent rounded-t-md transition-all hover:opacity-80"
                      style={{ height: `${value * 20}%` }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Average: <span className="font-semibold text-foreground">
                    {dashboardData.mood_trend.average}/5
                  </span>
                  {' • '}
                  <span className={`font-semibold ${
                    dashboardData.mood_trend.trend === 'improving' ? 'text-success' :
                    dashboardData.mood_trend.trend === 'declining' ? 'text-destructive' :
                    'text-foreground'
                  }`}>
                    {dashboardData.mood_trend.trend}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Goals Progress Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Target className="size-5 text-success" />
                <Badge variant="secondary">{dashboardData.goals_progress.active_goals} active</Badge>
              </div>
              <CardTitle className="mt-3">Goals Progress</CardTitle>
              <CardDescription>Your performance targets</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Circular progress indicator */}
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative size-32">
                  <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      className="stroke-muted"
                      strokeWidth="3"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      className="stroke-success"
                      strokeWidth="3"
                      strokeDasharray={`${dashboardData.goals_progress.overall_progress}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-foreground">{dashboardData.goals_progress.overall_progress}%</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Keep pushing towards your targets!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <MessageCircle className="size-5 text-secondary" />
                <Badge variant="secondary">Recent</Badge>
              </div>
              <CardTitle className="mt-3">Recent Sessions</CardTitle>
              <CardDescription>Your latest conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.recent_sessions.length > 0 ? (
                  dashboardData.recent_sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                    >
                      <Calendar className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.topic}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{session.date}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{session.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent sessions yet. Start a chat to begin!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
            onClick={() => router.push('/chat')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <MessageCircle className="size-8 text-primary mb-2" />
                  <h3 className="font-semibold text-lg">Start AI Chat</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get instant mental performance support
                  </p>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20"
            onClick={() => router.push('/mood')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <TrendingUp className="size-8 text-accent mb-2" />
                  <h3 className="font-semibold text-lg">Log Mood</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track your daily mental state
                  </p>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] bg-gradient-to-br from-success/10 to-success/5 border-success/20"
            onClick={() => router.push('/goals')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Target className="size-8 text-success mb-2" />
                  <h3 className="font-semibold text-lg">Set New Goal</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define your performance targets
                  </p>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20"
            onClick={() => router.push('/chat')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Calendar className="size-8 text-secondary mb-2" />
                  <h3 className="font-semibold text-lg">Session History</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review past conversations
                  </p>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
