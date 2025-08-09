import { z } from "zod";

// Common validation patterns
const MAX_PROMPT_LENGTH = 500;
const MIN_PROMPT_LENGTH = 3; // Reduced from 10 to allow shorter test prompts
const MAX_DESCRIPTION_LENGTH = 1000;

// Content filtering patterns for prompts (basic safety)
const UNSAFE_PATTERNS = [
  // Violence/harm
  /\b(kill|murder|violence|blood|gore|death|torture|harm)\b/i,
  // Adult content
  /\b(porn|sex|nude|naked|explicit|adult)\b/i,
  // Hate speech indicators
  /\b(hate|racist|nazi|terrorism|terrorist)\b/i,
  // Personal information patterns
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email pattern
];

/**
 * Validates and sanitizes prompt content
 */
function validatePromptContent(prompt: string): { isValid: boolean; reason?: string } {
  // Check for unsafe content
  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        isValid: false,
        reason: "Prompt contains inappropriate or unsafe content"
      };
    }
  }

  // Check for repetitive characters (possible spam/test)
  const repeatedChars = /(.)\1{10,}/;
  if (repeatedChars.test(prompt)) {
    return {
      isValid: false,
      reason: "Prompt contains excessive repeated characters"
    };
  }

  // Check for common spam patterns
  const spamPatterns = [
    /test{3,}/i,
    /a{10,}/i,
    /1{10,}/i,
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(prompt)) {
      return {
        isValid: false,
        reason: "Prompt appears to be test content or spam"
      };
    }
  }

  return { isValid: true };
}

/**
 * Sanitizes user input by removing potentially dangerous characters
 */
function sanitizeInput(input: string): string {
  return input
    .trim()
    // Remove null bytes and other control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove potentially dangerous HTML-like patterns
    .replace(/<[^>]*>/g, '');
}

// Zod schema for video prompt validation
export const videoPromptSchema = z
  .string()
  .min(MIN_PROMPT_LENGTH, `Prompt must be at least ${MIN_PROMPT_LENGTH} characters`)
  .max(MAX_PROMPT_LENGTH, `Prompt must be no more than ${MAX_PROMPT_LENGTH} characters`)
  .transform((prompt) => sanitizeInput(prompt))
  .refine(
    (prompt) => validatePromptContent(prompt).isValid,
    (prompt) => ({
      message: validatePromptContent(prompt).reason || "Invalid prompt content"
    })
  );

// Schema for video description
export const videoDescriptionSchema = z
  .string()
  .max(MAX_DESCRIPTION_LENGTH, `Description must be no more than ${MAX_DESCRIPTION_LENGTH} characters`)
  .transform((desc) => sanitizeInput(desc))
  .optional();

// Schema for model ID validation
export const modelIdSchema = z
  .string()
  .min(1, "Model ID is required")
  .max(100, "Model ID too long")
  .regex(/^[a-zA-Z0-9\/_-]+$/, "Invalid model ID format");


// Schema for duration validation
export const durationSchema = z
  .string()
  .regex(/^\d+s?$/, "Duration must be a number followed by optional 's' (e.g., '5s' or '10')")
  .transform((dur) => dur.endsWith('s') ? dur : `${dur}s`);

// Schema for resolution validation - handles both resolution (720p) and aspect ratio (16:9) formats
export const resolutionSchema = z
  .string()
  .refine((val) => {
    // Allow traditional resolution format (720p, 1080p)
    const resolutionPattern = /^\d+p$/;
    // Allow aspect ratio format (16:9, 4:3, 9:16)
    const aspectRatioPattern = /^\d+:\d+$/;
    return resolutionPattern.test(val) || aspectRatioPattern.test(val);
  }, "Resolution must be in format like '720p', '1080p' or aspect ratio like '16:9', '9:16'")
  .optional();

// Schema for aspect ratio validation
export const aspectRatioSchema = z
  .string()
  .regex(/^\d+:\d+$/, "Aspect ratio must be in format like '16:9', '4:3'")
  .optional();

// Schema for camera position (model-specific parameter)
export const cameraPositionSchema = z
  .string()
  .max(50, "Camera position description too long")
  .transform((pos) => sanitizeInput(pos))
  .optional();

// Schema for generic generation settings - flexible to allow model-specific parameters
export const generationSettingsSchema = z
  .object({
    resolution: resolutionSchema,
    aspectRatio: aspectRatioSchema,
    loop: z.boolean().optional(),
    cameraPosition: cameraPositionSchema,
  })
  .passthrough() // Allow additional properties without validation
  .optional();

// Main schema for video creation
export const createVideoSchema = z.object({
  prompt: videoPromptSchema,
  model: modelIdSchema,
  duration: durationSchema,
  generationSettings: generationSettingsSchema,
  isPublic: z.boolean().optional().default(false)
});

// Schema for credit amounts (prevent negative or excessive amounts)
export const creditAmountSchema = z
  .number()
  .min(0.01, "Credit amount must be positive")
  .max(100000, "Credit amount too large")
  .finite("Credit amount must be a finite number");

// Schema for Clerk ID validation
export const clerkIdSchema = z
  .string()
  .min(1, "User ID is required")
  .max(100, "User ID too long")
  .regex(/^user_[a-zA-Z0-9]+$/, "Invalid user ID format");

// Schema for video ID validation (Convex ID format)
export const videoIdSchema = z
  .string()
  .min(1, "Video ID is required")
  .regex(/^[a-zA-Z0-9]+$/, "Invalid video ID format");

// Schema for webhook validation
export const replicateWebhookSchema = z.object({
  id: z.string().min(1, "Job ID is required"),
  status: z.enum(["starting", "processing", "succeeded", "failed", "canceled"]),
  output: z.union([z.string(), z.array(z.string())]).optional(),
  error: z.string().optional()
});

// Schema for Stripe webhook validation
export const stripeWebhookSchema = z.object({
  id: z.string(),
  object: z.literal("event"),
  type: z.string(),
  data: z.object({
    object: z.any() // Stripe object structure varies by event type
  })
});

// Export validation functions for direct use
export function validateVideoPrompt(prompt: string) {
  return videoPromptSchema.safeParse(prompt);
}

export function validateCreditAmount(amount: number) {
  return creditAmountSchema.safeParse(amount);
}

export function validateClerkId(clerkId: string) {
  return clerkIdSchema.safeParse(clerkId);
}

// Custom error class for validation errors
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string = "VALIDATION_ERROR"
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// Helper function to format Zod errors
export function formatValidationError(error: z.ZodError): ValidationError {
  const firstIssue = error.issues[0];
  const field = firstIssue.path.join('.');
  const message = firstIssue.message;
  
  return new ValidationError(message, field);
}