'use client';

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child component tree and displays fallback UI.
 * Integrates with Sentry for error tracking.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * // Or with render prop for error details
 * <ErrorBoundary fallbackRender={({ error, resetError }) => (
 *   <div>
 *     <p>Error: {error.message}</p>
 *     <button onClick={resetError}>Try again</button>
 *   </div>
 * )}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Static fallback component */
  fallback?: ReactNode;
  /** Render prop for custom fallback with error details */
  fallbackRender?: (props: {
    error: Error;
    errorInfo: ErrorInfo | null;
    resetError: () => void;
  }) => ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Called when the error boundary resets */
  onReset?: () => void;
  /** Scope name for Sentry (e.g., 'ChatComponent') */
  scope?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to Sentry
    Sentry.withScope((scope) => {
      if (this.props.scope) {
        scope.setTag('component', this.props.scope);
      }
      scope.setExtra('componentStack', errorInfo.componentStack);
      Sentry.captureException(error);
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }
  }

  resetError = (): void => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, fallbackRender } = this.props;

    if (hasError && error) {
      // Use render prop if provided
      if (fallbackRender) {
        return fallbackRender({ error, errorInfo, resetError: this.resetError });
      }

      // Use static fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetError}
        />
      );
    }

    return children;
  }
}

/**
 * Default error fallback UI
 */
interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: DefaultErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
      <div className="text-red-600 dark:text-red-400 mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Something went wrong
      </h3>

      <p className="text-gray-600 dark:text-gray-400 text-center mb-4 max-w-md">
        We encountered an unexpected error. Our team has been notified.
      </p>

      {isDev && (
        <details className="mb-4 max-w-md w-full">
          <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400 hover:underline">
            Error details (dev only)
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      )}

      <div className="flex gap-3">
        <button
          onClick={resetError}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

/**
 * Smaller, inline error fallback for minor components
 */
export function InlineErrorFallback({
  message = 'Failed to load',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 text-sm text-red-600 dark:text-red-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="underline hover:no-underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Card-sized error fallback for dashboard widgets
 */
export function CardErrorFallback({
  title = 'Error loading data',
  onRetry,
}: {
  title?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[150px] p-4 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 text-gray-400 mb-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{title}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorBoundary;
