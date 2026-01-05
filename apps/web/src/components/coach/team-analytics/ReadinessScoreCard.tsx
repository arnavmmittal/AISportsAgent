'use client';

/**
 * ReadinessScoreCard - Display individual athlete readiness score
 *
 * Features:
 * - 0-100 readiness score with traffic light color coding
 * - GREEN (≥75): Ready to compete
 * - YELLOW (55-74): Monitor closely
 * - RED (<55): At-risk, intervention needed
 * - Top 3 contributing factors with impact breakdown
 * - Trend indicator (improving/declining)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Moon,
  Brain,
  Activity,
  Heart,
  Battery,
  MessageSquare
} from 'lucide-react';

export interface ReadinessFactor {
  factor: string;
  label: string;
  value: number;
  impact: number;
}

export interface ReadinessScoreData {
  athleteId: string;
  athleteName: string;
  position?: string;
  score: number;
  level: 'GREEN' | 'YELLOW' | 'RED';
  factors: ReadinessFactor[];
  gameDate: string;
  calculatedAt: string;
  trend?: 'improving' | 'declining' | 'stable';
  previousScore?: number;
}

interface ReadinessScoreCardProps {
  data: ReadinessScoreData;
  compact?: boolean;
  onViewDetails?: () => void;
}

const factorIcons: Record<string, React.ElementType> = {
  mood: Brain,
  stress: Activity,
  sleep: Moon,
  hrv: Heart,
  freshness: Battery,
  engagement: MessageSquare,
};

const levelConfig = {
  GREEN: {
    bg: 'bg-secondary/10',
    border: 'border-secondary',
    text: 'text-secondary',
    badgeBg: 'bg-secondary/20',
    badgeText: 'text-secondary',
    label: 'Ready to Compete',
    description: 'Athlete is mentally prepared for peak performance',
  },
  YELLOW: {
    bg: 'bg-muted/10',
    border: 'border-muted-foreground',
    text: 'text-muted-foreground',
    badgeBg: 'bg-muted/20',
    badgeText: 'text-muted-foreground',
    label: 'Monitor Closely',
    description: 'Check in with athlete before competition',
  },
  RED: {
    bg: 'bg-muted-foreground/10',
    border: 'border-muted-foreground',
    text: 'text-muted-foreground',
    badgeBg: 'bg-muted-foreground/20',
    badgeText: 'text-muted-foreground',
    label: 'Intervention Needed',
    description: '1-on-1 conversation recommended',
  },
};

export function ReadinessScoreCard({
  data,
  compact = false,
  onViewDetails
}: ReadinessScoreCardProps) {
  const config = levelConfig[data.level];
  const topFactors = data.factors.slice(0, 3);

  // Calculate score change if previous score available
  const scoreChange = data.previousScore
    ? data.score - data.previousScore
    : null;

  const getTrendIcon = () => {
    if (!data.trend || data.trend === 'stable') {
      return <Minus className="w-4 h-4 text-gray-500" />;
    }
    return data.trend === 'improving'
      ? <TrendingUp className="w-4 h-4 text-secondary" />
      : <TrendingDown className="w-4 h-4 text-muted-foreground" />;
  };

  if (compact) {
    return (
      <Card className={`${config.bg} border-l-4 ${config.border}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{data.athleteName}</h3>
                {data.position && (
                  <span className="text-sm text-gray-500">{data.position}</span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">{config.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${config.text}`}>
                    {data.score}
                  </span>
                  {getTrendIcon()}
                </div>
                <Badge className={`${config.badgeBg} ${config.badgeText} text-xs`}>
                  {data.level}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${config.bg} border-l-4 ${config.border}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">
              {data.athleteName}
            </CardTitle>
            {data.position && (
              <p className="text-sm text-gray-600 mt-1">{data.position}</p>
            )}
          </div>
          <Badge className={`${config.badgeBg} ${config.badgeText}`}>
            {data.level}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Readiness Score Display */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Readiness Score</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-bold ${config.text}`}>
                {data.score}
              </span>
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
            <p className={`text-sm font-medium ${config.text} mt-1`}>
              {config.label}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {config.description}
            </p>
          </div>

          {/* Circular Progress Indicator */}
          <div className="relative w-24 h-24">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - data.score / 100)}`}
                className={config.text}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {getTrendIcon()}
            </div>
          </div>
        </div>

        {/* Score Trend */}
        {scoreChange !== null && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Change from last game:</span>
            <span className={scoreChange >= 0 ? 'text-secondary font-medium' : 'text-muted-foreground font-medium'}>
              {scoreChange >= 0 ? '+' : ''}{scoreChange.toFixed(1)} points
            </span>
          </div>
        )}

        {/* Contributing Factors */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Top Contributing Factors
          </h4>
          <div className="space-y-2">
            {topFactors.map((factor, index) => {
              const Icon = factorIcons[factor.factor] || Activity;
              const impactPercentage = (factor.impact / data.score) * 100;

              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">{factor.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{factor.value.toFixed(1)}</span>
                      <span className={`font-medium ${config.text}`}>
                        +{factor.impact.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        data.level === 'GREEN' ? 'bg-secondary/100' :
                        data.level === 'YELLOW' ? 'bg-muted/100' : 'bg-muted-foreground/100'
                      }`}
                      style={{ width: `${impactPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Date Info */}
        <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>Game: {new Date(data.gameDate).toLocaleDateString()}</span>
          <span>Updated: {new Date(data.calculatedAt).toLocaleTimeString()}</span>
        </div>

        {/* View Details Button */}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="w-full mt-2 px-4 py-2 bg-card border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-muted transition-colors"
          >
            View Athlete Details
          </button>
        )}
      </CardContent>
    </Card>
  );
}
