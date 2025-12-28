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
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-card rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">{entry.name}:</span>
            <span className="text-xs font-semibold text-foreground">{entry.value}</span>
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
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          )}

          <XAxis
            dataKey={xAxisKey}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />

          <YAxis
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 },
                  }
                : undefined
            }
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />

          <Tooltip content={<CustomTooltip />} />

          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value) => (
                <span className="text-sm text-muted-foreground">{value}</span>
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
        { key: 'mood', label: 'Mood', color: '#3B82F6' }, // Secondary blue
        { key: 'confidence', label: 'Confidence', color: '#10B981' }, // Success green
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
      lines={[{ key: 'score', label: 'Readiness Score', color: '#10B981', strokeWidth: 3 }]} // Success green
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
      lines={[{ key: 'stress', label: 'Stress Level', color: '#EF4444', strokeWidth: 3 }]} // Destructive red
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
    { key: 'performance', label: 'Performance', color: '#5BA3F5', strokeWidth: 3 }, // Accent light blue
  ];

  if (data.some((d) => d.readiness !== undefined)) {
    lines.push({ key: 'readiness', label: 'Readiness', color: '#10B981' }); // Success green
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
