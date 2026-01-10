/**
 * PageHeader Component
 *
 * Standardized page header with title, description, and optional action buttons.
 * Used across all pages for consistency.
 */

import { motion } from 'framer-motion';
import { fadeInUp } from '@/design-system/motion';

interface PageHeaderProps {
  /**
   * Page title
   */
  title: string;
  /**
   * Optional subtitle/description
   */
  description?: string;
  /**
   * Optional action buttons (e.g., "Create New", "Filter")
   */
  actions?: React.ReactNode;
  /**
   * Optional back navigation
   */
  backButton?: React.ReactNode;
}

export function PageHeader({ title, description, actions, backButton }: PageHeaderProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8"
    >
      <div className="flex-1">
        {backButton && <div className="mb-4">{backButton}</div>}
        <h1 className="text-4xl lg:text-6xl font-display font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 font-body">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
