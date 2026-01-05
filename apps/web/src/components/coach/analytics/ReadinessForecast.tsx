/**
 * Readiness Forecast Component
 *
 * Displays 7-day readiness forecast with:
 * - Historical trend line (past 30 days)
 * - Forecast line with confidence bounds (shaded area)
 * - Risk flags and alerts
 * - Actionable recommendations
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from 'lucide-react';
import type { ReadinessForecast } from '@/lib/analytics/forecasting';

interface ReadinessForecastProps {
  athleteId: string;
  days?: number;
}

export function ReadinessForecastChart({ athleteId, days = 30 }: ReadinessForecastProps) {
  const [forecast, setForecast] = useState<ReadinessForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchForecast() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/analytics/readiness-forecast?athleteId=${athleteId}&days=${days}`);

        if (!response.ok) {
          throw new Error('Failed to fetch readiness forecast');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to generate forecast');
        }

        setForecast(result.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching readiness forecast:', err);
        setError(err instanceof Error ? err.message : 'Failed to load forecast');
        setIsLoading(false);
      }
    }

    fetchForecast();
  }, [athleteId, days]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>7-Day Readiness Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Generating forecast...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !forecast) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>7-Day Readiness Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-1">{error || 'Unable to generate forecast'}</p>
            <p className="text-sm text-muted-foreground">
              Requires at least 14 days of historical readiness data
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { historicalData, forecast: forecastData, currentScore, trend, riskFlags, recommendations } = forecast;

  // Combine historical and forecast data for chart
  const chartData = [
    ...historicalData.map((d) => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
      fullDate: d.date,
      historical: d.score,
      forecast: null,
      lowerBound: null,
      upperBound: null,
      type: 'historical' as const,
    })),
    ...forecastData.map((d) => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
      fullDate: d.date,
      historical: null,
      forecast: d.predictedScore,
      lowerBound: d.lowerBound,
      upperBound: d.upperBound,
      type: 'forecast' as const,
      confidence: d.confidence,
    })),
  ];

  const TrendIcon = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus;
  const trendColor =
    trend === 'improving' ? 'text-secondary' : trend === 'declining' ? 'text-muted-foreground' : 'text-gray-400';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-1">{data.date}</p>
          {data.type === 'historical' ? (
            <p className="text-lg font-bold text-primary">{data.historical}</p>
          ) : (
            <>
              <p className="text-lg font-bold text-blue-600">{data.forecast} (forecast)</p>
              <p className="text-xs text-muted-foreground">
                Range: {data.lowerBound} - {data.upperBound}
              </p>
              <Badge variant={data.confidence === 'high' ? 'success' : data.confidence === 'medium' ? 'warning' : 'default'} className="mt-1 text-xs">
                {data.confidence} confidence
              </Badge>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>7-Day Readiness Forecast</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal text-muted-foreground">Current: {currentScore}</span>
            <TrendIcon className={`h-5 w-5 ${trendColor}`} />
            <span className={`text-sm font-medium ${trendColor}`}>{trend}</span>
          </div>
        </CardTitle>
        <CardDescription>
          Exponential smoothing forecast with confidence bounds
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Risk Flags */}
        {riskFlags.length > 0 && (
          <div className="mb-6 p-4 bg-destructive/10 border-l-4 border-destructive rounded-r">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-destructive mb-2">Risk Flags Detected</p>
                <ul className="space-y-1 text-sm">
                  {riskFlags.map((flag, idx) => (
                    <li key={idx}>• {flag}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Forecast Chart */}
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="confidenceBounds" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              domain={[0, 100]}
              label={{ value: 'Readiness Score', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Reference lines for readiness thresholds */}
            <ReferenceLine y={85} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.3} label={{ value: 'Optimal', position: 'right', fontSize: 10 }} />
            <ReferenceLine y={70} stroke="#3b82f6" strokeDasharray="3 3" strokeOpacity={0.3} label={{ value: 'Good', position: 'right', fontSize: 10 }} />
            <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.3} label={{ value: 'Low', position: 'right', fontSize: 10 }} />

            {/* Confidence bounds (shaded area) */}
            <Area
              type="monotone"
              dataKey="upperBound"
              stroke="none"
              fill="url(#confidenceBounds)"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="lowerBound"
              stroke="none"
              fill="url(#confidenceBounds)"
              fillOpacity={0.3}
            />

            {/* Historical data line */}
            <Line
              type="monotone"
              dataKey="historical"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: '#6366f1', r: 3 }}
              connectNulls={false}
            />

            {/* Forecast line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#3b82f6', r: 4 }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-indigo-500 mr-2"></div>
            <span>Historical (actual)</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-0.5 border-b-2 border-dashed border-blue-500 mr-2"></div>
            <span>Forecast (predicted)</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-2 bg-blue-500 opacity-20 mr-2"></div>
            <span>Confidence bounds (±1 std dev)</span>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-semibold mb-2 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Recommendations
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Forecast Details Table */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-muted-foreground mb-2">7-Day Forecast Details</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-center py-2 px-2">Predicted</th>
                  <th className="text-center py-2 px-2">Range</th>
                  <th className="text-center py-2 px-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {forecastData.map((point) => (
                  <tr key={point.date} className="border-b border-border">
                    <td className="py-2 px-2">
                      {new Date(point.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="text-center py-2 px-2 font-semibold">{point.predictedScore}</td>
                    <td className="text-center py-2 px-2 text-muted-foreground text-xs">
                      {point.lowerBound}-{point.upperBound}
                    </td>
                    <td className="text-center py-2 px-2">
                      <Badge variant={point.confidence === 'high' ? 'success' : point.confidence === 'medium' ? 'warning' : 'default'} className="text-xs">
                        {point.confidence}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
