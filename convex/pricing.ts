import { v } from "convex/values";
import { query } from "./_generated/server";

// Helper function to calculate credit cost based on model and configuration
async function calculateCreditCost(
  ctx: any,
  modelId: string,
  quality: "standard" | "high" | "ultra",
  duration: number
): Promise<number> {
  // Get business configuration from database
  const profitMargin = await ctx.db
    .query("configurations")
    .withIndex("by_key", (q: any) => q.eq("key", "profit_margin"))
    .first();

  const creditsPerDollar = await ctx.db
    .query("configurations")
    .withIndex("by_key", (q: any) => q.eq("key", "credits_per_dollar"))
    .first();

  const qualityMultipliers = await ctx.db
    .query("configurations")
    .withIndex("by_key", (q: any) => q.eq("key", "quality_multipliers"))
    .first();

  // Get model from models table
  const model = await ctx.db
    .query("models")
    .withIndex("by_model_id", (q: any) => q.eq("modelId", modelId))
    .first();

  if (!model || !model.isActive) {
    throw new Error(`Model "${modelId}" not found or inactive. Please select a valid model.`);
  }

  // Use default values if configurations not found
  const businessConfig = {
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

  // Calculate base cost
  const baseCostUSD = model.costPerSecond * duration;

  // Apply quality multiplier and profit margin
  const totalCostUSD =
    baseCostUSD *
    businessConfig.qualityMultipliers[quality] *
    businessConfig.profitMargin;

  // Convert to credits
  const credits = Math.ceil(totalCostUSD * businessConfig.creditsPerDollar);

  return credits;
}

// Convex query to calculate credit cost
export const getCreditCost = query({
  args: {
    modelId: v.string(),
    quality: v.union(
      v.literal("standard"),
      v.literal("high"),
      v.literal("ultra")
    ),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    // Return 0 if modelId is empty or undefined
    if (!args.modelId || args.modelId.trim() === "") {
      return 0;
    }
    
    return await calculateCreditCost(
      ctx,
      args.modelId,
      args.quality,
      args.duration
    );
  },
});

// Convex query to get pricing matrix for all active models
export const getPricingMatrix = query({
  args: {},
  handler: async (ctx) => {
    // Get all active models
    const models = await ctx.db
      .query("models")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const qualities = ["standard", "high", "ultra"] as const;
    const matrix: Record<string, Record<string, Record<number, number>>> = {};

    for (const model of models) {
      matrix[model.modelId] = {};
      for (const quality of qualities) {
        matrix[model.modelId][quality] = {};
        for (const duration of model.supportedDurations) {
          matrix[model.modelId][quality][duration] = await calculateCreditCost(
            ctx,
            model.modelId,
            quality,
            duration
          );
        }
      }
    }

    return matrix;
  },
});

// Convex query to get model information (now from models table)
export const getModelInfo = query({
  args: {},
  handler: async (ctx) => {
    const models = await ctx.db
      .query("models")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Transform to match the expected format
    const modelInfo: Record<string, any> = {};

    for (const model of models) {
      modelInfo[model.modelId] = {
        name: model.name,
        description: model.description,
        costPerSecond: model.costPerSecond,
        fixedDuration: model.fixedDuration,
        supportedDurations: model.supportedDurations,
        isPremium: model.isPremium,
        isDefault: model.isDefault,
      };
    }

    return modelInfo;
  },
});

// Get available models for a specific duration and quality
export const getAvailableModels = query({
  args: {
    duration: v.number(),
    quality: v.union(
      v.literal("standard"),
      v.literal("high"),
      v.literal("ultra")
    ),
  },
  handler: async (ctx, { duration, quality }) => {
    const models = await ctx.db
      .query("models")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return models.filter((model) => {
      // Check if model supports the requested duration
      if (model.fixedDuration && duration !== model.fixedDuration) {
        return false;
      }

      if (!model.supportedDurations.includes(duration)) {
        return false;
      }

      // Quality validation removed since we simplified the model schema
      // All models now support all quality levels (pricing handled via quality multipliers)
      return true;
    });
  },
});

// Get model pricing comparison
export const getModelPricingComparison = query({
  args: {
    duration: v.number(),
    quality: v.union(
      v.literal("standard"),
      v.literal("high"),
      v.literal("ultra")
    ),
  },
  handler: async (ctx, { duration, quality }) => {
    // Get available models directly instead of calling another query
    const models = await ctx.db
      .query("models")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const availableModels = models.filter((model: any) => {
      // Check if model supports the requested duration
      if (model.fixedDuration && duration !== model.fixedDuration) {
        return false;
      }

      if (!model.supportedDurations.includes(duration)) {
        return false;
      }

      // Quality validation removed since we simplified the model schema
      // All models now support all quality levels (pricing handled via quality multipliers)
      return true;
    });

    const comparison = await Promise.all(
      availableModels.map(async (model: any) => {
        const cost = await calculateCreditCost(
          ctx,
          model.modelId,
          quality,
          duration
        );
        return {
          modelId: model.modelId,
          name: model.name,
          description: model.description,
          costPerSecond: model.costPerSecond,
          totalCost: cost,
          isPremium: model.isPremium,
          isDefault: model.isDefault,
        };
      })
    );

    // Sort by cost (cheapest first)
    return comparison.sort((a: any, b: any) => a.totalCost - b.totalCost);
  },
});

// Export the helper function for use in other Convex files
export { calculateCreditCost };
