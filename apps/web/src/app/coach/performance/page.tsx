'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Activity, Upload, BarChart3 } from 'lucide-react';
import { Card } from '@/design-system/components';
import { fadeInUp, staggerContainer, hoverLift } from '@/design-system/motion';
import { PageHeader } from '@/components/shared/page-components';

export default function PerformancePage() {
  const router = useRouter();

  const performanceOptions = [
    {
      title: 'Record Performance',
      description: 'Log athlete performance metrics and game statistics',
      icon: Activity,
      href: '/coach/performance/record',
      gradient: 'from-primary-500 to-secondary-500',
    },
    {
      title: 'Import Data',
      description: 'Bulk import performance data from CSV or other sources',
      icon: Upload,
      href: '/coach/performance/import',
      gradient: 'from-success-500 to-success-600',
    },
    {
      title: 'Analytics',
      description: 'View performance trends and insights',
      icon: BarChart3,
      href: '/coach/readiness',
      gradient: 'from-warning-500 to-danger-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
          <PageHeader
            title="Performance Tracking"
            description="Manage and analyze athlete performance data"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {performanceOptions.map((option) => {
              const Icon = option.icon;
              return (
                <motion.div key={option.href} variants={fadeInUp}>
                  <motion.div initial="rest" whileHover="hover" animate="rest">
                    <motion.div variants={hoverLift}>
                      <Card
                        variant="elevated"
                        padding="lg"
                        className="cursor-pointer border-2 border-transparent hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
                        onClick={() => router.push(option.href)}
                      >
                        <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${option.gradient} mb-6`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-3">
                          {option.title}
                        </h3>
                        <p className="text-base text-gray-600 dark:text-gray-400 font-body leading-relaxed">
                          {option.description}
                        </p>
                      </Card>
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
