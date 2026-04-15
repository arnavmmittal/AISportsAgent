'use client';

import { useState } from 'react';
import { ChevronDown, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/shared/ui/textarea';

const CONTEXT_TAGS = [
  'Travel', 'Exam Week', 'Pre-Game', 'Post-Game', 'Injury Recovery',
  'Personal Issue', 'Great Practice', 'Team Conflict', 'Rest Day', 'Competition Week',
] as const;

interface ExpandableDetailsProps {
  confidence: number;
  sleepQuality: number;
  soreness: number;
  rpe: number;
  contextTags: string[];
  notes: string;
  onConfidenceChange: (v: number) => void;
  onSleepQualityChange: (v: number) => void;
  onSorenessChange: (v: number) => void;
  onRpeChange: (v: number) => void;
  onToggleTag: (tag: string) => void;
  onNotesChange: (v: string) => void;
}

function PillSelector({ label, value, onChange, min = 1, max = 10 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
      </div>
      <div className="flex gap-1">
        {steps.map(s => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={cn(
              'flex-1 py-1.5 rounded-md text-xs font-medium transition-all',
              s === value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted',
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ExpandableDetails(props: ExpandableDetailsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>Want to share more?</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="space-y-5 animate-fade-in">
          <PillSelector label="Confidence" value={props.confidence} onChange={props.onConfidenceChange} />
          <PillSelector label="Sleep Quality" value={props.sleepQuality} onChange={props.onSleepQualityChange} />
          <PillSelector label="Soreness" value={props.soreness} onChange={props.onSorenessChange} />
          <PillSelector label="RPE (Exertion)" value={props.rpe} onChange={props.onRpeChange} />
        </div>
      )}

      {/* Context Tags — always visible */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Context (optional)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CONTEXT_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => props.onToggleTag(tag)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150',
                props.contextTags.includes(tag)
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-muted/50 border-border text-muted-foreground hover:border-foreground/30',
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Notes — always visible */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center justify-between">
          <span>Notes (optional)</span>
          <span className="text-xs text-muted-foreground font-normal">{props.notes.length}/200</span>
        </label>
        <Textarea
          value={props.notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => props.onNotesChange(e.target.value.slice(0, 200))}
          placeholder="Anything on your mind?"
          className="min-h-[80px] resize-none"
          maxLength={200}
        />
      </div>
    </div>
  );
}
