/**
 * HRV Chart Component
 *
 * Whoop-style Heart Rate Variability visualization showing:
 * - Daily HRV trend line over 7-30 days
 * - Baseline HRV reference line (7-day average)
 * - Color-coded zones (red: <50ms, yellow: 50-70ms, green: >70ms)
 * - Interactive tooltips with date and value
 */

'use client';

import { useEffect, useState } from 'react';
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
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/shared/ui/card';
import { Activity } from 'lucide-react';

interface HRVDataPoint {
  date: string; // YYYY-MM-DD
  hrv: number; // ms
  displayDate: string; // "Mon 12/28"
}

interface HRVChartProps {
  athleteId: string;
  days?: number; // Default 30
}

export function HRVChart({ athleteId, days = 30 }: HRVChartProps) {
  const [data, setData] = useState<HRVDataPoint[]>([]);
  const [baseline, setBaseline] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHRVData() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/biometrics?athleteId=${athleteId}&metricType=hrv&days=${days}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch HRV data');
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'No HRV data available');
        }

        // Transform data for Recharts
        const transformedData: HRVDataPoint[] = result.data.map((point: any) => {
          const date = new Date(point.recordedAt);
          return {
            date: date.toISOString().split('T')[0],
            hrv: point.value,
            displayDate: date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'numeric',
              day: 'numeric',
            }),
          };
        });

        setData(transformedData);

        // Calculate 7-day rolling baseline (last 7 days)
        if (transformedData.length >= 7) {
          const last7Days = transformedData.slice(-7);
          const avgHRV = last7Days.reduce((sum, d) => sum + d.hrv, 0) / 7;
          setBaseline(Math.round(avgHRV));
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching HRV data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load HRV data');
        setIsLoading(false);
      }
    }

    fetchHRVData();
  }, [athleteId, days]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5 text-primary" />
            Heart Rate Variability (HRV)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading HRV data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5 text-primary" />
            Heart Rate Variability (HRV)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-muted-foreground mb-2">
              {error || 'No HRV data available'}
            </p>
            <p className="text-sm text-muted-foreground">
              Connect a wearable device (Whoop, Oura, Garmin) to track HRV
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate current HRV status
  const latestHRV = data[data.length - 1].hrv;
  const hrvStatus =
    latestHRV >= 70 ? { label: 'Excellent', color: 'text-secondary' } :
    latestHRV >= 50 ? { label: 'Good', color: 'text-muted-foreground' } :
    { label: 'Low - Recovery Needed', color: 'text-muted-foreground' };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{dataPoint.displayDate}</p>
          <p className="text-lg font-bold text-primary">{dataPoint.hrv} ms</p>
          {baseline && (
            <p className="text-xs text-muted-foreground">
              Baseline: {baseline} ms
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-5 w-5 text-primary" />
          Heart Rate Variability (HRV)
        </CardTitle>
        <CardDescription>
          Latest: <span className={`font-bold ${hrvStatus.color}`}>{latestHRV} ms</span> - {hrvStatus.label}
          {baseline && ` • 7-day avg: ${baseline} ms`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="hrvGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: 'HRV (ms)', angle: -90, position: 'insideLeft' }}
              domain={[30, 110]}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Baseline reference line */}
            {baseline && (
              <ReferenceLine
                y={baseline}
                stroke="#6b7280"
                strokeDasharray="5 5"
                label={{ value: 'Baseline', position: 'right', fontSize: 12 }}
              />
            )}

            {/* Recovery zones */}
            <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.3} />
            <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.3} />

            <Area
              type="monotone"
              dataKey="hrv"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#hrvGradient)"
            />
            <Line
              type="monotone"
              dataKey="hrv"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* HRV Zone Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-secondary/100 mr-2"></div>
            <span>Excellent (&gt;70ms)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-muted/100 mr-2"></div>
            <span>Good (50-70ms)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/100 mr-2"></div>
            <span>Low (&lt;50ms)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
