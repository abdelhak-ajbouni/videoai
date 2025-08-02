import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";

// ============================================================================
// VALIDATION TYPES AND INTERFACES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface VideoGenerationValidation {
  prompt: string;
  model: string;
  quality: "standard" | "high" | "ultra";
  duration: string;
  generationSettings?: any;
}

export interface CreditTransactionValidation {
  clerkId: string;
  amount: number;
  operation: "add" | "subtract";
  description?: string;
}

export interface SubscriptionValidation {
  clerkId: string;
  planId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}

// ============================================================================
// INPUT VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates video generation parameters
 */
export function validateVideoGeneration(
  args: VideoGenerationValidation
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Prompt validation
  if (!args.prompt || args.prompt.trim().length === 0) {
    errors.push("Prompt is required");
  } else if (args.prompt.length < 10) {
    errors.push("Prompt must be at least 10 characters long");
  } else if (args.prompt.length > 1000) {
    errors.push("Prompt must be less than 1000 characters");
  }

  // Model validation
  if (!args.model || args.model.trim().length === 0) {
    errors.push("Model is required");
  }

  // Quality validation
  if (!["standard", "high", "ultra"].includes(args.quality)) {
    errors.push("Quality must be one of: standard, high, ultra");
  }

  // Duration validation
  if (!args.duration || args.duration.trim().length === 0) {
    errors.push("Duration is required");
  } else {
    const durationNum = parseFloat(args.duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      errors.push("Duration must be a positive number");
    } else if (durationNum > 60) {
      errors.push("Duration cannot exceed 60 seconds");
    }
  }

  // Generation settings validation
  if (args.generationSettings) {
    if (typeof args.generationSettings !== "object") {
      errors.push("Generation settings must be an object");
    } else {
      // Validate specific settings if present
      const settings = args.generationSettings as any;

      if (
        settings.aspectRatio &&
        !["16:9", "9:16", "1:1", "4:3", "3:4"].includes(settings.aspectRatio)
      ) {
        errors.push(
          "Invalid aspect ratio. Must be one of: 16:9, 9:16, 1:1, 4:3, 3:4"
        );
      }

      if (
        settings.resolution &&
        !["720p", "1080p", "1440p", "4K"].includes(settings.resolution)
      ) {
        errors.push(
          "Invalid resolution. Must be one of: 720p, 1080p, 1440p, 4K"
        );
      }

      if (
        settings.cameraConcept &&
        typeof settings.cameraConcept !== "string"
      ) {
        errors.push("Camera concept must be a string");
      }

      if (settings.loop !== undefined && typeof settings.loop !== "boolean") {
        errors.push("Loop setting must be a boolean");
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates credit transaction parameters
 */
export function validateCreditTransaction(
  args: CreditTransactionValidation
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Clerk ID validation
  if (!args.clerkId || args.clerkId.trim().length === 0) {
    errors.push("Clerk ID is required");
  }

  // Amount validation
  if (typeof args.amount !== "number" || isNaN(args.amount)) {
    errors.push("Amount must be a valid number");
  } else if (args.amount <= 0) {
    errors.push("Amount must be greater than 0");
  } else if (args.amount > 1000000) {
    errors.push("Amount cannot exceed 1,000,000");
  }

  // Operation validation
  if (!["add", "subtract"].includes(args.operation)) {
    errors.push("Operation must be either 'add' or 'subtract'");
  }

  // Description validation
  if (args.description && args.description.length > 500) {
    warnings.push("Description is very long and may be truncated");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates subscription parameters
 */
export function validateSubscription(
  args: SubscriptionValidation
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Clerk ID validation
  if (!args.clerkId || args.clerkId.trim().length === 0) {
    errors.push("Clerk ID is required");
  }

  // Plan ID validation
  if (!args.planId || args.planId.trim().length === 0) {
    errors.push("Plan ID is required");
  } else if (!["starter", "pro", "max"].includes(args.planId)) {
    errors.push("Invalid plan ID. Must be one of: starter, pro, max");
  }

  // Stripe customer ID validation
  if (!args.stripeCustomerId || args.stripeCustomerId.trim().length === 0) {
    errors.push("Stripe customer ID is required");
  } else if (!args.stripeCustomerId.startsWith("cus_")) {
    warnings.push("Stripe customer ID format appears invalid");
  }

  // Stripe subscription ID validation
  if (
    !args.stripeSubscriptionId ||
    args.stripeSubscriptionId.trim().length === 0
  ) {
    errors.push("Stripe subscription ID is required");
  } else if (!args.stripeSubscriptionId.startsWith("sub_")) {
    warnings.push("Stripe subscription ID format appears invalid");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// BUSINESS LOGIC VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates user has sufficient credits for video generation
 */
export function validateUserCredits(
  userCredits: number,
  requiredCredits: number,
  operation: "check" | "deduct" = "check"
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (userCredits < requiredCredits) {
    errors.push(
      `Insufficient credits. Required: ${requiredCredits}, Available: ${userCredits}`
    );
  } else if (userCredits < requiredCredits * 2) {
    warnings.push("Low credit balance. Consider purchasing more credits.");
  }

  if (requiredCredits <= 0) {
    errors.push("Required credits must be greater than 0");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates video status transitions
 */
export function validateVideoStatusTransition(
  currentStatus: string,
  newStatus: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const validTransitions: Record<string, string[]> = {
    pending: ["processing", "failed", "canceled"],
    processing: ["completed", "failed", "canceled"],
    completed: [], // No further transitions allowed
    failed: ["pending"], // Allow retry
    canceled: [], // No further transitions allowed
  };

  const allowedTransitions = validTransitions[currentStatus] || [];

  if (!allowedTransitions.includes(newStatus)) {
    errors.push(
      `Invalid status transition from '${currentStatus}' to '${newStatus}'`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates model capabilities against generation parameters
 * Now works with the new modelParameters table structure
 */
export function validateModelCapabilities(
  model: Doc<"models">,
  modelParams: any, // Model parameters from modelParameters table
  generationParams: any
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // If no model parameters available, skip validation (but warn)
  if (!modelParams) {
    warnings.push(
      "Model parameters not found - skipping capability validation"
    );
    return {
      isValid: true,
      errors,
      warnings,
    };
  }

  // Check if model supports the requested duration
  if (generationParams.duration) {
    const durationNum = parseFloat(generationParams.duration);

    // Handle fixed duration models
    if (model.fixedDuration) {
      if (durationNum !== model.fixedDuration) {
        errors.push(
          `Model only supports ${model.fixedDuration}s duration (requested: ${durationNum}s)`
        );
      }
    } else if (
      modelParams.supportedDurations &&
      modelParams.supportedDurations.length > 0
    ) {
      // Handle models with variable durations
      if (!modelParams.supportedDurations.includes(durationNum)) {
        errors.push(
          `Model does not support duration ${durationNum}s. Supported: ${modelParams.supportedDurations.join(", ")}`
        );
      }
    }
  }

  // Check if model supports the requested aspect ratio
  if (generationParams.aspectRatio && modelParams.supportedAspectRatios) {
    if (
      !modelParams.supportedAspectRatios.includes(generationParams.aspectRatio)
    ) {
      errors.push(
        `Model does not support aspect ratio ${generationParams.aspectRatio}. Supported: ${modelParams.supportedAspectRatios.join(", ")}`
      );
    }
  }

  // Check if model supports the requested resolution
  if (generationParams.resolution && modelParams.supportedResolutions) {
    if (
      !modelParams.supportedResolutions.includes(generationParams.resolution)
    ) {
      errors.push(
        `Model does not support resolution ${generationParams.resolution}. Supported: ${modelParams.supportedResolutions.join(", ")}`
      );
    }
  }

  // Check if model supports camera concepts
  if (generationParams.cameraConcept && modelParams.supportedCameraConcepts) {
    if (
      !modelParams.supportedCameraConcepts.includes(
        generationParams.cameraConcept
      )
    ) {
      errors.push(
        `Model does not support camera concept ${generationParams.cameraConcept}. Supported: ${modelParams.supportedCameraConcepts.join(", ")}`
      );
    }
  }

  // Check if model supports loop
  if (generationParams.loop && !modelParams.supportsLoop) {
    errors.push("Model does not support loop generation");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Throws a formatted validation error
 */
export function throwValidationError(
  errors: string[],
  context?: string
): never {
  const prefix = context ? `${context}: ` : "";
  throw new Error(`${prefix}${errors.join("; ")}`);
}

/**
 * Logs validation warnings
 */
export function logValidationWarnings(
  warnings: string[],
  context?: string
): void {
  if (warnings.length > 0) {
    const prefix = context ? `${context}: ` : "";
    console.warn(`${prefix}${warnings.join("; ")}`);
  }
}

/**
 * Sanitizes string input
 */
export function sanitizeString(
  input: string,
  maxLength: number = 1000
): string {
  return input.trim().slice(0, maxLength);
}

/**
 * Validates and sanitizes email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || email.trim().length === 0) {
    errors.push("Email is required");
  } else if (!emailRegex.test(email)) {
    errors.push("Invalid email format");
  } else if (email.length > 254) {
    errors.push("Email is too long");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates pagination parameters
 */
export function validatePagination(
  limit?: number,
  offset?: number,
  maxLimit: number = 100
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (limit !== undefined) {
    if (typeof limit !== "number" || isNaN(limit)) {
      errors.push("Limit must be a valid number");
    } else if (limit <= 0) {
      errors.push("Limit must be greater than 0");
    } else if (limit > maxLimit) {
      errors.push(`Limit cannot exceed ${maxLimit}`);
    }
  }

  if (offset !== undefined) {
    if (typeof offset !== "number" || isNaN(offset)) {
      errors.push("Offset must be a valid number");
    } else if (offset < 0) {
      errors.push("Offset cannot be negative");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
