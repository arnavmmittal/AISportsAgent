/**
 * LineChart Component
 * Reusable line chart for trends over time (mood, readiness, performance)
 */

'use client';

import { cn } from '@/lib/utils';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { EmptyChart } from '../ui/EmptyState';

interface DataPoint {
  [key: string]: string | number;
}

interface LineConfig {
  key: string;
  label: string;
  color: string;
  strokeWidth?: number;
}

interface LineChartProps {
  data: DataPoint[];
  lines: LineConfig[];
  xAxisKey: string;
  yAxisLabel?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  emptyMessage?: string;
  className?: string;
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-slate-200 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
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

export default function LineChart({
  data,
  lines,
  xAxisKey,
  yAxisLabel,
  height = 300,
  showGrid = true,
  showLegend = true,
  emptyMessage,
  className,
}: LineChartProps) {
  // Show empty state if no data
  if (!data || data.length === 0) {
    return <EmptyChart message={emptyMessage} />;
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
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
              iconType="line"
              formatter={(value) => (
                <span className="text-sm text-slate-300">{value}</span>
              )}
            />
          )}

          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 2}
              dot={{ fill: line.color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Preset configurations for common use cases

export function MoodTrendChart({
  data,
  height = 300,
}: {
  data: Array<{ date: string; mood: number; confidence: number }>;
  height?: number;
}) {
  return (
    <LineChart
      data={data}
      lines={[
        { key: 'mood', label: 'Mood', color: '#3b82f6' },
        { key: 'confidence', label: 'Confidence', color: '#10b981' },
      ]}
      xAxisKey="date"
      yAxisLabel="Score (1-10)"
      height={height}
      emptyMessage="No mood data available for this period."
    />
  );
}

export function ReadinessTrendChart({
  data,
  height = 300,
}: {
  data: Array<{ date: string; score: number }>;
  height?: number;
}) {
  return (
    <LineChart
      data={data}
      lines={[{ key: 'score', label: 'Readiness Score', color: '#22c55e', strokeWidth: 3 }]}
      xAxisKey="date"
      yAxisLabel="Readiness (0-100)"
      height={height}
      emptyMessage="No readiness data available."
    />
  );
}

export function StressTrendChart({
  data,
  height = 300,
}: {
  data: Array<{ date: string; stress: number }>;
  height?: number;
}) {
  return (
    <LineChart
      data={data}
      lines={[{ key: 'stress', label: 'Stress Level', color: '#ef4444', strokeWidth: 3 }]}
      xAxisKey="date"
      yAxisLabel="Stress (1-10)"
      height={height}
      emptyMessage="No stress data available."
    />
  );
}

export function PerformanceTrendChart({
  data,
  height = 300,
}: {
  data: Array<{ date: string; performance: number; readiness?: number }>;
  height?: number;
}) {
  const lines: LineConfig[] = [
    { key: 'performance', label: 'Performance', color: '#8b5cf6', strokeWidth: 3 },
  ];

  if (data.some((d) => d.readiness !== undefined)) {
    lines.push({ key: 'readiness', label: 'Readiness', color: '#22c55e' });
  }

  return (
    <LineChart
      data={data}
      lines={lines}
      xAxisKey="date"
      yAxisLabel="Score"
      height={height}
      emptyMessage="No performance data available."
    />
  );
}
