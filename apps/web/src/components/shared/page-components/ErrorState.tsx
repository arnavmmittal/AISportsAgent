/**
 * ErrorState Component
 *
 * Displays error messages with retry functionality.
 */

import { AlertTriangle } from 'lucide-react';
import { Card, Button } from '@/design-system/components';

interface ErrorStateProps {
  /**
   * Error title
   */
  title?: string;
  /**
   * Error message
   */
  message: string;
  /**
   * Optional retry callback
   */
  onRetry?: () => void;
  /**
   * Retry button label
   */
  retryLabel?: string;
}

export function ErrorState({
  title = 'Error',
  message,
  onRetry,
  retryLabel = 'Try Again',
}: ErrorStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card variant="elevated" padding="lg" className="text-center max-w-md">
        <AlertTriangle className="w-16 h-16 lg:w-20 lg:h-20 text-danger-600 dark:text-danger-400 mx-auto mb-6" />
        <h3 className="text-2xl lg:text-3xl font-display font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 font-body mb-8">
          {message}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="primary" size="lg">
            {retryLabel}
          </Button>
        )}
      </Card>
    </div>
  );
}
