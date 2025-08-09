/**
 * Standardized error handling system for Convex functions
 * Provides consistent error classification and user-safe error messages
 */

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  
  // User Input Errors
  INVALID_INPUT = "INVALID_INPUT",
  VALIDATION_FAILED = "VALIDATION_FAILED",
  
  // Resource Errors
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  RESOURCE_EXHAUSTED = "RESOURCE_EXHAUSTED",
  
  // Business Logic Errors
  INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS",
  SUBSCRIPTION_REQUIRED = "SUBSCRIPTION_REQUIRED",
  FEATURE_UNAVAILABLE = "FEATURE_UNAVAILABLE",
  
  // External Service Errors
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  
  // System Errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
}

export enum ErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM", 
  HIGH = "HIGH",
  CRITICAL = "CRITICAL"
}

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public userMessage?: string,
    public severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
  }

  /**
   * Get user-safe error message
   */
  getUserMessage(): string {
    return this.userMessage || this.getDefaultUserMessage();
  }

  /**
   * Get default user message for error code
   */
  private getDefaultUserMessage(): string {
    switch (this.code) {
      case ErrorCode.UNAUTHORIZED:
        return "Authentication required. Please sign in.";
      case ErrorCode.FORBIDDEN:
        return "You don't have permission to perform this action.";
      case ErrorCode.INVALID_INPUT:
        return "Invalid input provided. Please check your data.";
      case ErrorCode.VALIDATION_FAILED:
        return "Data validation failed. Please verify your input.";
      case ErrorCode.NOT_FOUND:
        return "The requested resource was not found.";
      case ErrorCode.ALREADY_EXISTS:
        return "This resource already exists.";
      case ErrorCode.INSUFFICIENT_CREDITS:
        return "Insufficient credits. Please purchase more credits or upgrade your plan.";
      case ErrorCode.SUBSCRIPTION_REQUIRED:
        return "This feature requires a subscription. Please upgrade your plan.";
      case ErrorCode.FEATURE_UNAVAILABLE:
        return "This feature is currently unavailable.";
      case ErrorCode.EXTERNAL_SERVICE_ERROR:
        return "External service temporarily unavailable. Please try again later.";
      case ErrorCode.PAYMENT_FAILED:
        return "Payment processing failed. Please check your payment method.";
      case ErrorCode.RESOURCE_EXHAUSTED:
        return "Service temporarily overloaded. Please try again later.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }

  /**
   * Check if error should be logged
   */
  shouldLog(): boolean {
    return this.severity === ErrorSeverity.HIGH || this.severity === ErrorSeverity.CRITICAL;
  }

  /**
   * Convert to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.getUserMessage(),
      severity: this.severity,
      metadata: this.metadata,
      stack: this.stack
    };
  }
}

/**
 * Specific error types for common scenarios
 */
export class AuthenticationError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(ErrorCode.UNAUTHORIZED, message, userMessage, ErrorSeverity.LOW);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, userMessage?: string) {
    super(
      ErrorCode.VALIDATION_FAILED, 
      message, 
      userMessage || message, // Use the validation message as user message
      ErrorSeverity.LOW,
      { field }
    );
  }
}

export class InsufficientCreditsError extends AppError {
  constructor(required: number, available: number, userMessage?: string) {
    super(
      ErrorCode.INSUFFICIENT_CREDITS,
      `Insufficient credits: need ${required}, have ${available}`,
      userMessage,
      ErrorSeverity.MEDIUM,
      { required, available }
    );
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string, userMessage?: string) {
    super(
      ErrorCode.NOT_FOUND,
      `${resource} not found${id ? ` (ID: ${id})` : ''}`,
      userMessage,
      ErrorSeverity.LOW,
      { resource, id }
    );
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error, userMessage?: string) {
    super(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `${service} service error: ${originalError?.message || 'Unknown error'}`,
      userMessage,
      ErrorSeverity.HIGH,
      { service, originalError: originalError?.message }
    );
  }
}

/**
 * Error handler for Convex functions
 */
export function handleError(error: unknown, context?: Record<string, any>): never {
  if (error instanceof AppError) {
    // Log high severity errors
    if (error.shouldLog()) {
      console.error(`[${error.severity}] ${error.code}:`, {
        message: error.message,
        metadata: error.metadata,
        context,
        stack: error.stack
      });
    }
    
    // Throw with user-safe message
    throw new Error(error.getUserMessage());
  }

  // Handle unknown errors
  const appError = new AppError(
    ErrorCode.INTERNAL_ERROR,
    error instanceof Error ? error.message : 'Unknown error',
    undefined,
    ErrorSeverity.HIGH,
    { originalError: error, context }
  );

  console.error(`[${appError.severity}] ${appError.code}:`, appError.toJSON());
  throw new Error(appError.getUserMessage());
}

/**
 * Wrap async function with standardized error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleError(error, { function: fn.name, args });
    }
  };
}

/**
 * Create error for missing authentication
 */
export function createAuthError(context?: string): AuthenticationError {
  return new AuthenticationError(
    `Authentication required${context ? ` for ${context}` : ''}`,
    "Please sign in to access this feature."
  );
}

/**
 * Create error for insufficient permissions
 */
export function createForbiddenError(action: string, requirement?: string): AppError {
  return new AppError(
    ErrorCode.FORBIDDEN,
    `Forbidden: cannot ${action}${requirement ? ` (requires ${requirement})` : ''}`,
    `You don't have permission to ${action}.${requirement ? ` This requires ${requirement}.` : ''}`,
    ErrorSeverity.LOW
  );
}

/**
 * Create error for resource not found
 */
export function createNotFoundError(resource: string, id?: string): NotFoundError {
  return new NotFoundError(resource, id);
}

/**
 * Create error for invalid input
 */
export function createValidationError(message: string, field?: string): ValidationError {
  return new ValidationError(message, field);
}

/**
 * Create error for insufficient credits
 */
export function createInsufficientCreditsError(required: number, available: number): InsufficientCreditsError {
  return new InsufficientCreditsError(required, available);
}

/**
 * Utility to safely extract error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.getUserMessage();
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

/**
 * Log security events (authentication failures, permission denials, etc.)
 */
export function logSecurityEvent(
  event: string,
  severity: ErrorSeverity,
  details: Record<string, any>
): void {
  console.warn(`[SECURITY-${severity}] ${event}:`, {
    timestamp: new Date().toISOString(),
    ...details
  });
}