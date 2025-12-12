'use client';

import { useState } from 'react';

interface TrackingMetric {
  name: string;
  scale: string;
  target?: number;
  when_to_log: string;
}

interface MetricTrackerWidgetProps {
  metrics: TrackingMetric[];
  adherence_check?: string;
  one_word_debrief?: string;
  onLogMetric?: (metricName: string, value: number) => void;
}

export function MetricTrackerWidget({
  metrics,
  adherence_check,
  one_word_debrief,
  onLogMetric,
}: MetricTrackerWidgetProps) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    metrics.forEach((metric) => {
      initial[metric.name] = metric.target || 5;
    });
    return initial;
  });

  const [logged, setLogged] = useState<Record<string, boolean>>({});

  const handleLog = (metricName: string) => {
    const value = values[metricName] || 5;
    setLogged({ ...logged, [metricName]: true });
    onLogMetric?.(metricName, value);

    // Show success animation
    setTimeout(() => {
      setLogged((prev) => ({ ...prev, [metricName]: false }));
    }, 2000);
  };

  if (metrics.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-2 border-blue-300 rounded-2xl p-6 mt-6 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="font-black text-2xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Track Your Progress 📊
        </h3>
      </div>

      <div className="space-y-6">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
            <label className="block text-base font-bold text-gray-800 mb-3">
              {metric.name}
            </label>

            <div className="flex items-center gap-4 mb-3">
              <input
                type="range"
                min="0"
                max="10"
                value={values[metric.name] || 5}
                onChange={(e) =>
                  setValues({
                    ...values,
                    [metric.name]: parseInt(e.target.value),
                  })
                }
                className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex items-center justify-center min-w-[60px] h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-md">
                <span className="font-black text-3xl">
                  {values[metric.name] || 5}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600 font-medium">
                {metric.scale}
              </p>
              {metric.target && (
                <p className="text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                  Target: {metric.target}
                </p>
              )}
            </div>

            <p className="text-xs text-gray-500 italic mb-4">
              📝 {metric.when_to_log}
            </p>

            <button
              onClick={() => handleLog(metric.name)}
              disabled={logged[metric.name]}
              className={`w-full px-5 py-3 rounded-xl font-bold text-base shadow-md transition-all ${
                logged[metric.name]
                  ? 'bg-green-500 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 hover:shadow-lg hover:scale-[1.02]'
              }`}
            >
              {logged[metric.name] ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Logged!
                </span>
              ) : (
                'Log This Metric'
              )}
            </button>
          </div>
        ))}
      </div>

      {adherence_check && (
        <div className="mt-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
          <p className="text-sm font-bold text-purple-900 mb-2">
            ✅ Adherence Check
          </p>
          <p className="text-base text-purple-800">{adherence_check}</p>
        </div>
      )}

      {one_word_debrief && (
        <div className="mt-4 p-4 bg-pink-50 border-2 border-pink-200 rounded-xl">
          <p className="text-sm font-bold text-pink-900 mb-2">
            💭 One-Word Debrief
          </p>
          <p className="text-base text-pink-800">{one_word_debrief}</p>
        </div>
      )}
    </div>
  );
}
