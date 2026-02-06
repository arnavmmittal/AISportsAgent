'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PreGameSession } from './PreGameSession';

interface UpcomingGame {
  id: string;
  opponent: string;
  gameDate: string;
  location?: string;
  homeAway: string;
  stakes: string;
  PreGameSession?: {
    id: string;
    completedAt: string | null;
    moodScore?: number;
    confidenceScore?: number;
  } | null;
}

interface PreGameCardProps {
  className?: string;
}

export function PreGameCard({ className }: PreGameCardProps) {
  const [upcomingGame, setUpcomingGame] = useState<UpcomingGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSession, setShowSession] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    fetchUpcomingGame();
  }, []);

  const fetchUpcomingGame = async () => {
    try {
      const response = await fetch('/api/athlete/schedule?limit=1');
      const data = await response.json();

      if (data.nextGame) {
        setUpcomingGame(data.nextGame);
        setSessionCompleted(!!data.nextGame.PreGameSession?.completedAt);
      }
    } catch (error) {
      console.error('Failed to fetch upcoming game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionComplete = () => {
    setSessionCompleted(true);
    setShowSession(false);
    fetchUpcomingGame(); // Refresh data
  };

  if (loading) {
    return (
      <div className={cn(
        "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl p-6 animate-pulse",
        className
      )}>
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
        <div className="h-4 bg-white/10 rounded w-1/2" />
      </div>
    );
  }

  // No upcoming game
  if (!upcomingGame) {
    return (
      <div className={cn(
        "bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700",
        className
      )}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-300">No Upcoming Games</h3>
            <p className="text-gray-500 text-sm">Add your schedule to get pre-game prep</p>
          </div>
        </div>
        <button className="w-full mt-4 py-2.5 rounded-xl bg-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-600 transition-colors">
          Add Game Schedule
        </button>
      </div>
    );
  }

  const gameDate = new Date(upcomingGame.gameDate);
  const now = new Date();
  const hoursUntilGame = Math.floor((gameDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  const daysUntilGame = Math.floor(hoursUntilGame / 24);

  const isGameDay = daysUntilGame === 0;
  const isGameSoon = hoursUntilGame <= 4 && hoursUntilGame > 0;

  const getStakesColor = (stakes: string) => {
    switch (stakes) {
      case 'CHAMPIONSHIP':
        return 'from-yellow-500 to-amber-600';
      case 'HIGH':
        return 'from-red-500 to-rose-600';
      case 'MEDIUM':
        return 'from-blue-500 to-indigo-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border",
          sessionCompleted
            ? "bg-gradient-to-br from-emerald-900/50 to-green-900/50 border-emerald-500/30"
            : isGameSoon
            ? "bg-gradient-to-br from-amber-900/50 to-orange-900/50 border-amber-500/30"
            : "bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-500/30",
          className
        )}
      >
        {/* Urgency indicator */}
        {isGameSoon && !sessionCompleted && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        )}

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                sessionCompleted
                  ? "from-emerald-500 to-green-600"
                  : getStakesColor(upcomingGame.stakes)
              )}>
                {sessionCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-white" />
                ) : (
                  <Trophy className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">
                  vs {upcomingGame.opponent}
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    upcomingGame.homeAway === 'HOME'
                      ? "bg-green-500/20 text-green-300"
                      : "bg-blue-500/20 text-blue-300"
                  )}>
                    {upcomingGame.homeAway}
                  </span>
                  {upcomingGame.stakes !== 'LOW' && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      upcomingGame.stakes === 'CHAMPIONSHIP'
                        ? "bg-yellow-500/20 text-yellow-300"
                        : upcomingGame.stakes === 'HIGH'
                        ? "bg-red-500/20 text-red-300"
                        : "bg-blue-500/20 text-blue-300"
                    )}>
                      {upcomingGame.stakes}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Game Details */}
          <div className="flex items-center gap-4 mb-4 text-sm text-white/70">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
            </div>
            {upcomingGame.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-[120px]">{upcomingGame.location}</span>
              </div>
            )}
          </div>

          {/* Time until game */}
          <div className={cn(
            "rounded-xl p-3 mb-4",
            sessionCompleted
              ? "bg-emerald-500/10"
              : isGameSoon
              ? "bg-amber-500/10"
              : "bg-white/5"
          )}>
            {sessionCompleted ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-300 font-medium">Pre-game check-in complete!</span>
              </div>
            ) : isGameSoon ? (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-amber-300 font-medium">
                  Game in {hoursUntilGame} hour{hoursUntilGame !== 1 ? 's' : ''} - Time for your mental prep!
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span className="text-white/80">
                  {daysUntilGame > 0
                    ? `${daysUntilGame} day${daysUntilGame !== 1 ? 's' : ''} until game day`
                    : `${hoursUntilGame} hours until game time`}
                </span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          {sessionCompleted ? (
            <button
              onClick={() => setShowSession(true)}
              className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-300 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-500/30 transition-colors"
            >
              View Your Mental Prep
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setShowSession(true)}
              className={cn(
                "w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all",
                isGameSoon
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 animate-pulse"
                  : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90"
              )}
            >
              <Sparkles className="w-5 h-5" />
              Start Pre-Game Check-In
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Pre-Game Session Modal */}
      {showSession && (
        <PreGameSession
          gameScheduleId={upcomingGame.id}
          gameInfo={{
            opponent: upcomingGame.opponent,
            gameDate: upcomingGame.gameDate,
            location: upcomingGame.location,
            stakes: upcomingGame.stakes,
            homeAway: upcomingGame.homeAway,
          }}
          onComplete={handleSessionComplete}
          onClose={() => setShowSession(false)}
        />
      )}
    </>
  );
}
