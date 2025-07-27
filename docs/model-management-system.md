# Model Management System

## Overview

The Model Management System provides a comprehensive database-driven approach to managing AI models in VideoAI. It replaces hardcoded model configurations with a flexible, admin-controlled system that supports dynamic model addition, configuration updates, and usage tracking.

## Architecture

### Database Schema

The system uses a dedicated `models` table with the following structure:

```typescript
models: defineTable({
  // Model identification
  modelId: v.string(), // Unique model identifier
  name: v.string(), // Human-readable name
  description: v.string(), // Model description
  version: v.optional(v.string()), // Model version

  // Model capabilities
  costPerSecond: v.number(), // Cost in USD per second
  supportedDurations: v.array(v.number()), // Supported durations
  supportedQualities: v.array(v.string()), // Supported quality tiers
  maxDuration: v.optional(v.number()), // Maximum duration
  fixedDuration: v.optional(v.number()), // Fixed duration models

  // Model characteristics
  isPremium: v.boolean(), // Premium model flag
  isActive: v.boolean(), // Active status
  isDefault: v.boolean(), // Default model flag
  isDeprecated: v.boolean(), // Deprecated flag

  // Metadata
  provider: v.string(), // Model provider
  category: v.optional(v.string()), // Model category
  tags: v.optional(v.array(v.string())), // Model tags

  // Technical details
  replicateModelId: v.string(), // Replicate model ID
  modelParameters: v.optional(v.any()), // Model parameters
  requirements: v.optional(v.any()), // System requirements

  // Usage statistics
  totalGenerations: v.optional(v.number()),
  averageGenerationTime: v.optional(v.number()),
  successRate: v.optional(v.number()),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  deprecatedAt: v.optional(v.number()),
})
```

### Key Features

1. **Dynamic Model Management**: Add, update, and remove models without code changes
2. **Model Validation**: Automatic validation of model capabilities and constraints
3. **Usage Tracking**: Monitor model performance and usage statistics
4. **Version Control**: Track model versions and deprecation
5. **Category Organization**: Organize models by provider, category, and tags
6. **Default Model Management**: Automatic handling of default model selection

## API Reference

### Queries

#### `getActiveModels`
Returns all active models.

```typescript
const models = await ctx.db
  .query("models")
  .withIndex("by_active", (q) => q.eq("isActive", true))
  .collect();
```

#### `getModelById`
Get a specific model by ID.

```typescript
const model = await ctx.db
  .query("models")
  .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
  .first();
```

#### `getDefaultModel`
Get the current default model.

```typescript
const defaultModel = await ctx.db
  .query("models")
  .withIndex("by_default", (q) => q.eq("isDefault", true))
  .first();
```

#### `getPremiumModels`
Get all premium models.

```typescript
const premiumModels = await ctx.db
  .query("models")
  .withIndex("by_active_and_premium", (q) => 
    q.eq("isActive", true).eq("isPremium", true)
  )
  .collect();
```

#### `getModelsByProvider`
Get models by provider.

```typescript
const googleModels = await ctx.db
  .query("models")
  .withIndex("by_provider", (q) => q.eq("provider", "Google"))
  .collect();
```

#### `getModelStats`
Get usage statistics for all models.

```typescript
const stats = await ctx.db
  .query("models")
  .withIndex("by_active", (q) => q.eq("isActive", true))
  .collect();
```

#### `validateModelCapabilities`
Validate if a model supports specific duration and quality.

```typescript
const validation = await ctx.db
  .query("models")
  .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
  .first();

if (!validation || !validation.isActive) {
  return { valid: false, reason: "Model not found or inactive" };
}

// Check capabilities...
```

### Mutations

#### `createModel`
Create a new model.

```typescript
const modelId = await ctx.db.insert("models", {
  modelId: "new-model-id",
  name: "New Model",
  description: "Description",
  costPerSecond: 0.25,
  supportedDurations: [5, 9],
  supportedQualities: ["standard", "high"],
  isPremium: false,
  isActive: true,
  isDefault: false,
  isDeprecated: false,
  provider: "Provider Name",
  replicateModelId: "provider/new-model",
  // ... other fields
});
```

#### `updateModel`
Update an existing model.

```typescript
await ctx.db.patch(model._id, {
  costPerSecond: 0.30,
  isActive: false,
  updatedAt: Date.now(),
});
```

#### `deleteModel`
Soft delete a model (sets inactive and deprecated).

```typescript
await ctx.db.patch(model._id, {
  isActive: false,
  isDeprecated: true,
  deprecatedAt: Date.now(),
  updatedAt: Date.now(),
});
```

#### `updateModelStats`
Update model usage statistics.

```typescript
const newTotal = currentTotal + 1;
const newAvgTime = (currentAvgTime * currentTotal + generationTime) / newTotal;
const newSuccessRate = (newSuccesses / newTotal) * 100;

await ctx.db.patch(model._id, {
  totalGenerations: newTotal,
  averageGenerationTime: newAvgTime,
  successRate: newSuccessRate,
  updatedAt: Date.now(),
});
```

## Default Models

The system comes with three default models:

### 1. Google Veo-3 (Premium)
- **Model ID**: `google/veo-3`
- **Cost**: $0.75/second
- **Duration**: Fixed 8 seconds
- **Qualities**: Standard, High, Ultra
- **Category**: Premium
- **Description**: High-quality video generation with exceptional visual fidelity

