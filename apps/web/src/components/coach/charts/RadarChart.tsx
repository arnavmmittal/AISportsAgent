/**
 * RadarChart Component
 * 6-dimensional readiness visualization and multi-metric analysis
 */

'use client';

import { cn } from '@/lib/utils';
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
} from 'recharts';
import { EmptyChart } from '../ui/EmptyState';
import { ReadinessDimensions } from '@/types/coach-portal';

interface RadarDataPoint {
  dimension: string;
  [key: string]: string | number;
}

interface RadarMetric {
  key: string;
  label: string;
  color: string;
  fillOpacity?: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  metrics: RadarMetric[];
  height?: number;
  showLegend?: boolean;
  emptyMessage?: string;
  className?: string;
}

// Custom tooltip
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-slate-200 mb-2">
        {payload[0]?.payload?.dimension}
      </p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-slate-300">{entry.name}:</span>
            <span className="text-xs font-semibold text-white">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RadarChart({
  data,
  metrics,
  height = 400,
  showLegend = true,
  emptyMessage,
  className,
}: RadarChartProps) {
  if (!data || data.length === 0) {
    return <EmptyChart message={emptyMessage} />;
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadarChart data={data}>
          <PolarGrid stroke="#475569" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
          />

          <Tooltip content={<CustomTooltip />} />

          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => (
                <span className="text-sm text-slate-300">{value}</span>
              )}
            />
          )}

          {metrics.map((metric) => (
            <Radar
              key={metric.key}
              name={metric.label}
              dataKey={metric.key}
              stroke={metric.color}
              fill={metric.color}
              fillOpacity={metric.fillOpacity || 0.2}
              strokeWidth={2}
            />
          ))}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Readiness-specific radar chart
export function ReadinessRadarChart({
  dimensions,
  height = 400,
  athleteName,
}: {
  dimensions: ReadinessDimensions;
  height?: number;
  athleteName?: string;
}) {
  const data: RadarDataPoint[] = [
    { dimension: 'Physical', score: dimensions.physical },
    { dimension: 'Mental', score: dimensions.mental },
    { dimension: 'Emotional', score: dimensions.emotional },
    { dimension: 'Recovery', score: dimensions.recovery },
    { dimension: 'Contextual', score: dimensions.contextual },
    { dimension: 'Social', score: dimensions.social },
  ];

  return (
    <div className="space-y-2">
      {athleteName && (
        <h4 className="text-sm font-medium text-slate-300 text-center">
          {athleteName}'s Readiness Profile
        </h4>
      )}
      <RadarChart
        data={data}
        metrics={[
          {
            key: 'score',
            label: 'Readiness Dimensions',
            color: '#3B82F6', // secondary (bright blue)
            fillOpacity: 0.3,
          },
        ]}
        height={height}
        showLegend={false}
        emptyMessage="No readiness data available."
      />
    </div>
  );
}

// Compare two athletes' readiness profiles
export function ReadinessComparisonRadar({
  athlete1Name,
  athlete1Dimensions,
  athlete2Name,
  athlete2Dimensions,
  height = 400,
}: {
  athlete1Name: string;
  athlete1Dimensions: ReadinessDimensions;
  athlete2Name: string;
  athlete2Dimensions: ReadinessDimensions;
  height?: number;
}) {
  const data: RadarDataPoint[] = [
    {
      dimension: 'Physical',
      athlete1: athlete1Dimensions.physical,
      athlete2: athlete2Dimensions.physical,
    },
    {
      dimension: 'Mental',
      athlete1: athlete1Dimensions.mental,
      athlete2: athlete2Dimensions.mental,
    },
    {
      dimension: 'Emotional',
      athlete1: athlete1Dimensions.emotional,
      athlete2: athlete2Dimensions.emotional,
    },
    {
      dimension: 'Recovery',
      athlete1: athlete1Dimensions.recovery,
      athlete2: athlete2Dimensions.recovery,
    },
    {
      dimension: 'Contextual',
      athlete1: athlete1Dimensions.contextual,
      athlete2: athlete2Dimensions.contextual,
    },
    {
      dimension: 'Social',
      athlete1: athlete1Dimensions.social,
      athlete2: athlete2Dimensions.social,
    },
  ];

  return (
    <RadarChart
      data={data}
      metrics={[
        {
          key: 'athlete1',
          label: athlete1Name,
          color: '#3B82F6', // secondary (bright blue)
          fillOpacity: 0.2,
        },
        {
          key: 'athlete2',
          label: athlete2Name,
          color: '#5BA3F5', // accent (light blue)
          fillOpacity: 0.2,
        },
      ]}
      height={height}
      emptyMessage="No data available for comparison."
    />
  );
}

// Team average vs individual athlete
export function AthleteVsTeamRadar({
  athleteName,
  athleteDimensions,
  teamAvgDimensions,
  height = 400,
}: {
  athleteName: string;
  athleteDimensions: ReadinessDimensions;
  teamAvgDimensions: ReadinessDimensions;
  height?: number;
}) {
  const data: RadarDataPoint[] = [
    {
      dimension: 'Physical',
      athlete: athleteDimensions.physical,
      team: teamAvgDimensions.physical,
    },
    {
      dimension: 'Mental',
      athlete: athleteDimensions.mental,
      team: teamAvgDimensions.mental,
    },
    {
      dimension: 'Emotional',
      athlete: athleteDimensions.emotional,
      team: teamAvgDimensions.emotional,
    },
    {
      dimension: 'Recovery',
      athlete: athleteDimensions.recovery,
      team: teamAvgDimensions.recovery,
    },
    {
      dimension: 'Contextual',
      athlete: athleteDimensions.contextual,
      team: teamAvgDimensions.contextual,
    },
    {
      dimension: 'Social',
      athlete: athleteDimensions.social,
      team: teamAvgDimensions.social,
    },
  ];

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-slate-300 text-center">
        {athleteName} vs Team Average
      </h4>
      <RadarChart
        data={data}
        metrics={[
          {
            key: 'athlete',
            label: athleteName,
            color: '#3B82F6', // secondary (bright blue)
            fillOpacity: 0.3,
          },
          {
            key: 'team',
            label: 'Team Average',
            color: '#94A3B8', // muted-foreground (silver)
            fillOpacity: 0.1,
          },
        ]}
        height={height}
        emptyMessage="No data available."
      />
    </div>
  );
}

// Generic multi-metric radar
export function MultiMetricRadar({
  data,
  title,
  height = 400,
}: {
  data: Array<{ metric: string; score: number }>;
  title?: string;
  height?: number;
}) {
  const radarData = data.map((item) => ({
    dimension: item.metric,
    score: item.score,
  }));

  return (
    <div className="space-y-2">
      {title && (
        <h4 className="text-sm font-medium text-slate-300 text-center">{title}</h4>
      )}
      <RadarChart
        data={radarData}
        metrics={[
          {
            key: 'score',
            label: 'Score',
            color: '#3b82f6',
            fillOpacity: 0.3,
          },
        ]}
        height={height}
        showLegend={false}
        emptyMessage="No metric data available."
      />
    </div>
  );
}
