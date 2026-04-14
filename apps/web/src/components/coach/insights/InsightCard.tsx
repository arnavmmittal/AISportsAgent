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
  Lightbulb,
  Activity,
} from 'lucide-react';

interface InsightMetric {
  value: number | string;
  label: string;
  unit?: string;
}

interface InsightCardProps {
  category: 'correlation' | 'prediction' | 'effective-technique' | 'pattern' | 'alert' | 'intervention' | 'deep_insight' | 'intervention_outcome';
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
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    iconBg: 'bg-primary/20',
    iconColor: 'text-primary',
    badge: 'bg-primary/20 text-primary',
  },
  prediction: {
    icon: Brain,
    label: 'ML Prediction',
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    iconBg: 'bg-accent/20',
    iconColor: 'text-accent',
    badge: 'bg-accent/20 text-accent',
  },
  'effective-technique': {
    icon: Target,
    label: 'Effective Technique',
    bg: 'bg-success/10',
    border: 'border-success/30',
    iconBg: 'bg-success/20',
    iconColor: 'text-success',
    badge: 'bg-success/20 text-success',
  },
  pattern: {
    icon: TrendingUp,
    label: 'Pattern Detected',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  alert: {
    icon: AlertTriangle,
    label: 'Attention Needed',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    iconBg: 'bg-destructive/20',
    iconColor: 'text-destructive',
    badge: 'bg-destructive/20 text-destructive',
  },
  intervention: {
    icon: Lightbulb,
    label: 'Intervention',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    iconBg: 'bg-warning/20',
    iconColor: 'text-warning',
    badge: 'bg-warning/20 text-warning',
  },
  deep_insight: {
    icon: Sparkles,
    label: 'Deep Insight',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-400',
    badge: 'bg-violet-500/20 text-violet-300',
  },
  intervention_outcome: {
    icon: Activity,
    label: 'Technique → Stats',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
};

const PRIORITY_STYLES = {
  critical: 'ring-2 ring-destructive/50',
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
        config.bg
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
            <span className="text-xs text-muted-foreground bg-card/50 px-2 py-1 rounded">
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
              <span className="text-lg text-muted-foreground">{metric.unit}</span>
            )}
            <span className="text-sm text-muted-foreground ml-2">{metric.label}</span>
          </div>
        )}

        {/* Detail text */}
        <p className="text-sm text-muted-foreground mb-3">
          {detail}
        </p>

        {/* Evidence/confidence */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {Math.round(confidence * 100)}% confidence
          </span>
          <span className="truncate">{evidence}</span>
        </div>

        {/* Actionable recommendation */}
        {actionable && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-foreground">{actionable}</span>
            </div>
          </div>
        )}

        {/* Click indicator */}
        {isClickable && (
          <div className="absolute bottom-4 right-4">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
        config.bg
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
              <span className="text-2xl text-muted-foreground">{metric.unit}</span>
            )}
            <span className="text-lg text-muted-foreground ml-2">{metric.label}</span>
          </div>
        )}

        {/* Detail */}
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
          {detail}
        </p>

        {/* Evidence */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-2 bg-card/50 px-3 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4 text-primary" />
            {Math.round(confidence * 100)}% confidence
          </span>
          <span>{evidence}</span>
        </div>

        {/* Actionable */}
        {actionable && (
          <div className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border/50">
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
    <div className="flex flex-wrap gap-4 p-4 bg-card/50 rounded-xl border border-border">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <span className="text-sm text-muted-foreground">
          <strong className="text-white">{correlationsFound}</strong> significant correlations
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-accent" />
        <span className="text-sm text-muted-foreground">
          <strong className="text-white">{athletesAnalyzed}</strong> athletes analyzed
        </span>
      </div>
      {atRiskCount > 0 && (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-sm text-muted-foreground">
            <strong className="text-white">{atRiskCount}</strong> need attention
          </span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-success" />
        <span className="text-sm text-muted-foreground">
          <strong className="text-white">{effectiveTechniques}</strong> effective techniques
        </span>
      </div>
    </div>
  );
}
