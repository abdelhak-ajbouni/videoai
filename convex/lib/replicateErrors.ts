/**
 * Classification of different types of errors that can occur with Replicate API
 */
export enum ReplicateErrorType {
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  INVALID_INPUT = 'invalid_input',
  MODEL_NOT_FOUND = 'model_not_found',
  INSUFFICIENT_CREDITS = 'insufficient_credits',
  NETWORK_ERROR = 'network_error',
  SERVER_ERROR = 'server_error',
  TIMEOUT = 'timeout',
  WEBHOOK_ERROR = 'webhook_error',
  PREDICTION_ERROR = 'prediction_error',
  UNKNOWN = 'unknown'
}

/**
 * Detailed error information for better handling and reporting
 */
export interface ReplicateErrorInfo {
  type: ReplicateErrorType;
  message: string;
  originalError: Error;
  statusCode?: number;
  retryable: boolean;
  userMessage: string;
  suggestedAction?: string;
}

/**
 * Utility class for classifying and handling Replicate API errors
 */
export class ReplicateErrorHandler {
  /**
   * Classify an error and return detailed information
   */
  static classifyError(error: any): ReplicateErrorInfo {
    const originalError = error instanceof Error ? error : new Error(String(error));
    const statusCode = error.status || error.statusCode;
    const message = error.message || String(error);
    
    // Authentication errors
    if (statusCode === 401 || message.includes('authentication') || message.includes('unauthorized')) {
      return {
        type: ReplicateErrorType.AUTHENTICATION,
        message: 'Authentication failed with Replicate API',
        originalError,
        statusCode,
        retryable: false,
        userMessage: 'There was an authentication issue with the AI service. Please try again later.',
        suggestedAction: 'Check API token configuration'
      };
    }
    
    // Rate limiting errors
    if (statusCode === 429 || message.includes('rate limit') || message.includes('too many requests')) {
      return {
        type: ReplicateErrorType.RATE_LIMIT,
        message: 'Rate limit exceeded',
        originalError,
        statusCode,
        retryable: true,
        userMessage: 'The AI service is currently busy. Your request will be retried automatically.',
        suggestedAction: 'Wait and retry with exponential backoff'
      };
    }
    
    // Invalid input errors
    if (statusCode === 400 || message.includes('invalid input') || message.includes('validation')) {
      return {
        type: ReplicateErrorType.INVALID_INPUT,
        message: 'Invalid input provided to model',
        originalError,
        statusCode,
        retryable: false,
        userMessage: 'There was an issue with your request. Please check your inputs and try again.',
        suggestedAction: 'Validate input parameters against model schema'
      };
    }
    
    // Model not found errors
    if (statusCode === 404 || message.includes('model not found') || message.includes('not found')) {
      return {
        type: ReplicateErrorType.MODEL_NOT_FOUND,
        message: 'Requested model not found',
        originalError,
        statusCode,
        retryable: false,
        userMessage: 'The selected AI model is currently unavailable. Please try a different model.',
        suggestedAction: 'Check model availability and update model configuration'
      };
    }
    
    // Insufficient credits/payment errors
    if (statusCode === 402 || message.includes('insufficient credits') || message.includes('payment')) {
      return {
        type: ReplicateErrorType.INSUFFICIENT_CREDITS,
        message: 'Insufficient credits or payment required',
        originalError,
        statusCode,
        retryable: false,
        userMessage: 'There was a billing issue with the AI service. Please contact support.',
        suggestedAction: 'Check Replicate account billing and credits'
      };
    }
    
    // Server errors (5xx)
    if (statusCode >= 500 && statusCode < 600) {
      return {
        type: ReplicateErrorType.SERVER_ERROR,
        message: `Server error: ${statusCode}`,
        originalError,
        statusCode,
        retryable: true,
        userMessage: 'The AI service is experiencing issues. Your request will be retried automatically.',
        suggestedAction: 'Retry with exponential backoff'
      };
    }
    
    // Network errors
    if (this.isNetworkError(error)) {
      return {
        type: ReplicateErrorType.NETWORK_ERROR,
        message: 'Network connectivity issue',
        originalError,
        retryable: true,
        userMessage: 'There was a connection issue. Your request will be retried automatically.',
        suggestedAction: 'Check network connectivity and retry'
      };
    }
    
    // Timeout errors
    if (message.includes('timeout') || error.code === 'ETIMEDOUT') {
      return {
        type: ReplicateErrorType.TIMEOUT,
        message: 'Request timed out',
        originalError,
        retryable: true,
        userMessage: 'The request took too long to complete. It will be retried automatically.',
        suggestedAction: 'Increase timeout or retry with backoff'
      };
    }
    
    // Webhook-specific errors
    if (message.includes('webhook') || message.includes('callback')) {
      return {
        type: ReplicateErrorType.WEBHOOK_ERROR,
        message: 'Webhook processing error',
        originalError,
        retryable: true,
        userMessage: 'There was an issue processing the response. The system will handle this automatically.',
        suggestedAction: 'Check webhook endpoint and retry processing'
      };
    }
    
    // Prediction-specific errors
    if (message.includes('prediction') || message.includes('generation failed')) {
      return {
        type: ReplicateErrorType.PREDICTION_ERROR,
        message: 'Video generation failed',
        originalError,
        retryable: false,
        userMessage: 'The video generation failed. Your credits have been refunded.',
        suggestedAction: 'Check input parameters and model status'
      };
    }
    
    // Unknown errors
    return {
      type: ReplicateErrorType.UNKNOWN,
      message: `Unknown error: ${message}`,
      originalError,
      statusCode,
      retryable: false,
      userMessage: 'An unexpected error occurred. Please try again or contact support if the issue persists.',
      suggestedAction: 'Log error details and investigate'
    };
  }
  
