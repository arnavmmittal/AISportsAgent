'use client';

import { Brain } from 'lucide-react';

export function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6 shadow-lg">
        <Brain className="w-8 h-8 text-primary-foreground" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        Ready when you are
      </h2>
      <p className="text-base text-muted-foreground max-w-xs">
        What&apos;s on your mind heading into your next competition?
      </p>
    </div>
  );
}
