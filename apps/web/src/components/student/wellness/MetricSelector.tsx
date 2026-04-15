'use client';

import { cn } from '@/lib/utils';

interface MetricOption {
  value: number;
  label: string;
}

interface MetricSelectorProps {
  label: string;
  icon: React.ElementType;
  options: MetricOption[];
  value: number;
  onChange: (value: number) => void;
  colorScale: 'positive' | 'negative'; // positive: red→green, negative: green→red
}

const COLOR_SCALES = {
  positive: [
    'border-red-500/30 bg-red-500/5 text-red-500',
    'border-orange-500/30 bg-orange-500/5 text-orange-500',
    'border-yellow-500/30 bg-yellow-500/5 text-yellow-500',
    'border-emerald-500/30 bg-emerald-500/5 text-emerald-500',
    'border-green-500/30 bg-green-500/5 text-green-500',
  ],
  negative: [
    'border-green-500/30 bg-green-500/5 text-green-500',
    'border-emerald-500/30 bg-emerald-500/5 text-emerald-500',
    'border-yellow-500/30 bg-yellow-500/5 text-yellow-500',
    'border-orange-500/30 bg-orange-500/5 text-orange-500',
    'border-red-500/30 bg-red-500/5 text-red-500',
  ],
};

const DOT_COLORS = {
  positive: ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-green-500'],
  negative: ['bg-green-500', 'bg-emerald-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'],
};

export function MetricSelector({ label, icon: Icon, options, value, onChange, colorScale }: MetricSelectorProps) {
  const colors = COLOR_SCALES[colorScale];
  const dots = DOT_COLORS[colorScale];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {options.map((opt, i) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200',
                isSelected
                  ? cn(colors[i], 'scale-105 shadow-sm ring-1 ring-foreground/10')
                  : 'border-border bg-card opacity-60 hover:opacity-90 hover:scale-[1.02]',
              )}
            >
              <div className={cn('w-2.5 h-2.5 rounded-full', isSelected ? dots[i] : 'bg-muted-foreground/30')} />
              <span className={cn('text-xs sm:text-sm font-semibold', !isSelected && 'text-muted-foreground')}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
