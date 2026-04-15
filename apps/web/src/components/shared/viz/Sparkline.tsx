'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  autoColor?: boolean;
  showDot?: boolean;
  showArea?: boolean;
  animate?: boolean;
  className?: string;
}

function getTrendColor(data: number[]): string {
  if (data.length < 2) return 'hsl(var(--primary))';
  const first = data.slice(0, Math.ceil(data.length / 2));
  const second = data.slice(Math.ceil(data.length / 2));
  const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
  const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;
  const delta = avgSecond - avgFirst;
  if (delta > 0.5) return 'hsl(var(--accent))';
  if (delta < -0.5) return 'hsl(var(--destructive))';
  return 'hsl(var(--primary))';
}

export function Sparkline({
  data,
  width = 80,
  height = 28,
  color,
  autoColor = false,
  showDot = true,
  showArea = false,
  animate = true,
  className,
}: SparklineProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const [animated, setAnimated] = useState(false);

  const resolvedColor = autoColor ? getTrendColor(data) : (color || 'hsl(var(--primary))');

  // Get actual path length after mount for reliable animation
  useEffect(() => {
    if (pathRef.current && animate) {
      const len = pathRef.current.getTotalLength();
      setPathLength(len);
      // Trigger animation on next frame
      requestAnimationFrame(() => setAnimated(true));
    }
  }, [animate, data]);

  const { linePath, areaPath, lastPoint } = useMemo(() => {
    if (!data.length) return { linePath: '', areaPath: '', lastPoint: null };

    const padding = 2;
    const w = width - padding * 2;
    const h = height - padding * 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((v, i) => ({
      x: padding + (i / Math.max(data.length - 1, 1)) * w,
      y: padding + h - ((v - min) / range) * h,
    }));

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const area = `${line} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;

    return {
      linePath: line,
      areaPath: area,
      lastPoint: points[points.length - 1],
    };
  }, [data, width, height]);

  if (!data.length) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('inline-block', className)}
      role="img"
      aria-label={`Trend: ${data.length} data points`}
    >
      {showArea && (
        <path
          d={areaPath}
          fill={resolvedColor}
          fillOpacity={0.08}
        />
      )}
      <path
        ref={pathRef}
        d={linePath}
        fill="none"
        stroke={resolvedColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...(animate && pathLength > 0 ? {
          strokeDasharray: pathLength,
          strokeDashoffset: animated ? 0 : pathLength,
          style: { transition: 'stroke-dashoffset 0.6s ease-out' },
        } : {})}
      />
      {showDot && lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2}
          fill={resolvedColor}
        />
      )}
    </svg>
  );
}
