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

// Initialize default configurations
export const initializeDefaultConfigs = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const defaultConfigs = [
      // Business Configuration
      {
        key: "profit_margin",
        category: "business",
        name: "Profit Margin",
        description: "Profit margin multiplier (e.g., 1.32 = 32% markup)",
        value: 1.32,
        dataType: "number",
        isActive: true,
        isEditable: true,
        minValue: 1.0,
        maxValue: 2.0,
      },
      {
        key: "credits_per_dollar",
        category: "business",
        name: "Credits Per Dollar",
        description: "Number of credits equivalent to $1 USD",
        value: 50,
        dataType: "number",
        isActive: true,
        isEditable: true,
        minValue: 1,
        maxValue: 1000,
      },
      {
        key: "free_tier_credits",
        category: "business",
        name: "Free Tier Credits",
        description: "Number of credits given to new users",
        value: 10,
        dataType: "number",
        isActive: true,
        isEditable: true,
        minValue: 0,
        maxValue: 1000,
      },

      // Quality Multipliers
      {
        key: "quality_multipliers",
        category: "pricing",
        name: "Quality Multipliers",
        description: "Cost multipliers for different quality tiers",
        value: {
          standard: 1.0,
          high: 1.2,
          ultra: 1.5,
        },
        dataType: "object",
        isActive: true,
        isEditable: true,
      },

      // Model Configurations
      {
        key: "model_configs",
        category: "models",
        name: "AI Model Configurations",
        description: "Configuration for all supported AI models",
        value: {
          "google/veo-3": {
            name: "Google Veo-3",
            description: "High-quality video generation",
            costPerSecond: 0.75,
            fixedDuration: 8,
            supportedDurations: [8],
            isPremium: true,
            isDefault: false,
          },
          "luma/ray-2-720p": {
            name: "Luma Ray-2-720p",
            description: "Fast, cost-effective video generation",
            costPerSecond: 0.18,
            supportedDurations: [5, 9],
            isPremium: false,
            isDefault: false,
          },
          "luma/ray-flash-2-540p": {
            name: "Luma Ray Flash 2-540p",
            description: "Ultra-fast, ultra-cheap video generation",
            costPerSecond: 0.12,
            supportedDurations: [5, 9],
            isPremium: false,
            isDefault: true,
          },
        },
        dataType: "object",
        isActive: true,
        isEditable: true,
      },

      // Feature Flags
      {
        key: "enable_ultra_quality",
        category: "features",
        name: "Enable Ultra Quality",
        description: "Whether ultra quality tier is available",
        value: true,
        dataType: "boolean",
        isActive: true,
        isEditable: true,
      },
      {
        key: "enable_priority_processing",
        category: "features",
        name: "Enable Priority Processing",
        description:
          "Whether priority processing is available for Pro/Business users",
        value: true,
        dataType: "boolean",
        isActive: true,
        isEditable: true,
      },
      {
        key: "enable_api_access",
        category: "features",
        name: "Enable API Access",
        description: "Whether API access is available for Business users",
        value: true,
        dataType: "boolean",
        isActive: true,
        isEditable: true,
      },

      // System Limits
      {
        key: "max_prompt_length",
        category: "limits",
        name: "Maximum Prompt Length",
        description: "Maximum number of characters allowed in video prompts",
        value: 500,
        dataType: "number",
        isActive: true,
        isEditable: true,
        minValue: 100,
        maxValue: 2000,
      },
      {
        key: "max_concurrent_generations",
        category: "limits",
        name: "Maximum Concurrent Generations",
        description:
          "Maximum number of videos a user can generate simultaneously",
        value: 3,
        dataType: "number",
        isActive: true,
        isEditable: true,
        minValue: 1,
        maxValue: 10,
      },
      {
        key: "max_video_duration",
        category: "limits",
        name: "Maximum Video Duration",
        description: "Maximum video duration in seconds",
        value: 60,
        dataType: "number",
        isActive: true,
        isEditable: true,
        minValue: 5,
        maxValue: 120,
      },

      // Subscription Quality Access
      {
        key: "subscription_quality_access",
        category: "subscriptions",
        name: "Subscription Quality Access",
        description: "Quality tiers available for each subscription level",
        value: {
          free: ["standard"],
          starter: ["standard", "high"],
          pro: ["standard", "high", "ultra"],
          business: ["standard", "high", "ultra"],
        },
        dataType: "object",
        isActive: true,
        isEditable: true,
      },
    ];

    const configIds = [];

    for (const config of defaultConfigs) {
      // Check if config already exists
      const existingConfig = await ctx.db
        .query("configurations")
        .withIndex("by_key", (q) => q.eq("key", config.key))
        .first();

      if (!existingConfig) {
        const configId = await ctx.db.insert("configurations", {
          ...config,
          createdAt: now,
          updatedAt: now,
        });
        configIds.push(configId);
      }
    }

    return configIds;
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
