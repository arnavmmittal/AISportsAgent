/**
 * TypeScript type definitions for Error Handling framework
 */

export interface AppError extends Error {
  type: ErrorType;
  userMessage: string;
  technical: string;
  context?: ErrorContext;
  retryable: boolean;
}

export type ErrorType =
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'CLIENT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'UNKNOWN_ERROR';

export interface ErrorContext {
  route: string;
  action: string;
  userId?: string;
  requestId?: string;
  deviceInfo: DeviceInfo;
  metadata?: Record<string, any>;
}

export interface DeviceInfo {
  platform: 'ios' | 'android';
  platformVersion: string;
  appVersion: string;
}

export interface ErrorLog {
  id: string;
  userId?: string;
  errorType: string;
  errorName: string;
  errorMessage: string;
  errorStack?: string;
  route?: string;
  action?: string;
  requestId?: string;
  platform?: string;
  platformVersion?: string;
  appVersion?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface LogErrorRequest {
  userId?: string;
  errorType: string;
  errorName: string;
  errorMessage: string;
  errorStack?: string;
  route?: string;
  action?: string;
  requestId?: string;
  platform?: string;
  platformVersion?: string;
  appVersion?: string;
  metadata?: Record<string, any>;
}

export interface LogErrorResponse {
  id: string;
  logged: boolean;
}

export const USER_FRIENDLY_MESSAGES: Record<ErrorType, string> = {
  NETWORK_ERROR: "Couldn't connect to the server. Check your internet connection.",
  AUTH_ERROR: 'Your session has expired. Please sign in again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: "Something went wrong on our end. We're working on it.",
  CLIENT_ERROR: 'An unexpected error occurred. Please try again.',
  RATE_LIMIT_ERROR: "You're doing that too quickly. Please wait a moment.",
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};
