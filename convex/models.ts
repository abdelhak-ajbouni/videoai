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
    const models = await ctx.db
      .query("models")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    return models.filter(model => model.isPremium);
  },
});

// Create a new model
export const createModel = mutation({
  args: {
    modelId: v.string(),
    name: v.string(),
    description: v.string(),
    replicateModelId: v.string(),
    costPerSecond: v.number(),
    supportedDurations: v.array(v.number()),
    fixedDuration: v.optional(v.number()),
    
    // UI capabilities
    supportedResolutions: v.optional(v.array(v.string())),
    supportedAspectRatios: v.optional(v.array(v.string())),
    supportedCameraConcepts: v.optional(v.array(v.string())),
    supportsLoop: v.optional(v.boolean()),
    defaultResolution: v.optional(v.string()),
    defaultAspectRatio: v.optional(v.string()),
    defaultCameraConcept: v.optional(v.string()),
    defaultLoop: v.optional(v.boolean()),
    parameterMappings: v.optional(v.any()),
    modelType: v.string(),
    apiProvider: v.string(),
    
    isActive: v.boolean(),
    isDefault: v.boolean(),
    isPremium: v.boolean(),
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
    replicateModelId: v.optional(v.string()),
    costPerSecond: v.optional(v.number()),
    supportedDurations: v.optional(v.array(v.number())),
    fixedDuration: v.optional(v.number()),
    
    // UI capabilities
    supportedResolutions: v.optional(v.array(v.string())),
    supportedAspectRatios: v.optional(v.array(v.string())),
    supportedCameraConcepts: v.optional(v.array(v.string())),
    supportsLoop: v.optional(v.boolean()),
    defaultResolution: v.optional(v.string()),
    defaultAspectRatio: v.optional(v.string()),
    defaultCameraConcept: v.optional(v.string()),
    defaultLoop: v.optional(v.boolean()),
    parameterMappings: v.optional(v.any()),
    modelType: v.optional(v.string()),
    apiProvider: v.optional(v.string()),
    
    isActive: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
    isPremium: v.optional(v.boolean()),
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

    // Soft delete by setting as inactive
    await ctx.db.patch(model._id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return model._id;
  },
});

// Check if model supports specific duration
export const validateModelCapabilities = query({
  args: {
    modelId: v.string(),
    duration: v.number(),
  },
  handler: async (ctx, { modelId, duration }) => {
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

    return { valid: true };
  },
});

// Check if a model supports a specific parameter (now part of models table)
export const doesModelSupportParameter = query({
  args: { 
    modelId: v.string(),
    parameter: v.string(), // "resolution", "aspectRatio", "cameraConcept", "loop"
  },
  handler: async (ctx, { modelId, parameter }) => {
    const model = await ctx.db
      .query("models")
      .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
      .first();

    if (!model) return false;

    switch (parameter) {
      case "resolution":
        return model.supportedResolutions !== undefined && model.supportedResolutions!.length > 0;
      case "aspectRatio":
        return model.supportedAspectRatios !== undefined && model.supportedAspectRatios!.length > 0;
      case "cameraConcept":
        return model.supportedCameraConcepts !== undefined && model.supportedCameraConcepts!.length > 0;
      case "loop":
        return model.supportsLoop === true;
      default:
        return false;
    }
  },
});

// Get models by model type (e.g., all "luma_ray" models)
export const getModelsByType = query({
  args: { modelType: v.string() },
  handler: async (ctx, { modelType }) => {
    return await ctx.db
      .query("models")
      .filter((q) => q.and(
        q.eq(q.field("isActive"), true),
        q.eq(q.field("modelType"), modelType)
      ))
      .collect();
  },
});