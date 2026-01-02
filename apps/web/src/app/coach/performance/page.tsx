'use client';

import { useRouter } from 'next/navigation';
import { Activity, Upload, BarChart3 } from 'lucide-react';

export default function PerformancePage() {
  const router = useRouter();

  const performanceOptions = [
    {
      title: 'Record Performance',
      description: 'Log athlete performance metrics and game statistics',
      icon: Activity,
      href: '/coach/performance/record',
      color: 'from-blue-600 to-purple-600',
    },
    {
      title: 'Import Data',
      description: 'Bulk import performance data from CSV or other sources',
      icon: Upload,
      href: '/coach/performance/import',
      color: 'from-green-600 to-teal-600',
    },
    {
      title: 'Analytics',
      description: 'View performance trends and insights',
      icon: BarChart3,
      href: '/coach/readiness',
      color: 'from-orange-600 to-red-600',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-card shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Performance Tracking
          </h1>
          <p className="mt-3 text-muted-foreground text-lg">
            Manage and analyze athlete performance data
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {performanceOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.href}
                onClick={() => router.push(option.href)}
                className="bg-card rounded-2xl shadow-lg hover:shadow-2xl transition-all p-8 text-left hover:scale-105 transform border border-gray-100 group"
              >
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${option.color} mb-6`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-blue-600 transition-colors">
                  {option.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
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
