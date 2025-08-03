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
      .withIndex("by_active_premium", (q) =>
        q.eq("isActive", true).eq("isPremium", true)
      )
      .collect();
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
    fixedDuration: v.optional(v.number()),
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
    fixedDuration: v.optional(v.number()),
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

// Note: Model validation logic has been moved to modelParameters table
// Use modelParameterHelpers.ts functions for parameter validation

// Note: Parameter support checking has been moved to modelParameters table
// Use modelParameterHelpers.ts functions for parameter support checks

// Get models by model type (e.g., all "luma_ray" models)
export const getModelsByType = query({
  args: { modelType: v.string() },
  handler: async (ctx, { modelType }) => {
    return await ctx.db
      .query("models")
      .withIndex("by_active_type", (q) =>
        q.eq("isActive", true).eq("modelType", modelType)
      )
      .collect();
  },
});
