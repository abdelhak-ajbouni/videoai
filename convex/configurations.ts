import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get configuration by key
export const getConfig = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const config = await ctx.db
      .query("configurations")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    return config?.value;
  },
});

// Get all configurations by category
export const getConfigsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    return await ctx.db
      .query("configurations")
      .withIndex("by_category_and_active", (q) =>
        q.eq("category", category).eq("isActive", true)
      )
      .collect();
  },
});

// Get all active configurations
export const getAllConfigs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("configurations")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Update configuration
export const updateConfig = mutation({
  args: {
    key: v.string(),
    value: v.any(), // Use v.any() to match schema
  },
  handler: async (ctx, { key, value }) => {
    const config = await ctx.db
      .query("configurations")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (!config) {
      throw new Error(`Configuration with key '${key}' not found`);
    }

    if (!config.isEditable) {
      throw new Error(`Configuration '${key}' is not editable`);
    }

    await ctx.db.patch(config._id, {
      value,
      updatedAt: Date.now(),
    });

    return config._id;
  },
});

// Helper function to get model configuration
export const getModelConfig = query({
  args: { modelId: v.string() },
  handler: async (ctx, { modelId }) => {
    const configs = await ctx.db
      .query("configurations")
      .withIndex("by_key", (q) => q.eq("key", "model_configs"))
      .first();

    if (!configs || !configs.value || typeof configs.value !== "object") {
      throw new Error("Model configurations not found");
    }

    const modelConfigs = configs.value as Record<string, any>;
    return modelConfigs[modelId] || null;
  },
});

// Helper function to get all model configurations
export const getAllModelConfigs = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db
      .query("configurations")
      .withIndex("by_key", (q) => q.eq("key", "model_configs"))
      .first();

    if (!configs || !configs.value || typeof configs.value !== "object") {
      throw new Error("Model configurations not found");
    }

    return configs.value as Record<string, any>;
  },
});

// Helper function to get business configuration
export const getBusinessConfig = query({
  args: {},
  handler: async (ctx) => {
    const profitMargin = await ctx.db
      .query("configurations")
      .withIndex("by_key", (q) => q.eq("key", "profit_margin"))
      .first();

    const creditsPerDollar = await ctx.db
      .query("configurations")
      .withIndex("by_key", (q) => q.eq("key", "credits_per_dollar"))
      .first();

    const qualityMultipliers = await ctx.db
      .query("configurations")
      .withIndex("by_key", (q) => q.eq("key", "quality_multipliers"))
      .first();

    return {
      profitMargin: (profitMargin?.value as number) || 1.32,
      creditsPerDollar: (creditsPerDollar?.value as number) || 50,
      qualityMultipliers: (qualityMultipliers?.value as Record<
        string,
        number
      >) || {
        standard: 1.0,
        high: 1.2,
        ultra: 1.5,
      },
    };
  },
});
