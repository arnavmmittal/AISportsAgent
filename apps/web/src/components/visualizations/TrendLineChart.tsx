/**
 * TrendLineChart Component
 *
 * Displays trend lines for metrics over time
 * Shows multiple metrics with comparative visualization
 */

'use client';

import { useMemo } from 'react';

interface DataPoint {
  date: string;
  values: Record<string, number | null>;
}

interface TrendLineChartProps {
  data: DataPoint[];
  metrics: {
    key: string;
    label: string;
    color: string;
    min?: number;
    max?: number;
  }[];
  height?: number;
  title?: string;
  showLegend?: boolean;
}

export function TrendLineChart({
  data,
  metrics,
  height = 200,
  title,
  showLegend = true,
}: TrendLineChartProps) {
  const chartWidth = 100; // Percentage
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const normalizedData = useMemo(() => {
    return metrics.map((metric) => {
      const values = data.map((d) => d.values[metric.key]).filter((v): v is number => v !== null);
      const min = metric.min ?? Math.min(...values);
      const max = metric.max ?? Math.max(...values);
      const range = max - min || 1;

      return {
        ...metric,
        points: data.map((d, i) => {
          const value = d.values[metric.key];
          if (value === null) return null;
          return {
            x: (i / (data.length - 1 || 1)) * 100,
            y: ((value - min) / range) * 100,
            value,
            date: d.date,
          };
        }).filter(Boolean),
      };
    });
  }, [data, metrics]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}

      <div className="relative" style={{ height }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-400">
          <span>High</span>
          <span>Mid</span>
          <span>Low</span>
        </div>

        {/* Chart area */}
        <div className="absolute left-10 right-0 top-0 bottom-8">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="border-b border-gray-100 dark:border-gray-700"
                style={{ height: '25%' }}
              />
            ))}
          </div>

          {/* SVG for lines */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {normalizedData.map((metric) => {
              if (metric.points.length < 2) return null;

              const pathD = metric.points
                .map((p: any, i: number) => {
                  const x = `${p.x}%`;
                  const y = `${100 - p.y}%`;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ');

              return (
                <g key={metric.key}>
                  {/* Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={metric.color}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    className="drop-shadow-sm"
                  />
                  {/* Points */}
                  {metric.points.map((p: any, i: number) => (
                    <circle
                      key={i}
                      cx={`${p.x}%`}
                      cy={`${100 - p.y}%`}
                      r="4"
                      fill={metric.color}
                      className="drop-shadow-sm"
                    >
                      <title>
                        {p.date}: {p.value.toFixed(1)}
                      </title>
                    </circle>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="absolute left-10 right-0 bottom-0 h-6 flex justify-between text-xs text-gray-400">
          {data.length > 0 && (
            <>
              <span>{formatDate(data[0].date)}</span>
              {data.length > 2 && <span>{formatDate(data[Math.floor(data.length / 2)].date)}</span>}
              <span>{formatDate(data[data.length - 1].date)}</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          {metrics.map((metric) => (
            <div key={metric.key} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: metric.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">{metric.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
