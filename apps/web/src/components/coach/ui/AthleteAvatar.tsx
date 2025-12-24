/**
 * AthleteAvatar Component
 * Profile images with fallbacks and status indicators
 */

import { cn } from '@/lib/utils';
import { ReadinessLevel } from '@/types/coach-portal';
import Image from 'next/image';
import { useState } from 'react';

interface AthleteAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  readinessLevel?: ReadinessLevel;
  className?: string;
}

const SIZE_CONFIG = {
  xs: {
    container: 'w-6 h-6',
    text: 'text-[10px]',
    status: 'w-2 h-2 border',
  },
  sm: {
    container: 'w-8 h-8',
    text: 'text-xs',
    status: 'w-2.5 h-2.5 border-2',
  },
  md: {
    container: 'w-10 h-10',
    text: 'text-sm',
    status: 'w-3 h-3 border-2',
  },
  lg: {
    container: 'w-12 h-12',
    text: 'text-base',
    status: 'w-3.5 h-3.5 border-2',
  },
  xl: {
    container: 'w-16 h-16',
    text: 'text-lg',
    status: 'w-4 h-4 border-2',
  },
};

const READINESS_STATUS_COLORS = {
  OPTIMAL: 'bg-green-500',
  GOOD: 'bg-blue-500',
  MODERATE: 'bg-amber-500',
  LOW: 'bg-red-500',
  POOR: 'bg-red-900',
};

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-primary',
    'bg-purple-600',
    'bg-pink-600',
    'bg-indigo-600',
    'bg-cyan-600',
    'bg-teal-600',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function AthleteAvatar({
  name,
  imageUrl,
  size = 'md',
  showStatus = false,
  readinessLevel,
  className,
}: AthleteAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeConfig = SIZE_CONFIG[size];
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  const showImage = imageUrl && !imageError;

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Avatar Circle */}
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center font-semibold',
          sizeConfig.container,
          showImage ? 'bg-slate-700' : bgColor,
          'text-white'
        )}
      >
        {showImage ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className={sizeConfig.text}>{initials}</span>
        )}
      </div>

      {/* Status Indicator (Readiness Level) */}
      {showStatus && readinessLevel && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-slate-900',
            sizeConfig.status,
            READINESS_STATUS_COLORS[readinessLevel]
          )}
          aria-label={`Readiness: ${readinessLevel}`}
        />
      )}
    </div>
  );
}

// Avatar group for multiple athletes
export function AthleteAvatarGroup({
  athletes,
  max = 3,
  size = 'md',
}: {
  athletes: Array<{ name: string; imageUrl?: string | null }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}) {
  const displayAthletes = athletes.slice(0, max);
  const remaining = athletes.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {displayAthletes.map((athlete, index) => (
        <div
          key={index}
          className="ring-2 ring-slate-900 rounded-full"
          style={{ zIndex: max - index }}
        >
          <AthleteAvatar
            name={athlete.name}
            imageUrl={athlete.imageUrl}
            size={size}
          />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full bg-slate-700 flex items-center justify-center font-semibold text-slate-300 ring-2 ring-slate-900',
            SIZE_CONFIG[size].container,
            SIZE_CONFIG[size].text
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
