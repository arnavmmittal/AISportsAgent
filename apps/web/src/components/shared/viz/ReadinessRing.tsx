'use client';

import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';
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
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: '-20px' });

  const config = SIZE_CONFIG[size];
  const radius = (config.px - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const clamped = Math.max(0, Math.min(100, score));
  const targetOffset = circumference - (clamped / 100) * circumference;

  const spring = useSpring(circumference, {
    mass: 1,
    stiffness: 60,
    damping: 18,
  });

  const dashOffset = useTransform(spring, (v) => v);

  const scoreSpring = useSpring(0, {
    mass: 1,
    stiffness: 60,
    damping: 18,
  });

  const displayScore = useTransform(scoreSpring, (v) => Math.round(v));

  useEffect(() => {
    if (!animate || !isInView) return;
    spring.set(targetOffset);
    scoreSpring.set(clamped);
  }, [animate, isInView, targetOffset, clamped, spring, scoreSpring]);

  useEffect(() => {
    if (!animate) {
      spring.jump(targetOffset);
      scoreSpring.jump(clamped);
    }
  }, [animate, targetOffset, clamped, spring, scoreSpring]);

  const color = getScoreColor(clamped);
  const center = config.px / 2;

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <svg
        ref={ref}
        width={config.px}
        height={config.px}
        viewBox={`0 0 ${config.px} ${config.px}`}
        className="transform -rotate-90"
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
        {/* Score arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
      {/* Score label centered over the SVG */}
      {showLabel && (
        <div
          className="absolute flex flex-col items-center justify-center"
          style={{ width: config.px, height: config.px }}
        >
          <motion.span className={cn('font-bold tabular-nums', config.fontSize)}>
            {displayScore}
          </motion.span>
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
