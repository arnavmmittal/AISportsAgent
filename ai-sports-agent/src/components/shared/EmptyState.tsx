import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type EmptyStateVariant = 'default' | 'error' | 'search' | 'coming-soon';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: EmptyStateVariant;
  className?: string;
}

const variantStyles: Record<EmptyStateVariant, { container: string; iconWrapper: string }> = {
  default: {
    container: 'text-center',
    iconWrapper: 'bg-muted',
  },
  error: {
    container: 'text-center',
    iconWrapper: 'bg-destructive/10 text-destructive',
  },
  search: {
    container: 'text-center',
    iconWrapper: 'bg-blue-50 text-blue-600',
  },
  'coming-soon': {
    container: 'text-center',
    iconWrapper: 'bg-purple-50 text-purple-600',
  },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', styles.container, className)}>
      {icon && (
        <div className={cn(
          'flex items-center justify-center w-16 h-16 rounded-full mb-4',
          styles.iconWrapper
        )}>
          {icon}
        </div>
      )}

      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>

      {description && (
        <p className="text-muted-foreground max-w-md mb-6 text-center">
          {description}
        </p>
      )}

      {action && (
        <Button onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
