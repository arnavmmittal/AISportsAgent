'use client';

/**
 * Cost Monitoring Dashboard
 *
 * Purpose: Real-time LLM token usage tracking for pilot
 * Shows: Daily spend, budget utilization, per-school breakdown
 * Alerts: Visual warnings at 80%, critical at 95%
 */

import { useEffect, useState } from 'react';

interface CostData {
  period: string;
  totalCost: string;
  bySchool: Array<{
    schoolId: string;
    totalTokens: number;
    estimatedCost: number;
  }>;
  budgetLimit: number;
  budgetUsed: string;
}

export function CostMonitoringDashboard() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/cost-dashboard');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800 font-medium">❌ Error loading cost data</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const budgetPercentage = parseFloat(data.budgetUsed);
  const isWarning = budgetPercentage >= 80;
  const isCritical = budgetPercentage >= 95;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          💰 LLM Cost Dashboard
        </h2>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Budget Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Daily Budget ({data.period})
          </span>
          <span className="text-lg font-bold text-gray-900">
            ${data.totalCost} / ${data.budgetLimit}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
          <div
            className={`h-6 rounded-full transition-all duration-300 ${
              isCritical
                ? 'bg-red-600'
                : isWarning
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-800">
              {data.budgetUsed}% used
            </span>
          </div>
        </div>

        {/* Budget Status Message */}
        <div className="mt-3">
          {isCritical && (
            <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded">
              <p className="font-bold">🚨 CRITICAL: Budget limit approaching!</p>
              <p className="text-sm mt-1">
                Circuit breaker will trigger at ${data.budgetLimit}. Only $
                {(data.budgetLimit - parseFloat(data.totalCost)).toFixed(2)}{' '}
                remaining.
              </p>
            </div>
          )}

          {isWarning && !isCritical && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
              <p className="font-bold">⚠️ WARNING: 80% of daily budget used</p>
              <p className="text-sm mt-1">
                Monitor usage closely. ${(data.budgetLimit - parseFloat(data.totalCost)).toFixed(2)}{' '}
                remaining.
              </p>
            </div>
          )}

          {!isWarning && (
            <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded">
              <p className="font-semibold">✅ Budget usage healthy</p>
              <p className="text-sm mt-1">
                ${(data.budgetLimit - parseFloat(data.totalCost)).toFixed(2)} remaining
                for today.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Per-School Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Cost by School
        </h3>

        {data.bySchool.length === 0 ? (
          <p className="text-gray-500 text-sm">No usage data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">
                    School
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">
                    Tokens
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">
                    Cost
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.bySchool.map((school) => {
                  const percentage =
                    ((school.estimatedCost / parseFloat(data.totalCost)) * 100).toFixed(1);

                  return (
                    <tr key={school.schoolId} className="border-b border-gray-100">
                      <td className="py-2 px-3 text-gray-900">
                        {school.schoolId}
                      </td>
                      <td className="text-right py-2 px-3 text-gray-700">
                        {school.totalTokens.toLocaleString()}
                      </td>
                      <td className="text-right py-2 px-3 font-medium text-gray-900">
                        ${school.estimatedCost.toFixed(2)}
                      </td>
                      <td className="text-right py-2 px-3 text-gray-600">
                        {percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 font-semibold">
                  <td className="py-2 px-3 text-gray-900">Total</td>
                  <td className="text-right py-2 px-3 text-gray-900">
                    {data.bySchool
                      .reduce((sum, s) => sum + s.totalTokens, 0)
                      .toLocaleString()}
                  </td>
                  <td className="text-right py-2 px-3 text-gray-900">
                    ${data.totalCost}
                  </td>
                  <td className="text-right py-2 px-3 text-gray-900">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Quick Actions
        </h4>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => {
              if (
                confirm(
                  'Are you sure? This will disable all AI chat features until tomorrow.'
                )
              ) {
                fetch('/api/admin/kill-switch', {
                  method: 'POST',
                  body: JSON.stringify({ feature: 'ai_chat', duration: 86400 }),
                }).then(() => alert('AI chat disabled for 24 hours'));
              }
            }}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            🛑 Emergency Kill Switch
          </button>
        </div>
      </div>
    </div>
  );
}
