/**
 * EmptyState Component
 *
 * Displays when no data is available. Includes icon, message, and optional CTA.
 */

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card, Button } from '@/design-system/components';
import { fadeInUp } from '@/design-system/motion';

interface EmptyStateProps {
  /**
   * Icon component from lucide-react
   */
  icon: LucideIcon;
  /**
   * Primary message
   */
  title: string;
  /**
   * Optional secondary message
   */
  description?: string;
  /**
   * Optional CTA button props
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  /**
   * Icon color variant
   */
  iconColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconColor = 'neutral',
}: EmptyStateProps) {
  const colorClasses = {
    primary: 'text-primary-600 dark:text-primary-400',
    secondary: 'text-secondary-600 dark:text-secondary-400',
    success: 'text-success-600 dark:text-success-400',
    warning: 'text-warning-600 dark:text-warning-400',
    danger: 'text-danger-600 dark:text-danger-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <motion.div variants={fadeInUp}>
      <Card variant="elevated" padding="lg" className="text-center max-w-md mx-auto">
        <Icon className={`w-16 h-16 lg:w-24 lg:h-24 mx-auto mb-6 ${colorClasses[iconColor]}`} />
        <h3 className="text-2xl lg:text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        {description && (
          <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 font-body mb-8">
            {description}
          </p>
        )}
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'primary'}
            size="lg"
          >
            {action.label}
          </Button>
        )}
      </Card>
    </motion.div>
  );
}
