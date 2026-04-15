'use client';

import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScatterPoint {
  x: number;
  y: number;
  name: string;
  tier: 'GREEN' | 'YELLOW' | 'RED';
}

interface CorrelationScatterProps {
  xLabel: string;
  yLabel: string;
  points: ScatterPoint[];
  correlation: number;        // -1 to 1
  insight?: string;
  className?: string;
}

const TIER_COLORS = {
  GREEN: 'hsl(var(--accent))',
  YELLOW: 'hsl(var(--chart-3))',
  RED: 'hsl(var(--destructive))',
};

function correlationStrength(r: number): { label: string; dots: number } {
  const abs = Math.abs(r);
  if (abs >= 0.7) return { label: 'Strong', dots: 5 };
  if (abs >= 0.5) return { label: 'Moderate', dots: 4 };
  if (abs >= 0.3) return { label: 'Weak', dots: 3 };
  return { label: 'Negligible', dots: 2 };
}

export function CorrelationScatter({
  xLabel,
  yLabel,
  points,
  correlation,
  insight,
  className,
}: CorrelationScatterProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Chart dimensions
  const margin = { top: 16, right: 16, bottom: 32, left: 36 };
  const width = 320;
  const height = 220;
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  // Scale data to plot area
  const { scaledPoints, xRange, yRange, trendLine } = useMemo(() => {
    if (points.length === 0) {
      return { scaledPoints: [], xRange: [0, 10], yRange: [0, 10], trendLine: null };
    }

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const xMin = Math.min(...xs) - 0.5;
    const xMax = Math.max(...xs) + 0.5;
    const yMin = Math.min(...ys) - 0.5;
    const yMax = Math.max(...ys) + 0.5;

    const scaleX = (v: number) => margin.left + ((v - xMin) / (xMax - xMin)) * plotW;
    const scaleY = (v: number) => margin.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

    const scaled = points.map((p, i) => ({
      ...p,
      cx: scaleX(p.x),
      cy: scaleY(p.y),
      idx: i,
    }));

    // Least-squares trendline
    const n = points.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
    const sumX2 = xs.reduce((a, x) => a + x * x, 0);
    const denom = n * sumX2 - sumX * sumX;

    let tl = null;
    if (denom !== 0 && n >= 3) {
      const slope = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;
      tl = {
        x1: scaleX(xMin),
        y1: scaleY(slope * xMin + intercept),
        x2: scaleX(xMax),
        y2: scaleY(slope * xMax + intercept),
      };
    }

    return {
      scaledPoints: scaled,
      xRange: [xMin, xMax],
      yRange: [yMin, yMax],
      trendLine: tl,
    };
  }, [points, margin.left, margin.top, plotW, plotH]);

  const strength = correlationStrength(correlation);

  return (
    <div className={cn('bg-card border border-border rounded-xl p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-foreground">
          {xLabel} vs {yLabel}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            r = {correlation.toFixed(2)}
          </span>
          <span className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  i < strength.dots ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </span>
          <span className="text-[10px] text-muted-foreground">{strength.label}</span>
        </div>
      </div>

      {/* SVG Scatterplot */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: 220 }}
      >
        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = margin.top + (plotH / 4) * i;
          return (
            <line
              key={`grid-${i}`}
              x1={margin.left}
              y1={y}
              x2={width - margin.right}
              y2={y}
              stroke="hsl(var(--border))"
              strokeWidth={0.5}
              strokeDasharray="2,2"
            />
          );
        })}

        {/* Trendline */}
        {trendLine && (
          <line
            x1={trendLine.x1}
            y1={trendLine.y1}
            x2={trendLine.x2}
            y2={trendLine.y2}
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            strokeDasharray="6,3"
            opacity={0.6}
          />
        )}

        {/* Data points */}
        {scaledPoints.map((p) => (
          <g key={p.idx}>
            <circle
              cx={p.cx}
              cy={p.cy}
              r={hoveredIdx === p.idx ? 6 : 4}
              fill={TIER_COLORS[p.tier]}
              opacity={hoveredIdx !== null && hoveredIdx !== p.idx ? 0.3 : 0.85}
              style={{ transition: 'r 0.15s ease, opacity 0.15s ease' }}
              onMouseEnter={() => setHoveredIdx(p.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
            {/* Tooltip */}
            {hoveredIdx === p.idx && (
              <g>
                <rect
                  x={p.cx + 8}
                  y={p.cy - 24}
                  width={Math.max(80, p.name.length * 6 + 20)}
                  height={32}
                  rx={4}
                  fill="hsl(var(--card))"
                  stroke="hsl(var(--border))"
                  strokeWidth={0.5}
                />
                <text
                  x={p.cx + 14}
                  y={p.cy - 12}
                  className="text-[9px] font-medium"
                  fill="hsl(var(--foreground))"
                >
                  {p.name}
                </text>
                <text
                  x={p.cx + 14}
                  y={p.cy}
                  className="text-[8px]"
                  fill="hsl(var(--muted-foreground))"
                >
                  {xLabel}: {p.x.toFixed(1)} | {yLabel}: {p.y.toFixed(1)}
                </text>
              </g>
            )}
          </g>
        ))}

        {/* Axes labels */}
        <text
          x={margin.left + plotW / 2}
          y={height - 4}
          textAnchor="middle"
          className="text-[9px]"
          fill="hsl(var(--muted-foreground))"
        >
          {xLabel}
        </text>
        <text
          x={10}
          y={margin.top + plotH / 2}
          textAnchor="middle"
          transform={`rotate(-90, 10, ${margin.top + plotH / 2})`}
          className="text-[9px]"
          fill="hsl(var(--muted-foreground))"
        >
          {yLabel}
        </text>
      </svg>

      {/* Actionable insight */}
      {insight && (
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          {insight}
        </p>
      )}
    </div>
  );
}
