import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function PageHeader({ title, description, action, icon }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-4xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2 text-lg">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
