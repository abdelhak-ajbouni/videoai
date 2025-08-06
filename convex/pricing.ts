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

  let costPerSecond = 0;

  if (resolution) {
    // First try to get the specific resolution cost
    const resolutionCost = await ctx.db
      .query("modelCosts")
      .withIndex("by_model_and_resolution", (q) =>
        q.eq("modelId", modelId).eq("resolution", resolution)
      )
      .first();

    if (resolutionCost && resolutionCost.isActive) {
      costPerSecond = resolutionCost.costPerSecond;
    } else {
      // Fallback: get any available cost for this model and apply resolution multiplier
      const defaultCost = await ctx.db
        .query("modelCosts")
        .withIndex("by_model_and_resolution", (q) => q.eq("modelId", modelId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();

      if (!defaultCost) {
        throw new Error(
          `No pricing information found for model "${modelId}". Please contact support.`
        );
      }

      // Apply resolution multipliers if no specific cost found
      const resolutionMultipliers = await ctx.db
        .query("configurations")
        .withIndex("by_key", (q) => q.eq("key", "resolution_multipliers"))
        .first();

      const resolutionMultipliersConfig = resolutionMultipliers?.value;

      const multiplier = resolutionMultipliersConfig[resolution];
      costPerSecond = defaultCost.costPerSecond * multiplier;
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
