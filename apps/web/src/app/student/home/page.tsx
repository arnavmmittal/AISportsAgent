'use client';

import { useState } from 'react';
import { Calendar, CheckCircle2, Clock, TrendingUp, MessageSquare, Heart, Trophy } from 'lucide-react';
import Link from 'next/link';

interface Assignment {
  id: string;
  title: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'overdue';
  estimatedTime: string;
}

export default function StudentHomePage() {
  // Mock data - will be replaced with API call
  const [stats] = useState({
    wellbeingScore: 7.8,
    wellbeingChange: 0.5,
    checkInStreak: 5,
    goalsCompleted: 3,
    goalsTotal: 7,
    assignmentsPending: 2,
  });

  const [upcomingAssignments] = useState<Assignment[]>([
    {
      id: '1',
      title: 'Pre-Game Mental Preparation Reflection',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'pending',
      estimatedTime: '10 min',
    },
    {
      id: '2',
      title: 'Weekly Wellness Check-In',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'pending',
      estimatedTime: '5 min',
    },
  ]);

  const getTimeUntilDue = (dueDate: Date) => {
    const seconds = Math.floor((dueDate.getTime() - Date.now()) / 1000);

    if (seconds < 0) return 'Overdue';
    if (seconds < 86400) return 'Due today';
    if (seconds < 172800) return 'Due tomorrow';
    return `Due in ${Math.floor(seconds / 86400)} days`;
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome back!
          </h1>
          <p className="mt-3 text-muted-foreground dark:text-gray-400 text-lg">Here's your wellness overview for today</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Wellbeing Score */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-2">Wellbeing</div>
                <div className="text-5xl font-black mb-2">
                  {stats.wellbeingScore.toFixed(1)}<span className="text-2xl opacity-75">/10</span>
                </div>
                <div className={`text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-flex items-center gap-1 font-semibold`}>
                  <TrendingUp className="w-4 h-4" />
                  {stats.wellbeingChange >= 0 ? '+' : ''}{stats.wellbeingChange.toFixed(1)} from last week
                </div>
              </div>
              <div className="text-6xl opacity-20">❤️</div>
            </div>
          </div>

          {/* Check-in Streak */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2">Streak</div>
                <div className="text-5xl font-black mb-2">
                  {stats.checkInStreak} <span className="text-2xl opacity-75">days</span>
                </div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">Keep it up!</div>
              </div>
              <div className="text-6xl opacity-20">🔥</div>
            </div>
          </div>

          {/* Goals Progress */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-2">Goals</div>
                <div className="text-5xl font-black mb-2">
                  {stats.goalsCompleted}<span className="text-2xl opacity-75">/{stats.goalsTotal}</span>
                </div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">
                  {Math.round((stats.goalsCompleted / stats.goalsTotal) * 100)}% complete
                </div>
              </div>
              <div className="text-6xl opacity-20">🏆</div>
            </div>
          </div>

          {/* Pending Assignments */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all hover:scale-105 transform">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-2">Tasks</div>
                <div className="text-5xl font-black mb-2">{stats.assignmentsPending}</div>
                <div className="text-sm bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 inline-block font-semibold">
                  {stats.assignmentsPending > 0 ? 'Pending completion' : 'All caught up!'}
                </div>
              </div>
              <div className="text-6xl opacity-20">⏰</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* AI Coach Quick Access */}
          <Link href="/student/ai-coach">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all cursor-pointer hover:scale-105 transform">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Chat with AI Wellness Coach</h3>
                  <p className="text-base text-blue-100 mt-2 font-semibold">Get personalized support anytime</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Daily Check-in */}
          <Link href="/student/progress">
            <div className="bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl shadow-xl p-8 text-white hover:shadow-2xl transition-all cursor-pointer hover:scale-105 transform">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <Heart className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Daily Check-In</h3>
                  <p className="text-base text-green-100 mt-2 font-semibold">Log your mood and track progress</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Upcoming Assignments */}
        <div className="bg-card rounded-2xl shadow-xl border border-gray-100">
          <div className="p-8 border-b-2 border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">Upcoming Assignments</h2>
              <p className="text-base text-muted-foreground mt-2">Stay on top of your tasks</p>
            </div>
            <Link
              href="/student/assignments"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold hover:scale-105 transform"
            >
              View All →
            </Link>
          </div>

          <div className="p-6 space-y-4">
            {upcomingAssignments.length === 0 ? (
              <div className="p-16 text-center">
                <div className="text-8xl mb-6">✅</div>
                <h3 className="text-3xl font-black text-foreground mb-3">All caught up!</h3>
                <p className="text-lg text-muted-foreground">No pending assignments at the moment</p>
              </div>
            ) : (
              upcomingAssignments.map((assignment) => (
                <div key={assignment.id} className="p-6 hover:bg-gray-50 transition-colors rounded-xl border-2 border-gray-100 hover:border-blue-200">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-foreground mb-2">{assignment.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground font-bold">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{getTimeUntilDue(assignment.dueDate)}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{assignment.estimatedTime}</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/student/assignments/${assignment.id}`}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl transition-all font-bold whitespace-nowrap hover:scale-105 transform"
                    >
                      Start
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Motivational Message */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg shadow p-6 border border-purple-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">You're doing great!</h3>
              <p className="text-sm text-purple-800">
                Your {stats.checkInStreak}-day check-in streak shows real commitment to your mental wellness.
                Keep building healthy habits one day at a time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
