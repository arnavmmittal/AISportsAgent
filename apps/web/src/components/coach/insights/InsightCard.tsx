/**
 * InsightCard Component
 *
 * Displays AI-generated insights in a clear, actionable format
 * Designed to showcase the value of advanced analytics
 */

'use client';

import { cn } from '@/lib/utils';
import {
  TrendingUp,
  AlertTriangle,
  Zap,
  Target,
  Brain,
  ChevronRight,
  Sparkles,
  BarChart3,
  Flame,
  Calendar,
  Lightbulb,
  Activity,
} from 'lucide-react';

interface InsightMetric {
  value: number | string;
  label: string;
  unit?: string;
}

interface InsightCardProps {
  category: 'correlation' | 'prediction' | 'effective-technique' | 'pattern' | 'alert' | 'burnout' | 'forecast' | 'intervention' | 'deep_insight' | 'intervention_outcome';
  priority: 'high' | 'medium' | 'low' | 'critical';
  headline: string;
  detail: string;
  metric?: InsightMetric;
  athleteName?: string;
  confidence: number;
  evidence: string;
  actionable?: string;
  onClick?: () => void;
}

const CATEGORY_CONFIG = {
  correlation: {
    icon: BarChart3,
    label: 'Performance Correlation',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300',
  },
  prediction: {
    icon: Brain,
    label: 'ML Prediction',
    gradient: 'from-accent/20 to-primary/20',
    border: 'border-accent/30',
    iconBg: 'bg-accent/20',
    iconColor: 'text-accent',
    badge: 'bg-accent/20 text-accent',
  },
  'effective-technique': {
    icon: Target,
    label: 'Effective Technique',
    gradient: 'from-green-500/20 to-emerald-500/20',
    border: 'border-green-500/30',
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-400',
    badge: 'bg-green-500/20 text-green-300',
  },
  pattern: {
    icon: TrendingUp,
    label: 'Pattern Detected',
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  alert: {
    icon: AlertTriangle,
    label: 'Attention Needed',
    gradient: 'from-red-500/20 to-rose-500/20',
    border: 'border-red-500/30',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300',
  },
  burnout: {
    icon: Flame,
    label: 'Burnout Risk',
    gradient: 'from-orange-500/20 to-red-500/20',
    border: 'border-orange-500/30',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-300',
  },
  forecast: {
    icon: Calendar,
    label: 'Readiness Forecast',
    gradient: 'from-sky-500/20 to-indigo-500/20',
    border: 'border-sky-500/30',
    iconBg: 'bg-sky-500/20',
    iconColor: 'text-sky-400',
    badge: 'bg-sky-500/20 text-sky-300',
  },
  intervention: {
    icon: Lightbulb,
    label: 'Intervention',
    gradient: 'from-yellow-500/20 to-amber-500/20',
    border: 'border-yellow-500/30',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-300',
  },
  deep_insight: {
    icon: Sparkles,
    label: 'Deep Insight',
    gradient: 'from-violet-500/20 to-fuchsia-500/20',
    border: 'border-violet-500/30',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-400',
    badge: 'bg-violet-500/20 text-violet-300',
  },
  intervention_outcome: {
    icon: Activity,
    label: 'Technique → Stats',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/40',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
};

const PRIORITY_STYLES = {
  critical: 'ring-2 ring-red-500/50 animate-pulse',
  high: 'ring-2 ring-primary/30',
  medium: '',
  low: 'opacity-90',
};

export function InsightCard({
  category,
  priority,
  headline,
  detail,
  metric,
  athleteName,
  confidence,
  evidence,
  actionable,
  onClick,
}: InsightCardProps) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border transition-all duration-300',
        config.border,
        PRIORITY_STYLES[priority],
        isClickable && 'cursor-pointer hover:scale-[1.02] hover:shadow-lg',
        'bg-gradient-to-br',
        config.gradient
      )}
      onClick={onClick}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 opacity-10">
        <Icon className="w-full h-full" />
      </div>

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-lg', config.iconBg)}>
              <Icon className={cn('w-4 h-4', config.iconColor)} />
            </div>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', config.badge)}>
              {config.label}
            </span>
          </div>
          {athleteName && (
            <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
              {athleteName}
            </span>
          )}
        </div>

        {/* Main headline */}
        <h3 className="text-lg font-semibold text-white mb-2 leading-snug">
          {headline}
        </h3>

        {/* Metric display */}
        {metric && (
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-3xl font-bold text-white">
              {metric.value}
            </span>
            {metric.unit && (
              <span className="text-lg text-slate-400">{metric.unit}</span>
            )}
            <span className="text-sm text-slate-400 ml-2">{metric.label}</span>
          </div>
        )}

        {/* Detail text */}
        <p className="text-sm text-slate-300 mb-3">
          {detail}
        </p>

        {/* Evidence/confidence */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {Math.round(confidence * 100)}% confidence
          </span>
          <span className="truncate">{evidence}</span>
        </div>

        {/* Actionable recommendation */}
        {actionable && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-slate-200">{actionable}</span>
            </div>
          </div>
        )}

        {/* Click indicator */}
        {isClickable && (
          <div className="absolute bottom-4 right-4">
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Featured insight for hero placement
 */
export function FeaturedInsightCard({
  category,
  headline,
  detail,
  metric,
  confidence,
  evidence,
  actionable,
}: Omit<InsightCardProps, 'priority' | 'athleteName' | 'onClick'>) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 p-8',
        config.border,
        'bg-gradient-to-br',
        config.gradient
      )}
    >
      {/* Large background icon */}
      <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 opacity-5">
        <Icon className="w-full h-full" />
      </div>

      <div className="relative">
        {/* Category badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className={cn('p-3 rounded-xl', config.iconBg)}>
            <Icon className={cn('w-6 h-6', config.iconColor)} />
          </div>
          <div>
            <span className={cn('text-sm font-medium px-3 py-1 rounded-full', config.badge)}>
              Top Insight
            </span>
          </div>
        </div>

        {/* Main headline - larger */}
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
          {headline}
        </h2>

        {/* Large metric */}
        {metric && (
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-bold text-white">
              {metric.value}
            </span>
            {metric.unit && (
              <span className="text-2xl text-slate-400">{metric.unit}</span>
            )}
            <span className="text-lg text-slate-400 ml-2">{metric.label}</span>
          </div>
        )}

        {/* Detail */}
        <p className="text-lg text-slate-300 mb-6 max-w-2xl">
          {detail}
        </p>

        {/* Evidence */}
        <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
          <span className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4 text-primary" />
            {Math.round(confidence * 100)}% confidence
          </span>
          <span>{evidence}</span>
        </div>

        {/* Actionable */}
        {actionable && (
          <div className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
            <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">
                Recommended Action
              </span>
              <p className="text-white mt-1">{actionable}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Insight summary stats
 */
export function InsightSummaryBar({
  correlationsFound,
  athletesAnalyzed,
  atRiskCount,
  effectiveTechniques,
}: {
  correlationsFound: number;
  athletesAnalyzed: number;
  atRiskCount: number;
  effectiveTechniques: number;
}) {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-400" />
        <span className="text-sm text-slate-300">
          <strong className="text-white">{correlationsFound}</strong> significant correlations
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-accent" />
        <span className="text-sm text-slate-300">
          <strong className="text-white">{athletesAnalyzed}</strong> athletes analyzed
        </span>
      </div>
      {atRiskCount > 0 && (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-slate-300">
            <strong className="text-white">{atRiskCount}</strong> need attention
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-green-400" />
        <span className="text-sm text-slate-300">
          <strong className="text-white">{effectiveTechniques}</strong> effective techniques
        </span>
      </div>
    </div>
  );
}
