'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { SpotlightCard } from '@/components/shared/ui/spotlight-card';
import { ToolkitTechniqueCard } from './ToolkitTechniqueCard';

interface Technique {
  name: string;
  description: string;
  reason: string;
  personalNote: string | null;
  chatPrompt: string;
  targetState: string;
  source: string;
}

interface PersonalizedToolkitProps {
  className?: string;
}

export function PersonalizedToolkit({ className }: PersonalizedToolkitProps) {
  const router = useRouter();
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/athlete/toolkit');
        const data = await res.json();
        if (data.success) {
          setTechniques(data.data.techniques || []);
        }
      } catch {
        // Silently fail — toolkit is enhancement, not critical
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleTechniquePress = (prompt: string) => {
    const encoded = encodeURIComponent(prompt);
    router.push(`/student/ai-coach?prompt=${encoded}`);
  };

  if (loading) {
    return (
      <SpotlightCard className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading recommendations...</span>
        </div>
      </SpotlightCard>
    );
  }

  if (techniques.length === 0) return null;

  return (
    <SpotlightCard className={className}>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Recommended for You</h3>
        </div>
        <div className="space-y-3">
          {techniques.map((tech, i) => (
            <ToolkitTechniqueCard key={i} {...tech} onPress={handleTechniquePress} />
          ))}
        </div>
      </div>
    </SpotlightCard>
  );
}
