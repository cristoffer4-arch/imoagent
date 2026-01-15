/**
 * Retry Logic with Exponential Backoff
 * Handles retry attempts for failed CRM operations
 */

import { logger } from './logger';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Calculate delay for retry attempt using exponential backoff
 */
export function calculateBackoffDelay(
  retryCount: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, retryCount),
    config.maxDelayMs
  );
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  
  return Math.floor(delay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  operationName: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      logger.debug('withRetry', `Attempting ${operationName}`, { attempt, maxRetries: config.maxRetries });
      
      const result = await fn();
      
      if (attempt > 0) {
        logger.info('withRetry', `${operationName} succeeded after ${attempt} retries`);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < config.maxRetries) {
        const delay = calculateBackoffDelay(attempt, config);
        logger.warn('withRetry', `${operationName} failed, retrying in ${delay}ms`, {
          attempt,
          maxRetries: config.maxRetries,
          error: lastError.message,
        });
        
        await sleep(delay);
      } else {
        logger.error('withRetry', `${operationName} failed after ${config.maxRetries} retries`, {
          error: lastError.message,
        });
      }
    }
  }

  throw lastError || new Error(`${operationName} failed after ${config.maxRetries} retries`);
}
