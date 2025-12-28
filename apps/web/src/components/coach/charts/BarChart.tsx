/**
 * BarChart Component
 * Reusable bar chart for comparisons (cohorts, team stats, distributions)
 */

'use client';

import { cn } from '@/lib/utils';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
  Cell,
} from 'recharts';
import { EmptyChart } from '../ui/EmptyState';

interface DataPoint {
  [key: string]: string | number;
}

interface BarConfig {
  key: string;
  label: string;
  color: string;
}

interface BarChartProps {
  data: DataPoint[];
  bars: BarConfig[];
  xAxisKey: string;
  yAxisLabel?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  emptyMessage?: string;
  className?: string;
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-slate-200 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-slate-300">{entry.name}:</span>
            <span className="text-xs font-semibold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BarChart({
  data,
  bars,
  xAxisKey,
  yAxisLabel,
  height = 300,
  showGrid = true,
  showLegend = true,
  stacked = false,
  emptyMessage,
  className,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return <EmptyChart message={emptyMessage} />;
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          )}

          <XAxis
            dataKey={xAxisKey}
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#475569' }}
          />

          <YAxis
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#94a3b8', fontSize: 12 },
                  }
                : undefined
            }
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#475569' }}
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

          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.label}
              fill={bar.color}
              stackId={stacked ? 'stack' : undefined}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Single-bar chart with custom colors per bar
export function ColoredBarChart({
  data,
  dataKey,
  xAxisKey,
  colorKey,
  height = 300,
  emptyMessage,
}: {
  data: Array<{ [key: string]: string | number }>;
  dataKey: string;
  xAxisKey: string;
  colorKey: string;
  height?: number;
  emptyMessage?: string;
}) {
  if (!data || data.length === 0) {
    return <EmptyChart message={emptyMessage} />;
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey={xAxisKey}
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry[colorKey] as string} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Preset configurations

export function ReadinessDistributionChart({
  data,
  height = 300,
}: {
  data: Array<{ level: string; count: number; color: string }>;
  height?: number;
}) {
  return (
    <ColoredBarChart
      data={data}
      dataKey="count"
      xAxisKey="level"
      colorKey="color"
      height={height}
      emptyMessage="No readiness data to display."
    />
  );
}

export function CohortComparisonChart({
  data,
  height = 300,
}: {
  data: Array<{ cohort: string; readiness: number; mood: number; stress: number }>;
  height?: number;
}) {
  return (
    <BarChart
      data={data}
      bars={[
        { key: 'readiness', label: 'Readiness', color: '#22c55e' },
        { key: 'mood', label: 'Mood', color: '#3b82f6' },
        { key: 'stress', label: 'Stress', color: '#ef4444' },
      ]}
      xAxisKey="cohort"
      yAxisLabel="Average Score"
      height={height}
      emptyMessage="No cohort data available."
    />
  );
}

export function SportComparisonChart({
  data,
  height = 300,
}: {
  data: Array<{ sport: string; athleteCount: number }>;
  height?: number;
}) {
  return (
    <BarChart
      data={data}
      bars={[{ key: 'athleteCount', label: 'Athletes', color: '#8b5cf6' }]}
      xAxisKey="sport"
      yAxisLabel="Number of Athletes"
      height={height}
      showLegend={false}
      emptyMessage="No sport data available."
    />
  );
}

export function GoalCompletionChart({
  data,
  height = 300,
}: {
  data: Array<{ category: string; completed: number; active: number; abandoned: number }>;
  height?: number;
}) {
  return (
    <BarChart
      data={data}
      bars={[
        { key: 'completed', label: 'Completed', color: '#22c55e' },
        { key: 'active', label: 'Active', color: '#3b82f6' },
        { key: 'abandoned', label: 'Abandoned', color: '#64748b' },
      ]}
      xAxisKey="category"
      yAxisLabel="Number of Goals"
      height={height}
      stacked={true}
      emptyMessage="No goal data available."
    />
  );
}
