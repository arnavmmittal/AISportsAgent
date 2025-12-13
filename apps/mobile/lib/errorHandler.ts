/**
 * Global Error Handler
 * Provides centralized error handling with user-friendly messages,
 * technical logging, and automatic escalation for critical errors.
 */

import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  AppError,
  ErrorType,
  ErrorContext,
  USER_FRIENDLY_MESSAGES,
  LogErrorRequest,
} from '../types/errors';
import config from '../config';

const API_URL = config.apiUrl;

export class ErrorHandler {
  private static instance: ErrorHandler;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Main error handling entry point
   */
  async handle(error: Error, context?: Partial<ErrorContext>): Promise<void> {
    console.error('ErrorHandler.handle:', error);

    // 1. Classify error type
    const errorType = this.classifyError(error);

    // 2. Log to backend
    await this.logError(error, errorType, context);

    // 3. Show user-friendly message
    const userMessage = this.getUserMessage(error, errorType);
    this.showError(userMessage);

    // 4. Check if critical (requires immediate action)
    if (this.isCritical(error, errorType)) {
      this.handleCriticalError(error);
    }
  }

  /**
   * Classify error into ErrorType
   */
  private classifyError(error: Error): ErrorType {
    if (error.name === 'NetworkError' || error.message.includes('Network request failed')) {
      return 'NETWORK_ERROR';
    }
    if (error.name === 'AuthenticationError' || error.message.includes('unauthorized')) {
      return 'AUTH_ERROR';
    }
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return 'VALIDATION_ERROR';
    }
    if (error.name === 'ServerError' || error.message.includes('500') || error.message.includes('503')) {
      return 'SERVER_ERROR';
    }
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return 'RATE_LIMIT_ERROR';
    }
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'CLIENT_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  /**
   * Get user-friendly message for error
   */
  private getUserMessage(error: Error, errorType: ErrorType): string {
    // Check if error has custom user message
    if ((error as any).userMessage) {
      return (error as any).userMessage;
    }

    // Use predefined message
    return USER_FRIENDLY_MESSAGES[errorType];
  }

  /**
   * Show error alert to user
   */
  private showError(message: string): void {
    Alert.alert('Error', message, [{ text: 'OK', style: 'default' }]);
  }

  /**
   * Log error to backend
   */
  private async logError(
    error: Error,
    errorType: ErrorType,
    context?: Partial<ErrorContext>
  ): Promise<void> {
    try {
      const logRequest: LogErrorRequest = {
        errorType,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        route: context?.route,
        action: context?.action,
        userId: context?.userId,
        requestId: context?.requestId,
        platform: Platform.OS,
        platformVersion: String(Platform.Version),
        appVersion: Constants.expoConfig?.version,
        metadata: context?.metadata,
      };

      await fetch(`${API_URL}/api/errors/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logRequest),
      });
    } catch (logError) {
      console.error('Failed to log error to backend:', logError);
      // Don't throw - we don't want error logging to crash the app
    }
  }

  /**
   * Check if error is critical
   */
  private isCritical(error: Error, errorType: ErrorType): boolean {
    return (
      error.name === 'CrisisDetectedError' ||
      error.name === 'DataCorruptionError' ||
      errorType === 'SERVER_ERROR' && error.message.includes('database')
    );
  }

  /**
   * Handle critical errors with special escalation
   */
  private handleCriticalError(error: Error): void {
    console.error('CRITICAL ERROR:', error);

    Alert.alert(
      'Critical Error',
      'A critical issue occurred. Our team has been notified. If this persists, please contact support.',
      [{ text: 'OK', style: 'destructive' }]
    );

    // In production, could send push notification to support team
  }
}

/**
 * Hook for using error handler in components
 */
export function useErrorHandler() {
  const handler = ErrorHandler.getInstance();

  return {
    handleError: (error: Error, context?: Partial<ErrorContext>) => {
      handler.handle(error, context);
    },
  };
}

/**
 * Utility function for quick error handling
 */
export function handleError(error: Error, context?: Partial<ErrorContext>): void {
  ErrorHandler.getInstance().handle(error, context);
}
