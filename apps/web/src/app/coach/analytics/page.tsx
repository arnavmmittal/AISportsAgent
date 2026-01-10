'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, Button, Badge, AnimatedCounter } from '@/design-system/components';
import { ChevronLeft, TrendingUp, Users, Brain, MessageSquare, Target, AlertTriangle, BarChart3, Zap, LineChart } from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/design-system/motion';
import { PageHeader } from '@/components/shared/page-components';

export default function CoachAnalyticsPage() {
  const metrics = [
    {
      title: 'Performance Trends',
      icon: TrendingUp,
      description: 'Track athlete performance over time with detailed metrics and visualizations.',
      stats: [
        { label: 'Weekly Average', value: '+12%', variant: 'success' as const },
        { label: 'Monthly Trend', value: '↑ Improving', variant: 'success' as const },
      ],
    },
    {
      title: 'Sport Breakdown',
      icon: Users,
      description: 'Analytics segmented by sport category.',
      stats: [
        { label: 'Basketball', value: '12 athletes', variant: 'primary' as const },
        { label: 'Soccer', value: '8 athletes', variant: 'secondary' as const },
      ],
    },
    {
      title: 'Mental Health',
      icon: Brain,
      description: 'Team-wide mental wellness indicators.',
      stats: [
        { label: 'Avg Mood Score', value: '7.2/10', variant: 'success' as const },
        { label: 'Avg Confidence', value: '7.8/10', variant: 'success' as const },
        { label: 'Avg Stress', value: '4.3/10', variant: 'warning' as const },
      ],
    },
    {
      title: 'Engagement',
      icon: MessageSquare,
      description: 'Chat and interaction statistics.',
      stats: [
        { label: 'Active Today', value: '18 athletes', variant: 'primary' as const },
        { label: 'This Week', value: '24 athletes', variant: 'primary' as const },
        { label: 'Engagement Rate', value: '92%', variant: 'success' as const },
      ],
    },
    {
      title: 'Goal Progress',
      icon: Target,
      description: 'Team goal completion metrics.',
      stats: [
        { label: 'Active Goals', value: '45', variant: 'primary' as const },
        { label: 'Completed', value: '37', variant: 'success' as const },
        { label: 'Success Rate', value: '82%', variant: 'success' as const },
      ],
    },
    {
      title: 'Risk Patterns',
      icon: AlertTriangle,
      description: 'Identified patterns requiring attention.',
      stats: [
        { label: 'At-Risk Athletes', value: '3', variant: 'danger' as const },
        { label: 'Crisis Alerts', value: '2', variant: 'danger' as const },
        { label: 'Resolved This Week', value: '5', variant: 'success' as const },
      ],
    },
  ];

  const comingSoon = [
    {
      title: 'Custom Reports',
      icon: BarChart3,
      description: 'Generate custom analytics reports for specific time periods and metrics.',
      gradient: 'from-primary-500 to-primary-600',
    },
    {
      title: 'AI Predictions',
      icon: Zap,
      description: 'ML-powered predictions for athlete performance and risk levels.',
      gradient: 'from-secondary-500 to-secondary-600',
    },
    {
      title: 'Comparative Analysis',
      icon: LineChart,
      description: 'Compare individual athletes or teams against benchmarks.',
      gradient: 'from-success-500 to-success-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
          <PageHeader
            title="Team Analytics"
            description="Deep dive into performance metrics and trends"
            backButton={
              <Link href="/coach/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
            }
          />

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div key={metric.title} variants={fadeInUp}>
                  <Card variant="elevated" padding="lg" className="h-full">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-1">
                          {metric.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-body">
                          {metric.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      {metric.stats.map((stat) => (
                        <div key={stat.label} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-body">
                            {stat.label}:
                          </span>
                          <Badge variant={stat.variant} size="sm">
                            {stat.value}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Coming Soon Section */}
          <motion.div variants={fadeInUp}>
            <Card variant="elevated" padding="lg">
              <div className="mb-6">
                <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-warning-600 dark:text-warning-400" />
                  Coming Soon
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-400 font-body">
                  Advanced analytics features in development
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {comingSoon.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                    >
                      <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.gradient} mb-3`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-display font-bold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-body">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
