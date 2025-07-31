import { ReplicateErrorType } from "./replicateErrors";

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitterFactor?: number;
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  totalDuration: number;
  errors: Error[];
}

export class RetryManager {
  private readonly defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    jitterFactor: 0.1, // 10% jitter
  };

  /**
   * Execute an operation with retry logic and exponential backoff
   */
  async execute<T>(
    operation: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options };
    const errors: Error[] = [];
    const startTime = Date.now();

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Log successful retry if we had previous failures
        if (attempt > 0) {
          console.log(`Operation succeeded after ${attempt} retries`, {
            attempts: attempt + 1,
            duration: Date.now() - startTime,
            previousErrors: errors.length
          });
        }
        
        return result;
      } catch (error) {
        const typedError = error as Error;
        errors.push(typedError);
        
        // Don't retry on the last attempt
        if (attempt === config.maxRetries) {
          console.error(`Operation failed after ${attempt + 1} attempts`, {
            totalDuration: Date.now() - startTime,
            errors: errors.map(e => e.message)
          });
          throw this.createAggregateError(errors, attempt + 1);
        }
        
        // Check if error is retryable
        if (!this.isRetryableError(typedError)) {
          console.error(`Non-retryable error encountered`, {
            error: typedError.message,
            attempt: attempt + 1
          });
          throw typedError;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, config);
        
        console.warn(`Operation failed, retrying in ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries: config.maxRetries,
          error: typedError.message,
          delay
        });
        
        await this.sleep(delay);
      }
    }
    
    // This should never be reached, but TypeScript requires it
    throw new Error('Unexpected retry loop exit');
  }

  /**
   * Execute with detailed result information including retry statistics
   */
  async executeWithStats<T>(
    operation: () => Promise<T>,
    options?: RetryOptions
  ): Promise<RetryResult<T>> {
    const config = { ...this.defaultOptions, ...options };
    const errors: Error[] = [];
    const startTime = Date.now();

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await operation();
        return {
          result,
          attempts: attempt + 1,
          totalDuration: Date.now() - startTime,
          errors: [...errors]
        };
      } catch (error) {
        const typedError = error as Error;
        errors.push(typedError);
        
        if (attempt === config.maxRetries || !this.isRetryableError(typedError)) {
          throw this.createAggregateError(errors, attempt + 1);
        }
        
        const delay = this.calculateDelay(attempt, config);
        await this.sleep(delay);
      }
    }
    
    throw new Error('Unexpected retry loop exit');
  }

  /**
   * Determine if an error should trigger a retry
   */
  private isRetryableError(error: Error): boolean {
    // Check for network errors
    if (this.isNetworkError(error)) {
      return true;
    }
    
    // Check for HTTP status codes that should be retried
    if (this.hasRetryableStatusCode(error)) {
      return true;
    }
    
    // Check for specific error messages that indicate transient issues
    if (this.hasRetryableMessage(error)) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if error is a network-related error
   */
  private isNetworkError(error: Error): boolean {
    const networkErrorCodes = [
      'ECONNRESET',
      'ECONNREFUSED', 
      'ETIMEDOUT',
      'ENOTFOUND',
      'EAI_AGAIN',
      'EPIPE',
      'ECONNABORTED'
    ];
    
    return networkErrorCodes.some(code => 
      error.message?.includes(code) || (error as any).code === code
    );
  }

  /**
   * Check if error has a retryable HTTP status code
   */
  private hasRetryableStatusCode(error: Error): boolean {
    const retryableStatusCodes = [
      429, // Too Many Requests (Rate Limit)
      500, // Internal Server Error
      502, // Bad Gateway
      503, // Service Unavailable
      504, // Gateway Timeout
      507, // Insufficient Storage
      508, // Loop Detected
      510, // Not Extended
      511  // Network Authentication Required
    ];
    
    const status = (error as any).status || (error as any).statusCode;
    return status && retryableStatusCodes.includes(status);
  }

  /**
   * Check if error message indicates a transient issue
   */
  private hasRetryableMessage(error: Error): boolean {
    const retryableMessages = [
      'network error',
      'connection timeout',
      'request timeout',
      'temporary failure',
      'service unavailable',
      'rate limit',
      'quota exceeded',
      'throttled',
      'overloaded'
    ];
    
    const message = error.message?.toLowerCase() || '';
    return retryableMessages.some(msg => message.includes(msg));
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, config: Required<RetryOptions>): number {
    // Calculate exponential backoff
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    
    // Apply maximum delay cap
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * config.jitterFactor * (Math.random() - 0.5) * 2;
    const finalDelay = Math.max(0, cappedDelay + jitter);
    
    return Math.round(finalDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create an aggregate error from multiple retry attempts
   */
  private createAggregateError(errors: Error[], attempts: number): Error {
    const lastError = errors[errors.length - 1];
    const aggregateError = new Error(
      `Operation failed after ${attempts} attempts. Last error: ${lastError.message}`
    );
    
    // Preserve the original error properties
    (aggregateError as any).originalErrors = errors;
    (aggregateError as any).attempts = attempts;
    (aggregateError as any).lastError = lastError;
    
    // Preserve status code from the last error if available
    if ((lastError as any).status) {
      (aggregateError as any).status = (lastError as any).status;
    }
    
    return aggregateError;
  }

  /**
   * Get retry configuration for specific error types
   */
  static getConfigForErrorType(errorType: ReplicateErrorType): RetryOptions {
    switch (errorType) {
      case ReplicateErrorType.RATE_LIMIT:
        return {
          maxRetries: 5,
          baseDelay: 5000, // Start with 5 seconds for rate limits
          maxDelay: 60000, // Max 1 minute
          backoffMultiplier: 2,
          jitterFactor: 0.2 // More jitter for rate limits
        };
        
      case ReplicateErrorType.SERVER_ERROR:
        return {
          maxRetries: 3,
          baseDelay: 2000, // 2 seconds for server errors
          maxDelay: 30000, // Max 30 seconds
          backoffMultiplier: 2,
          jitterFactor: 0.1
        };
        
      case ReplicateErrorType.NETWORK_ERROR:
        return {
          maxRetries: 4,
          baseDelay: 1000, // 1 second for network errors
          maxDelay: 15000, // Max 15 seconds
          backoffMultiplier: 2,
          jitterFactor: 0.15
        };
        
      case ReplicateErrorType.TIMEOUT:
        return {
          maxRetries: 2,
          baseDelay: 3000, // 3 seconds for timeouts
          maxDelay: 20000, // Max 20 seconds
          backoffMultiplier: 2,
          jitterFactor: 0.1
        };
        
      default:
        return {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
          jitterFactor: 0.1
        };
    }
  }
}

// Export a default instance for convenience
export const defaultRetryManager = new RetryManager();