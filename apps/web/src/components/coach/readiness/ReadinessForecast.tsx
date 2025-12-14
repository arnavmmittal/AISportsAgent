/**
 * ReadinessForecast Component
 * 7-day readiness predictions with ML-based forecasting
 */

'use client';

import { DashboardSection } from '../layouts/DashboardGrid';
import { ReadinessTrendChart } from '../charts/LineChart';
import StatCard from '../ui/StatCard';

export default function ReadinessForecast() {
  // TODO: Replace with real ML predictions from /api/coach/readiness/forecast
  // Mock 7-day forecast data
  const forecastData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      predicted: 78 + Math.random() * 15,
      confidence: 85 + Math.random() * 10,
      historical: i === 0 ? 82 : undefined, // Today's actual
    };
  });

  // Individual athlete forecasts
  const athleteForecasts = [
    {
      name: 'Sarah Johnson',
      sport: 'Basketball',
      currentReadiness: 95,
      predictedTrend: 'stable',
      nextGameReadiness: 93,
      recommendation: 'Maintain current training load',
      confidence: 92,
    },
    {
      name: 'Mike Chen',
      sport: 'Basketball',
      currentReadiness: 63,
      predictedTrend: 'declining',
      nextGameReadiness: 58,
      recommendation: 'Consider rest day or reduced intensity',
      confidence: 88,
    },
    {
      name: 'Jordan Smith',
      sport: 'Soccer',
      currentReadiness: 94,
      predictedTrend: 'improving',
      nextGameReadiness: 96,
      recommendation: 'Peak performance window - ideal for competition',
      confidence: 90,
    },
    {
      name: 'Alex Martinez',
      sport: 'Soccer',
      currentReadiness: 69,
      predictedTrend: 'fluctuating',
      nextGameReadiness: 72,
      recommendation: 'Monitor closely - inconsistent patterns',
      confidence: 75,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Forecast Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Predicted Avg Readiness"
          value={81.5}
          trend={-0.9}
          subtitle="Next 7 days"
          variant="default"
        />
        <StatCard
          title="Forecast Confidence"
          value="87%"
          subtitle="Model accuracy"
          variant="success"
        />
        <StatCard
          title="Peak Performance Days"
          value={3}
          subtitle="Optimal team readiness"
          variant="success"
        />
        <StatCard
          title="Recovery Days Needed"
          value={2}
          subtitle="Athletes below 70"
          variant="warning"
        />
      </div>

      {/* 7-Day Team Forecast Chart */}
      <DashboardSection
        title="Team Readiness Forecast"
        description="ML-predicted readiness for next 7 days"
      >
        <ReadinessTrendChart data={forecastData} height={300} showPrediction={true} />
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p className="text-sm text-blue-200">
            📊 <strong>Forecast Model:</strong> Predictions based on 30-day historical
            patterns, training load, sleep quality, stress trends, and upcoming
            competition schedule. Confidence intervals shown as shaded areas.
          </p>
        </div>
      </DashboardSection>

      {/* Individual Athlete Forecasts */}
      <DashboardSection
        title="Individual Athlete Forecasts"
        description="Personalized readiness predictions and recommendations"
      >
        <div className="space-y-3">
          {athleteForecasts.map((athlete, index) => (
            <div
              key={index}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {athlete.name}
                  </h4>
                  <p className="text-xs text-slate-400">{athlete.sport}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-300 mb-1">
                    Current: <span className="font-semibold">{athlete.currentReadiness}</span>
                  </div>
                  <div className="text-sm text-slate-300">
                    Next Game:{' '}
                    <span
                      className={`font-semibold ${
                        athlete.nextGameReadiness >= 85
                          ? 'text-green-400'
                          : athlete.nextGameReadiness >= 70
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {athlete.nextGameReadiness}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-400">Trend:</span>
                <span
                  className={`text-xs font-medium ${
                    athlete.predictedTrend === 'improving'
                      ? 'text-green-400'
                      : athlete.predictedTrend === 'declining'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }`}
                >
                  {athlete.predictedTrend === 'improving' && '📈 Improving'}
                  {athlete.predictedTrend === 'declining' && '📉 Declining'}
                  {athlete.predictedTrend === 'stable' && '➡️ Stable'}
                  {athlete.predictedTrend === 'fluctuating' && '📊 Fluctuating'}
                </span>
                <span className="text-xs text-slate-500 ml-auto">
                  {athlete.confidence}% confidence
                </span>
              </div>

              <div className="p-3 bg-slate-900/50 rounded border border-slate-600">
                <p className="text-sm text-slate-200">
                  💡 <strong>Recommendation:</strong> {athlete.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Forecast Factors */}
      <DashboardSection
        title="Key Forecast Factors"
        description="What's influencing the predictions"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              factor: 'Training Load Trend',
              impact: 'High',
              description: 'Team has been under heavy training load for 10 days',
              color: 'amber',
            },
            {
              factor: 'Upcoming Competition',
              impact: 'Medium',
              description: 'Championship game in 5 days may increase stress',
              color: 'blue',
            },
            {
              factor: 'Sleep Quality',
              impact: 'Medium',
              description: 'Recent decline in team sleep duration',
              color: 'amber',
            },
            {
              factor: 'Recovery Time',
              impact: 'Low',
              description: 'Most athletes reporting adequate rest days',
              color: 'green',
            },
          ].map((item, index) => (
            <div
              key={index}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">{item.factor}</h4>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    item.color === 'green'
                      ? 'bg-green-900/30 text-green-400'
                      : item.color === 'amber'
                      ? 'bg-amber-900/30 text-amber-400'
                      : 'bg-blue-900/30 text-blue-400'
                  }`}
                >
                  {item.impact} Impact
                </span>
              </div>
              <p className="text-xs text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
}
