/**
 * Biometric Overview Component
 *
 * Summary cards displaying 7-day averages for all biometric metrics:
 * - HRV (Heart Rate Variability)
 * - Resting Heart Rate
 * - Sleep Duration
 * - Recovery Score
 *
 * Shows trend indicators (↑ improving, ↓ declining, → stable)
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, Heart, Moon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BiometricSummary {
  hrv: { avg: number; trend: 'up' | 'down' | 'stable'; unit: string } | null;
  restingHR: { avg: number; trend: 'up' | 'down' | 'stable'; unit: string } | null;
  sleep: { avg: number; trend: 'up' | 'down' | 'stable'; unit: string } | null;
  recovery: { avg: number; trend: 'up' | 'down' | 'stable'; unit: string } | null;
}

interface BiometricOverviewProps {
  athleteId: string;
}

export function BiometricOverview({ athleteId }: BiometricOverviewProps) {
  const [summary, setSummary] = useState<BiometricSummary>({
    hrv: null,
    restingHR: null,
    sleep: null,
    recovery: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBiometricSummary() {
      try {
        setIsLoading(true);

        // Fetch last 14 days to calculate trends (last 7 days vs previous 7 days)
        const metrics = ['hrv', 'resting_hr', 'sleep_duration', 'recovery_score'];

        const summaryData: BiometricSummary = {
          hrv: null,
          restingHR: null,
          sleep: null,
          recovery: null,
        };

        for (const metricType of metrics) {
          const response = await fetch(
            `/api/biometrics?athleteId=${athleteId}&metricType=${metricType}&days=14`
          );

          if (response.ok) {
            const result = await response.json();

            if (result.success && result.data.length > 0) {
              const data = result.data.map((d: any) => d.value);

              // Calculate 7-day average (most recent 7 days)
              const last7Days = data.slice(-7);
              const avg = last7Days.reduce((sum: number, val: number) => sum + val, 0) / last7Days.length;

              // Calculate trend (compare last 7 days vs previous 7 days)
              let trend: 'up' | 'down' | 'stable' = 'stable';
              if (data.length >= 14) {
                const previous7Days = data.slice(-14, -7);
                const previousAvg = previous7Days.reduce((sum: number, val: number) => sum + val, 0) / previous7Days.length;

                // Determine trend direction
                // For HRV and recovery score: higher is better
                // For resting HR: lower is better
                const isImproving =
                  metricType === 'resting_hr'
                    ? avg < previousAvg - 2 // HR decreased by more than 2 bpm
                    : avg > previousAvg + (metricType === 'hrv' ? 5 : 5); // HRV/recovery increased

                const isDeclining =
                  metricType === 'resting_hr'
                    ? avg > previousAvg + 2 // HR increased by more than 2 bpm
                    : avg < previousAvg - (metricType === 'hrv' ? 5 : 5); // HRV/recovery decreased

                if (isImproving) trend = 'up';
                else if (isDeclining) trend = 'down';
              }

              const unit = result.data[0].unit || '';

              switch (metricType) {
                case 'hrv':
                  summaryData.hrv = { avg: Math.round(avg), trend, unit };
                  break;
                case 'resting_hr':
                  summaryData.restingHR = { avg: Math.round(avg), trend, unit };
                  break;
                case 'sleep_duration':
                  summaryData.sleep = { avg: Math.round(avg * 10) / 10, trend, unit }; // 1 decimal
                  break;
                case 'recovery_score':
                  summaryData.recovery = { avg: Math.round(avg), trend, unit };
                  break;
              }
            }
          }
        }

        setSummary(summaryData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching biometric summary:', err);
        setIsLoading(false);
      }
    }

    fetchBiometricSummary();
  }, [athleteId]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-secondary" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-muted-foreground" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return 'text-secondary';
    if (trend === 'down') return 'text-muted-foreground';
    return 'text-gray-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* HRV Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <span className="flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              HRV (7-day avg)
            </span>
            {summary.hrv && <TrendIcon trend={summary.hrv.trend} />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.hrv ? (
            <>
              <div className="text-3xl font-bold">
                {summary.hrv.avg} <span className="text-lg text-muted-foreground">{summary.hrv.unit}</span>
              </div>
              <p className={`text-xs mt-1 ${getTrendColor(summary.hrv.trend)}`}>
                {summary.hrv.trend === 'up' && 'Improving recovery'}
                {summary.hrv.trend === 'down' && 'Declining - increase rest'}
                {summary.hrv.trend === 'stable' && 'Stable'}
              </p>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No data</div>
          )}
        </CardContent>
      </Card>

      {/* Resting HR Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <span className="flex items-center">
              <Heart className="mr-2 h-4 w-4" />
              Resting HR (7-day avg)
            </span>
            {summary.restingHR && <TrendIcon trend={summary.restingHR.trend} />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.restingHR ? (
            <>
              <div className="text-3xl font-bold">
                {summary.restingHR.avg} <span className="text-lg text-muted-foreground">{summary.restingHR.unit}</span>
              </div>
              <p className={`text-xs mt-1 ${getTrendColor(summary.restingHR.trend)}`}>
                {summary.restingHR.trend === 'up' && 'Lower is better'}
                {summary.restingHR.trend === 'down' && 'Improving fitness'}
                {summary.restingHR.trend === 'stable' && 'Stable'}
              </p>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No data</div>
          )}
        </CardContent>
      </Card>

      {/* Sleep Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <span className="flex items-center">
              <Moon className="mr-2 h-4 w-4" />
              Sleep (7-day avg)
            </span>
            {summary.sleep && <TrendIcon trend={summary.sleep.trend} />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.sleep ? (
            <>
              <div className="text-3xl font-bold">
                {summary.sleep.avg} <span className="text-lg text-muted-foreground">{summary.sleep.unit}</span>
              </div>
              <p className={`text-xs mt-1 ${getTrendColor(summary.sleep.trend)}`}>
                {summary.sleep.trend === 'up' && 'Good sleep habits'}
                {summary.sleep.trend === 'down' && 'Increase sleep time'}
                {summary.sleep.trend === 'stable' && 'Stable'}
              </p>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No data</div>
          )}
        </CardContent>
      </Card>

      {/* Recovery Score Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <span className="flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Recovery (7-day avg)
            </span>
            {summary.recovery && <TrendIcon trend={summary.recovery.trend} />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.recovery ? (
            <>
              <div className="text-3xl font-bold">
                {summary.recovery.avg}
                <span className="text-lg text-muted-foreground">/{summary.recovery.unit === 'score' ? '100' : summary.recovery.unit}</span>
              </div>
              <p className={`text-xs mt-1 ${getTrendColor(summary.recovery.trend)}`}>
                {summary.recovery.trend === 'up' && 'Excellent recovery'}
                {summary.recovery.trend === 'down' && 'More rest needed'}
                {summary.recovery.trend === 'stable' && 'Stable'}
              </p>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No data</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
