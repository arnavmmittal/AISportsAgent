'use client';

import { useRouter } from 'next/navigation';
import { Activity, Upload, BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Performance Page - Updated with Design System v2.0
 *
 * Hub for performance tracking features:
 * - Record Performance
 * - Import Data
 * - Analytics
 */

export default function PerformancePage() {
  const router = useRouter();

  const performanceOptions = [
    {
      title: 'Record Performance',
      description: 'Log athlete performance metrics and game statistics',
      icon: Activity,
      href: '/coach/performance/record',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Import Data',
      description: 'Bulk import performance data from CSV or other sources',
      icon: Upload,
      href: '/coach/performance/import',
      iconBg: 'bg-risk-green/10',
      iconColor: 'text-risk-green',
    },
    {
      title: 'Analytics',
      description: 'View performance trends and insights',
      icon: BarChart3,
      href: '/coach/readiness',
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-primary" />
            Performance Tracking
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage and analyze athlete performance data
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {performanceOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.href}
                onClick={() => router.push(option.href)}
                className="card-interactive p-6 text-left group"
              >
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
                  option.iconBg
                )}>
                  <Icon className={cn("w-7 h-7", option.iconColor)} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {option.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
