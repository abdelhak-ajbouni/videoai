# Convex Validation System

This document describes the comprehensive validation system implemented for the VideoAI Convex backend.

## Overview

The validation system provides:
- **Input validation** - Sanitizing and validating user inputs
- **Business logic validation** - Ensuring business rules are followed
- **Error handling** - Consistent error messages and logging
- **Type safety** - TypeScript interfaces for validation results

## Core Components

### 1. ValidationResult Interface

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}
```

### 2. Input Validation Functions

#### Video Generation Validation

```typescript
validateVideoGeneration(args: VideoGenerationValidation): ValidationResult
```

**Validates:**
- Prompt length (10-1000 characters)
- Model existence and availability
- Quality settings (standard/high/ultra)
- Duration (positive number, max 60 seconds)
- Generation settings (aspect ratio, resolution, etc.)

**Example:**
```typescript
const validation = validateVideoGeneration({
  prompt: "A beautiful sunset",
  model: "pika-labs",
  quality: "high",
  duration: "15",
  generationSettings: {
    aspectRatio: "16:9",
    resolution: "1080p"
  }
});

if (!validation.isValid) {
  throwValidationError(validation.errors, "Video generation failed");
}
```

#### Credit Transaction Validation

```typescript
validateCreditTransaction(args: CreditTransactionValidation): ValidationResult
```

**Validates:**
- Clerk ID format and length
- Amount (positive number, max 1M)
- Operation type (add/subtract)
- Description length (optional)

#### Subscription Validation

```typescript
validateSubscription(args: SubscriptionValidation): ValidationResult
```

**Validates:**
- Clerk ID format
- Plan ID (starter/pro/max)
- Stripe customer ID format (starts with "cus_")
- Stripe subscription ID format (starts with "sub_")

### 3. Business Logic Validation Functions

#### User Credits Validation

```typescript
validateUserCredits(
  userCredits: number,
  requiredCredits: number,
  operation: "check" | "deduct" = "check"
): ValidationResult
```

**Validates:**
- Sufficient credits for operation
- Positive credit amounts
- Low balance warnings

#### Video Status Transition Validation

```typescript
validateVideoStatusTransition(
  currentStatus: string,
  newStatus: string
): ValidationResult
```

**Validates:**
- Valid status transitions
- Prevents invalid state changes

#### Model Capabilities Validation

```typescript
validateModelCapabilities(
  model: Doc<"models">,
  generationParams: any
): ValidationResult
```

**Validates:**
- Supported durations
- Supported aspect ratios
- Supported resolutions
- Camera concepts support
- Loop generation support

### 4. Utility Functions

#### Error Handling

```typescript
throwValidationError(errors: string[], context?: string): never
```

Throws formatted validation errors with context.

#### Warning Logging

```typescript
logValidationWarnings(warnings: string[], context?: string): void
```

Logs validation warnings for monitoring.

#### Input Sanitization

```typescript
sanitizeString(input: string, maxLength: number = 1000): string
```

Sanitizes string inputs by trimming and limiting length.

#### Pagination Validation

```typescript
validatePagination(
  limit?: number,
  offset?: number,
  maxLimit: number = 100
): ValidationResult
```

Validates pagination parameters.

## Usage Patterns

### 1. Function Entry Point Validation

```typescript
export const createVideo = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    // ============================================================================
    // INPUT VALIDATION
    // ============================================================================
    
    const sanitizedArgs = {
      prompt: sanitizeString(args.prompt, 1000),
      model: sanitizeString(args.model, 100),
      // ... other sanitized fields
    };

    const validation = validateVideoGeneration(sanitizedArgs);
    if (!validation.isValid) {
      throwValidationError(validation.errors, "Video generation validation failed");
    }

    logValidationWarnings(validation.warnings || [], "Video generation");

    // ============================================================================
    // BUSINESS LOGIC VALIDATION
    // ============================================================================
    
    // Continue with business logic...
  }
});
```

### 2. Credit Validation Pattern

```typescript
// Validate user has sufficient credits
const creditValidation = validateUserCredits(userProfile.credits, requiredCredits);
if (!creditValidation.isValid) {
  throwValidationError(creditValidation.errors, "Credit validation failed");
}
```

### 3. Model Validation Pattern

```typescript
// Validate model capabilities
const modelValidation = validateModelCapabilities(model, generationParams);
if (!modelValidation.isValid) {
  throwValidationError(modelValidation.errors, "Model capability validation failed");
}
```

## Validation Rules

### Video Generation
- **Prompt**: 10-1000 characters, required
- **Model**: Must exist and be active
- **Quality**: standard/high/ultra only
- **Duration**: 1-60 seconds, positive number
- **Aspect Ratio**: 16:9, 9:16, 1:1, 4:3, 3:4
- **Resolution**: 720p, 1080p, 1440p, 4K

### Credit Transactions
- **Amount**: 1-1,000,000 credits
- **Operation**: add/subtract only
- **Description**: Optional, max 500 characters

### Subscriptions
- **Plan ID**: starter/pro/max only
- **Stripe IDs**: Must start with correct prefixes
- **Period**: Start must be before end

### Pagination
- **Limit**: 1-100 items
- **Offset**: Non-negative number

## Error Messages

All validation errors follow consistent patterns:

- **Input validation**: "Field validation failed: [specific error]"
- **Business logic**: "Business rule violation: [specific error]"
- **Context**: "[Context]: [specific error]"

## Best Practices

1. **Always validate at function entry points**
2. **Sanitize inputs before validation**
3. **Use specific error messages**
4. **Log warnings for monitoring**
5. **Validate business rules separately from input validation**
6. **Use TypeScript interfaces for type safety**

## Monitoring

Validation warnings are logged for monitoring:
- Input sanitization warnings
- Low credit balance warnings
- Invalid format warnings

## Testing

When testing validation:
1. Test valid inputs
2. Test boundary conditions
3. Test invalid inputs
4. Test business rule violations
5. Verify error messages are helpful

## Future Enhancements

Potential improvements:
- Rate limiting validation
- Advanced regex validation
- Custom validation rules per model
- Validation caching for performance
- Real-time validation feedback 