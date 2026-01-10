/**
 * CorrelationChart Component
 *
 * Displays correlations between mental state metrics and performance outcomes
 * Uses a heatmap-style visualization to show relationships
 */

'use client';

import { useMemo } from 'react';

interface CorrelationData {
  metric: string;
  correlations: {
    performance: number;
    outcome: number;
  };
  sampleSize: number;
}

interface CorrelationChartProps {
  data: CorrelationData[];
  title?: string;
}

export function CorrelationChart({ data, title = 'Mental-Physical Correlations' }: CorrelationChartProps) {
  const getCorrelationColor = (value: number) => {
    // Strong negative: red, weak: gray, strong positive: green
    if (value >= 0.7) return 'bg-green-500';
    if (value >= 0.4) return 'bg-green-400';
    if (value >= 0.2) return 'bg-green-300';
    if (value >= 0.1) return 'bg-green-200';
    if (value > -0.1) return 'bg-gray-200';
    if (value > -0.2) return 'bg-red-200';
    if (value > -0.4) return 'bg-red-300';
    if (value > -0.7) return 'bg-red-400';
    return 'bg-red-500';
  };

  const getCorrelationLabel = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 0.7) return 'Strong';
    if (absValue >= 0.4) return 'Moderate';
    if (absValue >= 0.2) return 'Weak';
    return 'None';
  };

  const formatCorrelation = (value: number) => {
    return (value >= 0 ? '+' : '') + (value * 100).toFixed(0) + '%';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                Mental Metric
              </th>
              <th className="text-center py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                Performance
              </th>
              <th className="text-center py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                Win/Loss
              </th>
              <th className="text-center py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                Samples
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row) => (
              <tr key={row.metric} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-3 px-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {row.metric.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="inline-flex items-center gap-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${getCorrelationColor(row.correlations.performance)}`}
                    />
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {formatCorrelation(row.correlations.performance)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({getCorrelationLabel(row.correlations.performance)})
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="inline-flex items-center gap-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${getCorrelationColor(row.correlations.outcome)}`}
                    />
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {formatCorrelation(row.correlations.outcome)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({getCorrelationLabel(row.correlations.outcome)})
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    n={row.sampleSize}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            <span>Strong -</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-300" />
            <span>Weak -</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-200" />
            <span>None</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-300" />
            <span>Weak +</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span>Strong +</span>
          </div>
        </div>
      </div>
    </div>
  );
}
