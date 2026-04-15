'use client';

import { Brain, Heart as HeartIcon, Moon, Activity, Users, TrendingUp, Sparkles } from 'lucide-react';
import { ReadinessRing } from '@/components/shared/viz/ReadinessRing';
import { Sparkline } from '@/components/shared/viz/Sparkline';
import { AnimatedNumber } from '@/components/shared/ui/animated-number';
import { SpotlightCard } from '@/components/shared/ui/spotlight-card';
import { InsightCard } from './InsightCard';
import { WeekHistory } from './WeekHistory';
import { GameDayBanner } from './GameDayBanner';
import { cn } from '@/lib/utils';

interface ReadinessDimensions {
  mood: number;
  sleep: number;
  stress: number;
  confidence: number;
}

interface AthleteInsights {
  mentalPattern: { text: string; type: string };
  coachConnection: { lastInteractionDaysAgo: number | null; text: string };
  growthMetric: { score: number; delta: number; text: string; label: string };
  weeklyInsight: string;
}

interface DayScore {
  date: Date;
  score: number;
  checkedIn: boolean;
}

interface ReadinessDashboardProps {
  score: number;
  dimensions: ReadinessDimensions;
  trend: 'up' | 'down' | 'stable';
  change: number;
  sparklineData: number[];
  history: DayScore[];
  insights: AthleteInsights | null;
  upcomingGame: { opponent: string; date: Date } | null;
}

function getReadinessMessage(score: number) {
  if (score >= 75) return { title: "You're Ready", color: 'text-readiness-green' };
  if (score >= 55) return { title: 'Room for Improvement', color: 'text-readiness-yellow' };
  return { title: 'Take Care of Yourself', color: 'text-readiness-red' };
}

function DimensionBar({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  const color = value >= 75 ? 'bg-readiness-green' : value >= 55 ? 'bg-readiness-yellow' : 'bg-readiness-red';
  return (
    <SpotlightCard className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-foreground ml-auto">
          <AnimatedNumber value={value} suffix="%" />
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${value}%` }} />
      </div>
    </SpotlightCard>
  );
}

export function ReadinessDashboard({
  score, dimensions, trend, change, sparklineData, history, insights, upcomingGame,
}: ReadinessDashboardProps) {
  const message = getReadinessMessage(score);

  return (
    <div className="space-y-5">
      {/* Game Day Banner */}
      {upcomingGame && <GameDayBanner opponent={upcomingGame.opponent} date={upcomingGame.date} />}

      {/* Readiness Ring + Trend */}
      <SpotlightCard className="p-6 sm:p-8">
        <div className="flex flex-col items-center">
          <ReadinessRing score={score} size="lg" showLabel animate />
          <h3 className={cn('text-lg font-semibold mt-4', message.color)}>{message.title}</h3>
          <div className="flex items-center gap-3 mt-2">
            {sparklineData.length > 1 && (
              <Sparkline data={sparklineData} autoColor showDot showArea width={80} height={28} />
            )}
            <span className={cn(
              'text-sm font-medium',
              trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground',
            )}>
              {trend === 'up' ? `+${change}%` : trend === 'down' ? `-${change}%` : 'Stable'} this week
            </span>
          </div>
        </div>
      </SpotlightCard>

      {/* 4 Dimension Bars */}
      <div className="grid grid-cols-2 gap-3">
        <DimensionBar icon={HeartIcon} label="Mood" value={dimensions.mood} />
        <DimensionBar icon={Moon} label="Sleep" value={dimensions.sleep} />
        <DimensionBar icon={Activity} label="Stress" value={100 - dimensions.stress} />
        <DimensionBar icon={Brain} label="Confidence" value={dimensions.confidence} />
      </div>

      {/* 7-Day History */}
      <WeekHistory history={history} weeklyInsight={insights?.weeklyInsight || ''} />

      {/* 3 Insight Cards */}
      {insights && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InsightCard
            icon={Brain}
            iconColor="text-primary"
            title="Mental Pattern"
            value={insights.mentalPattern.text}
            subtitle=""
          />
          <InsightCard
            icon={Users}
            iconColor="text-accent"
            title="Coach Connection"
            value={insights.coachConnection.text}
            subtitle="Your coach sees aggregated wellness trends"
          />
          <InsightCard
            icon={TrendingUp}
            iconColor="text-success"
            title={insights.growthMetric.label}
            value={
              <span className="flex items-center gap-2">
                <AnimatedNumber value={insights.growthMetric.score} suffix="%" />
                {insights.growthMetric.delta !== 0 && (
                  <span className={cn('text-xs', insights.growthMetric.delta > 0 ? 'text-success' : 'text-destructive')}>
                    {insights.growthMetric.delta > 0 ? '+' : ''}{insights.growthMetric.delta}
                  </span>
                )}
              </span>
            }
            subtitle={insights.growthMetric.text}
          />
        </div>
      )}
    </div>
  );
}
