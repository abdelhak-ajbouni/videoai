import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all active models
export const getActiveModels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("models")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("asc")
      .collect();
  },
});

// Get model by ID
export const getModelById = query({
  args: { modelId: v.string() },
  handler: async (ctx, { modelId }) => {
    return await ctx.db
      .query("models")
      .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
      .first();
  },
});

// Get default model
export const getDefaultModel = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("models")
      .withIndex("by_default", (q) => q.eq("isDefault", true))
      .first();
  },
});

// Get premium models
export const getPremiumModels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("models")
      .withIndex("by_active_and_premium", (q) =>
        q.eq("isActive", true).eq("isPremium", true)
      )
      .collect();
  },
});

// Get models by provider
export const getModelsByProvider = query({
  args: { provider: v.string() },
  handler: async (ctx, { provider }) => {
    return await ctx.db
      .query("models")
      .withIndex("by_provider", (q) => q.eq("provider", provider))
      .collect();
  },
});

// Get models by category
export const getModelsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    return await ctx.db
      .query("models")
      .withIndex("by_category", (q) => q.eq("category", category))
      .collect();
  },
});

// Create a new model
export const createModel = mutation({
  args: {
    modelId: v.string(),
    name: v.string(),
    description: v.string(),
    version: v.optional(v.string()),
    costPerSecond: v.number(),
    supportedDurations: v.array(v.number()),
    supportedQualities: v.array(v.string()),
    maxDuration: v.optional(v.number()),
    fixedDuration: v.optional(v.number()),
    isPremium: v.boolean(),
    isFast: v.boolean(),
    isActive: v.boolean(),
    isDefault: v.boolean(),
    isDeprecated: v.boolean(),
    provider: v.string(),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    replicateModelId: v.string(),
    modelParameters: v.optional(v.any()),
    requirements: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // If this is the new default model, unset the current default
    if (args.isDefault) {
      const currentDefault = await ctx.db
        .query("models")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .first();

      if (currentDefault) {
        await ctx.db.patch(currentDefault._id, {
          isDefault: false,
          updatedAt: now,
        });
      }
    }

    return await ctx.db.insert("models", {
      ...args,
      totalGenerations: 0,
      averageGenerationTime: undefined,
      successRate: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a model
export const updateModel = mutation({
  args: {
    modelId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    version: v.optional(v.string()),
    costPerSecond: v.optional(v.number()),
    supportedDurations: v.optional(v.array(v.number())),
    supportedQualities: v.optional(v.array(v.string())),
    maxDuration: v.optional(v.number()),
    fixedDuration: v.optional(v.number()),
    isPremium: v.optional(v.boolean()),
    isFast: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
    isDeprecated: v.optional(v.boolean()),
    provider: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    replicateModelId: v.optional(v.string()),
    modelParameters: v.optional(v.any()),
    requirements: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { modelId, ...updates } = args;

    const model = await ctx.db
      .query("models")
      .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
      .first();

    if (!model) {
      throw new Error("Model not found");
    }

    // If this is being set as the new default model, unset the current default
    if (updates.isDefault) {
      const currentDefault = await ctx.db
        .query("models")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .first();

      if (currentDefault && currentDefault._id !== model._id) {
        await ctx.db.patch(currentDefault._id, {
          isDefault: false,
          updatedAt: Date.now(),
        });
      }
    }

    // If deprecating, model is marked as deprecated
    // Note: deprecatedAt timestamp is tracked via updatedAt when isDeprecated becomes true

    await ctx.db.patch(model._id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return model._id;
  },
});

// Delete a model (soft delete by setting isActive to false)
export const deleteModel = mutation({
  args: { modelId: v.string() },
  handler: async (ctx, { modelId }) => {
    const model = await ctx.db
      .query("models")
      .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
      .first();

    if (!model) {
      throw new Error("Model not found");
    }

    // Soft delete by setting as inactive and deprecated
    await ctx.db.patch(model._id, {
      isActive: false,
      isDeprecated: true,
      updatedAt: Date.now(),
    });

    return model._id;
  },
});

// Initialize default models
export const initializeDefaultModels = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const defaultModels = [
      {
        modelId: "google/veo-3",
        name: "Google Veo-3",
        description:
          "High-quality video generation with exceptional visual fidelity",
        version: "1.0",
        costPerSecond: 0.75,
        supportedDurations: [8],
        supportedQualities: ["standard", "high", "ultra"],
        fixedDuration: 8,
        isPremium: true,
        isFast: false,
        isActive: true,
        isDefault: false,
        isDeprecated: false,
        provider: "Google",
        category: "premium",
        tags: ["high-quality", "professional", "premium"],
        replicateModelId: "google/veo-3",
        modelParameters: {
          quality: "high",
          aspect_ratio: "16:9",
        },
        requirements: {
          minCredits: 396,
          maxDuration: 8,
        },
        // Model-specific options
        supportedResolutions: ["720p", "1080p"],
        defaultResolution: "720p",
        supportsAudio: true,
      },
      {
        modelId: "luma/ray-2-720p",
        name: "Luma Ray-2-720p",
        description:
          "Fast, cost-effective video generation for content creators",
        version: "2.0",
        costPerSecond: 0.18,
        supportedDurations: [5, 9],
        supportedQualities: ["standard", "high", "ultra"],
        maxDuration: 9,
        isPremium: false,
        isFast: true,
        isActive: true,
        isDefault: false,
        isDeprecated: false,
        provider: "Luma",
        category: "budget",
        tags: ["fast", "cost-effective", "content-creation"],
        replicateModelId: "luma/ray-2-720p",
        modelParameters: {
          quality: "720p",
          aspect_ratio: "16:9",
        },
        requirements: {
          minCredits: 60,
          maxDuration: 9,
        },
        // Model-specific options
        supportedResolutions: ["720p"],
        defaultResolution: "720p",
        supportedAspectRatios: [
          "1:1",
          "3:4",
          "4:3",
          "9:16",
          "16:9",
          "9:21",
          "21:9",
        ],
        defaultAspectRatio: "16:9",
        supportsLoop: true,
        supportsCameraConcepts: true,
        cameraConcepts: [
          "pan_right",
          "pan_left",
          "zoom_in",
          "zoom_out",
          "aerial_drone",
          "truck_left",
          "truck_right",
          "low_angle",
          "high_angle",
        ],
        supportsStartEndImages: true,
      },
      {
        modelId: "luma/ray-flash-2-540p",
        name: "Luma Ray Flash 2-540p",
        description:
          "Ultra-fast, ultra-cheap video generation for rapid prototyping",
        version: "2.1",
        costPerSecond: 0.12,
        supportedDurations: [5, 9],
        supportedQualities: ["standard", "high", "ultra"],
        maxDuration: 9,
        isPremium: false,
        isFast: true,
        isActive: true,
        isDefault: true, // This is the default model
        isDeprecated: false,
        provider: "Luma",
        category: "budget",
        tags: ["ultra-fast", "ultra-cheap", "prototyping"],
        replicateModelId: "luma/ray-flash-2-540p",
        modelParameters: {
          quality: "540p",
          aspect_ratio: "16:9",
        },
        requirements: {
          minCredits: 40,
          maxDuration: 9,
        },
        // Model-specific options
        supportedResolutions: ["540p"],
        defaultResolution: "540p",
        supportedAspectRatios: [
          "1:1",
          "3:4",
          "4:3",
          "9:16",
          "16:9",
          "9:21",
          "21:9",
        ],
        defaultAspectRatio: "16:9",
        supportsLoop: true,
        supportsCameraConcepts: true,
        cameraConcepts: [
          "pan_right",
          "pan_left",
          "zoom_in",
          "zoom_out",
          "aerial_drone",
          "truck_left",
          "truck_right",
          "low_angle",
          "high_angle",
        ],
        supportsStartEndImages: true,
      },
    ];

    const modelIds = [];

    for (const model of defaultModels) {
      // Check if model already exists
      const existingModel = await ctx.db
        .query("models")
        .withIndex("by_model_id", (q) => q.eq("modelId", model.modelId))
        .first();

      if (!existingModel) {
        const modelId = await ctx.db.insert("models", {
          ...model,
          totalGenerations: 0,
          averageGenerationTime: undefined,
          successRate: undefined,
          createdAt: now,
          updatedAt: now,
        });
        modelIds.push(modelId);
      }
    }

    return modelIds;
  },
});

// Update model usage statistics
export const updateModelStats = mutation({
  args: {
    modelId: v.string(),
    generationTime: v.number(), // Generation time in seconds
    success: v.boolean(), // Whether generation was successful
  },
  handler: async (ctx, { modelId, generationTime, success }) => {
    const model = await ctx.db
      .query("models")
      .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
      .first();

    if (!model) {
      throw new Error("Model not found");
    }

    const currentTotal = model.totalGenerations || 0;
    const currentAvgTime = model.averageGenerationTime || 0;
    const currentSuccessRate = model.successRate || 100;

    // Calculate new statistics
    const newTotal = currentTotal + 1;
    const newAvgTime =
      currentTotal === 0
        ? generationTime
        : (currentAvgTime * currentTotal + generationTime) / newTotal;

    const currentSuccesses = Math.round(
      (currentSuccessRate * currentTotal) / 100
    );
    const newSuccesses = currentSuccesses + (success ? 1 : 0);
    const newSuccessRate = (newSuccesses / newTotal) * 100;

    await ctx.db.patch(model._id, {
      totalGenerations: newTotal,
      averageGenerationTime: newAvgTime,
      successRate: newSuccessRate,
      updatedAt: Date.now(),
    });

    return model._id;
  },
});

// Get model statistics
export const getModelStats = query({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db
      .query("models")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return models.map((model) => ({
      modelId: model.modelId,
      name: model.name,
      totalGenerations: model.totalGenerations || 0,
      averageGenerationTime: model.averageGenerationTime || 0,
      successRate: model.successRate || 100,
      costPerSecond: model.costPerSecond,
      isPremium: model.isPremium,
      isDefault: model.isDefault,
    }));
  },
});

// Check if model supports specific duration and quality
export const validateModelCapabilities = query({
  args: {
    modelId: v.string(),
    duration: v.number(),
    quality: v.string(),
  },
  handler: async (ctx, { modelId, duration, quality }) => {
    const model = await ctx.db
      .query("models")
      .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
      .first();

    if (!model || !model.isActive) {
      return { valid: false, reason: "Model not found or inactive" };
    }

    // Check duration support
    if (model.fixedDuration && duration !== model.fixedDuration) {
      return {
        valid: false,
        reason: `Model only supports ${model.fixedDuration} second duration`,
      };
    }

    if (!model.supportedDurations.includes(duration)) {
      return {
        valid: false,
        reason: `Duration ${duration}s not supported. Supported: ${model.supportedDurations.join(", ")}s`,
      };
    }

    // Check quality support
    if (!model.supportedQualities.includes(quality)) {
      return {
        valid: false,
        reason: `Quality '${quality}' not supported. Supported: ${model.supportedQualities.join(", ")}`,
      };
    }

    return { valid: true };
  },
});