  /**
   * Check if error should trigger a retry
   */
  static shouldRetry(errorInfo: ReplicateErrorInfo): boolean {
    return errorInfo.retryable;
  }
  
  /**
   * Get recommended retry delay for error type
   */
  static getRetryDelay(errorType: ReplicateErrorType, attempt: number): number {
    const baseDelays = {
      [ReplicateErrorType.RATE_LIMIT]: 5000, // 5 seconds
      [ReplicateErrorType.SERVER_ERROR]: 2000, // 2 seconds
      [ReplicateErrorType.NETWORK_ERROR]: 1000, // 1 second
      [ReplicateErrorType.TIMEOUT]: 3000, // 3 seconds
      [ReplicateErrorType.WEBHOOK_ERROR]: 2000, // 2 seconds
    };
    
    const baseDelay = baseDelays[errorType] || 1000;
    const maxDelay = errorType === ReplicateErrorType.RATE_LIMIT ? 60000 : 30000;
    
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    
    return Math.min(maxDelay, exponentialDelay + jitter);
  }
  
  /**
   * Check if an error is a network-related error
   */
  private static isNetworkError(error: any): boolean {
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
      error.message?.includes(code) || error.code === code
    );
  }
  
  /**
   * Create a user-friendly error message
   */
  static getUserMessage(error: any): string {
    const errorInfo = this.classifyError(error);
    return errorInfo.userMessage;
  }
  
  /**
   * Log error with appropriate level and context
   */
  static logError(error: any, context?: Record<string, any>): void {
    const errorInfo = this.classifyError(error);
    
    const logData = {
      type: errorInfo.type,
      message: errorInfo.message,
      statusCode: errorInfo.statusCode,
      retryable: errorInfo.retryable,
      context,
      stack: errorInfo.originalError.stack
    };
    
    // Use appropriate log level based on error type
    if (errorInfo.retryable) {
      console.warn('Retryable Replicate error:', logData);
    } else if (errorInfo.type === ReplicateErrorType.AUTHENTICATION || 
               errorInfo.type === ReplicateErrorType.INSUFFICIENT_CREDITS) {
      console.error('Critical Replicate error:', logData);
    } else {
      console.error('Replicate error:', logData);
    }
  }
}

/**
 * Custom error class for Replicate-specific errors
 */
export class ReplicateError extends Error {
  public readonly type: ReplicateErrorType;
  public readonly statusCode?: number;
  public readonly retryable: boolean;
  public readonly userMessage: string;
  public readonly suggestedAction?: string;
  public readonly originalError: Error;
  
  constructor(errorInfo: ReplicateErrorInfo) {
    super(errorInfo.message);
    this.name = 'ReplicateError';
    this.type = errorInfo.type;
    this.statusCode = errorInfo.statusCode;
    this.retryable = errorInfo.retryable;
    this.userMessage = errorInfo.userMessage;
    this.suggestedAction = errorInfo.suggestedAction;
    this.originalError = errorInfo.originalError;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ReplicateError);
    }
  }
  
  /**
   * Create a ReplicateError from any error
   */
  static from(error: any): ReplicateError {
    const errorInfo = ReplicateErrorHandler.classifyError(error);
    return new ReplicateError(errorInfo);
  }
}