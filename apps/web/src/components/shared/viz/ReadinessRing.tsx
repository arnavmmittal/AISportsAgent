'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ReadinessRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { px: 48, stroke: 4, fontSize: 'text-xs', labelSize: 'text-[9px]' },
  md: { px: 96, stroke: 6, fontSize: 'text-lg', labelSize: 'text-xs' },
  lg: { px: 160, stroke: 8, fontSize: 'text-2xl', labelSize: 'text-sm' },
} as const;

function getScoreColor(score: number): string {
  if (score >= 85) return 'hsl(var(--accent))';
  if (score >= 70) return 'hsl(var(--primary))';
  if (score >= 50) return 'hsl(var(--chart-3))';
  return 'hsl(var(--destructive))';
}

export function ReadinessRing({
  score,
  size = 'md',
  showLabel = true,
  label,
  animate = true,
  className,
}: ReadinessRingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(!animate);
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);

  const config = SIZE_CONFIG[size];
  const radius = (config.px - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const targetOffset = circumference - (clamped / 100) * circumference;

  // Trigger animation when element enters viewport
  useEffect(() => {
    if (!animate) {
      setTriggered(true);
      setDisplayScore(clamped);
      return;
    }

    const el = ref.current;
    if (!el) return;

    // Use IntersectionObserver with fallback
    if (typeof IntersectionObserver === 'undefined') {
      setTriggered(true);
      setDisplayScore(clamped);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animate, clamped]);

  // Animate the displayed number
  useEffect(() => {
    if (!triggered) return;
    if (!animate) {
      setDisplayScore(clamped);
      return;
    }

    const duration = 800;
    const start = performance.now();
    const from = 0;
    const to = clamped;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [triggered, clamped, animate]);

  const color = getScoreColor(clamped);
  const center = config.px / 2;
  const currentOffset = triggered ? targetOffset : circumference;

  return (
    <div ref={ref} className={cn('relative inline-flex flex-col items-center', className)}>
      <svg
        width={config.px}
        height={config.px}
        viewBox={`0 0 ${config.px} ${config.px}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeOpacity={0.2}
          strokeWidth={config.stroke}
        />
        {/* Score arc — CSS transition instead of framer-motion */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={currentOffset}
          style={{
            transition: animate ? 'stroke-dashoffset 0.8s cubic-bezier(0.33, 1, 0.68, 1)' : 'none',
          }}
        />
      </svg>
      {/* Score label centered over the SVG */}
      {showLabel && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ width: config.px, height: config.px }}
        >
          <span className={cn('font-bold tabular-nums', config.fontSize)}>
            {displayScore}
          </span>
        </div>
      )}
      {label && (
        <span className={cn('mt-1 text-muted-foreground truncate max-w-full', config.labelSize)}>
          {label}
        </span>
      )}
    </div>
  );
}