### 2. Luma Ray-2-720p (Budget)
- **Model ID**: `luma/ray-2-720p`
- **Cost**: $0.18/second
- **Durations**: 5s, 9s
- **Qualities**: Standard, High, Ultra
- **Category**: Budget
- **Description**: Fast, cost-effective video generation for content creators

### 3. Luma Ray Flash 2-540p (Default)
- **Model ID**: `luma/ray-flash-2-540p`
- **Cost**: $0.12/second
- **Durations**: 5s, 9s
- **Qualities**: Standard, High, Ultra
- **Category**: Budget
- **Description**: Ultra-fast, ultra-cheap video generation for rapid prototyping

## Integration with Pricing System

The Model Management System integrates seamlessly with the pricing system:

1. **Dynamic Cost Calculation**: Pricing uses model cost per second from the database
2. **Capability Validation**: Ensures users can only select valid model/duration/quality combinations
3. **Real-time Updates**: Cost changes take effect immediately without deployments

### Pricing Integration Example

```typescript
// Calculate credit cost using model from database
const creditsCost = await calculateCreditCost(
  ctx,
  modelId, // From models table
  quality,
  duration
);
```

## Admin Interface

### Model Manager Component

The `ModelManager` component provides a comprehensive admin interface:

- **Model Overview**: View all models with statistics
- **Category Filtering**: Filter by Premium, Budget, Experimental
- **Inline Editing**: Edit model properties directly
- **Model Creation**: Add new models with validation
- **Usage Statistics**: Monitor performance metrics
- **Soft Deletion**: Deactivate models without data loss

### Access Control

- **Route**: `/admin/models`
- **Authentication**: Required
- **Authorization**: Admin users only (configurable)

## Usage Examples

### Frontend Integration

```typescript
// Get available models for video generation
const activeModels = useQuery(api.models.getActiveModels);
const defaultModel = useQuery(api.models.getDefaultModel);

// Get model pricing
const creditCost = useQuery(api.pricing.getCreditCost, {
  modelId: selectedModel,
  quality: "high",
  duration: 9
});

// Validate model capabilities
const validation = useQuery(api.models.validateModelCapabilities, {
  modelId: selectedModel,
  duration: 9,
  quality: "ultra"
});
```

### Backend Integration

```typescript
// Create video with model validation
const model = await ctx.db
  .query("models")
  .withIndex("by_model_id", (q) => q.eq("modelId", args.model))
  .first();

if (!model || !model.isActive) {
  throw new Error("Selected model is not available");
}

// Validate capabilities
const durationNum = parseInt(args.duration);
if (!model.supportedDurations.includes(durationNum)) {
  throw new Error(`Duration ${durationNum}s not supported`);
}

// Calculate cost
const creditsCost = await calculateCreditCost(ctx, args.model, args.quality, durationNum);
```

## Migration from Hardcoded Models

### Before (Hardcoded)
```typescript
const modelPricing = {
  "google/veo-3": { costPerSecond: 0.75 },
  "luma/ray-2-720p": { costPerSecond: 0.18 },
  "luma/ray-flash-2-540p": { costPerSecond: 0.12 },
};
```

### After (Database-driven)
```typescript
const model = await ctx.db
  .query("models")
  .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
  .first();

const cost = model.costPerSecond * duration;
```

## Benefits

1. **Zero Downtime Updates**: Modify model configurations without deployments
2. **Dynamic Model Addition**: Add new models through admin interface
3. **Performance Monitoring**: Track model usage and success rates
4. **Flexible Pricing**: Update costs in real-time
5. **Version Management**: Handle model updates and deprecation
6. **Category Organization**: Organize models by use case and provider
7. **Validation**: Automatic capability validation
8. **Statistics**: Comprehensive usage analytics

## Future Enhancements

1. **Model Performance Analytics**: Advanced performance metrics
2. **A/B Testing**: Compare model performance
3. **Automatic Model Selection**: AI-powered model recommendation
4. **Model Marketplace**: Third-party model integration
5. **Cost Optimization**: Automatic cost analysis and recommendations
6. **Quality Prediction**: Predict video quality based on model selection
7. **Batch Processing**: Support for multiple model processing
8. **Model Chaining**: Sequential model processing workflows

## Security Considerations

1. **Access Control**: Admin-only model management
2. **Input Validation**: Validate all model parameters
3. **Rate Limiting**: Prevent abuse of model creation/updates
4. **Audit Logging**: Track all model changes
5. **Data Validation**: Ensure model data integrity

## Troubleshooting

### Common Issues

1. **Model Not Found**: Ensure model is active and exists in database
2. **Invalid Duration**: Check model's supported durations
3. **Invalid Quality**: Verify model supports requested quality tier
4. **Cost Calculation Errors**: Validate model cost per second is set
5. **Default Model Issues**: Ensure exactly one model is marked as default

### Debugging

```typescript
// Check model status
const model = await ctx.db
  .query("models")
  .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
  .first();

console.log("Model:", {
  exists: !!model,
  active: model?.isActive,
  supportedDurations: model?.supportedDurations,
  supportedQualities: model?.supportedQualities,
  costPerSecond: model?.costPerSecond
});
```

## Conclusion

The Model Management System provides a robust, scalable foundation for managing AI models in VideoAI. It eliminates hardcoded configurations, enables dynamic model management, and provides comprehensive monitoring and validation capabilities. 