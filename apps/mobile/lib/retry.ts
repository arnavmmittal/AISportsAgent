/**
 * Retry Utility
 * Provides automatic retry logic with exponential backoff
 * for handling transient errors (network failures, timeouts, etc.)
 */

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;  // milliseconds
  maxDelay: number;
  exponential: boolean;
  retryOn?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponential: true,
  retryOn: (error) => {
    // Retry on network errors by default
    return (
      error.name === 'NetworkError' ||
      error.message.includes('Network request failed') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED')
    );
  },
};

/**
 * Execute a function with automatic retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if we shouldn't
      if (opts.retryOn && !opts.retryOn(lastError)) {
        console.log('Error not retryable:', lastError.message);
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === opts.maxRetries) {
        console.log(`Max retries (${opts.maxRetries}) reached, throwing error`);
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = opts.exponential
        ? Math.min(opts.baseDelay * Math.pow(2, attempt), opts.maxDelay)
        : opts.baseDelay;

      console.log(
        `Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms (error: ${lastError.message})`
      );

      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  return (
    error.name === 'NetworkError' ||
    error.message.includes('Network request failed') ||
    error.message.includes('timeout') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('503') ||
    error.message.includes('504')
  );
}

/**
 * Retry with specific network error handling
 */
export async function retryNetworkRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  return withRetry(fn, {
    maxRetries,
    baseDelay: 1000,
    exponential: true,
    retryOn: isRetryableError,
  });
}

/**
 * Retry with linear backoff (for less critical operations)
 */
export async function retryLinear<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  return withRetry(fn, {
    maxRetries,
    baseDelay: 2000,
    exponential: false,
    retryOn: isRetryableError,
  });
}
