'use client';

import { ChevronRight, Wind, Brain, Target, Moon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolkitTechniqueCardProps {
  name: string;
  description: string;
  reason: string;
  personalNote: string | null;
  chatPrompt: string;
  targetState: string;
  onPress: (prompt: string) => void;
}

const STATE_ICONS: Record<string, React.ElementType> = {
  high_stress: Wind,
  low_confidence: Brain,
  pre_game: Target,
  poor_sleep: Moon,
  general: Sparkles,
};

const STATE_COLORS: Record<string, string> = {
  high_stress: 'text-info',
  low_confidence: 'text-primary',
  pre_game: 'text-accent',
  poor_sleep: 'text-chart-3',
  general: 'text-success',
};

export function ToolkitTechniqueCard({ name, description, reason, personalNote, chatPrompt, targetState, onPress }: ToolkitTechniqueCardProps) {
  const Icon = STATE_ICONS[targetState] || Sparkles;
  const color = STATE_COLORS[targetState] || 'text-primary';

  return (
    <button
      onClick={() => onPress(chatPrompt)}
      className="w-full text-left group rounded-xl border bg-card hover:bg-muted/50 transition-colors p-4"
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors', color.replace('text-', 'bg-') + '/10', 'group-hover:' + color.replace('text-', 'bg-') + '/20')}>
          <Icon className={cn('w-4 h-4', color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground">{name}</h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{reason}</p>
          {personalNote && (
            <p className="text-xs text-primary mt-1.5 italic">{personalNote}</p>
          )}
        </div>
        <ChevronRight className={cn('w-4 h-4 text-muted-foreground mt-1 flex-shrink-0 transition-colors', 'group-hover:' + color)} />
      </div>
    </button>
  );
}
