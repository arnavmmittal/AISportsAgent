/**
 * ArchetypeBadge Component
 * Visual indicator for athlete psychological archetype
 */

import { AthleteArchetype } from '@/types/coach-portal';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ArchetypeBadgeProps {
  archetype: AthleteArchetype;
  showTooltip?: boolean;
  className?: string;
}

const ARCHETYPE_CONFIG = {
  OVERTHINKER: {
    label: 'Overthinker',
    emoji: '🤔',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500',
    description: 'Analytical but prone to paralysis by analysis',
    coachingTip: 'Help them simplify and focus on process over outcome',
  },
  BURNOUT_RISK: {
    label: 'Burnout Risk',
    emoji: '🔥',
    color: 'bg-orange-500/20 text-orange-300 border-orange-500',
    description: 'High achiever at risk of exhaustion',
    coachingTip: 'Emphasize recovery and sustainable performance',
  },
  MOMENTUM_BUILDER: {
    label: 'Momentum Builder',
    emoji: '📈',
    color: 'bg-green-500/20 text-green-300 border-green-500',
    description: 'Thrives on positive streaks',
    coachingTip: 'Celebrate small wins to maintain momentum',
  },
  INCONSISTENT_PERFORMER: {
    label: 'Inconsistent',
    emoji: '📊',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500',
    description: 'Unpredictable performance patterns',
    coachingTip: 'Build consistent routines and mental anchors',
  },
  PRESSURE_AVOIDER: {
    label: 'Pressure Avoider',
    emoji: '😰',
    color: 'bg-red-500/20 text-red-300 border-red-500',
    description: 'Struggles under high-stakes situations',
    coachingTip: 'Gradual exposure to pressure situations',
  },
  RESILIENT_WARRIOR: {
    label: 'Resilient Warrior',
    emoji: '💪',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500',
    description: 'Bounces back from adversity',
    coachingTip: 'Leverage their resilience to mentor others',
  },
  LOST_ATHLETE: {
    label: 'Lost Athlete',
    emoji: '🧭',
    color: 'bg-slate-500/20 text-slate-300 border-slate-500',
    description: 'Lacking direction or purpose',
    coachingTip: 'Help them reconnect with their "why"',
  },
  PERFECTIONIST: {
    label: 'Perfectionist',
    emoji: '🎯',
    color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500',
    description: 'High standards, self-critical',
    coachingTip: 'Encourage self-compassion and realistic expectations',
  },
} as const;

export default function ArchetypeBadge({
  archetype,
  showTooltip = true,
  className,
}: ArchetypeBadgeProps) {
  const config = ARCHETYPE_CONFIG[archetype];

  const badge = (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold',
        config.color,
        className
      )}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs bg-slate-800 border-slate-700">
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">
              {config.label}
            </p>
            <p className="text-xs text-slate-300">
              {config.description}
            </p>
            <div className="pt-2 border-t border-slate-700">
              <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide">
                Coaching Tip
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {config.coachingTip}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
