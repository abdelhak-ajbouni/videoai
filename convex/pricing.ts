import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";

// Helper function to calculate credit cost based on model and configuration
async function calculateCreditCost(
  ctx: QueryCtx,
  modelId: string,
  duration: number,
  resolution?: string
): Promise<number> {
  // Get business configuration from database
  const profitMargin = await ctx.db
    .query("configurations")
    .withIndex("by_key", (q) => q.eq("key", "profit_margin"))
    .first();

  const creditsPerDollar = await ctx.db
    .query("configurations")
    .withIndex("by_key", (q) => q.eq("key", "credits_per_dollar"))
    .first();

  // Get model from models table
  const model = await ctx.db
    .query("models")
    .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
    .first();

  if (!model || !model.isActive) {
    throw new Error(
      `Model "${modelId}" not found or inactive. Please select a valid model.`
    );
  }

  // Use default values if configurations not found
  const businessConfig = {
    profitMargin: (profitMargin?.value as number) || 1.32,
    creditsPerDollar: (creditsPerDollar?.value as number) || 50,
  };

  // Get resolution-specific cost if resolution is specified
  let costPerSecond = model.costPerSecond; // Default to model's base cost

  if (resolution) {
    const resolutionCost = await ctx.db
      .query("modelCosts")
      .withIndex("by_model_and_resolution", (q) =>
        q.eq("modelId", modelId).eq("resolution", resolution)
      )
      .first();

    if (resolutionCost && resolutionCost.isActive) {
      costPerSecond = resolutionCost.costPerSecond;
    } else {
      // Fallback to resolution multipliers if no specific cost found
      const resolutionMultipliers = await ctx.db
        .query("configurations")
        .withIndex("by_key", (q) => q.eq("key", "resolution_multipliers"))
        .first();

      const defaultResolutionMultipliers = {
        "480p": 1.0,
        "512p": 1.0,
        "720p": 1.2,
        "768p": 1.3,
        "1080p": 1.5,
      };

      const resolutionMultipliersConfig =
        (resolutionMultipliers?.value as Record<string, number>) ||
        defaultResolutionMultipliers;

      if (resolutionMultipliersConfig[resolution]) {
        costPerSecond =
          model.costPerSecond * resolutionMultipliersConfig[resolution];
      }
    }
  }

  // Calculate base cost
  const baseCostUSD = costPerSecond * duration;

  // Apply profit margin
  const totalCostUSD = baseCostUSD * businessConfig.profitMargin;

  // Convert to credits
  const credits = Math.ceil(totalCostUSD * businessConfig.creditsPerDollar);

  return credits;
}

// Convex query to calculate credit cost
export const getCreditCost = query({
  args: {
    modelId: v.string(),
    duration: v.number(),
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Return 0 if modelId is empty or undefined
    if (!args.modelId || args.modelId.trim() === "") {
      return 0;
    }

    return await calculateCreditCost(
      ctx,
      args.modelId,
      args.duration,
      args.resolution
    );
  },
});

export { calculateCreditCost };

// Query to get all resolution costs for a specific model
export const getmodelCosts = query({
  args: {
    modelId: v.string(),
  },
  handler: async (ctx, args) => {
    const resolutionCosts = await ctx.db
      .query("modelCosts")
      .withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return resolutionCosts;
  },
});

// Mutation to add or update resolution cost for a model
export const updateModelResolutionCost = mutation({
  args: {
    modelId: v.string(),
    resolution: v.string(),
    costPerSecond: v.number(),
    isActive: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if resolution cost already exists
    const existing = await ctx.db
      .query("modelCosts")
      .withIndex("by_model_and_resolution", (q) =>
        q.eq("modelId", args.modelId).eq("resolution", args.resolution)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        costPerSecond: args.costPerSecond,
        isActive: args.isActive,
        notes: args.notes,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new record
      return await ctx.db.insert("modelCosts", {
        modelId: args.modelId,
        resolution: args.resolution,
        costPerSecond: args.costPerSecond,
        isActive: args.isActive,
        notes: args.notes,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
