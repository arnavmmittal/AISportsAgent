'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  MessageSquare,
  Calendar,
  Award,
  Heart,
  Brain,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function StudentDashboardPage() {
  const [moodData, setMoodData] = useState([
    { date: 'Mon', mood: 7, confidence: 8, stress: 4 },
    { date: 'Tue', mood: 8, confidence: 7, stress: 5 },
    { date: 'Wed', mood: 6, confidence: 6, stress: 6 },
    { date: 'Thu', mood: 7, confidence: 8, stress: 4 },
    { date: 'Fri', mood: 8, confidence: 9, stress: 3 },
    { date: 'Sat', mood: 9, confidence: 8, stress: 2 },
    { date: 'Sun', mood: 7, confidence: 7, stress: 4 },
  ]);

  const [activeGoals, setActiveGoals] = useState([
    { id: 1, title: 'Complete mindfulness practice 5x this week', progress: 60, category: 'Mental' },
    { id: 2, title: 'Improve free throw percentage to 80%', progress: 75, category: 'Performance' },
    { id: 3, title: 'Study 2 hours before each game', progress: 40, category: 'Academic' },
  ]);

  const [recentAssignments, setRecentAssignments] = useState([
    { id: 1, title: 'Pre-Game Visualization', dueDate: '2 days', status: 'pending' },
    { id: 2, title: 'Thought Record Journal', dueDate: '5 days', status: 'in-progress' },
  ]);

  const [streak, setStreak] = useState(7);
  const [todayMood, setTodayMood] = useState<number | null>(null);

  const avgMood = Math.round(moodData.reduce((sum, d) => sum + d.mood, 0) / moodData.length * 10) / 10;
  const moodTrend = moodData[moodData.length - 1].mood - moodData[0].mood;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back! 👋</h1>
        <p className="text-gray-600 mt-1">Here's your mental performance overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Current Streak</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{streak} days</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Avg Mood (7d)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-gray-900">{avgMood}</p>
                  {moodTrend !== 0 && (
                    <div className="flex items-center gap-1">
                      {moodTrend > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-xs font-medium ${moodTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(moodTrend).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Goals</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{activeGoals.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">To Complete</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{recentAssignments.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mood Tracking */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Mood Trends</CardTitle>
            <CardDescription>Track your emotional patterns over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis domain={[0, 10]} stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Mood"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Confidence"
                  dot={{ fill: '#10b981', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="stress"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Stress"
                  dot={{ fill: '#ef4444', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Mood</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Confidence</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Stress</span>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/student/mood">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Log Today's Mood
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Your mental performance tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/student/chat">
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Talk to AI Coach</div>
                  <div className="text-xs text-gray-500">Get instant mental skills support</div>
                </div>
              </Button>
            </Link>

            <Link href="/student/mood">
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                <Heart className="w-5 h-5 text-pink-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Log Mood</div>
                  <div className="text-xs text-gray-500">Track your emotional state</div>
                </div>
              </Button>
            </Link>

            <Link href="/student/goals">
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                <Target className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Set Goals</div>
                  <div className="text-xs text-gray-500">Track mental & performance goals</div>
                </div>
              </Button>
            </Link>

            <Link href="/student/assignments">
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                <Brain className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Practice Exercises</div>
                  <div className="text-xs text-gray-500">Build mental skills</div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Goals</CardTitle>
            <CardDescription>Your current mental performance objectives</CardDescription>
          </div>
          <Link href="/student/goals">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{goal.title}</h4>
                    <Badge variant="secondary" className="mt-1">{goal.category}</Badge>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Assignments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Upcoming Assignments</CardTitle>
            <CardDescription>Mental skills exercises from your coach</CardDescription>
          </div>
          <Link href="/student/assignments">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAssignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                    <p className="text-sm text-gray-500">Due in {assignment.dueDate}</p>
                  </div>
                </div>
                <Badge variant={assignment.status === 'pending' ? 'secondary' : 'default'}>
                  {assignment.status === 'pending' ? 'To Do' : 'In Progress'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
